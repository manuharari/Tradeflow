
import React, { useState, useEffect } from 'react';
import { HistoricalDataPoint } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line, AreaChart, Area, ComposedChart } from 'recharts';
import { Calendar, Sparkles, Loader2, Filter, TrendingUp, DollarSign, Factory, Ship } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { analyzeHistoricalTrend } from '../services/geminiService';

// --- MOCK DATA GENERATOR (5 Years) ---
// Simulates a growing company with seasonality and supply chain lag
const generateHistoricalData = (): HistoricalDataPoint[] => {
    const years = [2020, 2021, 2022, 2023, 2024];
    const data: HistoricalDataPoint[] = [];
    
    let baseRevenue = 15000;
    
    years.forEach((year, yIdx) => {
        // Year over year growth (approx 15-20%)
        baseRevenue = baseRevenue * 1.15; 

        for (let m = 1; m <= 12; m++) {
            // Seasonality Factor (High in Summer/Dec, Low in Jan/Feb)
            let seasonality = 1.0;
            if (m === 11 || m === 12) seasonality = 1.4; // Xmas
            if (m === 6 || m === 7) seasonality = 1.2; // Summer
            if (m === 1 || m === 2) seasonality = 0.8; // Post-holiday slump

            // Random variation
            const randomVar = 0.9 + Math.random() * 0.2; // +/- 10%

            const revenue = Math.round(baseRevenue * seasonality * randomVar);
            const cost = Math.round(revenue * (0.65 + (Math.random() * 0.05))); 
            const profit = revenue - cost;
            const unitsSold = Math.round(revenue / 25); // Avg price $25

            // Supply Chain Logic:
            // Manufacturing happens 1 month before sale
            // Importing happens 3 months before sale
            // We simulate this by checking future sales (heuristic based on seasonality of current month + 1 or +3)
            
            // Heuristic for supply needs:
            let nextMonthSeasonality = m === 12 ? 0.8 : (m+1 === 11 || m+1 === 12 ? 1.4 : 1.0);
            let futureMonthSeasonality = (m+3) > 12 ? 1.0 : ((m+3) === 11 || (m+3) === 12 ? 1.4 : 1.0);

            // 60% of stock is Manufactured, 40% Imported
            const unitsManufactured = Math.round(unitsSold * nextMonthSeasonality * 0.6); 
            const unitsImported = Math.round(unitsSold * futureMonthSeasonality * 0.4);

            data.push({
                year,
                month: m,
                revenue,
                cost,
                profit,
                unitsSold,
                unitsManufactured,
                unitsImported
            });
        }
    });
    return data;
};

const historicalData = generateHistoricalData();

export const History: React.FC = () => {
    const [selectedYear, setSelectedYear] = useState<number | 'ALL'>('ALL');
    const [viewType, setViewType] = useState<'REVENUE' | 'PROFIT' | 'SUPPLY'>('REVENUE');
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Filter Data
    const filteredData = selectedYear === 'ALL' 
        ? historicalData 
        : historicalData.filter(d => d.year === selectedYear);

    // Prepare data for chart (Add readable labels)
    const chartData = filteredData.map(d => ({
        ...d,
        label: selectedYear === 'ALL' ? `${d.month}/${d.year.toString().substr(2)}` : `${d.month}`,
        fullLabel: `${d.month}/${d.year}`
    }));

    const handleRunAnalysis = async () => {
        setIsAnalyzing(true);
        const result = await analyzeHistoricalTrend(historicalData); // Send ALL data
        setAiAnalysis(result);
        setIsAnalyzing(false);
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-700 rounded shadow-lg text-xs">
                    <p className="font-bold text-gray-900 dark:text-white mb-2">{label}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color }}>
                            {entry.name}: {viewType === 'REVENUE' || viewType === 'PROFIT' ? '$' : ''}{entry.value.toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-indigo-600" /> Histórico (2020-2024)
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Análisis financiero y de cadena de suministro (Híbrido).
                    </p>
                </div>
                
                <div className="flex bg-white dark:bg-gray-800 rounded-lg p-1 shadow-sm border border-gray-200 dark:border-gray-700">
                    <select 
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                        className="bg-transparent text-sm font-medium text-gray-700 dark:text-gray-300 outline-none px-2 py-1"
                    >
                        <option value="ALL">Todo el Historial</option>
                        <option value="2024">2024</option>
                        <option value="2023">2023</option>
                        <option value="2022">2022</option>
                        <option value="2021">2021</option>
                        <option value="2020">2020</option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart Area */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex gap-2 flex-wrap">
                            <button 
                                onClick={() => setViewType('REVENUE')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewType === 'REVENUE' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                Ingresos vs Costos
                            </button>
                            <button 
                                onClick={() => setViewType('PROFIT')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewType === 'PROFIT' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                Beneficio Neto
                            </button>
                            <button 
                                onClick={() => setViewType('SUPPLY')}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${viewType === 'SUPPLY' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                            >
                                Producción vs Ventas
                            </button>
                        </div>
                    </div>

                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            {viewType === 'REVENUE' ? (
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                        </linearGradient>
                                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                                    <XAxis dataKey="label" fontSize={10} tickMargin={10} stroke="#9ca3af" />
                                    <YAxis fontSize={10} stroke="#9ca3af" tickFormatter={(value) => `$${value/1000}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Area type="monotone" dataKey="revenue" name="Ingresos" stroke="#6366f1" fillOpacity={1} fill="url(#colorRev)" />
                                    <Area type="monotone" dataKey="cost" name="Costos" stroke="#ef4444" fillOpacity={1} fill="url(#colorCost)" />
                                </AreaChart>
                            ) : viewType === 'PROFIT' ? (
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                                    <XAxis dataKey="label" fontSize={10} tickMargin={10} stroke="#9ca3af" />
                                    <YAxis fontSize={10} stroke="#9ca3af" tickFormatter={(value) => `$${value/1000}k`} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Bar dataKey="profit" name="Beneficio" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            ) : (
                                <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#374151" opacity={0.1} />
                                    <XAxis dataKey="label" fontSize={10} tickMargin={10} stroke="#9ca3af" />
                                    <YAxis fontSize={10} stroke="#9ca3af" />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                    <Bar dataKey="unitsManufactured" name="Producido (Local)" stackId="a" fill="#f97316" radius={[0, 0, 0, 0]} />
                                    <Bar dataKey="unitsImported" name="Importado" stackId="a" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Line type="monotone" dataKey="unitsSold" name="Ventas Reales" stroke="#10b981" strokeWidth={3} dot={false} />
                                </ComposedChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* AI Insight Sidebar */}
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 p-6 rounded-xl shadow-sm border border-indigo-100 dark:border-gray-700 flex flex-col h-full">
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-indigo-900 dark:text-white flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-600" /> Planificador IA
                        </h3>
                        <p className="text-xs text-indigo-700 dark:text-gray-400 mt-1">
                            Detecta patrones estacionales y tiempos de envío (Lead Times) para optimizar producción.
                        </p>
                    </div>

                    <div className="flex-1 overflow-y-auto min-h-[200px] mb-4 bg-white/50 dark:bg-gray-900/30 rounded-lg p-4 text-sm text-gray-700 dark:text-gray-300 border border-indigo-100 dark:border-gray-700">
                        {aiAnalysis ? (
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 opacity-60">
                                <Factory className="w-12 h-12 mb-2" />
                                <p>Analizar 5 años de Manufactura vs Ventas.</p>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={handleRunAnalysis}
                        disabled={isAnalyzing}
                        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                        {isAnalyzing ? 'Predecir Demanda' : 'Generar Plan Producción'}
                    </button>
                </div>
            </div>

            {/* Key Metrics Summary (Bottom) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Ingresos (5 Años)</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                        ${historicalData.reduce((acc, curr) => acc + curr.revenue, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Beneficio</p>
                    <p className="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                        ${historicalData.reduce((acc, curr) => acc + curr.profit, 0).toLocaleString()}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Producido (Local)</p>
                    <p className="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                        {historicalData.reduce((acc, curr) => acc + curr.unitsManufactured, 0).toLocaleString()} u
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Total Importado</p>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                        {historicalData.reduce((acc, curr) => acc + curr.unitsImported, 0).toLocaleString()} u
                    </p>
                </div>
            </div>
        </div>
    );
};
