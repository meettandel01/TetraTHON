from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import logging
from datetime import datetime

from database import get_db, Session as LearningSession, Student, StudentConceptMastery, Concept

router = APIRouter()
logger = logging.getLogger(__name__)

# ─── Lesson Content (3 differentiated paths) ──────────────────────────────────

LESSONS = {
    "Foundational": [
        {
            "id": "f1",
            "title": "Understanding Numbers & Basic Algebra",
            "duration_minutes": 10,
            "concept": "Linear Equations",
            "content": {
                "intro": "Let's start with the basics! Algebra is like a puzzle where we find the missing piece.",
                "explanation": """
## What is a Variable?
A variable is just a letter (like x, y, or n) that stands for an unknown number.

**Example:** If you have 3 apples and some more apples, and the total is 7:
> 3 + x = 7
> So x = 4 (the missing apples!)

## Solving Simple Equations
**Rule:** Whatever you do to one side, do the same to the other!

**Step-by-step:**
1. Write: 2x + 4 = 12
2. Subtract 4 from both sides: 2x = 8  
3. Divide both sides by 2: x = 4 ✓

## Key Formula
> **x = (Total - Constant) ÷ Coefficient**
                """,
                "visual_hint": "Think of a balance scale — both sides must always be equal!",
                "real_world": "Used in calculating discounts, scores, and measurements every day.",
            },
            "practice_questions": [
                {
                    "id": "f1_p1",
                    "text": "Solve: x + 7 = 15",
                    "options": {"A": "7", "B": "8", "C": "9", "D": "22"},
                    "correct": "B",
                    "explanation": "x = 15 - 7 = 8",
                    "concept": "Linear Equations",
                },
                {
                    "id": "f1_p2",
                    "text": "Solve: 3x = 18",
                    "options": {"A": "3", "B": "6", "C": "15", "D": "54"},
                    "correct": "B",
                    "explanation": "x = 18 ÷ 3 = 6",
                    "concept": "Linear Equations",
                },
                {
                    "id": "f1_p3",
                    "text": "Which is the correct first step to solve: 4x - 2 = 10?",
                    "options": {"A": "Multiply by 4", "B": "Add 2 to both sides", "C": "Divide by 4", "D": "Subtract 10"},
                    "correct": "B",
                    "explanation": "Add 2 to both sides to isolate the term with x: 4x = 12",
                    "concept": "Linear Equations",
                },
            ],
        },
    ],
    "Grade-Level": [
        {
            "id": "g1",
            "title": "Polynomials & Factorization",
            "duration_minutes": 10,
            "concept": "Polynomials",
            "content": {
                "intro": "Polynomials are expressions with multiple terms. Factorizing them is like reversing multiplication!",
                "explanation": """
## What is a Polynomial?
A polynomial has variables and coefficients: **ax² + bx + c**

**Types:**
- Monomial: 3x (one term)
- Binomial: x + 5 (two terms)  
- Trinomial: x² + 5x + 6 (three terms)

## Factorizing Trinomials
**Method:** Find two numbers that multiply to **c** and add to **b**

**Example:** x² + 5x + 6
- We need: two numbers × = 6, sum = 5
- Those numbers are **2 and 3** (2×3=6, 2+3=5)
- Answer: **(x + 2)(x + 3)** ✓

## Special Products
- (a+b)² = a² + 2ab + b²
- (a-b)² = a² - 2ab + b²
- (a+b)(a-b) = a² - b²
                """,
                "visual_hint": "Draw a 2×2 grid (box method) to organize your factorization!",
                "real_world": "Used in physics (projectile motion), economics (profit/loss curves), and engineering.",
            },
            "practice_questions": [
                {
                    "id": "g1_p1",
                    "text": "Factorize: x² + 7x + 12",
                    "options": {"A": "(x+3)(x+4)", "B": "(x+2)(x+6)", "C": "(x+1)(x+12)", "D": "(x+4)(x+3)"},
                    "correct": "A",
                    "explanation": "Find numbers: 3×4=12, 3+4=7. So (x+3)(x+4). Note: A and D are the same!",
                    "concept": "Polynomials",
                },
                {
                    "id": "g1_p2",
                    "text": "Expand: (x + 5)²",
                    "options": {"A": "x² + 25", "B": "x² + 5x + 25", "C": "x² + 10x + 25", "D": "x² + 10x"},
                    "correct": "C",
                    "explanation": "(a+b)² = a² + 2ab + b² = x² + 2(x)(5) + 25 = x² + 10x + 25",
                    "concept": "Polynomials",
                },
                {
                    "id": "g1_p3",
                    "text": "What is (a+b)(a-b)?",
                    "options": {"A": "a² + b²", "B": "a² - b²", "C": "2a²", "D": "a² - 2ab + b²"},
                    "correct": "B",
                    "explanation": "This is the difference of squares identity: (a+b)(a-b) = a² - b²",
                    "concept": "Polynomials",
                },
            ],
        },
    ],
    "Advanced": [
        {
            "id": "a1",
            "title": "Quadratic Equations & Trigonometry",
            "duration_minutes": 10,
            "concept": "Quadratic Equations",
            "content": {
                "intro": "Master quadratic equations using multiple methods, and explore the beauty of trigonometric ratios!",
                "explanation": """
## Quadratic Equations: ax² + bx + c = 0

### Method 1: Factorization
x² - 5x + 6 = 0 → (x-2)(x-3) = 0 → x = 2 or x = 3

### Method 2: Quadratic Formula
**x = (-b ± √(b²-4ac)) / 2a**

The **discriminant (D = b²-4ac)** tells you everything:
- D > 0: Two distinct real roots
- D = 0: Two equal real roots  
- D < 0: No real roots (complex roots)

## Trigonometry Basics
In a right triangle with angle θ:
| Ratio | Formula | Mnemonic |
|-------|---------|---------|
| sin θ | Opposite/Hypotenuse | SOH |
| cos θ | Adjacent/Hypotenuse | CAH |
| tan θ | Opposite/Adjacent | TOA |

**Key Identity:** sin²θ + cos²θ = 1 (always!)
                """,
                "visual_hint": "The quadratic formula comes from 'completing the square' — understand the derivation!",
                "real_world": "Quadratics model projectile paths; trig is used in GPS, architecture, and astronomy.",
            },
            "practice_questions": [
                {
                    "id": "a1_p1",
                    "text": "Find the discriminant of: 3x² - 4x + 1 = 0",
                    "options": {"A": "4", "B": "12", "C": "16", "D": "28"},
                    "correct": "A",
                    "explanation": "D = b² - 4ac = (-4)² - 4(3)(1) = 16 - 12 = 4",
                    "concept": "Quadratic Equations",
                },
                {
                    "id": "a1_p2",
                    "text": "If cos θ = 5/13, find sin θ (θ is acute)",
                    "options": {"A": "12/13", "B": "5/12", "C": "13/12", "D": "8/13"},
                    "correct": "A",
                    "explanation": "sin²θ = 1 - cos²θ = 1 - 25/169 = 144/169, so sin θ = 12/13",
                    "concept": "Trigonometry",
                },
                {
                    "id": "a1_p3",
                    "text": "Sum of roots of 2x² - 6x + 4 = 0 is:",
                    "options": {"A": "2", "B": "3", "C": "4", "D": "-3"},
                    "correct": "B",
                    "explanation": "Sum of roots = -b/a = -(-6)/2 = 3",
                    "concept": "Quadratic Equations",
                },
            ],
        },
    ],
}


class SessionStartRequest(BaseModel):
    student_id: int
    lesson_id: str


class PracticeAnswerRequest(BaseModel):
    student_id: int
    lesson_id: str
    question_id: str
    selected_option: str
    correct_option: str
    concept: str


@router.get("/{level}")
def get_lessons(level: str):
    """Get lessons for a specific learning level."""
    level = level.capitalize()
    if level not in LESSONS:
        raise HTTPException(status_code=404, detail=f"No lessons found for level: {level}")
    lessons = LESSONS[level]
    logger.info(f"Fetching {len(lessons)} lesson(s) for level: {level}")
    return lessons


@router.post("/session/start")
def start_session(request: SessionStartRequest, db: Session = Depends(get_db)):
    """Start a learning session for a student."""
    student = db.query(Student).filter(Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    session = LearningSession(
        student_id=request.student_id,
        lesson_id=request.lesson_id,
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    logger.info(f"✅ Session started: {session.id} for student {request.student_id}")
    return {"session_id": session.id, "message": "Session started"}


@router.post("/practice/answer")
def submit_practice_answer(request: PracticeAnswerRequest, db: Session = Depends(get_db)):
    """Submit a practice question answer and update mastery."""
    is_correct = request.selected_option == request.correct_option

    # Update or create concept mastery record
    mastery = db.query(StudentConceptMastery).filter(
        StudentConceptMastery.student_id == request.student_id,
        StudentConceptMastery.concept_id == request.concept,
    ).first()

    if not mastery:
        mastery = StudentConceptMastery(
            student_id=request.student_id,
            concept_id=0,  # Will update with actual concept ID
        )
        db.add(mastery)

    mastery.attempts += 1
    if is_correct:
        mastery.correct += 1
    mastery.mastery_level = mastery.correct / mastery.attempts
    mastery.is_weak = mastery.mastery_level < 0.5

    # Update overall student mastery score
    student = db.query(Student).filter(Student.id == request.student_id).first()
    if student:
        student.mastery_score = mastery.mastery_level * 100

    db.commit()
    logger.info(f"Practice answer: Student {request.student_id}, Concept: {request.concept}, Correct: {is_correct}")

    return {
        "is_correct": is_correct,
        "mastery_level": round(mastery.mastery_level * 100, 1),
        "is_weak": mastery.is_weak,
    }
