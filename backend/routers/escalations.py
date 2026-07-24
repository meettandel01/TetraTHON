from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Escalation, Student, User
from auth import get_current_user, require_role, User as AuthUser

router = APIRouter()

@router.get("/")
def get_escalations(status: str = "pending", db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["teacher", "admin"]))):
    query = db.query(Escalation, Student, User).join(Student, Escalation.student_id == Student.id).join(User, Student.user_id == User.id)
    if status != "all":
        query = query.filter(Escalation.status == status)
    
    results = query.all()
    escalations = []
    for esc, student, user in results:
        escalations.append({
            "id": esc.id,
            "student_id": esc.student_id,
            "student_name": user.name,
            "student_section": student.section,
            "concept_id": esc.concept_id,
            "doubt_text": esc.doubt_text,
            "status": esc.status,
            "auto_escalated": esc.auto_escalated,
            "ai_confidence": esc.ai_confidence,
            "claimed_by": esc.claimed_by,
            "response_text": esc.response_text,
            "created_at": esc.created_at
        })
    return escalations

@router.post("/{escalation_id}/claim")
def claim_escalation(escalation_id: int, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["teacher", "admin"]))):
    esc = db.query(Escalation).filter(Escalation.id == escalation_id).first()
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")
    
    esc.status = "claimed"
    # Find teacher id for current_user
    # Actually, claimed_by is foreign key to teachers.id, but let's just use user.id for simplicity if teachers model isn't strictly used, wait, let's check Teacher model.
    # We should query Teacher
    from database import Teacher
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if teacher:
        esc.claimed_by = teacher.id
    db.commit()
    return {"message": "Escalation claimed successfully"}

from pydantic import BaseModel
class ResponseModel(BaseModel):
    response_text: str

@router.post("/{escalation_id}/respond")
def respond_escalation(escalation_id: int, data: ResponseModel, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["teacher", "admin"]))):
    esc = db.query(Escalation).filter(Escalation.id == escalation_id).first()
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")
    
    esc.status = "resolved"
    esc.response_text = data.response_text
    db.commit()
    return {"message": "Escalation resolved successfully"}
