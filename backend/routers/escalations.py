from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db

router = APIRouter()

@router.get("/")
def get_escalations(status: str = "pending", db: Session = Depends(get_db)):
    return []
