import { NextResponse } from 'next/server';

const MOCK_DATA = {
  spend_by_category: {
    message: "Here's the spending breakdown by category:",
    rows: [
      { category: "Office Supplies", total_spend: 12500.00 },
      { category: "Software", total_spend: 8750.00 },
      { category: "Travel", total_spend: 6300.00 },
      { category: "Hardware", total_spend: 5400.00 },
      { category: "Services", total_spend: 4200.00 }
    ]
  },
  top_vendors: {
    message: "Here are the top vendors by spend:",
    rows: [
      { vendor_name: "EasyFirma GmbH & Co KG", total_spend: 5680.00 },
      { vendor_name: "TechPro Solutions Inc", total_spend: 4320.00 },
      { vendor_name: "Global Office Supplies", total_spend: 3890.00 },
      { vendor_name: "Digital Services Ltd", total_spend: 3450.00 },
      { vendor_name: "SmartSoft Systems", total_spend: 2980.00 }
    ]
  },
  monthly_invoices: {
    message: "Here's the monthly invoice summary:",
    rows: [
      { month: "2025-01", invoice_count: 45, total_amount: 8750.00 },
      { month: "2025-02", invoice_count: 52, total_amount: 9200.00 },
      { month: "2025-03", invoice_count: 48, total_amount: 8950.00 },
      { month: "2025-04", invoice_count: 50, total_amount: 9100.00 },
      { month: "2025-05", invoice_count: 47, total_amount: 8800.00 }
    ]
  }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const question = (body.question || '').toLowerCase();

    if (question.includes('category') || question.includes('categories')) {
      return NextResponse.json(MOCK_DATA.spend_by_category);
    } else if (question.includes('vendor') || question.includes('suppliers')) {
      return NextResponse.json(MOCK_DATA.top_vendors);
    } else if (question.includes('monthly') && question.includes('invoice')) {
      return NextResponse.json(MOCK_DATA.monthly_invoices);
    }

    // Default response with example data
    return NextResponse.json({
      message: "I understand you're asking about the data. Could you be more specific? You can ask about spending categories, vendors, or invoice trends.",
      rows: MOCK_DATA.top_vendors.rows.slice(0, 3)
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Error processing your question. Please try again.' },
      { status: 500 }
    );
  }
}