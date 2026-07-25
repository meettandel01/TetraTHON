from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import logging

from database import get_db, Student, Session as LearningSession, QuizAttempt, Doubt, StudentConceptMastery, Concept
from auth import get_current_user, User

router = APIRouter()
logger = logging.getLogger(__name__)


@router.get("/{student_id}")
def get_dashboard(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
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

    # Build the full concept graph with chapters and topics
    from database import Chapter
    all_chapters = db.query(Chapter).all()
    all_concepts = db.query(Concept).all()
    concept_graph = {"nodes": [], "edges": []}
    
    chapter_map = {ch.id: ch.name for ch in all_chapters}
    
    for ch in all_chapters:
        concept_graph["nodes"].append({
            "id": f"ch_{ch.id}",
            "name": ch.name,
            "parent_id": None,
            "mastery": None,
            "status": "chapter"
        })
    
    mastery_by_concept = {m.concept_id: m for m in masteries}
    
    for c in all_concepts:
        status = "unattempted"
        pct = None
        if c.id in mastery_by_concept:
            m = mastery_by_concept[c.id]
            pct = round(m.mastery_level * 100, 1)
            status = "weak" if m.is_weak else "mastered"
        
        parent_node_id = f"ch_{c.chapter_id}" if c.chapter_id in chapter_map else None
        
        concept_graph["nodes"].append({
            "id": str(c.id),
            "name": c.name,
            "parent_id": parent_node_id,
            "mastery": pct,
            "status": status
        })
        if parent_node_id:
            concept_graph["edges"].append({
                "source": parent_node_id,
                "target": str(c.id)
            })

    logger.info(f"Dashboard fetched for student {student_id}")

    return {
        "student": {
            "id": student.id,
            "name": student.user.name if student.user else "Unknown",
            "grade": student.grade,
            "level": student.level,
            "mastery_score": round(student.mastery_score, 1),
            "xp": student.xp,
            "streak": student.streak,
            "archetype": student.archetype,
        },
        "stats": {
            "sessions_total": len(sessions),
            "sessions_completed": len(completed_sessions),
            "quiz_accuracy": round((correct_answers / total_questions * 100) if total_questions > 0 else 0, 1),
            "doubts_asked": len(doubts),
            "weak_concepts_count": len(weak_concepts),
        },
        "concept_performance": concept_performance,
        "concept_graph": concept_graph,
        "chapters": [{"id": ch.id, "name": ch.name, "number": ch.chapter_number or ch.id} for ch in all_chapters],
        "recent_doubts": [
            {
                "question": d.question_text[:80] + "...",
                "mode": d.mode,
                "created_at": d.created_at.isoformat() if d.created_at else None,
            }
            for d in sorted(doubts, key=lambda x: x.created_at, reverse=True)[:5]
        ],
    }
