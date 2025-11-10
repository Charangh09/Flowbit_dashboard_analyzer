import { NextResponse } from 'next/server';

const mockStats = {
  totalSpendYTD: 525000,
  totalInvoices: 420,
  documentsUploaded: 118,
  averageInvoiceValue: 1250,
};

const mockTrends = [
  { month: '2025-01-01', invoiceCount: 45, invoiceSum: '125000' },
  { month: '2025-02-01', invoiceCount: 52, invoiceSum: '145000' },
  { month: '2025-03-01', invoiceCount: 38, invoiceSum: '98000' },
  { month: '2025-04-01', invoiceCount: 60, invoiceSum: '160000' },
];

const mockVendors = Array.from({ length: 10 }).map((_, i) => ({ vendor: `Vendor ${i + 1}`, spend: (50000 - i * 3000).toString() }));

const mockCats = [
  { category: 'Software', spend: '150000' },
  { category: 'Office Supplies', spend: '80000' },
  { category: 'Marketing', spend: '60000' },
];

const mockOutflow = [
  { date: '2025-04-01', amount: '160000' },
  { date: '2025-05-01', amount: '170000' },
  { date: '2025-06-01', amount: '155000' },
];

const mockInvoices = Array.from({ length: 12 }).map((_, i) => ({
  vendor: `Vendor ${((i % 10) + 1)}`,
  customer: `Customer ${((i % 5) + 1)}`,
  date: `2025-${String(((i % 6) + 1)).padStart(2, '0')}-0${((i % 28) + 1)}`,
  invoiceNumber: `INV-${(1000 + i).toString()}`,
  amountNumber: 1000 + i * 250,
  amount: `₹${(1000 + i * 250).toFixed(2)}`,
  status: i % 3 === 0 ? 'paid' : 'unpaid',
  product: `Product ${((i % 10) + 1)}`,
}));

const mockProducts = Array.from({ length: 10 }).map((_, i) => ({
  product: `Product ${i + 1}`,
  total_sales: (10000 - i * 500).toString(),
}));

const mockCustomerTotals = Array.from({ length: 5 }).map((_, i) => ({
  customer: `Customer ${i + 1}`,
  total_spend: (50000 - i * 5000).toString(),
}));

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api/, '') || '/';

    switch (path) {
      case '/stats':
      case '/':
        return NextResponse.json(mockStats);
      case '/invoice-trends':
        return NextResponse.json(mockTrends);
      case '/vendors/top10':
        return NextResponse.json(mockVendors);
      case '/category-spend':
        return NextResponse.json(mockCats);
      case '/cash-outflow':
        return NextResponse.json(mockOutflow);
      case '/invoices':
        return NextResponse.json(mockInvoices);
      default:
        return NextResponse.json({ error: 'not found' }, { status: 404 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const path = url.pathname.replace(/^\/api/, '') || '/';

    if (path === '/chat-with-data' || path === '/chat') {
      const body = await req.json().catch(() => ({}));
      const question = (body.question || body.q || '').toString().toLowerCase();

      // Match popular queries and return shaped mock responses
      if (question.includes('total spend by vendor') || (question.includes('total spend') && question.includes('vendor'))) {
        const rows = mockVendors.map((v) => ({ vendor: v.vendor, total_spend: `₹${Number(v.spend).toLocaleString()}` }));
        return NextResponse.json({ message: "Here's the total spend by vendor (YTD).", rows });
      }

      if (question.includes('top 5 vendors') || (question.includes('top') && question.includes('vendors'))) {
        const rows = mockVendors.slice(0, 5).map((v) => ({ vendor: v.vendor, spend: `₹${Number(v.spend).toLocaleString()}` }));
        return NextResponse.json({ message: 'Top 5 vendors by spend.', rows });
      }

      if (question.includes('most recent invoices') || question.includes('most recent') || question.includes('recent invoices') || question.includes('10 most')) {
        const rows = mockInvoices
          .slice(0)
          .sort((a, b) => (a.date > b.date ? -1 : 1))
          .slice(0, 10)
          .map((inv) => ({ vendor: inv.vendor, date: inv.date, invoice_number: inv.invoiceNumber, amount: inv.amount, status: inv.status }));
        return NextResponse.json({ message: 'Most recent invoices.', rows });
      }

      if (question.includes('average invoice')) {
        const avg = Math.round(mockInvoices.reduce((s, r) => s + r.amountNumber, 0) / mockInvoices.length);
        return NextResponse.json({ message: 'Average invoice value calculated.', rows: [{ avg_invoice_amount: `₹${avg.toLocaleString()}` }] });
      }

      if (question.includes('monthly') && question.includes('invoice')) {
        // return last 6 months from mockTrends
        const rows = mockTrends.slice(-6).map((t) => ({ month: t.month.slice(0, 7), invoice_count: t.invoiceCount, invoice_sum: `₹${Number(t.invoiceSum).toLocaleString()}` }));
        return NextResponse.json({ message: 'Monthly invoice count and totals.', rows });
      }

      if (question.includes('spend by category') || question.includes('category')) {
        const rows = mockCats.map((c) => ({ category: c.category, spend: `₹${Number(c.spend).toLocaleString()}` }));
        return NextResponse.json({ message: 'Spend by category (top categories).', rows });
      }

      if (question.includes('cash outflow') || question.includes('forecast')) {
        const rows = mockOutflow.map((o) => ({ date: o.date, amount: `₹${Number(o.amount).toLocaleString()}` }));
        return NextResponse.json({ message: 'Cash outflow forecast (next 3 months).', rows });
      }

      if (question.includes('unpaid invoices') || (question.includes('unpaid') && question.includes('customer'))) {
        // group unpaid by customer
        const unpaid = mockInvoices.filter((i) => i.status === 'unpaid');
        const map: Record<string, number> = {};
        unpaid.forEach((u) => (map[u.customer] = (map[u.customer] || 0) + u.amountNumber));
        const rows = Object.entries(map).map(([customer, total]) => ({ customer, unpaid_total: `₹${total.toLocaleString()}` }));
        return NextResponse.json({ message: 'Unpaid invoices by customer with totals.', rows });
      }

      if (question.includes('largest total spend') || question.includes('largest spend') || question.includes('which vendor has the largest')) {
        const top = mockVendors[0];
        return NextResponse.json({ message: 'Vendor with largest total spend.', rows: [{ vendor: top.vendor, total_spend: `₹${Number(top.spend).toLocaleString()}` }] });
      }

      if (question.includes('this month') && question.includes('last month')) {
        // simple mock compare
        const thisMonth = 160000;
        const lastMonth = 145000;
        return NextResponse.json({ message: 'Comparison: this month vs last month.', rows: [{ period: 'this_month', total: `₹${thisMonth.toLocaleString()}` }, { period: 'last_month', total: `₹${lastMonth.toLocaleString()}` }] });
      }

      if (question.includes('top 10 products') || question.includes('products by sales') || question.includes('top 10 product')) {
        const rows = mockProducts.map((p) => ({ product: p.product, total_sales: `₹${Number(p.total_sales).toLocaleString()}` }));
        return NextResponse.json({ message: 'Top 10 products by sales.', rows });
      }

      if (question.includes('between 2025-01-01') && question.includes('2025-03-31')) {
        const rows = mockInvoices.filter((i) => i.date >= '2025-01-01' && i.date <= '2025-03-31').map((inv) => ({ vendor: inv.vendor, date: inv.date, invoice_number: inv.invoiceNumber, amount: inv.amount, status: inv.status }));
        return NextResponse.json({ message: 'Invoices between 2025-01-01 and 2025-03-31.', rows });
      }

      if (question.includes('customer-wise') || (question.includes('customer') && question.includes('total'))) {
        const rows = mockCustomerTotals.map((c) => ({ customer: c.customer, total_spend: `₹${Number(c.total_spend).toLocaleString()}` }));
        return NextResponse.json({ message: 'Customer-wise total invoice amount (desc).', rows });
      }

      // fallback
      return NextResponse.json({ message: 'Default response', rows: mockInvoices.slice(0, 10).map((inv) => ({ vendor: inv.vendor, date: inv.date, invoice_number: inv.invoiceNumber, amount: inv.amount, status: inv.status })) });
    }

    return NextResponse.json({ error: 'not found' }, { status: 404 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
