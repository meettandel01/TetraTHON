from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Student, Session as LearningSession, Doubt, Escalation, ParentSettings, Parent, StudentConceptMastery, Concept, ParentMessage, Teacher
from auth import get_current_user, require_role, User as AuthUser
from datetime import datetime, timedelta
from pydantic import BaseModel

router = APIRouter()

class SettingsRequest(BaseModel):
    whatsapp_digest: bool
    email_alerts: bool
    digest_frequency: str

@router.get("/overview/{child_id}")
def get_overview(child_id: int, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["parent", "admin"]))):
    student = db.query(Student).filter(Student.id == child_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Child not found")
        
    sessions = db.query(LearningSession).filter(LearningSession.student_id == child_id).all()
    doubts = db.query(Doubt).filter(Doubt.student_id == child_id).all()
    
    total_time = sum(s.time_spent_seconds for s in sessions)
    
    teacher_name = "Mathematics Teacher"
    if student.section:
        from database import User as DBUser
        teachers = db.query(Teacher, DBUser).join(DBUser, Teacher.user_id == DBUser.id).all()
        for t, u in teachers:
            if t.sections and student.section in t.sections:
                teacher_name = u.name
                break
    
    return {
        "student_name": student.user.name if student.user else "Unknown",
        "teacher_name": teacher_name,
        "current_week_label": f"{(datetime.utcnow() - timedelta(days=7)).strftime('%b %d')} - {datetime.utcnow().strftime('%b %d')}",
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
    student = db.query(Student).filter(Student.id == child_id).first()
    student_name = student.user.name if student and student.user else "Student"
    
    teacher_name = "Mathematics Teacher"
    if student and student.section:
        from database import User as DBUser
        teachers = db.query(Teacher, DBUser).join(DBUser, Teacher.user_id == DBUser.id).all()
        for t, u in teachers:
            if t.sections and student.section in t.sections:
                teacher_name = u.name
                break

    week_ago = datetime.utcnow() - timedelta(days=7)
    sessions = db.query(LearningSession).filter(LearningSession.student_id == child_id, LearningSession.started_at >= week_ago).all()
    doubts = db.query(Doubt).filter(Doubt.student_id == child_id, Doubt.created_at >= week_ago).all()
    
    masteries = db.query(StudentConceptMastery).filter(StudentConceptMastery.student_id == child_id).all()
    high_mastery = [m for m in masteries if m.mastery_level >= 0.8]
    low_mastery = [m for m in masteries if m.mastery_level < 0.5]
    
    highlights = []
    if high_mastery:
        highlights.append(f"Mastered '{high_mastery[0].concept.name}' this week!")
    if low_mastery:
        highlights.append(f"Practiced '{low_mastery[0].concept.name}' and making progress.")
    if len(sessions) >= 3:
        highlights.append(f"Great consistency with {len(sessions)} sessions completed this week.")
    
    if low_mastery:
        rec = f"Encourage them to review {low_mastery[0].concept.name} over the weekend."
    elif high_mastery:
        rec = f"Great work this week! Encourage them to try advanced practice problems in {high_mastery[0].concept.name}."
    else:
        rec = f"Encourage a consistent 15-minute daily practice routine."
        
    return {
        "student_name": student_name,
        "teacher_name": teacher_name,
        "week": f"{(datetime.utcnow() - timedelta(days=7)).strftime('%b %d')} - {datetime.utcnow().strftime('%b %d')}",
        "highlights": highlights,
        "recommendation": rec
    }

@router.get("/alerts/{child_id}")
def get_alerts(child_id: int, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["parent", "admin"]))):
    alerts = []
    
    # Check pending escalations
    escalations = db.query(Escalation).filter(Escalation.student_id == child_id, Escalation.status == "pending").all()
    for esc in escalations:
        alerts.append({
            "id": esc.id,
            "type": "escalation",
            "message": f"A doubt regarding '{esc.doubt_text[:30]}...' was escalated for review. Please check in with your child.",
            "date": esc.created_at.isoformat()
        })
        
    # Check inactivity
    three_days_ago = datetime.utcnow() - timedelta(days=3)
    recent_session = db.query(LearningSession).filter(LearningSession.student_id == child_id, LearningSession.started_at >= three_days_ago).first()
    if not recent_session:
        alerts.append({
            "type": "inactivity",
            "message": "No learning sessions in the last 3 days. Encourage a short session today!",
            "date": datetime.utcnow().isoformat()
        })
        
    # Check weak concepts
    weak_mastery = db.query(StudentConceptMastery).filter(StudentConceptMastery.student_id == child_id, StudentConceptMastery.mastery_level < 0.5).all()
    for m in weak_mastery:
        alerts.append({
            "type": "weak_area",
            "message": f"Student is struggling with '{m.concept.name}'. Needs more practice.",
            "date": m.last_attempted.isoformat() if m.last_attempted else datetime.utcnow().isoformat()
        })
        
    return alerts

@router.get("/settings/{child_id}")
def get_settings(child_id: int, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["parent", "admin"]))):
    parent = db.query(Parent).filter(Parent.child_id == child_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found for child")
    settings = db.query(ParentSettings).filter(ParentSettings.parent_id == parent.id).first()
    if not settings:
        settings = ParentSettings(parent_id=parent.id)
        db.add(settings)
        db.commit()
        db.refresh(settings)
        
    return {
        "whatsapp_digest": settings.whatsapp_digest,
        "email_alerts": settings.email_alerts,
        "digest_frequency": settings.digest_frequency
    }

@router.post("/settings/{child_id}")
def update_settings(child_id: int, request: SettingsRequest, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["parent", "admin"]))):
    parent = db.query(Parent).filter(Parent.child_id == child_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
        
    settings = db.query(ParentSettings).filter(ParentSettings.parent_id == parent.id).first()
    if not settings:
        settings = ParentSettings(parent_id=parent.id)
        db.add(settings)
        
    settings.whatsapp_digest = request.whatsapp_digest
    settings.email_alerts = request.email_alerts
    settings.digest_frequency = request.digest_frequency
    
    db.commit()
    return {"message": "Settings updated"}

class MessageRequest(BaseModel):
    message: str

@router.post("/message/{child_id}")
def message_teacher(child_id: int, request: MessageRequest, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["parent", "admin"]))):
    parent = db.query(Parent).filter(Parent.child_id == child_id).first()
    if not parent:
        raise HTTPException(status_code=404, detail="Parent not found")
        
    student = db.query(Student).filter(Student.id == child_id).first()
    target_teacher = None
    if student and student.section:
        teachers = db.query(Teacher).all()
        for t in teachers:
            if t.sections and student.section in t.sections:
                target_teacher = t
                break
                
    if not target_teacher:
        target_teacher = db.query(Teacher).first()
        
    if target_teacher:
        msg = ParentMessage(parent_id=parent.id, teacher_id=target_teacher.id, content=request.message)
        db.add(msg)
        db.commit()
        
    print(f"Parent {parent.id} sent message regarding child {child_id}: {request.message}")
    return {"message": "Message sent"}
