import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text

app = FastAPI()

# Allow all origins (for local frontend access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Database Connection ---
DB_URL = os.getenv("DATABASE_URL", "postgresql://flowbit:flowbit@localhost:5432/flowbit")
engine = create_engine(DB_URL)
print(f"🔗 Connected to database: {DB_URL}")

# --- Model ---
class ChatReq(BaseModel):
    question: str


# --- Function: Convert question to SQL ---
def naive_sql_from_question(q: str) -> str:
    qs = q.lower()

    # 1️⃣ Vendor Spend Summary
    if "total spend" in qs and "vendor" in qs:
        return '''
            SELECT v.name AS vendor, 
                   SUM(COALESCE(i.total, 0)) AS total_spend
            FROM "Vendor" v
            LEFT JOIN "Invoice" i ON v.id = i."vendorId"
            GROUP BY v.name
            ORDER BY total_spend DESC;
        '''

    # 2️⃣ Top 5 Vendors
    if "top 5 vendors" in qs:
        return '''
            SELECT v.name AS vendor, 
                   SUM(COALESCE(i.total, 0)) AS total_spend
            FROM "Vendor" v
            LEFT JOIN "Invoice" i ON v.id = i."vendorId"
            GROUP BY v.name
            ORDER BY total_spend DESC
            LIMIT 5;
        '''

    # 3️⃣ Monthly Invoice Summary
    if "total invoices" in qs and "month" in qs:
        return '''
            SELECT DATE_TRUNC('month', "invoiceDate") AS month,
                   COUNT(*) AS invoice_count,
                   SUM(COALESCE(total, 0)) AS total_amount
            FROM "Invoice"
            GROUP BY month
            ORDER BY month;
        '''

    # 4️⃣ Average Invoice Amount
    if "average invoice" in qs:
        return 'SELECT ROUND(AVG(COALESCE(total, 0)), 2) AS avg_invoice_amount FROM "Invoice";'

    # 5️⃣ Customer Total Spend
    if "customers" in qs and "total invoice" in qs:
        return '''
            SELECT c.name AS customer,
                   COUNT(i.id) AS invoice_count,
                   SUM(COALESCE(i.total, 0)) AS total_spend
            FROM "Customer" c
            LEFT JOIN "Invoice" i ON c.id = i."customerId"
            GROUP BY c.name
            ORDER BY total_spend DESC;
        '''

    # 6️⃣ Unpaid Invoices by Customer
    if "unpaid invoices" in qs or "unpaid" in qs:
        return '''
            SELECT c.name AS customer,
                   COUNT(i.id) AS unpaid_invoices,
                   SUM(COALESCE(i.total, 0)) AS unpaid_total
            FROM "Customer" c
            JOIN "Invoice" i ON c.id = i."customerId"
            WHERE i.status = 'unpaid'
            GROUP BY c.name
            ORDER BY unpaid_total DESC;
        '''

    # 7️⃣ Spend by Product Category
    if "spend by category" in qs:
        return '''
            SELECT li.category AS category,
                   SUM(COALESCE(li."totalPrice", 0)) AS total_spend
            FROM "LineItem" li
            GROUP BY li.category
            ORDER BY total_spend DESC;
        '''

    # 8️⃣ Top 10 Products
    if "top 10 products" in qs:
        return '''
            SELECT li.description AS product,
                   SUM(COALESCE(li."totalPrice", 0)) AS total_sales
            FROM "LineItem" li
            GROUP BY li.description
            ORDER BY total_sales DESC
            LIMIT 10;
        '''

    # 9️⃣ Monthly Cash Outflow
    if "cash outflow" in qs or ("total spend" in qs and "month" in qs):
        return '''
            SELECT DATE_TRUNC('month', "invoiceDate") AS month,
                   SUM(COALESCE(total, 0)) AS total_outflow
            FROM "Invoice"
            GROUP BY month
            ORDER BY month;
        '''

    # 🔟 Year-To-Date Spend
    if "year-to-date" in qs or "ytd" in qs:
        return '''
            SELECT SUM(COALESCE(total, 0)) AS ytd_spend
            FROM "Invoice"
            WHERE EXTRACT(YEAR FROM "invoiceDate") = EXTRACT(YEAR FROM CURRENT_DATE);
        '''

    # 🕓 Fallback Query
    return '''
        SELECT number AS invoice_number, total
        FROM "Invoice"
        ORDER BY "invoiceDate" DESC
        LIMIT 10;
    '''


# --- Endpoint ---
@app.post("/chat")
def chat(req: ChatReq):
    print(f"🧠 Question received: {req.question}")
    sql = naive_sql_from_question(req.question)
    print(f"🧾 Generated SQL:\n{sql}")

    try:
        with engine.connect() as conn:
            result = conn.execute(text(sql))
            rows = [dict(row._mapping) for row in result]
            print(f"✅ Rows returned: {len(rows)}")

            # Format response
            formatted_rows = []
            for row in rows:
                formatted_row = {}
                for key, value in row.items():
                    if isinstance(value, (int, float)):
                        formatted_row[key] = f"₹{value:,.2f}"
                    elif value is None:
                        formatted_row[key] = "N/A"
                    else:
                        formatted_row[key] = str(value)
                formatted_rows.append(formatted_row)

            message = "Here are the results from your query:"
            if "total spend" in req.question.lower():
                message = "Here's the total spend summary."
            elif "top" in req.question.lower():
                message = "Here are the top results you requested."
            elif "average" in req.question.lower():
                message = "Average value calculated."
            elif "month" in req.question.lower():
                message = "Monthly trend data retrieved."
            elif "customer" in req.question.lower():
                message = "Customer-related insights."
            elif "product" in req.question.lower():
                message = "Product performance summary."

            return {"message": message, "rows": formatted_rows}

    except Exception as e:
        print(f"❌ Error executing SQL: {str(e)}")
        return {"message": f"Error executing query: {str(e)}", "rows": []}


# --- Run the app ---
if __name__ == "__main__":
    import uvicorn
    print("🚀 Starting Flowbit Data Chat API on http://localhost:8000 ...")
    uvicorn.run(app, host="0.0.0.0", port=8000)
