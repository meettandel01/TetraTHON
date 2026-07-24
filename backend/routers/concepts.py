from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Concept

router = APIRouter()

SEED_CONCEPTS = [
    {"name": "Mathematics", "parent": None, "desc": "Root mathematics concept"},
    {"name": "Algebra", "parent": "Mathematics", "desc": "Study of mathematical symbols and the rules for manipulating these symbols"},
    {"name": "Linear Equations", "parent": "Algebra", "desc": "Equations of the first degree"},
    {"name": "Solving Linear Equations", "parent": "Linear Equations", "desc": "Finding the value of unknowns"},
    {"name": "Word Problems (Linear)", "parent": "Linear Equations", "desc": "Real-world linear applications"},
    {"name": "Polynomials", "parent": "Algebra", "desc": "Expressions consisting of variables and coefficients"},
    {"name": "Polynomial Operations", "parent": "Polynomials", "desc": "Addition, subtraction, multiplication"},
    {"name": "Factorization", "parent": "Polynomials", "desc": "Writing a number or polynomial as a product of simpler ones"},
    {"name": "Quadratic Equations", "parent": "Algebra", "desc": "Equations of the second degree"},
    {"name": "Quadratic Formula", "parent": "Quadratic Equations", "desc": "Formula to find the roots"},
    {"name": "Nature of Roots", "parent": "Quadratic Equations", "desc": "Discriminant and its implications"},
    {"name": "Arithmetic", "parent": "Mathematics", "desc": "Elementary branch of mathematics"},
    {"name": "Arithmetic Progressions", "parent": "Arithmetic", "desc": "A sequence of numbers with constant difference"},
    {"name": "nth Term of AP", "parent": "Arithmetic Progressions", "desc": "Finding a specific term in the sequence"},
    {"name": "Sum of AP", "parent": "Arithmetic Progressions", "desc": "Sum of the first n terms"},
    {"name": "Trigonometry", "parent": "Mathematics", "desc": "Relationships involving lengths and angles of triangles"},
    {"name": "Trigonometric Ratios", "parent": "Trigonometry", "desc": "Sine, Cosine, Tangent, etc."},
    {"name": "Trigonometric Identities", "parent": "Trigonometry", "desc": "Equations involving trigonometric functions that are true for every value"},
]

def get_concept_id_by_name(db: Session, name: str):
    concept = db.query(Concept).filter(Concept.name == name).first()
    return concept.id if concept else None

def seed_concepts(db: Session):
    if db.query(Concept).first() is not None:
        return # Already seeded

    for item in SEED_CONCEPTS:
        db.add(Concept(
            name=item["name"],
            parent_concept=item["parent"],
            description=item["desc"]
        ))
    db.commit()

@router.post("/seed")
def api_seed_concepts(db: Session = Depends(get_db)):
    seed_concepts(db)
    return {"message": "Concepts seeded successfully"}

@router.get("/")
def get_all_concepts(db: Session = Depends(get_db)):
    concepts = db.query(Concept).all()
    return concepts

@router.get("/tree")
def get_concept_tree(db: Session = Depends(get_db)):
    concepts = db.query(Concept).all()
    # Build tree
    nodes = {c.name: {"id": c.id, "name": c.name, "parent": c.parent_concept, "children": []} for c in concepts}
    tree = []
    for c in concepts:
        if c.parent_concept and c.parent_concept in nodes:
            nodes[c.parent_concept]["children"].append(nodes[c.name])
        else:
            tree.append(nodes[c.name])
    return tree

@router.get("/{concept_id}/related")
def get_related_concepts(concept_id: int, db: Session = Depends(get_db)):
    concept = db.query(Concept).filter(Concept.id == concept_id).first()
    if not concept:
        return {"error": "Concept not found"}
    
    # Sibling concepts (same parent) and children concepts
    related = []
    if concept.parent_concept:
        siblings = db.query(Concept).filter(Concept.parent_concept == concept.parent_concept, Concept.id != concept.id).all()
        related.extend(siblings)
    
    children = db.query(Concept).filter(Concept.parent_concept == concept.name).all()
    related.extend(children)
    
    return [c.name for c in related]
