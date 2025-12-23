/// <reference types="vite/client" />
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import SidebarGoogle from './components/SidebarGoogle';
import SidebarUnified from './components/SidebarUnified';
import StatsCards from './components/StatsCards';
import DataTable from './components/DataTable';
import DataChart from './components/DataChart';
import ColumnSelector from './components/ColumnSelector';
import LoadingState from './components/LoadingState';
import Login from './components/Login';
import AccessDenied from './components/AccessDenied';
import { supabase } from './utils/supabase';
import { DateRange, GroupBy, SortConfig, Platform, ColumnDef, ChartType } from './types';
import { NormalizedDataset } from './types/normalized';
import { parseMetaCsv } from './utils/parsers/meta';
import { parseGoogleCsv } from './utils/parsers/google';
import { parseGoogleMultiAccountCsv } from './utils/parsers/googleMultiAccount';
import { excelUrlToCsv, excelToCsv } from './utils/parsers/excel';
import { aggregateWithComparison, Filters } from './utils/aggregation';
import { sortDatasetsByMonth, getMostRecentDataset, getMonthDateRange, getDatasetMonthYear } from './utils/datasetSorting';
import {
  groupGoogleDatasetsByMonth,
  GoogleMonthGroup,
  createVirtualDatasetFromGroup,
  getUniqueAccounts,
  getMostRecentGroup,
  getGoogleGroupDateRange
} from './utils/googleDatasetGrouping';
import {
  groupDatasetsByMonth,
  createUnifiedView,
  createComparisonView,
  calculateUnifiedTotals,
  AvailableMonth
} from './utils/unifiedAggregation';
import { BarChart2, List, LayoutTemplate, Columns, ChevronDown, Waves, BarChart3, PieChart, LineChart, Hexagon } from 'lucide-react';

const DEFAULT_COLUMNS: ColumnDef[] = [
  // Coluna fixa (sempre visível, não aparece no seletor)
  { id: 'name', label: 'Nome', visible: true, fixed: true },
  // Colunas marcadas inicialmente (na ordem especificada)
  { id: 'campaignBudget', label: 'Orçamento da campanha', visible: true },
  { id: 'spend', label: 'Investimento', visible: true },
  { id: 'conversions', label: 'Resultados', visible: true },
  { id: 'cpa', label: 'CPA', visible: true },
  { id: 'impressions', label: 'Alcance', visible: true },
  { id: 'clicks', label: 'Cliques', visible: true },
  // Colunas não marcadas inicialmente
  { id: 'adGroupBudget', label: 'Orçamento do conjunto de anúncios', visible: false },
  { id: 'status', label: 'Status', visible: false },
  { id: 'recommendations', label: 'Recomendações', visible: false },
  { id: 'bidStrategy', label: 'Estratégia de lance', visible: false },
  { id: 'attribution', label: 'Configuração de atribuição', visible: false },
  { id: 'revenue', label: 'Receita', visible: false },
  { id: 'roas', label: 'ROAS', visible: false },
];

const chartTypes: { id: ChartType; label: string; icon: React.ElementType }[] = [
  { id: 'area', label: 'Ondas', icon: Waves },
  { id: 'bar', label: 'Barras', icon: BarChart3 },
  { id: 'pie', label: 'Pizza', icon: PieChart },
  { id: 'line', label: 'Linhas', icon: LineChart },
  { id: 'radar', label: 'Radial', icon: Hexagon },
];

// Load static files dynamically using glob with eager: false
const loadStaticFiles = async (): Promise<NormalizedDataset[]> => {
  const loaded: NormalizedDataset[] = [];

  try {
    // Use dynamic glob import to detect new files (CSV and XLSX)
    const metaCsvGlob = import.meta.glob('./planilhas/meta/*.csv', { as: 'url', eager: false });
    const metaXlsxGlob = import.meta.glob('./planilhas/meta/*.xlsx', { as: 'url', eager: false });
    const googleCsvGlob = import.meta.glob('./planilhas/google/*.csv', { as: 'url', eager: false });
    const googleXlsxGlob = import.meta.glob('./planilhas/google/*.xlsx', { as: 'url', eager: false });

    // Load Meta CSV files
    const metaCsvPromises = Object.entries(metaCsvGlob).map(async ([path, loader]) => {
      try {
        const url = await loader();
        const response = await fetch(url as string);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        const content = await response.text();
        const fileName = path.split('/').pop() || 'meta.csv';
        return parseMetaCsv(content, fileName, 'static');
      } catch (err) {
        console.warn(`Failed to load ${path}:`, err);
        return null;
      }
    });

    // Load Meta XLSX files
    const metaXlsxPromises = Object.entries(metaXlsxGlob).map(async ([path, loader]) => {
      try {
        const url = await loader();
        const csvContent = await excelUrlToCsv(url as string);
        const fileName = path.split('/').pop() || 'meta.xlsx';
        return parseMetaCsv(csvContent, fileName, 'static');
      } catch (err) {
        console.warn(`Failed to load ${path}:`, err);
        return null;
      }
    });

    // Load Google CSV files (using multi-account parser)
    const googleCsvPromises = Object.entries(googleCsvGlob).map(async ([path, loader]) => {
      try {
        const url = await loader();
        const response = await fetch(url as string);
        if (!response.ok) throw new Error(`Failed to fetch ${url}`);
        const content = await response.text();
        const fileName = path.split('/').pop() || 'google.csv';
        return parseGoogleMultiAccountCsv(content, fileName, 'static');
      } catch (err) {
        console.warn(`Failed to load ${path}:`, err);
        return null;
      }
    });

    // Load Google XLSX files (using multi-account parser)
    const googleXlsxPromises = Object.entries(googleXlsxGlob).map(async ([path, loader]) => {
      try {
        const url = await loader();
        const csvContent = await excelUrlToCsv(url as string);
        const fileName = path.split('/').pop() || 'google.xlsx';
        return parseGoogleMultiAccountCsv(csvContent, fileName, 'static');
      } catch (err) {
        console.warn(`Failed to load ${path}:`, err);
        return null;
      }
    });

    const metaCsvResults = await Promise.all(metaCsvPromises);
    const metaXlsxResults = await Promise.all(metaXlsxPromises);
    const googleCsvResults = await Promise.all(googleCsvPromises);
    const googleXlsxResults = await Promise.all(googleXlsxPromises);

    loaded.push(...metaCsvResults.filter((d): d is NormalizedDataset => d !== null));
    loaded.push(...metaXlsxResults.filter((d): d is NormalizedDataset => d !== null));
    loaded.push(...googleCsvResults.filter((d): d is NormalizedDataset => d !== null));
    loaded.push(...googleXlsxResults.filter((d): d is NormalizedDataset => d !== null));
  } catch (err) {
    console.error('Error loading static files:', err);
  }

  return loaded;
};

const App: React.FC = () => {
  // Global State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [datasets, setDatasets] = useState<NormalizedDataset[]>([]);

  // Auth State
  const [session, setSession] = useState<any>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check current session
  useEffect(() => {
    let isMounted = true;
    let authCheckCompleted = false;
    const allowedRoles = ['ADM', 'Sócios', 'Gestores'];

    // Helper to ensure we always clear the loading state
    const stopLoading = () => {
      if (isMounted) setIsAuthLoading(false);
    };

    // Helper to clear session and show error
    const handleUnauthorized = async (message: string) => {
      authCheckCompleted = true;

      if (isMounted) {
        setAuthError(message);
        setIsAuthorized(false);
        stopLoading();
      }
    };

    const validateUserRole = async (userSession: any) => {
      if (!userSession) return false;
      try {
        const profilePromise = supabase
          .from('perfil_de_usuario')
          .select('cargo')
          .eq('id', userSession.user.id)
          .single();

        // 10 second timeout for the database check
        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 10000)
        );

        const result = (await Promise.race([profilePromise, timeoutPromise])) as any;

        const isAllowed = result?.data && allowedRoles.includes(result.data.cargo);
        return isAllowed;
      } catch (err) {
        return false;
      }
    };

    const runAuthCheck = async () => {
      const timer = setTimeout(() => {
        if (!authCheckCompleted && isMounted) {
          handleUnauthorized('Você não tem permissão administrativa suficiente');
        }
      }, 10000);

      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        if (currentSession) {
          const isAllowed = await validateUserRole(currentSession);
          if (isMounted) {
            setSession(currentSession);
            setIsAuthorized(isAllowed);
            setAuthError(isAllowed ? null : 'Você não tem permissão administrativa suficiente');
            authCheckCompleted = true;
            stopLoading();
          }
        } else {
          if (isMounted) {
            setSession(null);
            setIsAuthorized(false);
            authCheckCompleted = true;
            stopLoading();
          }
        }
      } catch (err) {
        authCheckCompleted = true;
        stopLoading();
      } finally {
        clearTimeout(timer);
      }
    };

    runAuthCheck();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (event === 'SIGNED_OUT') {
        if (isMounted) {
          setSession(null);
          setIsAuthorized(false);
          authCheckCompleted = true;
          stopLoading();
        }
        return;
      }

      if (newSession) {
        const isAllowed = await validateUserRole(newSession);
        if (isMounted) {
          setSession(newSession);
          setIsAuthorized(isAllowed);
          setAuthError(isAllowed ? null : 'Você não tem permissão administrativa suficiente');
          authCheckCompleted = true;
          stopLoading();
        }
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Filter State
  const today = new Date();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  const [dateRange, setDateRange] = useState<DateRange>({
    start: firstDay.toISOString().split('T')[0],
    end: lastDay.toISOString().split('T')[0]
  });

  const [groupBy, setGroupBy] = useState<GroupBy>('account');
  const [viewMode, setViewMode] = useState<'list' | 'chart'>('list');
  const [isWeeklyView, setIsWeeklyView] = useState(false);
  const [breakdownGranularity, setBreakdownGranularity] = useState<'weekly' | 'daily'>('weekly');
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('meta');
  const [datasetAId, setDatasetAId] = useState<string | null>(null);
  const [datasetBId, setDatasetBId] = useState<string | null>(null);
  const [mergeMode, setMergeMode] = useState<boolean>(true);
  const [filters, setFilters] = useState<Filters>({
    accounts: [],
    campaigns: [],
    adGroups: [],
    creatives: []
  });

  // Chart State
  const [chartType, setChartType] = useState<ChartType>('area');
  const [isChartSelectorOpen, setIsChartSelectorOpen] = useState(false);

  // Column State
  const [columns, setColumns] = useState<ColumnDef[]>(DEFAULT_COLUMNS);
  const [isColumnSelectorOpen, setIsColumnSelectorOpen] = useState(false);

  // Auto-show/hide budget columns based on groupBy
  useEffect(() => {
    setColumns(prev => prev.map(col => {
      // Mostra campaignBudget quando agrupa por campanha
      if (col.id === 'campaignBudget') {
        return { ...col, visible: groupBy === 'campaign' };
      }
      // Mostra adGroupBudget quando agrupa por conjunto de anúncios
      if (col.id === 'adGroupBudget') {
        return { ...col, visible: groupBy === 'adgroup' };
      }
      return col;
    }));
  }, [groupBy]);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isLoadingDataset, setIsLoadingDataset] = useState(false);

  // Sorting State - default to name asc for brand grouping in unified view
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'name', direction: 'asc' });

  // Google-specific State
  const [googleMonthGroups, setGoogleMonthGroups] = useState<GoogleMonthGroup[]>([]);
  const [selectedGoogleMonthA, setSelectedGoogleMonthA] = useState<string | null>(null);
  const [selectedGoogleMonthB, setSelectedGoogleMonthB] = useState<string | null>(null);
  const [selectedGoogleAccount, setSelectedGoogleAccount] = useState<string | null>(null);

  // Unified View State (Google + Meta combined)
  const [viewPlatformMode, setViewPlatformMode] = useState<'unified' | 'single'>('unified');
  const [selectedUnifiedMonth, setSelectedUnifiedMonth] = useState<string | null>(null);
  const [comparisonUnifiedMonth, setComparisonUnifiedMonth] = useState<string | null>(null);
  const [comparisonMode, setComparisonMode] = useState<'sum' | 'compare'>('sum');

  // Computed: available months combining all datasets
  const availableMonths = useMemo(() => {
    return groupDatasetsByMonth(datasets);
  }, [datasets]);

  // Auto-select most recent month when available
  useEffect(() => {
    if (availableMonths.length > 0 && !selectedUnifiedMonth) {
      setSelectedUnifiedMonth(availableMonths[0].id);
    }
  }, [availableMonths, selectedUnifiedMonth]);

  // Unified data for the selected month
  const unifiedData = useMemo(() => {
    if (viewPlatformMode !== 'unified' || !selectedUnifiedMonth) return null;

    const monthA = availableMonths.find(m => m.id === selectedUnifiedMonth);
    if (!monthA) return null;

    let rows;

    // Se há mês de comparação e modo é 'compare', usar comparação
    if (comparisonUnifiedMonth && comparisonMode === 'compare') {
      const monthB = availableMonths.find(m => m.id === comparisonUnifiedMonth);
      if (monthB) {
        rows = createComparisonView(monthA, monthB, groupBy as 'account' | 'campaign' | 'adgroup');
      } else {
        rows = createUnifiedView(monthA, groupBy as 'account' | 'campaign' | 'adgroup');
      }
    } else if (comparisonUnifiedMonth && comparisonMode === 'sum') {
      // Modo somar: combina dados de ambos meses
      const monthB = availableMonths.find(m => m.id === comparisonUnifiedMonth);
      if (monthB) {
        // Combina os datasets
        const combinedMonth: AvailableMonth = {
          ...monthA,
          id: `combined-${monthA.id}-${monthB.id}`,
          googleDatasets: [...monthA.googleDatasets, ...monthB.googleDatasets],
          metaDatasets: [...monthA.metaDatasets, ...monthB.metaDatasets]
        };
        rows = createUnifiedView(combinedMonth, groupBy as 'account' | 'campaign' | 'adgroup');
      } else {
        rows = createUnifiedView(monthA, groupBy as 'account' | 'campaign' | 'adgroup');
      }
    } else {
      rows = createUnifiedView(monthA, groupBy as 'account' | 'campaign' | 'adgroup');
    }

    const totals = calculateUnifiedTotals(rows, monthA);

    // Sort: primary by clicked column, secondary by name+platform to maintain brand grouping
    const sorted = [...rows].sort((a, b) => {
      const aVal = (a as any)[sortConfig.key];
      const bVal = (b as any)[sortConfig.key];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;

      // Desempate: agrupar por nome (alfabeticamente), depois Meta antes de Google
      const nameCompare = a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
      if (nameCompare !== 0) return nameCompare;

      if (a.platform === 'meta' && b.platform === 'google') return -1;
      if (a.platform === 'google' && b.platform === 'meta') return 1;

      return 0;
    });

    return { rows: sorted, totals, month: monthA };
  }, [viewPlatformMode, selectedUnifiedMonth, comparisonUnifiedMonth, comparisonMode, availableMonths, groupBy, sortConfig]);

  // Function to reload static files
  const reloadStaticFiles = async () => {
    setIsUploading(true);
    setUploadProgress(50);

    try {
      const loaded = await loadStaticFiles();

      if (loaded.length) {
        // Merge with existing uploaded datasets (keep uploaded ones)
        setDatasets((prev) => {
          const uploaded = prev.filter((d) => d.meta.source === 'upload');
          return [...uploaded, ...loaded];
        });
      }

      setUploadProgress(100);
    } catch (err) {
      console.error('Error reloading static files:', err);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  // Initial Load
  useEffect(() => {
    const initializeData = async () => {
      const loaded = await loadStaticFiles();

      if (loaded.length) {
        setDatasets(loaded);

        // Group Google datasets by month
        const googleDatasets = loaded.filter((d) => d.meta.platform === 'google');
        const monthGroups = groupGoogleDatasetsByMonth(googleDatasets);
        setGoogleMonthGroups(monthGroups);

        // Auto-select most recent Google month
        const mostRecentGoogleGroup = getMostRecentGroup(monthGroups);
        if (mostRecentGoogleGroup) {
          setSelectedGoogleMonthA(mostRecentGoogleGroup.id);
        }

        const metaDefault = loaded.find((d) => d.meta.platform === 'meta');
        const googleDefault = loaded.find((d) => d.meta.platform === 'google');
        const chosenPlatform = metaDefault ? 'meta' : googleDefault ? 'google' : 'meta';
        setSelectedPlatform(chosenPlatform);

        // Seleciona sempre o mês mais recente da plataforma escolhida (para Meta)
        if (chosenPlatform === 'meta') {
          const platformDatasets = loaded.filter((d) => d.meta.platform === chosenPlatform);
          const mostRecent = getMostRecentDataset(platformDatasets) || getMostRecentDataset(loaded);
          setDatasetAId((mostRecent || loaded[0]).meta.id);
        }
      }

      // Load Columns from LocalStorage
      const savedColumns = localStorage.getItem('topstack_columns');
      if (savedColumns) {
        try {
          setColumns(JSON.parse(savedColumns));
        } catch (e) {
          console.error("Error parsing saved columns", e);
        }
      }
    };

    initializeData();
  }, []);

  // Save Columns to LocalStorage
  useEffect(() => {
    localStorage.setItem('topstack_columns', JSON.stringify(columns));
  }, [columns]);

  // Theme Handling Effect
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Handle Sort
  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const handleResetColumns = () => {
    setColumns(DEFAULT_COLUMNS);
    setIsColumnSelectorOpen(false);
  };

  // Handle filter changes with hierarchical cleanup
  const handleFilterChange = (newFilters: Filters) => {
    const rows = primaryDataset?.rows || [];

    // If accounts changed, validate and clear invalid child filters
    if (JSON.stringify(newFilters.accounts) !== JSON.stringify(filters.accounts)) {
      // Keep only campaigns that belong to selected accounts
      if (newFilters.accounts.length > 0) {
        const validCampaigns = Array.from(new Set(
          rows
            .filter((r: any) => newFilters.accounts.includes(r.accountName))
            .map((r: any) => r.campaignName)
            .filter(Boolean)
        ));
        newFilters.campaigns = newFilters.campaigns.filter(c => validCampaigns.includes(c));
      } else {
        newFilters.campaigns = [];
      }
      newFilters.adGroups = [];
      newFilters.creatives = [];
    }
    // If campaigns changed, validate and clear invalid child filters
    else if (JSON.stringify(newFilters.campaigns) !== JSON.stringify(filters.campaigns)) {
      // Keep only adGroups that belong to selected campaigns (and accounts if filtered)
      if (newFilters.campaigns.length > 0) {
        const accountFilter = newFilters.accounts.length > 0
          ? (r: any) => newFilters.accounts.includes(r.accountName)
          : () => true;
        const validAdGroups = Array.from(new Set(
          rows
            .filter((r: any) => accountFilter(r) && newFilters.campaigns.includes(r.campaignName))
            .map((r: any) => r.adGroupName)
            .filter(Boolean)
        ));
        newFilters.adGroups = newFilters.adGroups.filter(ag => validAdGroups.includes(ag));
      } else {
        newFilters.adGroups = [];
      }
      newFilters.creatives = [];
    }
    // If adGroups changed, validate and clear invalid creatives
    else if (JSON.stringify(newFilters.adGroups) !== JSON.stringify(filters.adGroups)) {
      // Keep only creatives that belong to selected adGroups (and parent filters if any)
      if (newFilters.adGroups.length > 0) {
        const accountFilter = newFilters.accounts.length > 0
          ? (r: any) => newFilters.accounts.includes(r.accountName)
          : () => true;
        const campaignFilter = newFilters.campaigns.length > 0
          ? (r: any) => newFilters.campaigns.includes(r.campaignName)
          : () => true;
        const validCreatives = Array.from(new Set(
          rows
            .filter((r: any) => accountFilter(r) && campaignFilter(r) && newFilters.adGroups.includes(r.adGroupName))
            .map((r: any) => r.creativeName)
            .filter(Boolean)
        ));
        newFilters.creatives = newFilters.creatives.filter(c => validCreatives.includes(c));
      } else {
        newFilters.creatives = [];
      }
    }

    setFilters(newFilters);
  };

  const handleUpload = async (platform: Platform, file: File) => {
    setIsUploading(true);
    setUploadProgress(15);

    try {
      let content: string;
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Handle Excel files
        setUploadProgress(50);
        content = await excelToCsv(file);
      } else {
        // Handle CSV files
        setUploadProgress(30);
        content = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsText(file);
        });
      }

      setUploadProgress(80);
      const parsed =
        platform === 'meta'
          ? parseMetaCsv(content, file.name, 'upload')
          : parseGoogleMultiAccountCsv(content, file.name, 'upload');

      setDatasets((prev) => {
        const newDatasets = [parsed, ...prev];

        // If Google, regenerate month groups
        if (platform === 'google') {
          const googleDatasets = newDatasets.filter((d) => d.meta.platform === 'google');
          const monthGroups = groupGoogleDatasetsByMonth(googleDatasets);
          setGoogleMonthGroups(monthGroups);

          // Select the group containing the new upload
          const newGroup = monthGroups.find(g =>
            g.datasets.some(d => d.meta.id === parsed.meta.id)
          );
          if (newGroup) {
            setSelectedGoogleMonthA(newGroup.id);
          }
        }

        return newDatasets;
      });

      setSelectedPlatform(platform);

      // Only set datasetAId for Meta platform
      if (platform === 'meta') {
        setDatasetAId(parsed.meta.id);
        setDatasetBId(null);
      }

      setUploadProgress(100);
    } catch (err) {
      console.error('Erro ao importar arquivo', err);
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 500);
    }
  };

  const availableDatasets = useMemo(
    () => {
      const filtered = datasets.filter((d) => d.meta.platform === selectedPlatform);
      // Ordena por mês em ordem decrescente (mais recente primeiro)
      return sortDatasetsByMonth(filtered);
    },
    [datasets, selectedPlatform]
  );

  // Seleção automática do dataset apenas quando não há seleção válida
  useEffect(() => {
    if (!availableDatasets.length) return;

    const mostRecent = getMostRecentDataset(availableDatasets);
    if (!mostRecent) return;

    // Se não há seleção, define o mais recente
    if (!datasetAId) {
      setDatasetAId(mostRecent.meta.id);
      setDatasetBId(null);
      return;
    }

    // Se a seleção atual não existe mais para a plataforma, volta para o mais recente
    const currentSelected = availableDatasets.find(d => d.meta.id === datasetAId);
    if (!currentSelected) {
      setDatasetAId(mostRecent.meta.id);
      setDatasetBId(null);
    }
  }, [availableDatasets, datasetAId]); // Executa quando datasets mudam ou quando não há seleção

  const primaryDataset = useMemo(
    () => {
      // For Google platform, create virtual dataset from selected month group
      if (selectedPlatform === 'google') {
        const selectedGroup = googleMonthGroups.find(g => g.id === selectedGoogleMonthA);
        if (!selectedGroup) return undefined;
        return createVirtualDatasetFromGroup(selectedGroup, selectedGoogleAccount);
      }

      // For Meta platform, use existing logic
      if (!datasetAId || availableDatasets.length === 0) return undefined;
      return availableDatasets.find((d) => d.meta.id === datasetAId) || availableDatasets[0];
    },
    [selectedPlatform, googleMonthGroups, selectedGoogleMonthA, selectedGoogleAccount, availableDatasets, datasetAId]
  );

  // Auto-adjust date range when GOOGLE month changes
  // Only runs when selectedGoogleMonthA changes, not when platform changes
  const prevGoogleMonthRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (selectedPlatform !== 'google') return;

    // Only update if the month actually changed
    if (prevGoogleMonthRef.current === selectedGoogleMonthA) return;
    prevGoogleMonthRef.current = selectedGoogleMonthA;

    const selectedGroup = googleMonthGroups.find(g => g.id === selectedGoogleMonthA);
    if (selectedGroup) {
      // Use actual data dates from spreadsheet instead of calendar month
      // This ensures complete weeks that span months are included
      const dataDateRange = getGoogleGroupDateRange(selectedGroup);
      if (dataDateRange) {
        setDateRange(dataDateRange);
      } else {
        // Fallback to calendar month if no dates found
        const MONTH_ORDER: Record<string, number> = {
          'jan': 1, 'fev': 2, 'mar': 3, 'abr': 4,
          'mai': 5, 'jun': 6, 'jul': 7, 'ago': 8,
          'set': 9, 'out': 10, 'nov': 11, 'dez': 12
        };
        const monthValue = MONTH_ORDER[selectedGroup.month] || 1;
        const monthRange = getMonthDateRange(selectedGroup.year, monthValue);
        setDateRange(monthRange);
      }
    }
  }, [selectedPlatform, selectedGoogleMonthA, googleMonthGroups]);

  // Auto-adjust date range when META dataset changes
  // Only runs when datasetAId changes for Meta, not when platform changes
  const prevMetaDatasetRef = React.useRef<string | null>(null);
  useEffect(() => {
    if (selectedPlatform !== 'meta') return;
    if (!datasetAId || !primaryDataset) return;

    // Only update if the dataset actually changed
    if (prevMetaDatasetRef.current === datasetAId) return;
    prevMetaDatasetRef.current = datasetAId;

    // Tenta obter mês e ano do dataset
    const monthYear = getDatasetMonthYear(primaryDataset);

    if (monthYear) {
      // Define o período para o mês completo do dataset (primeiro e último dia do mês)
      const monthRange = getMonthDateRange(monthYear.year, monthYear.month);
      setDateRange(monthRange);
    } else {
      // Se não conseguir detectar o mês, tenta inferir do primeiro dia dos dados
      if (primaryDataset.rows && primaryDataset.rows.length > 0) {
        const dates = primaryDataset.rows
          .map((r) => r.date)
          .filter((d): d is string => Boolean(d))
          .sort();

        if (dates.length > 0) {
          // Pega o primeiro dia e calcula o mês completo
          const firstDate = new Date(dates[0]);
          const year = firstDate.getFullYear();
          const month = firstDate.getMonth() + 1;
          const monthRange = getMonthDateRange(year, month);
          setDateRange(monthRange);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlatform, datasetAId, primaryDataset]);

  // Reset refs when platform changes to force date range recalculation
  // This ensures each platform recalculates its correct date range when switching back
  useEffect(() => {
    if (selectedPlatform === 'google') {
      // Switching to Google: reset Meta ref so Meta will recalculate next time
      prevMetaDatasetRef.current = null;
    } else if (selectedPlatform === 'meta') {
      // Switching to Meta: reset Google ref so Google will recalculate next time
      prevGoogleMonthRef.current = null;
    }
  }, [selectedPlatform]);

  const secondaryDataset = useMemo(
    () => {
      // For Google platform, create virtual dataset from selected month B group
      if (selectedPlatform === 'google') {
        if (!selectedGoogleMonthB) return undefined;
        const selectedGroup = googleMonthGroups.find(g => g.id === selectedGoogleMonthB);
        if (!selectedGroup) return undefined;
        return createVirtualDatasetFromGroup(selectedGroup, selectedGoogleAccount);
      }

      // For Meta platform, use existing logic
      return availableDatasets.find((d) => d.meta.id === datasetBId);
    },
    [selectedPlatform, googleMonthGroups, selectedGoogleMonthB, selectedGoogleAccount, availableDatasets, datasetBId]
  );

  // Available accounts for Google platform (from selected month group)
  const availableGoogleAccounts = useMemo(() => {
    const selectedGroup = googleMonthGroups.find(g => g.id === selectedGoogleMonthA);
    return selectedGroup?.accounts || [];
  }, [googleMonthGroups, selectedGoogleMonthA]);

  const filterOptions = useMemo(() => {
    const rows = primaryDataset?.rows || [];

    // Apply hierarchical filtering: filter rows based on parent filters
    let filteredRows = rows;

    // If accounts are filtered, only show rows from those accounts
    if (filters.accounts.length > 0) {
      filteredRows = filteredRows.filter((r: any) => filters.accounts.includes(r.accountName));
    }

    // If campaigns are filtered, only show rows from those campaigns
    if (filters.campaigns.length > 0) {
      filteredRows = filteredRows.filter((r: any) => filters.campaigns.includes(r.campaignName));
    }

    // If adGroups are filtered, only show rows from those adGroups
    if (filters.adGroups.length > 0) {
      filteredRows = filteredRows.filter((r: any) => filters.adGroups.includes(r.adGroupName));
    }

    // If creatives are filtered, only show rows from those creatives
    if (filters.creatives.length > 0) {
      filteredRows = filteredRows.filter((r: any) => filters.creatives.includes(r.creativeName));
    }

    // Now extract unique values hierarchically
    const grabUnique = (key: keyof typeof rows[0]) =>
      Array.from(new Set(filteredRows.map((r: any) => r[key]).filter(Boolean))) as string[];

    // For campaigns: only show campaigns from filtered accounts (if any)
    let availableCampaigns = grabUnique('campaignName');
    if (filters.accounts.length > 0) {
      const accountFiltered = rows.filter((r: any) => filters.accounts.includes(r.accountName));
      availableCampaigns = Array.from(new Set(accountFiltered.map((r: any) => r.campaignName).filter(Boolean))) as string[];
    }

    // For adGroups: only show adGroups from filtered campaigns (if any)
    let availableAdGroups = grabUnique('adGroupName');
    if (filters.campaigns.length > 0) {
      const campaignFiltered = rows.filter((r: any) => {
        const accountMatch = filters.accounts.length === 0 || filters.accounts.includes(r.accountName);
        const campaignMatch = filters.campaigns.includes(r.campaignName);
        return accountMatch && campaignMatch;
      });
      availableAdGroups = Array.from(new Set(campaignFiltered.map((r: any) => r.adGroupName).filter(Boolean))) as string[];
    } else if (filters.accounts.length > 0) {
      const accountFiltered = rows.filter((r: any) => filters.accounts.includes(r.accountName));
      availableAdGroups = Array.from(new Set(accountFiltered.map((r: any) => r.adGroupName).filter(Boolean))) as string[];
    }

    // For creatives: only show creatives from filtered adGroups (if any)
    let availableCreatives = grabUnique('creativeName');
    if (filters.adGroups.length > 0) {
      const adGroupFiltered = rows.filter((r: any) => {
        const accountMatch = filters.accounts.length === 0 || filters.accounts.includes(r.accountName);
        const campaignMatch = filters.campaigns.length === 0 || filters.campaigns.includes(r.campaignName);
        const adGroupMatch = filters.adGroups.includes(r.adGroupName);
        return accountMatch && campaignMatch && adGroupMatch;
      });
      availableCreatives = Array.from(new Set(adGroupFiltered.map((r: any) => r.creativeName).filter(Boolean))) as string[];
    } else if (filters.campaigns.length > 0) {
      const campaignFiltered = rows.filter((r: any) => {
        const accountMatch = filters.accounts.length === 0 || filters.accounts.includes(r.accountName);
        const campaignMatch = filters.campaigns.includes(r.campaignName);
        return accountMatch && campaignMatch;
      });
      availableCreatives = Array.from(new Set(campaignFiltered.map((r: any) => r.creativeName).filter(Boolean))) as string[];
    } else if (filters.accounts.length > 0) {
      const accountFiltered = rows.filter((r: any) => filters.accounts.includes(r.accountName));
      availableCreatives = Array.from(new Set(accountFiltered.map((r: any) => r.creativeName).filter(Boolean))) as string[];
    }

    return {
      accounts: grabUnique('accountName'),
      campaigns: availableCampaigns,
      adGroups: availableAdGroups,
      creatives: availableCreatives
    };
  }, [primaryDataset, filters]);

  // Process Data
  const { rows: processedData, totals, secondaryTotals, totalsDeltas } = useMemo(() => {
    const primaryRows = primaryDataset?.rows || [];
    const secondaryRows = secondaryDataset?.rows;

    const aggregation = aggregateWithComparison(
      primaryRows,
      secondaryRows,
      groupBy,
      dateRange,
      filters,
      mergeMode
    );

    const sorted = [...aggregation.rows].sort((a, b) => {
      if ((a as any)[sortConfig.key] < (b as any)[sortConfig.key])
        return sortConfig.direction === 'asc' ? -1 : 1;
      if ((a as any)[sortConfig.key] > (b as any)[sortConfig.key])
        return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return {
      rows: sorted,
      totals: aggregation.totals,
      secondaryTotals: aggregation.secondaryTotals,
      totalsDeltas: aggregation.totalsDeltas
    };
  }, [primaryDataset, secondaryDataset, groupBy, dateRange, filters, sortConfig, mergeMode]);

  // Calcula contagens de entidades únicas
  const { entityCounts, secondaryEntityCounts } = useMemo(() => {
    const primaryRows = primaryDataset?.rows || [];
    const secondaryRows = secondaryDataset?.rows || [];

    // Função auxiliar para filtrar e contar entidades únicas
    const countEntities = (rows: typeof primaryRows) => {
      // Aplica filtros de data
      const dateFiltered = rows.filter(row => {
        if (!dateRange.start && !dateRange.end) return true;
        if (dateRange.start && row.date < dateRange.start) return false;
        if (dateRange.end && row.date > dateRange.end) return false;
        return true;
      });

      // Aplica filtros hierárquicos
      let filtered = dateFiltered;
      if (filters.accounts.length > 0) {
        filtered = filtered.filter(r => filters.accounts.includes(r.accountName || ''));
      }
      if (filters.campaigns.length > 0) {
        filtered = filtered.filter(r => filters.campaigns.includes(r.campaignName || ''));
      }
      if (filters.adGroups.length > 0) {
        filtered = filtered.filter(r => filters.adGroups.includes(r.adGroupName || ''));
      }
      if (filters.creatives.length > 0) {
        filtered = filtered.filter(r => filters.creatives.includes(r.creativeName || ''));
      }

      // Conta entidades únicas
      const accounts = new Set(filtered.map(r => r.accountName).filter(Boolean));
      const campaigns = new Set(filtered.map(r => r.campaignName).filter(Boolean));
      const adGroups = new Set(filtered.map(r => r.adGroupName).filter(Boolean));
      const creatives = new Set(filtered.map(r => r.creativeName).filter(Boolean));

      return {
        accounts: accounts.size,
        campaigns: campaigns.size,
        adGroups: adGroups.size,
        creatives: creatives.size
      };
    };

    const primaryCounts = countEntities(primaryRows);

    // Para o dataset secundário, não aplica filtro de data quando em modo de comparação
    let secondaryCounts;
    if (secondaryRows && secondaryRows.length > 0) {
      if (mergeMode) {
        // Em modo de mesclagem, aplica os mesmos filtros
        secondaryCounts = countEntities(secondaryRows);
      } else {
        // Em modo de comparação, não aplica filtro de data
        let filtered = secondaryRows;
        if (filters.accounts.length > 0) {
          filtered = filtered.filter(r => filters.accounts.includes(r.accountName || ''));
        }
        if (filters.campaigns.length > 0) {
          filtered = filtered.filter(r => filters.campaigns.includes(r.campaignName || ''));
        }
        if (filters.adGroups.length > 0) {
          filtered = filtered.filter(r => filters.adGroups.includes(r.adGroupName || ''));
        }
        if (filters.creatives.length > 0) {
          filtered = filtered.filter(r => filters.creatives.includes(r.creativeName || ''));
        }

        const accounts = new Set(filtered.map(r => r.accountName).filter(Boolean));
        const campaigns = new Set(filtered.map(r => r.campaignName).filter(Boolean));
        const adGroups = new Set(filtered.map(r => r.adGroupName).filter(Boolean));
        const creatives = new Set(filtered.map(r => r.creativeName).filter(Boolean));

        secondaryCounts = {
          accounts: accounts.size,
          campaigns: campaigns.size,
          adGroups: adGroups.size,
          creatives: creatives.size
        };
      }
    }

    return {
      entityCounts: primaryCounts,
      secondaryEntityCounts: secondaryCounts
    };
  }, [primaryDataset, secondaryDataset, dateRange, filters, mergeMode]);

  const cpa = totals.cpa;

  const currentChartLabel = chartTypes.find(c => c.id === chartType)?.label || 'Gráfico';
  const CurrentChartIcon = chartTypes.find(c => c.id === chartType)?.icon || BarChart2;
  const comparisonEnabled = Boolean(secondaryDataset);

  // Função auxiliar para formatar data no formato pt-BR (DD/MM/YYYY)
  const formatDatePtBr = (dateStr: string): string => {
    const [y, m, d] = dateStr.split('-').map(Number);
    return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y}`;
  };

  // Calcula o texto do período baseado nos datasets - sempre mostra mês completo
  const periodText = useMemo(() => {
    if (comparisonEnabled && primaryDataset && secondaryDataset) {
      // Modo comparação: mostra os meses completos dos dois datasets
      const monthYearA = getDatasetMonthYear(primaryDataset);
      const monthYearB = getDatasetMonthYear(secondaryDataset);

      if (monthYearA && monthYearB) {
        const rangeA = getMonthDateRange(monthYearA.year, monthYearA.month);
        const rangeB = getMonthDateRange(monthYearB.year, monthYearB.month);

        const startA = formatDatePtBr(rangeA.start);
        const endA = formatDatePtBr(rangeA.end);
        const startB = formatDatePtBr(rangeB.start);
        const endB = formatDatePtBr(rangeB.end);

        return `${startA} - ${endA} vs ${startB} - ${endB}`;
      }
    }

    if (viewPlatformMode === 'unified' && selectedUnifiedMonth) {
      const monthA = availableMonths.find(m => m.id === selectedUnifiedMonth);

      if (monthA) {
        const rangeA = getMonthDateRange(monthA.year, monthA.month);
        const startA = formatDatePtBr(rangeA.start);
        const endA = formatDatePtBr(rangeA.end);

        if (comparisonMode === 'compare' && comparisonUnifiedMonth) {
          const monthB = availableMonths.find(m => m.id === comparisonUnifiedMonth);
          if (monthB) {
            const rangeB = getMonthDateRange(monthB.year, monthB.month);
            const startB = formatDatePtBr(rangeB.start);
            const endB = formatDatePtBr(rangeB.end);
            return `${startA} - ${endA} vs ${startB} - ${endB}`;
          }
        }
        return `${startA} - ${endA}`;
      }
    }

    // Modo normal: mostra o mês completo do dataset selecionado
    if (primaryDataset) {
      const monthYear = getDatasetMonthYear(primaryDataset);
      if (monthYear) {
        const range = getMonthDateRange(monthYear.year, monthYear.month);
        const start = formatDatePtBr(range.start);
        const end = formatDatePtBr(range.end);
        return `${start} - ${end}`;
      }
    }

    // Fallback: calcula mês completo do dateRange atual
    if (dateRange.start && dateRange.end) {
      const [year, month] = dateRange.start.split('-').map(Number);
      const monthRange = getMonthDateRange(year, month);
      const start = formatDatePtBr(monthRange.start);
      const end = formatDatePtBr(monthRange.end);
      return `${start} - ${end}`;
    }

    return '';
  }, [comparisonEnabled, primaryDataset, secondaryDataset, dateRange, viewPlatformMode, selectedUnifiedMonth, comparisonUnifiedMonth, comparisonMode, availableMonths]);

  if (isAuthLoading) {
    return <LoadingState message="Verificando autenticação..." />;
  }

  if (!session) {
    return <Login onLoginSuccess={() => { }} initialError={authError} />;
  }

  if (session && !isAuthorized) {
    return <AccessDenied onSignOut={() => supabase.auth.signOut()} userEmail={session.user.email} />;
  }

  return (
    <div className={`flex h-screen overflow-hidden font-sans bg-gray-50 dark:bg-dark text-gray-900 dark:text-gray-100 ${isDarkMode ? 'dark' : ''}`}>

      {/* Main Content Area (Left) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Relatórios</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {viewPlatformMode === 'unified' ? 'Visão unificada de performance' : `Performance ${selectedPlatform === 'google' ? 'Google Ads' : 'Meta Ads'}`} ({periodText})
              </p>
            </div>

            <div className="flex gap-4">
              {/* Platform Mode Toggle */}
              <div className="flex bg-white dark:bg-darkCard rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setViewPlatformMode('unified')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${viewPlatformMode === 'unified' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  Todas
                </button>
                <button
                  onClick={() => { setViewPlatformMode('single'); setSelectedPlatform('google'); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${viewPlatformMode === 'single' && selectedPlatform === 'google' ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  Google
                </button>
                <button
                  onClick={() => { setViewPlatformMode('single'); setSelectedPlatform('meta'); }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${viewPlatformMode === 'single' && selectedPlatform === 'meta' ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  Meta
                </button>
              </div>

              {/* View Mode Toggle */}
              <div className="flex bg-white dark:bg-darkCard rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setViewMode('list')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  <List size={16} />
                  Lista
                </button>
                <button
                  onClick={() => setViewMode('chart')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${viewMode === 'chart' ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                >
                  <BarChart2 size={16} />
                  Gráfico
                </button>
              </div>

              {/* Chart Type Selector (Only visible in Chart Mode) */}
              {viewMode === 'chart' && (
                <div className="relative">
                  <button
                    onClick={() => setIsChartSelectorOpen(!isChartSelectorOpen)}
                    className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-darkCard border border-gray-200 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
                  >
                    <CurrentChartIcon size={16} className="text-primary" />
                    {currentChartLabel}
                    <ChevronDown size={14} className="text-gray-400" />
                  </button>

                  {isChartSelectorOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setIsChartSelectorOpen(false)}></div>
                      <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-darkCard rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-1 z-30 animate-in fade-in zoom-in-95 duration-200">
                        {chartTypes.map((type) => (
                          <button
                            key={type.id}
                            onClick={() => {
                              setChartType(type.id);
                              setIsChartSelectorOpen(false);
                            }}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                                ${chartType === type.id
                                ? 'bg-blue-50 dark:bg-blue-900/20 text-primary font-medium'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }
                              `}
                          >
                            <type.icon size={16} />
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* KPI Cards */}
          <StatsCards
            totalSpend={viewPlatformMode === 'unified' && unifiedData ? unifiedData.totals.spend : totals.spend}
            totalConversions={viewPlatformMode === 'unified' && unifiedData ? unifiedData.totals.conversions : totals.conversions}
            cpa={viewPlatformMode === 'unified' && unifiedData ? unifiedData.totals.cpa : cpa}
            totalClicks={viewPlatformMode === 'unified' && unifiedData ? unifiedData.totals.clicks : totals.clicks}
            comparisonEnabled={viewPlatformMode === 'unified' ? (comparisonMode === 'compare' && Boolean(comparisonUnifiedMonth)) : comparisonEnabled}
            secondaryTotals={viewPlatformMode === 'unified' && unifiedData ? (unifiedData.totals.secondaryTotals as any) : secondaryTotals}
            totalsDeltas={viewPlatformMode === 'unified' && unifiedData && unifiedData.totals.secondaryTotals ? {
              spend: unifiedData.totals.spend - unifiedData.totals.secondaryTotals.spend,
              conversions: unifiedData.totals.conversions - unifiedData.totals.secondaryTotals.conversions,
              clicks: unifiedData.totals.clicks - unifiedData.totals.secondaryTotals.clicks,
              impressions: unifiedData.totals.impressions - unifiedData.totals.secondaryTotals.impressions,
              cpa: unifiedData.totals.cpa - (unifiedData.totals.secondaryTotals.cpa || 0),
              roas: 0,
              revenue: 0
            } : totalsDeltas}
            entityCounts={viewPlatformMode === 'unified' && unifiedData ? {
              accounts: unifiedData.totals.accountCount,
              campaigns: unifiedData.totals.campaignCount,
              adGroups: unifiedData.totals.adGroupCount,
              creatives: unifiedData.totals.creativeCount
            } : entityCounts}
            secondaryEntityCounts={viewPlatformMode === 'unified' ? undefined : secondaryEntityCounts}
          />

          {/* Content Header (Sub-title) */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4 relative z-40">
            {viewMode === 'list' && (
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                Performance por {
                  {
                    'account': 'Conta',
                    'campaign': 'Campanha',
                    'adgroup': 'Conjunto de Anúncios',
                    'creative': 'Criativo',
                    'date': 'Data'
                  }[groupBy] || groupBy
                }
              </h2>
            )}

            <div className="flex gap-2 relative ml-auto">
              {viewMode === 'list' && (
                <>
                  <button
                    onClick={() => setIsWeeklyView(!isWeeklyView)}
                    className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium transition-all ${isWeeklyView ? 'bg-blue-50 text-primary border-primary dark:bg-primary/20 dark:text-blue-300' : 'bg-white dark:bg-darkCard border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                  >
                    <LayoutTemplate size={14} />
                    Visualização Detalhada
                  </button>

                  {/* Granularity toggle - only for Meta platform */}
                  {isWeeklyView && selectedPlatform === 'meta' && (
                    <div className="flex items-center border rounded-lg overflow-hidden">
                      <button
                        onClick={() => setBreakdownGranularity('weekly')}
                        className={`px-3 py-1.5 text-sm font-medium transition-all ${breakdownGranularity === 'weekly' ? 'bg-blue-50 text-primary dark:bg-primary/20 dark:text-blue-300' : 'bg-white dark:bg-darkCard text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        Semanal
                      </button>
                      <button
                        onClick={() => setBreakdownGranularity('daily')}
                        className={`px-3 py-1.5 text-sm font-medium transition-all border-l border-gray-200 dark:border-gray-700 ${breakdownGranularity === 'daily' ? 'bg-blue-50 text-primary dark:bg-primary/20 dark:text-blue-300' : 'bg-white dark:bg-darkCard text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                      >
                        Diária
                      </button>
                    </div>
                  )}

                  <div className="relative">
                    <button
                      onClick={() => setIsColumnSelectorOpen(!isColumnSelectorOpen)}
                      className={`flex items-center gap-2 px-3 py-1.5 border rounded-lg text-sm font-medium transition-all ${isColumnSelectorOpen ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600' : 'bg-white dark:bg-darkCard border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    >
                      <Columns size={14} />
                      Colunas
                    </button>

                    {isColumnSelectorOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setIsColumnSelectorOpen(false)}></div>
                        <ColumnSelector
                          columns={columns}
                          setColumns={setColumns}
                          onClose={() => setIsColumnSelectorOpen(false)}
                          onReset={handleResetColumns}
                        />
                      </>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Dynamic Content */}
          <div className="min-h-[400px]">
            {viewPlatformMode === 'unified' ? (
              // Unified mode: show combined Google + Meta data
              !unifiedData || unifiedData.rows.length === 0 ? (
                <LoadingState
                  isLoading={!unifiedData}
                  message={!unifiedData ? "Selecione um mês para visualizar" : "Nenhum dado encontrado para o mês selecionado"}
                />
              ) : viewMode === 'list' ? (
                <DataTable
                  data={unifiedData.rows}
                  groupBy={groupBy}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  isWeeklyView={isWeeklyView}
                  breakdownGranularity="weekly"
                  platform="meta"
                  columns={columns}
                  comparisonEnabled={comparisonMode === 'compare' && Boolean(comparisonUnifiedMonth)}
                />
              ) : (
                <DataChart
                  data={unifiedData.rows}
                  chartType={chartType}
                  comparisonEnabled={comparisonMode === 'compare' && Boolean(comparisonUnifiedMonth)}
                />
              )
            ) : (
              // Single platform mode
              !primaryDataset || isLoadingDataset ? (
                <LoadingState
                  isLoading={true}
                  message={!primaryDataset ? "Selecione uma planilha para começar" : "Carregando planilha..."}
                />
              ) : processedData.length === 0 ? (
                <LoadingState
                  isLoading={false}
                  message="Nenhum dado encontrado para os filtros selecionados"
                />
              ) : viewMode === 'list' ? (
                <DataTable
                  data={processedData}
                  groupBy={groupBy}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  isWeeklyView={isWeeklyView}
                  breakdownGranularity={breakdownGranularity}
                  platform={selectedPlatform}
                  columns={columns}
                  comparisonEnabled={comparisonEnabled}
                />
              ) : (
                <DataChart data={processedData} chartType={chartType} comparisonEnabled={comparisonEnabled} />
              )
            )}
          </div>
        </div>

      </main>

      {/* Sidebar (Right) - Conditional based on view mode */}
      {viewPlatformMode === 'unified' ? (
        <SidebarUnified
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          onUpload={handleUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          availableMonths={availableMonths}
          selectedMonthId={selectedUnifiedMonth}
          comparisonMonthId={comparisonUnifiedMonth}
          onSelectMonth={setSelectedUnifiedMonth}
          onSelectComparisonMonth={setComparisonUnifiedMonth}
          onReloadStaticFiles={reloadStaticFiles}
          comparisonMode={comparisonMode}
          setComparisonMode={setComparisonMode}
        />
      ) : selectedPlatform === 'google' ? (
        <SidebarGoogle
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          onUpload={handleUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          selectedPlatform={selectedPlatform}
          onPlatformChange={setSelectedPlatform}
          dateRange={dateRange}
          setDateRange={setDateRange}
          mergeMode={mergeMode}
          onToggleMerge={() => setMergeMode(!mergeMode)}
          monthGroups={googleMonthGroups}
          selectedMonthA={selectedGoogleMonthA}
          selectedMonthB={selectedGoogleMonthB}
          onSelectMonthA={(id) => {
            setIsLoadingDataset(true);
            setSelectedGoogleMonthA(id);
            setTimeout(() => setIsLoadingDataset(false), 800);
          }}
          onSelectMonthB={(id) => {
            setIsLoadingDataset(true);
            setSelectedGoogleMonthB(id);
            // Disable merge mode to enable comparison view
            if (id !== null) {
              setMergeMode(false);
            }
            setTimeout(() => setIsLoadingDataset(false), 800);
          }}
          selectedAccount={selectedGoogleAccount}
          onSelectAccount={setSelectedGoogleAccount}
          availableAccounts={availableGoogleAccounts}
          filters={filters}
          onChangeFilters={handleFilterChange}
          filterOptions={filterOptions}
          onReloadStaticFiles={reloadStaticFiles}
          isLoadingDataset={isLoadingDataset}
        />
      ) : (
        <Sidebar
          isDarkMode={isDarkMode}
          toggleTheme={() => setIsDarkMode(!isDarkMode)}
          dateRange={dateRange}
          setDateRange={setDateRange}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          onUpload={handleUpload}
          isUploading={isUploading}
          uploadProgress={uploadProgress}
          selectedPlatform={selectedPlatform}
          onPlatformChange={setSelectedPlatform}
          datasets={availableDatasets}
          datasetAId={datasetAId}
          datasetBId={datasetBId}
          onSelectDatasetA={(id) => {
            setIsLoadingDataset(true);
            setDatasetAId(id);
            setTimeout(() => setIsLoadingDataset(false), 800);
          }}
          onSelectDatasetB={(id) => {
            setIsLoadingDataset(true);
            setDatasetBId(id);
            if (id !== null) {
              setMergeMode(false);
            }
            setTimeout(() => setIsLoadingDataset(false), 800);
          }}
          isLoadingDataset={isLoadingDataset}
          mergeMode={mergeMode}
          onToggleMerge={() => setMergeMode(!mergeMode)}
          filters={filters}
          onChangeFilters={handleFilterChange}
          filterOptions={filterOptions}
          onReloadStaticFiles={reloadStaticFiles}
        />
      )}

    </div>
  );
};

export default App;