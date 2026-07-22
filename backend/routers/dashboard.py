from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import logging

from database import get_db, Student, Session as LearningSession, QuizAttempt, Doubt, StudentConceptMastery

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/{student_id}")
def get_dashboard(student_id: int, db: Session = Depends(get_db)):
    """Get full dashboard data for a student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Session stats
    sessions = db.query(LearningSession).filter(LearningSession.student_id == student_id).all()
    completed_sessions = [s for s in sessions if s.completed]

    # Quiz performance
    quiz_attempts = db.query(QuizAttempt).filter(QuizAttempt.student_id == student_id).all()
    total_questions = len(quiz_attempts)
    correct_answers = sum(1 for a in quiz_attempts if a.is_correct)

    # Doubts
    doubts = db.query(Doubt).filter(Doubt.student_id == student_id).all()

    # Concept mastery
    masteries = db.query(StudentConceptMastery).filter(
        StudentConceptMastery.student_id == student_id
    ).all()
    weak_concepts = [m for m in masteries if m.is_weak]

    # Quiz breakdown by concept
    concept_performance = {}
    for attempt in quiz_attempts:
        concept = attempt.concept_tag or "Unknown"
        if concept not in concept_performance:
            concept_performance[concept] = {"correct": 0, "total": 0}
        concept_performance[concept]["total"] += 1
        if attempt.is_correct:
            concept_performance[concept]["correct"] += 1

    logger.info(f"Dashboard fetched for student {student_id}")

    return {
        "student": {
            "id": student.id,
            "name": student.name,
            "grade": student.grade,
            "level": student.level,
            "mastery_score": round(student.mastery_score, 1),
        },
        "stats": {
            "sessions_total": len(sessions),
            "sessions_completed": len(completed_sessions),
            "quiz_accuracy": round((correct_answers / total_questions * 100) if total_questions > 0 else 0, 1),
            "doubts_asked": len(doubts),
            "weak_concepts_count": len(weak_concepts),
        },
        "concept_performance": concept_performance,
        "recent_doubts": [
            {
                "question": d.question_text[:80] + "...",
                "mode": d.mode,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in sorted(doubts, key=lambda x: x.created_at, reverse=True)[:5]
        ],
    }
