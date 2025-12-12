
import React, { useState } from 'react';
import { Customer, INITIAL_CUSTOMERS, SalesChannel, ChannelConfig } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Store, ShoppingBag, Globe, Building2, TrendingUp, Users, Truck, Plus, Settings, X, DollarSign, PieChart, Activity, Calendar } from 'lucide-react';

// Initial Configuration defaults
const DEFAULT_CHANNELS: ChannelConfig[] = [
    { id: 'WHOLESALE', name: 'Mayoristas', type: 'B2B', fixedCost: 2000, variableCostPercent: 5, marketingBudget: 500 },
    { id: 'DEPARTMENT_STORE', name: 'Grandes Almacenes', type: 'B2B', fixedCost: 5000, variableCostPercent: 8, marketingBudget: 1500 },
    { id: 'BOUTIQUE', name: 'Boutiques', type: 'B2B', fixedCost: 1000, variableCostPercent: 2, marketingBudget: 200 },
    { id: 'ECOMMERCE', name: 'E-commerce Propio', type: 'DIGITAL', fixedCost: 300, variableCostPercent: 3, marketingBudget: 3000 },
    { id: 'MARKETPLACE', name: 'Marketplaces', type: 'DIGITAL', fixedCost: 100, variableCostPercent: 15, marketingBudget: 500 }
];

type TimeRange = 'MONTH' | 'QUARTER' | 'YEAR' | 'ALL';

export const Channels: React.FC = () => {
    // State for Channel Configs
    const [channelConfigs, setChannelConfigs] = useState<ChannelConfig[]>(DEFAULT_CHANNELS);
    const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
    const [selectedChannelFilter, setSelectedChannelFilter] = useState<string | 'ALL'>('ALL');
    const [timeRange, setTimeRange] = useState<TimeRange>('ALL');
    
    // Modal State
    const [showConfigModal, setShowConfigModal] = useState(false);
    const [editingConfig, setEditingConfig] = useState<ChannelConfig | null>(null); // If null, adding new

    // --- CALCULATIONS ENGINE ---
    // 1. Aggregate Revenue per Channel (Simulated Time Filtering)
    const revenueMap: Record<string, number> = {};
    const customerCountMap: Record<string, number> = {};

    channelConfigs.forEach(c => {
        revenueMap[c.id] = 0;
        customerCountMap[c.id] = 0;
    });

    // Helper to simulate time filtering since mock data is static
    const getTimeFactor = (range: TimeRange) => {
        switch (range) {
            case 'MONTH': return 0.08; // Roughly 1/12
            case 'QUARTER': return 0.25; // 1/4
            case 'YEAR': return 0.85; // Current YTD
            default: return 1;
        }
    };

    const timeFactor = getTimeFactor(timeRange);

    customers.forEach(c => {
        // If customer belongs to a known channel, add revenue
        const config = channelConfigs.find(conf => conf.id === c.channel) || channelConfigs.find(conf => conf.name === c.channel);
        if (config) {
            // Apply time factor to simulate different periods
            revenueMap[config.id] += Math.round(c.totalSpend * timeFactor);
            customerCountMap[config.id] += 1;
        }
    });

    // 2. Compute Costs & Profits
    const financials = channelConfigs.map(conf => {
        const revenue = revenueMap[conf.id] || 0;
        
        // Estimated COGS (Cost of Goods Sold)
        const cogs = revenue * 0.60; 
        
        const grossProfit = revenue - cogs;
        
        // Variable Costs: Commission, Payment Fees
        const variableCost = revenue * (conf.variableCostPercent / 100);
        
        // Total Operational Costs
        // Fixed costs should also adjust if viewing monthly vs yearly to make sense in P&L
        // Fixed costs in config are typically monthly.
        let adjustedFixedCost = conf.fixedCost;
        let adjustedMarketing = conf.marketingBudget;

        if (timeRange === 'YEAR' || timeRange === 'ALL') {
            adjustedFixedCost = conf.fixedCost * 12;
            adjustedMarketing = conf.marketingBudget * 12;
        } else if (timeRange === 'QUARTER') {
            adjustedFixedCost = conf.fixedCost * 3;
            adjustedMarketing = conf.marketingBudget * 3;
        }
        
        const opCosts = adjustedFixedCost + adjustedMarketing + variableCost;
        
        const totalCost = cogs + opCosts;
        const netProfit = revenue - totalCost;
        const marginPercent = revenue > 0 ? (netProfit / revenue) * 100 : 0;

        return {
            ...conf,
            revenue,
            count: customerCountMap[conf.id],
            cogs,
            variableCost,
            marketingBudget: adjustedMarketing,
            fixedCost: adjustedFixedCost,
            opCosts,
            totalCost,
            netProfit,
            marginPercent
        };
    });

    // 3. Grand Totals
    const grandTotal = financials.reduce((acc, curr) => ({
        revenue: acc.revenue + curr.revenue,
        cogs: acc.cogs + curr.cogs,
        fixedCost: acc.fixedCost + curr.fixedCost,
        marketingBudget: acc.marketingBudget + curr.marketingBudget,
        variableCost: acc.variableCost + curr.variableCost,
        totalCost: acc.totalCost + curr.totalCost,
        netProfit: acc.netProfit + curr.netProfit,
        count: acc.count + curr.count
    }), { revenue: 0, cogs: 0, fixedCost: 0, marketingBudget: 0, variableCost: 0, totalCost: 0, netProfit: 0, count: 0 });

    const totalMarginPercent = grandTotal.revenue > 0 ? (grandTotal.netProfit / grandTotal.revenue) * 100 : 0;

    // Filter logic for the customer table
    const filteredCustomers = selectedChannelFilter === 'ALL' 
        ? customers 
        : customers.filter(c => c.channel === selectedChannelFilter);

    // Helpers
    const getChannelIcon = (type: string) => {
        switch(type) {
            case 'B2B': return Building2;
            case 'DIGITAL': return Globe;
            case 'B2C': return Store;
            default: return Store;
        }
    };

    const handleSaveConfig = () => {
        if (!editingConfig) return;
        
        setChannelConfigs(prev => {
            const exists = prev.find(c => c.id === editingConfig.id);
            if (exists) {
                return prev.map(c => c.id === editingConfig.id ? editingConfig : c);
            } else {
                return [...prev, editingConfig];
            }
        });
        setShowConfigModal(false);
        setEditingConfig(null);
    };

    const handleAddNew = () => {
        setEditingConfig({
            id: `NEW_${Date.now()}`,
            name: '',
            type: 'B2B',
            fixedCost: 0,
            variableCostPercent: 0,
            marketingBudget: 0
        });
        setShowConfigModal(true);
    };

    // Chart Data
    const chartData = financials.map(f => ({
        name: f.name,
        Revenue: f.revenue,
        Cost: f.totalCost,
        Profit: f.netProfit
    }));

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Store className="w-6 h-6 text-indigo-600" /> Canales de Venta & Rentabilidad
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Análisis financiero detallado por canal (Ingresos vs Costos Fijos/Variables).
                    </p>
                </div>
                <div className="flex gap-2">
                    {/* Time Range Toggle */}
                    <div className="bg-white dark:bg-gray-700 p-1 rounded-lg flex border border-gray-200 dark:border-gray-600">
                        <button onClick={() => setTimeRange('MONTH')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeRange === 'MONTH' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}`}>Mes</button>
                        <button onClick={() => setTimeRange('QUARTER')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeRange === 'QUARTER' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}`}>Q</button>
                        <button onClick={() => setTimeRange('YEAR')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeRange === 'YEAR' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}`}>Año</button>
                        <button onClick={() => setTimeRange('ALL')} className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${timeRange === 'ALL' ? 'bg-indigo-100 text-indigo-700' : 'text-gray-500 hover:text-gray-700 dark:text-gray-300'}`}>Todo</button>
                    </div>

                    <button 
                        onClick={handleAddNew}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> Agregar Canal
                    </button>
                </div>
            </div>

            {/* Top Cards Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Utilidad Neta ({timeRange === 'ALL' ? 'Total' : timeRange})</p>
                        <p className="text-2xl font-bold text-green-600 dark:text-green-400">${grandTotal.netProfit.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">Margen Global: {totalMarginPercent.toFixed(1)}%</p>
                    </div>
                    <div className="p-3 bg-green-50 dark:bg-green-900/30 rounded-full text-green-600">
                        <DollarSign className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Costos Operativos</p>
                        <p className="text-2xl font-bold text-red-600 dark:text-red-400">${(grandTotal.fixedCost + grandTotal.variableCost + grandTotal.marketingBudget).toLocaleString()}</p>
                        <p className="text-xs text-gray-400 mt-1">Fijos + Variables + Mkt</p>
                    </div>
                    <div className="p-3 bg-red-50 dark:bg-red-900/30 rounded-full text-red-600">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">Canal Más Rentable</p>
                        <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                            {financials.sort((a, b) => b.netProfit - a.netProfit)[0]?.name || 'N/A'}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">Mayor aporte al beneficio neto</p>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600">
                        <Activity className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Financial Performance Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <PieChart className="w-5 h-5 text-indigo-500" /> Desglose Financiero (P&L)
                    </h3>
                    <span className="text-xs text-gray-500 uppercase font-medium">Periodo: {timeRange === 'ALL' ? 'Histórico Completo' : timeRange}</span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-semibold text-xs uppercase tracking-wider">
                            <tr>
                                <th className="px-4 py-3">Canal</th>
                                <th className="px-4 py-3 text-right text-indigo-600 dark:text-indigo-400">Ingresos (A)</th>
                                <th className="px-4 py-3 text-right text-gray-500">COGS Est. (B)</th>
                                <th className="px-4 py-3 text-right text-orange-600 dark:text-orange-400" title="Alquiler, Nómina específica">C. Fijos (C)</th>
                                <th className="px-4 py-3 text-right text-orange-600 dark:text-orange-400" title="Comisiones, Pasarelas">C. Var (D)</th>
                                <th className="px-4 py-3 text-right text-blue-600 dark:text-blue-400">Mkt (E)</th>
                                <th className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">Costo Total</th>
                                <th className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">Neto (A-Total)</th>
                                <th className="px-4 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {financials.map(f => (
                                <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                        {f.type === 'DIGITAL' ? <Globe className="w-4 h-4 text-blue-400" /> : <Store className="w-4 h-4 text-orange-400" />}
                                        {f.name}
                                    </td>
                                    <td className="px-4 py-3 text-right font-bold">${f.revenue.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-gray-500">${f.cogs.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">${f.fixedCost.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">${f.variableCost.toLocaleString()} <span className="text-[10px] opacity-50">({f.variableCostPercent}%)</span></td>
                                    <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">${f.marketingBudget.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-bold text-red-600 dark:text-red-400">${f.totalCost.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">
                                        ${f.netProfit.toLocaleString()}
                                        <div className="text-[10px] font-normal text-gray-400">{f.marginPercent.toFixed(1)}% Margen</div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <button 
                                            onClick={() => { setEditingConfig(f); setShowConfigModal(true); }}
                                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 p-1 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30"
                                            title="Configurar Costos"
                                        >
                                            <Settings className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {/* GRAND TOTAL ROW */}
                            <tr className="bg-gray-100 dark:bg-gray-800 font-bold border-t-2 border-gray-300 dark:border-gray-600">
                                <td className="px-4 py-4 text-gray-900 dark:text-white uppercase">Grand Total</td>
                                <td className="px-4 py-4 text-right text-indigo-700 dark:text-indigo-300">${grandTotal.revenue.toLocaleString()}</td>
                                <td className="px-4 py-4 text-right text-gray-600 dark:text-gray-400">${grandTotal.cogs.toLocaleString()}</td>
                                <td className="px-4 py-4 text-right text-gray-700 dark:text-gray-300">${grandTotal.fixedCost.toLocaleString()}</td>
                                <td className="px-4 py-4 text-right text-gray-700 dark:text-gray-300">${grandTotal.variableCost.toLocaleString()}</td>
                                <td className="px-4 py-4 text-right text-gray-700 dark:text-gray-300">${grandTotal.marketingBudget.toLocaleString()}</td>
                                <td className="px-4 py-4 text-right text-red-700 dark:text-red-300">${grandTotal.totalCost.toLocaleString()}</td>
                                <td className="px-4 py-4 text-right text-green-700 dark:text-green-300 text-lg border-l border-gray-300 dark:border-gray-600">
                                    ${grandTotal.netProfit.toLocaleString()}
                                </td>
                                <td></td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Customer List Section */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="font-bold text-gray-800 dark:text-white">Filtrar Clientes por Canal</h3>
                    
                    <div className="flex flex-wrap gap-2 justify-center">
                        <button 
                            onClick={() => setSelectedChannelFilter('ALL')}
                            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${selectedChannelFilter === 'ALL' ? 'bg-gray-800 text-white dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}
                        >
                            Todos
                        </button>
                        {channelConfigs.map(c => (
                            <button 
                                key={c.id}
                                onClick={() => setSelectedChannelFilter(c.id)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors border ${selectedChannelFilter === c.id ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'}`}
                            >
                                {c.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto max-h-80">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-medium">
                            <tr>
                                <th className="px-6 py-3">Cliente / Empresa</th>
                                <th className="px-6 py-3">Canal Asignado</th>
                                <th className="px-6 py-3 text-right">Compras Totales</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {filteredCustomers.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                        No hay clientes asignados a este canal aún.
                                    </td>
                                </tr>
                            ) : (
                                filteredCustomers.map(customer => (
                                    <tr key={customer.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                        <td className="px-6 py-3 font-medium text-gray-900 dark:text-white">
                                            {customer.company} <span className="text-gray-400 font-normal">({customer.name})</span>
                                        </td>
                                        <td className="px-6 py-3">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
                                                {channelConfigs.find(c => c.id === customer.channel)?.name || customer.channel}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 text-right font-medium text-gray-900 dark:text-white">
                                            ${customer.totalSpend.toLocaleString()}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Config Modal */}
            {showConfigModal && editingConfig && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
                        <button 
                            onClick={() => { setShowConfigModal(false); setEditingConfig(null); }}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                            {editingConfig.id.startsWith('NEW_') ? 'Crear Nuevo Canal' : 'Configurar Costos del Canal'}
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Canal</label>
                                <input 
                                    type="text" 
                                    value={editingConfig.name}
                                    onChange={(e) => setEditingConfig({...editingConfig, name: e.target.value, id: editingConfig.id.startsWith('NEW_') ? e.target.value.toUpperCase().replace(/\s+/g, '_') : editingConfig.id})}
                                    placeholder="Ej. Pop-up Store Centro"
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    disabled={!editingConfig.id.startsWith('NEW_')} // Disable ID editing for existing
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                                    <select 
                                        value={editingConfig.type}
                                        onChange={(e) => setEditingConfig({...editingConfig, type: e.target.value as any})}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    >
                                        <option value="B2B">B2B / Físico</option>
                                        <option value="DIGITAL">Digital / Web</option>
                                        <option value="B2C">Tienda Propia</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Costo Fijo Mensual</label>
                                    <input 
                                        type="number" 
                                        value={editingConfig.fixedCost}
                                        onChange={(e) => setEditingConfig({...editingConfig, fixedCost: Number(e.target.value)})}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Alquiler, Nómina fija</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Costo Variable (%)</label>
                                    <input 
                                        type="number" 
                                        value={editingConfig.variableCostPercent}
                                        onChange={(e) => setEditingConfig({...editingConfig, variableCostPercent: Number(e.target.value)})}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Comisiones, Pasarelas</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Presupuesto Mkt</label>
                                    <input 
                                        type="number" 
                                        value={editingConfig.marketingBudget}
                                        onChange={(e) => setEditingConfig({...editingConfig, marketingBudget: Number(e.target.value)})}
                                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">Ads, Promoción</p>
                                </div>
                            </div>

                            <button 
                                onClick={handleSaveConfig}
                                className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 font-medium mt-4"
                            >
                                Guardar Configuración
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
