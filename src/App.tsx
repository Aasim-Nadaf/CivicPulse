import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import { Sidebar, type ViewKey } from '@/components/layout/Sidebar';
import { FloatingNavbar } from '@/components/layout/FloatingNavbar';
import { DashboardView } from '@/views/DashboardView';
import { ReportFormView } from '@/views/ReportFormView';
import { FeedView } from '@/views/FeedView';
import { PriorityView } from '@/views/PriorityView';
import { BudgetView } from '@/views/BudgetView';
import { AnalyticsView } from '@/views/AnalyticsView';
import { supabase, type CivicReport, type BudgetAllocation } from '@/lib/supabase';
import { detectDuplicates, computePriorityScore } from '@/lib/ai-engine';

function App() {
  const [view, setView] = useState<ViewKey>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [budgets, setBudgets] = useState<BudgetAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [reportsRes, budgetsRes] = await Promise.all([
      supabase.from('civic_reports').select('*').order('created_at', { ascending: false }),
      supabase.from('budget_allocations').select('*').order('created_at', { ascending: false }),
    ]);

    let reportData = (reportsRes.data || []) as CivicReport[];

    // Re-score all reports with the AI engine (keers scores fresh as votes change)
    reportData = reportData.map((r) => ({
      ...r,
      ai_priority_score: computePriorityScore(r),
    }));

    // Detect duplicates and assign group IDs
    const dupGroups = detectDuplicates(reportData);
    const groupMap = new Map<string, string>();
    dupGroups.forEach((group) => {
      group.reports.forEach((r) => {
        groupMap.set(r.id, group.groupId);
      });
    });
    reportData = reportData.map((r) => ({
      ...r,
      ai_duplicate_group: groupMap.get(r.id) || null,
    }));

    setReports(reportData);
    setBudgets((budgetsRes.data || []) as BudgetAllocation[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const handleNavigate = (v: ViewKey) => {
    setView(v);
    setSidebarOpen(false);
  };

  const handleVote = async (id: string) => {
    const report = reports.find((r) => r.id === id);
    if (!report) return;

    const newVotes = report.votes + 1;
    const newScore = computePriorityScore({
      ...report,
      votes: newVotes,
    });

    await supabase
      .from('civic_reports')
      .update({ votes: newVotes, ai_priority_score: newScore })
      .eq('id', id);

    await supabase.from('report_votes').insert({
      report_id: id,
      voter_name: 'Anonymous',
    });

    setReports((prev) =>
      prev.map((r) =>
        r.id === id
          ? { ...r, votes: newVotes, ai_priority_score: newScore }
          : r
      )
    );
  };

  const handleReportSubmitted = () => {
    fetchData();
    setView('feed');
  };

  const handleBudgetAdded = () => {
    fetchData();
  };

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <DashboardView reports={reports} onNavigate={handleNavigate} />;
      case 'report':
        return <ReportFormView onSubmitted={handleReportSubmitted} />;
      case 'feed':
        return (
          <FeedView
            reports={reports}
            onVote={handleVote}
            searchQuery={searchQuery}
          />
        );
      case 'priority':
        return <PriorityView reports={reports} />;
      case 'budget':
        return <BudgetView budgets={budgets} onAdded={handleBudgetAdded} />;
      case 'analytics':
        return <AnalyticsView reports={reports} budgets={budgets} />;
      default:
        return <DashboardView reports={reports} onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar
        current={view}
        onNavigate={handleNavigate}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="lg:pl-72">
        <FloatingNavbar
          onMenuClick={() => setSidebarOpen(true)}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(!darkMode)}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        <main className="px-4 py-6 lg:px-8 lg:py-8">
          {loading ? (
            <div className="flex h-[60vh] items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent"
              />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
