from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import logging
import os
import base64
from pathlib import Path

from database import get_db, Doubt, Student

router = APIRouter()
logger = logging.getLogger(__name__)

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)


async def get_gemini_response(question: str, mode: str, image_data: Optional[str] = None) -> str:
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
Keep it friendly, concise, and encouraging. Use simple English."""
        else:
            system_prompt = """You are a helpful Math tutor for Indian Class 8-10 students.
Provide a clear, step-by-step solution:
1. Identify the concept being tested
2. State the relevant formula/rule
3. Show each step with explanation
4. Verify the answer
5. Mention a quick tip to remember this concept
Use simple language, emojis where helpful, and keep it under 200 words."""

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
        return response.text

    except Exception as e:
        logger.error(f"❌ Gemini API error: {e}")
        return get_mock_response(question, mode)


def get_mock_response(question: str, mode: str) -> str:
    """Fallback mock response when API key is not set."""
    if mode == "socratic":
        return """🤔 **Let's think about this together!**

Before I guide you, ask yourself:
1. **What type of problem is this?** (Linear equation? Polynomial? Geometry?)
2. **What information are you given?** List out all the values you know.
3. **What formula might apply here?** Think about what you've learned recently.

💡 *Hint:* Try to identify the unknown variable first, then work backwards from what you know.

What do you think the first step should be? Give it a try! 🎯"""
    else:
        return f"""📚 **Step-by-Step Solution**

**Your Question:** {question[:100]}...

**Concept:** Identifying the relevant mathematical concept

**Step 1:** Read the problem carefully and identify what's being asked
**Step 2:** Write down the given information
**Step 3:** Choose the appropriate formula or method
**Step 4:** Apply the method step by step
**Step 5:** Verify your answer

⚠️ *Note: Connect your Gemini API key in the backend `.env` file for AI-powered personalized explanations!*

💡 **Quick Tip:** Always verify your answer by substituting it back into the original equation!"""


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

    # Get AI response
    response_text = await get_gemini_response(question, mode, image_data)

    # Save to DB
    doubt = Doubt(
        student_id=student_id,
        question_text=question,
        image_path=image_path,
        response_text=response_text,
        mode=mode,
        resolved=True,
    )
    db.add(doubt)
    db.commit()
    db.refresh(doubt)

    logger.info(f"✅ Doubt {doubt.id} resolved for student {student_id}")
    return {
        "doubt_id": doubt.id,
        "question": question,
        "response": response_text,
        "mode": mode,
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
