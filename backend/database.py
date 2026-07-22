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

class Student(Base):
    __tablename__ = "students"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    grade = Column(String(10), default="9")
    level = Column(String(20), nullable=True)  # Foundational / Grade-Level / Advanced
    mastery_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    sessions = relationship("Session", back_populates="student", cascade="all, delete-orphan")
    doubts = relationship("Doubt", back_populates="student", cascade="all, delete-orphan")
    quiz_attempts = relationship("QuizAttempt", back_populates="student", cascade="all, delete-orphan")


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


class Concept(Base):
    __tablename__ = "concepts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    parent_concept = Column(String(200), nullable=True)
    subject = Column(String(100), default="Mathematics")
    grade_range = Column(String(20), default="8-10")
    description = Column(Text, nullable=True)


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


# Dependency for FastAPI routes
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
