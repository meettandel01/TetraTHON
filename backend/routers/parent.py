from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Student, Session as LearningSession, Doubt
from auth import get_current_user, require_role, User as AuthUser
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/overview/{child_id}")
def get_overview(child_id: int, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["parent", "admin"]))):
    student = db.query(Student).filter(Student.id == child_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Child not found")
        
    sessions = db.query(LearningSession).filter(LearningSession.student_id == child_id).all()
    doubts = db.query(Doubt).filter(Doubt.student_id == child_id).all()
    
    total_time = sum(s.time_spent_seconds for s in sessions)
    
    return {
        "student_name": student.user.name if student.user else "Unknown",
        "level": student.level,
        "mastery_score": student.mastery_score,
        "xp": student.xp,
        "streak": student.streak,
        "total_learning_time_seconds": total_time,
        "doubts_asked": len(doubts),
        "doubts_resolved": len([d for d in doubts if d.resolved])
    }

@router.get("/digest/{child_id}")
def get_digest(child_id: int, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["parent", "admin"]))):
    # Simulated Weekly Digest
    return {
        "week": "May 1 - May 7",
        "highlights": [
            "Mastered 'Quadratic Equations' ahead of schedule.",
            "Struggled slightly with 'Trigonometric Identities' but improved after 3 practice sessions.",
            "Asked great Socratic questions about real-world applications of parabolas."
        ],
        "recommendation": "Encourage them to review Trigonometry basics for 15 mins this weekend."
    }

@router.get("/alerts/{child_id}")
def get_alerts(child_id: int, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["parent", "admin"]))):
    # Simulated Alerts
    return [
        {"id": 1, "type": "test", "message": "Upcoming Mid-Term in Mathematics", "date": (datetime.utcnow() + timedelta(days=5)).isoformat()},
        {"id": 2, "type": "teacher", "message": "Teacher Aditi escalated a doubt for review. Please check in with your child.", "date": (datetime.utcnow() - timedelta(days=1)).isoformat()}
    ]
