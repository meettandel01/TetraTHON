from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db, Student, Badge, StudentBadge, XpTransaction
from pydantic import BaseModel
from auth import get_current_user, User

router = APIRouter()

class XpRequest(BaseModel):
    student_id: int
    amount: int
    source: str

@router.post("/award")
def award_xp(req: XpRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    student.xp += req.amount
    
    tx = XpTransaction(student_id=student.id, amount=req.amount, source=req.source)
    db.add(tx)
    db.commit()
    
    return {"message": "XP awarded", "new_xp": student.xp}

@router.get("/{student_id}")
def get_xp(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"xp": student.xp, "level": student.level}

@router.get("/badges/{student_id}")
def get_badges(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    all_badges = db.query(Badge).all()
    earned_badges = db.query(StudentBadge).filter(StudentBadge.student_id == student_id).all()
    earned_ids = {b.badge_id for b in earned_badges}
    
    res = []
    for b in all_badges:
        res.append({
            "id": b.id,
            "code": b.code,
            "name": b.name,
            "description": b.description,
            "icon": b.icon,
            "earned": b.id in earned_ids
        })
    return res
