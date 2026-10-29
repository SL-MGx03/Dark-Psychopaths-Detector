import asyncio
import os
import re
import traceback
import uuid

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from core import psycho_reader_agent, processing_lock


class SurveyPayload(BaseModel):
    answers: list[int] = Field(
        ...,
        min_length=27,
        max_length=27,
        description="Exactly 27 integer scores from 1 to 5",
    )
    lang: str = Field(
        default="en",
        description="Language code: en or si",
    )


def parse_ai_report(text: str) -> dict[str, str]:
    sections = {
        "specimen_type": "",
        "neural_breakdown": "",
        "dark_future": "",
        "summary": "",
    }

    patterns = {
        "specimen_type": r"---\s*🧪\s*SPECIMEN TYPE\s*---\s*(.*?)(?=\n---|$)",
        "neural_breakdown": r"---\s*📉\s*NEURAL BREAKDOWN\s*---\s*(.*?)(?=\n---|$)",
        "dark_future": r"---\s*🔮\s*THE DARK FUTURE\s*---\s*(.*?)(?=\n---|$)",
        "summary": r"---\s*📜\s*SUMMARY\s*---\s*(.*?)(?=\n---|$)",
    }

    for section_name, pattern in patterns.items():
        match = re.search(pattern, text, re.DOTALL | re.IGNORECASE)
        if match:
            sections[section_name] = match.group(1).strip()

    return sections


app = FastAPI(title="Dark Psychopaths Detector API")


# The browser Origin must match one of these values exactly.
ALLOWED_ORIGINS = [
    "https://slmgx.edu.lk",
    "https://www.slmgx.edu.lk",
    "https://slmgx.live",
    "https://www.slmgx.live",
    "http://localhost:3000",
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


UPLOAD_DIR = "data"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
async def health_check():
    return {"status": "ok"}


@app.options("/upload-results")
async def upload_results_preflight():
    return {"status": "ok"}


@app.post("/upload-results")
async def upload_results(payload: SurveyPayload):
    if len(payload.answers) != 27:
        raise HTTPException(
            status_code=400,
            detail="Expected exactly 27 answers.",
        )

    if any(answer < 1 or answer > 5 for answer in payload.answers):
        raise HTTPException(
            status_code=400,
            detail="Every answer must be an integer between 1 and 5.",
        )

    if payload.lang not in {"en", "si"}:
        raise HTTPException(
            status_code=400,
            detail="Language must be either 'en' or 'si'.",
        )

    unique_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{unique_id}.csv")

    try:
        with open(file_path, "w", encoding="utf-8") as file:
            file.write(",".join(map(str, payload.answers)) + "\n")

        async with processing_lock:
            # Run the synchronous AI function outside the event loop.
            results = await asyncio.to_thread(
                psycho_reader_agent,
                file_path,
                lang=payload.lang,
            )

        messages = results.get("messages", [])
        if not messages:
            raise RuntimeError("AI agent returned no messages.")

        last_message = messages[-1]
        full_text = getattr(last_message, "content", str(last_message))

        divided_report = parse_ai_report(full_text)

        machiavellianism = round(sum(payload.answers[0:9]) / 9, 1)
        narcissism = round(sum(payload.answers[9:18]) / 9, 1)
        psychopathy = round(sum(payload.answers[18:27]) / 9, 1)

        ai_message = divided_report["summary"] or full_text

        return {
            "machiavellianism": machiavellianism,
            "narcissism": narcissism,
            "psychopathy": psychopathy,
            "ai_message": ai_message,
            "report": divided_report,
            "full_text": full_text,
        }

    except HTTPException:
        raise

    except Exception as error:
        print("Backend Execution Error Trace:")
        print(traceback.format_exc())

        return JSONResponse(
            status_code=500,
            content={
                "detail": f"Backend processing error: {str(error)}",
            },
        )

    finally:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except OSError:
                print(f"Could not remove temporary file: {file_path}")


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        proxy_headers=True,
        forwarded_allow_ips="*",
    )
