'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@components/ui/card';
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from '@/components/ui/table';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { getJSON } from '@/lib/api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

// ---- Types ----
type Stats = {
  totalSpendYTD: number;
  totalInvoices: number;
  documentsUploaded: number;
  averageInvoiceValue: number;
};

type Trend = { month: string; invoiceCount: number; invoiceSum: string };

type TopVendor = { vendor: string; spend: string };

type CatSpend = { category: string; spend: string };

type Outflow = { date: string; amount: string };

type InvoiceRow = {
  vendor: string;
  date: string;
  invoiceNumber: string;
  amount: string | number;
  status: string;
};

// ---- Component ----
export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [trends, setTrends] = useState<Trend[]>([]);
  const [vendors, setVendors] = useState<TopVendor[]>([]);
  const [cats, setCats] = useState<CatSpend[]>([]);
  const [outflow, setOutflow] = useState<Outflow[]>([]);
  const [invoices, setInvoices] = useState<InvoiceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [s, t, v, c, o, inv] = await Promise.all([
          getJSON('/stats'),
          getJSON('/invoice-trends'),
          getJSON('/vendors/top10'),
          getJSON('/category-spend'),
          getJSON('/cash-outflow'),
          getJSON('/invoices'),
        ]);
        setStats(s);
        setTrends(t);
        setVendors(v);
        setCats(c);
        setOutflow(o);
        setInvoices(inv);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const trendData = useMemo(
    () => trends.map(d => ({ month: new Date(d.month).toISOString().slice(0, 7), value: Number(d.invoiceSum) })),
    [trends]
  );

  const outflowData = useMemo(
    () => outflow.map(d => ({ date: d.date, amount: Number(d.amount) })),
    [outflow]
  );

  const catData = useMemo(
    () => cats.map(c => ({ name: c.category, value: Number(c.spend) })),
    [cats]
  );

  return (
    <div className="p-6 space-y-8">
      {/* ---- Metrics Row ---- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard title="Total Spend (YTD)" value={stats?.totalSpendYTD} loading={loading} />
        <MetricCard title="Total Invoices" value={stats?.totalInvoices} loading={loading} />
        <MetricCard title="Documents Uploaded" value={stats?.documentsUploaded} loading={loading} />
        <MetricCard title="Average Invoice Value" value={stats?.averageInvoiceValue} loading={loading} />
      </div>

      {/* ---- Charts Row ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Invoice Volume + Value Trend</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8884d8" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Spend by Vendor (Top 10)</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={vendors}>
                  <XAxis dataKey="vendor" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="spend" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---- Spend by Category & Cash Outflow ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
                  <Pie data={catData} dataKey="value" nameKey="name" label>
                    {catData.map((_, i) => (
                      <Cell key={i} fill={`hsl(${(i * 40) % 360}, 70%, 60%)`} />
                    ))}
                  </Pie>
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cash Outflow Forecast</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {loading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={outflowData}>
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="amount" stroke="#ff7300" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ---- Invoices Table ---- */}
      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-32 w-full" />
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
                {invoices.map((i, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{i.vendor}</TableCell>
                    <TableCell>{new Date(i.date).toLocaleDateString()}</TableCell>
                    <TableCell>{i.invoiceNumber}</TableCell>
                    <TableCell>{i.amount}</TableCell>
                    <TableCell>{i.status}</TableCell>
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
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm text-gray-500">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">
        {loading ? <Skeleton className="h-7 w-28" /> : <span>{value ?? '-'}</span>}
      </CardContent>
    </Card>
  );
}
