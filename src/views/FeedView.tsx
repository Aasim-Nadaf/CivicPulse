import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CircleDot,
  Lightbulb,
  TreePine,
  Waves,
  CloudRain,
  Route,
  Wallet,
  CircleHelp,
  MapPin,
  ThumbsUp,
  Flame,
  Clock,
  CheckCircle2,
  Loader2,
  Users,
} from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase, type CivicReport, type ReportCategory, CATEGORY_META, STATUS_META } from '@/lib/supabase';
import { cn } from '@/lib/utils';

const ICON_MAP: Record<string, typeof CircleDot> = {
  CircleDot,
  Lightbulb,
  TreePine,
  Waves,
  CloudRain,
  Route,
  Wallet,
  CircleHelp,
};

interface FeedViewProps {
  reports: CivicReport[];
  onVote: (id: string) => void;
  searchQuery: string;
}

export function FeedView({ reports, onVote, searchQuery }: FeedViewProps) {
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('priority');
  const [voting, setVoting] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = reports;

    if (categoryFilter !== 'all') {
      result = result.filter((r) => r.category === categoryFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.location.toLowerCase().includes(q)
      );
    }

    const sorted = [...result];
    if (sortBy === 'priority') {
      sorted.sort((a, b) => b.ai_priority_score - a.ai_priority_score);
    } else if (sortBy === 'votes') {
      sorted.sort((a, b) => b.votes - a.votes);
    } else if (sortBy === 'recent') {
      sorted.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return sorted;
  }, [reports, categoryFilter, statusFilter, sortBy, searchQuery]);

  const handleVote = async (id: string) => {
    setVoting(id);
    onVote(id);
    setTimeout(() => setVoting(null), 800);
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold tracking-tight">Problem Feed</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {filtered.length} reports · Sorted by{' '}
          {sortBy === 'priority' ? 'AI urgency' : sortBy === 'votes' ? 'community votes' : 'most recent'}
        </p>
      </motion.div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <SelectItem key={key} value={key}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {Object.entries(STATUS_META).map(([key, meta]) => (
              <SelectItem key={key} value={key}>
                {meta.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="priority">AI Priority</SelectItem>
            <SelectItem value="votes">Most Voted</SelectItem>
            <SelectItem value="recent">Most Recent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reports list */}
      <div className="grid gap-4">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 && (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 p-12 text-center">
                <p className="text-sm text-muted-foreground">
                  No reports match your filters.
                </p>
              </CardContent>
            </Card>
          )}
          {filtered.map((report, i) => {
            const catMeta = CATEGORY_META[report.category];
            const statusMeta = STATUS_META[report.status];
            const Icon = ICON_MAP[catMeta.icon] || CircleDot;
            const isDuplicate = report.ai_duplicate_group !== null;
            return (
              <motion.div
                key={report.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
              >
                <Card className="overflow-hidden transition-shadow hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      {/* Score badge */}
                      <div className="flex flex-col items-center gap-1">
                        <div
                          className={cn(
                            'flex h-14 w-14 flex-col items-center justify-center rounded-xl border-2',
                            report.ai_priority_score >= 70
                              ? 'border-destructive/30 bg-destructive/10'
                              : report.ai_priority_score >= 50
                              ? 'border-warning/30 bg-warning/10'
                              : 'border-primary/30 bg-primary/10'
                          )}
                        >
                          <span className="text-lg font-bold leading-none">
                            {report.ai_priority_score.toFixed(0)}
                          </span>
                          <span className="text-[9px] text-muted-foreground">score</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="flex items-center gap-1.5 rounded-lg bg-accent px-2 py-1">
                            <Icon className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-medium">
                              {catMeta.label}
                            </span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {statusMeta.label}
                          </Badge>
                          {isDuplicate && (
                            <Badge
                              variant="outline"
                              className="gap-1 border-warning/30 text-warning"
                            >
                              <Users className="h-3 w-3" />
                              Duplicate
                            </Badge>
                          )}
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Flame className="h-3 w-3" />
                            Severity {report.severity}/5
                          </span>
                        </div>

                        <h3 className="mt-2 font-semibold leading-tight">
                          {report.title}
                        </h3>
                        {report.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                            {report.description}
                          </p>
                        )}

                        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5" />
                            {report.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(report.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            by {report.reporter_name}
                          </span>
                        </div>
                      </div>

                      {/* Vote */}
                      <div className="flex flex-col items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleVote(report.id)}
                          disabled={voting === report.id}
                          className="flex flex-col items-center gap-0.5"
                        >
                          {voting === report.id ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : (
                            <ThumbsUp className="h-5 w-5 text-muted-foreground hover:text-primary" />
                          )}
                          <span className="text-sm font-bold">
                            {report.votes}
                          </span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
