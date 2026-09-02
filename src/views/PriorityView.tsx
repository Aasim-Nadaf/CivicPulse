import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Users,
  Flame,
  Clock,
  MapPin,
  ChevronDown,
  Info,
  Sparkles,
  TrendingUp,
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
import { detectDuplicates, explainScore, type DuplicateGroup } from '@/lib/ai-engine';
import { cn } from '@/lib/utils';

interface PriorityViewProps {
  reports: CivicReport[];
}

export function PriorityView({ reports }: PriorityViewProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showDuplicates, setShowDuplicates] = useState(false);

  const sorted = useMemo(
    () => [...reports].sort((a, b) => b.ai_priority_score - a.ai_priority_score),
    [reports]
  );

  const dupGroups = useMemo(() => detectDuplicates(reports), [reports]);
  const totalDuplicates = dupGroups.reduce((sum, g) => sum + g.reports.length, 0);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-success shadow-lg">
            <Brain className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">AI Priority Rankings</h2>
            <p className="text-sm text-muted-foreground">
              Transparent urgency scoring · No manual overrides · No corruption
            </p>
          </div>
        </div>
      </motion.div>

      {/* Engine transparency banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-5">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-medium">How the scoring works</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Every report is scored 0-100 using four transparent factors. The
              formula is public and deterministic — no hidden weights, no manual
              adjustments. Click any report to see its full score breakdown.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { label: 'Severity', max: 35, color: 'bg-destructive' },
                { label: 'Community Votes', max: 25, color: 'bg-primary' },
                { label: 'Recency', max: 20, color: 'bg-warning' },
                { label: 'Category Weight', max: 20, color: 'bg-success' },
              ].map((f) => (
                <div
                  key={f.label}
                  className="rounded-lg border border-border bg-card p-2.5"
                >
                  <div className={cn('mb-1 h-1.5 w-full rounded-full', f.color)} />
                  <p className="text-xs font-medium">{f.label}</p>
                  <p className="text-[10px] text-muted-foreground">Max {f.max} pts</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Duplicate detection summary */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowDuplicates(!showDuplicates)}
          className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent"
        >
          <Users className="h-4 w-4 text-warning" />
          {dupGroups.length} duplicate groups
          {totalDuplicates > 0 && (
            <Badge variant="secondary" className="text-xs">
              {totalDuplicates} reports
            </Badge>
          )}
          <ChevronDown
            className={cn(
              'h-4 w-4 transition-transform',
              showDuplicates && 'rotate-180'
            )}
          />
        </button>
      </div>

      <AnimatePresence>
        {showDuplicates && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            {dupGroups.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-sm text-muted-foreground">
                  No duplicates detected. All reports are unique.
                </CardContent>
              </Card>
            ) : (
              dupGroups.map((group: DuplicateGroup, gi) => (
                <Card key={group.groupId} className="border-warning/20">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Badge className="gap-1 bg-warning text-warning-foreground">
                        <Users className="h-3 w-3" />
                        Group {gi + 1}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {group.reports.length} reports merged
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2 pt-0">
                    {group.reports.map((r) => (
                      <div
                        key={r.id}
                        className="flex items-center gap-3 rounded-lg border border-border p-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10 text-xs font-bold text-warning">
                          {r.ai_priority_score.toFixed(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{r.title}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {r.location} · by {r.reporter_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ranked list */}
      <div className="space-y-3">
        {sorted.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-sm text-muted-foreground">
              No reports to rank yet.
            </CardContent>
          </Card>
        )}
        {sorted.map((report, i) => {
          const catMeta = CATEGORY_META[report.category];
          const statusMeta = STATUS_META[report.status];
          const explanation = explainScore(report);
          const isExpanded = expandedId === report.id;
          const isDuplicate = report.ai_duplicate_group !== null;

          return (
            <motion.div
              key={report.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
            >
              <Card
                className={cn(
                  'cursor-pointer transition-all',
                  isExpanded && 'ring-2 ring-primary/30'
                )}
                onClick={() => setExpandedId(isExpanded ? null : report.id)}
              >
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    {/* Rank number */}
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/10 to-success/10 text-sm font-bold text-primary">
                      #{i + 1}
                    </div>

                    {/* Score ring */}
                    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
                      <svg className="h-14 w-14 -rotate-90">
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="none"
                          stroke="hsl(var(--muted))"
                          strokeWidth="4"
                        />
                        <motion.circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="none"
                          stroke={
                            report.ai_priority_score >= 70
                              ? 'hsl(var(--destructive))'
                              : report.ai_priority_score >= 50
                              ? 'hsl(var(--warning))'
                              : 'hsl(var(--primary))'
                          }
                          strokeWidth="4"
                          strokeLinecap="round"
                          initial={{ strokeDasharray: '0 151' }}
                          animate={{
                            strokeDasharray: `${(report.ai_priority_score / 100) * 151} 151`,
                          }}
                          transition={{ duration: 0.8, ease: 'easeOut' }}
                        />
                      </svg>
                      <span className="absolute text-sm font-bold">
                        {report.ai_priority_score.toFixed(0)}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {catMeta.label}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {statusMeta.label}
                        </Badge>
                        {isDuplicate && (
                          <Badge
                            variant="outline"
                            className="gap-1 border-warning/30 text-warning"
                          >
                            <Users className="h-3 w-3" />
                            Dup
                          </Badge>
                        )}
                      </div>
                      <h3 className="mt-1.5 truncate font-semibold">{report.title}</h3>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {report.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="h-3 w-3" />
                          Sev {report.severity}/5
                        </span>
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {report.votes} votes
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(report.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <ChevronDown
                      className={cn(
                        'h-5 w-5 shrink-0 text-muted-foreground transition-transform',
                        isExpanded && 'rotate-180'
                      )}
                    />
                  </div>

                  {/* Expanded breakdown */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 space-y-3 border-t border-border pt-4">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <p className="text-sm font-medium">Score Breakdown</p>
                            <Badge className="ml-auto bg-primary text-primary-foreground">
                              Total: {explanation.total}
                            </Badge>
                          </div>
                          {explanation.breakdown.map((factor) => (
                            <div key={factor.label}>
                              <div className="mb-1 flex items-center justify-between text-xs">
                                <span className="font-medium">{factor.label}</span>
                                <span className="text-muted-foreground">
                                  {factor.value} / {factor.max} pts
                                </span>
                              </div>
                              <Progress
                                value={(factor.value / factor.max) * 100}
                                className="h-2"
                              />
                            </div>
                          ))}
                          {report.description && (
                            <div className="rounded-lg bg-accent/50 p-3">
                              <p className="text-xs text-muted-foreground">
                                {report.description}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
