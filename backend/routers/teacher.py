from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_role, User

router = APIRouter()

@router.get("/dashboard")
def get_dashboard(section: str = "8-A", db: Session = Depends(get_db), current_user: User = Depends(require_role(["teacher"]))):
    return {"message": "Teacher dashboard data"}
