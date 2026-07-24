from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_role, User

router = APIRouter()

@router.get("/")
def get_escalations(status: str = "pending", db: Session = Depends(get_db), current_user: User = Depends(require_role(["teacher", "admin"]))):
    return []
