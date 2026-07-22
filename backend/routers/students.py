from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import logging

from database import get_db, Student

router = APIRouter()
logger = logging.getLogger(__name__)


class StudentCreate(BaseModel):
    name: str
    grade: Optional[str] = "9"


class StudentResponse(BaseModel):
    id: int
    name: str
    grade: str
    level: Optional[str]
    mastery_score: float

    class Config:
        from_attributes = True


@router.post("/", response_model=StudentResponse)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    logger.info(f"Creating new student: {student.name}")
    db_student = Student(name=student.name, grade=student.grade)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    logger.info(f"✅ Created student with ID: {db_student.id}")
    return db_student


@router.get("/{student_id}", response_model=StudentResponse)
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        logger.warning(f"Student {student_id} not found")
        raise HTTPException(status_code=404, detail="Student not found")
    return student


@router.patch("/{student_id}/level")
def update_level(student_id: int, level: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.level = level
    db.commit()
    logger.info(f"✅ Updated student {student_id} level to: {level}")
    return {"message": "Level updated", "level": level}
