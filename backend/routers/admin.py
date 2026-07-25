from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from database import get_db, Concept, ContentItem, GuardianConsent, Student
from auth import get_current_user, require_role, User as AuthUser
from datetime import datetime
import csv
import io
from pydantic import BaseModel
from typing import Optional

class ContentItemCreate(BaseModel):
    concept_id: int
    type: str
    text: str
    options: Optional[str] = None
    correct: str
    hints: Optional[str] = None
    explanation: Optional[str] = None
    difficulty: str = "medium"
    usage_type: str = "practice"

class ContentItemUpdate(BaseModel):
    concept_id: Optional[int] = None
    type: Optional[str] = None
    text: Optional[str] = None
    options: Optional[str] = None
    correct: Optional[str] = None
    hints: Optional[str] = None
    explanation: Optional[str] = None
    difficulty: Optional[str] = None
    usage_type: Optional[str] = None

router = APIRouter()

@router.get("/compliance")
def get_compliance(db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["admin"]))):
    total_students = db.query(Student).count()
    consents = db.query(GuardianConsent).filter(GuardianConsent.consented == True).count()
    
    return {
        "status": "Healthy" if consents >= total_students else "Needs Attention",
        "open_violations": max(0, total_students - consents),
        "total_consents": consents,
        "total_students": total_students
    }

@router.get("/content-stats")
def get_content_stats(db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["admin"]))):
    concepts_count = db.query(Concept).count()
    items_count = db.query(ContentItem).count()
    
    needs_review = db.query(ContentItem).filter((ContentItem.citation == None) | (ContentItem.citation == "")).count()
    
    covered_concepts = db.query(ContentItem.concept_id).distinct().count()
    coverage = round((covered_concepts / concepts_count * 100) if concepts_count > 0 else 0, 1)
    
    return {
        "total_concepts": concepts_count,
        "total_questions": items_count,
        "needs_review": needs_review,
        "coverage": f"{coverage}%"
    }

@router.get("/content-items")
def get_content_items(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["admin"]))):
    items = db.query(ContentItem, Concept.name.label("concept_name")).outerjoin(Concept, ContentItem.concept_id == Concept.id).offset(skip).limit(limit).all()
    result = []
    for item, concept_name in items:
        item_dict = {c.name: getattr(item, c.name) for c in item.__table__.columns}
        item_dict["concept_name"] = concept_name
        result.append(item_dict)
    return result

@router.post("/content-items")
def create_content_item(data: ContentItemCreate, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["admin"]))):
    item = ContentItem(**data.dict(), created_by=current_user.id if hasattr(current_user, 'id') else None)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.put("/content-items/{item_id}")
def update_content_item(item_id: int, data: ContentItemUpdate, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["admin"]))):
    item = db.query(ContentItem).filter(ContentItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Content item not found")
    
    update_data = data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(item, key, value)
        
    db.commit()
    db.refresh(item)
    return item

@router.delete("/content-items/{item_id}")
def delete_content_item(item_id: int, db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["admin"]))):
    item = db.query(ContentItem).filter(ContentItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Content item not found")
    db.delete(item)
    db.commit()
    return {"message": "Content item deleted"}

@router.post("/import-content")
async def import_content(file: UploadFile = File(...), db: Session = Depends(get_db), current_user: AuthUser = Depends(require_role(["admin"]))):
    content = await file.read()
    decoded = content.decode('utf-8')
    csv_reader = csv.DictReader(io.StringIO(decoded))
    
    processed = 0
    for row in csv_reader:
        concept_code = row.get("concept_code")
        if not concept_code:
            continue
        
        concept = db.query(Concept).filter(Concept.concept_code == concept_code).first()
        if not concept:
            continue
            
        item = ContentItem(
            concept_id=concept.id,
            type=row.get("type", "mcq"),
            text=row.get("text", ""),
            options=row.get("options"),
            correct=row.get("correct", ""),
            explanation=row.get("explanation"),
            created_by=current_user.id if hasattr(current_user, 'id') else None
        )
        db.add(item)
        processed += 1
        
    db.commit()
    return {"message": "Content imported successfully", "records_processed": processed}
