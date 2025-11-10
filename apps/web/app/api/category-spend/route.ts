import { NextResponse } from 'next/server';
import analyticsData from '@/data/Analytics_Test_Data.json';
import { SACHKONTO_LABELS, formatCurrency } from '@/lib/constants';

export async function GET() {
  try {
    // Aggregate spending by category (using Sachkonto as category)
    const categorySpend = analyticsData.reduce((acc, curr) => {
      const lineItems = curr.extractedData?.llmData?.lineItems?.value?.items?.value || [];
      
      lineItems.forEach((item: any) => {
        const sachkonto = item.Sachkonto?.value?.toString() || 'Unknown';
        const amount = Math.abs(item.totalPrice?.value || 0);
        const category = SACHKONTO_LABELS[sachkonto] || `Account ${sachkonto}`;
        acc[category] = (acc[category] || 0) + amount;
      });
      
      return acc;
    }, {} as Record<string, number>);

    // Convert to array format and sort by spend
    const categories = Object.entries(categorySpend)
      .map(([category, spend]) => ({
        category,
        spend: Number(spend.toFixed(2))
      }))
      .sort((a, b) => b.spend - a.spend);

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error processing category data:', error);
    return NextResponse.json({ error: 'Failed to process category data' }, { status: 500 });
  }
}