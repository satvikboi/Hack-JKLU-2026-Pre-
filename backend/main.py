from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import shutil
import asyncio

from ingestion import process_uploaded_file
from rag_engine import vectorize_and_store
from agent_logic import analyze_legal_document, LegalAnalysisResult

app = FastAPI(title="AI Legal Document Simplifier")

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = "temp_files"
os.makedirs(TEMP_DIR, exist_ok=True)

@app.post("/upload", response_model=LegalAnalysisResult)
async def upload_document(file: UploadFile = File(...)):
    """
    Handle document upload, processing, and strict AI legal analysis.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")
    
    session_id = str(uuid.uuid4())
    temp_file_path = os.path.join(TEMP_DIR, f"{session_id}_{file.filename}")
    
    try:
        # Save uploaded file
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Parse document into markdown (Async)
        markdown_content = await process_uploaded_file(temp_file_path)
        
        if not markdown_content:
            raise HTTPException(status_code=500, detail="Failed to parse document content")
            
        # Vectorize and store context (Run in thread to avoid blocking if large)
        await asyncio.to_thread(vectorize_and_store, markdown_content, session_id)
        
        # Analyze using AI agent (Run in thread since it makes synchronous API calls)
        result = await asyncio.to_thread(
            analyze_legal_document,
            session_id,
            "urban worker",
            "Hindi"
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        # Cleanup: ensure data privacy by removing the uploaded file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
