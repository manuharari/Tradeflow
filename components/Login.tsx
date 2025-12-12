
import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { Lock, Mail, ArrowRight, ShieldCheck, User as UserIcon, LayoutGrid, UserPlus } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

// Mock Users for Demo
const DEMO_USERS: User[] = [
  { 
    id: 'master-1', 
    name: 'Super Admin', 
    email: 'admin@tradeflow.com', 
    role: 'MASTER_ADMIN' 
  },
  {
      id: 'onboard-1',
      name: 'Onboarding Spec.',
      email: 'sales@tradeflow.com',
      role: 'ONBOARDING_ADMIN'
  },
  { 
    id: 'tenant-1', 
    name: 'Alice Manager', 
    email: 'alice@globaltextiles.com', 
    role: 'TENANT_ADMIN',
    companyId: '1' // Linked to Global Textiles
  },
  { 
    id: 'tenant-2', 
    name: 'Bob Trader', 
    email: 'bob@urbanimports.com', 
    role: 'TENANT_ADMIN',
    companyId: '2' // Linked to Urban Imports
  }
];

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple mock authentication
    const user = DEMO_USERS.find(u => u.email === email);
    if (user) {
      onLogin(user);
    } else {
      alert('Usuario no encontrado en la demo. Usa los botones rápidos abajo.');
    }
  };

  const quickLogin = (user: User) => {
    setEmail(user.email);
    setPassword('password123'); // Dummy fill
    setTimeout(() => onLogin(user), 300); // Small delay for effect
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Left Side: Brand & Visual */}
        <div className="md:w-1/2 bg-indigo-600 p-12 flex flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 to-purple-700 opacity-90 z-10"></div>
          <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl z-0"></div>
          <div className="absolute top-12 right-12 w-32 h-32 bg-purple-400 opacity-20 rounded-full blur-2xl z-0"></div>
          
          <div className="relative z-20">
            <div className="flex items-center gap-3 mb-8">
              <LayoutGrid className="w-8 h-8" />
              <h1 className="text-2xl font-bold tracking-tight">TradeFlow SaaS</h1>
            </div>
            <p className="text-indigo-100 text-lg leading-relaxed mb-6">
              La plataforma definitiva para gestionar manufactura, importación y comercio mayorista en un solo lugar.
            </p>
          </div>

          <div className="relative z-20 text-sm text-indigo-200">
            &copy; 2024 TradeFlow Systems. Enterprise Edition.
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="md:w-1/2 p-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Bienvenido</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Ingresa a tu cuenta administrativa</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Correo Electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  placeholder="nombre@empresa.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center gap-2"
            >
              Iniciar Sesión <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Quick Access Keys */}
          <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-center mb-4">
              Accesos Rápidos (Demo Keys)
            </p>
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => quickLogin(DEMO_USERS[0])}
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border border-gray-200 dark:border-gray-600 transition-all group"
                >
                    <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 mb-1" />
                    <div className="font-bold text-xs text-gray-900 dark:text-white">Master Admin</div>
                </button>
                <button 
                    onClick={() => quickLogin(DEMO_USERS[1])}
                    className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-teal-50 dark:hover:bg-teal-900/20 border border-gray-200 dark:border-gray-600 transition-all group"
                >
                    <UserPlus className="w-5 h-5 text-teal-600 dark:text-teal-400 mb-1" />
                    <div className="font-bold text-xs text-gray-900 dark:text-white">Onboarding Admin</div>
                </button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  onClick={() => quickLogin(DEMO_USERS[2])}
                  className="flex flex-col items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-orange-50 dark:hover:bg-orange-900/20 border border-gray-200 dark:border-gray-600 transition-all group text-center"
                >
                  <UserIcon className="w-5 h-5 text-orange-500 mb-2" />
                  <div className="font-bold text-xs text-gray-900 dark:text-white">Tenant: Manufactura</div>
                  <div className="text-[10px] text-gray-500">Global Textiles</div>
                </button>

                <button 
                  onClick={() => quickLogin(DEMO_USERS[3])}
                  className="flex flex-col items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-gray-200 dark:border-gray-600 transition-all group text-center"
                >
                  <UserIcon className="w-5 h-5 text-blue-500 mb-2" />
                  <div className="font-bold text-xs text-gray-900 dark:text-white">Tenant: Trader</div>
                  <div className="text-[10px] text-gray-500">Urban Imports</div>
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
