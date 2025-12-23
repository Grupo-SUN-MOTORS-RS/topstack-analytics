import { DatasetMeta, DateRangeMeta, NormalizedMetric } from '../../types/normalized';
import { Platform } from '../../types';

export const monthMap: Record<string, number> = {
  janeiro: 0,
  fevereiro: 1,
  março: 2,
  marco: 2,
  abril: 3,
  maio: 4,
  junho: 5,
  julho: 6,
  agosto: 7,
  setembro: 8,
  outubro: 9,
  novembro: 10,
  dezembro: 11
};

export const parseNumberPtBr = (value: any): number => {
  if (value === null || value === undefined) return 0;
  if (typeof value === 'number' && !Number.isNaN(value)) return value;
  const str = String(value).trim();
  if (!str) return 0;
  
  // Detect format: if has comma, assume BR format (1.234,56), otherwise assume EN format (1234.56)
  const hasComma = str.includes(',');
  const hasDot = str.includes('.');
  
  let normalized: string;
  if (hasComma && hasDot) {
    // Both present: assume BR format (1.234,56) - dots are thousands, comma is decimal
    normalized = str.replace(/\./g, '').replace(',', '.');
  } else if (hasComma && !hasDot) {
    // Only comma: assume BR decimal (1234,56)
    normalized = str.replace(',', '.');
  } else if (!hasComma && hasDot) {
    // Only dot: assume EN decimal (1234.56) - keep as is
    normalized = str;
  } else {
    // No separators: integer
    normalized = str;
  }
  
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const sanitizeDate = (value: any): string => {
  if (!value) return '';
  const str = String(value).trim();
  if (!str) return '';

  // Already ISO-like
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // dd/mm/yyyy
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(str)) {
    const [d, m, y] = str.split('/').map(Number);
    return new Date(Date.UTC(y, m - 1, d)).toISOString().split('T')[0];
  }

  // dd de <mes> de yyyy
  const match = str.match(/(\d{1,2})\s+de\s+([a-zA-ZçÇãÃéÉíÍóÓôÔáÁâÂ]+)\s+de\s+(\d{4})/);
  if (match) {
    const day = Number(match[1]);
    const monthName = match[2].toLowerCase();
    const year = Number(match[3]);
    const month = monthMap[monthName] ?? 0;
    return new Date(Date.UTC(year, month, day)).toISOString().split('T')[0];
  }

  const parsed = new Date(str);
  return Number.isNaN(parsed.getTime()) ? '' : parsed.toISOString().split('T')[0];
};

export const inferRangeFromText = (text?: string): DateRangeMeta | undefined => {
  if (!text) return undefined;
  const match = text.match(/(\d{1,2}\s+de\s+[A-Za-zçÇãÃéÉíÍóÓôÔáÁâÂ]+\s+de\s+\d{4})\s*-\s*(\d{1,2}\s+de\s+[A-Za-zçÇãÃéÉíÍóÓôÔáÁâÂ]+\s+de\s+\d{4})/i);
  if (!match) return undefined;
  const start = sanitizeDate(match[1]);
  const end = sanitizeDate(match[2]);
  if (!start && !end) return undefined;
  return { start, end };
};

export const buildDatasetMeta = (
  platform: Platform,
  label: string,
  source: DatasetMeta['source'],
  fileName?: string,
  rangeText?: string
): DatasetMeta => ({
  id: crypto.randomUUID(),
  platform,
  label,
  source,
  fileName,
  dateRange: inferRangeFromText(rangeText)
});

export const toMetricTotals = (rows: NormalizedMetric[]) => {
  return rows.reduce(
    (acc, curr) => {
      acc.spend += curr.spend;
      acc.revenue += curr.revenue;
      acc.clicks += curr.clicks;
      acc.impressions += curr.impressions;
      acc.conversions += curr.conversions;
      return acc;
    },
    { spend: 0, revenue: 0, clicks: 0, impressions: 0, conversions: 0 }
  );
};

