import Papa from 'papaparse';
import { NormalizedDataset, NormalizedMetric } from '../../types/normalized';
import { buildDatasetMeta, parseNumberPtBr, sanitizeDate } from './common';

const headerMarker = 'Status da campanha';

/**
 * Extrai o nome da conta de anúncio do nome do arquivo
 * Formato esperado: <conta>-google-<mês>.csv
 * Exemplo: kia-google-ago.csv → "kia"
 */
export const extractAccountFromFilename = (filename: string): string => {
  // Remove caminho se houver
  const baseName = filename.split('/').pop() || filename;

  // Extrai o primeiro segmento antes de "-google-"
  const match = baseName.match(/^([^-]+)-google-/i);
  if (match) {
    // Capitaliza primeira letra
    const account = match[1].toLowerCase();
    return account.charAt(0).toUpperCase() + account.slice(1);
  }

  return 'Desconhecido';
};

/**
 * Extrai o mês do nome do arquivo
 * Formato esperado: <conta>-google-<mês>.csv
 * Exemplo: kia-google-ago.csv → "ago"
 */
export const extractMonthFromGoogleFilename = (filename: string): string | null => {
  const baseName = filename.split('/').pop() || filename;
  const nameWithoutExt = baseName.replace(/\.(csv|xlsx|xls)$/i, '');

  // Pega o último segmento após o último hífen
  const parts = nameWithoutExt.split('-').filter(Boolean);
  const lastPart = parts[parts.length - 1] || '';

  const normalized = lastPart
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z]/g, '');

  const MONTH_MAP: Record<string, boolean> = {
    'jan': true, 'fev': true, 'mar': true, 'abr': true,
    'mai': true, 'jun': true, 'jul': true, 'ago': true,
    'set': true, 'out': true, 'nov': true, 'dez': true
  };

  if (normalized.length === 3 && MONTH_MAP[normalized]) {
    return normalized;
  }

  return null;
};

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

const normalizeRow = (
  row: any,
  idx: number,
  defaultDate: string,
  accountName: string
): NormalizedMetric | null => {
  const campaign = (row['Campanha'] || row['Campaign'])?.trim();
  // Skip summary/total rows that don't have campaign info or have placeholder values
  if (!campaign || campaign === '--' || campaign.startsWith('Total')) return null;

  const spend = parseNumberPtBr(row['Custo']);
  const conversions = parseNumberPtBr(row['Conversões']);
  const impressions = parseNumberPtBr(row['Impr.'] ?? row['Impressões']);
  const clicks = parseNumberPtBr(row['Cliques'] ?? row['Interações']);
  const campaignBudget = parseNumberPtBr(row['Orçamento']);
  const revenue = 0; // not provided

  // Extrai data da coluna 'Semana' se disponível (formato: YYYY-MM-DD)
  // A coluna 'Semana' contém a data de início da semana
  const weekDate = row['Semana']?.trim();
  const date = weekDate && weekDate !== '--' && /^\d{4}-\d{2}-\d{2}$/.test(weekDate)
    ? weekDate
    : defaultDate || '';

  // Skip rows with no meaningful data
  if (!spend && !impressions && !clicks && !conversions) return null;

  return {
    id: `${accountName}-${campaign}-${date}-${idx}`,
    platform: 'google',
    date,
    accountName, // Vem do nome do arquivo, não do CSV
    campaignName: campaign,
    adGroupName: (row['Conjunto'] || row['Ad group'])?.trim() || campaign,
    creativeName: (row['Anúncio'] || row['Ad'])?.trim() || campaign,
    spend,
    revenue,
    clicks,
    impressions,
    conversions,
    campaignBudget: campaignBudget > 0 ? campaignBudget : undefined,
    cpm: impressions > 0 ? (spend / impressions) * 1000 : 0,
    ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
    cpc: clicks > 0 ? spend / clicks : 0,
    leads: conversions
  };
};

/**
 * Parse Google Ads CSV com extração de conta do nome do arquivo
 * Diferente do parser original, este injeta o accountName baseado no filename
 */
export const parseGoogleMultiAccountCsv = (
  csvContent: string,
  fileName: string,
  source: 'static' | 'upload'
): NormalizedDataset => {
  const accountName = extractAccountFromFilename(fileName);
  const dataSection = extractDataSection(csvContent);
  const rangeText = extractRangeLine(csvContent);
  const defaultDate = sanitizeDate(rangeText.split('-')[1]?.trim()) || sanitizeDate(rangeText.split('-')[0]?.trim());

  const parsed = Papa.parse(dataSection, {
    header: true,
    skipEmptyLines: true
  });

  const rows: NormalizedMetric[] = [];
  (parsed.data as any[]).forEach((row, idx) => {
    const normalized = normalizeRow(row, idx, defaultDate, accountName);
    if (normalized) rows.push(normalized);
  });

  // Cria label mais descritivo incluindo a conta
  const month = extractMonthFromGoogleFilename(fileName);
  const label = month ? `${accountName} - ${month.toUpperCase()}` : fileName;

  return {
    meta: {
      ...buildDatasetMeta('google', label, source, fileName, rangeText),
      // Campo extra para identificar a conta de origem
      accountOrigin: accountName
    } as any,
    rows
  };
};
