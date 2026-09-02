import { motion } from 'framer-motion';
import { Menu, Bell, Search, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FloatingNavbarProps {
  onMenuClick: () => void;
  darkMode: boolean;
  onToggleDark: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function FloatingNavbar({
  onMenuClick,
  darkMode,
  onToggleDark,
  searchQuery,
  onSearchChange,
}: FloatingNavbarProps) {
  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className="sticky top-4 z-30 mx-4 lg:mx-6"
    >
      <div className="glass flex items-center gap-3 rounded-2xl border border-border px-4 py-3 shadow-lg">
        {/* Mobile menu */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onMenuClick}
          className="lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search reports, areas, categories..."
            className="h-9 border-0 bg-background/60 pl-9"
          />
        </div>

        <div className="flex-1" />

        {/* Actions */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onToggleDark}>
                <motion.div
                  key={darkMode ? 'moon' : 'sun'}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  {darkMode ? (
                    <Moon className="h-5 w-5" />
                  ) : (
                    <Sun className="h-5 w-5" />
                  )}
                </motion.div>
              </Button>
            </TooltipTrigger>
            <TooltipContent>{darkMode ? 'Light mode' : 'Dark mode'}</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-destructive" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Notifications</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* Avatar */}
        <div className="flex items-center gap-2 border-l border-border pl-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-success text-sm font-bold text-primary-foreground">
            C
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium leading-tight">Citizen</p>
            <p className="text-xs text-muted-foreground">Contributor</p>
          </div>
        </div>
      </div>
    </motion.header>
  );
}
