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

class VivaTurn(BaseModel):
    question: str
    answer: str

class VivaRequest(BaseModel):
    topic: str
    difficulty: str
    history: list[VivaTurn]

@app.post("/ai/viva")
def viva_turn(request: VivaRequest):
    history_text = ""
    for turn in request.history:
        history_text += f'Examiner asked: "{turn.question}"\nStudent answered: "{turn.answer}"\n\n'

    if request.history:
        prompt = f"""You are conducting a spoken viva (oral exam) with a college student on the topic "{request.topic}" at {request.difficulty} difficulty.

Conversation so far:
{history_text}

Give brief, encouraging feedback (2-3 sentences) on the student's most recent answer, then ask ONE new related follow-up question on the same topic that has not been asked yet. Keep the question appropriate for the {request.difficulty} difficulty level a typical undergraduate student would face, not research-level.

Return ONLY valid JSON, no other text, in exactly this format:
{{
  "feedback": "feedback on the last answer here",
  "next_question": "the next question here"
}}"""
    else:
        prompt = f"""You are conducting a spoken viva (oral exam) with a college student on the topic "{request.topic}" at {request.difficulty} difficulty. Keep questions appropriate for a typical undergraduate student at this difficulty level, not research-level.

Ask ONE opening question to begin the viva.

Return ONLY valid JSON, no other text, in exactly this format:
{{
  "feedback": null,
  "next_question": "the opening question here"
}}"""

    try:
        response = generate_with_retry(
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        result = json.loads(response.text)
        return result
    except genai_errors.ServerError:
        raise HTTPException(status_code=503, detail="The AI service is currently busy. Please try again in a moment.")

class StudyPlanRequest(BaseModel):
    subjects: list[str]
    exam_date: str
    hours_per_day: int

@app.post("/ai/study-plan")
def generate_study_plan(request: StudyPlanRequest):
    subjects_text = ", ".join(request.subjects)
    prompt = f"""Create a day-by-day study plan for a college student preparing for exams.

Subjects to cover: {subjects_text}
Exam date: {request.exam_date}
Available study time: {request.hours_per_day} hours per day

Create a realistic plan from today until the exam date (if the gap is very large, cover a reasonable 7-14 day plan instead). Distribute subjects sensibly across days. Each day should have 2-4 concrete, specific tasks (not vague like "study subject" but specific like "revise binary trees and practice 5 problems").

Return ONLY valid JSON, no other text, in exactly this format:
[
  {{
    "day_label": "Day 1",
    "tasks": [
      {{"subject": "subject name", "task": "specific task description"}}
    ]
  }}
]"""

    try:
        response = generate_with_retry(
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        plan = json.loads(response.text)
        return {"plan": plan}
    except genai_errors.ServerError:
        raise HTTPException(status_code=503, detail="The AI service is currently busy. Please try again in a moment.")

class SummarizeRequest(BaseModel):
    content: str

@app.post("/ai/summarize")
def summarize_notes(request: SummarizeRequest):
    prompt = f"""Summarize these study notes for a college student.

Notes:
{request.content}

Return ONLY valid JSON, no other text, in exactly this format:
{{
  "summary": "a concise 2-4 sentence summary",
  "key_points": ["point 1", "point 2", "point 3"],
  "key_terms": ["term 1", "term 2"]
}}"""

    try:
        response = generate_with_retry(
            contents=prompt,
            config=types.GenerateContentConfig(response_mime_type="application/json"),
        )
        result = json.loads(response.text)
        return result
    except genai_errors.ServerError:
        raise HTTPException(status_code=503, detail="The AI service is currently busy. Please try again in a moment.")

class MistakeRequest(BaseModel):
    question: str
    wrong_answer: str
    correct_answer: str

@app.post("/ai/explain-mistake")
def explain_mistake(request: MistakeRequest):
    prompt = f"""A college student answered a question incorrectly. Explain their mistake kindly and clearly.

Question: {request.question}
Student's answer (incorrect): {request.wrong_answer}
Correct answer: {request.correct_answer}

Write a short, encouraging explanation (3-4 sentences) of why their answer was wrong and why the correct answer is right. Do not use JSON, just write plain text."""

    try:
        response = generate_with_retry(
            contents=prompt,
            config=types.GenerateContentConfig(system_instruction=SYSTEM_PROMPT),
        )
        return {"explanation": response.text}
    except genai_errors.ServerError:
        raise HTTPException(status_code=503, detail="The AI service is currently busy. Please try again in a moment.")