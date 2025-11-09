from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os, psycopg2, requests, json
from dotenv import load_dotenv

# ✅ Load .env file explicitly
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

app = FastAPI()

# ✅ Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ✅ Load environment variables
DATABASE_URL = os.getenv("DATABASE_URL")
VANNA_API_KEY = os.getenv("VANNA_API_KEY")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PORT = int(os.getenv("PORT", 8010))

if not DATABASE_URL or not GROQ_API_KEY:
    raise Exception("❌ Missing DATABASE_URL or GROQ_API_KEY in .env")

print(f"🔗 Connected to DB: {DATABASE_URL}")
print(f"🧠 Using Groq API Key (first 8): {GROQ_API_KEY[:8]}...")
print(f"🚀 Starting Vanna API on port {PORT}...")

@app.post("/chat")
async def chat_with_data(req: Request):
    body = await req.json()
    query = body.get("query")
    client_key = req.headers.get("x-api-key")

    if VANNA_API_KEY and client_key != VANNA_API_KEY:
        raise HTTPException(status_code=401, detail="Unauthorized")

    if not query:
        raise HTTPException(status_code=400, detail="Missing 'query' in body")

    print(f"💬 Received Query: {query}")

    # ✅ Better prompt for Groq
    prompt = f"""
    You are a data analyst. Generate ONLY a valid SQL SELECT statement (PostgreSQL dialect)
    to answer the following user question based on tables: Invoice, Vendor, LineItem, Customer, Payment.

    Question: {query}

    Only return the SQL query, no explanations, no markdown.
    """

    try:
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": "mixtral-8x7b",
                "messages": [
                    {"role": "system", "content": "You are a helpful SQL data assistant."},
                    {"role": "user", "content": prompt},
                ],
                "temperature": 0.2,
            },
            timeout=40
        )

        groq_data = response.json()
        print("🧠 Groq response:", json.dumps(groq_data, indent=2))

        sql = (
            groq_data.get("choices", [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )

        if not sql.lower().startswith("select"):
            raise HTTPException(status_code=400, detail=f"Groq did not return valid SQL: {sql}")

    except Exception as e:
        print("❌ Error calling Groq:", str(e))
        raise HTTPException(status_code=500, detail=f"Groq API call failed: {e}")

    # ✅ Execute SQL
    try:
        conn = psycopg2.connect(DATABASE_URL.replace("postgresql+psycopg", "postgresql"))
        cur = conn.cursor()
        cur.execute(sql)
        rows = cur.fetchall()
        columns = [desc[0] for desc in cur.description]
        cur.close()
        conn.close()

        results = [dict(zip(columns, r)) for r in rows]
        print(f"✅ Query executed successfully: {sql}")

        return {"sql": sql, "results": results}

    except Exception as e:
        print("❌ Database query failed:", str(e))
        raise HTTPException(status_code=500, detail=f"Database query failed: {e}")


# ✅ Run server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=PORT)
