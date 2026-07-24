from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Student, StudentConceptMastery

router = APIRouter()

@router.get("/{student_id}")
def get_report_card(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    masteries = db.query(StudentConceptMastery).filter(StudentConceptMastery.student_id == student_id).all()
    
    # Calculate grade
    overall_mastery = sum([m.mastery_level for m in masteries]) / len(masteries) if masteries else 0
    grade = "A" if overall_mastery >= 0.8 else "B" if overall_mastery >= 0.6 else "C" if overall_mastery >= 0.4 else "Needs Support"
    
    concept_breakdown = [
        {"concept": m.concept.name, "score": round(m.mastery_level * 100), "status": "Mastered" if m.mastery_level >= 0.8 else "Developing"}
        for m in masteries
    ]
    
    return {
        "student_name": student.user.name,
        "section": student.section,
        "grade": grade,
        "overall_score": round(overall_mastery * 100),
        "concepts": concept_breakdown,
        "remarks": "Shows excellent progress in algebraic concepts."
    }
