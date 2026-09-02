import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet,
  Plus,
  TrendingUp,
  TrendingDown,
  PieChart,
  Loader2,
  CheckCircle2,
  X,
} from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  supabase,
  type BudgetAllocation,
  type ReportCategory,
  CATEGORY_META,
} from '@/lib/supabase';
import { cn } from '@/lib/utils';

const BUDGET_STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  proposed: { label: 'Proposed', color: 'text-muted-foreground', bg: 'bg-muted' },
  approved: { label: 'Approved', color: 'text-info', bg: 'bg-info/10' },
  active: { label: 'Active', color: 'text-warning', bg: 'bg-warning/10' },
  completed: { label: 'Completed', color: 'text-success', bg: 'bg-success/10' },
};

interface BudgetViewProps {
  budgets: BudgetAllocation[];
  onAdded: () => void;
}

export function BudgetView({ budgets, onAdded }: BudgetViewProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ReportCategory>('pothole');
  const [allocated, setAllocated] = useState('');
  const [area, setArea] = useState('');
  const [status, setStatus] = useState<string>('proposed');

  const totalAllocated = budgets.reduce((s, b) => s + b.allocated_amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + b.spent_amount, 0);
  const utilization = totalAllocated > 0 ? (totalSpent / totalAllocated) * 100 : 0;

  const categoryBudgets = budgets.reduce((acc, b) => {
    if (!acc[b.category]) acc[b.category] = { allocated: 0, spent: 0 };
    acc[b.category].allocated += b.allocated_amount;
    acc[b.category].spent += b.spent_amount;
    return acc;
  }, {} as Record<string, { allocated: number; spent: number }>);

  const handleAdd = async () => {
    if (!title.trim() || !allocated) return;
    setSubmitting(true);
    const { error } = await supabase.from('budget_allocations').insert({
      title: title.trim(),
      category,
      allocated_amount: parseFloat(allocated),
      spent_amount: 0,
      area: area.trim(),
      status,
    });
    setSubmitting(false);
    if (error) {
      console.error('Budget add error:', error);
      return;
    }
    setTitle('');
    setAllocated('');
    setArea('');
    setStatus('proposed');
    setDialogOpen(false);
    onAdded();
  };

  const formatCurrency = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-success shadow-lg">
            <Wallet className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Budget Allocation</h2>
            <p className="text-sm text-muted-foreground">
              Transparent funding · Track every dollar
            </p>
          </div>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Add Allocation
        </Button>
      </motion.div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5">
                  <Wallet className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(totalAllocated)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Allocated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-warning/10 p-2.5">
                  <TrendingDown className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {formatCurrency(totalSpent)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Spent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-success/10 p-2.5">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{utilization.toFixed(0)}%</p>
                  <p className="text-sm text-muted-foreground">Utilization</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Category breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-5 w-5 text-primary" />
            Allocation by Category
          </CardTitle>
          <CardDescription>Where the money goes</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(categoryBudgets).length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              No allocations yet.
            </p>
          )}
          {Object.entries(categoryBudgets).map(([cat, data]) => {
            const meta = CATEGORY_META[cat as keyof typeof CATEGORY_META];
            const pct = totalAllocated > 0 ? (data.allocated / totalAllocated) * 100 : 0;
            return (
              <div key={cat}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="font-medium">{meta?.label || cat}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(data.allocated)}
                  </span>
                </div>
                <Progress value={pct} className="h-2.5" />
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* Allocations list */}
      <div className="space-y-3">
        {budgets.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center text-sm text-muted-foreground">
              No budget allocations yet. Click "Add Allocation" to create one.
            </CardContent>
          </Card>
        )}
        <AnimatePresence>
          {budgets.map((budget, i) => {
            const meta = CATEGORY_META[budget.category];
            const statusMeta = BUDGET_STATUS_META[budget.status];
            const utilizationPct =
              budget.allocated_amount > 0
                ? (budget.spent_amount / budget.allocated_amount) * 100
                : 0;
            return (
              <motion.div
                key={budget.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i * 0.03, 0.2) }}
              >
                <Card className="transition-shadow hover:shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {meta?.label || budget.category}
                          </Badge>
                          <Badge
                            className={cn('text-xs', statusMeta.bg, statusMeta.color)}
                          >
                            {statusMeta.label}
                          </Badge>
                          {budget.area && (
                            <span className="text-xs text-muted-foreground">
                              {budget.area}
                            </span>
                          )}
                        </div>
                        <h3 className="mt-2 font-semibold">{budget.title}</h3>
                        <div className="mt-3 flex items-center gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">Allocated</p>
                            <p className="text-lg font-bold">
                              {formatCurrency(budget.allocated_amount)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Spent</p>
                            <p className="text-lg font-bold text-warning">
                              {formatCurrency(budget.spent_amount)}
                            </p>
                          </div>
                          <div className="flex-1">
                            <div className="mb-1 flex items-center justify-between text-xs">
                              <span className="text-muted-foreground">Utilization</span>
                              <span className="font-medium">
                                {utilizationPct.toFixed(0)}%
                              </span>
                            </div>
                            <Progress
                              value={utilizationPct}
                              className="h-2"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Add dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Budget Allocation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Pothole repair fund - Ward 4"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as ReportCategory)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(CATEGORY_META).map(([key, meta]) => (
                      <SelectItem key={key} value={key}>
                        {meta.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="proposed">Proposed</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Allocated Amount ($)</Label>
                <Input
                  type="number"
                  value={allocated}
                  onChange={(e) => setAllocated(e.target.value)}
                  placeholder="50000"
                />
              </div>
              <div className="space-y-2">
                <Label>Area</Label>
                <Input
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="Ward 4"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAdd} disabled={!title.trim() || !allocated || submitting}>
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="h-4 w-4" />
              )}
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
