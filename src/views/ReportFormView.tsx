import { useState } from 'react';
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
  Send,
  Loader2,
  CheckCircle2,
  Sparkles,
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase, type ReportCategory } from '@/lib/supabase';
import { computePriorityScore } from '@/lib/ai-engine';
import { cn } from '@/lib/utils';

const CATEGORY_OPTIONS: {
  key: ReportCategory;
  label: string;
  icon: typeof CircleDot;
  desc: string;
}[] = [
  { key: 'pothole', label: 'Pothole', icon: CircleDot, desc: 'Damaged road surface' },
  { key: 'streetlight', label: 'Streetlight', icon: Lightbulb, desc: 'Broken or missing light' },
  { key: 'tree_planting', label: 'Tree Planting', icon: TreePine, desc: 'Request new trees' },
  { key: 'drainage', label: 'Drainage', icon: Waves, desc: 'Blocked or broken drains' },
  { key: 'flood_prone', label: 'Flood-Prone', icon: CloudRain, desc: 'Area floods regularly' },
  { key: 'road_requirement', label: 'Road Need', icon: Route, desc: 'New road or repair' },
  { key: 'budget_allocation', label: 'Budget', icon: Wallet, desc: 'Funding request' },
  { key: 'other', label: 'Other', icon: CircleHelp, desc: 'Different issue' },
];

const SEVERITY_OPTIONS = [
  { value: 1, label: 'Minor', color: 'bg-success/20 text-success border-success/30' },
  { value: 2, label: 'Low', color: 'bg-info/20 text-info border-info/30' },
  { value: 3, label: 'Moderate', color: 'bg-warning/20 text-warning border-warning/30' },
  { value: 4, label: 'High', color: 'bg-orange-500/20 text-orange-500 border-orange-500/30' },
  { value: 5, label: 'Critical', color: 'bg-destructive/20 text-destructive border-destructive/30' },
];

interface ReportFormProps {
  onSubmitted: () => void;
}

export function ReportFormView({ onSubmitted }: ReportFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [severity, setSeverity] = useState(3);
  const [location, setLocation] = useState('');
  const [reporterName, setReporterName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [previewScore, setPreviewScore] = useState<number | null>(null);

  const canSubmit = title.trim() && category && location.trim();

  const handlePreviewScore = () => {
    if (category) {
      const score = computePriorityScore({
        severity,
        votes: 0,
        category,
        created_at: new Date().toISOString(),
      });
      setPreviewScore(score);
    }
  };

  const handleSubmit = async () => {
    if (!canSubmit || !category) return;
    setSubmitting(true);
    const now = new Date().toISOString();
    const score = computePriorityScore({
      severity,
      votes: 0,
      category,
      created_at: now,
    });

    const { error } = await supabase.from('civic_reports').insert({
      title: title.trim(),
      description: description.trim(),
      category,
      severity,
      location: location.trim(),
      reporter_name: reporterName.trim() || 'Anonymous',
      ai_priority_score: score,
      status: 'reported',
    });

    setSubmitting(false);
    if (error) {
      console.error('Submit error:', error);
      return;
    }
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setTitle('');
      setDescription('');
      setCategory(null);
      setSeverity(3);
      setLocation('');
      setReporterName('');
      setPreviewScore(null);
      onSubmitted();
    }, 2000);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold tracking-tight">Report a Civic Problem</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Your report will be scored by the AI engine and ranked by urgency.
          Duplicate reports are automatically grouped.
        </p>
      </motion.div>

      <AnimatePresence mode="wait">
        {success ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
          >
            <Card className="border-success/30 bg-success/5">
              <CardContent className="flex flex-col items-center gap-3 p-12 text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-success/20"
                >
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </motion.div>
                <h3 className="text-lg font-semibold">Report Submitted</h3>
                <p className="text-sm text-muted-foreground">
                  The AI engine has scored your report. It's now visible in the feed.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <CardContent className="space-y-6 p-6">
                {/* Category selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Category</Label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {CATEGORY_OPTIONS.map((opt) => {
                      const Icon = opt.icon;
                      const active = category === opt.key;
                      return (
                        <motion.button
                          key={opt.key}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            setCategory(opt.key);
                            setPreviewScore(null);
                          }}
                          className={cn(
                            'flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all',
                            active
                              ? 'border-primary bg-primary/10 shadow-md'
                              : 'border-border hover:border-primary/50 hover:bg-accent/50'
                          )}
                        >
                          <Icon
                            className={cn(
                              'h-6 w-6',
                              active ? 'text-primary' : 'text-muted-foreground'
                            )}
                          />
                          <div>
                            <p className="text-xs font-medium">{opt.label}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {opt.desc}
                            </p>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Title */}
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-semibold">
                    Problem Title
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Large pothole near Main Street intersection"
                    maxLength={120}
                  />
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="desc" className="text-sm font-semibold">
                    Description
                  </Label>
                  <Textarea
                    id="desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the problem in detail. When did you notice it? How bad is it? Is it dangerous?"
                    rows={4}
                    maxLength={500}
                  />
                </div>

                {/* Severity */}
                <div className="space-y-3">
                  <Label className="text-sm font-semibold">Severity Level</Label>
                  <div className="flex gap-2">
                    {SEVERITY_OPTIONS.map((opt) => (
                      <motion.button
                        key={opt.value}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSeverity(opt.value);
                          setPreviewScore(null);
                        }}
                        className={cn(
                          'flex-1 rounded-xl border-2 px-2 py-3 text-center transition-all',
                          severity === opt.value
                            ? cn(opt.color, 'shadow-md')
                            : 'border-border bg-card hover:bg-accent/50'
                        )}
                      >
                        <p className="text-lg font-bold">{opt.value}</p>
                        <p className="text-[10px] font-medium">{opt.label}</p>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="loc" className="text-sm font-semibold">
                    Location
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="loc"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. MG Road, near City Mall, Sector 4"
                      className="pl-9"
                    />
                  </div>
                </div>

                {/* Reporter name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-semibold">
                    Your Name (optional)
                  </Label>
                  <Input
                    id="name"
                    value={reporterName}
                    onChange={(e) => setReporterName(e.target.value)}
                    placeholder="Anonymous"
                    maxLength={60}
                  />
                </div>

                {/* AI preview */}
                {category && (
                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium">AI Priority Preview</p>
                      </div>
                      {previewScore !== null ? (
                        <Badge className="bg-primary text-primary-foreground">
                          Score: {previewScore}
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handlePreviewScore}
                        >
                          Calculate
                        </Button>
                      )}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      Based on severity ({severity}/5), category weight, and
                      recency. Community votes will increase the score over time.
                    </p>
                  </div>
                )}

                {/* Submit */}
                <div className="flex justify-end gap-3">
                  <Button
                    onClick={handleSubmit}
                    disabled={!canSubmit || submitting}
                    className="gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {submitting ? 'Submitting...' : 'Submit Report'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
