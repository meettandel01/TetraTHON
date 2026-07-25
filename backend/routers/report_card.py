from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Student, StudentConceptMastery, Doubt
from auth import get_current_user, User

router = APIRouter()

@router.get("/{student_id}")
def get_report_card(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    masteries = db.query(StudentConceptMastery).filter(StudentConceptMastery.student_id == student_id).all()
    
    overall_mastery = sum([m.mastery_level for m in masteries]) / len(masteries) if masteries else 0
    grade = student.grade or "Unclassified"
    overall_grade = "A" if overall_mastery >= 0.8 else "B" if overall_mastery >= 0.6 else "C" if overall_mastery >= 0.4 else "Needs Support"
    
    concept_status = {
        m.concept.name: "Mastered" if m.mastery_level >= 0.8 else "Developing"
        for m in masteries
    }
    
    strengths = [m.concept.name for m in masteries if m.mastery_level >= 0.7]
    weaknesses = [m.concept.name for m in masteries if m.mastery_level < 0.5]
    
    doubts = db.query(Doubt).filter(Doubt.student_id == student_id).all()
    resolved_doubts = len([d for d in doubts if d.resolved])
    
    if overall_mastery >= 0.8:
        remarks = f"{student.user.name} has demonstrated strong mastery across {len(strengths)} topics. Keep challenging with advanced practice."
    elif overall_mastery >= 0.6:
        remarks = f"{student.user.name} is making solid progress. Consistent practice on developing concepts will help reach advanced mastery."
    elif overall_mastery >= 0.4:
        remarks = f"{student.user.name} is building foundational skills. Focus recommended on {', '.join(weaknesses[:2]) if weaknesses else 'core concepts'}."
    else:
        remarks = f"{student.user.name} requires targeted intervention and support in foundational concepts."
    
    return {
        "student_name": student.user.name,
        "section": student.section,
        "grade": grade,
        "mastery_percentage": round(overall_mastery * 100),
        "overall_grade": overall_grade,
        "doubt_stats": {"total": len(doubts), "resolved": resolved_doubts, "unresolved": len(doubts) - resolved_doubts},
        "concept_status": concept_status,
        "strengths": strengths,
        "weaknesses": weaknesses,
        "remarks": remarks
    }
