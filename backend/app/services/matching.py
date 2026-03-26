"""Matching Engine - cosine similarity + LLM reranker for candidate-job matching."""

import json
import re
from typing import List, Optional

from openai import OpenAI

from app.config import get_settings
from app.services.embedding import cosine_similarity

settings = get_settings()

SUPPORTED_OUTPUT_LANGUAGES = {"th", "en"}
THAI_CHAR_RE = re.compile(r"[\u0E00-\u0E7F]")


def _normalize_output_language(output_language: Optional[str]) -> str:
    if not output_language:
        return "th"
    lang = output_language.strip().lower()
    return lang if lang in SUPPORTED_OUTPUT_LANGUAGES else "th"


def _output_language_instruction(output_language: str) -> str:
    if output_language == "en":
        return (
            "Output language: English.\n"
            "MANDATORY: All narrative fields in the JSON response MUST be in English.\n"
            "Do not write full Thai sentences in narrative fields."
        )
    return (
        "Output language: Thai.\n"
        "MANDATORY: All narrative fields in the JSON response MUST be in Thai.\n"
        "Do not write full English sentences in narrative fields.\n"
        "Keep technical terms (e.g., SQL, Python, Power BI) in English when appropriate."
    )


def _contains_thai(text: str) -> bool:
    return bool(text and THAI_CHAR_RE.search(text))


def _iter_narrative_texts(result: dict) -> List[str]:
    texts: List[str] = []

    root_keys = (
        "reasoning",
        "skills_match",
        "experience_match",
        "project_relevance",
        "analysis",
        "recommendation_reasoning",
    )
    for key in root_keys:
        value = result.get(key)
        if isinstance(value, str) and value.strip():
            texts.append(value)

    candidates = result.get("candidates")
    if isinstance(candidates, list):
        for cand in candidates:
            if not isinstance(cand, dict):
                continue

            summary = cand.get("project_relevance_summary")
            if isinstance(summary, str) and summary.strip():
                texts.append(summary)

            for list_key in ("strengths", "gaps"):
                items = cand.get(list_key)
                if not isinstance(items, list):
                    continue
                for item in items:
                    if isinstance(item, str) and item.strip():
                        texts.append(item)

    return texts


def _is_language_compliant(result: dict, target_language: str) -> bool:
    texts = _iter_narrative_texts(result)
    if not texts:
        return True

    if target_language == "th":
        thai_count = sum(1 for text in texts if _contains_thai(text))
        # Require the majority of narrative fields to contain Thai characters.
        return thai_count >= max(1, int(len(texts) * 0.7))

    return True


def _translate_result_language(
    client: OpenAI,
    result: dict,
    target_language: str,
) -> dict:
    language_name = "Thai" if target_language == "th" else "English"
    prompt = f"""You are a strict JSON translation assistant.

Translate the narrative text values in this JSON to {language_name}.
Rules:
1. Keep JSON object structure and keys exactly the same.
2. Keep IDs, numbers, scores, and null/boolean values unchanged.
3. Translate narrative string values only.
4. Keep proper nouns, person names, and technical terms when needed.
5. Return ONLY valid JSON.

JSON:
{json.dumps(result, ensure_ascii=False)}
"""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0,
        response_format={"type": "json_object"},
    )

    return json.loads(response.choices[0].message.content)


def _enforce_output_language(
    client: OpenAI,
    result: dict,
    target_language: str,
) -> dict:
    if _is_language_compliant(result, target_language):
        return result

    try:
        translated = _translate_result_language(client, result, target_language)
        if isinstance(translated, dict):
            return translated
    except Exception:
        # Fallback to original response if translation step fails.
        pass

    return result


def compute_match_score(candidate_embedding: List[float], job_embedding: List[float]) -> float:
    """Compute raw similarity score between candidate and job embeddings."""
    similarity = cosine_similarity(candidate_embedding, job_embedding)
    # Convert to 0-100 scale
    return round(max(0, min(100, similarity * 100)), 2)


def _build_candidate_profile_text(candidate_data: dict) -> str:
    """Build a detailed, bias-free candidate profile string for prompts."""
    parts = []

    if candidate_data.get("summary"):
        parts.append(f"Professional Summary: {candidate_data['summary']}")

    if candidate_data.get("experience_years"):
        parts.append(f"Total Experience: {candidate_data['experience_years']} years")

    skills = candidate_data.get("skills", [])
    if skills:
        if isinstance(skills, list):
            skills = ", ".join(skills)
        parts.append(f"Technical & Professional Skills: {skills}")

    certs = candidate_data.get("certifications", [])
    if certs:
        if isinstance(certs, list):
            certs = ", ".join(certs)
        parts.append(f"Certifications: {certs}")

    for exp in candidate_data.get("experience", []):
        if isinstance(exp, dict):
            parts.append(
                f"Work Experience: {exp.get('title', '')} at {exp.get('company', '[Company]')} "
                f"({exp.get('duration', '')})\n  Responsibilities: {exp.get('description', '')[:400]}"
            )

    projects = candidate_data.get("projects", [])
    for proj in projects:
        if isinstance(proj, dict):
            techs = proj.get("technologies", [])
            if isinstance(techs, list):
                techs = ", ".join(techs)
            parts.append(
                f"Project: \"{proj.get('name', '')}\" | Role: {proj.get('role', '')} | "
                f"Technologies: {techs}\n"
                f"  Description: {proj.get('description', '')[:400]}\n"
                f"  Domain: {proj.get('relevance_hint', 'N/A')}"
            )

    for edu in candidate_data.get("education", []):
        if isinstance(edu, dict):
            parts.append(
                f"Education: {edu.get('degree', '')} in {edu.get('field', '')}"
                + (f" ({edu.get('year', '')})" if edu.get("year") else "")
            )

    langs = candidate_data.get("languages", [])
    if langs:
        parts.append(f"Languages: {', '.join(langs) if isinstance(langs, list) else langs}")

    return "\n".join(parts)


ANTI_BIAS_INSTRUCTION = """
IMPORTANT - Fair Hiring Guardrails:
- Evaluate STRICTLY on professional skills, experience quality, and project relevance to the job.
- DO NOT factor in: university prestige, company prestige, gender inference, age, nationality, ethnicity, race, religion, or any other demographic indicator.
- If any such information appears, disregard it entirely.
- Base ALL scores and recommendations purely on merit, competency, and job-fit.
"""


def rerank_with_llm(
    candidate_data: dict,
    job_data: dict,
    initial_score: float,
    output_language: Optional[str] = "th",
) -> dict:
    """Use LLM to provide detailed match analysis and refined score with project evaluation."""
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    target_language = _normalize_output_language(output_language)

    candidate_profile_text = _build_candidate_profile_text(candidate_data)

    prompt = f"""You are an expert, fair-minded HR recruiter.
{ANTI_BIAS_INSTRUCTION}
{_output_language_instruction(target_language)}

Analyze how well this candidate matches the job position below. Pay special attention to:
1. How their TECHNICAL SKILLS align with job requirements.
2. Whether their WORK EXPERIENCE (titles, duration, responsibilities) is relevant.
3. Whether their PAST PROJECTS demonstrate practical application of skills required for this job.
4. Any skill GAPS that could be a concern.

Job Title: {job_data.get('title', 'N/A')}
Job Description: {job_data.get('description', 'N/A')[:2000]}
Job Requirements: {job_data.get('requirements', 'N/A')[:1000]}

Candidate Profile (de-identified):
{candidate_profile_text}

Initial similarity score (from vector embedding): {initial_score}/100

Provide a DETAILED and STRUCTURED analysis. Return a JSON object with:
- "score": refined match score (0-100), must be well-reasoned based on all factors above
- "reasoning": a 3-5 sentence detailed explanation of the overall match quality
- "skills_match": 2-3 sentences specifically on how their skills align or don't align
- "experience_match": 2-3 sentences on how their work experience is or isn't relevant
- "project_relevance": 2-3 sentences specifically analyzing how their past projects relate to this job role. Mention specific projects by name if applicable.
- "strengths": list of 3-5 specific strengths relative to this job (be concrete, reference actual skills/projects)
- "gaps": list of specific areas where the candidate may fall short (be concrete)
- "recommendation": one of "Strong Match", "Good Match", "Moderate Match", "Weak Match"

Return ONLY valid JSON."""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    result = json.loads(response.choices[0].message.content)
    result = _enforce_output_language(client, result, target_language)
    return result


def match_candidate_to_job(
    candidate_embedding: List[float],
    job_embedding: List[float],
    candidate_data: dict,
    job_data: dict,
    output_language: Optional[str] = "th",
) -> dict:
    """Full matching pipeline: embedding similarity + LLM reranking."""
    # Step 1: Compute embedding similarity
    initial_score = compute_match_score(candidate_embedding, job_embedding)

    # Step 2: LLM reranking for detailed analysis
    match_result = rerank_with_llm(
        candidate_data,
        job_data,
        initial_score,
        output_language=output_language,
    )

    return {
        "initial_score": initial_score,
        "final_score": match_result.get("score", initial_score),
        "reasoning": match_result.get("reasoning", ""),
        "skills_match": match_result.get("skills_match", ""),
        "experience_match": match_result.get("experience_match", ""),
        "project_relevance": match_result.get("project_relevance", ""),
        "strengths": match_result.get("strengths", []),
        "gaps": match_result.get("gaps", []),
        "recommendation": match_result.get("recommendation", ""),
    }


def compare_candidates_with_llm(
    candidates_data: List[dict],
    job_data: dict,
    output_language: Optional[str] = "th",
) -> dict:
    """Use LLM to do a deep, fair comparison of multiple candidates against a job."""
    client = OpenAI(api_key=settings.OPENAI_API_KEY)
    target_language = _normalize_output_language(output_language)

    profiles_text = []
    for cand in candidates_data:
        profile = cand.get("profile", {})
        app_id = cand.get("application_id", "Unknown")
        cand_id = cand.get("candidate_id", "Unknown")
        name = cand.get("name", "Unknown")

        header = f"--- Candidate (Application ID: {app_id}, Candidate ID: {cand_id}, Name: {name}) ---"
        profile_text = _build_candidate_profile_text(profile)
        profiles_text.append(f"{header}\n{profile_text}")

    prompt = f"""You are an expert, fair-minded HR recruiter comparing multiple candidates for the same job.
{ANTI_BIAS_INSTRUCTION}
{_output_language_instruction(target_language)}

Pay special attention to:
1. How each candidate's TECHNICAL SKILLS align with the job.
2. Relevance of WORK EXPERIENCE (roles, responsibilities, seniority).
3. Relevance of PAST PROJECTS - do they demonstrate hands-on work in the relevant domain?
4. Who is the best overall fit and WHY.

Job Title: {job_data.get('title', 'N/A')}
Job Description: {job_data.get('description', 'N/A')[:2000]}
Job Requirements: {job_data.get('requirements', 'N/A')[:1000]}

Candidates:
{chr(10).join(profiles_text)}

Provide a detailed comparative analysis. Return a JSON object with:
- "candidates": A list of objects for EACH candidate containing:
    - "application_id": The application_id from the input (integer)
    - "candidate_id": The candidate_id from the input (integer)
    - "candidate_name": Name of the candidate
    - "match_score": estimated overall match score for this candidate (0-100)
    - "strengths": List of 3-5 concrete strengths specific to this job
    - "gaps": List of specific gaps or concerns for this job
    - "project_relevance_summary": 1-2 sentences specifically on how their projects relate to this role
- "analysis": A detailed 3-5 paragraph comparative analysis explaining:
    * How candidates compare in terms of skills
    * How their experience backgrounds differ
    * A deep comparison of their projects and real-world applicability to this role
    * Which aspects of the job each candidate is better/worse suited for
- "recommended_application_id": The application_id of the best overall candidate (integer)
- "recommendation_reasoning": 2-3 sentences explaining specifically WHY this candidate is recommended over the others

Return ONLY valid JSON."""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    result = json.loads(response.choices[0].message.content)
    result = _enforce_output_language(client, result, target_language)
    return result
