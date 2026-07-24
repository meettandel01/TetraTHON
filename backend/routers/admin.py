from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db, Concept, ContentItem
from auth import get_current_user, require_role, User as AuthUser
from datetime import datetime

router = APIRouter()

@router.get("/compliance")
def get_compliance(db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["admin"]))):
    return {
        "status": "Healthy",
        "data_retention_policy": "90 Days Active, then anonymized",
        "last_audit": datetime.utcnow().isoformat(),
        "anonymization_status": "Enabled",
        "open_violations": 0
    }

@router.get("/content-stats")
def get_content_stats(db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["admin"]))):
    concepts_count = db.query(Concept).count()
    items_count = db.query(ContentItem).count()
    return {
        "total_concepts": concepts_count,
        "total_questions": items_count,
        "needs_review": 12, # mock
        "coverage": "85%" # mock
    }

@router.post("/import-content")
def import_content(db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["admin"]))):
    # Simulated CSV import endpoint
    return {"message": "Content imported successfully", "records_processed": 145}
