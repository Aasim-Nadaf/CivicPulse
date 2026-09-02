import type { CivicReport, ReportCategory } from './supabase';

/**
 * AI Priority Engine
 *
 * Scores civic reports on a 0-100 urgency scale and groups duplicates.
 * Transparency-first: the scoring formula is fully visible, not a black box.
 *
 * Scoring factors:
 *  - Severity (citizen-reported 1-5): up to 35 points
 *  - Community votes (upvotes): up to 25 points (logarithmic to prevent gaming)
 *  - Recency (freshness decay): up to 20 points (newer = more urgent)
 *  - Category weight (safety-critical categories get a boost): up to 20 points
 */

const CATEGORY_WEIGHTS: Record<ReportCategory, number> = {
  pothole: 15,
  streetlight: 14,
  flood_prone: 20,
  drainage: 18,
  road_requirement: 16,
  tree_planting: 8,
  budget_allocation: 10,
  other: 6,
};

export function computePriorityScore(report: {
  severity: number;
  votes: number;
  category: ReportCategory;
  created_at: string;
}): number {
  const severityScore = (report.severity / 5) * 35;

  const votesScore = Math.min(25, Math.log2(report.votes + 1) * 8);

  const ageHours =
    (Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60);
  const recencyScore = Math.max(0, 20 * Math.exp(-ageHours / (24 * 14)));

  const categoryScore = CATEGORY_WEIGHTS[report.category] ?? 6;

  const raw = severityScore + votesScore + recencyScore + categoryScore;
  return Math.round(Math.min(100, raw) * 100) / 100;
}

/**
 * Duplicate detection: groups reports that are likely the same issue.
 * Uses text similarity on title + same category + proximity of location text.
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(text: string): Set<string> {
  return new Set(
    normalizeText(text)
      .split(' ')
      .filter((w) => w.length > 2)
  );
}

function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;
  let intersection = 0;
  for (const word of a) {
    if (b.has(word)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface DuplicateGroup {
  groupId: string;
  reports: CivicReport[];
}

/**
 * Detects duplicate reports and assigns group IDs.
 * Two reports are duplicates if:
 *  - Same category
 *  - Title Jaccard similarity >= 0.4
 *  - Location text overlap >= 0.3 (if both have locations)
 */
export function detectDuplicates(reports: CivicReport[]): DuplicateGroup[] {
  const groups: DuplicateGroup[] = [];
  const assigned = new Set<string>();

  for (const report of reports) {
    if (assigned.has(report.id)) continue;

    const group: CivicReport[] = [report];
    assigned.add(report.id);

    const reportTokens = tokenize(report.title + ' ' + report.description);
    const reportLocTokens = tokenize(report.location);

    for (const other of reports) {
      if (assigned.has(other.id)) continue;
      if (other.category !== report.category) continue;

      const otherTokens = tokenize(other.title + ' ' + other.description);
      const titleSim = jaccardSimilarity(reportTokens, otherTokens);

      let locSim = 0.5;
      if (report.location && other.location) {
        const otherLocTokens = tokenize(other.location);
        locSim = jaccardSimilarity(reportLocTokens, otherLocTokens);
      }

      if (titleSim >= 0.4 && locSim >= 0.3) {
        group.push(other);
        assigned.add(other.id);
      }
    }

    if (group.length > 1) {
      const groupId = group[0].id;
      groups.push({ groupId, reports: group });
    }
  }

  return groups;
}

/**
 * Returns a human-readable explanation of why a report has its priority score.
 */
export function explainScore(report: {
  severity: number;
  votes: number;
  category: ReportCategory;
  created_at: string;
}): {
  severity: number;
  votes: number;
  recency: number;
  category: number;
  total: number;
  breakdown: { label: string; value: number; max: number }[];
} {
  const severityScore = Math.round((report.severity / 5) * 35);
  const votesScore = Math.round(Math.min(25, Math.log2(report.votes + 1) * 8));
  const ageHours =
    (Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60);
  const recencyScore = Math.round(
    Math.max(0, 20 * Math.exp(-ageHours / (24 * 14)))
  );
  const categoryScore = CATEGORY_WEIGHTS[report.category] ?? 6;

  return {
    severity: severityScore,
    votes: votesScore,
    recency: recencyScore,
    category: categoryScore,
    total: severityScore + votesScore + recencyScore + categoryScore,
    breakdown: [
      { label: 'Severity', value: severityScore, max: 35 },
      { label: 'Community Votes', value: votesScore, max: 25 },
      { label: 'Recency', value: recencyScore, max: 20 },
      { label: 'Category Weight', value: categoryScore, max: 20 },
    ],
  };
}
