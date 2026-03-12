"""Resume parser service — extracts data from PDF/DOCX and de-identifies."""

import json
import os
import re
from typing import Optional
from openai import OpenAI
from app.config import get_settings

settings = get_settings()


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text content from a PDF file."""
    import pdfplumber

    text_parts = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text_parts.append(page_text)
    return "\n".join(text_parts)


def extract_text_from_docx(file_path: str) -> str:
    """Extract text content from a DOCX file."""
    from docx import Document

    doc = Document(file_path)
    paragraphs = [p.text for p in doc.paragraphs if p.text.strip()]
    return "\n".join(paragraphs)


def extract_text(file_path: str) -> str:
    """Extract text from a resume file (PDF or DOCX)."""
    ext = os.path.splitext(file_path)[1].lower()
    if ext == ".pdf":
        return extract_text_from_pdf(file_path)
    elif ext in (".docx", ".doc"):
        return extract_text_from_docx(file_path)
    else:
        raise ValueError(f"Unsupported file format: {ext}")


def parse_resume_with_llm(text: str) -> dict:
    """Use LLM to extract structured, bias-free data from resume text."""
    client = OpenAI(api_key=settings.OPENAI_API_KEY)

    prompt = f"""Analyze the following resume text and extract structured information.
You MUST follow these strict rules:
- DO NOT include or infer: gender, age, religion, nationality, ethnicity, race, skin color, physical appearance, marital status, or any other demographic attribute.
- DO NOT include photo descriptions or any inferred characteristics about looks.
- Focus ONLY on professional competencies: skills, experience, projects, and education credentials (NOT institution names).

Return a JSON object with these fields:
- "name": full name (will be redacted later, include as-is)
- "email": email address (will be redacted later)
- "phone": phone number (will be redacted later)
- "skills": comprehensive list of ALL technical skills, frameworks, programming languages, tools, methodologies, and certifications mentioned.
- "experience": list of work experiences, each with:
    - "title": job title
    - "company": company name
    - "duration": time period (e.g. "Jan 2022 - Dec 2023")
    - "description": detailed description of responsibilities and achievements
- "projects": list of personal or professional projects, each with:
    - "name": project name or title
    - "role": the candidate's role in the project
    - "technologies": list of technologies, languages, frameworks used
    - "description": detailed description of what the project does and what the candidate built/achieved
    - "relevance_hint": a short note on what domain/industry this project belongs to (e.g. "web e-commerce", "data pipeline", "mobile banking")
- "education": list of education entries, each with:
    - "degree": degree type (e.g. Bachelor's, Master's)
    - "field": field of study (e.g. Computer Science, Engineering)
    - "year": graduation year or study period
    (DO NOT include institution/university name — omit the "institution" key entirely)
- "languages": list of spoken languages
- "summary": a 2-3 sentence professional summary focusing ONLY on skills and career trajectory, with no demographic details.
- "experience_years": estimated total years of professional experience (number)
- "certifications": list of any certifications or licenses mentioned

If a field is not found, use null for strings/numbers or empty list for arrays.

Resume text:
{text[:8000]}

Return ONLY valid JSON, no other text."""

    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.1,
        response_format={"type": "json_object"},
    )

    result = json.loads(response.choices[0].message.content)
    return result


def de_identify(parsed_data: dict) -> dict:
    """Remove PII and bias-inducing fields from parsed resume data."""
    de_identified = parsed_data.copy()

    # Redact direct PII
    de_identified["name"] = "[REDACTED]"
    de_identified["email"] = "[REDACTED]"
    de_identified["phone"] = "[REDACTED]"

    # Remove institution names from education to prevent prestige bias
    education = de_identified.get("education", [])
    if isinstance(education, list):
        cleaned_education = []
        for edu in education:
            if isinstance(edu, dict):
                edu_copy = edu.copy()
                edu_copy.pop("institution", None)  # Remove university name
                cleaned_education.append(edu_copy)
        de_identified["education"] = cleaned_education

    # Remove company names from experience to prevent company prestige bias
    # We keep the description and title to preserve relevant experience info
    experience = de_identified.get("experience", [])
    if isinstance(experience, list):
        cleaned_experience = []
        for exp in experience:
            if isinstance(exp, dict):
                exp_copy = exp.copy()
                exp_copy["company"] = "[Company]"
                cleaned_experience.append(exp_copy)
        de_identified["experience"] = cleaned_experience

    # Remove project-specific company/institution references
    projects = de_identified.get("projects", [])
    if isinstance(projects, list):
        cleaned_projects = []
        for proj in projects:
            if isinstance(proj, dict):
                cleaned_projects.append(proj)
        de_identified["projects"] = cleaned_projects

    return de_identified


def create_embedding_text(de_identified_data: dict) -> str:
    """Create a rich text representation from de-identified data for embedding."""
    parts = []

    if de_identified_data.get("summary"):
        parts.append(f"Summary: {de_identified_data['summary']}")

    skills = de_identified_data.get("skills", [])
    if skills:
        parts.append(f"Skills: {', '.join(skills) if isinstance(skills, list) else skills}")

    certifications = de_identified_data.get("certifications", [])
    if certifications:
        parts.append(f"Certifications: {', '.join(certifications) if isinstance(certifications, list) else certifications}")

    if de_identified_data.get("experience_years"):
        parts.append(f"Total Experience: {de_identified_data['experience_years']} years")

    for exp in de_identified_data.get("experience", []):
        if isinstance(exp, dict):
            parts.append(
                f"Experience: {exp.get('title', '')} - {exp.get('description', '')[:300]}"
            )

    for proj in de_identified_data.get("projects", []):
        if isinstance(proj, dict):
            techs = proj.get("technologies", [])
            if isinstance(techs, list):
                techs = ", ".join(techs)
            parts.append(
                f"Project: {proj.get('name', '')} ({proj.get('role', '')}) - "
                f"Technologies: {techs}. "
                f"{proj.get('description', '')[:300]}"
            )

    for edu in de_identified_data.get("education", []):
        if isinstance(edu, dict):
            parts.append(
                f"Education: {edu.get('degree', '')} in {edu.get('field', '')}"
            )

    return "\n".join(parts)


def process_resume(file_path: str) -> dict:
    """Full pipeline: extract text → parse with LLM → de-identify → prepare for embedding."""
    raw_text = extract_text(file_path)
    parsed_data = parse_resume_with_llm(raw_text)
    de_identified_data = de_identify(parsed_data)
    embedding_text = create_embedding_text(de_identified_data)

    return {
        "parsed_data": parsed_data,
        "de_identified_data": de_identified_data,
        "embedding_text": embedding_text,
        "raw_text_length": len(raw_text),
    }
