from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
from google.genai import types
import os

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

@app.get("/")
def read_root():
    return {"message": "CampusMate AI backend is running"}

class AskRequest(BaseModel):
    question: str

@app.post("/ai/ask")
def ask_ai(request: AskRequest):
    response = client.models.generate_content(
        model="gemini-flash-latest",
        contents=request.question,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT
        ),
    )
    return {"answer": response.text}