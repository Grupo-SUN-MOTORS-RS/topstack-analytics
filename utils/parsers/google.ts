import Papa from 'papaparse';
import { NormalizedDataset, NormalizedMetric } from '../../types/normalized';
import { buildDatasetMeta, parseNumberPtBr, sanitizeDate } from './common';

const headerMarker = 'Status da campanha';

const extractDataSection = (csvContent: string) => {
  const lines = csvContent.split(/\r?\n/);
  const headerIndex = lines.findIndex((l) => l.includes(headerMarker));
  if (headerIndex === -1) return csvContent;
  return lines.slice(headerIndex).join('\n');
};

const extractRangeLine = (csvContent: string) => {
  const lines = csvContent.split(/\r?\n/);
  if (lines.length >= 2) return lines[1];
  return '';
};

const normalizeRow = (row: any, idx: number, defaultDate?: string): NormalizedMetric | null => {
  const campaign = (row['Campanha'] || row['Campaign'])?.trim();
  // Skip summary/total rows that don't have campaign info
  if (!campaign) return null;

  const spend = parseNumberPtBr(row['Custo']);
  const conversions = parseNumberPtBr(row['Conversões']);
  const impressions = parseNumberPtBr(row['Impr.'] ?? row['Impressões']);
  const clicks = parseNumberPtBr(row['Cliques'] ?? row['Interações']);
  const revenue = 0; // not provided
  const date = defaultDate || '';

  // Skip rows with no meaningful data
  if (!spend && !impressions && !clicks && !conversions) return null;

  const cpa = conversions > 0 ? spend / conversions : 0;
  const roas = spend > 0 ? revenue / spend : 0;

  return {
    id: `${campaign}-${idx}`,
    platform: 'google',
    date,
    accountName: row['Conta'] || row['Status da campanha'] || '',
    campaignName: campaign,
    adGroupName: (row['Conjunto'] || row['Ad group'])?.trim() || campaign,
    creativeName: (row['Anúncio'] || row['Ad'])?.trim() || campaign,
    spend,
    revenue,
    clicks,
    impressions,
    conversions,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    leads: conversions
  };
};

export const parseGoogleCsv = (
  csvContent: string,
  fileName: string,
  source: 'static' | 'upload'
): NormalizedDataset => {
  const dataSection = extractDataSection(csvContent);
  const rangeText = extractRangeLine(csvContent);
  const defaultDate = sanitizeDate(rangeText.split('-')[1]?.trim()) || sanitizeDate(rangeText.split('-')[0]?.trim());

  const parsed = Papa.parse(dataSection, {
    header: true,
    skipEmptyLines: true
  });

  const rows: NormalizedMetric[] = [];
  (parsed.data as any[]).forEach((row, idx) => {
    const normalized = normalizeRow(row, idx, defaultDate);
    if (normalized) rows.push(normalized);
  });

  return {
    meta: buildDatasetMeta('google', fileName, source, fileName, rangeText),
    rows
  };
};

