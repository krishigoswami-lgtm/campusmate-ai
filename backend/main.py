from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types
from google.genai import errors as genai_errors
import os
import json
import time

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

SYSTEM_PROMPT = """You are a friendly, patient academic tutor for a college student learning platform called CampusMate AI.

When answering:
- Write in plain paragraphs, like a person explaining something out loud. Avoid excessive headers, bullet lists, and tables unless the student specifically asks for a structured breakdown or comparison.
- Keep answers concise by default: 3-6 short paragraphs is usually enough. Only go longer if the student asks for more depth or the topic genuinely requires it.
- Use simple, everyday language first, then introduce technical terms naturally, explaining them as you go.
- Use one small concrete example if it helps understanding, but don't pile on multiple examples unless asked.
- Never assume advanced prior knowledge unless the student's question signals they already have it.
- Be warm and encouraging in tone, like a helpful senior student, not a textbook."""

def generate_with_retry(contents, config, max_retries=3):
    last_error = None
    for attempt in range(max_retries):
        try:
            return client.models.generate_content(
                model="gemini-flash-latest",
                contents=contents,
                config=config,
            )
        except genai_errors.ServerError as e:
            last_error = e
            if attempt < max_retries - 1:
                time.sleep(2 * (attempt + 1))
            continue
    raise last_error

@app.get("/")
def read_root():
    return {"message": "CampusMate AI backend is running"}

class AskRequest(BaseModel):
    question: str

@app.post("/ai/ask")
def ask_ai(request: AskRequest):
    try:
        response = generate_with_retry(
            contents=request.question,
            config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
        )
        return {"answer": response.text}
    except genai_errors.ServerError:
        raise HTTPException(status_code=503, detail="The AI service is currently busy. Please try again in a moment.")

class QuizRequest(BaseModel):
    topic: str
    difficulty: str
    num_questions: int

@app.post("/ai/generate-quiz")
def generate_quiz(request: QuizRequest):
    prompt = f"""Generate {request.num_questions} multiple choice questions about "{request.topic}" at {request.difficulty} difficulty level for a college student.

Return ONLY a valid JSON array, no other text, in exactly this format:
[
  {{
    "question": "the question text",
    "options": ["option A", "option B", "option C", "option D"],
    "correct_answer": "the exact text of the correct option",
    "explanation": "a brief 1-2 sentence explanation of why this is correct"
  }}
]"""

    try:
        response = generate_with_retry(
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        questions = json.loads(response.text)
        return {"questions": questions}
    except genai_errors.ServerError:
        raise HTTPException(status_code=503, detail="The AI service is currently busy. Please try again in a moment.")