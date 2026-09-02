import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type ReportCategory =
  | 'pothole'
  | 'streetlight'
  | 'tree_planting'
  | 'drainage'
  | 'flood_prone'
  | 'road_requirement'
  | 'budget_allocation'
  | 'other';

export type ReportStatus =
  | 'reported'
  | 'verified'
  | 'in_progress'
  | 'resolved'
  | 'rejected';

export type BudgetStatus = 'proposed' | 'approved' | 'active' | 'completed';

export interface CivicReport {
  id: string;
  title: string;
  description: string;
  category: ReportCategory;
  severity: number;
  location: string;
  lat: number | null;
  lng: number | null;
  status: ReportStatus;
  reporter_name: string;
  votes: number;
  ai_priority_score: number;
  ai_duplicate_group: string | null;
  created_at: string;
  updated_at: string;
}

export interface ReportVote {
  id: string;
  report_id: string;
  voter_name: string;
  created_at: string;
}

export interface BudgetAllocation {
  id: string;
  title: string;
  category: ReportCategory;
  allocated_amount: number;
  spent_amount: number;
  area: string;
  status: BudgetStatus;
  created_at: string;
}

export const CATEGORY_META: Record<
  ReportCategory,
  { label: string; icon: string; color: string }
> = {
  pothole: { label: 'Potholes', icon: 'CircleDot', color: 'amber' },
  streetlight: { label: 'Streetlights', icon: 'Lightbulb', color: 'yellow' },
  tree_planting: { label: 'Tree Planting', icon: 'TreePine', color: 'green' },
  drainage: { label: 'Drainage', icon: 'Waves', color: 'cyan' },
  flood_prone: { label: 'Flood-Prone Areas', icon: 'CloudRain', color: 'blue' },
  road_requirement: { label: 'Road Requirements', icon: 'Road', color: 'orange' },
  budget_allocation: { label: 'Budget Allocation', icon: 'Wallet', color: 'violet' },
  other: { label: 'Other', icon: 'CircleHelp', color: 'slate' },
};

export const STATUS_META: Record<
  ReportStatus,
  { label: string; color: string }
> = {
  reported: { label: 'Reported', color: 'slate' },
  verified: { label: 'Verified', color: 'blue' },
  in_progress: { label: 'In Progress', color: 'amber' },
  resolved: { label: 'Resolved', color: 'green' },
  rejected: { label: 'Rejected', color: 'red' },
};
