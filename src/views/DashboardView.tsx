import { motion } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  Users,
  Brain,
  Activity,
  ArrowUpRight,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { CivicReport } from '@/lib/supabase';
import { CATEGORY_META, STATUS_META } from '@/lib/supabase';

interface DashboardViewProps {
  reports: CivicReport[];
  onNavigate: (view: 'report' | 'feed' | 'priority' | 'budget' | 'analytics') => void;
}

export function DashboardView({ reports, onNavigate }: DashboardViewProps) {
  const total = reports.length;
  const resolved = reports.filter((r) => r.status === 'resolved').length;
  const inProgress = reports.filter((r) => r.status === 'in_progress').length;
  const reported = reports.filter((r) => r.status === 'reported').length;
  const totalVotes = reports.reduce((sum, r) => sum + r.votes, 0);
  const avgScore =
    total > 0
      ? Math.round(reports.reduce((sum, r) => sum + r.ai_priority_score, 0) / total)
      : 0;
  const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

  const categoryCounts = reports.reduce((acc, r) => {
    acc[r.category] = (acc[r.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  const topReports = [...reports]
    .sort((a, b) => b.ai_priority_score - a.ai_priority_score)
    .slice(0, 5);

  const stats = [
    {
      label: 'Total Reports',
      value: total,
      icon: AlertTriangle,
      color: 'text-primary',
      bg: 'bg-primary/10',
      change: '+12%',
    },
    {
      label: 'Resolved',
      value: resolved,
      icon: CheckCircle2,
      color: 'text-success',
      bg: 'bg-success/10',
      change: `${resolutionRate}% rate`,
    },
    {
      label: 'In Progress',
      value: inProgress,
      icon: Clock,
      color: 'text-warning',
      bg: 'bg-warning/10',
      change: `${reported} pending`,
    },
    {
      label: 'Community Votes',
      value: totalVotes,
      icon: Users,
      color: 'text-info',
      bg: 'bg-info/10',
      change: 'Growing',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero banner */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-primary/5 via-card to-success/5 p-6"
      >
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-success/10 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1.5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
              Live
            </Badge>
            <Badge variant="outline" className="gap-1.5">
              <Brain className="h-3 w-3" /> AI Engine Active
            </Badge>
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight">
            Civic Problem Priority Dashboard
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Citizens report issues. The AI engine removes duplicates and ranks
            problems by urgency — transparently, without corruption. Every score
            is explainable.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('report')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-lg shadow-primary/20"
            >
              Report a Problem
              <ArrowUpRight className="h-4 w-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onNavigate('priority')}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent"
            >
              <Brain className="h-4 w-4 text-primary" />
              View AI Rankings
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="relative overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className={`rounded-xl ${stat.bg} p-2.5`}>
                      <Icon className={`h-5 w-5 ${stat.color}`} />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      {stat.change}
                    </span>
                  </div>
                  <p className="mt-3 text-2xl font-bold">{stat.value.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top priority reports */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Top Priority Reports
                </CardTitle>
                <CardDescription>Highest AI urgency scores</CardDescription>
              </div>
              <button
                onClick={() => onNavigate('feed')}
                className="text-sm text-primary hover:underline"
              >
                View all
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {topReports.length === 0 && (
              <p className="py-8 text-center text-sm text-muted-foreground">
                No reports yet. Be the first to report a problem.
              </p>
            )}
            {topReports.map((report, i) => {
              const catMeta = CATEGORY_META[report.category];
              const statusMeta = STATUS_META[report.status];
              return (
                <motion.div
                  key={report.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-3 rounded-xl border border-border p-3 transition-colors hover:bg-accent/50"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                    {report.ai_priority_score.toFixed(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{report.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {catMeta.label} · {report.location}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0">
                    {statusMeta.label}
                  </Badge>
                </motion.div>
              );
            })}
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              By Category
            </CardTitle>
            <CardDescription>Report distribution</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {topCategories.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No data yet
              </p>
            )}
            {topCategories.map(([cat, count]) => {
              const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META];
              const pct = total > 0 ? (count / total) * 100 : 0;
              return (
                <div key={cat}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{meta?.label || cat}</span>
                    <span className="text-muted-foreground">{count}</span>
                  </div>
                  <Progress value={pct} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* AI Score summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Engine Summary
          </CardTitle>
          <CardDescription>
            Average urgency score across all reports
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-6">
            <div className="relative flex h-24 w-24 items-center justify-center">
              <svg className="h-24 w-24 -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="hsl(var(--muted))"
                  strokeWidth="8"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="40"
                  fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8"
                  strokeLinecap="round"
                  initial={{ strokeDasharray: '0 251' }}
                  animate={{
                    strokeDasharray: `${(avgScore / 100) * 251} 251`,
                  }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </svg>
              <div className="absolute text-center">
                <p className="text-2xl font-bold">{avgScore}</p>
                <p className="text-xs text-muted-foreground">avg score</p>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <p className="text-sm text-muted-foreground">
                The priority engine evaluates each report on four transparent
                factors: severity, community votes, recency, and category weight.
                No hidden parameters, no manual overrides.
              </p>
              <button
                onClick={() => onNavigate('priority')}
                className="text-sm font-medium text-primary hover:underline"
              >
                See how scores are calculated →
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
