export type Platform = 'google' | 'meta' | 'tiktok';

export type GroupBy = 'account' | 'campaign' | 'adgroup' | 'creative' | 'date';

export interface AdMetric {
  id: string;
  date: string;
  platform: Platform;
  accountName: string;
  campaignName: string;
  adGroupName: string;
  creativeName: string;
  spend: number;
  revenue: number;
  clicks: number;
  impressions: number;
  conversions: number;
  // Dynamic access
  [key: string]: any;
}

export interface DateRange {
  start: string;
  end: string;
}

export interface SortConfig {
  key: keyof AdMetric | string;
  direction: 'asc' | 'desc';
}

export interface ColumnDef {
  id: string;
  label: string;
  visible: boolean;
  fixed?: boolean; // Cannot be hidden/moved if true (e.g. Name)
}

export type ChartType = 'area' | 'bar' | 'pie' | 'line' | 'radar';