"""Utilities to build runtime chatbot context from live database data."""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.candidate import Application, Candidate
from app.models.job import Job, JobStatus
from app.models.user import User, UserRole


def _status_key(value: Any) -> str:
    """Normalize enum / scalar status values to plain strings."""
    if hasattr(value, "value"):
        return str(value.value)
    return str(value)


def _rows_to_count_map(rows: list[tuple[Any, int]]) -> Dict[str, int]:
    return {_status_key(status): int(count) for status, count in rows}


def _active_jobs_snapshot(db: Session, limit: int = 20) -> list[Dict[str, Any]]:
    rows = (
        db.query(Job.id, Job.title, Job.department, Job.location)
        .filter(Job.status == JobStatus.ACTIVE)
        .order_by(Job.created_at.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "id": int(job_id),
            "title": title,
            "department": department,
            "location": location,
        }
        for job_id, title, department, location in rows
    ]


def _admin_summary(db: Session) -> Dict[str, Any]:
    candidate_count = int(db.query(func.count(Candidate.id)).scalar() or 0)
    application_count = int(db.query(func.count(Application.id)).scalar() or 0)

    job_rows = (
        db.query(Job.status, func.count(Job.id))
        .group_by(Job.status)
        .all()
    )
    jobs_by_status = _rows_to_count_map(job_rows)
    active_job_count = jobs_by_status.get(JobStatus.ACTIVE.value, 0)

    app_rows = (
        db.query(Application.status, func.count(Application.id))
        .group_by(Application.status)
        .all()
    )
    applications_by_status = _rows_to_count_map(app_rows)

    avg_match_score_raw = db.query(func.avg(Application.match_score)).scalar()
    avg_match_score = round(float(avg_match_score_raw), 2) if avg_match_score_raw is not None else None

    return {
        "scope": "admin_global",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "candidate_count": candidate_count,
        "application_count": application_count,
        "active_job_count": active_job_count,
        "active_jobs": _active_jobs_snapshot(db),
        "jobs_by_status": jobs_by_status,
        "applications_by_status": applications_by_status,
        "average_match_score": avg_match_score,
    }


def _applicant_summary(db: Session, current_user: User) -> Dict[str, Any]:
    candidate = db.query(Candidate).filter(Candidate.user_id == current_user.id).first()
    active_job_count = int(
        db.query(func.count(Job.id))
        .filter(Job.status == JobStatus.ACTIVE)
        .scalar()
        or 0
    )

    if not candidate:
        return {
            "scope": "applicant_personal",
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "active_job_count": active_job_count,
            "active_jobs": _active_jobs_snapshot(db),
            "has_candidate_profile": False,
            "my_application_count": 0,
            "my_applications_by_status": {},
        }

    my_application_count = int(
        db.query(func.count(Application.id))
        .filter(Application.candidate_id == candidate.id)
        .scalar()
        or 0
    )
    my_app_rows = (
        db.query(Application.status, func.count(Application.id))
        .filter(Application.candidate_id == candidate.id)
        .group_by(Application.status)
        .all()
    )

    return {
        "scope": "applicant_personal",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "active_job_count": active_job_count,
        "active_jobs": _active_jobs_snapshot(db),
        "has_candidate_profile": True,
        "my_application_count": my_application_count,
        "my_applications_by_status": _rows_to_count_map(my_app_rows),
    }


def get_chatbot_context_summary(db: Session, current_user: User) -> Dict[str, Any]:
    """Return a safe, role-aware summary for chatbot grounding."""
    role_value = current_user.role.value if isinstance(current_user.role, UserRole) else str(current_user.role)
    if role_value == UserRole.ADMIN.value:
        return _admin_summary(db)
    return _applicant_summary(db, current_user)


def build_chatbot_context_text(summary: Dict[str, Any]) -> str:
    """Convert structured summary into compact text for LLM context."""
    lines = [
        "System runtime data (use this as source of truth for counts):",
        f"- Scope: {summary.get('scope')}",
        f"- Generated at (UTC): {summary.get('generated_at')}",
    ]

    for key in (
        "candidate_count",
        "application_count",
        "active_job_count",
        "average_match_score",
        "has_candidate_profile",
        "my_application_count",
    ):
        if key in summary:
            lines.append(f"- {key}: {summary.get(key)}")

    jobs_by_status = summary.get("jobs_by_status")
    if jobs_by_status:
        lines.append(f"- jobs_by_status: {jobs_by_status}")

    active_jobs = summary.get("active_jobs") or []
    if active_jobs:
        lines.append("- active_jobs:")
        for job in active_jobs:
            job_id = job.get("id")
            title = job.get("title") or "Unknown"
            dept = job.get("department") or "-"
            location = job.get("location") or "-"
            lines.append(f"  - [{job_id}] {title} | department: {dept} | location: {location}")

    applications_by_status = summary.get("applications_by_status")
    if applications_by_status:
        lines.append(f"- applications_by_status: {applications_by_status}")

    my_applications_by_status = summary.get("my_applications_by_status")
    if my_applications_by_status:
        lines.append(f"- my_applications_by_status: {my_applications_by_status}")

    lines.append(
        "If asked about counts/statuses, answer from this runtime data. "
        "If data is missing, say it is not available."
    )
    return "\n".join(lines)
