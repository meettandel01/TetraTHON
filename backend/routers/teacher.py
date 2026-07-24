from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Student, User
from auth import get_current_user, require_role, User as AuthUser

router = APIRouter()

@router.get("/dashboard")
def get_dashboard(section: str = "8-A", db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["teacher"]))):
    return {"message": "Teacher dashboard data"}

@router.get("/roster")
def get_roster(section: str = None, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["teacher", "admin"]))):
    query = db.query(Student, User).join(User, Student.user_id == User.id)
    if section:
        query = query.filter(Student.section == section)
    
    results = query.all()
    roster = []
    for student, user in results:
        roster.append({
            "id": student.id,
            "name": user.name,
            "section": student.section,
            "level": student.level,
            "mastery_score": student.mastery_score,
            "xp": student.xp,
            "streak": student.streak
        })
    return roster
