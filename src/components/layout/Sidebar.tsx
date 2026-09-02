import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FilePlus,
  ListChecks,
  Brain,
  Wallet,
  BarChart3,
  Shield,
  X,
  Github,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewKey =
  | 'dashboard'
  | 'report'
  | 'feed'
  | 'priority'
  | 'budget'
  | 'analytics';

interface SidebarProps {
  current: ViewKey;
  onNavigate: (view: ViewKey) => void;
  open: boolean;
  onClose: () => void;
}

const NAV_ITEMS: {
  key: ViewKey;
  label: string;
  icon: typeof LayoutDashboard;
  description: string;
}[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Overview & live stats',
  },
  {
    key: 'report',
    label: 'Report a Problem',
    icon: FilePlus,
    description: 'Submit a new civic issue',
  },
  {
    key: 'feed',
    label: 'Problem Feed',
    icon: ListChecks,
    description: 'Browse all reports',
  },
  {
    key: 'priority',
    label: 'AI Priority Rankings',
    icon: Brain,
    description: 'Urgency scoring engine',
  },
  {
    key: 'budget',
    label: 'Budget Allocation',
    icon: Wallet,
    description: 'Funding transparency',
  },
  {
    key: 'analytics',
    label: 'Analytics',
    icon: BarChart3,
    description: 'Trends & insights',
  },
];

export function Sidebar({
  current,
  onNavigate,
  open,
  onClose,
}: SidebarProps) {
  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ x: open ? 0 : '-100%' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={cn(
          'fixed left-0 top-0 z-50 flex h-screen w-72 flex-col border-r border-border bg-card lg:translate-x-0',
          !open && 'lg:translate-x-0'
        )}
        style={{ transform: open ? undefined : undefined }}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-success shadow-lg">
              <Shield className="h-5 w-5 text-primary-foreground" />
              <motion.div
                className="absolute inset-0 rounded-xl border-2 border-primary"
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight">CivicPulse</h1>
              <p className="text-xs text-muted-foreground">Priority Engine</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 hover:bg-accent lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav items */}
        <nav className="flex-1 space-y-1.5 overflow-y-auto p-4">
          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const active = current === item.key;
            return (
              <motion.button
                key={item.key}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onNavigate(item.key)}
                className={cn(
                  'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'hover:bg-accent hover:text-accent-foreground'
                )}
              >
                {active && (
                  <motion.div
                    layoutId="sidebar-active"
                    className="absolute left-0 top-1/2 h-8 w-1 -translate-y-1/2 rounded-r-full bg-primary-foreground"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <Icon
                  className={cn(
                    'h-5 w-5 shrink-0',
                    active ? 'text-primary-foreground' : 'text-muted-foreground group-hover:text-foreground'
                  )}
                />
                <div className="flex-1">
                  <p className={cn('text-sm font-medium', active && 'text-primary-foreground')}>
                    {item.label}
                  </p>
                  <p
                    className={cn(
                      'text-xs',
                      active ? 'text-primary-foreground/70' : 'text-muted-foreground'
                    )}
                  >
                    {item.description}
                  </p>
                </div>
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-border p-4">
          <div className="rounded-xl bg-gradient-to-br from-primary/10 to-success/10 p-4">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-pulse rounded-full bg-success" />
              <p className="text-xs font-medium text-foreground">Engine Online</p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              AI deduplication & scoring active
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">v1.0 · Transparent</p>
            <Github className="h-4 w-4 text-muted-foreground" />
          </div>
        </div>
      </motion.aside>
    </>
  );
}
