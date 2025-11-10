import { NextResponse } from 'next/server';
import analyticsData from '@/data/Analytics_Test_Data.json';

export async function GET() {
  try {
    // Group invoices by month
    const monthlyData = analyticsData.reduce((acc: any, doc) => {
      const date = doc.extractedData?.llmData?.invoice?.value?.invoiceDate?.value;
      if (!date) return acc;

      const month = date.substring(0, 7); // Get YYYY-MM
      const amount = Math.abs(doc.extractedData?.llmData?.summary?.value?.invoiceTotal?.value || 0);

      if (!acc[month]) {
        acc[month] = {
          volume: 0,
          value: 0
        };
      }

      acc[month].volume += 1;
      acc[month].value += amount;

      return acc;
    }, {});

    // Convert to array and sort by date
    const trend = Object.entries(monthlyData)
      .map(([date, data]: [string, any]) => ({
        date,
        ...data
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json(trend);
  } catch (error) {
    console.error('Error processing trend data:', error);
    return NextResponse.json({ error: 'Failed to process trend data' }, { status: 500 });
  }
}