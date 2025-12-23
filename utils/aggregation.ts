import { DateRange, GroupBy } from '../types';
import { AggregatedRow, DailyBreakdown, MetricTotals, NormalizedMetric, WeeklyBreakdown } from '../types/normalized';

export interface Filters {
  accounts: string[];
  campaigns: string[];
  adGroups: string[];
  creatives: string[];
}

const matchesFilter = (value: string | undefined, selected: string[]) => {
  if (!selected || selected.length === 0) return true;
  if (!value) return false;
  return selected.includes(value);
};

const inDateRange = (date: string, range: DateRange | null) => {
  if (!date) return false;
  if (range === null) return true; // No date filter applied
  return (!range.start || date >= range.start) && (!range.end || date <= range.end);
};

/**
 * Get the end date of a week given the start date
 */
const getWeekEndDate = (weekStart: string): string => {
  try {
    const date = new Date(weekStart);
    date.setDate(date.getDate() + 6);
    return date.toISOString().split('T')[0];
  } catch {
    return weekStart;
  }
};

/**
 * Get the Monday (start of week) for any given date
 * ISO week starts on Monday (1) and ends on Sunday (0)
 */
const getWeekStart = (dateStr: string): string => {
  try {
    const date = new Date(dateStr);
    const day = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    // Calculate days to subtract to get to Monday
    // If Sunday (0), go back 6 days; if Monday (1), stay; if Tuesday (2), go back 1, etc.
    const daysToSubtract = day === 0 ? 6 : day - 1;
    date.setDate(date.getDate() - daysToSubtract);
    return date.toISOString().split('T')[0];
  } catch {
    return dateStr;
  }
};

/**
 * Calculate weekly breakdown from raw metric items
 * For Meta (daily data): Groups items by their calculated week start (Monday)
 * For Google (weekly data): Groups items by their date which is already the week start
 */
export const calculateWeeklyBreakdown = (items: NormalizedMetric[]): WeeklyBreakdown[] => {
  const weeklyMap = new Map<string, WeeklyBreakdown>();

  items.forEach(item => {
    const itemDate = item.date || '';
    if (!itemDate || itemDate === '') return;

    // Calculate the Monday (start of week) for this date
    const weekStartDate = getWeekStart(itemDate);

    if (!weeklyMap.has(weekStartDate)) {
      // Calculate week end date (Sunday, 6 days after Monday)
      const weekEnd = getWeekEndDate(weekStartDate);
      weeklyMap.set(weekStartDate, {
        weekStart: weekStartDate,
        weekRange: `${weekStartDate} - ${weekEnd}`,
        spend: 0,
        revenue: 0,
        clicks: 0,
        impressions: 0,
        conversions: 0
      });
    }

    const week = weeklyMap.get(weekStartDate)!;
    week.spend += item.spend;
    week.revenue += item.revenue;
    week.clicks += item.clicks;
    week.impressions += item.impressions;
    week.conversions += item.conversions;
  });

  // Sort by date descending (most recent first)
  return Array.from(weeklyMap.values()).sort((a, b) => b.weekStart.localeCompare(a.weekStart));
};

/**
 * Format date from YYYY-MM-DD to DD/MM/YYYY for display
 */
const formatDateForDisplay = (date: string): string => {
  try {
    const [year, month, day] = date.split('-');
    return `${day}/${month}/${year}`;
  } catch {
    return date;
  }
};

/**
 * Calculate daily breakdown from raw metric items
 * Groups items by their individual date (for Meta daily data)
 */
const calculateDailyBreakdown = (items: NormalizedMetric[]): DailyBreakdown[] => {
  const dailyMap = new Map<string, DailyBreakdown>();

  items.forEach(item => {
    const dateKey = item.date || '';
    if (!dateKey || dateKey === '') return;

    if (!dailyMap.has(dateKey)) {
      dailyMap.set(dateKey, {
        date: dateKey,
        dateDisplay: formatDateForDisplay(dateKey),
        spend: 0,
        revenue: 0,
        clicks: 0,
        impressions: 0,
        conversions: 0
      });
    }

    const day = dailyMap.get(dateKey)!;
    day.spend += item.spend;
    day.revenue += item.revenue;
    day.clicks += item.clicks;
    day.impressions += item.impressions;
    day.conversions += item.conversions;
  });

  // Sort by date descending (most recent first)
  return Array.from(dailyMap.values()).sort((a, b) => b.date.localeCompare(a.date));
};

const aggregateByKey = (
  rows: NormalizedMetric[],
  groupBy: GroupBy,
  range: DateRange | null,
  filters: Filters
): Map<string, AggregatedRow> => {
  const grouped = new Map<string, AggregatedRow>();
  // Track raw items per key for weekly breakdown calculation
  const rawItemsPerKey = new Map<string, NormalizedMetric[]>();

  rows.forEach((item) => {
    // If range is null, skip date filtering (used for secondary dataset in comparison mode)
    if (range !== null && !inDateRange(item.date, range)) return;
    if (!matchesFilter(item.accountName, filters.accounts)) return;
    if (!matchesFilter(item.campaignName, filters.campaigns)) return;
    if (!matchesFilter(item.adGroupName, filters.adGroups)) return;
    if (!matchesFilter(item.creativeName, filters.creatives)) return;

    let key = '';
    let name = '';

    switch (groupBy) {
      case 'account':
        key = item.accountName || 'Sem Conta';
        name = key;
        break;
      case 'campaign':
        key = item.campaignName || 'Sem Campanha';
        name = key;
        break;
      case 'adgroup':
        key = item.adGroupName || 'Sem Conjunto';
        name = key;
        break;
      case 'creative':
        key = item.creativeName || 'Sem Anúncio';
        name = key;
        break;
      case 'date':
        key = item.date || 'Sem Data';
        name = key;
        break;
      default:
        key = item.id;
        name = item.campaignName || item.id;
    }

    if (!grouped.has(key)) {
      grouped.set(key, {
        id: key,
        name,
        platform: item.platform,
        spend: 0,
        revenue: 0,
        clicks: 0,
        impressions: 0,
        conversions: 0,
        roas: 0,
        cpa: 0,
        campaignBudget: groupBy === 'campaign' ? item.campaignBudget : undefined,
        adGroupBudget: groupBy === 'adgroup' ? item.adGroupBudget : undefined,
        date: groupBy === 'date' ? item.date : undefined
      });
      rawItemsPerKey.set(key, []);
    }

    const current = grouped.get(key)!;
    current.spend += item.spend;
    current.revenue += item.revenue;
    current.clicks += item.clicks;
    current.impressions += item.impressions;
    current.conversions += item.conversions;

    // Track raw item for weekly breakdown
    rawItemsPerKey.get(key)!.push(item);

    // Atualiza orçamentos apenas se ainda não foram definidos (primeira ocorrência)
    if (groupBy === 'campaign' && item.campaignBudget && !current.campaignBudget) {
      current.campaignBudget = item.campaignBudget;
    }
    if (groupBy === 'adgroup' && item.adGroupBudget && !current.adGroupBudget) {
      current.adGroupBudget = item.adGroupBudget;
    }
  });

  grouped.forEach((row, key) => {
    row.roas = row.spend > 0 ? row.revenue / row.spend : 0;
    row.cpa = row.conversions > 0 ? row.spend / row.conversions : 0;

    // Calculate breakdown from raw items
    const rawItems = rawItemsPerKey.get(key) || [];
    row.weeklyData = calculateWeeklyBreakdown(rawItems);
    row.dailyData = calculateDailyBreakdown(rawItems);

    // Fallback budget for Meta if missing
    if (row.platform === 'meta') {
      const days = row.dailyData.length || 1;
      if (groupBy === 'campaign' && !row.campaignBudget && row.spend > 0) {
        row.campaignBudget = Math.round(row.spend / days);
      } else if (groupBy === 'adgroup' && !row.adGroupBudget && row.spend > 0) {
        row.adGroupBudget = Math.round(row.spend / days);
      }
    }
  });

  return grouped;
};

const calculateDeltas = (primary: MetricTotals, secondary?: MetricTotals): MetricTotals | undefined => {
  if (!secondary) return undefined;
  return {
    spend: primary.spend - secondary.spend,
    revenue: primary.revenue - secondary.revenue,
    clicks: primary.clicks - secondary.clicks,
    impressions: primary.impressions - secondary.impressions,
    conversions: primary.conversions - secondary.conversions,
    roas: primary.roas - secondary.roas,
    cpa: primary.cpa - secondary.cpa
  };
};

export interface AggregateResult {
  rows: AggregatedRow[];
  totals: MetricTotals;
  secondaryTotals?: MetricTotals;
  totalsDeltas?: MetricTotals;
}

const emptyTotals: MetricTotals = {
  spend: 0,
  revenue: 0,
  clicks: 0,
  impressions: 0,
  conversions: 0,
  roas: 0,
  cpa: 0
};

const computeTotals = (rows: AggregatedRow[]): MetricTotals => {
  return rows.reduce(
    (acc, curr) => ({
      spend: acc.spend + curr.spend,
      revenue: acc.revenue + curr.revenue,
      clicks: acc.clicks + curr.clicks,
      impressions: acc.impressions + curr.impressions,
      conversions: acc.conversions + curr.conversions,
      roas: 0,
      cpa: 0
    }),
    { ...emptyTotals }
  );
};

export const aggregateWithComparison = (
  primaryRows: NormalizedMetric[],
  secondaryRows: NormalizedMetric[] | undefined,
  groupBy: GroupBy,
  range: DateRange,
  filters: Filters,
  mergeMode: boolean
): AggregateResult => {
  // When comparing two different spreadsheets (not merging), don't apply date filter to secondary dataset
  // The date filter should only apply to the primary dataset or when merging datasets
  const primaryGrouped = aggregateByKey(primaryRows, groupBy, range, filters);
  const secondaryGrouped = secondaryRows
    ? aggregateByKey(secondaryRows, groupBy, mergeMode ? range : null, filters)
    : undefined;

  const keys = new Set<string>([...primaryGrouped.keys()]);
  if (secondaryGrouped) secondaryGrouped.forEach((_v, k) => keys.add(k));

  const rows: AggregatedRow[] = [];

  keys.forEach((key) => {
    const primary = primaryGrouped.get(key);
    const secondary = secondaryGrouped?.get(key);

    if (!primary && !secondary) return;

    const base = primary || secondary!;
    const combined: AggregatedRow = {
      ...base,
      spend: mergeMode ? (primary?.spend || 0) + (secondary?.spend || 0) : primary?.spend || 0,
      revenue: mergeMode ? (primary?.revenue || 0) + (secondary?.revenue || 0) : primary?.revenue || 0,
      clicks: mergeMode ? (primary?.clicks || 0) + (secondary?.clicks || 0) : primary?.clicks || 0,
      impressions: mergeMode ? (primary?.impressions || 0) + (secondary?.impressions || 0) : primary?.impressions || 0,
      conversions: mergeMode ? (primary?.conversions || 0) + (secondary?.conversions || 0) : primary?.conversions || 0,
      roas: 0,
      cpa: 0,
      breakdown: primary
        ? {
          primary: {
            spend: primary.spend,
            revenue: primary.revenue,
            clicks: primary.clicks,
            impressions: primary.impressions,
            conversions: primary.conversions,
            roas: primary.roas,
            cpa: primary.cpa
          },
          secondary: secondary
            ? {
              spend: secondary.spend,
              revenue: secondary.revenue,
              clicks: secondary.clicks,
              impressions: secondary.impressions,
              conversions: secondary.conversions,
              roas: secondary.roas,
              cpa: secondary.cpa
            }
            : undefined
        }
        : undefined
    };

    combined.roas = combined.spend > 0 ? combined.revenue / combined.spend : 0;
    combined.cpa = combined.conversions > 0 ? combined.spend / combined.conversions : 0;

    if (combined.breakdown && combined.breakdown.primary) {
      combined.breakdown.deltas = calculateDeltas(combined.breakdown.primary, combined.breakdown.secondary);
    }

    rows.push(combined);
  });

  rows.sort((a, b) => b.spend - a.spend);

  const totals = computeTotals(rows);
  totals.roas = totals.spend > 0 ? totals.revenue / totals.spend : 0;
  totals.cpa = totals.conversions > 0 ? totals.spend / totals.conversions : 0;

  // Calcula totals do dataset secundário para comparação
  let secondaryTotals: MetricTotals | undefined;
  let totalsDeltas: MetricTotals | undefined;

  if (secondaryRows && !mergeMode && secondaryGrouped) {
    // Calcula totals de todas as linhas secundárias (sem mesclar)
    const secondaryOnlyRows: AggregatedRow[] = [];
    secondaryGrouped.forEach((row) => {
      secondaryOnlyRows.push(row);
    });

    if (secondaryOnlyRows.length > 0) {
      secondaryTotals = computeTotals(secondaryOnlyRows);
      secondaryTotals.roas = secondaryTotals.spend > 0 ? secondaryTotals.revenue / secondaryTotals.spend : 0;
      secondaryTotals.cpa = secondaryTotals.conversions > 0 ? secondaryTotals.spend / secondaryTotals.conversions : 0;

      // Calcula deltas dos totals
      totalsDeltas = calculateDeltas(totals, secondaryTotals);
    }
  }

  return { rows, totals, secondaryTotals, totalsDeltas };
};

