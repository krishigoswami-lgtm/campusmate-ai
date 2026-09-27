from fastapi import FastAPI
from pydantic import BaseModel
from dotenv import load_dotenv
from google import genai
import os

load_dotenv()

app = FastAPI()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

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
    )
    return {"answer": response.text}