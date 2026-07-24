from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from auth import get_current_user, require_role, User

router = APIRouter()

@router.get("/compliance")
def get_compliance(db: Session = Depends(get_db), current_user: User = Depends(require_role(["admin"]))):
    return {"message": "Admin compliance data"}
