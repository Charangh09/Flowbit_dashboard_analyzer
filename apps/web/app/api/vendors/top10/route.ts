import { NextResponse } from 'next/server';
import analyticsData from '@/data/Analytics_Test_Data.json';

export async function GET() {
  try {
    // Aggregate vendor data
    const vendorSpend = analyticsData.reduce((acc, curr) => {
      const vendor = curr.extractedData?.llmData?.vendor?.value?.vendorName?.value;
      const amount = Math.abs(curr.extractedData?.llmData?.summary?.value?.invoiceTotal?.value || 0);
      
      if (vendor) {
        acc[vendor] = (acc[vendor] || 0) + amount;
      }
      return acc;
    }, {} as Record<string, number>);

    // Convert to array and sort by spend
    const topVendors = Object.entries(vendorSpend)
      .map(([vendor, spend]) => ({ vendor, spend: spend.toFixed(2) }))
      .sort((a, b) => parseFloat(b.spend) - parseFloat(a.spend))
      .slice(0, 10);

    return NextResponse.json(topVendors);
  } catch (error) {
    console.error('Error processing vendor data:', error);
    return NextResponse.json({ error: 'Failed to process vendor data' }, { status: 500 });
  }
}