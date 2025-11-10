import { NextResponse } from 'next/server';
import analyticsData from '@/data/Analytics_Test_Data.json';

export async function GET() {
  try {
    const invoices = analyticsData.map(doc => ({
      vendor: doc.extractedData?.llmData?.vendor?.value?.vendorName?.value || 'Unknown Vendor',
      date: doc.extractedData?.llmData?.invoice?.value?.invoiceDate?.value || '',
      invoiceNumber: doc.extractedData?.llmData?.invoice?.value?.invoiceId?.value || '',
      amount: Math.abs(doc.extractedData?.llmData?.summary?.value?.invoiceTotal?.value || 0),
      status: Math.random() > 0.5 ? 'paid' : 'unpaid' // Simulated status
    }));

    return NextResponse.json(invoices);
  } catch (error) {
    console.error('Error processing invoice data:', error);
    return NextResponse.json({ error: 'Failed to process invoice data' }, { status: 500 });
  }
}