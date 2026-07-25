from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import logging
import os
import base64
from pathlib import Path

from database import get_db, Doubt, Student, Concept, StudentConceptMastery, DoubtFeedback
from routers.concepts import get_concept_id_by_name
from routers.gamification import check_and_award_badges

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

async def get_gemini_response(question: str, mode: str, taxonomy_names: list, image_data: Optional[str] = None) -> dict:
    """Call Gemini API for doubt resolution."""
    try:
        import google.generativeai as genai
        from dotenv import load_dotenv
        load_dotenv()

        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key or api_key == "your_gemini_api_key_here":
            logger.warning("⚠️ No valid Gemini API key found, returning error response")
            return get_error_response(question, mode)

        genai.configure(api_key=api_key)

        if mode == "socratic":
            system_prompt = """You are a wise Socratic tutor for Indian Class 8-10 Math students.
NEVER give the direct answer. Instead:
1. Ask 2-3 guiding questions to help the student think
2. Break the problem into smaller parts
3. Hint at the relevant concept or formula
4. Encourage them with phrases like "You're on the right track!"
Keep it friendly, concise, and encouraging. Use simple English.

IMPORTANT RULES FOR THE END OF YOUR RESPONSE:
At the very end of your response, on new lines, you MUST write exactly:
ROOT_CONCEPTS: [1-2 concepts from the taxonomy list that relate to this doubt, comma separated]
CONFIDENCE: [number between 0.0 and 1.0 indicating your confidence in solving this doubt accurately]
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
At the very end of your response, on new lines, you MUST write exactly:
ROOT_CONCEPTS: [1-2 concepts from the taxonomy list that relate to this doubt, comma separated]
CONFIDENCE: [number between 0.0 and 1.0 indicating your confidence in solving this doubt accurately]
Taxonomy list: {', '.join(taxonomy_names)}"""

        full_prompt = f"{system_prompt}\n\nStudent's question: {question}"

        if image_data:
            model = genai.GenerativeModel('gemini-2.0-flash')
            import PIL.Image
            import io
            image_bytes_raw = base64.b64decode(image_data)
            img = PIL.Image.open(io.BytesIO(image_bytes_raw))
            response = model.generate_content([full_prompt, img])
        else:
            model = genai.GenerativeModel('gemini-2.0-flash')
            response = model.generate_content(full_prompt)

        logger.info(f"✅ Gemini response generated for mode: {mode}")
        raw_text = response.text
        
        # Parse out ROOT_CONCEPTS and CONFIDENCE
        lines = raw_text.split('\n')
        concepts = []
        confidence = 0.85
        clean_text = []
        for line in lines:
            if line.startswith("ROOT_CONCEPTS:"):
                c_str = line.replace("ROOT_CONCEPTS:", "").strip()
                concepts = [c.strip() for c in c_str.split(",") if c.strip() in taxonomy_names]
            elif line.startswith("CONFIDENCE:"):
                try:
                    confidence = float(line.replace("CONFIDENCE:", "").strip())
                except:
                    confidence = 0.85
            else:
                clean_text.append(line)
                
        return {
            "response": "\n".join(clean_text).strip(),
            "concepts": concepts,
            "confidence": confidence
        }

    except Exception as e:
        logger.error(f"❌ Gemini API error: {e}")
        return get_error_response(question, mode)


def get_error_response(question: str, mode: str) -> dict:
    """Error response when API key is not configured or API fails."""
    return {
        "response": "⚠️ **AI Tutor Unavailable**\n\nWe could not connect to the Gemini AI service to process your question. Please make sure a valid `GEMINI_API_KEY` is set in the backend `.env` configuration file.",
        "concepts": [],
        "confidence": 0.0,
        "requires_escalation": True,
        "error": "NO_API_KEY"
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
    
    # Format curriculum citations from database
    citations = []
    for c_name in identified_concepts:
        c_obj = next((c for c in all_concepts if c.name == c_name), None)
        if c_obj and getattr(c_obj, 'ncert_reference', None) and c_obj.ncert_reference not in citations:
            citations.append(c_obj.ncert_reference)
            
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
            parent_name = getattr(c_obj, 'parent_concept', None)
            if parent_name:
                sibs = [x.id for x in all_concepts if getattr(x, 'parent_concept', None) == parent_name and x.id != c_obj.id]
                related_ids.extend(sibs)
                kids = [x.id for x in all_concepts if getattr(x, 'parent_concept', None) == c_obj.name]
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
    check_and_award_badges(student_id, db)

    logger.info(f"✅ Doubt {doubt.id} resolved for student {student_id}")
    conf = result.get("confidence", 0.85)
    return {
        "doubt_id": doubt.id,
        "question": question,
        "response": response_text,
        "mode": mode,
        "concept_tags": identified_concepts,
        "related_weak_areas": related_weak_areas[:3], # Limit to 3
        "has_image": image is not None,
        "confidence": conf,
        "requires_escalation": conf < 0.5 or result.get("error") is not None,
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


class FeedbackRequest(BaseModel):
    upvote: bool

@router.post("/{doubt_id}/feedback")
def submit_doubt_feedback(
    doubt_id: int,
    payload: FeedbackRequest,
    db: Session = Depends(get_db)
):
    doubt = db.query(Doubt).filter(Doubt.id == doubt_id).first()
    if not doubt:
        raise HTTPException(status_code=404, detail="Doubt not found")
    feedback = DoubtFeedback(doubt_id=doubt_id, upvote=payload.upvote)
    db.add(feedback)
    db.commit()
    return {"status": "success", "doubt_id": doubt_id, "upvote": payload.upvote}
