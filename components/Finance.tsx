
import React, { useState } from 'react';
import { Order, Invoice, INITIAL_CUSTOMERS } from '../types';
import { FileText, Download, DollarSign, Clock, AlertCircle, CheckCircle, Mail, Phone, Loader2, Sparkles, MessageCircle, X, AlertTriangle } from 'lucide-react';
import { generateCollectionsMessage } from '../services/geminiService';

interface FinanceProps {
    orders: Order[];
}

export const Finance: React.FC<FinanceProps> = ({ orders }) => {
    const [generatingId, setGeneratingId] = useState<string | null>(null);
    const [generatedMessage, setGeneratedMessage] = useState<string | null>(null);
    const [activeInvoiceForMsg, setActiveInvoiceForMsg] = useState<Invoice | null>(null);

    // Sync invoices with Order status
    const invoices: Invoice[] = orders.map((order, idx) => ({
        id: `INV-${order.id.split('-')[2]}-${idx}`,
        orderId: order.id,
        customerId: order.customerId,
        customerName: order.customerName,
        amount: order.totalAmount,
        issueDate: order.date,
        dueDate: order.dueDate || new Date(new Date(order.date).setDate(new Date(order.date).getDate() + 30)).toISOString().split('T')[0],
        status: order.paymentStatus
    }));

    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const pendingAmount = invoices.filter(i => i.status === 'PENDING').reduce((sum, inv) => sum + inv.amount, 0);
    const overdueAmount = invoices.filter(i => i.status === 'OVERDUE').reduce((sum, inv) => sum + inv.amount, 0);

    const overdueInvoices = invoices.filter(i => i.status === 'OVERDUE');

    // Calculate days remaining or overdue
    const getDaysDiff = (dateStr: string) => {
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    };

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'PAID': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
            case 'PENDING': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
            case 'OVERDUE': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const handleDownload = (id: string) => {
        alert(`Descargando PDF Factura ${id}... (Simulación)`);
    };

    const handleGenerateReminder = async (invoice: Invoice) => {
        setGeneratingId(invoice.id);
        setActiveInvoiceForMsg(invoice);
        
        // Overdue Days = Today - DueDate
        const overdueDays = Math.ceil((new Date().getTime() - new Date(invoice.dueDate).getTime()) / (1000 * 3600 * 24));

        const msg = await generateCollectionsMessage(invoice.customerName, invoice.amount, overdueDays, invoice.id);
        
        setGeneratedMessage(msg);
        setGeneratingId(null);
    };

    const sendEmail = () => {
        window.open(`mailto:?subject=Recordatorio de Pago - Factura ${activeInvoiceForMsg?.id}&body=${encodeURIComponent(generatedMessage || '')}`);
    };

    const sendWhatsApp = () => {
        window.open(`https://wa.me/?text=${encodeURIComponent(generatedMessage || '')}`);
    };

    // Helper to check customer contact info
    const getCustomerContactStatus = (customerId: string) => {
        const customer = INITIAL_CUSTOMERS.find(c => c.id === customerId);
        if (!customer) return { hasEmail: false, hasWhatsapp: false };
        
        return {
            hasEmail: customer.contactMethods.includes('EMAIL') && !!customer.email,
            hasWhatsapp: customer.contactMethods.includes('WHATSAPP') && !!customer.phone
        };
    };

    const activeCustomerStatus = activeInvoiceForMsg ? getCustomerContactStatus(activeInvoiceForMsg.customerId) : { hasEmail: false, hasWhatsapp: false };

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
             <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Finanzas & Cobranza
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Control de facturas, flujo de caja y gestión de crédito.</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-50 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Facturación Total</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">${totalRevenue.toLocaleString()}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                     <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                            <Clock className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-medium text-gray-500 uppercase">Por Cobrar (Vigente)</span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">${pendingAmount.toLocaleString()}</p>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 border-l-4 border-l-red-500">
                     <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-red-50 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <span className="text-xs font-bold text-red-500 uppercase">Vencido / Riesgo</span>
                    </div>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">${overdueAmount.toLocaleString()}</p>
                </div>
            </div>

            {/* AI Collections Agent */}
            {overdueInvoices.length > 0 && (
                <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-red-800 dark:text-red-300 flex items-center gap-2 mb-4">
                        <AlertCircle className="w-5 h-5" /> Alertas de Cobranza (Acción Requerida)
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {overdueInvoices.map(inv => {
                            const daysOver = Math.abs(getDaysDiff(inv.dueDate));
                            const contactStatus = getCustomerContactStatus(inv.customerId);
                            const missingAny = !contactStatus.hasEmail || !contactStatus.hasWhatsapp;

                            return (
                                <div key={inv.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-red-100 dark:border-red-900/30 flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            {inv.customerName}
                                            {missingAny && (
                                                <span className="flex gap-1" title="Faltan métodos de contacto">
                                                    {!contactStatus.hasEmail && <Mail className="w-3 h-3 text-red-400 opacity-50" />}
                                                    {!contactStatus.hasWhatsapp && <MessageCircle className="w-3 h-3 text-red-400 opacity-50" />}
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-sm text-gray-500">Factura {inv.id} - <span className="font-medium text-red-600">${inv.amount.toLocaleString()}</span></p>
                                        <p className="text-xs text-red-500 font-bold mt-1">Vencida hace {daysOver} días</p>
                                    </div>
                                    <div className="flex gap-2 items-center">
                                        {/* Contact Method Indicators */}
                                        <div className="flex gap-1 mr-2 border-r border-gray-200 dark:border-gray-700 pr-2">
                                            {contactStatus.hasEmail ? 
                                                <Mail className="w-4 h-4 text-green-500" title="Email disponible" /> : 
                                                <AlertTriangle className="w-4 h-4 text-red-400" title="Sin Email" />
                                            }
                                            {contactStatus.hasWhatsapp ? 
                                                <MessageCircle className="w-4 h-4 text-green-500" title="WhatsApp disponible" /> : 
                                                <AlertTriangle className="w-4 h-4 text-red-400" title="Sin WhatsApp" />
                                            }
                                        </div>

                                        <button 
                                            onClick={() => handleGenerateReminder(inv)}
                                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded text-xs font-medium flex items-center gap-1 hover:bg-indigo-100 transition-colors"
                                        >
                                            {generatingId === inv.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                            IA Recordatorio
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Generated Message Modal */}
            {generatedMessage && activeInvoiceForMsg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in duration-200">
                        <button 
                            onClick={() => { setGeneratedMessage(null); setActiveInvoiceForMsg(null); }}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-indigo-500" /> Mensaje Generado
                        </h3>
                        
                        <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 mb-6">
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                                {generatedMessage}
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button 
                                onClick={sendEmail}
                                disabled={!activeCustomerStatus.hasEmail}
                                className="flex-1 py-2 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={!activeCustomerStatus.hasEmail ? "Email no registrado" : "Enviar Email"}
                            >
                                {activeCustomerStatus.hasEmail ? <Mail className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />} 
                                {activeCustomerStatus.hasEmail ? "Enviar Email" : "Sin Email"}
                            </button>
                            <button 
                                onClick={sendWhatsApp}
                                disabled={!activeCustomerStatus.hasWhatsapp}
                                className="flex-1 py-2 bg-green-50 text-green-600 rounded-lg flex items-center justify-center gap-2 hover:bg-green-100 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                title={!activeCustomerStatus.hasWhatsapp ? "WhatsApp no registrado" : "Enviar WhatsApp"}
                            >
                                {activeCustomerStatus.hasWhatsapp ? <MessageCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                                {activeCustomerStatus.hasWhatsapp ? "WhatsApp" : "Sin Phone"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Invoice List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="font-bold text-gray-800 dark:text-white">Todas las Facturas</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-medium">
                            <tr>
                                <th className="px-6 py-3">Factura #</th>
                                <th className="px-6 py-3">Cliente</th>
                                <th className="px-6 py-3">Emisión</th>
                                <th className="px-6 py-3">Vencimiento</th>
                                <th className="px-6 py-3">Monto</th>
                                <th className="px-6 py-3">Estado</th>
                                <th className="px-6 py-3 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {invoices.map(inv => {
                                const isApproaching = getDaysDiff(inv.dueDate) <= 5 && getDaysDiff(inv.dueDate) > 0 && inv.status === 'PENDING';
                                return (
                                <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{inv.id}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{inv.customerName}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{inv.issueDate}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                                        {inv.dueDate}
                                        {isApproaching && <span className="ml-2 text-[10px] text-yellow-600 bg-yellow-100 px-1 rounded">Próximo</span>}
                                    </td>
                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">${inv.amount.toFixed(2)}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase ${getStatusStyle(inv.status)}`}>
                                            {inv.status === 'PENDING' ? 'Pendiente' : inv.status === 'PAID' ? 'Pagado' : 'Vencido'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        {inv.status !== 'PAID' && (
                                            <button 
                                                onClick={() => handleGenerateReminder(inv)}
                                                className="text-gray-400 hover:text-indigo-600 transition-colors"
                                                title="Enviar Recordatorio de Pago"
                                            >
                                                <Mail className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => handleDownload(inv.id)}
                                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                                        >
                                            <FileText className="w-4 h-4" /> PDF
                                        </button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
