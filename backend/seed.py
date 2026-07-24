import os
import json
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from database import User, Student, Teacher, Parent, Admin, Concept, Badge, StudentConceptMastery
from auth import get_pin_hash

Base.metadata.drop_all(bind=engine)
Base.metadata.create_all(bind=engine)

def seed_db():
    db = SessionLocal()
    try:
        print("Seeding database...")
        
        # 1. Seed Teacher
        teacher_user = User(role="teacher", name="Priya Deshmukh", email="priya@school.edu", auth_provider="google")
        db.add(teacher_user)
        db.commit()
        db.refresh(teacher_user)
        
        teacher = Teacher(user_id=teacher_user.id, role_title="Mathematics Teacher", sections=json.dumps(["8-A", "8-B", "8-C"]))
        db.add(teacher)
        
        # 2. Seed Admin
        admin_user = User(role="admin", name="Rekha Nambiar", email="rekha@school.edu", auth_provider="microsoft")
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        admin = Admin(user_id=admin_user.id, role_title="IT & Curriculum Admin")
        db.add(admin)
        
        # 3. Seed Students
        STUDENTS_DATA = [
            {"id":"s01", "name":"Aditi Sharma", "section":"8-A", "archetype":"foundImproving", "level":"Foundational", "xp":320, "streak":4, "lang":"Hindi", "pin":"1234"},
            {"id":"s02", "name":"Rohan Verma", "section":"8-A", "archetype":"strong", "level":"Advanced", "xp":780, "streak":7, "lang":"English", "pin":"2345"},
            {"id":"s03", "name":"Fatima Sheikh", "section":"8-B", "archetype":"algebraStrong", "level":"Grade-Level", "xp":540, "streak":2, "lang":"Hindi", "pin":"3456"},
            {"id":"s04", "name":"Karan Patel", "section":"8-B", "archetype":"foundStuck", "level":"Foundational", "xp":110, "streak":0, "lang":"Hindi", "pin":"4567"},
            {"id":"s05", "name":"Meera Iyer", "section":"8-C", "archetype":"newStudent", "level":None, "xp":0, "streak":0, "lang":"English", "pin":"5678"},
            {"id":"s06", "name":"Aryan Gupta", "section":"8-A", "archetype":"gradeConsistent", "level":"Grade-Level", "xp":410, "streak":3, "lang":"English", "pin":"1111"}
        ]
        
        student_records = {}
        for s in STUDENTS_DATA:
            user = User(role="student", name=s["name"], pin_hash=get_pin_hash(s["pin"]), auth_provider="local")
            db.add(user)
            db.commit()
            db.refresh(user)
            
            student = Student(
                user_id=user.id,
                section=s["section"],
                language=s["lang"],
                level=s["level"],
                archetype=s["archetype"],
                xp=s["xp"],
                streak=s["streak"]
            )
            db.add(student)
            db.commit()
            db.refresh(student)
            student_records[s["id"]] = student
            
        # 4. Seed Parents
        PARENTS_DATA = [
            {"id":"pa01", "name":"Suresh Sharma", "childId":"s01", "relation":"Father"},
            {"id":"pa02", "name":"Lata Verma", "childId":"s02", "relation":"Mother"},
            {"id":"pa03", "name":"Imran Sheikh", "childId":"s03", "relation":"Father"}
        ]
        
        for p in PARENTS_DATA:
            if p["childId"] in student_records:
                user = User(role="parent", name=p["name"], auth_provider="local")
                db.add(user)
                db.commit()
                db.refresh(user)
                
                parent = Parent(
                    user_id=user.id,
                    child_id=student_records[p["childId"]].id,
                    relation=p["relation"]
                )
                db.add(parent)
                
        # 5. Seed Concepts
        CONCEPTS_DATA = [
            {"code":"c1", "short":"Integers", "name":"Integer Operations", "ncert":"NCERT Class 7 Mathematics, Ch 1"},
            {"code":"c2", "short":"Variables", "name":"Variable & Constant Identification", "ncert":"NCERT Class 8 Mathematics, Ch 2, Sec 2.1"},
            {"code":"c3", "short":"Simplify", "name":"Expression Simplification", "ncert":"NCERT Class 8 Mathematics, Ch 2, Sec 2.1"},
            {"code":"c4", "short":"One-Step", "name":"One-Step Linear Equation", "ncert":"NCERT Class 8 Mathematics, Ch 2, Sec 2.2"},
            {"code":"c5", "short":"Two-Step", "name":"Two-Step Linear Equation", "ncert":"NCERT Class 8 Mathematics, Ch 2, Sec 2.2"},
            {"code":"c6", "short":"Both Sides", "name":"Equations with Variables on Both Sides", "ncert":"NCERT Class 8 Mathematics, Ch 2, Sec 2.3"},
            {"code":"c7", "short":"Word Problems", "name":"Word Problems (Linear Equations)", "ncert":"NCERT Class 8 Mathematics, Ch 2, Sec 2.5"},
        ]
        
        for c in CONCEPTS_DATA:
            concept = Concept(
                concept_code=c["code"],
                short_name=c["short"],
                name=c["name"],
                ncert_citation=c["ncert"]
            )
            db.add(concept)
            
        # 6. Seed Badges
        BADGES_DATA = [
            {"code":"b1", "name":"First Steps", "desc":"Complete your first diagnostic", "icon":"✓"},
            {"code":"b2", "name":"Streak Starter", "desc":"Maintain a 3-day streak", "icon":"🔥"},
            {"code":"b3", "name":"Problem Solver", "desc":"Answer 10 practice questions correctly", "icon":"✎"},
            {"code":"b4", "name":"Doubt Buster", "desc":"Resolve 5 doubts with the AI tutor", "icon":"?"},
            {"code":"b5", "name":"Concept Master", "desc":"Reach 90% mastery on any concept", "icon":"★"},
            {"code":"b6", "name":"Week Warrior", "desc":"Maintain a 7-day streak", "icon":"⚡"},
        ]
        
        for b in BADGES_DATA:
            badge = Badge(
                code=b["code"],
                name=b["name"],
                description=b["desc"],
                icon=b["icon"]
            )
            db.add(badge)

        db.commit()
        print("Database seeded successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
