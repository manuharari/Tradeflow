
import React from 'react';
import { INITIAL_CUSTOMERS } from '../types';
import { Mail, Phone, Building, MoreHorizontal, UserCheck, UserX, Clock, DollarSign } from 'lucide-react';

// Translation helper for status
const getStatusLabel = (status: string) => {
  switch(status) {
    case 'Active': return 'Activo';
    case 'Prospect': return 'Prospecto';
    case 'Inactive': return 'Inactivo';
    default: return status;
  }
};

export const CRM: React.FC = () => {
  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relaciones con Clientes</h1>
          <p className="text-gray-500 dark:text-gray-400">Gestione prospectos, clientes e interacciones.</p>
        </div>
        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-sm hover:bg-indigo-700 transition-colors">
            Nuevo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {INITIAL_CUSTOMERS.map((customer) => (
          <div key={customer.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-colors">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white
                ${customer.status === 'Active' ? 'bg-green-500' : customer.status === 'Prospect' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                {customer.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {customer.name}
                  <span className={`px-2 py-0.5 text-xs rounded-full border
                    ${customer.status === 'Active' ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800' : 
                      customer.status === 'Prospect' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800' : 
                      'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}>
                    {getStatusLabel(customer.status)}
                  </span>
                </h3>
                <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                  <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {customer.company}</span>
                  <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {customer.email}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 w-full md:w-auto border-t md:border-t-0 border-gray-100 dark:border-gray-700 pt-4 md:pt-0 mt-2 md:mt-0">
                <div className="text-center md:text-right">
                    <div className="text-xs text-gray-400 uppercase font-medium">DEUDA PENDIENTE</div>
                    <div className={`font-bold ${customer.outstandingBalance > 0 ? 'text-red-500' : 'text-green-600 dark:text-green-400'}`}>
                        ${customer.outstandingBalance.toLocaleString()}
                    </div>
                </div>
                <div className="text-center md:text-right">
                    <div className="text-xs text-gray-400 uppercase font-medium">CONSUMO TOTAL</div>
                    <div className="font-bold text-gray-900 dark:text-white">${customer.totalSpend.toLocaleString()}</div>
                </div>
                <div className="text-center md:text-right">
                    <div className="text-xs text-gray-400 uppercase font-medium">ÚLTIMO PEDIDO</div>
                    <div className="font-medium text-gray-700 dark:text-gray-300">{customer.lastOrderDate}</div>
                </div>
                <div className="flex gap-2">
                    <button className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors">
                        <Mail className="w-5 h-5" />
                    </button>
                     <button className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
