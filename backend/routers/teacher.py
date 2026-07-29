from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import case, func
from database import get_db, Student, User, Escalation, Session as LearningSession, StudentConceptMastery, Concept, QuizAttempt, Chapter, ContentItem, ParentMessage, Parent, Teacher
from auth import get_current_user, require_role, User as AuthUser
from datetime import datetime, date

router = APIRouter()

@router.get("/messages")
def get_teacher_messages(db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["teacher", "admin"]))):
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if not teacher:
        return []
        
    messages = db.query(ParentMessage).filter(ParentMessage.teacher_id == teacher.id).order_by(ParentMessage.created_at.desc()).all()
    
    res = []
    for m in messages:
        parent = db.query(Parent).filter(Parent.id == m.parent_id).first()
        student_name = "Unknown"
        parent_name = "Parent"
        if parent:
            parent_user = db.query(User).filter(User.id == parent.user_id).first()
            if parent_user:
                parent_name = parent_user.name
            student = db.query(Student).filter(Student.id == parent.child_id).first()
            if student:
                student_user = db.query(User).filter(User.id == student.user_id).first()
                if student_user:
                    student_name = student_user.name
                    
        res.append({
            "id": m.id,
            "parent_name": parent_name,
            "student_name": student_name,
            "content": m.content,
            "is_read": m.is_read,
            "created_at": m.created_at.isoformat()
        })
    return res

@router.get("/sections")
def get_teacher_sections(db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["teacher", "admin"]))):
    from database import Teacher
    import json
    teacher = db.query(Teacher).filter(Teacher.user_id == current_user.id).first()
    if teacher and teacher.sections:
        try:
            sections = json.loads(teacher.sections)
            return {"sections": sections}
        except:
            return {"sections": [teacher.sections]}
    distinct_sections = db.query(Student.section).distinct().all()
    sections = [s[0] for s in distinct_sections if s[0]]
    return {"sections": sections if sections else ["8-A"]}

@router.get("/dashboard")
def get_dashboard(section: str, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["teacher"]))):
    students = db.query(Student).filter(Student.section == section).all()
    student_ids = [s.id for s in students]
    total_students = len(students)
    avg_mastery = sum(s.mastery_score for s in students) / total_students if total_students > 0 else 0
    
    today = date.today()
    active_today = db.query(LearningSession.student_id).filter(
        LearningSession.student_id.in_(student_ids),
        LearningSession.started_at >= today
    ).distinct().count() if student_ids else 0

    pending_escalations = db.query(Escalation).filter(
        Escalation.student_id.in_(student_ids),
        Escalation.status == "pending"
    ).count() if student_ids else 0

    level_dist = {"Foundational": 0, "Grade-Level": 0, "Advanced": 0, "Unclassified": 0}
    for s in students:
        lvl = s.level if s.level else "Unclassified"
        if lvl in level_dist:
            level_dist[lvl] += 1
        else:
            level_dist["Unclassified"] += 1
            
    weak_concepts = []
    if student_ids:
        weak_c = db.query(
            Concept.name, 
            func.avg(StudentConceptMastery.mastery_level).label('avg_mastery')
        ).join(StudentConceptMastery, Concept.id == StudentConceptMastery.concept_id)\
         .filter(StudentConceptMastery.student_id.in_(student_ids))\
         .group_by(Concept.name)\
         .order_by(func.avg(StudentConceptMastery.mastery_level))\
         .limit(5).all()
        weak_concepts = [{"concept": wc.name, "avg_mastery": round(wc.avg_mastery * 100, 1)} for wc in weak_c]

    recent_sessions = db.query(LearningSession, User.name)\
        .join(Student, LearningSession.student_id == Student.id)\
        .join(User, Student.user_id == User.id)\
        .filter(Student.section == section)\
        .order_by(LearningSession.started_at.desc()).limit(10).all()
        
    activity = []
    for s, name in recent_sessions:
        activity.append({
            "student": name,
            "action": "completed a session on" if s.completed else "started a session on",
            "target": s.lesson_title or s.lesson_id,
            "time": s.started_at.isoformat()
        })

    all_chapters = db.query(Chapter).all()
    all_concepts = db.query(Concept).all()
    chapter_map = {ch.id: ch.name for ch in all_chapters}
    concept_graph = {"nodes": [], "edges": []}
    mastery_map = {}
    for ch in all_chapters:
        concept_graph["nodes"].append({"id": f"ch_{ch.id}", "name": ch.name, "parent_id": None, "mastery": None, "status": "chapter"})
    for c in all_concepts:
        recs = [m for m in db.query(StudentConceptMastery).filter(StudentConceptMastery.concept_id == c.id, StudentConceptMastery.student_id.in_(student_ids)).all()] if student_ids else []
        avg_lvl = sum(r.mastery_level for r in recs) / len(recs) if recs else 0
        mastery_map[c.name] = avg_lvl
        mastery_map[str(c.id)] = avg_lvl
        parent_node_id = f"ch_{c.chapter_id}" if c.chapter_id in chapter_map else None
        avg_pct = round(avg_lvl * 100, 1)
        status = "mastered" if avg_pct >= 80 else ("weak" if avg_pct >= 40 else "locked")
        concept_graph["nodes"].append({"id": str(c.id), "name": c.name, "parent_id": parent_node_id, "mastery": avg_pct, "status": status})
        if parent_node_id:
            concept_graph["edges"].append({"source": parent_node_id, "target": str(c.id)})

    return {
        "kpis": {
            "total_students": total_students,
            "avg_mastery": round(avg_mastery, 1),
            "active_today": active_today,
            "pending_escalations": pending_escalations
        },
        "level_distribution": level_dist,
        "weak_concepts": weak_concepts,
        "activity_feed": activity,
        "mastery_map": mastery_map,
        "concept_graph": concept_graph
    }

@router.get("/heatmap")
def get_heatmap(section: str, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["teacher"]))):
    students = db.query(Student, User.name).join(User, Student.user_id == User.id).filter(Student.section == section).all()
    student_ids = [s[0].id for s in students]
    concepts = db.query(Concept).all()
    
    mastery_records = db.query(StudentConceptMastery).filter(
        StudentConceptMastery.student_id.in_(student_ids)
    ).all() if student_ids else []
    
    mastery_map = {}
    for m in mastery_records:
        if m.student_id not in mastery_map:
            mastery_map[m.student_id] = {}
        mastery_map[m.student_id][m.concept_id] = m.mastery_level
        
    heatmap = []
    for s, name in students:
        row = {"id": s.id, "name": name, "scores": {}}
        for c in concepts:
            val = mastery_map.get(s.id, {}).get(c.id, -1)
            row["scores"][c.name] = val
        heatmap.append(row)
        
    return {
        "concepts": [c.name for c in concepts],
        "heatmap": heatmap
    }

@router.get("/item-analysis")
def get_item_analysis(db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["teacher"]))):
    results = db.query(
        QuizAttempt.question_id,
        QuizAttempt.question_text,
        QuizAttempt.concept_tag,
        func.count(QuizAttempt.id).label("total_attempts"),
        func.sum(case((QuizAttempt.is_correct == True, 1), else_=0)).label("correct_count")
    ).group_by(QuizAttempt.question_id, QuizAttempt.question_text, QuizAttempt.concept_tag).all()
    
    content_items = db.query(ContentItem.id, ContentItem.usage_type).all()
    source_map = {str(item.id): item.usage_type for item in content_items}
    
    analysis = []
    for r in results:
        total = r.total_attempts
        correct_pct = (r.correct_count / total * 100) if total > 0 else 0
        
        distractors = db.query(QuizAttempt.selected_option, func.count(QuizAttempt.id).label("c"))\
            .filter(QuizAttempt.question_id == r.question_id, QuizAttempt.is_correct == False)\
            .group_by(QuizAttempt.selected_option)\
            .order_by(func.count(QuizAttempt.id).desc()).first()
            
        analysis.append({
            "question_id": r.question_id,
            "text": r.question_text,
            "concept": r.concept_tag,
            "source": source_map.get(r.question_id, "practice").capitalize(),
            "total_attempts": total,
            "correct_pct": round(correct_pct, 1),
            "flagged": correct_pct < 50,
            "top_distractor": distractors.selected_option if distractors else None
        })
    return analysis

@router.get("/roster")
def get_roster(section: str = None, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["teacher", "admin"]))):
    query = db.query(Student, User).join(User, Student.user_id == User.id)
    if section:
        query = query.filter(Student.section == section)
    
    results = query.all()
    roster = []
    for student, user in results:
        roster.append({
            "id": student.id,
            "name": user.name,
            "section": student.section,
            "level": student.level,
            "mastery_score": student.mastery_score,
            "xp": student.xp,
            "streak": student.streak
        })
    return roster

from pydantic import BaseModel
class AssignPracticeRequest(BaseModel):
    student_id: int
    concept: str

@router.post("/assign-practice")
def assign_practice(req: AssignPracticeRequest, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["teacher"]))):
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    from database import Notification
    # Create notification for student
    notif = Notification(
        user_id=student.user_id,
        title="New Practice Assigned",
        message=f"Your teacher assigned you practice on: {req.concept}",
        type="assignment"
    )
    db.add(notif)
    db.commit()
    return {"status": "success", "message": "Practice assigned and student notified"}

class SendMessageRequest(BaseModel):
    student_id: int
    message: str

@router.post("/message")
def send_message(req: SendMessageRequest, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["teacher"]))):
    student = db.query(Student).filter(Student.id == req.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    from database import Notification
    notif = Notification(
        user_id=student.user_id,
        title="Message from Teacher",
        message=req.message,
        type="alert"
    )
    db.add(notif)
    db.commit()
    return {"status": "success", "message": "Message sent"}
