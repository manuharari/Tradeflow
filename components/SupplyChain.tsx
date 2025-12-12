
import React, { useState } from 'react';
import { SupplyOrder, Product, SupplyType, SupplyStatus, SupplyAttachment } from '../types';
import { Truck, Factory, Plus, Calendar, DollarSign, CheckCircle, Clock, X, Package, ArrowRight, Upload, Image as ImageIcon, AlertTriangle, Eye, Paperclip, Sparkles, Loader2, ScanLine, FileSearch, LineChart, ShieldCheck } from 'lucide-react';
import { analyzeQualityControlImage, QualityAnalysisResult, parseInvoiceDocument, generateDemandForecast, DemandForecast } from '../services/geminiService';

interface SupplyChainProps {
    supplyOrders: SupplyOrder[];
    setSupplyOrders: React.Dispatch<React.SetStateAction<SupplyOrder[]>>; // Needed for updating attachments
    products: Product[];
    onCreateOrder: (order: SupplyOrder) => void;
    onUpdateStatus: (orderId: string, status: SupplyStatus) => void;
    onQualityIssueDetected?: (orderId: string, issue: string) => void;
}

export const SupplyChain: React.FC<SupplyChainProps> = ({ supplyOrders, setSupplyOrders, products, onCreateOrder, onUpdateStatus, onQualityIssueDetected }) => {
    const [activeTab, setActiveTab] = useState<SupplyType>('PURCHASE_ORDER');
    const [showCreateModal, setShowCreateModal] = useState(false);
    
    // Attachment Modal State
    const [selectedOrderForAttachments, setSelectedOrderForAttachments] = useState<SupplyOrder | null>(null);

    // AI Analysis State
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [analysisResults, setAnalysisResults] = useState<Record<string, QualityAnalysisResult>>({});
    
    // Forecasting State
    const [showForecast, setShowForecast] = useState(false);
    const [isForecasting, setIsForecasting] = useState(false);
    const [forecastData, setForecastData] = useState<DemandForecast[]>([]);

    // Create Form State
    const [selectedProductId, setSelectedProductId] = useState('');
    const [quantity, setQuantity] = useState(0);
    const [costPerUnit, setCostPerUnit] = useState(0);
    const [shippingCost, setShippingCost] = useState(0);
    const [insuranceCost, setInsuranceCost] = useState(0);
    const [supplierName, setSupplierName] = useState('');
    const [eta, setEta] = useState('');
    const [tracking, setTracking] = useState('');
    const [isScanningInvoice, setIsScanningInvoice] = useState(false);
    
    // New: Design Attachments for New Order
    const [newOrderAttachments, setNewOrderAttachments] = useState<SupplyAttachment[]>([]);

    const filteredOrders = supplyOrders.filter(o => o.type === activeTab);

    // Helpers
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'NEW_ORDER' | 'EXISTING_ORDER', type: 'DESIGN' | 'PRODUCTION_PROGRESS' | 'QUALITY_ALERT' | 'INVOICE' = 'DESIGN') => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        const reader = new FileReader();
        
        reader.onloadend = async () => {
            const newAtt: SupplyAttachment = {
                id: Date.now().toString(),
                url: reader.result as string,
                type: type,
                date: new Date().toISOString().split('T')[0],
                note: file.name
            };

            if (target === 'NEW_ORDER') {
                setNewOrderAttachments(prev => [...prev, newAtt]);
            } else if (target === 'EXISTING_ORDER' && selectedOrderForAttachments) {
                // Update local state for modal
                const updatedOrder = {
                    ...selectedOrderForAttachments,
                    attachments: [...selectedOrderForAttachments.attachments, newAtt]
                };
                setSelectedOrderForAttachments(updatedOrder);

                // Update global state
                setSupplyOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));

                // AUTO-ANALYZE for Quality Control
                if (type === 'PRODUCTION_PROGRESS' || type === 'QUALITY_ALERT') {
                    setAnalyzingId(newAtt.id);
                    // Find product to get context
                    const product = products.find(p => p.id === selectedOrderForAttachments.productId);
                    const result = await analyzeQualityControlImage(reader.result as string, product?.qualityStandards);
                    
                    setAnalysisResults(prev => ({...prev, [newAtt.id]: result}));
                    setAnalyzingId(null);

                    // Alert if issue detected
                    if ((result.status === 'FAIL' || result.status === 'WARNING') && onQualityIssueDetected) {
                        onQualityIssueDetected(selectedOrderForAttachments.id, result.reason);
                    }
                }
            }
        };
        reader.readAsDataURL(file);
    };

    const handleSmartScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setIsScanningInvoice(true);
        
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64 = reader.result as string;
            
            // 1. Add as attachment
            const newAtt: SupplyAttachment = {
                id: Date.now().toString(),
                url: base64,
                type: 'INVOICE',
                date: new Date().toISOString().split('T')[0],
                note: 'Factura Escaneada (Smart Scan)'
            };
            setNewOrderAttachments(prev => [...prev, newAtt]);

            // 2. Process with Gemini
            const data = await parseInvoiceDocument(base64);
            
            if (data.supplierName) setSupplierName(data.supplierName);
            if (data.totalAmount) {
                // Heuristic: If we don't know quantity, set cost to total, assume qty 1 for user to fix
                if (quantity > 0) {
                     setCostPerUnit(data.totalAmount / quantity);
                } else {
                     setCostPerUnit(data.totalAmount);
                     setQuantity(1);
                }
            }
            if (data.date) setEta(data.date); // Often invoice date implies shipping date

            setIsScanningInvoice(false);
        };
        reader.readAsDataURL(file);
    };

    const runDemandForecast = async () => {
        setIsForecasting(true);
        setShowForecast(true);
        const results = await generateDemandForecast(products, []); // Mock sales history
        setForecastData(results);
        setIsForecasting(false);
    };

    const handleAIAnalysis = async (att: SupplyAttachment) => {
        if (!selectedOrderForAttachments) return;
        setAnalyzingId(att.id);
        const product = products.find(p => p.id === selectedOrderForAttachments.productId);
        const result = await analyzeQualityControlImage(att.url, product?.qualityStandards);
        setAnalysisResults(prev => ({...prev, [att.id]: result}));
        setAnalyzingId(null);
    };

    const handleCreate = () => {
        const product = products.find(p => p.id === selectedProductId);
        if (!product) return;
        
        const subtotal = Number(quantity) * Number(costPerUnit);
        const total = subtotal + Number(shippingCost) + Number(insuranceCost);

        const newOrder: SupplyOrder = {
            id: `SUP-${Date.now()}`,
            type: activeTab,
            productId: product.id,
            productName: product.name,
            quantity: Number(quantity),
            costPerUnit: Number(costPerUnit),
            totalCost: total,
            supplierOrFacility: supplierName,
            orderDate: new Date().toISOString().split('T')[0],
            expectedArrivalDate: eta,
            status: activeTab === 'PRODUCTION_ORDER' ? 'IN_PRODUCTION' : 'ORDERED',
            trackingNumber: tracking,
            attachments: newOrderAttachments,
            shippingCost: Number(shippingCost),
            insuranceCost: Number(insuranceCost)
        };

        onCreateOrder(newOrder);
        setShowCreateModal(false);
        // Reset form
        setSelectedProductId('');
        setQuantity(0);
        setCostPerUnit(0);
        setShippingCost(0);
        setInsuranceCost(0);
        setSupplierName('');
        setEta('');
        setTracking('');
        setNewOrderAttachments([]);
    };

    const getStatusColor = (status: SupplyStatus) => {
        switch (status) {
            case 'DRAFT': return 'bg-gray-100 text-gray-600';
            case 'ORDERED': return 'bg-blue-100 text-blue-700';
            case 'IN_TRANSIT': return 'bg-yellow-100 text-yellow-700';
            case 'IN_PRODUCTION': return 'bg-orange-100 text-orange-700';
            case 'RECEIVED':
            case 'FINISHED': return 'bg-green-100 text-green-700';
            case 'CANCELLED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Cadena de Suministro</h1>
                    <p className="text-gray-500 dark:text-gray-400">Gestione compras de material, importaciones y órdenes de producción.</p>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={runDemandForecast}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-purple-700 transition-colors shadow-sm"
                    >
                        <LineChart className="w-4 h-4" /> Predicción IA
                    </button>
                    <button 
                        onClick={() => setShowCreateModal(true)}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" /> 
                        {activeTab === 'PURCHASE_ORDER' ? 'Nueva Compra' : 'Nueva Orden Producción'}
                    </button>
                </div>
            </div>

            {/* Forecast Panel */}
            {showForecast && (
                <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-6 mb-4 animate-in fade-in slide-in-from-top-2 relative">
                     <button onClick={() => setShowForecast(false)} className="absolute top-4 right-4 text-purple-400 hover:text-purple-600">
                         <X className="w-5 h-5" />
                     </button>
                     <h3 className="text-lg font-bold text-purple-900 dark:text-purple-200 flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5" /> Pronóstico de Demanda Inteligente
                     </h3>
                     
                     {isForecasting ? (
                         <div className="flex items-center gap-3 text-purple-600 dark:text-purple-300 py-8 justify-center">
                             <Loader2 className="w-6 h-6 animate-spin" />
                             Analizando tendencias históricas e inventario...
                         </div>
                     ) : (
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {forecastData.map((item, idx) => (
                                 <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border border-purple-100 dark:border-gray-700">
                                     <div className="flex justify-between items-start mb-2">
                                         <span className="font-bold text-gray-800 dark:text-white">{item.productName}</span>
                                         <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full font-bold">Riesgo Alto</span>
                                     </div>
                                     <div className="text-sm space-y-1 mb-3">
                                         <p className="text-gray-500 dark:text-gray-400">Demanda Estimada: <span className="font-medium text-gray-900 dark:text-white">{item.predictedDemand}</span></p>
                                         <p className="text-gray-500 dark:text-gray-400">Reorden Sugerido: <span className="font-bold text-indigo-600 dark:text-indigo-400">{item.suggestedReorder}</span></p>
                                     </div>
                                     <p className="text-xs text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/30 p-2 rounded">
                                         💡 {item.reasoning}
                                     </p>
                                     <button 
                                        onClick={() => {
                                            setSelectedProductId(item.productId);
                                            setQuantity(item.suggestedReorder);
                                            setShowForecast(false);
                                            setShowCreateModal(true);
                                        }}
                                        className="w-full mt-3 py-1.5 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                                     >
                                         Crear Orden Automática
                                     </button>
                                 </div>
                             ))}
                             {forecastData.length === 0 && (
                                 <p className="col-span-3 text-center text-gray-500 italic">Todo parece estar bajo control. No se detectan riesgos inminentes.</p>
                             )}
                         </div>
                     )}
                </div>
            )}

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-700">
                <div className="flex gap-6">
                    <button 
                        onClick={() => setActiveTab('PURCHASE_ORDER')}
                        className={`pb-4 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'PURCHASE_ORDER' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <Truck className="w-4 h-4" /> Importaciones / Compras
                    </button>
                    <button 
                        onClick={() => setActiveTab('PRODUCTION_ORDER')}
                        className={`pb-4 flex items-center gap-2 font-medium text-sm transition-colors border-b-2 ${activeTab === 'PRODUCTION_ORDER' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        <Factory className="w-4 h-4" /> Producción / Manufactura
                    </button>
                </div>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                        <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No hay órdenes activas en esta sección.</p>
                    </div>
                ) : (
                    filteredOrders.map(order => (
                        <div key={order.id} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${getStatusColor(order.status)}`}>
                                        {order.status.replace('_', ' ')}
                                    </span>
                                    <span className="text-xs text-gray-400">#{order.id}</span>
                                </div>
                                <h3 className="font-bold text-gray-900 dark:text-white text-lg">{order.productName}</h3>
                                <div className="flex flex-wrap gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                                    <div className="flex items-center gap-1">
                                        <Package className="w-4 h-4" /> Cantidad: <span className="font-medium text-gray-900 dark:text-white">{order.quantity}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Factory className="w-4 h-4" /> {activeTab === 'PURCHASE_ORDER' ? 'Proveedor' : 'Planta'}: <span className="font-medium text-gray-900 dark:text-white">{order.supplierOrFacility}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Calendar className="w-4 h-4" /> Llegada Est: <span className="font-medium text-gray-900 dark:text-white">{order.expectedArrivalDate || 'N/A'}</span>
                                    </div>
                                    {order.attachments.length > 0 && (
                                        <div className="flex items-center gap-1 text-indigo-600 dark:text-indigo-400">
                                            <Paperclip className="w-4 h-4" /> {order.attachments.length} Archivos
                                        </div>
                                    )}
                                </div>
                                {order.trackingNumber && (
                                    <div className="mt-2 text-xs bg-gray-50 dark:bg-gray-700 inline-block px-2 py-1 rounded text-gray-600 dark:text-gray-300">
                                        Tracking: {order.trackingNumber}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-end gap-2 min-w-[150px]">
                                <div className="text-right mb-2">
                                    <p className="text-xs text-gray-400 uppercase">Costo Total</p>
                                    <p className="font-bold text-lg text-gray-900 dark:text-white">${order.totalCost.toLocaleString()}</p>
                                    {(order.shippingCost || 0) > 0 && <span className="text-[10px] text-gray-400">Inc. envío/seguro</span>}
                                </div>
                                
                                <div className="flex gap-2">
                                    {/* Action: View/Add Photos */}
                                    <button 
                                        onClick={() => setSelectedOrderForAttachments(order)}
                                        className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-1"
                                        title="Ver o adjuntar fotos de diseño/progreso"
                                    >
                                        <ImageIcon className="w-3 h-3" /> Fotos
                                    </button>

                                    {/* Action: Status Update */}
                                    {order.status === 'ORDERED' && (
                                        <button 
                                            onClick={() => onUpdateStatus(order.id, 'IN_TRANSIT')}
                                            className="px-3 py-1.5 bg-yellow-50 text-yellow-700 text-xs font-medium rounded-lg hover:bg-yellow-100 flex items-center gap-1"
                                        >
                                            En Tránsito <ArrowRight className="w-3 h-3" />
                                        </button>
                                    )}
                                    {(order.status === 'IN_TRANSIT' || order.status === 'IN_PRODUCTION') && (
                                        <button 
                                            onClick={() => onUpdateStatus(order.id, activeTab === 'PURCHASE_ORDER' ? 'RECEIVED' : 'FINISHED')}
                                            className="px-3 py-1.5 bg-green-600 text-white text-xs font-medium rounded-lg hover:bg-green-700 flex items-center gap-1 shadow-sm"
                                        >
                                            <CheckCircle className="w-3 h-3" /> 
                                            {activeTab === 'PURCHASE_ORDER' ? 'Recibir' : 'Finalizar'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                        <button 
                            onClick={() => setShowCreateModal(false)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            {activeTab === 'PURCHASE_ORDER' ? 'Crear Orden de Compra' : 'Planificar Producción'}
                        </h3>
                        
                        {/* Smart Scan Feature */}
                        <div className="mb-6 p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-dashed border-indigo-200 dark:border-indigo-700 rounded-xl">
                            <label className="flex items-center justify-between cursor-pointer">
                                <div>
                                    <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
                                        <ScanLine className="w-4 h-4" /> Escaneo Inteligente (OCR)
                                    </p>
                                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">
                                        Suba una factura o cotización para autocompletar.
                                    </p>
                                </div>
                                <div className="bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white px-3 py-1.5 rounded shadow-sm text-xs font-medium flex items-center gap-2">
                                     {isScanningInvoice ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                                     {isScanningInvoice ? 'Analizando...' : 'Subir Archivo'}
                                </div>
                                <input type="file" className="hidden" accept="image/*" onChange={handleSmartScan} />
                            </label>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Producto / Material</label>
                                <select 
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:text-white"
                                    value={selectedProductId}
                                    onChange={(e) => setSelectedProductId(e.target.value)}
                                >
                                    <option value="">Seleccionar Item...</option>
                                    {products.map(p => (
                                        <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad</label>
                                    <input 
                                        type="number" 
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                                        value={quantity}
                                        onChange={(e) => setQuantity(Number(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Costo Unitario ($)</label>
                                    <input 
                                        type="number" 
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                                        value={costPerUnit}
                                        onChange={(e) => setCostPerUnit(Number(e.target.value))}
                                    />
                                </div>
                            </div>
                            
                            {/* Shipping and Insurance */}
                            <div className="grid grid-cols-2 gap-4 bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Costo Envío ($)</label>
                                    <div className="relative">
                                        <Truck className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                                        <input 
                                            type="number" 
                                            min="0"
                                            className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
                                            value={shippingCost}
                                            onChange={(e) => setShippingCost(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Seguro ($)</label>
                                    <div className="relative">
                                        <ShieldCheck className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                                        <input 
                                            type="number" 
                                            min="0"
                                            className="w-full pl-7 pr-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 dark:text-white"
                                            value={insuranceCost}
                                            onChange={(e) => setInsuranceCost(Number(e.target.value))}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    {activeTab === 'PURCHASE_ORDER' ? 'Proveedor' : 'Planta / Taller'}
                                </label>
                                <input 
                                    type="text" 
                                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                                    value={supplierName}
                                    onChange={(e) => setSupplierName(e.target.value)}
                                    placeholder={activeTab === 'PURCHASE_ORDER' ? 'Ej. Textiles S.A.' : 'Ej. Planta Norte'}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha Llegada (Est.)</label>
                                    <input 
                                        type="date" 
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                                        value={eta}
                                        onChange={(e) => setEta(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tracking / Lote</label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 dark:bg-gray-700 dark:text-white"
                                        value={tracking}
                                        onChange={(e) => setTracking(e.target.value)}
                                        placeholder="Opcional"
                                    />
                                </div>
                            </div>
                            
                            {/* Design Specs Uploader */}
                            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Adjuntos (Diseño, Facturas)</label>
                                <div className="flex gap-2 overflow-x-auto mb-2">
                                    {newOrderAttachments.map((att, idx) => (
                                        <img key={idx} src={att.url} alt="preview" className="w-16 h-16 object-cover rounded border" />
                                    ))}
                                </div>
                                <label className="flex items-center gap-2 cursor-pointer text-indigo-600 dark:text-indigo-400 text-sm font-medium hover:underline">
                                    <Upload className="w-4 h-4" /> Subir Archivo Manual
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'NEW_ORDER', 'DESIGN')} />
                                </label>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button 
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleCreate}
                                    disabled={!selectedProductId || quantity <= 0}
                                    className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    Confirmar (${((quantity * costPerUnit) + shippingCost + insuranceCost).toLocaleString()})
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Evidence/Photos Modal */}
            {selectedOrderForAttachments && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 relative animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <button 
                            onClick={() => setSelectedOrderForAttachments(null)}
                            className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
                            <ImageIcon className="w-5 h-5 text-indigo-600" /> Evidencia Fotográfica
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">Orden #{selectedOrderForAttachments.id} - {selectedOrderForAttachments.productName}</p>

                        <div className="flex-1 overflow-y-auto min-h-0 mb-4 bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                             {selectedOrderForAttachments.attachments.length === 0 ? (
                                 <div className="text-center py-10 text-gray-400">
                                     <Eye className="w-10 h-10 mx-auto mb-2 opacity-30" />
                                     <p>No hay fotos adjuntas a esta orden.</p>
                                 </div>
                             ) : (
                                 <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                     {selectedOrderForAttachments.attachments.map(att => {
                                         const analysis = analysisResults[att.id];
                                         const isAnalyzing = analyzingId === att.id;

                                         return (
                                         <div key={att.id} className="relative group bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                                             <img src={att.url} alt="attachment" className="w-full h-32 object-cover" />
                                             <div className="absolute top-2 left-2 flex gap-1">
                                                 <span className={`text-[10px] text-white px-2 py-1 rounded font-bold shadow-sm ${att.type === 'QUALITY_ALERT' ? 'bg-red-500' : 'bg-indigo-500'}`}>
                                                     {att.type === 'DESIGN' ? 'DISEÑO' : att.type === 'PRODUCTION_PROGRESS' ? 'PROGRESO' : att.type === 'INVOICE' ? 'FACTURA' : 'CALIDAD'}
                                                 </span>
                                             </div>
                                             
                                             <div className="p-2">
                                                 <p className="text-xs text-gray-500 dark:text-gray-300 truncate mb-2">{att.note}</p>
                                                 
                                                 {!analysis ? (
                                                     <button 
                                                        onClick={() => handleAIAnalysis(att)}
                                                        disabled={isAnalyzing}
                                                        className="w-full text-xs flex items-center justify-center gap-1 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                                                     >
                                                        {isAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                                        {isAnalyzing ? 'Analizando...' : 'Analizar con IA'}
                                                     </button>
                                                 ) : (
                                                     <div className={`p-2 rounded text-[10px] ${analysis.status === 'PASS' ? 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300' : analysis.status === 'FAIL' ? 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'}`}>
                                                         <div className="font-bold mb-0.5">{analysis.status === 'PASS' ? 'APROBADO' : analysis.status === 'FAIL' ? 'RECHAZADO' : 'ADVERTENCIA'}</div>
                                                         <div className="leading-tight opacity-90">{analysis.reason}</div>
                                                     </div>
                                                 )}
                                             </div>
                                         </div>
                                     )})}
                                 </div>
                             )}
                        </div>
                        
                        <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                            <h4 className="text-sm font-semibold text-gray-800 dark:text-white mb-3">Agregar Nueva Evidencia</h4>
                            <div className="flex gap-3">
                                <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <ImageIcon className="w-6 h-6 text-indigo-500 mb-1" />
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Foto de Progreso</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'EXISTING_ORDER', 'PRODUCTION_PROGRESS')} />
                                </label>
                                
                                <label className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-red-200 dark:border-red-900/50 rounded-lg p-4 cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                    <AlertTriangle className="w-6 h-6 text-red-500 mb-1" />
                                    <span className="text-xs font-medium text-gray-600 dark:text-gray-300">Alerta Calidad</span>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'EXISTING_ORDER', 'QUALITY_ALERT')} />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
