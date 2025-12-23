import { Platform } from '../types';
import { NormalizedDataset, AggregatedRow, WeeklyBreakdown, NormalizedMetric } from '../types/normalized';
import { calculateWeeklyBreakdown } from './aggregation';
import { extractMonthFromFilename } from './datasetSorting';

/**
 * Interface para meses disponíveis no sistema
 */
export interface AvailableMonth {
    id: string;        // formato: 'nov-2025'
    label: string;     // formato: 'Novembro 2025'
    month: number;     // 1-12
    year: number;
    hasGoogle: boolean;
    hasMeta: boolean;
    googleDatasets: NormalizedDataset[];
    metaDatasets: NormalizedDataset[];
}

/**
 * Mapeamento de siglas de mês para nomes completos
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
 * Extrai o ano do dataset baseado no nome do arquivo ou contexto
 */
function getDatasetYear(dataset: NormalizedDataset): number {
    // Tenta extrair do primeiro registro de data
    const firstRow = dataset.rows.find(r => r.date);
    if (firstRow?.date) {
        const year = parseInt(firstRow.date.split('-')[0], 10);
        if (!isNaN(year)) return year;
    }

    // Fallback para ano atual
    return new Date().getFullYear();
}

/**
 * Agrupa todos os datasets por mês, combinando Google e Meta
 */
export function groupDatasetsByMonth(datasets: NormalizedDataset[]): AvailableMonth[] {
    const monthMap = new Map<string, AvailableMonth>();

    datasets.forEach(dataset => {
        const filename = dataset.meta.fileName || dataset.meta.label;
        const monthAbbr = extractMonthFromFilename(filename);

        if (!monthAbbr) return;

        const year = getDatasetYear(dataset);
        const monthId = `${monthAbbr}-${year}`;
        const monthNum = MONTH_ORDER[monthAbbr] || 1;

        if (!monthMap.has(monthId)) {
            monthMap.set(monthId, {
                id: monthId,
                label: `${MONTH_NAMES[monthAbbr] || monthAbbr} ${year}`,
                month: monthNum,
                year,
                hasGoogle: false,
                hasMeta: false,
                googleDatasets: [],
                metaDatasets: []
            });
        }

        const entry = monthMap.get(monthId)!;
        if (dataset.meta.platform === 'google') {
            entry.hasGoogle = true;
            entry.googleDatasets.push(dataset);
        } else if (dataset.meta.platform === 'meta') {
            entry.hasMeta = true;
            entry.metaDatasets.push(dataset);
        }
    });

    // Ordena por ano e mês (mais recente primeiro)
    return Array.from(monthMap.values()).sort((a, b) => {
        const aValue = a.year * 100 + a.month;
        const bValue = b.year * 100 + b.month;
        return bValue - aValue;
    });
}

/**
 * Combina as rows de uma conta de ambas plataformas
 */
function aggregateAccountMetrics(rows: NormalizedMetric[]): {
    spend: number;
    revenue: number;
    clicks: number;
    impressions: number;
    conversions: number;
    campaignBudget?: number;
    adGroupBudget?: number;
} {
    let spend = 0, revenue = 0, clicks = 0, impressions = 0, conversions = 0;

    // Use maps to track budgets per unique entity name to avoid double-counting daily rows
    const campaignBudgets = new Map<string, number>();
    const adGroupBudgets = new Map<string, number>();

    rows.forEach(row => {
        spend += row.spend || 0;
        revenue += row.revenue || 0;
        clicks += row.clicks || 0;
        impressions += row.impressions || 0;
        conversions += row.conversions || 0;

        // Only track budget if we have a name and budget value
        if (row.campaignBudget !== undefined && row.campaignName) {
            campaignBudgets.set(row.campaignName, row.campaignBudget);
        }
        if (row.adGroupBudget !== undefined && row.adGroupName) {
            adGroupBudgets.set(row.adGroupName, row.adGroupBudget);
        }
    });

    // Sum up the unique budgets found
    const campaignBudget = campaignBudgets.size > 0
        ? Array.from(campaignBudgets.values()).reduce((a, b) => a + b, 0)
        : undefined;

    const adGroupBudget = adGroupBudgets.size > 0
        ? Array.from(adGroupBudgets.values()).reduce((a, b) => a + b, 0)
        : undefined;

    return {
        spend, revenue, clicks, impressions, conversions,
        campaignBudget,
        adGroupBudget
    };
}

/**
 * Cria visão unificada combinando Google e Meta para um mês
 * Ordem: Meta primeiro, Google abaixo, agrupado por conta
 */
export function createUnifiedView(
    month: AvailableMonth,
    groupBy: 'account' | 'campaign' | 'adgroup' | 'creative' = 'account'
): AggregatedRow[] {
    const rows: AggregatedRow[] = [];
    const accountOrder = new Map<string, number>(); // Para manter ordem das contas
    let orderIndex = 0;

    // 1. Processar Meta primeiro
    month.metaDatasets.forEach(dataset => {
        dataset.rows.forEach(row => {
            const key = groupBy === 'account' ? row.accountName :
                groupBy === 'campaign' ? row.campaignName :
                    groupBy === 'adgroup' ? row.adGroupName :
                        row.creativeName;

            if (key && !accountOrder.has(key)) {
                accountOrder.set(key, orderIndex++);
            }
        });
    });

    // 2. Processar Google
    month.googleDatasets.forEach(dataset => {
        dataset.rows.forEach(row => {
            const key = groupBy === 'account' ? row.accountName :
                groupBy === 'campaign' ? row.campaignName :
                    groupBy === 'adgroup' ? row.adGroupName :
                        row.creativeName;

            if (key && !accountOrder.has(key)) {
                accountOrder.set(key, orderIndex++);
            }
        });
    });

    // 3. Agregar Meta
    if (month.metaDatasets.length > 0) {
        // Combina todas as rows de todos os datasets Meta
        const allMetaRows = month.metaDatasets.flatMap(d => d.rows);

        // Agrupa por groupBy
        const grouped = new Map<string, NormalizedMetric[]>();
        allMetaRows.forEach(row => {
            const key = groupBy === 'account' ? row.accountName :
                groupBy === 'campaign' ? row.campaignName :
                    groupBy === 'adgroup' ? row.adGroupName :
                        row.creativeName;

            if (!key) return;

            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)!.push(row);
        });

        // Cria AggregatedRow para cada grupo
        grouped.forEach((groupRows, key) => {
            const metrics = aggregateAccountMetrics(groupRows);
            const weeklyData = calculateWeeklyBreakdown(groupRows);
            const days = new Set(groupRows.map(r => r.date).filter(Boolean)).size || 1;

            // Fallback budget for Meta if missing
            let finalCampaignBudget = metrics.campaignBudget;
            let finalAdGroupBudget = metrics.adGroupBudget;

            if (groupBy === 'campaign' && (!finalCampaignBudget || finalCampaignBudget === 0)) {
                finalCampaignBudget = (finalAdGroupBudget && finalAdGroupBudget > 0)
                    ? finalAdGroupBudget
                    : (metrics.spend > 0 ? Math.round(metrics.spend / days) : undefined);
            } else if (groupBy === 'adgroup' && (!finalAdGroupBudget || finalAdGroupBudget === 0)) {
                finalAdGroupBudget = (metrics.spend > 0)
                    ? Math.round(metrics.spend / days)
                    : undefined;
            } else if (groupBy === 'account' && (!finalCampaignBudget || finalCampaignBudget === 0)) {
                finalCampaignBudget = (finalAdGroupBudget && finalAdGroupBudget > 0)
                    ? finalAdGroupBudget
                    : (metrics.spend > 0 ? Math.round(metrics.spend / days) : undefined);
            }

            rows.push({
                id: `meta-${key}`,
                name: key,
                platform: 'meta' as Platform,
                spend: metrics.spend,
                revenue: metrics.revenue,
                clicks: metrics.clicks,
                impressions: metrics.impressions,
                conversions: metrics.conversions,
                roas: metrics.revenue > 0 && metrics.spend > 0 ? metrics.revenue / metrics.spend : 0,
                cpa: metrics.conversions > 0 ? metrics.spend / metrics.conversions : 0,
                campaignBudget: finalCampaignBudget,
                adGroupBudget: finalAdGroupBudget,
                weeklyData
            });
        });
    }

    // 4. Agregar Google
    if (month.googleDatasets.length > 0) {
        const allGoogleRows = month.googleDatasets.flatMap(d => d.rows);

        const grouped = new Map<string, NormalizedMetric[]>();
        allGoogleRows.forEach(row => {
            const key = groupBy === 'account' ? row.accountName :
                groupBy === 'campaign' ? row.campaignName :
                    groupBy === 'adgroup' ? row.adGroupName :
                        row.creativeName;

            if (!key) return;

            if (!grouped.has(key)) {
                grouped.set(key, []);
            }
            grouped.get(key)!.push(row);
        });

        grouped.forEach((groupRows, key) => {
            const metrics = aggregateAccountMetrics(groupRows);
            // Google já vem semanal, usar como está
            const weeklyData = calculateWeeklyBreakdown(groupRows);

            rows.push({
                id: `google-${key}`,
                name: key,
                platform: 'google' as Platform,
                spend: metrics.spend,
                revenue: metrics.revenue,
                clicks: metrics.clicks,
                impressions: metrics.impressions,
                conversions: metrics.conversions,
                roas: metrics.revenue > 0 && metrics.spend > 0 ? metrics.revenue / metrics.spend : 0,
                cpa: metrics.conversions > 0 ? metrics.spend / metrics.conversions : 0,
                campaignBudget: metrics.campaignBudget,
                adGroupBudget: metrics.adGroupBudget,
                weeklyData
            });
        });
    }

    // 5. Ordenar: primeiro por nome da conta (alfabeticamente), depois Meta antes de Google
    // Isso agrupa: Kia (Meta), Kia (Google), Suzuki (Meta), Suzuki (Google), etc.
    return rows.sort((a, b) => {
        // Primeiro ordenar por nome da conta (alfabeticamente)
        const nameCompare = a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
        if (nameCompare !== 0) return nameCompare;

        // Mesmo nome: Meta primeiro, Google depois
        if (a.platform === 'meta' && b.platform === 'google') return -1;
        if (a.platform === 'google' && b.platform === 'meta') return 1;

        return 0;
    });
}

/**
 * Calcula totais unificados para StatsCards
 */
export interface UnifiedTotals {
    spend: number;
    conversions: number;
    clicks: number;
    impressions: number;
    cpa: number;
    accountCount: number;
    campaignCount: number;
    adGroupCount: number;
    creativeCount: number;
    secondaryTotals?: {
        spend: number;
        conversions: number;
        clicks: number;
        impressions: number;
        cpa: number;
    };
}

export function calculateUnifiedTotals(rows: AggregatedRow[], month?: AvailableMonth): UnifiedTotals {
    let spend = 0, conversions = 0, clicks = 0, impressions = 0;
    let spendB = 0, conversionsB = 0, clicksB = 0, impressionsB = 0;
    let hasSecondary = false;

    // Calcula métricas somando as rows agregadas
    rows.forEach(row => {
        spend += row.spend;
        conversions += row.conversions;
        clicks += row.clicks;
        impressions += row.impressions;

        if (row.hasComparison) {
            hasSecondary = true;
            spendB += row.spendB || 0;
            conversionsB += row.conversionsB || 0;
            clicksB += row.clicksB || 0;
            impressionsB += row.impressionsB || 0;
        }
    });

    // Se tiver acesso aos dados brutos do mês, conta as entidades únicas corretamente
    const uniqueAccounts = new Set<string>();
    const uniqueCampaigns = new Set<string>();
    const uniqueAdGroups = new Set<string>();
    const uniqueCreatives = new Set<string>();

    if (month) {
        const allRows = [
            ...month.metaDatasets.flatMap(d => d.rows),
            ...month.googleDatasets.flatMap(d => d.rows)
        ];

        allRows.forEach(row => {
            if (row.accountName) uniqueAccounts.add(`${row.accountName}-${row.platform}`);
            if (row.campaignName) uniqueCampaigns.add(`${row.campaignName}-${row.platform}`);
            if (row.adGroupName) uniqueAdGroups.add(`${row.adGroupName}-${row.platform}`);
            if (row.creativeName) uniqueCreatives.add(`${row.creativeName}-${row.platform}`);
        });
    } else {
        // Fallback para quando não temos os dados brutos (menos preciso)
        rows.forEach(row => {
            uniqueAccounts.add(row.name);
        });
    }

    const totals: UnifiedTotals = {
        spend,
        conversions,
        clicks,
        impressions,
        cpa: conversions > 0 ? spend / conversions : 0,
        accountCount: uniqueAccounts.size,
        campaignCount: uniqueCampaigns.size,
        adGroupCount: uniqueAdGroups.size,
        creativeCount: uniqueCreatives.size
    };

    if (hasSecondary) {
        totals.secondaryTotals = {
            spend: spendB,
            conversions: conversionsB,
            clicks: clicksB,
            impressions: impressionsB,
            cpa: conversionsB > 0 ? spendB / conversionsB : 0
        };
    }

    return totals;
}

/**
 * Cria visão de comparação entre dois meses
 * Compara por conta+plataforma (Kia Meta vs Kia Meta de outro mês)
 */
export function createComparisonView(
    monthA: AvailableMonth,
    monthB: AvailableMonth,
    groupBy: 'account' | 'campaign' | 'adgroup' | 'creative' = 'account'
): AggregatedRow[] {
    // Gera dados de ambos meses
    const rowsA = createUnifiedView(monthA, groupBy);
    const rowsB = createUnifiedView(monthB, groupBy);

    // Cria mapa do mês B para lookup rápido (chave: nome+plataforma)
    const monthBMap = new Map<string, AggregatedRow>();
    rowsB.forEach(row => {
        const key = `${row.name}::${row.platform}`;
        monthBMap.set(key, row);
    });

    // Processa comparação para cada row do mês A
    const comparisonRows: AggregatedRow[] = rowsA.map(rowA => {
        const key = `${rowA.name}::${rowA.platform}`;
        const rowB = monthBMap.get(key);

        if (rowB) {
            // Calcula variação percentual
            const spendChange = rowB.spend > 0 ? ((rowA.spend - rowB.spend) / rowB.spend) * 100 : 0;
            const conversionsChange = rowB.conversions > 0 ? ((rowA.conversions - rowB.conversions) / rowB.conversions) * 100 : 0;
            const cpaChange = rowB.cpa > 0 ? ((rowA.cpa - rowB.cpa) / rowB.cpa) * 100 : 0;
            const clicksChange = rowB.clicks > 0 ? ((rowA.clicks - rowB.clicks) / rowB.clicks) * 100 : 0;
            const impressionsChange = rowB.impressions > 0 ? ((rowA.impressions - rowB.impressions) / rowB.impressions) * 100 : 0;

            return {
                ...rowA,
                // Dados de comparação (mês B)
                spendB: rowB.spend,
                conversionsB: rowB.conversions,
                cpaB: rowB.cpa,
                clicksB: rowB.clicks,
                impressionsB: rowB.impressions,
                // Variações
                spendChange,
                conversionsChange,
                cpaChange,
                clicksChange,
                impressionsChange,
                hasComparison: true
            };
        } else {
            // No match no mês B - nova conta/campanha
            return {
                ...rowA,
                hasComparison: false
            };
        }
    });

    // Adiciona rows do mês B que não existem no mês A (saíram do ar)
    rowsB.forEach(rowB => {
        const key = `${rowB.name}::${rowB.platform}`;
        const existsInA = rowsA.some(r => `${r.name}::${r.platform}` === key);

        if (!existsInA) {
            comparisonRows.push({
                ...rowB,
                id: `${rowB.id}-only-b`,
                // Zero no mês atual, valores no mês B
                spend: 0,
                conversions: 0,
                cpa: 0,
                clicks: 0,
                impressions: 0,
                spendB: rowB.spend,
                conversionsB: rowB.conversions,
                cpaB: rowB.cpa,
                clicksB: rowB.clicks,
                impressionsB: rowB.impressions,
                spendChange: -100, // Caiu 100%
                conversionsChange: -100,
                cpaChange: 0,
                clicksChange: -100,
                impressionsChange: -100,
                hasComparison: true
            });
        }
    });

    // Ordenar: primeiro por nome (alfabeticamente), depois Meta antes de Google
    return comparisonRows.sort((a, b) => {
        const nameCompare = a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
        if (nameCompare !== 0) return nameCompare;

        if (a.platform === 'meta' && b.platform === 'google') return -1;
        if (a.platform === 'google' && b.platform === 'meta') return 1;

        return 0;
    });
}

