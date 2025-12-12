
import React, { useState } from 'react';
import { DollarSign, TrendingUp, Activity, Factory, Ship, Anchor, Scissors, Layers, PieChart, Table as TableIcon, BarChart3, Lock, Settings, Calculator, Filter, X, Save, Plus, Trash2, CalendarRange, Bell, MessageCircle, Mail, AlertTriangle, Send, Check } from 'lucide-react';
import { Sale, BusinessMode, Order, CollectionSettings, INITIAL_CUSTOMERS } from '../types';

// Mock Data separated by Type
const traderData: Sale[] = [
  { month: 'Ene', revenue: 4000, profit: 2400 },
  { month: 'Feb', revenue: 3000, profit: 1398 },
  { month: 'Mar', revenue: 2000, profit: 980 },
  { month: 'Abr', revenue: 2780, profit: 390 },
  { month: 'May', revenue: 1890, profit: 800 },
];

const manuData: Sale[] = [
  { month: 'Ene', revenue: 6000, profit: 4000 },
  { month: 'Feb', revenue: 5500, profit: 3800 },
  { month: 'Mar', revenue: 7000, profit: 5100 },
  { month: 'Abr', revenue: 6200, profit: 4500 },
  { month: 'May', revenue: 8000, profit: 6000 },
];

// Combined for General View
const generalData = traderData.map((t, i) => ({
    month: t.month,
    revenue: t.revenue + manuData[i].revenue,
    profit: t.profit + manuData[i].profit,
    revenueTrader: t.revenue,
    profitTrader: t.profit,
    revenueManu: manuData[i].revenue,
    profitManu: manuData[i].profit
}));

interface DashboardProps {
  businessMode: BusinessMode;
  orders?: Order[];
}

interface FixedCostItem {
    id: string;
    name: string;
    amount: number;
}

// Custom CSS Chart Component
const SimpleBarChart = ({ data, dataKey, colorClass, label }: { data: any[], dataKey: string, colorClass: string, label: string }) => {
    const maxVal = Math.max(...data.map(d => d[dataKey] as number)) || 1;
    
    return (
        <div className="h-full w-full flex items-end justify-between gap-2 pt-8 pb-2 px-2">
            {data.map((d, i) => {
                const height = (d[dataKey] / maxVal) * 100;
                return (
                    <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group">
                        <div className="relative w-full flex justify-end flex-col h-full">
                            <div 
                                style={{ height: `${height}%` }} 
                                className={`w-full rounded-t-sm transition-all duration-500 ${colorClass} opacity-80 group-hover:opacity-100 relative`}
                            >
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    ${d[dataKey].toLocaleString()}
                                </div>
                            </div>
                        </div>
                        <span className="text-[10px] text-gray-500 mt-2 font-medium">{d.month}</span>
                    </div>
                )
            })}
        </div>
    );
};

// Recreated Area Chart logic using CSS
const SimpleAreaLikeChart = ({ data, dataKey1, dataKey2 }: { data: any[], dataKey1: string, dataKey2: string }) => {
    // Determine max value for Y-axis scale
    const maxVal = Math.max(...data.map(d => Math.max(d[dataKey1] || 0, d[dataKey2] || 0))) || 1;

    return (
        <div className="h-full w-full flex items-end justify-between gap-3 pt-8 pb-2 px-2 border-b border-gray-100 dark:border-gray-700">
            {data.map((d, i) => {
                const h1 = ((d[dataKey1] || 0) / maxVal) * 100;
                const h2 = ((d[dataKey2] || 0) / maxVal) * 100;
                
                return (
                    <div key={i} className="flex flex-col items-center flex-1 h-full justify-end group relative">
                         {/* Tooltip */}
                         <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white p-2 rounded text-[10px] opacity-0 group-hover:opacity-100 transition-opacity z-20 pointer-events-none whitespace-nowrap shadow-xl">
                            <div className="flex gap-2">
                                <span className="text-indigo-300">Ing: ${d[dataKey1]?.toLocaleString()}</span>
                                <span className="text-green-300">Ben: ${d[dataKey2]?.toLocaleString()}</span>
                            </div>
                         </div>

                         <div className="flex gap-1 h-full items-end w-full justify-center">
                            {/* Bar 1 (Revenue) */}
                            <div 
                                style={{ height: `${h1}%` }} 
                                className="w-3 bg-indigo-500 rounded-t-sm relative group-hover:bg-indigo-600 transition-colors opacity-90"
                            ></div>
                            {/* Bar 2 (Profit) */}
                            <div 
                                style={{ height: `${h2}%` }} 
                                className="w-3 bg-green-500 rounded-t-sm relative group-hover:bg-green-600 transition-colors opacity-90"
                            ></div>
                         </div>
                        <span className="text-[10px] text-gray-500 mt-2 font-medium">{d.month}</span>
                    </div>
                )
            })}
        </div>
    );
}

export const Dashboard: React.FC<DashboardProps> = ({ businessMode, orders = [] }) => {
  const [viewMode, setViewMode] = useState<'CHART' | 'TABLE'>('CHART');
  const [topTableView, setTopTableView] = useState<'YTD' | 'MONTHLY'>('YTD');
  
  // New States for Fixed Costs with breakdown
  const [costItems, setCostItems] = useState<FixedCostItem[]>([
      { id: '1', name: 'Renta de Planta/Oficina', amount: 2000 },
      { id: '2', name: 'Nómina Administrativa', amount: 2500 },
      { id: '3', name: 'Servicios (Luz/Agua)', amount: 500 }
  ]);
  const [showCostModal, setShowCostModal] = useState(false);
  const [tempCostItems, setTempCostItems] = useState<FixedCostItem[]>([]);

  // New State for Volume Chart Toggle
  const [volumeChartMode, setVolumeChartMode] = useState<'ALL' | 'MANU' | 'TRADER'>('ALL');

  // COLLECTIONS STATE
  const [collectionSettings, setCollectionSettings] = useState<CollectionSettings>({
      daysBeforeDue: 5,
      autoAiReminders: false,
      channels: ['EMAIL', 'WHATSAPP']
  });
  const [showCollectionSettings, setShowCollectionSettings] = useState(false);
  const [sentAlerts, setSentAlerts] = useState<string[]>([]); // Track sent alerts by Order ID

  const isManu = businessMode === 'MANUFACTURER';
  const isTrader = businessMode === 'TRADER';
  const isGeneral = businessMode === 'GENERAL';

  // determine base data
  let currentData = isManu ? manuData : traderData;
  if (isGeneral) currentData = generalData;

  // Calculate Total Monthly Fixed Cost
  const totalMonthlyFixedCosts = costItems.reduce((sum, item) => sum + item.amount, 0);

  // Stats Logic (Dynamic based on Cost)
  const calculateNetStats = () => {
    const totalRev = currentData.reduce((acc, curr) => acc + curr.revenue, 0);
    const totalGrossProfit = currentData.reduce((acc, curr) => acc + curr.profit, 0);
    // Assuming fixed costs are monthly, multiply by number of months in data
    const totalFixedCostsYTD = totalMonthlyFixedCosts * currentData.length; 
    const netProfit = totalGrossProfit - totalFixedCostsYTD;
    const margin = totalRev > 0 ? (netProfit / totalRev) * 100 : 0;

    return { totalRev, totalGrossProfit, totalFixedCostsYTD, netProfit, margin };
  };

  const stats = calculateNetStats();

  // Cost Modal Handlers
  const handleOpenCostModal = () => {
      setTempCostItems(JSON.parse(JSON.stringify(costItems))); // Deep copy
      setShowCostModal(true);
  };

  const handleSaveCosts = () => {
      setCostItems(tempCostItems);
      setShowCostModal(false);
  };

  const addCostItem = () => {
      setTempCostItems([...tempCostItems, { id: Date.now().toString(), name: 'Nuevo Costo', amount: 0 }]);
  };

  const removeCostItem = (id: string) => {
      setTempCostItems(tempCostItems.filter(item => item.id !== id));
  };

  const updateCostItem = (id: string, field: 'name' | 'amount', value: string | number) => {
      setTempCostItems(tempCostItems.map(item => 
          item.id === id ? { ...item, [field]: value } : item
      ));
  };

  const tempTotal = tempCostItems.reduce((sum, item) => sum + item.amount, 0);

  // --- COLLECTION LOGIC ---
  const today = new Date();
  
  const getDaysDiff = (dateStr: string) => {
      const diff = new Date(dateStr).getTime() - today.getTime();
      return Math.ceil(diff / (1000 * 3600 * 24));
  };

  const overdueOrders = orders.filter(o => o.paymentStatus !== 'PAID' && getDaysDiff(o.dueDate) < 0);
  const upcomingOrders = orders.filter(o => 
      o.paymentStatus !== 'PAID' && 
      getDaysDiff(o.dueDate) >= 0 && 
      getDaysDiff(o.dueDate) <= collectionSettings.daysBeforeDue
  );

  const handleIndividualRemind = (orderId: string) => {
      setSentAlerts(prev => [...prev, orderId]);
      // Simulation of sending
      setTimeout(() => alert('Recordatorio enviado exitosamente.'), 100);
  };

  const getCustomerContacts = (customerId: string) => {
      const customer = INITIAL_CUSTOMERS.find(c => c.id === customerId);
      return {
          hasEmail: customer?.contactMethods.includes('EMAIL') && !!customer?.email,
          hasWhatsapp: customer?.contactMethods.includes('WHATSAPP') && !!customer?.phone
      };
  };

  const renderStats = () => {
    if (isGeneral) {
        return [
            { label: 'Ingresos Totales (YTD)', value: `$${stats.totalRev.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
            { label: 'Costos Fijos Asignados', value: `$${stats.totalFixedCostsYTD.toLocaleString()}`, icon: Calculator, color: 'text-red-600', bg: 'bg-red-50 dark:bg-red-900/20' },
            { label: 'Beneficio Neto (Real)', value: `$${stats.netProfit.toLocaleString()}`, icon: Layers, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
            { label: 'Margen Neto Global', value: `${stats.margin.toFixed(1)}%`, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
        ];
    }
    return [
        { label: 'Ingresos Totales', value: `$${stats.totalRev.toLocaleString()}`, icon: DollarSign, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
        { 
            label: isManu ? 'Costo Producción (Var + Fijo)' : 'Costos Operativos', 
            value: `$${(stats.totalRev - stats.netProfit).toLocaleString()}`, 
            icon: isManu ? Scissors : Anchor, 
            color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' 
        },
        { 
            label: isManu ? 'Unidades Producidas' : 'Envíos en Tránsito', 
            value: isManu ? '1,240' : '4 Contenedores', 
            icon: isManu ? Factory : Ship, 
            color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' 
        },
        { label: 'Beneficio Neto', value: `$${stats.netProfit.toLocaleString()}`, icon: Activity, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/20' },
    ];
  };

  // Logic to determine Volume Chart Data
  const getVolumeChartData = () => {
      if (!isGeneral) return { data: currentData, key: 'revenue', color: isManu ? 'bg-orange-500' : 'bg-blue-500' };
      
      switch (volumeChartMode) {
          case 'MANU':
              return { data: generalData, key: 'revenueManu', color: 'bg-orange-500' };
          case 'TRADER':
              return { data: generalData, key: 'revenueTrader', color: 'bg-blue-500' };
          default:
              return { data: generalData, key: 'revenue', color: 'bg-purple-500' };
      }
  };

  const volumeChartConfig = getVolumeChartData();

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase flex items-center gap-1
                ${isManu ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' : 
                  isTrader ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 
                  'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                {isManu && <Factory className="w-3 h-3" />}
                {isTrader && <Ship className="w-3 h-3" />}
                {isGeneral && <Layers className="w-3 h-3" />}
                {isManu ? 'Modo Producción' : isTrader ? 'Modo Trader' : 'Visión General Híbrida'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {isGeneral ? 'Panel Corporativo Unificado' : 'Resumen Operativo'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {isGeneral 
                ? 'Análisis financiero consolidado (Manufactura + Importación).'
                : isManu 
                    ? 'Vista de eficiencia de planta y costos de producción.' 
                    : 'Vista de márgenes de importación y logística.'}
          </p>
        </div>
        
        <button 
            onClick={handleOpenCostModal}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium transition-colors shadow-sm"
        >
            <Settings className="w-4 h-4" /> Configurar Costos Fijos
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {renderStats().map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between hover:border-indigo-200 dark:hover:border-indigo-700 transition-all">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <Icon className={`w-6 h-6 ${stat.color} dark:text-white`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* AI COLLECTIONS MODULE */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400">
                      <Bell className="w-5 h-5" />
                  </div>
                  <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">Gestión de Cobranza & Alertas IA</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                          {overdueOrders.length} Vencidos • {upcomingOrders.length} Próximos (Alertar {collectionSettings.daysBeforeDue} días antes)
                      </p>
                  </div>
              </div>
              <div className="flex gap-2">
                  <button 
                      onClick={() => setShowCollectionSettings(true)}
                      className="px-3 py-2 text-xs font-medium bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                      <Settings className="w-4 h-4" /> Config
                  </button>
              </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Overdue Section */}
              <div className="p-4 border-r border-gray-100 dark:border-gray-700">
                  <h4 className="text-sm font-bold text-red-600 dark:text-red-400 mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Vencidos (Acción Individual)
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {overdueOrders.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No hay pagos vencidos.</p>
                      ) : (
                          overdueOrders.map(o => {
                              const contacts = getCustomerContacts(o.customerId);
                              const isSent = sentAlerts.includes(o.id);
                              
                              return (
                              <div key={o.id} className="flex justify-between items-center p-3 rounded-lg bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30">
                                  <div>
                                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{o.customerName}</p>
                                      <p className="text-[10px] text-red-500 font-medium mb-1">Vencido hace {Math.abs(getDaysDiff(o.dueDate))} días</p>
                                      <div className="flex gap-1">
                                          {contacts.hasEmail ? (
                                              <Mail className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                          ) : (
                                              <AlertTriangle className="w-3 h-3 text-red-400" title="Falta Email" />
                                          )}
                                          {contacts.hasWhatsapp ? (
                                              <MessageCircle className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                          ) : (
                                              <AlertTriangle className="w-3 h-3 text-red-400" title="Falta WhatsApp" />
                                          )}
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <div className="text-right mr-1">
                                          <p className="text-xs font-bold text-gray-900 dark:text-white">${o.totalAmount.toLocaleString()}</p>
                                      </div>
                                      <button 
                                        onClick={() => handleIndividualRemind(o.id)}
                                        disabled={(!contacts.hasEmail && !contacts.hasWhatsapp) || isSent}
                                        className={`p-2 rounded-lg transition-colors ${isSent ? 'bg-green-100 text-green-600' : 'bg-white border border-gray-200 hover:bg-gray-100 text-indigo-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        title={isSent ? "Enviado" : "Enviar Recordatorio"}
                                      >
                                          {isSent ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                                      </button>
                                  </div>
                              </div>
                          )})
                      )}
                  </div>
              </div>

              {/* Upcoming Section */}
              <div className="p-4">
                  <h4 className="text-sm font-bold text-yellow-600 dark:text-yellow-400 mb-3 flex items-center gap-2">
                      <CalendarRange className="w-4 h-4" /> Próximos Vencimientos
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                      {upcomingOrders.length === 0 ? (
                          <p className="text-xs text-gray-400 italic">No hay vencimientos próximos en {collectionSettings.daysBeforeDue} días.</p>
                      ) : (
                          upcomingOrders.map(o => {
                              const contacts = getCustomerContacts(o.customerId);
                              const isSent = sentAlerts.includes(o.id);

                              return (
                              <div key={o.id} className="flex justify-between items-center p-3 rounded-lg bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30">
                                  <div>
                                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200">{o.customerName}</p>
                                      <p className="text-[10px] text-yellow-600 font-medium mb-1">Vence en {getDaysDiff(o.dueDate)} días</p>
                                      <div className="flex gap-1">
                                          {contacts.hasEmail ? (
                                              <Mail className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                          ) : (
                                              <AlertTriangle className="w-3 h-3 text-red-400" title="Falta Email" />
                                          )}
                                          {contacts.hasWhatsapp ? (
                                              <MessageCircle className="w-3 h-3 text-gray-500 dark:text-gray-400" />
                                          ) : (
                                              <AlertTriangle className="w-3 h-3 text-red-400" title="Falta WhatsApp" />
                                          )}
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <div className="text-right mr-1">
                                          <p className="text-xs font-bold text-gray-900 dark:text-white">${o.totalAmount.toLocaleString()}</p>
                                      </div>
                                      <button 
                                        onClick={() => handleIndividualRemind(o.id)}
                                        disabled={(!contacts.hasEmail && !contacts.hasWhatsapp) || isSent}
                                        className={`p-2 rounded-lg transition-colors ${isSent ? 'bg-green-100 text-green-600' : 'bg-white border border-gray-200 hover:bg-gray-100 text-indigo-600'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                        title={isSent ? "Enviado" : "Enviar Recordatorio Preventivo"}
                                      >
                                          {isSent ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
                                      </button>
                                  </div>
                              </div>
                          )})
                      )}
                  </div>
              </div>
          </div>
      </div>

      {/* Breakdown Table for General/Hybrid Mode (Restored) */}
      {isGeneral && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                  <h3 className="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-indigo-500" /> Desglose por Unidad de Negocio
                  </h3>
                  {/* Top Table Toggle */}
                  <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                      <button 
                          onClick={() => setTopTableView('YTD')}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${topTableView === 'YTD' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                      >
                          <TableIcon className="w-3 h-3" /> Acumulado YTD
                      </button>
                      <button 
                          onClick={() => setTopTableView('MONTHLY')}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${topTableView === 'MONTHLY' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                      >
                          <CalendarRange className="w-3 h-3" /> Evolución Mensual
                      </button>
                  </div>
              </div>
              
              <div className="overflow-x-auto">
                {topTableView === 'YTD' ? (
                  /* EXISTING YTD TABLE */
                  <table className="w-full text-left text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                          <tr>
                              <th className="px-6 py-3">Unidad de Negocio</th>
                              <th className="px-6 py-3">Ingresos</th>
                              <th className="px-6 py-3">Costos Variables</th>
                              <th className="px-6 py-3">Beneficio Bruto</th>
                              <th className="px-6 py-3">Costos Fijos (Asignados)</th>
                              <th className="px-6 py-3">Beneficio Neto</th>
                              <th className="px-6 py-3">Tendencia</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {/* Manufactura Row */}
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-6 py-4 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                  <Factory className="w-4 h-4 text-orange-500" /> Manufactura
                              </td>
                              <td className="px-6 py-4">$52,100</td>
                              <td className="px-6 py-4 text-gray-500">$32,000</td>
                              <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">$20,100</td>
                              <td className="px-6 py-4 text-red-500 text-xs">-${(totalMonthlyFixedCosts * 2.5).toLocaleString()} (est.)</td>
                              <td className="px-6 py-4 text-green-600 font-bold">$12,000</td>
                              <td className="px-6 py-4"><span className="text-green-500 flex items-center text-xs"><TrendingUp className="w-3 h-3 mr-1" /> +12%</span></td>
                          </tr>
                          {/* Trader Row */}
                          <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-6 py-4 flex items-center gap-2 font-medium text-gray-900 dark:text-white">
                                  <Ship className="w-4 h-4 text-blue-500" /> Trading / Import
                              </td>
                              <td className="px-6 py-4">$32,130</td>
                              <td className="px-6 py-4 text-gray-500">$25,000</td>
                              <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">$7,130</td>
                              <td className="px-6 py-4 text-red-500 text-xs">-${(totalMonthlyFixedCosts * 2.5).toLocaleString()} (est.)</td>
                              <td className="px-6 py-4 text-green-600 font-bold">$3,500</td>
                              <td className="px-6 py-4"><span className="text-yellow-500 flex items-center text-xs"><Activity className="w-3 h-3 mr-1" /> Stable</span></td>
                          </tr>
                          {/* Total Row */}
                          <tr className="bg-gray-50/50 dark:bg-gray-900/30 font-bold border-t border-gray-200 dark:border-gray-600">
                              <td className="px-6 py-4 text-gray-900 dark:text-white">TOTAL CONSOLIDADO</td>
                              <td className="px-6 py-4">${stats.totalRev.toLocaleString()}</td>
                              <td className="px-6 py-4 text-gray-500">${(stats.totalRev - stats.totalGrossProfit).toLocaleString()}</td>
                              <td className="px-6 py-4 text-gray-900 dark:text-white">${stats.totalGrossProfit.toLocaleString()}</td>
                              <td className="px-6 py-4 text-red-500">-${stats.totalFixedCostsYTD.toLocaleString()}</td>
                              <td className="px-6 py-4 text-indigo-600">${stats.netProfit.toLocaleString()}</td>
                              <td className="px-6 py-4"></td>
                          </tr>
                      </tbody>
                  </table>
                ) : (
                  /* NEW MONTHLY BREAKDOWN TABLE */
                  <table className="w-full text-left text-sm animate-in fade-in">
                      <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300">
                          <tr>
                              <th className="px-6 py-3 border-r border-gray-200 dark:border-gray-700">Mes</th>
                              
                              {/* Manu Group */}
                              <th className="px-4 py-3 bg-orange-50/50 dark:bg-orange-900/10 text-orange-800 dark:text-orange-200">Ingresos Manu.</th>
                              <th className="px-4 py-3 bg-orange-50/50 dark:bg-orange-900/10 text-orange-800 dark:text-orange-200 border-r border-gray-200 dark:border-gray-700">Margen Manu.</th>
                              
                              {/* Trader Group */}
                              <th className="px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-200">Ingresos Trader</th>
                              <th className="px-4 py-3 bg-blue-50/50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-200 border-r border-gray-200 dark:border-gray-700">Margen Trader</th>
                              
                              {/* Consolidated Group */}
                              <th className="px-4 py-3 text-red-600 dark:text-red-400">Costos Fijos</th>
                              <th className="px-6 py-3 font-bold text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700/30">Neto Final</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {generalData.map((row, idx) => {
                              const net = row.profit - totalMonthlyFixedCosts;
                              return (
                                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                      <td className="px-6 py-4 font-bold border-r border-gray-100 dark:border-gray-700">{row.month}</td>
                                      
                                      <td className="px-4 py-4 text-gray-600 dark:text-gray-300 bg-orange-50/10">${row.revenueManu.toLocaleString()}</td>
                                      <td className="px-4 py-4 text-gray-600 dark:text-gray-300 border-r border-gray-100 dark:border-gray-700 bg-orange-50/10">${row.profitManu.toLocaleString()}</td>
                                      
                                      <td className="px-4 py-4 text-gray-600 dark:text-gray-300 bg-blue-50/10">${row.revenueTrader.toLocaleString()}</td>
                                      <td className="px-4 py-4 text-gray-600 dark:text-gray-300 border-r border-gray-100 dark:border-gray-700 bg-blue-50/10">${row.profitTrader.toLocaleString()}</td>
                                      
                                      <td className="px-4 py-4 text-red-500 text-xs">-${totalMonthlyFixedCosts.toLocaleString()}</td>
                                      <td className={`px-6 py-4 font-bold bg-gray-50/50 dark:bg-gray-700/20 ${net > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                          ${net.toLocaleString()}
                                      </td>
                                  </tr>
                              );
                          })}
                      </tbody>
                  </table>
                )}
              </div>
          </div>
      )}

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Toggleable Section: Monthly Detail Table vs Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {viewMode === 'TABLE' ? <TableIcon className="w-5 h-5 text-indigo-500" /> : <TrendingUp className="w-5 h-5 text-indigo-500" />}
                    {viewMode === 'TABLE' ? 'Detalle de Resultados (P&L)' : `Tendencias: Ingresos vs Beneficio`}
                </h3>
                
                {/* View Toggle */}
                <div className="flex bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('CHART')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'CHART' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'}`}
                    >
                        Gráfico
                    </button>
                    <button 
                        onClick={() => setViewMode('TABLE')}
                        className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${viewMode === 'TABLE' ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'}`}
                    >
                        Tabla
                    </button>
                </div>
            </div>

            <div className="flex-1 w-full overflow-hidden relative">
                 {/* Logic for Table View */}
                 {viewMode === 'TABLE' ? (
                     <div className="h-full w-full flex flex-col animate-in fade-in slide-in-from-bottom-2">
                         <div className="overflow-auto flex-1">
                            <table className="w-full text-left text-sm border-collapse">
                                <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-400 sticky top-0 z-10">
                                    <tr>
                                        <th className="px-4 py-3 font-semibold rounded-tl-lg">Mes</th>
                                        <th className="px-4 py-3 font-semibold">Ingresos</th>
                                        <th className="px-4 py-3 font-semibold text-gray-500 hidden sm:table-cell">
                                           Costo Var.
                                        </th>
                                        <th className="px-4 py-3 font-semibold">Margen Bruto</th>
                                        <th className="px-4 py-3 font-semibold text-red-500 text-xs">Costos Fijos</th>
                                        <th className="px-4 py-3 font-semibold rounded-tr-lg">Neto</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                    {currentData.map((row, i) => {
                                        const grossProfit = row.profit;
                                        const variableCost = row.revenue - grossProfit;
                                        const netProfit = grossProfit - totalMonthlyFixedCosts;
                                        const isPositive = netProfit > 0;

                                        return (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                <td className="px-4 py-3 font-medium text-gray-900 dark:text-white border-r border-gray-100 dark:border-gray-700">{row.month}</td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-300">${row.revenue.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-gray-400 hidden sm:table-cell">-${variableCost.toLocaleString()}</td>
                                                <td className="px-4 py-3 font-medium text-gray-700 dark:text-gray-300">${grossProfit.toLocaleString()}</td>
                                                <td className="px-4 py-3 text-red-500 text-xs">-${totalMonthlyFixedCosts.toLocaleString()}</td>
                                                <td className={`px-4 py-3 font-bold ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                                                    ${netProfit.toLocaleString()}
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                         </div>
                         <div className="mt-2 text-right">
                             <span className="text-[10px] bg-red-50 text-red-600 px-2 py-1 rounded border border-red-100 inline-flex items-center gap-1">
                                <Lock className="w-3 h-3" /> Solo visible para Directores
                             </span>
                         </div>
                     </div>
                 ) : (
                     <div className="h-80 w-full animate-in fade-in slide-in-from-bottom-2">
                        <SimpleAreaLikeChart 
                            data={currentData}
                            dataKey1="revenue"
                            dataKey2="profit"
                        />
                     </div>
                 )}
            </div>
        </div>

        {/* Volume Chart (Renamed) */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 transition-colors flex flex-col">
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Volumen de Facturación
              </h3>
              {isGeneral && (
                  <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                      <button onClick={() => setVolumeChartMode('ALL')} className={`px-2 py-1 rounded text-[10px] font-bold ${volumeChartMode === 'ALL' ? 'bg-white text-indigo-600 shadow' : 'text-gray-500'}`}>TODOS</button>
                      <button onClick={() => setVolumeChartMode('MANU')} className={`px-2 py-1 rounded text-[10px] font-bold ${volumeChartMode === 'MANU' ? 'bg-white text-orange-600 shadow' : 'text-gray-500'}`}>MANU</button>
                      <button onClick={() => setVolumeChartMode('TRADER')} className={`px-2 py-1 rounded text-[10px] font-bold ${volumeChartMode === 'TRADER' ? 'bg-white text-blue-600 shadow' : 'text-gray-500'}`}>IMP.</button>
                  </div>
              )}
          </div>
          <div className="h-80 w-full min-h-[320px] flex-1">
             <SimpleBarChart 
                data={volumeChartConfig.data}
                dataKey={volumeChartConfig.key}
                label="Volumen"
                colorClass={volumeChartConfig.color}
             />
          </div>
        </div>
      </div>

      {/* Collection Settings Modal */}
      {showCollectionSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in duration-200">
                  <button onClick={() => setShowCollectionSettings(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-5 h-5" /></button>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Configurar Alertas de Cobranza</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              Enviar alerta anticipada (Días antes):
                          </label>
                          <div className="flex items-center gap-3">
                              <input 
                                  type="number" 
                                  min="1" max="30"
                                  value={collectionSettings.daysBeforeDue}
                                  onChange={(e) => setCollectionSettings({...collectionSettings, daysBeforeDue: Number(e.target.value)})}
                                  className="w-20 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                              />
                              <span className="text-sm text-gray-500">días antes de vencer</span>
                          </div>
                      </div>
                      
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                          <label className="flex items-center gap-3 cursor-pointer">
                              <div className="relative">
                                  <input 
                                      type="checkbox" 
                                      className="sr-only peer"
                                      checked={collectionSettings.autoAiReminders}
                                      onChange={() => setCollectionSettings({...collectionSettings, autoAiReminders: !collectionSettings.autoAiReminders})}
                                  />
                                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                              </div>
                              <span className="text-sm font-medium text-gray-900 dark:text-white">Recordatorios Automáticos</span>
                          </label>
                          <p className="text-xs text-gray-500 mt-2">La IA contactará al cliente el día configurado.</p>
                      </div>

                      <div className="space-y-2">
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Canales de Notificación:</p>
                          <div className="flex gap-4">
                              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <input type="checkbox" checked={collectionSettings.channels.includes('EMAIL')} readOnly className="rounded text-indigo-600" />
                                  Email
                              </label>
                              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                  <input type="checkbox" checked={collectionSettings.channels.includes('WHATSAPP')} readOnly className="rounded text-indigo-600" />
                                  WhatsApp
                              </label>
                          </div>
                      </div>

                      <button 
                          onClick={() => setShowCollectionSettings(false)}
                          className="w-full mt-2 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700"
                      >
                          Guardar Configuración
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Fixed Cost Configuration Modal */}
      {showCostModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                  <button 
                      onClick={() => setShowCostModal(false)}
                      className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                      <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5" /> Configurar Costos Fijos
                  </h3>
                  
                  <div className="space-y-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                          Desglose los costos fijos mensuales (overhead) para calcular la rentabilidad neta real.
                      </p>

                      <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                          {tempCostItems.map((item) => (
                              <div key={item.id} className="flex gap-2 items-center">
                                  <input 
                                      type="text" 
                                      value={item.name}
                                      onChange={(e) => updateCostItem(item.id, 'name', e.target.value)}
                                      placeholder="Nombre del costo"
                                      className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                  />
                                  <div className="relative w-32">
                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">$</span>
                                      <input 
                                          type="number" 
                                          value={item.amount}
                                          onChange={(e) => updateCostItem(item.id, 'amount', Number(e.target.value))}
                                          className="w-full pl-6 pr-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                                      />
                                  </div>
                                  <button 
                                      onClick={() => removeCostItem(item.id)}
                                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  >
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                              </div>
                          ))}
                      </div>

                      <button 
                          onClick={addCostItem}
                          className="w-full py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-gray-500 dark:text-gray-400 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
                      >
                          <Plus className="w-4 h-4" /> Agregar Nuevo Concepto
                      </button>

                      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg flex justify-between items-center border border-gray-200 dark:border-gray-700">
                          <span className="font-bold text-gray-700 dark:text-gray-300">Total Mensual:</span>
                          <span className="font-bold text-xl text-indigo-600 dark:text-indigo-400">${tempTotal.toLocaleString()}</span>
                      </div>

                      <div className="flex gap-2 pt-2">
                          <button 
                             onClick={() => setShowCostModal(false)}
                             className="flex-1 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          >
                              Cancelar
                          </button>
                          <button 
                             onClick={handleSaveCosts}
                             className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2 transition-colors"
                          >
                              <Save className="w-4 h-4" /> Guardar Cambios
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
