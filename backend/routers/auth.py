from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from pydantic import BaseModel

from database import get_db, User, Student, Teacher, Parent, Admin
from auth import (
    verify_pin,
    create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    get_current_user,
    check_rate_limit,
    record_failed_attempt,
    clear_failed_attempts
)

router = APIRouter()

class PinLoginRequest(BaseModel):
    student_id: int
    pin: str

class SsoLoginRequest(BaseModel):
    role: str
    provider: str

class OtpLoginRequest(BaseModel):
    parent_id: int
    otp: str

@router.post("/login/pin")
def login_pin(req: PinLoginRequest, db: Session = Depends(get_db)):
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    user = db.query(User).filter(User.id == student.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    check_rate_limit(db, user.id)
    
    if not verify_pin(req.pin, user.pin_hash):
        record_failed_attempt(db, user.id)
        raise HTTPException(status_code=401, detail="Incorrect PIN")
        
    clear_failed_attempts(db, user.id)
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "role": user.role,
            "name": user.name,
            "student_id": student.id,
            "section": student.section,
            "level": student.level
        }
    }

@router.post("/login/sso")
def login_sso(req: SsoLoginRequest, db: Session = Depends(get_db)):
    # Simulated SSO login
    if req.role == "teacher":
        teacher = db.query(Teacher).first()
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        user = teacher.user
    elif req.role == "admin":
        admin = db.query(Admin).first()
        if not admin:
            raise HTTPException(status_code=404, detail="Admin not found")
        user = admin.user
    else:
        raise HTTPException(status_code=400, detail="Invalid role for SSO")
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "role": user.role,
            "name": user.name
        }
    }

@router.post("/login/otp")
def login_otp(req: OtpLoginRequest, db: Session = Depends(get_db)):
    # Simulated OTP login
    parent = db.query(Parent).filter(Parent.id == req.parent_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
        
    user = parent.user
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.id, "role": user.role}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "role": user.role,
            "name": user.name,
            "parent_id": parent.id,
            "child_id": parent.child_id
        }
    }

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "role": current_user.role,
        "name": current_user.name
    }
