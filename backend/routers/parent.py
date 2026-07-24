from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_role, User

router = APIRouter()

@router.get("/overview/{child_id}")
def get_overview(child_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_role(["parent"]))):
    return {"message": "Parent overview data"}
