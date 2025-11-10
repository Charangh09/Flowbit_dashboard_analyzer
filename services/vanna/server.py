from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from mock_data import MOCK_DATA
import traceback

app = FastAPI()

# Allow all origins (for local frontend access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],  # allow common dev ports
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

# --- Model ---
class ChatReq(BaseModel):
    question: str

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"❌ Error: {str(exc)}")
    print(traceback.format_exc())
    return JSONResponse(
        status_code=500,
        content={"message": "Internal server error", "detail": str(exc)},
    )


# --- Endpoints ---
@app.get("/health")
async def health_check():
    return {"status": "ok", "service": "Vanna AI"}

@app.post("/chat")
async def chat(req: ChatReq):
    print(f"🧠 Question received: {req.question}")
    question = req.question.lower()
    
    try:
        # Try to find matching mock data
        if "category" in question or "categories" in question:
            return MOCK_DATA["spend_by_category"]
        elif "vendor" in question or "suppliers" in question:
            return MOCK_DATA["top_vendors"]
        elif "monthly" in question and "invoice" in question:
            return MOCK_DATA["monthly invoices"]
        
        # Default response
        return {
            "message": "I understand you're asking about the data. Could you be more specific about what you'd like to know? You can ask about spending categories, vendors, or invoice trends.",
            "rows": MOCK_DATA["top_vendors"]["rows"][:3]  # Return top 3 vendors as example
        }
    except Exception as e:
        print(f"❌ Error processing question: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail="Error processing your question. Please try again with a different query."
        )

# --- Run the app ---
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Flowbit Data Chat API on http://localhost:8001 ...")
    uvicorn.run(app, host="127.0.0.1", port=8001, reload=False)
