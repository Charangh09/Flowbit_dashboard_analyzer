import { NextResponse } from 'next/server';
import analyticsData from '@/data/Analytics_Test_Data.json';

export async function GET() {
  try {
    // Calculate summary statistics
    const totalSpend = analyticsData.reduce((acc, curr) => {
      const total = curr.extractedData?.llmData?.summary?.value?.invoiceTotal?.value || 0;
      return acc + Math.abs(total);
    }, 0);

    const stats = {
      totalInvoices: analyticsData.length,
      totalSpendYTD: Number(totalSpend.toFixed(2)),
      documentsUploaded: analyticsData.length,
      averageInvoiceValue: Number((totalSpend / analyticsData.length).toFixed(2)),
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error processing analytics data:', error);
    return NextResponse.json({ error: 'Failed to process analytics data' }, { status: 500 });
  }
}