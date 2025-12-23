import { NormalizedDataset, NormalizedMetric } from '../types/normalized';
import { extractMonthFromGoogleFilename, extractAccountFromFilename } from './parsers/googleMultiAccount';

/**
 * Mapeamento de siglas de meses para nomes completos
 */
const MONTH_NAMES: Record<string, string> = {
    'jan': 'Janeiro',
    'fev': 'Fevereiro',
    'mar': 'Março',
    'abr': 'Abril',
    'mai': 'Maio',
    'jun': 'Junho',
    'jul': 'Julho',
    'ago': 'Agosto',
    'set': 'Setembro',
    'out': 'Outubro',
    'nov': 'Novembro',
    'dez': 'Dezembro'
};

const MONTH_ORDER: Record<string, number> = {
    'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4,
    'mai': 5, 'jun': 6, 'jul': 7, 'ago': 8,
    'set': 9, 'out': 10, 'nov': 11, 'dez': 12
};

/**
 * Grupo de datasets Google do mesmo mês
 */
export interface GoogleMonthGroup {
    /** Identificador único (ex: "ago-2025") */
    id: string;
    /** Sigla do mês (ex: "ago") */
    month: string;
    /** Ano inferido */
    year: number;
    /** Label para exibição (ex: "Agosto 2025") */
    label: string;
    /** Lista de contas de anúncio disponíveis neste mês */
    accounts: string[];
    /** Datasets originais que compõem este grupo */
    datasets: NormalizedDataset[];
    /** Todas as linhas de todos os datasets, preservando accountName */
    allRows: NormalizedMetric[];
}

/**
 * Infere o ano com base no mês do arquivo e data atual
 */
const inferYear = (monthValue: number): number => {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;

    // Se o mês do arquivo é maior que o mês atual, assume ano anterior
    if (monthValue > currentMonth) {
        return currentYear - 1;
    }

    return currentYear;
};

/**
 * Agrupa datasets Google por mês
 * Cada grupo contém todos os datasets (contas) daquele mês
 */
export const groupGoogleDatasetsByMonth = (datasets: NormalizedDataset[]): GoogleMonthGroup[] => {
    const groups = new Map<string, GoogleMonthGroup>();

    for (const dataset of datasets) {
        const fileName = dataset.meta.fileName || dataset.meta.label;
        const monthAbbr = extractMonthFromGoogleFilename(fileName);

        if (!monthAbbr) continue;

        const monthValue = MONTH_ORDER[monthAbbr] || 0;
        const year = inferYear(monthValue);
        const groupId = `${monthAbbr}-${year}`;

        const accountName = extractAccountFromFilename(fileName);

        if (!groups.has(groupId)) {
            groups.set(groupId, {
                id: groupId,
                month: monthAbbr,
                year,
                label: `${MONTH_NAMES[monthAbbr] || monthAbbr} ${year}`,
                accounts: [],
                datasets: [],
                allRows: []
            });
        }

        const group = groups.get(groupId)!;

        // Adiciona conta se ainda não existe
        if (!group.accounts.includes(accountName)) {
            group.accounts.push(accountName);
        }

        // Adiciona dataset
        group.datasets.push(dataset);

        // Adiciona todas as linhas
        group.allRows.push(...dataset.rows);
    }

    // Ordena grupos por data (mais recente primeiro)
    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
        const valueA = a.year * 100 + (MONTH_ORDER[a.month] || 0);
        const valueB = b.year * 100 + (MONTH_ORDER[b.month] || 0);
        return valueB - valueA;
    });

    // Ordena contas alfabeticamente dentro de cada grupo
    for (const group of sortedGroups) {
        group.accounts.sort();
    }

    return sortedGroups;
};

/**
 * Filtra as linhas de um grupo por conta de anúncio
 * Se account for null, retorna todas as linhas
 */
export const filterRowsByAccount = (
    group: GoogleMonthGroup,
    account: string | null
): NormalizedMetric[] => {
    if (!account) {
        return group.allRows;
    }

    return group.allRows.filter(row =>
        row.accountName?.toLowerCase() === account.toLowerCase()
    );
};

/**
 * Obtém todas as contas únicas de uma lista de datasets Google
 */
export const getUniqueAccounts = (datasets: NormalizedDataset[]): string[] => {
    const accounts = new Set<string>();

    for (const dataset of datasets) {
        const fileName = dataset.meta.fileName || dataset.meta.label;
        const accountName = extractAccountFromFilename(fileName);
        if (accountName && accountName !== 'Desconhecido') {
            accounts.add(accountName);
        }
    }

    return Array.from(accounts).sort();
};

/**
 * Cria um dataset virtual a partir de um grupo de mês
 * Usado para manter compatibilidade com o sistema existente
 */
export const createVirtualDatasetFromGroup = (
    group: GoogleMonthGroup,
    selectedAccount: string | null
): NormalizedDataset => {
    const filteredRows = filterRowsByAccount(group, selectedAccount);

    const label = selectedAccount
        ? `${group.label} (${selectedAccount})`
        : group.label;

    return {
        meta: {
            id: selectedAccount ? `${group.id}-${selectedAccount.toLowerCase()}` : group.id,
            platform: 'google',
            label,
            source: 'static',
            fileName: group.datasets[0]?.meta.fileName,
            dateRange: group.datasets[0]?.meta.dateRange
        },
        rows: filteredRows
    };
};

/**
 * Encontra o grupo mais recente (para seleção automática)
 */
export const getMostRecentGroup = (groups: GoogleMonthGroup[]): GoogleMonthGroup | undefined => {
    if (groups.length === 0) return undefined;

    // Os grupos já estão ordenados por data decrescente
    return groups[0];
};

/**
 * Obtém o período de datas real de um grupo Google
 * Extrai a menor e maior data dos dados reais da planilha
 * Isso garante que semanas completas que atravessam meses sejam incluídas
 */
export const getGoogleGroupDateRange = (group: GoogleMonthGroup): { start: string; end: string } | null => {
    const allDates: string[] = [];

    // Coleta todas as datas válidas de todas as linhas
    group.allRows.forEach(row => {
        if (row.date && row.date !== '--' && /^\d{4}-\d{2}-\d{2}$/.test(row.date)) {
            allDates.push(row.date);
        }
    });

    if (allDates.length === 0) return null;

    // Ordena as datas
    allDates.sort();

    const firstDate = allDates[0];
    const lastWeekStart = allDates[allDates.length - 1];

    // Para dados semanais, a data final é o início da última semana + 6 dias
    // Isso inclui a semana completa
    const lastWeekEnd = new Date(lastWeekStart);
    lastWeekEnd.setDate(lastWeekEnd.getDate() + 6);

    return {
        start: firstDate,
        end: lastWeekEnd.toISOString().split('T')[0]
    };
};
