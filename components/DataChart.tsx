import React from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Radar, RadarChart, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { MousePointer2, Waves, BarChart3, PieChart as PieIcon, LineChart as LineIcon, Hexagon } from 'lucide-react';
import { ChartType } from '../types';

interface DataChartProps {
  data: any[];
  chartType: ChartType;
  comparisonEnabled?: boolean;
}

const chartLabels: Record<ChartType, string> = {
  area: 'Ondas',
  bar: 'Barras',
  pie: 'Pizza',
  line: 'Linhas',
  radar: 'Radial'
};

const COLORS = ['#0ea5e9', '#22c55e', '#eab308', '#f97316', '#ef4444', '#8b5cf6'];

// Platform Icons for Chart
const MetaCircle = ({ x, y, size = 14 }: { x: number, y: number, size?: number }) => (
  <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="12" fill="#1877F2" />
    <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z" fill="white" transform="scale(0.6) translate(8, 8)" />
  </svg>
);

const GoogleCircle = ({ x, y, size = 14 }: { x: number, y: number, size?: number }) => (
  <svg x={x} y={y} width={size} height={size} viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="12" fill="white" stroke="#e2e8f0" strokeWidth="1" />
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" transform="scale(0.7) translate(5, 5)" />
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" transform="scale(0.7) translate(5, 5)" />
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" transform="scale(0.7) translate(5, 5)" />
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" transform="scale(0.7) translate(5, 5)" />
  </svg>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataItem = payload[0].payload;
    const isPieOrRadar = !label && dataItem && (typeof dataItem.spend === 'number' || typeof dataItem.conversions === 'number');

    if (isPieOrRadar) {
      return (
        <div className="bg-white dark:bg-darkCard p-3 border border-gray-100 dark:border-gray-700 shadow-xl rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            {dataItem.platform === 'meta' ? <MetaCircle x={0} y={0} /> : <GoogleCircle x={0} y={0} />}
            <p className="text-sm font-bold text-gray-900 dark:text-white">{dataItem.name}</p>
          </div>

          <div className="flex items-center gap-2 text-xs mb-1">
            <div className="w-2 h-2 rounded-full bg-[#3b82f6]" />
            <span className="text-gray-500 dark:text-gray-400">Investimento:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(dataItem.spend)}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs mb-1">
            <div className="w-2 h-2 rounded-full bg-[#10b981]" />
            <span className="text-gray-500 dark:text-gray-400">Conversões:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {new Intl.NumberFormat('pt-BR').format(dataItem.conversions || 0)}
            </span>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white dark:bg-darkCard p-3 border border-gray-100 dark:border-gray-700 shadow-xl rounded-xl">
        <div className="flex items-center gap-2 mb-2">
          {dataItem.platform === 'meta' ? <MetaCircle x={0} y={0} /> : <GoogleCircle x={0} y={0} />}
          <p className="text-sm font-bold text-gray-900 dark:text-white">{label}</p>
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-xs mb-1">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color || entry.fill }}
            />
            <span className="text-gray-500 dark:text-gray-400 capitalize">{entry.name}:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {entry.name === 'ROAS'
                ? `${Number(entry.value || 0).toFixed(2)}x`
                : entry.name === 'Conversões' || entry.name === 'Conversões (B)'
                  ? new Intl.NumberFormat('pt-BR').format(entry.value || 0)
                  : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entry.value || 0)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Custom Tick Component for X-Axis with platform icon
const CustomXAxisTick = (props: any) => {
  const { x, y, payload, index, data } = props;
  const item = data && data[index] ? data[index] : null;
  const platform = item?.platform;

  const maxLength = 18;
  const fullText = payload.value;
  const displayText = fullText.length > maxLength ? `${fullText.substring(0, maxLength)}...` : fullText;

  return (
    <g transform={`translate(${x},${y})`}>
      {platform === 'meta' ? (
        <MetaCircle x={-displayText.length * 4 - 22} y={15} size={14} />
      ) : platform === 'google' ? (
        <GoogleCircle x={-displayText.length * 4 - 22} y={15} size={14} />
      ) : null}

      <text
        x={0}
        y={0}
        dy={16}
        textAnchor="end"
        fill="#64748b"
        transform="rotate(-25)"
        fontSize={11}
        className="cursor-pointer hover:font-semibold transition-all"
      >
        <title>{fullText}</title>
        {displayText}
      </text>
    </g>
  );
};

const DataChart: React.FC<DataChartProps> = ({ data, chartType, comparisonEnabled = false }) => {

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[500px] bg-white dark:bg-darkCard rounded-xl border border-gray-200 dark:border-gray-700">
        <p className="text-gray-400">Sem dados para exibir no gráfico.</p>
      </div>
    )
  }

  // Prepara dados para gráficos com comparação
  const chartData = data.map(item => ({
    ...item,
    conversionsB: comparisonEnabled ? (item.conversionsB ?? item.breakdown?.secondary?.conversions) : undefined,
    spendB: comparisonEnabled ? (item.spendB ?? item.breakdown?.secondary?.spend) : undefined
  }));

  const renderChart = () => {
    // Common props for Cartesian charts
    const commonProps = {
      data: chartData,
      // Added left/right margins to prevent clipping of the first/last label
      margin: { top: 20, right: 30, left: 30, bottom: 20 }
    };

    const AxisProps = {
      dataKey: "name",
      tickLine: false,
      axisLine: { stroke: '#e2e8f0' },
      height: 60,
      interval: 0,
      padding: { left: 20, right: 20 },
      tick: <CustomXAxisTick data={chartData} />
    };

    switch (chartType) {
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <defs>
              <linearGradient id="colorConversions" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-gray-800" />
            <XAxis {...AxisProps} />
            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `R$${val}`} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Area type="monotone" dataKey="conversions" name="Conversões" stroke="#10b981" fillOpacity={1} fill="url(#colorConversions)" strokeWidth={2} />
            <Area type="monotone" dataKey="spend" name="Investimento" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSpend)" strokeWidth={2} />
            {comparisonEnabled && (
              <>
                <Area type="monotone" dataKey="conversionsB" name="Conversões (B)" stroke="#10b981" strokeDasharray="5 5" strokeWidth={2} fillOpacity={0} />
                <Area type="monotone" dataKey="spendB" name="Investimento (B)" stroke="#3b82f6" strokeDasharray="5 5" strokeWidth={2} fillOpacity={0} />
              </>
            )}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-gray-800" />
            <XAxis {...AxisProps} />
            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `R$${val}`} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'transparent' }} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Bar dataKey="spend" name="Investimento" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={50} />
            <Bar dataKey="conversions" name="Conversões" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
            {comparisonEnabled && (
              <>
                <Bar dataKey="spendB" name="Investimento (B)" fill="#3b82f6" fillOpacity={0.5} radius={[4, 4, 0, 0]} maxBarSize={50} />
                <Bar dataKey="conversionsB" name="Conversões (B)" fill="#10b981" fillOpacity={0.5} radius={[4, 4, 0, 0]} maxBarSize={50} />
              </>
            )}
          </BarChart>
        );

      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" className="dark:stroke-gray-800" />
            <XAxis {...AxisProps} />
            <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={(val) => `R$${val}`} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: '20px' }} />
            <Line type="monotone" dataKey="conversions" name="Conversões" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="spend" name="Investimento" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
            {comparisonEnabled && (
              <>
                <Line type="monotone" dataKey="conversionsB" name="Conversões (B)" stroke="#10b981" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="spendB" name="Investimento (B)" stroke="#3b82f6" strokeDasharray="5 5" strokeWidth={2} dot={{ r: 3 }} />
              </>
            )}
          </LineChart>
        );

      case 'pie':
        const pieData = chartData.filter(d => d.spend > 0).slice(0, 10);
        return (
          <PieChart>
            <Tooltip content={<CustomTooltip />} />
            <Legend layout="vertical" verticalAlign="middle" align="right" />

            {/* Inner Ring: Conversions */}
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="conversions"
              nameKey="name"
              stroke="none"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-inner-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.6} />
              ))}
            </Pie>

            {/* Outer Ring: Spend */}
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={95}
              outerRadius={130}
              paddingAngle={2}
              dataKey="spend"
              nameKey="name"
              stroke="none"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-outer-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
          </PieChart>
        );

      case 'radar':
        return (
          <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData.slice(0, 12)}>
            <PolarGrid stroke="#e2e8f0" className="dark:stroke-gray-700" />
            <PolarAngleAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <PolarRadiusAxis angle={30} domain={[0, 'auto']} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <Radar name="Investimento" dataKey="spend" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
            <Radar name="Conversões" dataKey="conversions" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
            {comparisonEnabled && (
              <>
                <Radar name="Investimento (B)" dataKey="spendB" stroke="#3b82f6" strokeDasharray="5 5" fillOpacity={0} />
                <Radar name="Conversões (B)" dataKey="conversionsB" stroke="#10b981" strokeDasharray="5 5" fillOpacity={0} />
              </>
            )}
            <Legend />
            <Tooltip content={<CustomTooltip />} />
          </RadarChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-darkCard p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm h-[600px] flex flex-col relative">

      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">
            ANÁLISE VISUAL • {chartLabels[chartType].toUpperCase()}
          </h3>
          <div className="flex items-center gap-2 text-primary text-xs">
            <MousePointer2 size={12} />
            <span>Role horizontalmente para ver mais</span>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 w-full min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          {renderChart() || <div />}
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DataChart;