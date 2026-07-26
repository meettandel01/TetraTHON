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
    clear_failed_attempts,
    get_pin_hash
)

router = APIRouter()

class PinLoginRequest(BaseModel):
    email_or_id: str
    pin: str

class RegisterRequest(BaseModel):
    name: str
    email: str
    role: str
    pin: str

class SsoLoginRequest(BaseModel):
    role: str
    provider: str

class OtpLoginRequest(BaseModel):
    parent_id: int
    otp: str

@router.post("/login/pin")
def login_pin(req: PinLoginRequest, db: Session = Depends(get_db)):
    user = None
    if "@" in req.email_or_id:
        user = db.query(User).filter(User.email == req.email_or_id).first()
    else:
        try:
            uid = int(req.email_or_id)
            student = db.query(Student).filter(Student.id == uid).first()
            if student:
                user = db.query(User).filter(User.id == student.user_id).first()
            if not user:
                user = db.query(User).filter(User.id == uid).first()
        except ValueError:
            pass

    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    check_rate_limit(db, user.id)
    
    if not verify_pin(req.pin, user.pin_hash):
        record_failed_attempt(db, user.id)
        raise HTTPException(status_code=401, detail="Incorrect PIN")
        
    clear_failed_attempts(db, user.id)
    return _generate_auth_response(user, db)

def _generate_auth_response(user: User, db: Session):
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id), "role": user.role}, expires_delta=access_token_expires
    )
    
    user_data = {
        "id": user.id,
        "role": user.role,
        "name": user.name
    }
    
    if user.role == "student":
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if student:
            teacher_name = "your teacher"
            if student.section:
                sec_t = db.query(Teacher, User.name).join(User, Teacher.user_id == User.id).filter(Teacher.sections.contains(student.section)).first()
                if sec_t:
                    teacher_name = sec_t[1]
            user_data.update({"student_id": student.id, "section": student.section, "level": student.level, "teacher_name": teacher_name})
    elif user.role == "teacher":
        teacher = db.query(Teacher).filter(Teacher.user_id == user.id).first()
        if teacher:
            user_data.update({"teacher_id": teacher.id, "subject": teacher.subject})
    elif user.role == "parent":
        parent = db.query(Parent).filter(Parent.user_id == user.id).first()
        if parent:
            user_data.update({"parent_id": parent.id, "child_id": parent.child_id})
    elif user.role == "admin":
        admin = db.query(Admin).filter(Admin.user_id == user.id).first()
        if admin:
            user_data.update({"admin_id": admin.id})
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user_data
    }

@router.post("/register")
def register(req: RegisterRequest, db: Session = Depends(get_db)):
    if not req.pin.isdigit() or len(req.pin) < 4 or len(req.pin) > 6:
        raise HTTPException(status_code=400, detail="PIN must be 4 to 6 digits")

    existing = db.query(User).filter(User.email == req.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
        
    user = User(
        role=req.role,
        name=req.name,
        email=req.email,
        pin_hash=get_pin_hash(req.pin)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    if req.role == "student":
        student = Student(user_id=user.id, section="A", grade="8", level="Foundational")
        db.add(student)
    elif req.role == "teacher":
        teacher = Teacher(user_id=user.id, subject="Mathematics")
        db.add(teacher)
    elif req.role == "parent":
        student = db.query(Student).first()
        child_id = student.id if student else 1
        parent = Parent(user_id=user.id, child_id=child_id)
        db.add(parent)
    elif req.role == "admin":
        admin = Admin(user_id=user.id, role_title="Administrator")
        db.add(admin)
        
    db.commit()
    return {"message": "Registration successful"}

@router.post("/login/sso")
def login_sso(req: SsoLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.role == req.role).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"No user found for role: {req.role}")
    return _generate_auth_response(user, db)

@router.post("/login/otp")
def login_otp(req: OtpLoginRequest, db: Session = Depends(get_db)):
    parent = db.query(Parent).filter((Parent.id == req.parent_id) | (Parent.child_id == req.parent_id)).first()
    if not parent:
        user = db.query(User).filter(User.role == "parent").first()
    else:
        user = db.query(User).filter(User.id == parent.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Parent user not found")
    return _generate_auth_response(user, db)

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    base_user = {
        "id": current_user.id,
        "role": current_user.role,
        "name": current_user.name
    }
    if current_user.role == "student":
        student = db.query(Student).filter(Student.user_id == current_user.id).first()
        if student:
            base_user.update({
                "student_id": student.id,
                "section": student.section,
                "level": student.level
            })
    elif current_user.role == "parent":
        parent = db.query(Parent).filter(Parent.user_id == current_user.id).first()
        if parent:
            base_user.update({
                "parent_id": parent.id,
                "child_id": parent.child_id
            })
    return base_user

class ProfileUpdateRequest(BaseModel):
    name: str

@router.put("/profile")
def update_profile(req: ProfileUpdateRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not req.name.strip():
        raise HTTPException(status_code=400, detail="Name cannot be empty")
        
    current_user.name = req.name.strip()
    db.commit()
    db.refresh(current_user)
    
    return {"message": "Profile updated", "name": current_user.name}

@router.post("/logout")
def logout(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    clear_failed_attempts(db, current_user.id)
    return {"message": "Successfully logged out"}
