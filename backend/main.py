from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from database import engine, Base, SessionLocal
from routers import students, quiz, lessons, doubts, dashboard, concepts

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚀 Starting TetraTHON API server...")
    # Create all DB tables on startup
    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables created/verified")
    
    # Auto-seed concepts
    with SessionLocal() as db:
        concepts.seed_concepts(db)
        logger.info("✅ Concept taxonomy seeded/verified")
    yield
    logger.info("🛑 Shutting down TetraTHON API server...")


app = FastAPI(
    title="TetraTHON - Adaptive Microlearning API",
    description="AI-powered adaptive learning engine for Indian classrooms",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(students.router, prefix="/api/students", tags=["Students"])
app.include_router(quiz.router, prefix="/api/quiz", tags=["Quiz"])
app.include_router(lessons.router, prefix="/api/lessons", tags=["Lessons"])
app.include_router(doubts.router, prefix="/api/doubts", tags=["Doubts"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(concepts.router, prefix="/api/concepts", tags=["Concepts"])


@app.get("/")
async def root():
    return {
        "message": "TetraTHON Adaptive Learning API",
        "version": "1.0.0",
        "status": "running",
    }


@app.get("/health")
async def health():
    return {"status": "healthy"}
