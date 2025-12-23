import { Platform } from '../types';

export type DatasetSource = 'static' | 'upload';

export interface DateRangeMeta {
  start?: string;
  end?: string;
}

export interface DatasetMeta {
  id: string;
  platform: Platform;
  label: string;
  source: DatasetSource;
  fileName?: string;
  dateRange?: DateRangeMeta;
}

export interface NormalizedMetric {
  id: string;
  platform: Platform;
  date: string;
  accountName?: string;
  campaignName?: string;
  adGroupName?: string;
  creativeName?: string;
  spend: number;
  revenue: number;
  clicks: number;
  impressions: number;
  conversions: number;
  leads?: number;
  ctr?: number;
  cpc?: number;
  cpm?: number;
  campaignBudget?: number; // Orçamento da campanha
  adGroupBudget?: number; // Orçamento do conjunto de anúncios
}

export interface NormalizedDataset {
  meta: DatasetMeta;
  rows: NormalizedMetric[];
}

export interface WeeklyBreakdown {
  weekStart: string; // YYYY-MM-DD format
  weekRange: string; // Display format e.g. "2025-07-28 - 2025-08-03"
  spend: number;
  revenue: number;
  clicks: number;
  impressions: number;
  conversions: number;
}

export interface DailyBreakdown {
  date: string; // YYYY-MM-DD format
  dateDisplay: string; // Display format e.g. "30/11/2025"
  spend: number;
  revenue: number;
  clicks: number;
  impressions: number;
  conversions: number;
}

export interface AggregatedRow {
  id: string;
  name: string;
  platform: Platform;
  spend: number;
  revenue: number;
  clicks: number;
  impressions: number;
  conversions: number;
  roas: number;
  cpa: number;
  campaignBudget?: number; // Orçamento da campanha
  adGroupBudget?: number; // Orçamento do conjunto de anúncios
  date?: string;
  weeklyData?: WeeklyBreakdown[]; // Weekly breakdown for weekly view
  dailyData?: DailyBreakdown[]; // Daily breakdown for Meta daily view
  breakdown?: {
    primary: MetricTotals;
    secondary?: MetricTotals;
    deltas?: MetricTotals;
  };
  // Campos de comparação (mês B)
  spendB?: number;
  conversionsB?: number;
  cpaB?: number;
  clicksB?: number;
  impressionsB?: number;
  // Variações percentuais
  spendChange?: number;
  conversionsChange?: number;
  cpaChange?: number;
  clicksChange?: number;
  impressionsChange?: number;
  hasComparison?: boolean;
}

export interface MetricTotals {
  spend: number;
  revenue: number;
  clicks: number;
  impressions: number;
  conversions: number;
  roas: number;
  cpa: number;
}

