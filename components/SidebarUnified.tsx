import React, { useState } from 'react';
import {
    Sun,
    Moon,
    Upload,
    RotateCcw,
    Calendar,
    Layers,
    Box,
    LayoutGrid,
    ChevronDown
} from 'lucide-react';
import { Platform, GroupBy } from '../types';
import { AvailableMonth } from '../utils/unifiedAggregation';

interface SidebarUnifiedProps {
    isDarkMode: boolean;
    toggleTheme: () => void;
    groupBy: GroupBy;
    setGroupBy: (group: GroupBy) => void;
    onUpload: (platform: Platform, file: File) => Promise<void>;
    isUploading: boolean;
    uploadProgress: number;
    availableMonths: AvailableMonth[];
    selectedMonthId: string | null;
    comparisonMonthId: string | null;
    onSelectMonth: (monthId: string) => void;
    onSelectComparisonMonth: (monthId: string | null) => void;
    onReloadStaticFiles?: () => void;
    comparisonMode: 'sum' | 'compare';
    setComparisonMode: (mode: 'sum' | 'compare') => void;
}

const SidebarUnified: React.FC<SidebarUnifiedProps> = ({
    isDarkMode,
    toggleTheme,
    groupBy,
    setGroupBy,
    onUpload,
    isUploading,
    uploadProgress,
    availableMonths,
    selectedMonthId,
    comparisonMonthId,
    onSelectMonth,
    onSelectComparisonMonth,
    onReloadStaticFiles,
    comparisonMode,
    setComparisonMode
}) => {
    const [dragActive, setDragActive] = useState(false);
    const [isMonthSelectorOpen, setIsMonthSelectorOpen] = useState(true);

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
            // Detecta plataforma pelo nome do arquivo
            const fileName = e.dataTransfer.files[0].name.toLowerCase();
            const platform: Platform = fileName.includes('google') ? 'google' : 'meta';
            await onUpload(platform, e.dataTransfer.files[0]);
        }
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            const fileName = e.target.files[0].name.toLowerCase();
            const platform: Platform = fileName.includes('google') ? 'google' : 'meta';
            await onUpload(platform, e.target.files[0]);
        }
    };

    // Conta quantas contas tem Google e Meta para cada mês
    const getMonthBadges = (month: AvailableMonth) => {
        const badges = [];
        if (month.hasMeta) badges.push({ label: 'Meta', color: 'bg-blue-500' });
        if (month.hasGoogle) badges.push({ label: 'Google', color: 'bg-red-500' });
        return badges;
    };

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
                {/* Upload Section */}
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

                {/* Modo Toggle - Always Visible */}
                <section>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <RotateCcw size={14} className="text-gray-400" />
                                <span className="text-xs font-semibold text-gray-600 dark:text-gray-300">Modo</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => {
                                        const newMode = comparisonMode === 'sum' ? 'compare' : 'sum';
                                        setComparisonMode(newMode);

                                        if (newMode === 'compare' && !comparisonMonthId && selectedMonthId) {
                                            // Ao ativar compare sem m\u00eas B, auto-selecionar m\u00eas anterior
                                            const currentIdx = availableMonths.findIndex(m => m.id === selectedMonthId);
                                            if (currentIdx >= 0 && currentIdx < availableMonths.length - 1) {
                                                onSelectComparisonMonth(availableMonths[currentIdx + 1].id);
                                            }
                                        } else if (newMode === 'sum') {
                                            // Ao desativar, limpar m\u00eas B
                                            onSelectComparisonMonth(null);
                                        }
                                    }}
                                    className={`relative w-12 h-6 rounded-full transition-colors ${comparisonMode === 'compare' ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                                >
                                    <span className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${comparisonMode === 'compare' ? 'translate-x-6' : 'translate-x-0'}`} />
                                </button>
                                <span className="text-xs text-gray-600 dark:text-gray-300">
                                    {comparisonMode === 'compare' ? 'Comparar meses' : 'Somar relatórios'}
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Month Selector */}
                <section>
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Calendar size={16} />
                            <h3 className="text-xs font-bold uppercase tracking-wider">Mês</h3>
                        </div>
                        <button
                            onClick={() => setIsMonthSelectorOpen(!isMonthSelectorOpen)}
                            className="text-gray-400 hover:text-primary transition-colors"
                        >
                            <ChevronDown size={16} className={`${isMonthSelectorOpen ? 'rotate-180' : ''} transition-transform`} />
                        </button>
                    </div>

                    {isMonthSelectorOpen && (
                        <div className="space-y-3">
                            {/* Month A (base) */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                                <p className="text-xs font-semibold text-primary">Mês A (base)</p>
                                {availableMonths.length === 0 && (
                                    <p className="text-xs text-gray-500">Nenhum mês disponível. Importe planilhas.</p>
                                )}
                                {availableMonths.map((month) => (
                                    <label
                                        key={month.id}
                                        className="flex items-center justify-between gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer py-1"
                                    >
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="radio"
                                                name="monthA"
                                                checked={selectedMonthId === month.id}
                                                onChange={() => onSelectMonth(month.id)}
                                                className="accent-primary"
                                            />
                                            <span>{month.label}</span>
                                        </div>
                                        <div className="flex gap-1">
                                            {month.hasMeta && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                                                    {month.metaDatasets.length} Meta
                                                </span>
                                            )}
                                            {month.hasGoogle && (
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                                                    {month.googleDatasets.length} Google
                                                </span>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>

                            {/* Month B (comparison) */}
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-700 space-y-2">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Mês B (comparação)</p>
                                    {comparisonMonthId && (
                                        <button
                                            onClick={() => {
                                                onSelectComparisonMonth(null);
                                                setComparisonMode('sum'); // Desativar modo ao limpar
                                            }}
                                            className="text-[11px] text-primary hover:underline"
                                        >
                                            limpar
                                        </button>
                                    )}
                                </div>
                                {availableMonths
                                    .filter(m => m.id !== selectedMonthId) // Não mostrar o mês já selecionado
                                    .map((month) => (
                                        <label
                                            key={`${month.id}-b`}
                                            className="flex items-center justify-between gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer py-1"
                                        >
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="monthB"
                                                    checked={comparisonMonthId === month.id}
                                                    onChange={() => {
                                                        onSelectComparisonMonth(month.id);
                                                        // Auto-ativar modo Comparar ao selecionar m\u00eas B
                                                        setComparisonMode('compare');
                                                    }}
                                                    className="accent-primary"
                                                />
                                                <span>{month.label}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {month.hasMeta && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                                                        Meta
                                                    </span>
                                                )}
                                                {month.hasGoogle && (
                                                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                                                        Google
                                                    </span>
                                                )}
                                            </div>
                                        </label>
                                    ))}
                                {availableMonths.filter(m => m.id !== selectedMonthId).length === 0 && (
                                    <p className="text-xs text-gray-500">Adicione mais meses para comparar.</p>
                                )}
                            </div>
                        </div>
                    )}
                </section>

                {/* Group By */}
                <section>
                    <div className="flex items-center gap-2 mb-4 text-gray-400">
                        <Layers size={16} />
                        <h3 className="text-xs font-bold uppercase tracking-wider">Agrupar Por</h3>
                    </div>

                    <div className="space-y-1">
                        {[
                            { id: 'account', label: 'Conta', icon: Box },
                            { id: 'campaign', label: 'Campanha', icon: LayoutGrid }
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
            </div>
        </div>
    );
};

export default SidebarUnified;
