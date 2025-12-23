import React, { useMemo, useState } from 'react';
import {
    Sun,
    Moon,
    Upload,
    RotateCcw,
    Calendar,
    Layers,
    Box,
    Image as ImageIcon,
    LayoutGrid,
    ChevronDown,
    Building2
} from 'lucide-react';
import { Platform, GroupBy, DateRange } from '../types';
import { Filters } from '../utils/aggregation';
import { GoogleMonthGroup } from '../utils/googleDatasetGrouping';

interface SidebarGoogleProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
    groupBy: GroupBy;
    setGroupBy: (group: GroupBy) => void;
    onUpload: (platform: Platform, file: File) => Promise<void>;
    isUploading: boolean;
    uploadProgress: number;
    selectedPlatform: Platform;
    onPlatformChange: (platform: Platform) => void;

    // Date range props (for filtering within a month)
    dateRange: DateRange;
    setDateRange: (range: DateRange) => void;

    // Merge/Comparison mode
    mergeMode: boolean;
    onToggleMerge: () => void;

    // Google-specific props
    monthGroups: GoogleMonthGroup[];
    selectedMonthA: string | null;
    selectedMonthB: string | null;
    onSelectMonthA: (id: string) => void;
    onSelectMonthB: (id: string | null) => void;
    selectedAccount: string | null;
    onSelectAccount: (account: string | null) => void;
    availableAccounts: string[];

    // Filters
    filters: Filters;
    onChangeFilters: (filters: Filters) => void;
    filterOptions: Filters;

    onReloadStaticFiles?: () => void;
    isLoadingDataset?: boolean;
}

const SidebarGoogle: React.FC<SidebarGoogleProps> = ({
    isDarkMode,
    toggleTheme,
    groupBy,
    setGroupBy,
    onUpload,
    isUploading,
    uploadProgress,
    selectedPlatform,
    onPlatformChange,
    dateRange,
    setDateRange,
    mergeMode,
    onToggleMerge,
    monthGroups,
    selectedMonthA,
    selectedMonthB,
    onSelectMonthA,
    onSelectMonthB,
    selectedAccount,
    onSelectAccount,
    availableAccounts,
    filters,
    onChangeFilters,
    filterOptions,
    onReloadStaticFiles,
    isLoadingDataset = false
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [isDatasetOpen, setIsDatasetOpen] = useState(true);
    const [isFilterOpen, setIsFilterOpen] = useState(true);

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await onUpload(selectedPlatform, e.dataTransfer.files[0]);
        }
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            await onUpload(selectedPlatform, e.target.files[0]);
        }
    };

    const toggleFilterValue = (key: keyof Filters, value: string) => {
        const current = new Set(filters[key]);
        if (current.has(value)) current.delete(value);
        else current.add(value);
        onChangeFilters({ ...filters, [key]: Array.from(current) });
    };

    const clearFilters = () => {
        onChangeFilters({
            accounts: [],
            campaigns: [],
            adGroups: [],
            creatives: []
        });
        onSelectAccount(null);
    };

    // Encontra o grupo selecionado para mostrar contas disponíveis
    const selectedGroup = useMemo(() => {
        return monthGroups.find(g => g.id === selectedMonthA);
    }, [monthGroups, selectedMonthA]);

    return (
        <div className="w-[320px] bg-white dark:bg-darkCard border-l border-gray-200 dark:border-gray-700 h-screen flex flex-col shadow-xl z-20 shrink-0">
            <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
                <a
                    href="https://topstack.com.br"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="cursor-pointer hover:opacity-80 transition-opacity"
                >
                    <img
                        src="/assets/visual-identity/topstack-logo-3x1.png"
                        alt="Topstack Logo"
                        className="h-8 object-contain dark:invert dark:brightness-200"
                    />
                </a>
                <div className="flex gap-2">
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors"
                    >
                        {isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
                    </button>
                    <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors">
                        <RotateCcw size={18} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
                <section className="hidden">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Importar Dados</h3>



                    <div
                        className={`
                relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
                ${dragActive ? 'border-primary bg-blue-50 dark:bg-blue-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-primary/50 dark:hover:border-primary/50'}
                ${isUploading ? 'pointer-events-none opacity-80' : 'cursor-pointer'}
            `}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                    >
                        <input
                            type="file"
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            onChange={handleChange}
                            accept=".csv,.xlsx,.xls"
                            disabled={isUploading}
                        />

                        {isUploading ? (
                            <div className="flex flex-col items-center justify-center py-2">
                                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                                    <div
                                        className="h-full bg-primary transition-all duration-300 ease-out"
                                        style={{ width: `${uploadProgress}%` }}
                                    ></div>
                                </div>
                                <span className="text-sm font-semibold text-primary">{uploadProgress}%</span>
                                <span className="text-xs text-gray-400 mt-1">Processando...</span>
                            </div>
                        ) : (
                            <>
                                <div className="w-10 h-10 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400">
                                    <Upload size={20} />
                                </div>
                                <p className="text-sm font-semibold text-primary mb-1">Clique para enviar</p>
                                <p className="text-xs text-gray-400">Suporta Google e Meta Ads (CSV)</p>
                            </>
                        )}
                    </div>

                    {onReloadStaticFiles && (
                        <button
                            onClick={onReloadStaticFiles}
                            disabled={isUploading}
                            className="w-full mt-3 py-2 text-sm text-primary font-medium border border-primary/20 rounded-lg hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <RotateCcw size={14} className={isUploading ? 'animate-spin' : ''} />
                            {isUploading ? 'Atualizando...' : 'Atualizar Planilhas'}
                        </button>
                    )}
                </section>

                <section>
                    <div className="flex items-center gap-2 mb-4 text-gray-400">
                        <Calendar size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Período</h3>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl space-y-4">
                        <h4 className="text-xs font-bold text-primary uppercase mb-2">Período Atual</h4>
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Início</label>
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="w-full text-sm p-2 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-darkCard text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Fim</label>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="w-full text-sm p-2 rounded border border-gray-200 dark:border-gray-600 bg-white dark:bg-darkCard text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                            />
                        </div>

                        {/* Merge/Comparison Mode Toggle */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                <RotateCcw size={14} />
                                <span>Modo</span>
                            </div>
                            <button
                                onClick={onToggleMerge}
                                className={`w-16 h-7 rounded-full relative transition-colors ${!mergeMode ? 'bg-amber-500' : 'bg-primary'}`}
                            >
                                <div
                                    className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transition-transform ${!mergeMode ? 'translate-x-8' : 'translate-x-0'
                                        }`}
                                ></div>
                            </button>
                            <span className="text-[11px] text-gray-500">
                                {mergeMode ? 'Somar relatórios' : 'Comparar A x B'}
                            </span>
                        </div>
                    </div>
                </section>

                <section>
                    <div className="flex items-center gap-2 mb-4 text-gray-400">
                        <Layers size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Agrupar Por</h3>
                    </div>

                    <div className="space-y-1">
                        {[
                            { id: 'account', label: 'Conta', icon: Box },
                            { id: 'campaign', label: 'Campanha', icon: LayoutGrid },
                            { id: 'adgroup', label: 'Conjunto de Anúncios', icon: Layers },
                            { id: 'creative', label: 'Criativo', icon: ImageIcon },
                            { id: 'date', label: 'Data', icon: Calendar }
                        ].map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setGroupBy(item.id as GroupBy)}
                                className={`w-full flex items-center px-3 py-2.5 rounded-lg text-sm transition-colors ${groupBy === item.id
                                    ? 'bg-white dark:bg-gray-800 shadow-sm text-primary font-medium'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                                    }`}
                            >
                                <div
                                    className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${groupBy === item.id ? 'border-primary' : 'border-gray-400'
                                        }`}
                                >
                                    {groupBy === item.id && <div className="w-2 h-2 rounded-full bg-primary" />}
                                </div>
                                {item.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Relatórios</h3>
                        <button
                            onClick={() => setIsDatasetOpen(!isDatasetOpen)}
                            className="text-gray-400 hover:text-primary transition-colors"
                        >
                            <ChevronDown size={16} className={`${isDatasetOpen ? 'rotate-180' : ''} transition-transform`} />
                        </button>
                    </div>
                    {isDatasetOpen && (
                        <div className="space-y-3">
                            {isLoadingDataset && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2 flex items-center gap-2">
                                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                    <span className="text-xs text-primary font-medium">Carregando relatório...</span>
                                </div>
                            )}

                            {/* Seletor de Mês A (base) */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                                <p className="text-xs font-semibold text-primary">Relatório A (base)</p>
                                {monthGroups.length === 0 && (
                                    <p className="text-xs text-gray-500">Nenhum relatório disponível para a plataforma.</p>
                                )}
                                {monthGroups.map((group) => (
                                    <label
                                        key={group.id}
                                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
                                    >
                                        <input
                                            type="radio"
                                            name="monthA"
                                            checked={selectedMonthA === group.id}
                                            onChange={() => onSelectMonthA(group.id)}
                                            className="accent-primary"
                                        />
                                        <span className="truncate">{group.label}</span>
                                        <span className="text-xs text-gray-400 ml-auto">
                                            {group.accounts.length} conta{group.accounts.length !== 1 ? 's' : ''}
                                        </span>
                                    </label>
                                ))}
                            </div>

                            {/* Seletor de Mês B (comparação) */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Relatório B (comparação)</p>
                                    {selectedMonthB && (
                                        <button onClick={() => onSelectMonthB(null)} className="text-[11px] text-primary hover:underline">
                                            limpar
                                        </button>
                                    )}
                                </div>
                                {monthGroups.map((group) => (
                                    <label
                                        key={`${group.id}-b`}
                                        className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer"
                                    >
                                        <input
                                            type="radio"
                                            name="monthB"
                                            checked={selectedMonthB === group.id}
                                            onChange={() => onSelectMonthB(group.id)}
                                            className="accent-primary"
                                        />
                                        <span className="truncate">{group.label}</span>
                                        <span className="text-xs text-gray-400 ml-auto">
                                            {group.accounts.length} conta{group.accounts.length !== 1 ? 's' : ''}
                                        </span>
                                    </label>
                                ))}
                                {monthGroups.length === 0 && (
                                    <p className="text-xs text-gray-500">Selecione arquivos para habilitar.</p>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                <section>
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Filtros</h3>
                        <div className="flex items-center gap-2">
                            <button onClick={clearFilters} className="text-[11px] text-primary hover:underline">
                                limpar
                            </button>
                            <button onClick={() => setIsFilterOpen(!isFilterOpen)} className="text-gray-400 hover:text-primary transition-colors">
                                <ChevronDown size={16} className={`${isFilterOpen ? 'rotate-180' : ''} transition-transform`} />
                            </button>
                        </div>
                    </div>
                    {isFilterOpen && (
                        <div className="space-y-4">
                            {/* Filtro de Conta de Anúncio (específico Google) */}
                            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Building2 size={14} className="text-primary" />
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Conta de Anúncio</span>
                                    </div>
                                    <span className="text-[11px] text-gray-400">
                                        {selectedAccount || 'Todas'}
                                    </span>
                                </div>
                                <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                                    {/* Opção "Todas" */}
                                    <button
                                        onClick={() => onSelectAccount(null)}
                                        className={`w-full flex items-center gap-2 text-sm text-left rounded-lg px-2 py-1 transition-colors ${selectedAccount === null
                                            ? 'bg-primary/10 text-primary'
                                            : 'bg-white dark:bg-darkCard text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                            }`}
                                    >
                                        <div className={`w-4 h-4 border rounded ${selectedAccount === null ? 'bg-primary border-primary' : 'border-gray-300'}`} />
                                        <span>Todas as Contas</span>
                                    </button>

                                    {/* Contas disponíveis */}
                                    {availableAccounts.map((account) => (
                                        <button
                                            key={account}
                                            onClick={() => onSelectAccount(account)}
                                            className={`w-full flex items-center gap-2 text-sm text-left rounded-lg px-2 py-1 transition-colors ${selectedAccount === account
                                                ? 'bg-primary/10 text-primary'
                                                : 'bg-white dark:bg-darkCard text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                                }`}
                                        >
                                            <div className={`w-4 h-4 border rounded ${selectedAccount === account ? 'bg-primary border-primary' : 'border-gray-300'}`} />
                                            <span className="truncate">{account}</span>
                                        </button>
                                    ))}

                                    {availableAccounts.length === 0 && (
                                        <p className="text-xs text-gray-500">Nenhuma conta disponível.</p>
                                    )}
                                </div>
                            </div>

                            {/* Outros filtros (campanhas, etc) */}
                            {[
                                { key: 'campaigns' as const, label: 'Campanha' },
                                { key: 'adGroups' as const, label: 'Conjunto de Anúncios' },
                                { key: 'creatives' as const, label: 'Anúncio' }
                            ].map((filter) => (
                                <div key={filter.key} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{filter.label}</span>
                                        <span className="text-[11px] text-gray-400">{filters[filter.key].length || 0} selecionado(s)</span>
                                    </div>
                                    <div className="max-h-36 overflow-y-auto space-y-2 pr-1">
                                        {filterOptions[filter.key].length === 0 && (
                                            <p className="text-xs text-gray-500">Sem opções para o dataset atual.</p>
                                        )}
                                        {filterOptions[filter.key].map((option) => {
                                            const active = filters[filter.key].includes(option);
                                            return (
                                                <button
                                                    key={option}
                                                    onClick={() => toggleFilterValue(filter.key, option)}
                                                    className={`w-full flex items-center gap-2 text-sm text-left rounded-lg px-2 py-1 transition-colors ${active
                                                        ? 'bg-primary/10 text-primary'
                                                        : 'bg-white dark:bg-darkCard text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700'
                                                        }`}
                                                >
                                                    <div className={`w-4 h-4 border rounded ${active ? 'bg-primary border-primary' : 'border-gray-300'}`} />
                                                    <span className="truncate">{option}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};

export default SidebarGoogle;
