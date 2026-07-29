from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import logging
from datetime import datetime
import json

from database import get_db, Session as LearningSession, Student, StudentConceptMastery, Concept, LessonContent, ContentItem
from routers.gamification import check_and_award_badges

router = APIRouter()
logger = logging.getLogger(__name__)

class SessionStartRequest(BaseModel):
    student_id: int
    lesson_id: str
    concept_id: Optional[int] = None

class LessonCompleteRequest(BaseModel):
    student_id: int
    concept_id: Optional[int] = None
    lesson_id: Optional[str] = None
    level: Optional[str] = "Foundational"
    time_spent_seconds: int = 0

class PracticeAnswerRequest(BaseModel):
    student_id: int
    lesson_id: Optional[str] = None
    question_id: Optional[str] = None
    selected_option: str
    correct_option: str
    concept: Optional[str] = None

@router.get("/{level}")
def get_lesson_content(level: str, concept_id: int, db: Session = Depends(get_db)):
    """
    Returns dynamically generated/assembled lesson content based on student's level and the requested concept.
    """
    # 1. Get the core lesson content from DB
    lesson = db.query(LessonContent).filter(
        LessonContent.concept_id == concept_id,
        LessonContent.level == level
    ).first()
    
    # Fallback to Grade-Level if not found
    if not lesson:
        lesson = db.query(LessonContent).filter(
            LessonContent.concept_id == concept_id,
            LessonContent.level == "Grade-Level"
        ).first()
        
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson content not found for this topic.")
        
    concept = db.query(Concept).get(concept_id)

    # 2. Get practice questions from DB (usage_type='practice')
    q_query = db.query(ContentItem).filter(
        ContentItem.concept_id == concept_id,
        ContentItem.usage_type == "practice"
    )
    
    # Match difficulty roughly to level
    if level == "Foundational":
        qs = q_query.filter(ContentItem.difficulty.in_(["easy", "medium"])).limit(3).all()
    elif level == "Advanced":
        qs = q_query.filter(ContentItem.difficulty.in_(["medium", "hard"])).limit(3).all()
    else:
        qs = q_query.filter(ContentItem.difficulty == "medium").limit(3).all()

    # If short on questions, grab whatever is available
    if len(qs) < 3:
        more = q_query.limit(3 - len(qs)).all()
        for m in more:
            if m not in qs: qs.append(m)

    practice_questions = []
    for q in qs:
        practice_questions.append({
            "id": str(q.id),
            "text": q.text,
            "options": json.loads(q.options) if q.options else {},
            "correct": q.correct,
            "explanation": q.explanation,
            "concept": concept.name
        })

    return {
        "id": f"c{concept_id}_{level}",
        "title": lesson.title,
        "duration_minutes": lesson.duration_minutes,
        "concept": concept.name,
        "content": {
            "intro": lesson.intro_text,
            "explanation": lesson.explanation_markdown,
            "visual_hint": lesson.visual_hint,
            "real_world": lesson.real_world_app
        },
        "practice_questions": practice_questions
    }

@router.post("/session/start")
def start_lesson_session(req: SessionStartRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        raise HTTPException(404, "Student not found")
        
    cid = req.concept_id
    if cid is None and req.lesson_id:
        if str(req.lesson_id).isdigit():
            cid = int(req.lesson_id)
        elif str(req.lesson_id).startswith("lesson_c"):
            concept_code = str(req.lesson_id).replace("lesson_", "")
            c = db.query(Concept).filter(Concept.concept_code == concept_code).first()
            if c:
                cid = c.id
        
    concept = db.query(Concept).get(cid) if cid else None
    
    level = student.level or "Foundational"
    if cid:
        mastery = db.query(StudentConceptMastery).filter_by(student_id=student.id, concept_id=cid).first()
        if mastery and mastery.concept_level:
            level = mastery.concept_level
            
    title = f"{concept.name} ({level})" if concept else f"Lesson {req.lesson_id}"

    new_session = LearningSession(
        student_id=student.id,
        concept_id=cid,
        lesson_id=str(req.lesson_id),
        lesson_title=title,
        level=level,
        completed=False,
        time_spent_seconds=0
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return {"status": "started", "session_id": new_session.id}

@router.get("/session/active/{student_id}")
def get_active_session(student_id: int, db: Session = Depends(get_db)):
    active_session = db.query(LearningSession).filter(
        LearningSession.student_id == student_id,
        LearningSession.completed == False
    ).order_by(LearningSession.started_at.desc()).first()
    
    if not active_session:
        return {"active": False}
        
    concept_name = active_session.lesson_title
    if active_session.concept_id:
        c = db.query(Concept).get(active_session.concept_id)
        if c: concept_name = c.name
        
    return {
        "active": True,
        "session_id": active_session.id,
        "lesson_id": active_session.lesson_id,
        "concept_id": active_session.concept_id,
        "concept_name": concept_name,
        "level": active_session.level,
        "started_at": active_session.started_at.isoformat() if active_session.started_at else None
    }

@router.get("/concept-level/{student_id}/{concept_id}")
def get_concept_level(student_id: int, concept_id: int, db: Session = Depends(get_db)):
    mastery = db.query(StudentConceptMastery).filter_by(
        student_id=student_id, concept_id=concept_id
    ).first()
    
    if mastery and mastery.concept_level:
        return {"level": mastery.concept_level}
        
    # Fallback to student global level
    student = db.query(Student).filter(Student.id == student_id).first()
    if student and student.level:
        return {"level": student.level}
        
    return {"level": "Foundational"}

@router.post("/session/complete")
@router.post("/complete")
def complete_lesson(req: LessonCompleteRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        raise HTTPException(404, "Student not found")

    cid = req.concept_id
    if cid is None and req.lesson_id and str(req.lesson_id).isdigit():
        cid = int(req.lesson_id)
    concept = db.query(Concept).get(cid) if cid else None
    title = f"{concept.name} ({req.level})" if concept else f"Lesson {req.lesson_id or cid or 'Completed'}"

    # Record Session
    new_session = LearningSession(
        student_id=student.id,
        lesson_id=str(cid or req.lesson_id or "1"),
        lesson_title=title,
        level=req.level or student.level or "Foundational",
        completed=True,
        time_spent_seconds=req.time_spent_seconds,
        completed_at=datetime.utcnow()
    )
    db.add(new_session)

    # Award XP
    xp_gained = 50 + (req.time_spent_seconds // 60) * 2  # Base + time bonus
    if xp_gained > 150: xp_gained = 150 # cap
    student.xp += xp_gained

    from routers.gamification import log_xp_transaction
    log_xp_transaction(student.id, xp_gained, "lesson", db)

    # Update streak
    today = datetime.utcnow().date()
    if not student.streak_last_date or student.streak_last_date.date() < today:
        if student.streak_last_date and (today - student.streak_last_date.date()).days == 1:
            student.streak += 1
        else:
            student.streak = 1
        student.streak_last_date = datetime.utcnow()
        
    db.commit()

    # Check for badges
    badges_earned = check_and_award_badges(student.id, db)

    return {
        "status": "success",
        "xp_gained": xp_gained,
        "total_xp": student.xp,
        "current_streak": student.streak,
        "badges_earned": badges_earned
    }

@router.post("/practice/answer")
def submit_practice_answer(req: PracticeAnswerRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        raise HTTPException(404, "Student not found")
        
    is_correct = (req.selected_option == req.correct_option)
    xp_reward = 15 if is_correct else 5
    
    student.xp += xp_reward
    
    from routers.gamification import log_xp_transaction, recalculate_student_mastery
    from routers.concepts import get_concept_id_by_name
    from database import QuizAttempt
    
    log_xp_transaction(student.id, xp_reward, "practice", db)
    
    # Record the quiz attempt
    attempt = QuizAttempt(
        student_id=student.id,
        question_id=req.question_id or "unknown",
        question_text="Practice question", 
        selected_option=req.selected_option,
        correct_option=req.correct_option,
        is_correct=is_correct,
        concept_tag=req.concept,
        difficulty="medium"
    )
    db.add(attempt)
    
    # Update mastery
    if req.concept:
        concept_id = get_concept_id_by_name(db, req.concept)
        if concept_id:
            mastery = db.query(StudentConceptMastery).filter_by(
                student_id=student.id, concept_id=concept_id
            ).first()
            if not mastery:
                mastery = StudentConceptMastery(
                    student_id=student.id,
                    concept_id=concept_id,
                    mastery_level=1.0 if is_correct else 0.0,
                    attempts=1,
                    correct=1 if is_correct else 0,
                    is_weak=not is_correct
                )
                db.add(mastery)
            else:
                percent = 1.0 if is_correct else 0.0
                # Weighted average for practice (gives more weight to recent answers)
                mastery.mastery_level = (mastery.mastery_level * 0.7) + (percent * 0.3)
                mastery.attempts += 1
                if is_correct:
                    mastery.correct += 1
                mastery.is_weak = (mastery.mastery_level < 0.4)

    db.commit()
    recalculate_student_mastery(student.id, db)
    
    badges_earned = check_and_award_badges(student.id, db)
    
    return {
        "is_correct": is_correct,
        "xp_reward": xp_reward,
        "total_xp": student.xp,
        "badges_earned": badges_earned
    }
