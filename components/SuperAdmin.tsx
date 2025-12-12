
import React, { useState } from 'react';
import { Company, CompanyType, ModuleType, UserRole, IndustryType } from '../types';
import { Building2, Plus, Ship, Factory, Layers, ArrowRight, Trash2, Search, Lock, CheckSquare, Square } from 'lucide-react';

interface SuperAdminProps {
  onSelectCompany: (company: Company) => void;
  companies: Company[];
  setCompanies: React.Dispatch<React.SetStateAction<Company[]>>;
  userRole?: UserRole; // To check permissions
}

export const SuperAdmin: React.FC<SuperAdminProps> = ({ onSelectCompany, companies, setCompanies, userRole }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [newCompanyType, setNewCompanyType] = useState<CompanyType>('TRADER');
  const [newCompanyIndustry, setNewCompanyIndustry] = useState<IndustryType>('GENERIC');
  
  // Default modules active
  const [selectedModules, setSelectedModules] = useState<ModuleType[]>(['INVENTORY', 'ORDERS']);

  const availableModules: {id: ModuleType, label: string, desc: string}[] = [
      { id: 'INVENTORY', label: 'Gestión Inventario', desc: 'Core: Stock, Costos, Variantes.' },
      { id: 'ORDERS', label: 'Pedidos / Ventas', desc: 'Carrito, Checkout manual, Historial.' },
      { id: 'SUPPLY_CHAIN', label: 'Cadena Suministro', desc: 'Compras a proveedores y Manufactura.' },
      { id: 'CRM', label: 'CRM', desc: 'Gestión de clientes y prospectos.' },
      { id: 'FINANCE', label: 'Finanzas', desc: 'Facturación, PDF, Cuentas por Cobrar.' },
      { id: 'AI_STUDIO', label: 'AI Studio (Gemini)', desc: 'Premium: Generador de contenido.' },
  ];

  const isOnboardingOnly = userRole === 'ONBOARDING_ADMIN';

  const handleAddCompany = () => {
    if (!newCompanyName) return;
    const newCompany: Company = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCompanyName,
      type: newCompanyType,
      industry: newCompanyIndustry,
      joinedDate: new Date().toISOString().split('T')[0],
      activeModules: selectedModules
    };
    setCompanies([...companies, newCompany]);
    setShowAddForm(false);
    setNewCompanyName('');
    setNewCompanyType('TRADER');
    setNewCompanyIndustry('GENERIC');
    setSelectedModules(['INVENTORY', 'ORDERS']); // Reset
  };

  const toggleModule = (id: ModuleType) => {
      if (selectedModules.includes(id)) {
          // Prevent removing core if desired, but let's allow flexibility
          setSelectedModules(selectedModules.filter(m => m !== id));
      } else {
          setSelectedModules([...selectedModules, id]);
      }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm('¿Está seguro de que desea eliminar esta empresa? Esta acción no se puede deshacer.')) {
        setCompanies(companies.filter(c => c.id !== id));
    }
  };

  const getTypeIcon = (type: CompanyType) => {
    switch (type) {
      case 'MANUFACTURER': return <Factory className="w-5 h-5 text-orange-500" />;
      case 'TRADER': return <Ship className="w-5 h-5 text-blue-500" />;
      case 'HYBRID': return <Layers className="w-5 h-5 text-purple-500" />;
    }
  };

  const getTypeLabel = (type: CompanyType) => {
    switch (type) {
      case 'MANUFACTURER': return 'Manufactura';
      case 'TRADER': return 'Trader / Import';
      case 'HYBRID': return 'Híbrido (Ambos)';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Building2 className="w-10 h-10 text-indigo-600" />
              SaaS Super Admin
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-2">
              Plataforma de gestión empresarial multi-inquilino.
            </p>
          </div>
          <button 
            onClick={() => setShowAddForm(true)}
            className="bg-indigo-600 text-white px-5 py-3 rounded-xl font-medium shadow-lg shadow-indigo-200 dark:shadow-none hover:bg-indigo-700 transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" /> Onboard New Company
          </button>
        </div>

        {/* Add Company Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Registrar Nueva Empresa</h2>
              
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nombre de la Empresa</label>
                        <input 
                            type="text" 
                            value={newCompanyName}
                            onChange={(e) => setNewCompanyName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Ej. Acme Corp"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Modelo de Negocio</label>
                        <select 
                            value={newCompanyType}
                            onChange={(e) => setNewCompanyType(e.target.value as CompanyType)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="TRADER">Trader / Importador</option>
                            <option value="MANUFACTURER">Manufactura / Fábrica</option>
                            <option value="HYBRID">Híbrido (Ambos)</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Industria</label>
                        <select 
                            value={newCompanyIndustry}
                            onChange={(e) => setNewCompanyIndustry(e.target.value as IndustryType)}
                            className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="GENERIC">Genérico</option>
                            <option value="FASHION">Moda / Textil</option>
                            <option value="ELECTRONICS">Electrónica</option>
                            <option value="FMCG">Bienes de Consumo</option>
                        </select>
                    </div>
                </div>

                {/* Module Selector */}
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Plan y Módulos Activos</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableModules.map(mod => {
                            const isSelected = selectedModules.includes(mod.id);
                            return (
                                <div 
                                    key={mod.id} 
                                    onClick={() => toggleModule(mod.id)}
                                    className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'}`}
                                >
                                    <div className={`mt-0.5 ${isSelected ? 'text-indigo-600' : 'text-slate-400'}`}>
                                        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                                    </div>
                                    <div>
                                        <p className={`text-sm font-bold ${isSelected ? 'text-indigo-900 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-400'}`}>{mod.label}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-500">{mod.desc}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="flex gap-3 mt-6 border-t border-slate-100 dark:border-slate-700 pt-6">
                  <button 
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 py-2.5 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg font-medium"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleAddCompany}
                    disabled={!newCompanyName}
                    className="flex-1 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Crear Empresa
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Company Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div 
              key={company.id}
              onClick={() => !isOnboardingOnly && onSelectCompany(company)}
              className={`bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm transition-all group relative overflow-hidden flex flex-col justify-between h-full
                  ${!isOnboardingOnly ? 'hover:shadow-xl hover:-translate-y-1 cursor-pointer' : 'opacity-90'}`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xl font-bold text-slate-600 dark:text-slate-300">
                    {company.name.charAt(0)}
                    </div>
                    {!isOnboardingOnly && (
                        <button 
                            onClick={(e) => handleDelete(company.id, e)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                        <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>

                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{company.name}</h3>
                
                <div className="flex items-center gap-2 mb-4">
                    {getTypeIcon(company.type)}
                    <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {getTypeLabel(company.type)}
                    </span>
                    <span className="text-xs text-slate-400 border-l border-slate-200 pl-2">
                        {company.industry}
                    </span>
                </div>

                {/* Modules Chips */}
                <div className="flex flex-wrap gap-1.5 mb-6">
                    {company.activeModules?.slice(0, 4).map(mod => (
                        <span key={mod} className="text-[10px] px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                            {mod}
                        </span>
                    ))}
                    {company.activeModules?.length > 4 && (
                        <span className="text-[10px] px-2 py-1 rounded-md bg-slate-100 dark:bg-slate-700 text-slate-500">
                            +{company.activeModules.length - 4} más
                        </span>
                    )}
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-4 mt-auto">
                <span className="text-xs text-slate-400">Miembro desde {company.joinedDate}</span>
                {isOnboardingOnly ? (
                    <span className="text-slate-400 font-medium text-sm flex items-center gap-1 cursor-not-allowed" title="Acceso restringido para Onboarding Admin">
                        <Lock className="w-3 h-3" /> Privado
                    </span>
                ) : (
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                        Acceder Panel <ArrowRight className="w-4 h-4" />
                    </span>
                )}
              </div>
            </div>
          ))}

          {/* New Company Placeholder */}
          <button 
            onClick={() => setShowAddForm(true)}
            className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 flex flex-col items-center justify-center text-slate-400 hover:border-indigo-500 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all min-h-[300px]"
          >
            <Plus className="w-8 h-8 mb-2" />
            <span className="font-medium">Registrar Empresa</span>
          </button>
        </div>
      </div>
    </div>
  );
};
