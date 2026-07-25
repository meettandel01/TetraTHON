from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, Text, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os
from dotenv import load_dotenv
import logging

load_dotenv()
logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./tetrathon.db")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {},
    echo=False,  # Set True for SQL query logging
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# ----- ORM Models -----

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    role = Column(String(20), nullable=False) # student, teacher, parent, admin
    name = Column(String(100), nullable=False)
    pin_hash = Column(String(200), nullable=True) # Hashed PIN for local auth
    email = Column(String(100), unique=True, index=True, nullable=True)
    auth_provider = Column(String(20), default="local") # local, google, microsoft
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    section = Column(String(10), nullable=True)
    language = Column(String(20), default="English")
    grade = Column(String(10), default="8")
    level = Column(String(20), nullable=True)  # Foundational / Grade-Level / Advanced
    archetype = Column(String(50), nullable=True) # strong, foundImproving, etc.
    xp = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    streak_last_date = Column(DateTime, nullable=True)
    mastery_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User")
    sessions = relationship("Session", back_populates="student", cascade="all, delete-orphan")
    doubts = relationship("Doubt", back_populates="student", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="student", cascade="all, delete-orphan")

class Teacher(Base):
    __tablename__ = "teachers"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    role_title = Column(String(100), nullable=True)
    sections = Column(String(200), nullable=True) # JSON or comma-separated
    subject = Column(String(50), default="Mathematics")
    
    user = relationship("User")

class Parent(Base):
    __tablename__ = "parents"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    child_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    relation = Column(String(50), nullable=True)
    
    user = relationship("User")
    child = relationship("Student")

class Admin(Base):
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    role_title = Column(String(100), nullable=True)
    
    user = relationship("User")

class LoginAttempt(Base):
    __tablename__ = "login_attempts"
    
    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    attempt_count = Column(Integer, default=0)
    locked_until = Column(DateTime, nullable=True)
    last_attempt_at = Column(DateTime, default=datetime.utcnow)

class GuardianConsent(Base):
    __tablename__ = "guardian_consents"
    
    student_id = Column(Integer, ForeignKey("students.id"), primary_key=True)
    parent_id = Column(Integer, ForeignKey("parents.id"), nullable=False)
    consented = Column(Boolean, default=False)
    consented_at = Column(DateTime, nullable=True)

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    lesson_id = Column(String(50), nullable=False)
    lesson_title = Column(String(200), nullable=True)
    level = Column(String(20), nullable=True)
    completed = Column(Boolean, default=False)
    score = Column(Float, default=0.0)
    time_spent_seconds = Column(Integer, default=0)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    student = relationship("Student", back_populates="sessions")

class Doubt(Base):
    __tablename__ = "doubts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    question_text = Column(Text, nullable=False)
    image_path = Column(String(500), nullable=True)  # Path to uploaded image
    response_text = Column(Text, nullable=True)
    mode = Column(String(20), default="direct")  # 'socratic' or 'direct'
    concept_tags = Column(String(500), nullable=True)  # comma-separated concept names
    resolved = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="doubts")

class Escalation(Base):
    __tablename__ = "escalations"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    concept_id = Column(String(50), nullable=True)
    doubt_text = Column(Text, nullable=False)
    status = Column(String(20), default="pending") # pending, claimed, resolved
    auto_escalated = Column(Boolean, default=False)
    ai_confidence = Column(Float, nullable=True)
    claimed_by = Column(Integer, ForeignKey("teachers.id"), nullable=True)
    response_text = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    student = relationship("Student")
    teacher = relationship("Teacher")

class Standard(Base):
    __tablename__ = "standards"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String(200), nullable=True)

class Subject(Base):
    __tablename__ = "subjects"
    id = Column(Integer, primary_key=True, index=True)
    standard_id = Column(Integer, ForeignKey("standards.id"), nullable=False)
    name = Column(String(100), nullable=False)

class Chapter(Base):
    __tablename__ = "chapters"
    id = Column(Integer, primary_key=True, index=True)
    subject_id = Column(Integer, ForeignKey("subjects.id"), nullable=False)
    name = Column(String(200), nullable=False)
    chapter_number = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)

class Concept(Base):
    __tablename__ = "concepts"

    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"), nullable=True)
    concept_code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(200), unique=True, nullable=False)
    short_name = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    ncert_reference = Column(String(200), nullable=True)

class LessonContent(Base):
    __tablename__ = "lesson_contents"
    id = Column(Integer, primary_key=True, index=True)
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=False)
    level = Column(String(50), nullable=False) # Foundational, Grade-Level, Advanced
    title = Column(String(200), nullable=False)
    duration_minutes = Column(Integer, default=10)
    intro_text = Column(Text, nullable=True)
    explanation_markdown = Column(Text, nullable=True)
    visual_hint = Column(Text, nullable=True)
    real_world_app = Column(Text, nullable=True)

class StudentConceptMastery(Base):
    __tablename__ = "student_concept_mastery"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=False)
    mastery_level = Column(Float, default=0.0)  # 0.0 to 1.0
    attempts = Column(Integer, default=0)
    correct = Column(Integer, default=0)
    is_weak = Column(Boolean, default=False)
    last_attempted = Column(DateTime, default=datetime.utcnow)
    
    concept = relationship("Concept")

class QuizAttempt(Base):
    __tablename__ = "quiz_attempts"

    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    question_id = Column(String(50), nullable=False)
    question_text = Column(Text, nullable=False)
    selected_option = Column(String(5), nullable=True)
    correct_option = Column(String(5), nullable=False)
    is_correct = Column(Boolean, default=False)
    concept_tag = Column(String(100), nullable=True)
    difficulty = Column(String(20), nullable=True)  # easy / medium / hard
    attempted_at = Column(DateTime, default=datetime.utcnow)

    student = relationship("Student", back_populates="quiz_attempts")

class Badge(Base):
    __tablename__ = "badges"
    
    id = Column(Integer, primary_key=True, index=True)
    code = Column(String(50), unique=True, nullable=False) # e.g. b1, b2
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    icon = Column(String(50), nullable=True)
    criteria_type = Column(String(50), nullable=True)
    criteria_value = Column(Integer, nullable=True)

class StudentBadge(Base):
    __tablename__ = "student_badges"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    badge_id = Column(Integer, ForeignKey("badges.id"), nullable=False)
    earned_at = Column(DateTime, default=datetime.utcnow)
    
    badge = relationship("Badge")

class XpTransaction(Base):
    __tablename__ = "xp_transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    amount = Column(Integer, nullable=False)
    source = Column(String(50), nullable=False) # practice, diagnostic, lesson
    created_at = Column(DateTime, default=datetime.utcnow)

class ParentSettings(Base):
    __tablename__ = "parent_settings"
    
    parent_id = Column(Integer, ForeignKey("parents.id"), primary_key=True)
    whatsapp_digest = Column(Boolean, default=True)
    email_alerts = Column(Boolean, default=True)
    digest_frequency = Column(String(20), default="weekly")

    parent = relationship("Parent")

class ContentItem(Base):
    __tablename__ = "content_items"
    
    id = Column(Integer, primary_key=True, index=True)
    concept_id = Column(Integer, ForeignKey("concepts.id"), nullable=False)
    type = Column(String(50), nullable=False) # mcq, numerical, etc
    text = Column(Text, nullable=False)
    options = Column(Text, nullable=True) # JSON string
    correct = Column(String(50), nullable=False)
    hints = Column(Text, nullable=True) # JSON string
    explanation = Column(Text, nullable=True)
    citation = Column(String(200), nullable=True)
    difficulty = Column(String(20), default="medium") # easy, medium, hard
    usage_type = Column(String(20), default="practice") # diagnostic, practice
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class DoubtFeedback(Base):
    __tablename__ = "doubt_feedbacks"
    
    id = Column(Integer, primary_key=True, index=True)
    doubt_id = Column(Integer, ForeignKey("doubts.id"), nullable=False)
    upvote = Column(Boolean, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class GamificationSettings(Base):
    __tablename__ = "gamification_settings"
    
    id = Column(Integer, primary_key=True, index=True)
    daily_xp_cap = Column(Integer, default=500)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
