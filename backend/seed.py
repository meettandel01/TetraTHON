import os
import json
from sqlalchemy.orm import Session
from database import SessionLocal, engine, Base
from database import User, Student, Teacher, Parent, Admin, Concept, Badge, StudentConceptMastery
from database import Standard, Subject, Chapter, LessonContent, ContentItem, GamificationSettings
from auth import get_pin_hash

def seed_db():
    db = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Standard).first() is not None:
            print("Database already seeded.")
            return

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
        
        # 5. Curriculum Hierarchy
        std8 = Standard(name="Class 8", description="Middle School Class 8")
        std9 = Standard(name="Class 9", description="High School Class 9")
        db.add_all([std8, std9])
        db.commit()
        
        math8 = Subject(standard_id=std8.id, name="Mathematics")
        sci8 = Subject(standard_id=std8.id, name="Science")
        math9 = Subject(standard_id=std9.id, name="Mathematics")
        db.add_all([math8, sci8, math9])
        db.commit()
        
        # Chapters
        ch_lin_eq = Chapter(subject_id=math8.id, name="Linear Equations in One Variable", chapter_number=2, description="Solving linear equations and word problems.")
        ch_poly = Chapter(subject_id=math8.id, name="Polynomials", chapter_number=3, description="Understanding polynomials and their degrees.")
        ch_quad = Chapter(subject_id=math9.id, name="Quadratic Equations", chapter_number=4, description="Solving quadratic equations.")
        ch_force = Chapter(subject_id=sci8.id, name="Force and Pressure", chapter_number=11, description="Physics of force and pressure.")
        db.add_all([ch_lin_eq, ch_poly, ch_quad, ch_force])
        db.commit()
        
        # Concepts (Topics)
        topics = []
        topics.append(Concept(chapter_id=ch_lin_eq.id, concept_code="c1", name="One-Step Equations", short_name="One-Step", description="Basic equations with one operation.", ncert_reference="NCERT Class 8, Ch. 2 — Linear Equations in One Variable"))
        topics.append(Concept(chapter_id=ch_lin_eq.id, concept_code="c2", name="Two-Step Equations", short_name="Two-Step", description="Equations requiring two operations to solve.", ncert_reference="NCERT Class 8, Ch. 2, Section 2.3"))
        topics.append(Concept(chapter_id=ch_lin_eq.id, concept_code="c3", name="Word Problems", short_name="Applications", description="Real world applications of linear equations.", ncert_reference="NCERT Class 8, Ch. 2, Section 2.6"))
        
        topics.append(Concept(chapter_id=ch_poly.id, concept_code="p1", name="Degree of a Polynomial", short_name="Degree", description="Identifying the highest power.", ncert_reference="NCERT Class 9, Ch. 2 — Polynomials"))
        topics.append(Concept(chapter_id=ch_poly.id, concept_code="p2", name="Factorization", short_name="Factorize", description="Splitting polynomials into factors.", ncert_reference="NCERT Class 8, Ch. 14 — Factorisation"))
        
        topics.append(Concept(chapter_id=ch_quad.id, concept_code="q1", name="Roots of Quadratics", short_name="Roots", description="Finding solutions for degree 2 polynomials.", ncert_reference="NCERT Class 10, Ch. 4 — Quadratic Equations"))
        
        topics.append(Concept(chapter_id=ch_force.id, concept_code="s1", name="Types of Forces", short_name="Forces", description="Contact and non-contact forces.", ncert_reference="NCERT Class 8, Ch. 11 — Force and Pressure"))
        
        db.add_all(topics)
        db.commit()
        
        # Map concept codes to IDs for easy access
        c_map = {t.concept_code: t.id for t in db.query(Concept).all()}
        
        # 6. Lesson Content
        lessons = [
            LessonContent(
                concept_id=c_map["c1"], level="Foundational", title="Intro to One-Step Equations", duration_minutes=10,
                intro_text="Let's start with the basics! Algebra is like a puzzle where we find the missing piece.",
                explanation_markdown="## What is a Variable?\nA variable is just a letter that stands for an unknown number.\n\n**Rule:** Whatever you do to one side, do the same to the other!\n\nStep 1: Write `x + 4 = 10`\nStep 2: Subtract 4 from both sides: `x = 6`.",
                visual_hint="Think of a balance scale — both sides must always be equal!",
                real_world_app="Used in calculating discounts."
            ),
            LessonContent(
                concept_id=c_map["c1"], level="Grade-Level", title="Mastering One-Step Equations", duration_minutes=15,
                intro_text="Time to master solving equations with a single operation.",
                explanation_markdown="## The Golden Rule of Algebra\nIsolate the variable by performing the inverse operation on both sides of the equals sign.\n\n`3x = 12` -> Divide by 3 -> `x = 4`\n`x/2 = 5` -> Multiply by 2 -> `x = 10`.",
                visual_hint="Inverse operations are opposites. (+) and (-), (*) and (/).",
                real_world_app="Used in physics to find speed given distance and time."
            ),
            LessonContent(
                concept_id=c_map["p1"], level="Grade-Level", title="Understanding Polynomial Degrees", duration_minutes=12,
                intro_text="Polynomials are algebraic expressions. The degree is their highest power.",
                explanation_markdown="## Finding the Degree\nLook at all the terms in the polynomial. Find the term with the highest exponent on its variable.\n\nExample: In `4x^3 - 2x + 7`, the highest exponent is 3. So the degree is 3.",
                visual_hint="Look for the biggest number in the 'superscript' position.",
                real_world_app="Polynomials model real-world curves like rollercoasters and economics graphs."
            )
        ]
        db.add_all(lessons)
        db.commit()
        
        # 7. Content Items (Questions for Quiz and Practice)
        questions = [
            # One-Step Equations (c1)
            ContentItem(concept_id=c_map["c1"], type="mcq", text="Solve for x: x + 7 = 15", options=json.dumps({"A":"7","B":"8","C":"9","D":"22"}), correct="B", explanation="x = 15 - 7 = 8", difficulty="easy", usage_type="diagnostic"),
            ContentItem(concept_id=c_map["c1"], type="mcq", text="Solve: 3x = 18", options=json.dumps({"A":"3","B":"6","C":"15","D":"54"}), correct="B", explanation="x = 18 ÷ 3 = 6", difficulty="easy", usage_type="diagnostic"),
            ContentItem(concept_id=c_map["c1"], type="mcq", text="Solve for y: y - 4 = 10", options=json.dumps({"A":"6","B":"14","C":"10","D":"-6"}), correct="B", explanation="y = 10 + 4 = 14", difficulty="easy", usage_type="practice"),
            ContentItem(concept_id=c_map["c1"], type="mcq", text="If x/4 = 5, what is x?", options=json.dumps({"A":"20","B":"1.25","C":"9","D":"1"}), correct="A", explanation="Multiply both sides by 4: x = 20", difficulty="medium", usage_type="practice"),
            
            # Two-Step Equations (c2)
            ContentItem(concept_id=c_map["c2"], type="mcq", text="Solve for x: 3x - 9 = 0", options=json.dumps({"A":"0","B":"3","C":"9","D":"-3"}), correct="B", explanation="Add 9, then divide by 3: 3x = 9 -> x = 3", difficulty="medium", usage_type="diagnostic"),
            ContentItem(concept_id=c_map["c2"], type="mcq", text="Solve: 2x + 5 = 17", options=json.dumps({"A":"6","B":"11","C":"12","D":"7"}), correct="A", explanation="2x = 12 -> x = 6", difficulty="medium", usage_type="practice"),
            ContentItem(concept_id=c_map["c2"], type="mcq", text="If 5(x - 2) = 15, find x.", options=json.dumps({"A":"5","B":"3","C":"7","D":"25"}), correct="A", explanation="x - 2 = 3 -> x = 5", difficulty="hard", usage_type="practice"),
            
            # Polynomial Degree (p1)
            ContentItem(concept_id=c_map["p1"], type="mcq", text="What is the degree of 4x³ - 2x + 7?", options=json.dumps({"A":"1","B":"2","C":"3","D":"7"}), correct="C", explanation="Highest power is 3.", difficulty="easy", usage_type="diagnostic"),
            ContentItem(concept_id=c_map["p1"], type="mcq", text="Find the degree of x^5 + 3x^2 - x^6", options=json.dumps({"A":"5","B":"2","C":"6","D":"-6"}), correct="C", explanation="Highest power is 6.", difficulty="medium", usage_type="practice"),
            
            # Polynomial Factorization (p2)
            ContentItem(concept_id=c_map["p2"], type="mcq", text="Factorize: x² - 7x + 12", options=json.dumps({"A":"(x-3)(x-4)","B":"(x+3)(x+4)","C":"(x-6)(x-2)","D":"(x-1)(x-12)"}), correct="A", explanation="-3 and -4 add to -7 and multiply to 12.", difficulty="medium", usage_type="diagnostic"),
            
            # Science Force (s1)
            ContentItem(concept_id=c_map["s1"], type="mcq", text="Which of the following is a non-contact force?", options=json.dumps({"A":"Friction","B":"Tension","C":"Magnetic Force","D":"Applied Force"}), correct="C", explanation="Magnets can exert force from a distance.", difficulty="easy", usage_type="diagnostic"),
            ContentItem(concept_id=c_map["s1"], type="mcq", text="The SI unit of force is:", options=json.dumps({"A":"Joule","B":"Newton","C":"Pascal","D":"Watt"}), correct="B", explanation="Force is measured in Newtons (N).", difficulty="easy", usage_type="practice"),

            # Word Problems (c3)
            ContentItem(concept_id=c_map["c3"], type="mcq", text="If 3 times a number is 21, what is the number?", options=json.dumps({"A":"5","B":"7","C":"9","D":"63"}), correct="B", explanation="21 ÷ 3 = 7", difficulty="easy", usage_type="diagnostic"),
            ContentItem(concept_id=c_map["c3"], type="mcq", text="Rahul is 4 years older than twice his brother's age. If Rahul is 14, how old is his brother?", options=json.dumps({"A":"5","B":"6","C":"7","D":"8"}), correct="A", explanation="2x + 4 = 14 -> 2x = 10 -> x = 5", difficulty="medium", usage_type="diagnostic"),
            ContentItem(concept_id=c_map["c3"], type="mcq", text="The sum of three consecutive integers is 72. What is the largest integer?", options=json.dumps({"A":"23","B":"24","C":"25","D":"26"}), correct="C", explanation="3x + 3 = 72 -> x = 23. Largest is 25.", difficulty="hard", usage_type="diagnostic"),

            # Roots of Quadratics (q1)
            ContentItem(concept_id=c_map["q1"], type="mcq", text="What are the roots of x² - 9 = 0?", options=json.dumps({"A":"3 and -3","B":"9 and -9","C":"0 and 3","D":"3 and 3"}), correct="A", explanation="x² = 9, so x = ±3", difficulty="easy", usage_type="diagnostic"),
            ContentItem(concept_id=c_map["q1"], type="mcq", text="Find the roots of the equation x² - 5x + 6 = 0.", options=json.dumps({"A":"2 and 3","B":"-2 and -3","C":"1 and 6","D":"-1 and -6"}), correct="A", explanation="(x-2)(x-3) = 0 -> x = 2 or 3", difficulty="medium", usage_type="diagnostic"),
            ContentItem(concept_id=c_map["q1"], type="mcq", text="For what value of k does x² + 4x + k = 0 have equal roots?", options=json.dumps({"A":"2","B":"4","C":"8","D":"16"}), correct="B", explanation="Discriminant b² - 4ac = 0 -> 16 - 4k = 0 -> k = 4", difficulty="hard", usage_type="diagnostic")
        ]
        db.add_all(questions)
        db.commit()
        
        # 8. Badges
        BADGES_DATA = [
            {"code":"b1", "name":"First Quiz Ace", "desc":"Score 100% on your first diagnostic", "icon":"🎯"},
            {"code":"b2", "name":"Streak Starter", "desc":"Maintain a 3-day learning streak", "icon":"🔥"},
            {"code":"b3", "name":"Doubt Destroyer", "desc":"Resolve 5 doubts with AI", "icon":"🧠"}
        ]
        for b in BADGES_DATA:
            badge = Badge(code=b["code"], name=b["name"], description=b["desc"], icon=b["icon"], criteria_type="streak", criteria_value=3)
            db.add(badge)
        
        # 9. Gamification Settings
        db.add(GamificationSettings(daily_xp_cap=500))
        db.commit()
        
        print("Database seeded successfully.")

    except Exception as e:
        db.rollback()
        print(f"Error seeding database: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
