import { NormalizedDataset } from '../types/normalized';

/**
 * Mapeamento de siglas de meses em português para valores numéricos
 * Usado para ordenação decrescente (mês mais recente primeiro)
 */
const MONTH_MAP: Record<string, number> = {
  'jan': 1,
  'fev': 2,
  'mar': 3,
  'abr': 4,
  'mai': 5,
  'jun': 6,
  'jul': 7,
  'ago': 8,
  'set': 9,
  'out': 10,
  'nov': 11,
  'dez': 12
};

/**
 * Extrai a sigla do mês do nome do arquivo
 * O formato esperado é: ...-MES.csv ou ...-MES.xlsx
 * Onde MES é uma sigla de 3 letras (jan, fev, mar, etc.)
 * 
 * @param filename Nome do arquivo (ex: "relatorio-meta-nov.csv")
 * @returns A sigla do mês em minúsculas ou null se não encontrada
 */
export const extractMonthFromFilename = (filename: string): string | null => {
  // Remove extensão (.csv, .xlsx, etc.)
  const nameWithoutExt = filename.replace(/\.(csv|xlsx|xls)$/i, '');

  // Pela documentação, a sigla do mês é o ÚLTIMO pedaço após o último hífen
  const parts = nameWithoutExt.split('-').filter(Boolean);
  const lastPart = parts[parts.length - 1] || '';

  // Normaliza: só letras, sem acentos, tudo minúsculo
  const normalized = lastPart
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/[^a-z]/g, '');

  // Só aceita exatamente uma sigla válida de 3 letras no final
  if (normalized.length === 3 && MONTH_MAP[normalized]) {
    return normalized;
  }

  return null;
};

/**
 * Obtém o valor numérico do mês para ordenação
 * @param month Sigla do mês (ex: "nov", "dez")
 * @returns Valor numérico do mês (1-12) ou 0 se inválido
 */
const getMonthValue = (month: string | null): number => {
  if (!month) return 0;
  return MONTH_MAP[month.toLowerCase()] || 0;
};

/**
 * Obtém o ano do dataset (assumindo ano atual ou anterior se necessário)
 * Se o mês do arquivo for maior que o mês atual, assume ano anterior.
 * Caso contrário, assume ano atual.
 * IMPORTANTE: Para comparação, sempre assume que arquivos do mesmo ano ou anteriores
 * são do ano atual, a menos que o mês seja claramente futuro (maior que o atual).
 */
const getYear = (filename: string): number => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12 (janeiro = 1)
  
  const monthValue = getMonthValue(extractMonthFromFilename(filename));
  
  // Se não conseguir detectar o mês, assume ano atual
  if (monthValue === 0) {
    return currentYear;
  }
  
  // Se o mês do arquivo é maior que o mês atual, assume ano anterior
  // Exemplo: estamos em dezembro (12), arquivo é de janeiro (1) -> ano anterior
  // Exemplo: estamos em dezembro (12), arquivo é de novembro (11) -> ano atual
  // Exemplo: estamos em dezembro (12), arquivo é de dezembro (12) -> ano atual
  if (monthValue > currentMonth) {
    return currentYear - 1;
  }
  
  // Caso contrário (mês <= mês atual), assume ano atual
  return currentYear;
};

/**
 * Calcula um valor numérico para ordenação (ano * 100 + mês)
 * Maior valor = mais recente
 */
const getSortValue = (filename: string | undefined): number => {
  if (!filename) return 0;
  
  const month = extractMonthFromFilename(filename);
  const monthValue = getMonthValue(month);
  const year = getYear(filename);
  
  return year * 100 + monthValue;
};

/**
 * Ordena datasets por mês em ordem decrescente (mais recente primeiro)
 * @param datasets Array de datasets para ordenar
 * @returns Array ordenado por mês (mais recente primeiro)
 */
export const sortDatasetsByMonth = (datasets: NormalizedDataset[]): NormalizedDataset[] => {
  return [...datasets].sort((a, b) => {
    const filenameA = a.meta.fileName || a.meta.label;
    const filenameB = b.meta.fileName || b.meta.label;
    
    const valueA = getSortValue(filenameA);
    const valueB = getSortValue(filenameB);
    
    // Ordem decrescente (maior valor primeiro)
    return valueB - valueA;
  });
};

/**
 * Encontra o dataset do mês atual ou anterior (prioriza mês atual)
 * @param datasets Array de datasets
 * @returns O dataset do mês atual, ou do mês anterior, ou o mais recente se nenhum corresponder
 */
export const getMostRecentDataset = (datasets: NormalizedDataset[]): NormalizedDataset | undefined => {
  if (datasets.length === 0) return undefined;
  
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12 (janeiro = 1)
  
  // Ordena primeiro para garantir que estamos procurando na ordem correta
  const sorted = sortDatasetsByMonth(datasets);
  
  // Primeiro, tenta encontrar o dataset do mês atual
  for (const dataset of sorted) {
    const filename = dataset.meta.fileName || dataset.meta.label;
    const month = extractMonthFromFilename(filename);
    const monthValue = getMonthValue(month);
    
    if (monthValue === 0) continue; // Pula se não conseguir detectar o mês
    
    // Para comparação, assume que arquivos do mesmo ano ou anteriores são do ano atual
    // a menos que o mês seja claramente futuro (maior que o atual)
    let year = currentYear;
    if (monthValue > currentMonth) {
      year = currentYear - 1;
    }
    
    // Se for do mês atual e ano atual, retorna imediatamente
    if (monthValue === currentMonth && year === currentYear) {
      return dataset;
    }
  }
  
  // Se não encontrou do mês atual, busca do mês anterior
  const previousMonth = currentMonth === 1 ? 12 : currentMonth - 1;
  const previousYear = currentMonth === 1 ? currentYear - 1 : currentYear;
  
  for (const dataset of sorted) {
    const filename = dataset.meta.fileName || dataset.meta.label;
    const month = extractMonthFromFilename(filename);
    const monthValue = getMonthValue(month);
    
    if (monthValue === 0) continue; // Pula se não conseguir detectar o mês
    
    // Para comparação, assume que arquivos do mesmo ano ou anteriores são do ano atual
    // a menos que o mês seja claramente futuro (maior que o atual)
    let year = currentYear;
    if (monthValue > currentMonth) {
      year = currentYear - 1;
    }
    
    // Se for do mês anterior e ano correspondente, retorna
    if (monthValue === previousMonth && year === previousYear) {
      return dataset;
    }
  }
  
  // Se não encontrou nem do mês atual nem anterior, retorna o primeiro da lista ordenada (mais recente)
  return sorted[0];
};

/**
 * Obtém o primeiro e último dia de um mês
 */
export const getMonthDateRange = (year: number, month: number): { start: string; end: string } => {
  // Usa UTC para evitar problemas de timezone
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const lastDay = new Date(Date.UTC(year, month, 0)); // Último dia do mês
  
  // Formata como YYYY-MM-DD garantindo 2 dígitos
  const formatDate = (date: Date): string => {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, '0');
    const d = String(date.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };
  
  return {
    start: formatDate(firstDay),
    end: formatDate(lastDay)
  };
};

/**
 * Obtém o mês e ano de um dataset
 */
export const getDatasetMonthYear = (dataset: NormalizedDataset): { month: number; year: number } | null => {
  const filename = dataset.meta.fileName || dataset.meta.label;
  const month = extractMonthFromFilename(filename);
  const monthValue = getMonthValue(month);
  
  if (monthValue === 0) return null;
  
  const year = getYear(filename);
  return { month: monthValue, year };
};

