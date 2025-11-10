'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { ChatInterface } from '@/components/chat-interface';
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';

// ---- Types ----
type Stats = {
  totalSpendYTD: number;
  totalInvoices: number;
  documentsUploaded: number;
  averageInvoiceValue: number;
};

type TopVendor = { vendor: string; spend: string };

type CatSpend = { category: string; spend: string };

type Invoice = {
  vendor: string;
  date: string;
  invoiceNumber: string;
  amount: number;
  status: 'paid' | 'unpaid';
};

type TrendData = {
  date: string;
  volume: number;
  value: number;
};

type ForecastData = {
  date: string;
  amount: number;
};

// ---- Component ----
export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [vendors, setVendors] = useState<TopVendor[]>([]);
  const [cats, setCats] = useState<CatSpend[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [trend, setTrend] = useState<TrendData[]>([]);
  const [forecast, setForecast] = useState<ForecastData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [statsData, vendorData, categoryData, invoiceData, trendData, forecastData] = await Promise.all([
          fetch('/api/analytics').then(res => res.json()),
          fetch('/api/vendors/top10').then(res => res.json()),
          fetch('/api/category-spend').then(res => res.json()),
          fetch('/api/invoices').then(res => res.json()),
          fetch('/api/trend').then(res => res.json()),
          fetch('/api/forecast').then(res => res.json()),
        ]);
        setStats(statsData);
        setVendors(vendorData);
        setCats(categoryData);
        setInvoices(invoiceData);
        setTrend(trendData);
        setForecast(forecastData);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const formatter = new Intl.NumberFormat('de-DE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  });

  const catData = useMemo(
    () => cats.map(c => ({ 
      name: c.category,
      value: Number(c.spend),
      displayValue: formatter.format(Number(c.spend))
    })),
    [cats]
  );

  return (
    <div className="p-6 space-y-8">
      {/* ---- Chat Interface ---- */}
      <ChatInterface onDataReceived={(data) => {
        if (data[0]?.category) {
          setCats(data.map(row => ({
            category: row.category,
            spend: row.spend
          })));
        } else if (data[0]?.vendor) {
          setVendors(data.map(row => ({
            vendor: row.vendor,
            spend: row.spend
          })));
        }
      }} />

      {/* ---- Metrics Row ---- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Spend (YTD)" value={stats?.totalSpendYTD} loading={loading} />
        <MetricCard title="Total Invoices" value={stats?.totalInvoices} loading={loading} />
        <MetricCard title="Documents Uploaded" value={stats?.documentsUploaded} loading={loading} />
        <MetricCard title="Average Invoice Value" value={stats?.averageInvoiceValue} loading={loading} />
      </div>

      {/* ---- Charts Section ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Invoice Volume + Value Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Invoice Volume + Value Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend} margin={{ left: 20, right: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" tickFormatter={(value) => formatter.format(value)} />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip formatter={(value: number, name) => [
                    name === 'value' ? formatter.format(value) : value,
                    name === 'value' ? 'Value' : 'Volume'
                  ]} />
                  <Line yAxisId="left" type="monotone" dataKey="value" stroke="#82ca9d" name="value" />
                  <Line yAxisId="right" type="monotone" dataKey="volume" stroke="#8884d8" name="volume" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Cash Outflow Forecast */}
        <Card>
          <CardHeader>
            <CardTitle>Cash Outflow Forecast</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={forecast} margin={{ left: 20, right: 20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis tickFormatter={(value) => formatter.format(value)} />
                  <Tooltip formatter={(value) => formatter.format(Number(value))} />
                  <Line type="monotone" dataKey="amount" stroke="#ff7f0e" name="Forecast" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Spend by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Spend by Category</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie 
                    data={catData} 
                    dataKey="value" 
                    nameKey="name" 
                    label={(entry) => entry.displayValue}
                  >
                    {catData.map((_, i) => (
                      <Cell key={i} fill={`hsl(${i * 45}, 70%, 60%)`} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value) => formatter.format(Number(value))} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle>Top Vendors</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendors} layout="vertical" margin={{ left: 150, right: 20 }}>
                  <XAxis 
                    type="number" 
                    tickFormatter={(value) => formatter.format(value)}
                  />
                  <YAxis 
                    type="category" 
                    dataKey="vendor" 
                    width={140} 
                  />
                  <Tooltip 
                    formatter={(value) => formatter.format(Number(value))}
                    labelStyle={{ color: '#666' }}
                  />
                  <Bar dataKey="spend" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---- Invoices Table ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice #</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.slice(0, 10).map((invoice, i) => (
                  <TableRow key={i}>
                    <TableCell>{invoice.vendor}</TableCell>
                    <TableCell>{invoice.date}</TableCell>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>{formatter.format(invoice.amount)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        invoice.status === 'paid' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {invoice.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---- Small Component for metric cards ----
function MetricCard({ title, value, loading }: { title: string; value: any; loading: boolean }) {
  const formattedValue = typeof value === 'number' 
    ? new Intl.NumberFormat('de-DE', {
        style: title.toLowerCase().includes('value') || title.toLowerCase().includes('spend') ? 'currency' : 'decimal',
        currency: 'EUR',
        maximumFractionDigits: 2
      }).format(value)
    : value;

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">
        {loading ? <Skeleton className="h-7 w-28" /> : <span>{formattedValue ?? '-'}</span>}
      </CardContent>
    </Card>
  );
}
