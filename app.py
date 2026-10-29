import os
import uuid
import re
import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from core import psycho_reader_agent, processing_lock

class SurveyPayload(BaseModel):
    answers: list[int] = Field(..., description="Array of 27 integer scores (1-5)")
    lang: str = Field("en", description="Language code ('en' or 'si')")

def parse_ai_report(text):
    sections = {
        "specimen_type": "",
        "neural_breakdown": "",
        "dark_future": "",
        "summary": ""
    }
    
    specimen_match = re.search(r"--- 🧪 SPECIMEN TYPE ---\n(.*?)(?=\n---|$)", text, re.DOTALL)
    breakdown_match = re.search(r"--- 📉 NEURAL BREAKDOWN ---\n(.*?)(?=\n---|$)", text, re.DOTALL)
    future_match = re.search(r"--- 🔮 THE DARK FUTURE ---\n(.*?)(?=\n---|$)", text, re.DOTALL)
    summary_match = re.search(r"--- 📜 SUMMARY ---\n(.*?)(?=\n---|$)", text, re.DOTALL)

    if specimen_match: sections["specimen_type"] = specimen_match.group(1).strip()
    if breakdown_match: sections["neural_breakdown"] = breakdown_match.group(1).strip()
    if future_match: sections["dark_future"] = future_match.group(1).strip()
    if summary_match: sections["summary"] = summary_match.group(1).strip()
    
    return sections

app = FastAPI()

# Allow all origins or specify exact domains
origins = [
    "https://slmgx.live",
    "https://www.slmgx.live",
    "https://slmgx.edu.lk",
    "https://www.slmgx.edu.lk",
    "http://localhost:3000", 
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set to ["*"] to guarantee CORS headers are sent during debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "data"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload-results")
async def upload_results(payload: SurveyPayload):
    if len(payload.answers) != 27:
        raise HTTPException(status_code=400, detail="Expected exactly 27 answers.")

    unique_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{unique_id}.csv")

    try:
        # Write scores into a CSV file
        with open(file_path, "w") as f:
            f.write(",".join(map(str, payload.answers)) + "\n")

        async with processing_lock:
            # Execute agent
            results = psycho_reader_agent(file_path, lang=payload.lang)
            full_text = results["messages"][-1].content
            divided_report = parse_ai_report(full_text)

        mach = round(sum(payload.answers[0:9]) / 9.0, 1)
        narc = round(sum(payload.answers[9:18]) / 9.0, 1)
        psyc = round(sum(payload.answers[18:27]) / 9.0, 1)

        ai_message = divided_report.get("summary") or full_text

        return {
            "machiavellianism": mach,
            "narcissism": narc,
            "psychopathy": psyc,
            "ai_message": ai_message,
            "report": divided_report,
            "full_text": full_text
        }

    except Exception as e:
        # Prevent server unhandled crash so CORS headers are preserved
        print(f"Error during execution: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"detail": f"Backend processing error: {str(e)}"}
        )

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
