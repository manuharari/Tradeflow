
import React from 'react';
import { LayoutDashboard, Package, Users, Presentation, LogOut, Moon, Sun, Factory, Ship, Layers, ArrowLeft, ShoppingCart, UserCircle, Container, Bell, DollarSign, History, Store } from 'lucide-react';
import { ViewState, BusinessMode, Company, User, ModuleType } from '../types';

interface SidebarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  businessMode: BusinessMode;
  setBusinessMode: (mode: BusinessMode) => void;
  activeCompany: Company;
  onExitCompany: () => void;
  currentUser: User | null;
  onToggleNotifications: () => void; // New prop
  unreadNotifications: number; // New prop
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  onChangeView, 
  isDarkMode, 
  toggleDarkMode,
  businessMode,
  setBusinessMode,
  activeCompany,
  onExitCompany,
  currentUser,
  onToggleNotifications,
  unreadNotifications
}) => {
  
  // Define all possible items with their required module
  const allNavItems: { id: ViewState, label: string, icon: any, requiredModule?: ModuleType }[] = [
    { id: ViewState.DASHBOARD, label: 'Panel General', icon: LayoutDashboard }, // Core
    { id: ViewState.INVENTORY, label: 'Inventario', icon: Package, requiredModule: 'INVENTORY' },
    { id: ViewState.SUPPLY_CHAIN, label: 'Cadena Suministro', icon: Container, requiredModule: 'SUPPLY_CHAIN' }, 
    { id: ViewState.ORDERS, label: 'Pedidos Ventas', icon: ShoppingCart, requiredModule: 'ORDERS' },
    { id: ViewState.CHANNELS, label: 'Canales & Clientes', icon: Store, requiredModule: 'CHANNELS' },
    { id: ViewState.FINANCE, label: 'Finanzas & Fac.', icon: DollarSign, requiredModule: 'FINANCE' },
    { id: ViewState.HISTORY, label: 'Histórico 5 Años', icon: History, requiredModule: 'HISTORY' },
    { id: ViewState.CRM, label: 'CRM Leads', icon: Users, requiredModule: 'CRM' },
    { id: ViewState.PRESENTATION, label: 'Presentaciones IA', icon: Presentation, requiredModule: 'AI_STUDIO' },
  ];

  // Filter based on company active modules (Defensive check)
  const navItems = allNavItems.filter(item => {
      if (!item.requiredModule) return true; // Always show if no module required
      return activeCompany?.activeModules?.includes(item.requiredModule);
  });
  
  const isHybrid = activeCompany?.type === 'HYBRID';
  // Check both admin roles for exit button
  const isAdminContext = currentUser?.role === 'MASTER_ADMIN' || currentUser?.role === 'ONBOARDING_ADMIN';

  if (!activeCompany) return null; // Safety return

  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-screen fixed left-0 top-0 z-10 transition-colors duration-300">
      
      {/* Company Header */}
      <div className="p-6 border-b border-gray-100 dark:border-gray-700">
        {isAdminContext && (
            <button 
            onClick={onExitCompany}
            className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-3 transition-colors"
            >
            <ArrowLeft className="w-3 h-3" /> Volver a Admin
            </button>
        )}
        
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-200 dark:shadow-none shrink-0">
            {activeCompany.name?.charAt(0) || 'C'}
          </div>
          <div className="min-w-0">
             <h2 className="font-bold text-gray-800 dark:text-white leading-tight truncate w-full" title={activeCompany.name}>{activeCompany.name}</h2>
             <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">{activeCompany.type}</span>
          </div>
        </div>
      </div>
      
      {/* Context Toggles (Only for Hybrid) */}
      {isHybrid && (
        <div className="px-4 py-4">
           <label className="text-xs font-semibold text-gray-400 uppercase ml-1 mb-2 block">Contexto de Negocio</label>
           <div className="bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg flex flex-col gap-1">
                <button 
                    onClick={() => setBusinessMode('GENERAL')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium transition-all ${businessMode === 'GENERAL' ? 'bg-white dark:bg-gray-600 shadow-sm text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700'}`}
                >
                    <Layers className="w-3.5 h-3.5" /> General (Híbrido)
                </button>
                <div className="flex gap-1">
                    <button 
                        onClick={() => setBusinessMode('MANUFACTURER')}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all ${businessMode === 'MANUFACTURER' ? 'bg-white dark:bg-gray-600 shadow-sm text-orange-600 dark:text-orange-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700'}`}
                    >
                        <Factory className="w-3.5 h-3.5" /> Fab.
                    </button>
                    <button 
                        onClick={() => setBusinessMode('TRADER')}
                        className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-md text-xs font-medium transition-all ${businessMode === 'TRADER' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-700'}`}
                    >
                        <Ship className="w-3.5 h-3.5" /> Trader
                    </button>
                </div>
           </div>
        </div>
      )}

      {/* Main Nav */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400 dark:text-gray-500'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User & Bottom Actions */}
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 space-y-2 bg-gray-50/50 dark:bg-gray-800/50">
        
        {/* User Info */}
        <div className="flex items-center gap-3 px-2 pb-2 mb-2 border-b border-gray-200 dark:border-gray-700 relative">
            <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                <UserCircle className="w-5 h-5 text-gray-500 dark:text-gray-300" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{currentUser?.name || 'Usuario'}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser?.email || 'email@empresa.com'}</p>
            </div>
            {/* Notification Bell */}
            <button 
              onClick={onToggleNotifications}
              className="relative p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500 dark:text-gray-400"
              title="Notificaciones"
            >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-gray-800"></span>
                )}
            </button>
        </div>

        <button 
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
        >
          {isDarkMode ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-gray-400" />}
          {isDarkMode ? 'Modo Claro' : 'Modo Oscuro'}
        </button>
        
        <button 
            onClick={onExitCompany}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {isAdminContext ? 'Cerrar Empresa' : 'Cerrar Sesión'}
        </button>
      </div>
    </aside>
  );
};
