from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db

router = APIRouter()

@router.get("/compliance")
def get_compliance(db: Session = Depends(get_db)):
    return {"message": "Admin compliance data"}
