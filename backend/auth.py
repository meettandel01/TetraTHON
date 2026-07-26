import os
from datetime import datetime, timedelta
from typing import Optional, List
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
import jwt
import bcrypt
from sqlalchemy.orm import Session
from database import get_db, User, LoginAttempt

# Security Configuration
SECRET_KEY = os.getenv("SECRET_KEY", "tetra-super-secret-key-123456789")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 days

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login/pin")

def verify_pin(plain_pin: str, hashed_pin: str) -> bool:
    if not hashed_pin:
        return False
    return bcrypt.checkpw(plain_pin.encode('utf-8'), hashed_pin.encode('utf-8'))

def get_pin_hash(pin: str) -> str:
    return bcrypt.hashpw(pin.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except jwt.PyJWTError:
        raise credentials_exception
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return user

def require_role(allowed_roles: List[str]):
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted"
            )
        return current_user
    return role_checker

def check_rate_limit(db: Session, user_id: int):
    attempt = db.query(LoginAttempt).filter(LoginAttempt.user_id == user_id).first()
    
    if attempt:
        if attempt.locked_until and attempt.locked_until > datetime.utcnow():
            raise HTTPException(
                status_code=429,
                detail=f"Account locked until {attempt.locked_until}. Too many attempts."
            )
        
        # Reset if last attempt was more than 15 mins ago
        if attempt.last_attempt_at < datetime.utcnow() - timedelta(minutes=15):
            attempt.attempt_count = 0
            attempt.locked_until = None
            db.commit()

def record_failed_attempt(db: Session, user_id: int):
    attempt = db.query(LoginAttempt).filter(LoginAttempt.user_id == user_id).first()
    if not attempt:
        attempt = LoginAttempt(user_id=user_id, attempt_count=1)
        db.add(attempt)
    else:
        attempt.attempt_count += 1
        
    if attempt.attempt_count >= 5:
        attempt.locked_until = datetime.utcnow() + timedelta(minutes=15)
        
    attempt.last_attempt_at = datetime.utcnow()
    db.commit()

def clear_failed_attempts(db: Session, user_id: int):
    attempt = db.query(LoginAttempt).filter(LoginAttempt.user_id == user_id).first()
    if attempt:
        attempt.attempt_count = 0
        attempt.locked_until = None
        db.commit()
