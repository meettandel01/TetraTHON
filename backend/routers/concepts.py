from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Standard, Subject, Chapter, Concept

router = APIRouter()

def get_concept_id_by_name(db: Session, name: str):
    concept = db.query(Concept).filter(Concept.name == name).first()
    return concept.id if concept else None

@router.get("/")
def get_all_concepts(db: Session = Depends(get_db)):
    concepts = db.query(Concept).all()
    return concepts

@router.get("/tree")
def get_syllabus_tree(db: Session = Depends(get_db)):
    """
    Returns the complete curriculum hierarchy:
    Standard -> Subject -> Chapter -> Topic (Concept)
    """
    standards = db.query(Standard).all()
    subjects = db.query(Subject).all()
    chapters = db.query(Chapter).all()
    concepts = db.query(Concept).all()
    
    tree = []
    
    for std in standards:
        std_node = {
            "id": std.id,
            "type": "standard",
            "name": std.name,
            "description": std.description,
            "children": []
        }
        
        std_subjects = [s for s in subjects if s.standard_id == std.id]
        for sub in std_subjects:
            sub_node = {
                "id": sub.id,
                "type": "subject",
                "name": sub.name,
                "children": []
            }
            
            sub_chapters = [c for c in chapters if c.subject_id == sub.id]
            for ch in sub_chapters:
                ch_node = {
                    "id": ch.id,
                    "type": "chapter",
                    "name": ch.name,
                    "chapter_number": ch.chapter_number,
                    "children": []
                }
                
                ch_topics = [t for t in concepts if t.chapter_id == ch.id]
                for topic in ch_topics:
                    topic_node = {
                        "id": topic.id,
                        "type": "concept",
                        "concept_code": topic.concept_code,
                        "name": topic.name,
                        "short_name": topic.short_name,
                        "description": topic.description
                    }
                    ch_node["children"].append(topic_node)
                    
                sub_node["children"].append(ch_node)
            std_node["children"].append(sub_node)
        tree.append(std_node)
        
    return tree

@router.get("/{concept_id}/related")
def get_related_concepts(concept_id: int, db: Session = Depends(get_db)):
    concept = db.query(Concept).filter(Concept.id == concept_id).first()
    if not concept:
        return {"error": "Concept not found"}
    
    # Siblings in the same chapter
    if concept.chapter_id:
        siblings = db.query(Concept).filter(Concept.chapter_id == concept.chapter_id, Concept.id != concept.id).all()
        return [c.name for c in siblings]
    return []
