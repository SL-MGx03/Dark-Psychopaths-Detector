import shutil
import os
import uuid
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from core import psycho_reader_agent, processing_lock

app = FastAPI()

origins = [
    "https://slmgx.live",
    "https://www.slmgx.live",
    "https://slmgx.edu.lk",
    "https://www.slmgx.edu.lk",
    "http://localhost:3000", 
]


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "data"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/upload-results")
async def upload_results(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only .csv files")

    unique_id = str(uuid.uuid4())
    file_path = os.path.join(UPLOAD_DIR, f"{unique_id}.csv")

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        async with processing_lock:
            results = psycho_reader_agent(file_path)
            
        return {"evaluation": results["messages"][-1].content}
    
    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)