from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db

router = APIRouter()

@router.get("/dashboard")
def get_dashboard(section: str = "8-A", db: Session = Depends(get_db)):
    return {"message": "Teacher dashboard data"}
