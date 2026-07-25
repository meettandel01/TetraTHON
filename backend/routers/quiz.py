from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
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
    student_id: str
    concept_id: int
    answers: list # list of dicts: { question_id, selected_option, is_correct, difficulty, concept_tag }

def get_question_by_concept_difficulty(db: Session, concept_id: int, difficulty: str, exclude_ids: list):
    q = db.query(ContentItem).filter(
        ContentItem.concept_id == concept_id,
        ContentItem.difficulty == difficulty,
        ContentItem.usage_type == "diagnostic"
    ).all()
    
    available = [item for item in q if str(item.id) not in exclude_ids]
    if not available:
        return None
    
    choice = random.choice(available)
    return {
        "id": str(choice.id),
        "text": choice.text,
        "options": json.loads(choice.options) if choice.options else {},
        "correct": choice.correct,
        "difficulty": choice.difficulty,
        "concept": db.query(Concept).get(choice.concept_id).name,
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
    Start a diagnostic quiz. Fetches the first 'medium' question for the given concept.
    """
    first_q = get_question_by_concept_difficulty(db, concept_id, "medium", [])
    if not first_q:
        first_q = get_question_by_concept_difficulty(db, concept_id, "easy", [])
        
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
    student = db.query(Student).filter(Student.user_id == int(request.student_id.replace("s","")) if request.student_id.startswith("s") else Student.id == int(request.student_id)).first()
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

    # Determine Level Placement
    level = "Foundational"
    if percent >= 0.8:
        level = "Advanced"
    elif percent >= 0.4:
        level = "Grade-Level"
        
    # Determine Archetype
    archetype = "strong"
    if level == "Foundational":
        archetype = "foundStuck" if percent < 0.2 else "foundImproving"
    elif level == "Grade-Level":
        archetype = "gradeConsistent"

    # Update Student Profile
    student.level = level
    student.archetype = archetype
    # Diagnostic bonus
    xp_gained = 100 + (percent * 50)
    student.xp += int(xp_gained)

    # Update Concept Mastery
    mastery = db.query(StudentConceptMastery).filter_by(
        student_id=student.id, concept_id=request.concept_id
    ).first()
    
    if not mastery:
        mastery = StudentConceptMastery(
            student_id=student.id,
            concept_id=request.concept_id,
            mastery_level=percent,
            attempts=1,
            correct=correct_count,
            is_weak=(level == "Foundational")
        )
        db.add(mastery)
    else:
        mastery.mastery_level = (mastery.mastery_level + percent) / 2.0
        mastery.attempts += 1
        mastery.correct += correct_count
        mastery.is_weak = (mastery.mastery_level < 0.4)

    db.commit()

    return {
        "status": "success",
        "score": f"{correct_count}/{total}",
        "percentage": round(percent * 100),
        "placement_level": level,
        "archetype": archetype,
        "xp_gained": int(xp_gained)
    }
