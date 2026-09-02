import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from 'recharts';
import type { CivicReport, BudgetAllocation } from '@/lib/supabase';
import { CATEGORY_META } from '@/lib/supabase';

const CHART_COLORS = [
  '#3b82f6',
  '#22c55e',
  '#f59e0b',
  '#a855f7',
  '#ef4444',
  '#06b6d4',
  '#f97316',
  '#64748b',
];

interface AnalyticsViewProps {
  reports: CivicReport[];
  budgets: BudgetAllocation[];
}

export function AnalyticsView({ reports, budgets }: AnalyticsViewProps) {
  // Category distribution
  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => {
      counts[r.category] = (counts[r.category] || 0) + 1;
    });
    return Object.entries(counts).map(([key, value]) => ({
      name: CATEGORY_META[key as keyof typeof CATEGORY_META]?.label || key,
      value,
      key,
    }));
  }, [reports]);

  // Status distribution
  const statusData = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => {
      counts[r.status] = (counts[r.status] || 0) + 1;
    });
    return [
      { name: 'Reported', value: counts['reported'] || 0, fill: '#64748b' },
      { name: 'Verified', value: counts['verified'] || 0, fill: '#3b82f6' },
      { name: 'In Progress', value: counts['in_progress'] || 0, fill: '#f59e0b' },
      { name: 'Resolved', value: counts['resolved'] || 0, fill: '#22c55e' },
      { name: 'Rejected', value: counts['rejected'] || 0, fill: '#ef4444' },
    ];
  }, [reports]);

  // Reports over time (last 14 days)
  const timeData = useMemo(() => {
    const days: { date: string; count: number; resolved: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayReports = reports.filter(
        (r) => r.created_at.split('T')[0] === dateStr
      );
      const dayResolved = reports.filter(
        (r) =>
          r.status === 'resolved' &&
          r.updated_at.split('T')[0] === dateStr
      );
      days.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count: dayReports.length,
        resolved: dayResolved.length,
      });
    }
    return days;
  }, [reports]);

  // Severity distribution
  const severityData = useMemo(() => {
    const counts: Record<number, number> = {};
    reports.forEach((r) => {
      counts[r.severity] = (counts[r.severity] || 0) + 1;
    });
    return [1, 2, 3, 4, 5].map((sev) => ({
      name: `Level ${sev}`,
      value: counts[sev] || 0,
    }));
  }, [reports]);

  // Budget by category
  const budgetData = useMemo(() => {
    const byCat: Record<string, number> = {};
    budgets.forEach((b) => {
      byCat[b.category] = (byCat[b.category] || 0) + b.allocated_amount;
    });
    return Object.entries(byCat).map(([key, value]) => ({
      name: CATEGORY_META[key as keyof typeof CATEGORY_META]?.label || key,
      value: Math.round(value),
    }));
  }, [budgets]);

  const totalReports = reports.length;
  const resolvedCount = reports.filter((r) => r.status === 'resolved').length;
  const avgSeverity =
    totalReports > 0
      ? (reports.reduce((s, r) => s + r.severity, 0) / totalReports).toFixed(1)
      : '0';

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-success shadow-lg">
            <BarChart3 className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
            <p className="text-sm text-muted-foreground">
              Trends, distributions, and insights
            </p>
          </div>
        </div>
      </motion.div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Total Reports', value: totalReports, icon: Activity, color: 'text-primary' },
          { label: 'Resolved', value: resolvedCount, icon: CheckCircle2, color: 'text-success' },
          { label: 'Avg Severity', value: avgSeverity, icon: TrendingUp, color: 'text-warning' },
          { label: 'Avg Resolution', value: `${totalReports > 0 ? Math.round((resolvedCount / totalReports) * 100) : 0}%`, icon: Clock, color: 'text-info' },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              <Card>
                <CardContent className="p-5">
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                  <p className="mt-2 text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Reports over time */}
      <Card>
        <CardHeader>
          <CardTitle>Reports Over Time</CardTitle>
          <CardDescription>Last 14 days</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={timeData}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResolved" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="New Reports"
                stroke="#3b82f6"
                fill="url(#colorCount)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="resolved"
                name="Resolved"
                stroke="#22c55e"
                fill="url(#colorResolved)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Category pie */}
        <Card>
          <CardHeader>
            <CardTitle>Reports by Category</CardTitle>
            <CardDescription>Distribution across issue types</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    innerRadius={50}
                    paddingAngle={2}
                  >
                    {categoryData.map((_, i) => (
                      <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status bar */}
        <Card>
          <CardHeader>
            <CardTitle>Reports by Status</CardTitle>
            <CardDescription>Current pipeline state</CardDescription>
          </CardHeader>
          <CardContent>
            {totalReports === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={statusData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                    {statusData.map((entry, i) => (
                      <Cell key={i} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Severity distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Severity Distribution</CardTitle>
            <CardDescription>How serious are reported issues?</CardDescription>
          </CardHeader>
          <CardContent>
            {totalReports === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={severityData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Budget by category */}
        <Card>
          <CardHeader>
            <CardTitle>Budget by Category</CardTitle>
            <CardDescription>Funds allocated per issue type</CardDescription>
          </CardHeader>
          <CardContent>
            {budgetData.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No budget data yet
              </p>
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={budgetData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
