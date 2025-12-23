import React from 'react';
import { DollarSign, TrendingUp, BarChart3, MousePointerClick, Target, Building2, Megaphone, Layers, FileText } from 'lucide-react';
import { MetricTotals } from '../types/normalized';

interface EntityCounts {
  accounts: number;
  campaigns: number;
  adGroups: number;
  creatives: number;
}

interface StatsCardsProps {
  totalSpend: number;
  totalConversions: number;
  cpa: number;
  totalClicks: number;
  comparisonEnabled?: boolean;
  secondaryTotals?: MetricTotals;
  totalsDeltas?: MetricTotals;
  entityCounts?: EntityCounts;
  secondaryEntityCounts?: EntityCounts;
}

const StatsCards: React.FC<StatsCardsProps> = ({ 
  totalSpend, 
  totalConversions, 
  cpa, 
  totalClicks,
  comparisonEnabled = false,
  secondaryTotals,
  totalsDeltas,
  entityCounts,
  secondaryEntityCounts
}) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  // Renderiza delta de comparação
  const renderDelta = (primary: number, secondary: number | undefined, delta: number | undefined, isCurrency: boolean = false) => {
    if (!comparisonEnabled || secondary === undefined || delta === undefined) return null;
    
    const pct = secondary === 0 ? 0 : (primary - secondary) / secondary * 100;
    const formattedSecondary = isCurrency ? formatCurrency(secondary) : formatNumber(secondary);
    
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
        <span>B: {formattedSecondary}</span>
        <span className={delta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
          {delta >= 0 ? '+' : ''}{pct.toFixed(1)}%
        </span>
      </div>
    );
  };

  // Renderiza delta para contagens (números inteiros)
  const renderCountDelta = (primary: number, secondary: number | undefined) => {
    if (!comparisonEnabled || secondary === undefined) return null;
    
    const delta = primary - secondary;
    const pct = secondary === 0 ? 0 : (delta / secondary) * 100;
    
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
        <span>B: {formatNumber(secondary)}</span>
        <span className={delta >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}>
          {delta >= 0 ? '+' : ''}{pct.toFixed(1)}%
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Primeira fileira: Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Investment */}
      <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Investimento</p>
          <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{formatCurrency(totalSpend)}</h3>
          {renderDelta(totalSpend, secondaryTotals?.spend, totalsDeltas?.spend, true)}
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
          <DollarSign size={24} />
        </div>
      </div>

      {/* Conversions */}
      <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conversões</p>
          <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{formatNumber(totalConversions)}</h3>
          {renderDelta(totalConversions, secondaryTotals?.conversions, totalsDeltas?.conversions, false)}
        </div>
        <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
          <Target size={24} />
        </div>
      </div>

      {/* CPA */}
      <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Custo por resultado</p>
          <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{formatCurrency(cpa)}</h3>
          {renderDelta(cpa, secondaryTotals?.cpa, totalsDeltas?.cpa, true)}
        </div>
        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
          <BarChart3 size={24} />
        </div>
      </div>

      {/* Clicks */}
      <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cliques</p>
          <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{formatNumber(totalClicks)}</h3>
          {renderDelta(totalClicks, secondaryTotals?.clicks, totalsDeltas?.clicks, false)}
        </div>
        <div className="p-3 bg-cyan-50 dark:bg-cyan-900/30 rounded-lg text-cyan-600 dark:text-cyan-400">
          <MousePointerClick size={24} />
        </div>
      </div>
      </div>

      {/* Segunda fileira: Contagens de entidades */}
      {entityCounts && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Accounts */}
          <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Contas</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{formatNumber(entityCounts.accounts)}</h3>
              {renderCountDelta(entityCounts.accounts, secondaryEntityCounts?.accounts)}
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Building2 size={24} />
            </div>
          </div>

          {/* Campaigns */}
          <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Campanhas</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{formatNumber(entityCounts.campaigns)}</h3>
              {renderCountDelta(entityCounts.campaigns, secondaryEntityCounts?.campaigns)}
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Megaphone size={24} />
            </div>
          </div>

          {/* Ad Groups */}
          <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Conjuntos</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{formatNumber(entityCounts.adGroups)}</h3>
              {renderCountDelta(entityCounts.adGroups, secondaryEntityCounts?.adGroups)}
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <Layers size={24} />
            </div>
          </div>

          {/* Creatives */}
          <div className="bg-white dark:bg-darkCard p-5 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex justify-between items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Anúncios</p>
              <h3 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">{formatNumber(entityCounts.creatives)}</h3>
              {renderCountDelta(entityCounts.creatives, secondaryEntityCounts?.creatives)}
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
              <FileText size={24} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsCards;