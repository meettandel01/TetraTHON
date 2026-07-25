from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db, Student, Badge, StudentBadge, XpTransaction
from pydantic import BaseModel
from auth import get_current_user, User

router = APIRouter()

class XpRequest(BaseModel):
    student_id: int
    amount: int
    source: str

def check_and_award_badges(student_id: int, db: Session):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return
        
    earned_badges = db.query(StudentBadge).filter(StudentBadge.student_id == student_id).all()
    earned_ids = {b.badge_id for b in earned_badges}
    all_badges = db.query(Badge).all()
    
    # 1. First Steps: First lesson completed
    from database import Session as DBSession
    from database import QuizAttempt, Doubt, StudentConceptMastery
    
    sessions_count = db.query(DBSession).filter(DBSession.student_id == student_id, DBSession.completed == True).count()
    if sessions_count >= 1:
        _award_badge_by_code(student_id, 'b1', all_badges, earned_ids, db)
    
    # 2. Streak Starter: streak >= 3
    if student.streak >= 3:
        _award_badge_by_code(student_id, 'b2', all_badges, earned_ids, db)
        
    # 3. Problem Solver: >=10 practice questions answered correctly
    # For now, just check attempts. We don't have practice_attempts separate from quiz_attempts, let's just count total correct attempts in mastery
    from sqlalchemy.sql import func
    correct_attempts = db.query(func.sum(StudentConceptMastery.correct)).filter(StudentConceptMastery.student_id == student_id).scalar() or 0
    if correct_attempts >= 10:
        _award_badge_by_code(student_id, 'b3', all_badges, earned_ids, db)
        
    # 4. Doubt Buster: >=5 doubts asked
    doubts_count = db.query(Doubt).filter(Doubt.student_id == student_id).count()
    if doubts_count >= 5:
        _award_badge_by_code(student_id, 'b4', all_badges, earned_ids, db)
        
    # 5. Concept Master: Any concept mastery >= 0.90
    high_mastery = db.query(StudentConceptMastery).filter(StudentConceptMastery.student_id == student_id, StudentConceptMastery.mastery_level >= 0.90).first()
    if high_mastery:
        _award_badge_by_code(student_id, 'b5', all_badges, earned_ids, db)
        
    # 6. Week Warrior: >=5 sessions in 7 days
    from datetime import timedelta
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_sessions = db.query(DBSession).filter(
        DBSession.student_id == student_id,
        DBSession.completed == True,
        DBSession.started_at >= seven_days_ago
    ).count()
    if recent_sessions >= 5:
        _award_badge_by_code(student_id, 'b6', all_badges, earned_ids, db)

def _award_badge_by_code(student_id: int, code: str, all_badges, earned_ids, db: Session):
    badge = next((b for b in all_badges if b.code == code), None)
    if badge and badge.id not in earned_ids:
        new_badge = StudentBadge(student_id=student_id, badge_id=badge.id)
        db.add(new_badge)
        db.commit()
        earned_ids.add(badge.id)

def update_streak(student_id: int, db: Session):
    """Update student's daily streak based on activity."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        return
    
    today = datetime.utcnow().date()
    if student.streak_last_date:
        last_date = student.streak_last_date.date() if isinstance(student.streak_last_date, datetime) else student.streak_last_date
        delta = (today - last_date).days
        if delta == 0:
            return  # Already counted today
        elif delta == 1:
            student.streak += 1  # Continue streak
        else:
            student.streak = 1  # Reset streak
    else:
        student.streak = 1  # First activity
    
    student.streak_last_date = datetime.utcnow()
    db.commit()

@router.post("/award")
def award_xp(req: XpRequest, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    student.xp += req.amount
    
    tx = XpTransaction(student_id=student.id, amount=req.amount, source=req.source)
    db.add(tx)
    db.commit()
    
    return {"message": "XP awarded", "new_xp": student.xp}

@router.get("/{student_id}")
def get_xp(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    # Get earned badges
    earned_badges = db.query(StudentBadge).filter(StudentBadge.student_id == student_id).all()
    all_badges = db.query(Badge).all()
    earned_ids = {b.badge_id for b in earned_badges}
    badges = []
    for b in all_badges:
        badges.append({
            "id": b.id, "code": b.code, "name": b.name,
            "description": b.description, "icon": b.icon,
            "earned": b.id in earned_ids
        })
    from database import GamificationSettings
    settings = db.query(GamificationSettings).first()
    daily_cap = settings.daily_xp_cap if settings else 500
    return {
        "xp": student.xp, 
        "level": student.level, 
        "streak": student.streak,
        "mastery_score": round(student.mastery_score, 1),
        "archetype": student.archetype,
        "badges": badges,
        "daily_xp_cap": daily_cap
    }

@router.get("/badges/{student_id}")
def get_badges(student_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    all_badges = db.query(Badge).all()
    earned_badges = db.query(StudentBadge).filter(StudentBadge.student_id == student_id).all()
    earned_ids = {b.badge_id for b in earned_badges}
    
    res = []
    for b in all_badges:
        res.append({
            "id": b.id,
            "code": b.code,
            "name": b.name,
            "description": b.description,
            "icon": b.icon,
            "earned": b.id in earned_ids
        })
    return res
