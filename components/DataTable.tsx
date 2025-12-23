import React, { useState } from 'react';
import { ArrowUpDown, AlertCircle, Archive, ChevronRight, ChevronDown, Wand2 } from 'lucide-react';
import { SortConfig, GroupBy, ColumnDef, Platform } from '../types';
import { AggregatedRow, MetricTotals } from '../types/normalized';

// Platform Icons
const MetaIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="#1877F2" />
  </svg>
);

const GoogleIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
  </svg>
);

const PlatformIcon = ({ platform, size = 16 }: { platform: Platform; size?: number }) => {
  return platform === 'meta' ? <MetaIcon size={size} /> : <GoogleIcon size={size} />;
};

interface DataTableProps {
  data: AggregatedRow[];
  groupBy: GroupBy;
  sortConfig: SortConfig;
  onSort: (key: string) => void;
  isWeeklyView?: boolean;
  breakdownGranularity?: 'weekly' | 'daily';
  platform?: Platform;
  columns: ColumnDef[];
  comparisonEnabled?: boolean;
}

const DataTable: React.FC<DataTableProps> = ({ data, groupBy, sortConfig, onSort, isWeeklyView, breakdownGranularity = 'weekly', platform = 'meta', columns, comparisonEnabled }) => {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Filter only visible columns, and conditionally show budgets based on groupBy
  const visibleColumns = columns.filter(c => {
    if (!c.visible) return false;
    // Mostra adGroupBudget apenas quando agrupa por conjunto de anúncios
    if (c.id === 'adGroupBudget' && groupBy !== 'adgroup') return false;
    // Mostra campaignBudget apenas quando agrupa por campanha
    if (c.id === 'campaignBudget' && groupBy !== 'campaign') return false;
    return true;
  });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-darkCard rounded-xl border border-gray-200 dark:border-gray-700">
        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-full mb-4">
          <Archive className="h-8 w-8 text-gray-400" />
        </div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Nenhum dado encontrado.</p>
      </div>
    );
  }

  const toggleRow = (id: string) => {
    const newSet = new Set(expandedRows);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedRows(newSet);
  };

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
  const formatNumber = (val: number) => new Intl.NumberFormat('pt-BR').format(val);

  // Helper to render specific cell content based on column ID
  const renderDelta = (primary: number, breakdown?: MetricTotals | null, delta?: MetricTotals | null, key?: keyof MetricTotals) => {
    if (!comparisonEnabled || !breakdown || key === undefined) {
      return null;
    }
    const secondaryValue = breakdown?.[key];
    if (secondaryValue === undefined || secondaryValue === null) return null;
    const deltaValue = delta?.[key] ?? 0;
    const pct = secondaryValue === 0 ? 0 : (primary - secondaryValue) / secondaryValue * 100;
    return (
      <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
        <span>B: {secondaryValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
        <span className={deltaValue >= 0 ? 'text-green-600' : 'text-red-500'}>
          {deltaValue >= 0 ? '+' : ''}{pct.toFixed(1)}%
        </span>
      </div>
    );
  };

  // Render variação para modo comparação unificado
  const renderUnifiedComparison = (row: AggregatedRow, changeField: keyof AggregatedRow, valueFieldB?: keyof AggregatedRow, isCurrency = false) => {
    if (!row.hasComparison) return null;

    const changeValue = row[changeField] as number | undefined;
    const valueB = valueFieldB ? row[valueFieldB] as number | undefined : undefined;

    if (changeValue === undefined) return null;

    return (
      <div className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-0.5">
        {valueB !== undefined && (
          <span>
            B: {isCurrency
              ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valueB)
              : valueB.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
          </span>
        )}
        <span className={changeValue >= 0 ? 'text-green-600' : 'text-red-500'}>
          {changeValue >= 0 ? '+' : ''}{changeValue.toFixed(1)}%
        </span>
      </div>
    );
  };

  const renderCurrencyWithDelta = (value: number, row: AggregatedRow, key: keyof MetricTotals) => (
    <div className="flex flex-col justify-center">
      <span className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(value)}</span>
      {row.hasComparison
        ? renderUnifiedComparison(row, `${key}Change` as keyof AggregatedRow, `${key}B` as keyof AggregatedRow, true)
        : renderDelta(value, row.breakdown?.secondary ?? null, row.breakdown?.deltas, key)}
    </div>
  );

  const renderNumberWithDelta = (value: number, row: AggregatedRow, key: keyof MetricTotals) => (
    <div className="flex flex-col justify-center">
      <span className="text-sm font-medium text-gray-900 dark:text-white">{formatNumber(value)}</span>
      {row.hasComparison
        ? renderUnifiedComparison(row, `${key}Change` as keyof AggregatedRow, `${key}B` as keyof AggregatedRow, false)
        : renderDelta(value, row.breakdown?.secondary ?? null, row.breakdown?.deltas, key)}
    </div>
  );

  const renderCellContent = (colId: string, row: AggregatedRow, idx: number) => {
    switch (colId) {
      case 'name':
        return isWeeklyView ? (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); toggleRow(row.id); }}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              {expandedRows.has(row.id) ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
            <PlatformIcon platform={row.platform} size={18} />
            <span className="text-sm font-medium text-primary cursor-pointer hover:underline">
              {row.name}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <PlatformIcon platform={row.platform} size={18} />
            <span className="text-sm font-medium text-gray-900 dark:text-white">{row.name}</span>
          </div>
        );

      case 'status':
        return isWeeklyView ? (
          <div className="w-10 h-5 bg-gray-200 dark:bg-gray-600 rounded-full relative cursor-pointer">
            <div className="absolute top-1 left-1 bg-white w-3 h-3 rounded-full shadow-sm"></div>
          </div>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
            Ativo
          </span>
        );

      case 'recommendations':
        return (
          <button className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-full text-xs font-medium border border-blue-100 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
            <Wand2 size={12} />
            {(idx % 5) + 1} recomendações
          </button>
        );

      case 'bidStrategy':
        return <span className="text-sm text-gray-600 dark:text-gray-300">Volume mais alto</span>;

      case 'campaignBudget':
        return row.campaignBudget !== undefined
          ? formatCurrency(row.campaignBudget)
          : <span className="text-sm text-gray-400">-</span>;

      case 'adGroupBudget':
        return row.adGroupBudget !== undefined
          ? formatCurrency(row.adGroupBudget)
          : <span className="text-sm text-gray-400">-</span>;

      case 'spend':
        return renderCurrencyWithDelta(row.spend, row, 'spend');

      case 'attribution':
        return <span className="text-sm text-gray-400">-</span>;

      case 'revenue':
        return renderCurrencyWithDelta(row.revenue, row, 'revenue');

      case 'roas':
        return (
          <div className="flex flex-col justify-center">
            <span className="text-sm text-gray-900 dark:text-white font-semibold">{row.roas.toFixed(2)}x</span>
            {renderDelta(row.roas, row.breakdown?.secondary ?? null, row.breakdown?.deltas, 'roas')}
          </div>
        );

      case 'conversions':
        return renderNumberWithDelta(row.conversions || 0, row, 'conversions');

      case 'impressions':
        return renderNumberWithDelta(row.impressions || 0, row, 'impressions');

      case 'clicks':
        return renderNumberWithDelta(row.clicks || 0, row, 'clicks');

      case 'cpa':
        return renderCurrencyWithDelta(row.cpa || 0, row, 'cpa');

      default:
        return <span className="text-sm text-gray-500">-</span>;
    }
  };

  const groupLabelMap: Record<GroupBy, string> = {
    account: 'Conta',
    campaign: 'Campaign',
    adgroup: 'Grupo de Anúncio',
    creative: 'Criativo',
    date: 'Data'
  };

  return (
    <div className="bg-white dark:bg-darkCard rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-white dark:bg-gray-800/50">
            <tr>
              {/* Optional checkbox column for standard view */}
              {!isWeeklyView && (
                <th className="w-10 px-6 py-3">
                  <div className="w-4 h-4 rounded border border-gray-300 bg-gray-50 dark:border-gray-600 dark:bg-gray-700"></div>
                </th>
              )}

              {visibleColumns.map(col => {
                // Dynamically override the label for the 'Name' column based on GroupBy
                const label = col.id === 'name' ? groupLabelMap[groupBy] : col.label;
                const widthClass = (col.id === 'name' && isWeeklyView) ? 'w-80' : '';

                return (
                  <th
                    key={col.id}
                    className={`px-6 py-4 text-left text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${widthClass}`}
                    onClick={() => onSort(col.id)}
                  >
                    <div className="flex items-center gap-1">
                      {label}
                      <ArrowUpDown size={14} className={sortConfig.key === col.id ? 'text-primary' : 'text-gray-300'} />
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-darkCard divide-y divide-gray-200 dark:divide-gray-700">
            {data.map((row, idx) => {
              const isExpanded = expandedRows.has(row.id);

              return (
                <React.Fragment key={idx}>
                  <tr
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${isExpanded && isWeeklyView ? 'bg-gray-50 dark:bg-gray-800/30' : ''}`}
                    onClick={() => isWeeklyView && toggleRow(row.id)}
                  >
                    {!isWeeklyView && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="w-4 h-4 rounded border border-gray-300 dark:border-gray-600"></div>
                      </td>
                    )}
                    {visibleColumns.map(col => (
                      <td key={col.id} className="px-6 py-4 whitespace-nowrap">
                        {renderCellContent(col.id, row, idx)}
                      </td>
                    ))}
                  </tr>

                  {/* Expanded Content (Weekly or Daily breakdown based on granularity) */}
                  {isWeeklyView && isExpanded && (
                    <>
                      {/* Daily breakdown - only for Meta platform when granularity is 'daily' */}
                      {platform === 'meta' && breakdownGranularity === 'daily' && row.dailyData && row.dailyData.length > 0 && (
                        row.dailyData.map((day, dIdx) => (
                          <tr key={`${row.id}-day-${dIdx}`} className="bg-blue-50/30 dark:bg-blue-900/10 border-l-4 border-l-blue-200 dark:border-l-blue-800">
                            {visibleColumns.map((col, cIdx) => {
                              if (cIdx === 0) {
                                return (
                                  <td key={col.id} className="px-6 py-3 whitespace-nowrap pl-14 text-sm text-gray-600 dark:text-gray-300">
                                    📅 {day.dateDisplay}
                                  </td>
                                );
                              }
                              // Show metrics for days
                              if (col.id === 'conversions') {
                                return <td key={col.id} className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatNumber(day.conversions)}</td>;
                              }
                              if (col.id === 'impressions') {
                                return <td key={col.id} className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatNumber(day.impressions)}</td>;
                              }
                              if (col.id === 'clicks') {
                                return <td key={col.id} className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatNumber(day.clicks)}</td>;
                              }
                              if (col.id === 'spend') {
                                return <td key={col.id} className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(day.spend)}</td>;
                              }
                              if (col.id === 'cpa') {
                                return <td key={col.id} className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{day.conversions > 0 ? formatCurrency(day.spend / day.conversions) : '-'}</td>;
                              }

                              return <td key={col.id} className="px-6 py-3"></td>;
                            })}
                          </tr>
                        ))
                      )}

                      {/* Weekly breakdown - default for Google or when Meta granularity is 'weekly' */}
                      {(platform === 'google' || breakdownGranularity === 'weekly') && row.weeklyData && row.weeklyData.length > 0 && (
                        row.weeklyData.map((week, wIdx) => (
                          <tr key={`${row.id}-week-${wIdx}`} className="bg-gray-50/50 dark:bg-gray-800/20 border-l-4 border-l-transparent">
                            {visibleColumns.map((col, cIdx) => {
                              if (cIdx === 0) {
                                return (
                                  <td key={col.id} className="px-6 py-3 whitespace-nowrap pl-14 text-sm text-gray-500 dark:text-gray-400">
                                    {week.weekRange}
                                  </td>
                                );
                              }
                              // Show metrics for weeks
                              if (col.id === 'conversions') {
                                return <td key={col.id} className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatNumber(week.conversions)}</td>;
                              }
                              if (col.id === 'impressions') {
                                return <td key={col.id} className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatNumber(week.impressions)}</td>;
                              }
                              if (col.id === 'clicks') {
                                return <td key={col.id} className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatNumber(week.clicks)}</td>;
                              }
                              if (col.id === 'spend') {
                                return <td key={col.id} className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatCurrency(week.spend)}</td>;
                              }
                              if (col.id === 'cpa') {
                                return <td key={col.id} className="px-6 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{week.conversions > 0 ? formatCurrency(week.spend / week.conversions) : '-'}</td>;
                              }

                              return <td key={col.id} className="px-6 py-3"></td>;
                            })}
                          </tr>
                        ))
                      )}
                    </>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="bg-gray-50 dark:bg-gray-800/50 px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <AlertCircle size={14} />
        Resultados de {data.length} {groupLabelMap[groupBy].toLowerCase()}s
      </div>
    </div>
  );
};

export default DataTable;