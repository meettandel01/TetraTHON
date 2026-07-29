from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
import logging

from database import get_db, Student, Session as LearningSession, QuizAttempt, Doubt, StudentConceptMastery, Concept
from auth import get_current_user, User

router = APIRouter()
logger = logging.getLogger(__name__)


from typing import Optional

@router.get("/{student_id}")
def get_dashboard(student_id: int, chapter_id: Optional[str] = None, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Get full dashboard data for a student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Session stats
    sessions = db.query(LearningSession).filter(LearningSession.student_id == student_id).all()
    completed_sessions = [s for s in sessions if s.completed]
    
    sessions_list = []
    for s in sorted(sessions, key=lambda x: x.started_at, reverse=True)[:10]:
        concept_name = s.lesson_title
        concept_id = s.concept_id
        
        # Recover concept from lesson_c1 if concept_id is missing
        if not concept_id and s.lesson_id and s.lesson_id.startswith("lesson_c"):
            concept_code = s.lesson_id.replace("lesson_", "")
            c = db.query(Concept).filter(Concept.concept_code == concept_code).first()
            if c:
                concept_id = c.id
        
        if concept_id:
            c = db.query(Concept).filter(Concept.id == concept_id).first()
            if c:
                concept_name = c.name

        sessions_list.append({
            "id": s.id,
            "concept_id": concept_id,
            "concept_name": concept_name,
            "level": s.level,
            "completed": s.completed,
            "score": s.score,
            "started_at": s.started_at.isoformat() if s.started_at else None,
            "completed_at": s.completed_at.isoformat() if s.completed_at else None,
            "time_spent_seconds": s.time_spent_seconds,
        })

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
    
    recommended_next = None
    if masteries:
        weakest = min(masteries, key=lambda m: m.mastery_level)
        wc_concept = db.query(Concept).filter(Concept.id == weakest.concept_id).first()
        recommended_next = {
            "id": weakest.concept_id,
            "name": wc_concept.name if wc_concept else "Unknown",
            "mastery_level": round(weakest.mastery_level * 100, 1)
        }
    else:
        first_concept = db.query(Concept).first()
        if first_concept:
            recommended_next = {
                "id": first_concept.id,
                "name": first_concept.name,
                "mastery_level": 0.0
            }

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
    all_chapters_query = db.query(Chapter)
    all_concepts_query = db.query(Concept)
    if chapter_id:
        all_chapters_query = all_chapters_query.filter(Chapter.id == int(chapter_id))
        all_concepts_query = all_concepts_query.filter(Concept.chapter_id == int(chapter_id))
        
    all_chapters = all_chapters_query.all()
    all_concepts = all_concepts_query.all()
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
            "status": status,
            "concept_level": m.concept_level if c.id in mastery_by_concept else None
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
        "sessions_list": sessions_list,
        "recommended_next": recommended_next,
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
