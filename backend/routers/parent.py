from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db

router = APIRouter()

@router.get("/overview/{child_id}")
def get_overview(child_id: int, db: Session = Depends(get_db)):
    return {"message": "Parent overview data"}
