import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient, Prisma } from '@prisma/client';

// Initialize Express and Prisma
const app = express();
const prisma = new PrismaClient();

app.use(express.json());

// ✅ FIXED CORS CONFIGURATION
app.use(
  cors({
    origin: [
      "http://localhost:3000", // default Next.js dev port
      "http://localhost:3002", // alternate frontend port
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Handle preflight requests
app.options('*', cors());

// ✅ Remove problematic CSP headers (from earlier setup)
app.use((req, res, next) => {
  res.removeHeader("Content-Security-Policy");
  next();
});

const PORT = Number(process.env.PORT || 3001);

// ------------------ HEALTH CHECK ------------------
app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// ------------------ /stats ------------------
app.get('/stats', async (_req: Request, res: Response) => {
  try {
    const [totalSpend, invoiceCount, avgInvoice, docsUploaded] = await Promise.all([
      prisma.invoice.aggregate({ _sum: { total: true } }),
      prisma.invoice.count(),
      prisma.invoice.aggregate({ _avg: { total: true } }),
      prisma.invoice.count(), // same as docs count
    ]);

    res.json({
      totalSpendYTD: totalSpend._sum.total?.toNumber?.() ?? 0,
      totalInvoices: invoiceCount,
      documentsUploaded: docsUploaded,
      averageInvoiceValue: avgInvoice._avg.total?.toNumber?.() ?? 0,
    });
  } catch (err) {
    console.error("Error in /stats:", err);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// ------------------ /invoice-trends ------------------
app.get('/invoice-trends', async (_req: Request, res: Response) => {
  try {
  const rows = await prisma.$queryRawUnsafe(`
      SELECT date_trunc('month', COALESCE("invoiceDate", now())) AS month,
             COUNT(*)::int AS invoice_count,
             COALESCE(SUM(COALESCE(total,0)),0)::decimal AS invoice_sum
      FROM "Invoice"
      GROUP BY 1
      ORDER BY 1
    `);

    res.json(
      rows.map((r) => ({
        month: r.month,
        invoiceCount: Number(r.invoice_count),
        invoiceSum: r.invoice_sum?.toString(),
      }))
    );
  } catch (err) {
    console.error("Error in /invoice-trends:", err);
    res.status(500).json({ error: "Failed to fetch invoice trends" });
  }
});

// ------------------ /vendors/top10 ------------------
app.get('/vendors/top10', async (_req: Request, res: Response) => {
  try {
  const rows = await prisma.$queryRawUnsafe(`
      SELECT v.name, COALESCE(SUM(i.total),0) AS spend
      FROM "Invoice" i
      JOIN "Vendor" v ON v.id = i."vendorId"
      GROUP BY v.name
      ORDER BY spend DESC
      LIMIT 10
    `);

    res.json(
      rows.map((r) => ({
        vendor: r.name,
        spend: r.spend?.toString(),
      }))
    );
  } catch (err) {
    console.error("Error in /vendors/top10:", err);
    res.status(500).json({ error: "Failed to fetch vendors" });
  }
});

// ------------------ /category-spend ------------------
app.get('/category-spend', async (_req: Request, res: Response) => {
  try {
  const rows = await prisma.$queryRawUnsafe(`
      SELECT COALESCE(li.category,'Uncategorized') AS category,
             COALESCE(SUM(li."totalPrice"),0) AS spend
      FROM "LineItem" li
      GROUP BY 1
      ORDER BY spend DESC
    `);

    res.json(
      rows.map((r) => ({
        category: r.category,
        spend: r.spend?.toString(),
      }))
    );
  } catch (err) {
    console.error("Error in /category-spend:", err);
    res.status(500).json({ error: "Failed to fetch category spend" });
  }
});

// ------------------ /cash-outflow ------------------
app.get('/cash-outflow', async (_req: Request, res: Response) => {
  try {
  const rows = await prisma.$queryRawUnsafe(`
      SELECT COALESCE(p."dueDate", date_trunc('month', now()))::date AS date,
             COALESCE(SUM(i.total),0) AS amount
      FROM "Payment" p
      JOIN "Invoice" i ON i.id = p."invoiceId"
      GROUP BY 1
      ORDER BY 1
    `);

    res.json(
      rows.map((r) => ({
        date: r.date,
        amount: r.amount?.toString(),
      }))
    );
  } catch (err) {
    console.error("Error in /cash-outflow:", err);
    res.status(500).json({ error: "Failed to fetch cash outflow" });
  }
});

// ------------------ /invoices ------------------
app.get('/invoices', async (req: Request, res: Response) => {
  try {
    const search = String(req.query.search || '').trim();
    const status = String(req.query.status || '').trim();

    const where: Prisma.InvoiceWhereInput = {};
    if (status) where.status = status;

    const invoices = await prisma.invoice.findMany({
      where: {
        AND: [
          where,
          search
            ? {
                OR: [
                  { number: { contains: search, mode: 'insensitive' } },
                  { vendor: { name: { contains: search, mode: 'insensitive' } } },
                  { customer: { name: { contains: search, mode: 'insensitive' } } },
                ],
              }
            : {},
        ],
      },
      include: { vendor: true, customer: true },
      orderBy: { invoiceDate: 'desc' },
      take: 500,
    });

    res.json(
      invoices.map((i) => ({
        vendor: i.vendor.name,
        date: i.invoiceDate,
        invoiceNumber: i.number,
        amount: i.total,
        status: i.status || 'unknown',
      }))
    );
  } catch (err) {
    console.error("Error in /invoices:", err);
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

// ------------------ /chat-with-data ------------------
app.post('/chat-with-data', async (req: Request, res: Response) => {
  const base = process.env.VANNA_API_BASE_URL;
  if (!base)
    return res.status(500).json({ error: 'VANNA_API_BASE_URL not configured' });

  try {
    const cleanedBase = base.replace(/\/$/, '');
    const r = await fetch(`${cleanedBase}/chat`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.VANNA_API_KEY || '',
      },
      body: JSON.stringify(req.body),
    });
    const data = await r.json();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message || 'proxy_failed' });
  }
});

// ------------------ GLOBAL ERROR HANDLER ------------------
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
});

// ------------------ START SERVER ------------------
app.listen(PORT, () => {
  console.log(`🚀 API listening on http://localhost:${PORT}`);
});
