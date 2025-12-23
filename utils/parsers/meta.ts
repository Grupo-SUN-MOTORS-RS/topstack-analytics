import Papa from 'papaparse';
import { NormalizedDataset, NormalizedMetric } from '../../types/normalized';
import { buildDatasetMeta, parseNumberPtBr, sanitizeDate } from './common';

const FIELD_MAP = {
  accountName: 'Nome da conta',
  campaignName: 'Nome da campanha',
  adGroupName: 'Nome do conjunto de anúncios',
  creativeName: 'Nome do anúncio',
  accountId: 'Identificação da conta',
  campaignId: 'Identificação da campanha',
  adSetId: 'Identificação do conjunto de anúncios',
  adId: 'Identificação do anúncio',
  date: 'Dia',
  spend: 'Valor usado (BRL)',
  impressions: 'Impressões',
  clicks: 'Cliques no link',
  conversions: 'Leads',
  reach: 'Alcance',
  campaignBudget: 'Orçamento da campanha',
  adGroupBudget: 'Orçamento do conjunto de anúncios'
} as const;

/**
 * Clean account name by removing common prefixes/suffixes
 * "Conta Kia Sun Motors" -> "Kia"
 * "Conta Haojue Sun Motors" -> "Haojue"
 * "Conta Zontes" -> "Zontes"
 */
const cleanAccountName = (name: string): string => {
  if (!name) return '';
  return name
    .replace(/^Conta\s+/i, '')  // Remove "Conta " from the beginning
    .replace(/\s+Sun Motors$/i, '')  // Remove " Sun Motors" from the end
    .trim();
};

const makeId = (row: any, idx: number) => {
  const base =
    row[FIELD_MAP.campaignId] ||
    row[FIELD_MAP.adSetId] ||
    row[FIELD_MAP.adId] ||
    `${row[FIELD_MAP.campaignName] || 'meta'}-${idx}`;
  return String(base);
};

const normalizeRow = (row: any, idx: number): NormalizedMetric | null => {
  // Skip summary/total rows that don't have account or campaign info
  const accountName = row[FIELD_MAP.accountName]?.trim();
  const campaignName = row[FIELD_MAP.campaignName]?.trim();
  if (!accountName && !campaignName) return null;

  const date = sanitizeDate(row[FIELD_MAP.date]);
  const spend = parseNumberPtBr(row[FIELD_MAP.spend]);
  const impressions = parseNumberPtBr(row[FIELD_MAP.impressions]);
  const clicks = parseNumberPtBr(row[FIELD_MAP.clicks] ?? row['Cliques (todos)']);
  const conversions = parseNumberPtBr(row[FIELD_MAP.conversions] ?? row['Conversões']);
  const campaignBudget = parseNumberPtBr(row[FIELD_MAP.campaignBudget] || row['Orçamento da campanha'] || '');
  const adGroupBudget = parseNumberPtBr(row[FIELD_MAP.adGroupBudget] || row['Orçamento do conjunto de anúncios'] || '');
  const revenue = 0; // Meta file does not carry revenue; keep 0 for now

  if (!date && !spend && !impressions && !clicks && !conversions) return null;

  const roas = spend > 0 ? revenue / spend : 0;
  const cpa = conversions > 0 ? spend / conversions : 0;

  return {
    id: makeId(row, idx),
    platform: 'meta',
    date: date || '',
    accountName: cleanAccountName(accountName || ''),
    campaignName: campaignName || '',
    adGroupName: row[FIELD_MAP.adGroupName] || '',
    creativeName: row[FIELD_MAP.creativeName] || '',
    spend,
    revenue,
    clicks,
    impressions,
    conversions,
    campaignBudget: campaignBudget > 0 ? campaignBudget : undefined,
    adGroupBudget: adGroupBudget > 0 ? adGroupBudget : undefined,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    leads: conversions
  };
};

export const parseMetaCsv = (
  csvContent: string,
  fileName: string,
  source: 'static' | 'upload'
): NormalizedDataset => {
  const parsed = Papa.parse(csvContent, {
    header: true,
    skipEmptyLines: true
  });

  const rows: NormalizedMetric[] = [];
  (parsed.data as any[]).forEach((row, idx) => {
    const normalized = normalizeRow(row, idx);
    if (normalized) rows.push(normalized);
  });

  return {
    meta: buildDatasetMeta('meta', fileName, source, fileName),
    rows
  };
};

