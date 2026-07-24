from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
import logging
import random

from database import get_db, Student, QuizAttempt, StudentConceptMastery
from routers.concepts import get_concept_id_by_name

router = APIRouter()
logger = logging.getLogger(__name__)

# ─── Expanded Question Bank (Class 8–10 Math, 15 Qs, 5 concepts) ─────────────

QUESTION_BANK = [

    # ══ LINEAR EQUATIONS ══════════════════════════════════════════
    {
        "id": "le_e1",
        "text": "Solve for x: 3x - 9 = 0",
        "options": {"A": "0", "B": "3", "C": "9", "D": "-3"},
        "correct": "B",
        "difficulty": "easy",
        "concept": "Linear Equations",
        "explanation": "Add 9 to both sides: 3x = 9 → x = 9 ÷ 3 = 3",
    },
    {
        "id": "le_m1",
        "text": "If 5(x - 2) = 3(x + 4), find x.",
        "options": {"A": "9", "B": "11", "C": "7", "D": "13"},
        "correct": "B",
        "difficulty": "medium",
        "concept": "Linear Equations",
        "explanation": "5x - 10 = 3x + 12 → 2x = 22 → x = 11",
    },
    {
        "id": "le_h1",
        "text": "A number is 4 more than twice another. Their sum is 22. Find the larger number.",
        "options": {"A": "14", "B": "16", "C": "18", "D": "12"},
        "correct": "B",
        "difficulty": "hard",
        "concept": "Linear Equations",
        "explanation": "Let smaller = x. Larger = 2x+4. Sum: x + 2x+4 = 22 → x=6, larger = 16",
    },

    # ══ POLYNOMIALS ═══════════════════════════════════════════════
    {
        "id": "po_e1",
        "text": "What is the degree of the polynomial 4x³ - 2x + 7?",
        "options": {"A": "1", "B": "2", "C": "3", "D": "7"},
        "correct": "C",
        "difficulty": "easy",
        "concept": "Polynomials",
        "explanation": "Degree is the highest power of x, which is 3 (from 4x³)",
    },
    {
        "id": "po_m1",
        "text": "Factorize: x² - 7x + 12",
        "options": {"A": "(x-3)(x-4)", "B": "(x+3)(x+4)", "C": "(x-6)(x-2)", "D": "(x-1)(x-12)"},
        "correct": "A",
        "difficulty": "medium",
        "concept": "Polynomials",
        "explanation": "Find two numbers that multiply to 12 and add to -7: -3 and -4 → (x-3)(x-4)",
    },
    {
        "id": "po_h1",
        "text": "If x = 2 is a zero of p(x) = x³ - 2x² + kx - 4, find k.",
        "options": {"A": "2", "B": "3", "C": "-2", "D": "4"},
        "correct": "A",
        "difficulty": "hard",
        "concept": "Polynomials",
        "explanation": "p(2) = 8 - 8 + 2k - 4 = 0 → 2k - 4 = 0 → k = 2",
    },

    # ══ QUADRATIC EQUATIONS ═══════════════════════════════════════
    {
        "id": "qe_e1",
        "text": "Which of the following is a quadratic equation?",
        "options": {"A": "3x + 2 = 0", "B": "x² + 5 = 0", "C": "x³ - 1 = 0", "D": "2/x + 3 = 0"},
        "correct": "B",
        "difficulty": "easy",
        "concept": "Quadratic Equations",
        "explanation": "A quadratic equation has degree 2. Only x² + 5 = 0 has x².",
    },
    {
        "id": "qe_m1",
        "text": "What is the discriminant of 2x² - 5x + 3 = 0?",
        "options": {"A": "1", "B": "-1", "C": "25", "D": "7"},
        "correct": "A",
        "difficulty": "medium",
        "concept": "Quadratic Equations",
        "explanation": "D = b² - 4ac = 25 - 4(2)(3) = 25 - 24 = 1",
    },
    {
        "id": "qe_h1",
        "text": "Solve: 2x² - 7x + 3 = 0",
        "options": {"A": "x = 3, 1/2", "B": "x = -3, 1/2", "C": "x = 3, -1/2", "D": "x = 1, 3"},
        "correct": "A",
        "difficulty": "hard",
        "concept": "Quadratic Equations",
        "explanation": "Factoring: (2x - 1)(x - 3) = 0 → x = 1/2 or x = 3",
    },

    # ══ TRIGONOMETRY ══════════════════════════════════════════════
    {
        "id": "tr_e1",
        "text": "In a right triangle, which ratio is sin θ?",
        "options": {"A": "Adjacent/Hypotenuse", "B": "Opposite/Adjacent", "C": "Opposite/Hypotenuse", "D": "Hypotenuse/Opposite"},
        "correct": "C",
        "difficulty": "easy",
        "concept": "Trigonometry",
        "explanation": "SOH: sin θ = Opposite ÷ Hypotenuse",
    },
    {
        "id": "tr_m1",
        "text": "If sin θ = 5/13, what is cos θ? (θ is acute)",
        "options": {"A": "12/13", "B": "5/12", "C": "13/12", "D": "8/13"},
        "correct": "A",
        "difficulty": "medium",
        "concept": "Trigonometry",
        "explanation": "By Pythagoras: base = √(169-25) = 12 → cos θ = 12/13",
    },
    {
        "id": "tr_h1",
        "text": "The angle of elevation of the top of a 30m pole from a point is 60°. Distance from base (tan 60° = √3)?",
        "options": {"A": "10√3 m", "B": "30√3 m", "C": "10 m", "D": "30 m"},
        "correct": "A",
        "difficulty": "hard",
        "concept": "Trigonometry",
        "explanation": "tan 60° = 30/d → √3 = 30/d → d = 30/√3 = 10√3 m",
    },

    # ══ ARITHMETIC PROGRESSIONS ═══════════════════════════════════
    {
        "id": "ap_e1",
        "text": "What is the common difference in: 3, 7, 11, 15, ...?",
        "options": {"A": "3", "B": "4", "C": "5", "D": "7"},
        "correct": "B",
        "difficulty": "easy",
        "concept": "Arithmetic Progressions",
        "explanation": "d = 7 - 3 = 4 (difference between consecutive terms)",
    },
    {
        "id": "ap_m1",
        "text": "What is the 10th term of the AP: 5, 8, 11, ...?",
        "options": {"A": "30", "B": "32", "C": "35", "D": "29"},
        "correct": "B",
        "difficulty": "medium",
        "concept": "Arithmetic Progressions",
        "explanation": "aₙ = a + (n-1)d = 5 + 9×3 = 5 + 27 = 32",
    },
    {
        "id": "ap_h1",
        "text": "Sum of first 20 terms of AP: 2, 7, 12, ... is:",
        "options": {"A": "950", "B": "990", "C": "1010", "D": "870"},
        "correct": "B",
        "difficulty": "hard",
        "concept": "Arithmetic Progressions",
        "explanation": "S₂₀ = 20/2 × [2(2) + 19(5)] = 10 × [4+95] = 10 × 99 = 990",
    },
]

# ─── Adaptive Quiz Engine ─────────────────────────────────────────────────────
# 5 questions: Q1=medium, then adapt based on each answer
# Correct → go harder; Wrong → go easier
# One question per concept to maximize diagnostic coverage

CONCEPTS = ["Linear Equations", "Polynomials", "Quadratic Equations", "Trigonometry", "Arithmetic Progressions"]

def get_question_by_concept_difficulty(concept: str, difficulty: str, exclude_ids: list) -> Optional[dict]:
    """Fetch a question matching concept + difficulty, not already used."""
    candidates = [
        q for q in QUESTION_BANK
        if q["concept"] == concept
        and q["difficulty"] == difficulty
        and q["id"] not in exclude_ids
    ]
    return random.choice(candidates) if candidates else None


def get_adaptive_question(concept: str, last_was_correct: Optional[bool], last_difficulty: str, exclude_ids: list) -> dict:
    """Return next question using adaptive difficulty adjustment."""
    difficulty_map = {"easy": 0, "medium": 1, "hard": 2}
    reverse_map = {0: "easy", 1: "medium", 2: "hard"}

    if last_was_correct is None:
        next_diff = "medium"  # Start with medium
    else:
        curr_level = difficulty_map.get(last_difficulty, 1)
        if last_was_correct:
            next_level = min(curr_level + 1, 2)  # Go harder
        else:
            next_level = max(curr_level - 1, 0)  # Go easier
        next_diff = reverse_map[next_level]

    # Try preferred difficulty first, fallback to others
    q = get_question_by_concept_difficulty(concept, next_diff, exclude_ids)
    if not q:
        for diff in ["medium", "easy", "hard"]:
            q = get_question_by_concept_difficulty(concept, diff, exclude_ids)
            if q:
                break
    return q


# ─── Pydantic Models ──────────────────────────────────────────────────────────

class NextQuestionRequest(BaseModel):
    concept_index: int           # 0-4: which concept we're on
    last_was_correct: Optional[bool] = None
    last_difficulty: Optional[str] = "medium"
    used_ids: List[str] = []


class QuizSubmitRequest(BaseModel):
    student_id: int
    answers: List[dict]          # [{question_id, selected_option}]


# ─── Routes ───────────────────────────────────────────────────────────────────

@router.get("/questions")
def get_initial_questions():
    """Return the first 5 questions (one per concept, starting medium)."""
    logger.info("Building adaptive quiz - fetching 5 starter questions")
    questions = []
    used_ids = []
    for concept in CONCEPTS:
        q = get_question_by_concept_difficulty(concept, "medium", used_ids)
        if not q:
            q = next(x for x in QUESTION_BANK if x["concept"] == concept)
        used_ids.append(q["id"])
        questions.append({
            "id": q["id"],
            "text": q["text"],
            "options": q["options"],
            "difficulty": q["difficulty"],
            "concept": q["concept"],
        })
    logger.info(f"Returning {len(questions)} starter questions")
    return questions


@router.post("/next-question")
def get_next_question(req: NextQuestionRequest):
    """Adaptive engine: return next question based on last answer performance."""
    if req.concept_index >= len(CONCEPTS):
        return {"done": True}

    concept = CONCEPTS[req.concept_index]
    q = get_adaptive_question(concept, req.last_was_correct, req.last_difficulty or "medium", req.used_ids)

    if not q:
        return {"done": True, "message": "No more questions for this concept"}

    return {
        "done": False,
        "question": {
            "id": q["id"],
            "text": q["text"],
            "options": q["options"],
            "difficulty": q["difficulty"],
            "concept": q["concept"],
        }
    }


@router.post("/submit")
def submit_quiz(request: QuizSubmitRequest, db: Session = Depends(get_db)):
    """Submit all quiz answers, classify student level, persist to DB."""
    logger.info(f"Processing quiz submission for student {request.student_id}")

    student = db.query(Student).filter(Student.id == request.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Build answer lookup
    answer_map = {a["question_id"]: a["selected_option"] for a in request.answers}

    results = []
    counters = {"easy": [0, 0], "medium": [0, 0], "hard": [0, 0]}
    concept_scores = {}

    for q in QUESTION_BANK:
        if q["id"] not in answer_map:
            continue
        selected = answer_map[q["id"]]
        is_correct = selected == q["correct"]
        diff = q["difficulty"]
        concept = q["concept"]

        # Tally by difficulty
        counters[diff][1] += 1
        if is_correct:
            counters[diff][0] += 1

        # Tally by concept
        if concept not in concept_scores:
            concept_scores[concept] = {"correct": 0, "total": 0}
        concept_scores[concept]["total"] += 1
        if is_correct:
            concept_scores[concept]["correct"] += 1

        results.append({
            "question_id": q["id"],
            "selected": selected,
            "correct": q["correct"],
            "is_correct": is_correct,
            "explanation": q["explanation"],
            "concept": concept,
            "difficulty": diff,
        })

        # Persist attempt
        db.add(QuizAttempt(
            student_id=request.student_id,
            question_id=q["id"],
            question_text=q["text"],
            selected_option=selected,
            correct_option=q["correct"],
            is_correct=is_correct,
            concept_tag=concept,
            difficulty=diff,
        ))

    # ── Classification Logic ───────────────────────────────────────────────────
    total_q = len(results)
    total_correct = sum(1 for r in results if r["is_correct"])
    overall_pct = (total_correct / total_q) if total_q > 0 else 0

    easy_pct  = (counters["easy"][0]   / counters["easy"][1])   if counters["easy"][1]   > 0 else 0
    med_pct   = (counters["medium"][0] / counters["medium"][1]) if counters["medium"][1] > 0 else 0
    hard_pct  = (counters["hard"][0]   / counters["hard"][1])   if counters["hard"][1]   > 0 else 0

    logger.info(f"Classification → Easy:{easy_pct:.0%} Med:{med_pct:.0%} Hard:{hard_pct:.0%}")

    if hard_pct >= 0.5 and med_pct >= 0.5:
        level = "Advanced"
    elif med_pct >= 0.5 or (easy_pct >= 0.75 and overall_pct >= 0.5):
        level = "Grade-Level"
    else:
        level = "Foundational"

    mastery_score = round(overall_pct * 100, 1)

    # Identify weak concepts (< 50% in that concept)
    weak_concepts = [
        c for c, s in concept_scores.items()
        if s["total"] > 0 and (s["correct"] / s["total"]) < 0.5
    ]

    # Update student record
    student.level = level
    student.mastery_score = mastery_score
    
    # Update StudentConceptMastery for all concepts attempted
    for concept_name, scores in concept_scores.items():
        concept_id = get_concept_id_by_name(db, concept_name)
        if not concept_id:
            continue
            
        mastery_record = db.query(StudentConceptMastery).filter(
            StudentConceptMastery.student_id == student.id,
            StudentConceptMastery.concept_id == concept_id
        ).first()
        
        is_weak = (scores["correct"] / scores["total"]) < 0.5 if scores["total"] > 0 else False
        
        if mastery_record:
            mastery_record.attempts += scores["total"]
            mastery_record.correct += scores["correct"]
            mastery_record.is_weak = is_weak
            mastery_record.mastery_level = (mastery_record.correct / mastery_record.attempts) if mastery_record.attempts > 0 else 0
        else:
            db.add(StudentConceptMastery(
                student_id=student.id,
                concept_id=concept_id,
                attempts=scores["total"],
                correct=scores["correct"],
                is_weak=is_weak,
                mastery_level=(scores["correct"] / scores["total"]) if scores["total"] > 0 else 0
            ))
            
    db.commit()

    logger.info(f"✅ Student {request.student_id} → {level} | Score: {mastery_score}% | Weak: {weak_concepts}")

    return {
        "level": level,
        "mastery_score": mastery_score,
        "total_correct": total_correct,
        "total_questions": total_q,
        "results": results,
        "concept_scores": concept_scores,
        "weak_concepts": weak_concepts,
        "breakdown": {
            "easy":   f"{counters['easy'][0]}/{counters['easy'][1]}",
            "medium": f"{counters['medium'][0]}/{counters['medium'][1]}",
            "hard":   f"{counters['hard'][0]}/{counters['hard'][1]}",
        },
    }


@router.get("/check-answer/{question_id}/{selected}")
def check_answer(question_id: str, selected: str):
    """Instant answer check for adaptive flow (used between questions)."""
    q = next((x for x in QUESTION_BANK if x["id"] == question_id), None)
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    is_correct = selected == q["correct"]
    return {
        "is_correct": is_correct,
        "correct_option": q["correct"],
        "explanation": q["explanation"],
        "difficulty": q["difficulty"],
        "concept": q["concept"],
    }
