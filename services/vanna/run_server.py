import os
os.chdir(os.path.dirname(__file__))  # Change to script directory
from server import app
import uvicorn

if __name__ == "__main__":
    print("🚀 Starting Vanna mock server on http://127.0.0.1:8001")
    uvicorn.run(app, host="127.0.0.1", port=8001)