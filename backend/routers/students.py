from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import logging

from database import get_db, Student, User
import logging

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


@router.post("/")
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    logger.info(f"Creating new student: {student.name}")
    db_user = User(role="student", name=student.name)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    db_student = Student(user_id=db_user.id, grade=student.grade)
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    logger.info(f"✅ Created student with ID: {db_student.id}")
    return {
        "id": db_student.id,
        "name": db_user.name,
        "grade": db_student.grade,
        "level": db_student.level,
        "mastery_score": db_student.mastery_score
    }


@router.get("/{student_id}")
def get_student(student_id: int, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        logger.warning(f"Student {student_id} not found")
        raise HTTPException(status_code=404, detail="Student not found")
    user = db.query(User).filter(User.id == student.user_id).first()
    return {
        "id": student.id,
        "name": user.name if user else "Unknown",
        "grade": student.grade,
        "level": student.level,
        "mastery_score": student.mastery_score
    }


@router.patch("/{student_id}/level")
def update_level(student_id: int, level: str, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    student.level = level
    db.commit()
    logger.info(f"✅ Updated student {student_id} level to: {level}")
    return {"message": "Level updated", "level": level}
