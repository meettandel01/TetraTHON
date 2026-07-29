from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional, Union
import logging
import random
import json

from database import get_db, Student, QuizAttempt, StudentConceptMastery, ContentItem, Concept

router = APIRouter()
logger = logging.getLogger(__name__)

class NextQuestionRequest(BaseModel):
    concept_id: int
    last_question_id: Optional[str] = None
    last_was_correct: Optional[bool] = None
    last_difficulty: Optional[str] = None
    exclude_ids: List[str] = []

class QuizSubmitRequest(BaseModel):
    student_id: Union[str, int]
    concept_id: int
    answers: list # list of dicts: { question_id, selected_option, is_correct, difficulty, concept_tag }

def get_question_by_concept_difficulty(db: Session, concept_id: int, difficulty: str, exclude_ids: list):
    # 1. Try exact match (concept + difficulty + diagnostic)
    q = db.query(ContentItem).filter(
        ContentItem.concept_id == concept_id,
        ContentItem.difficulty == difficulty,
        ContentItem.usage_type == "diagnostic"
    ).all()
    
    # 2. Fallback to any usage_type (e.g. practice) for this concept + difficulty
    if not q:
        q = db.query(ContentItem).filter(
            ContentItem.concept_id == concept_id,
            ContentItem.difficulty == difficulty
        ).all()
        
    # 3. Fallback to ANY question for this concept regardless of difficulty
    if not q:
        q = db.query(ContentItem).filter(
            ContentItem.concept_id == concept_id
        ).all()

    # 4. Fallback to questions from the SAME chapter if concept has no questions
    if not q:
        concept = db.query(Concept).filter(Concept.id == concept_id).first()
        if concept and concept.chapter_id:
            sibling_concept_ids = [c.id for c in db.query(Concept).filter(Concept.chapter_id == concept.chapter_id).all()]
            q = db.query(ContentItem).filter(ContentItem.concept_id.in_(sibling_concept_ids)).all()
            
    # 5. Fallback to questions from the SAME subject if chapter has no questions
    if not q:
        concept = db.query(Concept).filter(Concept.id == concept_id).first()
        if concept and concept.chapter_id:
            from database import Chapter
            chapter = db.query(Chapter).filter(Chapter.id == concept.chapter_id).first()
            if chapter and chapter.subject_id:
                subject_chapter_ids = [ch.id for ch in db.query(Chapter).filter(Chapter.subject_id == chapter.subject_id).all()]
                subject_concept_ids = [c.id for c in db.query(Concept).filter(Concept.chapter_id.in_(subject_chapter_ids)).all()]
                q = db.query(ContentItem).filter(ContentItem.concept_id.in_(subject_concept_ids)).all()
        
    available = [item for item in q if str(item.id) not in exclude_ids]
    
    # If still no questions available within the scoped subject/chapter/topic, return None
    # We NO LONGER fall back to ANY question in the database.
    if not available:
        return None
    
    choice = random.choice(available)
    concept_obj = db.query(Concept).get(choice.concept_id)
    concept_name = concept_obj.name if concept_obj else "General Math"
    
    return {
        "id": str(choice.id),
        "text": choice.text,
        "options": json.loads(choice.options) if choice.options else {},
        "correct": choice.correct,
        "difficulty": choice.difficulty,
        "concept": concept_name,
        "explanation": choice.explanation
    }

def get_adaptive_question(db: Session, concept_id: int, last_was_correct: Optional[bool], last_difficulty: str, exclude_ids: list):
    # Determine new difficulty
    if last_was_correct is None:
        target_diff = "medium"
    elif last_was_correct:
        target_diff = "hard" if last_difficulty in ["medium", "hard"] else "medium"
    else:
        target_diff = "easy" if last_difficulty in ["easy", "medium"] else "medium"

    # Try target difficulty
    q = get_question_by_concept_difficulty(db, concept_id, target_diff, exclude_ids)
    if q: return q
    
    # Fallback 1: Try adjacent difficulty
    fallback_diff = "medium" if target_diff != "medium" else "easy"
    q = get_question_by_concept_difficulty(db, concept_id, fallback_diff, exclude_ids)
    if q: return q
    
    # Fallback 2: Any available
    for diff in ["easy", "medium", "hard"]:
        q = get_question_by_concept_difficulty(db, concept_id, diff, exclude_ids)
        if q: return q
    
    return None

@router.get("/questions")
def get_initial_questions(concept_id: int, db: Session = Depends(get_db)):
    """
    Start a diagnostic quiz. Fetches the first question for the given concept.
    """
    first_q = get_question_by_concept_difficulty(db, concept_id, "medium", [])
    if not first_q:
        first_q = get_question_by_concept_difficulty(db, concept_id, "easy", [])
    if not first_q:
        first_q = get_question_by_concept_difficulty(db, concept_id, "hard", [])
        
    if not first_q:
        raise HTTPException(status_code=404, detail="No diagnostic questions found for this concept")
        
    return [first_q]

@router.post("/next")
def get_next_question(req: NextQuestionRequest, db: Session = Depends(get_db)):
    """
    Returns the next question based on whether the last was correct.
    """
    q = get_adaptive_question(
        db,
        req.concept_id, 
        req.last_was_correct, 
        req.last_difficulty or "medium", 
        req.exclude_ids
    )
    if not q:
        return {"status": "complete"}
    return q

@router.post("/submit")
def submit_quiz(request: QuizSubmitRequest, db: Session = Depends(get_db)):
    sid_str = str(request.student_id)
    student = db.query(Student).filter(Student.user_id == int(sid_str.replace("s","")) if sid_str.startswith("s") else Student.id == int(sid_str)).first()
    if not student:
        raise HTTPException(404, "Student not found")

    correct_count = 0
    total = len(request.answers)
    
    # Calculate weighted score (Easy=1, Med=2, Hard=3)
    weighted_score = 0
    max_possible_weight = 0

    for ans in request.answers:
        weight = {"easy": 1, "medium": 2, "hard": 3}.get(ans.get("difficulty", "medium"), 1)
        max_possible_weight += weight
        
        is_correct = ans.get("is_correct", False)
        if is_correct:
            correct_count += 1
            weighted_score += weight
            
        attempt = QuizAttempt(
            student_id=student.id,
            question_id=str(ans.get("question_id")),
            question_text="Saved to DB", 
            selected_option=ans.get("selected_option"),
            correct_option=ans.get("correct_option", "Unknown"),
            is_correct=is_correct,
            concept_tag=ans.get("concept_tag"),
            difficulty=ans.get("difficulty")
        )
        db.add(attempt)

    percent = (weighted_score / max_possible_weight) if max_possible_weight > 0 else 0

    if percent <= 0.40:
        concept_level = "Foundational"
    elif percent <= 0.70:
        concept_level = "Grade-Level"
    else:
        concept_level = "Advanced"

    # Update Concept Mastery
    mastery = db.query(StudentConceptMastery).filter_by(
        student_id=student.id, concept_id=request.concept_id
    ).first()
    
    if not mastery:
        mastery = StudentConceptMastery(
            student_id=student.id,
            concept_id=request.concept_id,
            concept_level=concept_level,
            mastery_level=percent,
            attempts=1,
            correct=correct_count,
            is_weak=(percent < 0.4)
        )
        db.add(mastery)
    else:
        mastery.mastery_level = (mastery.mastery_level + percent) / 2.0
        mastery.attempts += 1
        mastery.correct += correct_count
        mastery.is_weak = (mastery.mastery_level < 0.4)
        mastery.concept_level = concept_level

    db.commit()

    from routers.gamification import recalculate_student_mastery, log_xp_transaction, check_and_award_badges, update_streak
    recalculate_student_mastery(student.id, db)
    
    # Diagnostic bonus
    xp_gained = int(100 + (percent * 50))
    student.xp += xp_gained
    db.commit()
    
    log_xp_transaction(student.id, xp_gained, "diagnostic", db)
    update_streak(student.id, db)
    badges_earned = check_and_award_badges(student.id, db)

    db.refresh(student)
    # Determine Archetype
    archetype = "strong"
    if student.level == "Foundational":
        archetype = "foundStuck" if student.mastery_score < 0.2 else "foundImproving"
    elif student.level == "Grade-Level":
        archetype = "gradeConsistent"
    student.archetype = archetype
    db.commit()

    return {
        "status": "success",
        "score": f"{correct_count}/{total}",
        "correct_count": correct_count,
        "total_questions": total,
        "percentage": round(percent * 100),
        "placement_level": student.level,
        "concept_level": concept_level,
        "archetype": archetype,
        "xp_gained": xp_gained,
        "total_xp": student.xp
    }
