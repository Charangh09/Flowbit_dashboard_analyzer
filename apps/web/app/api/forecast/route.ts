import { NextResponse } from 'next/server';
import analyticsData from '@/data/Analytics_Test_Data.json';

export async function GET() {
  try {
    // Calculate monthly totals
    const monthlyTotals = analyticsData.reduce((acc: any, doc) => {
      const date = doc.extractedData?.llmData?.invoice?.value?.invoiceDate?.value;
      if (!date) return acc;

      const month = date.substring(0, 7); // Get YYYY-MM
      const amount = Math.abs(doc.extractedData?.llmData?.summary?.value?.invoiceTotal?.value || 0);

      if (!acc[month]) {
        acc[month] = 0;
      }

      acc[month] += amount;
      return acc;
    }, {});

    // Generate 6-month forecast based on 3-month moving average
    const sortedMonths = Object.keys(monthlyTotals).sort();
    const lastThreeMonths = sortedMonths.slice(-3);
    const average = lastThreeMonths.reduce((acc, month) => acc + monthlyTotals[month], 0) / 3;

    // Create forecast data
    const lastMonth = new Date(sortedMonths[sortedMonths.length - 1]);
    const forecast = [];
    
    for (let i = 1; i <= 6; i++) {
      const forecastMonth = new Date(lastMonth);
      forecastMonth.setMonth(lastMonth.getMonth() + i);
      const monthKey = forecastMonth.toISOString().substring(0, 7);
      forecast.push({
        date: monthKey,
        amount: average * (1 + (Math.random() * 0.2 - 0.1)) // Add some variation
      });
    }

    return NextResponse.json(forecast);
  } catch (error) {
    console.error('Error processing forecast data:', error);
    return NextResponse.json({ error: 'Failed to process forecast data' }, { status: 500 });
  }
}