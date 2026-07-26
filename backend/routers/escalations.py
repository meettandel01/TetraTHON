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
        teacher_user_id = None
        if esc.claimed_by:
            from database import Teacher
            t_obj = db.query(Teacher).filter(Teacher.id == esc.claimed_by).first()
            if t_obj:
                teacher_user_id = t_obj.user_id

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
            "claimed_by_user_id": teacher_user_id,
            "response_text": esc.response_text,
            "created_at": esc.created_at
        })
    return escalations

from pydantic import BaseModel as EscBaseModel

class CreateEscalationRequest(EscBaseModel):
    student_id: int
    doubt_text: str
    concept_id: str = None
    ai_confidence: float = None

@router.post("/")
def create_escalation(req: CreateEscalationRequest, db: Session = Depends(get_db), current_user: AuthUser = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    esc = Escalation(
        student_id=req.student_id,
        doubt_text=req.doubt_text,
        concept_id=req.concept_id,
        ai_confidence=req.ai_confidence,
        auto_escalated=False,
        status="pending"
    )
    db.add(esc)
    db.commit()
    db.refresh(esc)
    return {"id": esc.id, "message": "Escalation created successfully"}

@router.post("/{escalation_id}/claim")
def claim_escalation(escalation_id: int, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["teacher", "admin"]))):
    esc = db.query(Escalation).filter(Escalation.id == escalation_id).first()
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")
    
    esc.status = "claimed"
    from database import Teacher
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if teacher:
        esc.claimed_by = teacher.id
    else:
        # Fallback if teacher record not found, store user_id
        esc.claimed_by = current_user.id
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
    
    from database import Doubt
    doubt = db.query(Doubt).filter(Doubt.student_id == esc.student_id, Doubt.question_text == esc.doubt_text).first()
    if doubt:
        doubt.resolved = True
        doubt.response_text = "Teacher Response: " + data.response_text
        
    db.commit()
    return {"message": "Escalation resolved successfully"}

@router.post("/{escalation_id}/regenerate-draft")
async def regenerate_draft(escalation_id: int, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["teacher", "admin"]))):
    esc = db.query(Escalation).filter(Escalation.id == escalation_id).first()
    if not esc:
        raise HTTPException(status_code=404, detail="Escalation not found")
    
    from routers.doubts import get_gemini_response
    from database import Concept
    all_concepts = db.query(Concept).all()
    taxonomy_names = [c.name for c in all_concepts]
    
    result = await get_gemini_response(esc.doubt_text, "direct", taxonomy_names)
    draft = result["response"]
    if not draft or "AI Tutor Unavailable" in draft or len(draft) < 20:
        draft = f"Hello! I saw your doubt regarding '{esc.doubt_text}'. Let's solve this step by step: First, let's identify what we are given in the problem and apply the appropriate formula."
    
    return {"draft": draft, "message": "Draft regenerated successfully"}
