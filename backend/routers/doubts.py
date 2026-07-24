from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import logging
import os
import base64
from pathlib import Path

from database import get_db, Doubt, Student, Concept, StudentConceptMastery
from routers.concepts import get_concept_id_by_name

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

UPLOAD_DIR.mkdir(exist_ok=True)

NCERT_REFERENCES = {
    "Linear Equations": "NCERT Class 8, Ch. 2 — Linear Equations in One Variable",
    "Polynomials": "NCERT Class 9, Ch. 2 — Polynomials",
    "Quadratic Equations": "NCERT Class 10, Ch. 4 — Quadratic Equations",
    "Trigonometry": "NCERT Class 10, Ch. 8 — Introduction to Trigonometry",
    "Arithmetic Progressions": "NCERT Class 10, Ch. 5 — Arithmetic Progressions",
    "Solving Linear Equations": "NCERT Class 8, Ch. 2 — Linear Equations in One Variable",
    "Word Problems (Linear)": "NCERT Class 8, Ch. 2, Section 2.6",
    "Polynomial Operations": "NCERT Class 9, Ch. 2, Section 2.3",
    "Factorization": "NCERT Class 8, Ch. 14 — Factorisation",
    "Quadratic Formula": "NCERT Class 10, Ch. 4, Section 4.3",
    "Nature of Roots": "NCERT Class 10, Ch. 4, Section 4.4",
    "nth Term of AP": "NCERT Class 10, Ch. 5, Section 5.2",
    "Sum of AP": "NCERT Class 10, Ch. 5, Section 5.3",
    "Trigonometric Ratios": "NCERT Class 10, Ch. 8, Section 8.2",
    "Trigonometric Identities": "NCERT Class 10, Ch. 8, Section 8.4",
}

async def get_gemini_response(question: str, mode: str, taxonomy_names: list, image_data: Optional[str] = None) -> dict:
    """Call Gemini API for doubt resolution."""
    try:
        from google import genai
        from google.genai import types
        from dotenv import load_dotenv
        load_dotenv()

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "your_gemini_api_key_here":
            logger.warning("⚠️ No valid Gemini API key found, returning mock response")
            return get_mock_response(question, mode)

        client = genai.Client(api_key=api_key)

        if mode == "socratic":
            system_prompt = """You are a wise Socratic tutor for Indian Class 8-10 Math students.
NEVER give the direct answer. Instead:
1. Ask 2-3 guiding questions to help the student think
2. Break the problem into smaller parts
3. Hint at the relevant concept or formula
4. Encourage them with phrases like "You're on the right track!"
Keep it friendly, concise, and encouraging. Use simple English.

IMPORTANT RULES FOR THE END OF YOUR RESPONSE:
At the very end of your response, on a new line, you MUST write exactly:
ROOT_CONCEPTS: [1-2 concepts from the taxonomy list that relate to this doubt, comma separated]
Taxonomy list: {', '.join(taxonomy_names)}"""
        else:
            system_prompt = f"""You are a helpful Math tutor for Indian Class 8-10 students.
Provide a clear, step-by-step solution:
1. Identify the concept being tested
2. State the relevant formula/rule
3. Show each step with explanation
4. Verify the answer
5. Mention a quick tip to remember this concept
Use simple language, emojis where helpful, and keep it under 200 words.

IMPORTANT RULES FOR THE END OF YOUR RESPONSE:
At the very end of your response, on a new line, you MUST write exactly:
ROOT_CONCEPTS: [1-2 concepts from the taxonomy list that relate to this doubt, comma separated]
Taxonomy list: {', '.join(taxonomy_names)}"""

        full_prompt = f"{system_prompt}\n\nStudent's question: {question}"

        if image_data:
            image_bytes = base64.b64decode(image_data)
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=[
                    types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"),
                    full_prompt,
                ]
            )
        else:
            response = client.models.generate_content(
                model="gemini-2.0-flash",
                contents=full_prompt,
            )

        logger.info(f"✅ Gemini response generated for mode: {mode}")
        raw_text = response.text
        
        # Parse out ROOT_CONCEPTS
        lines = raw_text.split('\n')
        concepts = []
        clean_text = []
        for line in lines:
            if line.startswith("ROOT_CONCEPTS:"):
                c_str = line.replace("ROOT_CONCEPTS:", "").strip()
                concepts = [c.strip() for c in c_str.split(",") if c.strip() in taxonomy_names]
            else:
                clean_text.append(line)
                
        return {
            "response": "\n".join(clean_text).strip(),
            "concepts": concepts
        }

    except Exception as e:
        logger.error(f"❌ Gemini API error: {e}")
        return get_mock_response(question, mode)


def get_mock_response(question: str, mode: str) -> dict:
    """Fallback mock response when API key is not set."""
    if mode == "socratic":
        return {
            "response": """🤔 **Let's think about this together!**

Before I guide you, ask yourself:
1. **What type of problem is this?** (Linear equation? Polynomial? Geometry?)
2. **What information are you given?** List out all the values you know.
3. **What formula might apply here?** Think about what you've learned recently.

💡 *Hint:* Try to identify the unknown variable first, then work backwards from what you know.

What do you think the first step should be? Give it a try! 🎯""",
            "concepts": ["Linear Equations"]
        }
    else:
        return {
            "response": f"""📚 **Step-by-Step Solution**

**Your Question:** {question[:100]}...

**Concept:** Identifying the relevant mathematical concept

**Step 1:** Read the problem carefully and identify what's being asked
**Step 2:** Write down the given information
**Step 3:** Choose the appropriate formula or method
**Step 4:** Apply the method step by step
**Step 5:** Verify your answer

⚠️ *Note: Connect your Gemini API key in the backend `.env` file for AI-powered personalized explanations!*

💡 **Quick Tip:** Always verify your answer by substituting it back into the original equation!""",
            "concepts": ["Linear Equations"]
        }


@router.post("/ask")
async def ask_doubt(
    student_id: int = Form(...),
    question: str = Form(...),
    mode: str = Form(default="direct"),
    image: Optional[UploadFile] = File(default=None),
    db: Session = Depends(get_db),
):
    """Submit a doubt - text or image - and get AI response."""
    logger.info(f"Doubt received from student {student_id}, mode: {mode}, has_image: {image is not None}")

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    image_data = None
    image_path = None

    if image:
        # Save image and extract base64 for Gemini Vision
        image_bytes = await image.read()
        image_path = str(UPLOAD_DIR / f"doubt_{student_id}_{image.filename}")
        with open(image_path, "wb") as f:
            f.write(image_bytes)
        image_data = base64.b64encode(image_bytes).decode("utf-8")
        logger.info(f"📷 Image uploaded: {image_path}")

        # If image provided but no text, use a default prompt for OCR
        if not question or question.strip() == "":
            question = "Please solve the math problem shown in this image."

    all_concepts = db.query(Concept).all()
    taxonomy_names = [c.name for c in all_concepts]
    
    # Get AI response
    result = await get_gemini_response(question, mode, taxonomy_names, image_data)
    response_text = result["response"]
    identified_concepts = result["concepts"]
    
    # Format curriculum citations
    citations = []
    for c in identified_concepts:
        if c in NCERT_REFERENCES and NCERT_REFERENCES[c] not in citations:
            citations.append(NCERT_REFERENCES[c])
            
    if citations:
        response_text += "\n\n" + "\n".join([f"📖 **Reference:** {cit}" for cit in citations])

    # Save to DB
    doubt = Doubt(
        student_id=student_id,
        question_text=question,
        image_path=image_path,
        response_text=response_text,
        mode=mode,
        concept_tags=",".join(identified_concepts),
        resolved=True,
    )
    db.add(doubt)
    
    # Update Concept Mastery and find related weak areas
    related_weak_areas = []
    for c_name in identified_concepts:
        concept_id = get_concept_id_by_name(db, c_name)
        if not concept_id:
            continue
            
        mastery = db.query(StudentConceptMastery).filter(
            StudentConceptMastery.student_id == student_id,
            StudentConceptMastery.concept_id == concept_id
        ).first()
        
        if not mastery:
            mastery = StudentConceptMastery(student_id=student_id, concept_id=concept_id)
            db.add(mastery)
            
        mastery.attempts += 1
        # E.g. asking a direct doubt implies weakness, asking socratic might be neutral, let's just mark it
        mastery.is_weak = True
        
        # Sibling/Child concepts that are also weak
        c_obj = next((c for c in all_concepts if c.id == concept_id), None)
        if c_obj:
            related_ids = []
            if c_obj.parent_concept:
                sibs = [x.id for x in all_concepts if x.parent_concept == c_obj.parent_concept and x.id != c_obj.id]
                related_ids.extend(sibs)
            kids = [x.id for x in all_concepts if x.parent_concept == c_obj.name]
            related_ids.extend(kids)
            
            weak_related = db.query(StudentConceptMastery).filter(
                StudentConceptMastery.student_id == student_id,
                StudentConceptMastery.concept_id.in_(related_ids),
                StudentConceptMastery.is_weak == True
            ).all()
            
            for wr in weak_related:
                n = next((x.name for x in all_concepts if x.id == wr.concept_id), None)
                if n and n not in related_weak_areas:
                    related_weak_areas.append(n)

    db.commit()
    db.refresh(doubt)

    logger.info(f"✅ Doubt {doubt.id} resolved for student {student_id}")
    return {
        "doubt_id": doubt.id,
        "question": question,
        "response": response_text,
        "mode": mode,
        "concept_tags": identified_concepts,
        "related_weak_areas": related_weak_areas[:3], # Limit to 3
        "has_image": image is not None,
    }


@router.get("/history/{student_id}")
def get_doubt_history(student_id: int, db: Session = Depends(get_db)):
    """Get all doubts for a student."""
    doubts = db.query(Doubt).filter(Doubt.student_id == student_id).order_by(Doubt.created_at.desc()).limit(20).all()
    return [
        {
            "id": d.id,
            "question": d.question_text[:100] + "..." if len(d.question_text) > 100 else d.question_text,
            "response": d.response_text,
            "mode": d.mode,
            "has_image": d.image_path is not None,
            "created_at": d.created_at.isoformat() if d.created_at else None,
        }
        for d in doubts
    ]
