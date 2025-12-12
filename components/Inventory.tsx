
import React, { useState } from 'react';
import { BusinessMode, Product } from '../types';
import { Plus, Search, TrendingUp, TrendingDown, QrCode, X, AlertTriangle, RefreshCw, Minus, Edit, Package, Layers, Hash, Check, Factory, Ship, ShieldCheck, ScanLine } from 'lucide-react';
import QRCode from 'react-qr-code';
import { QRScanner } from './QRScanner';

interface InventoryProps {
    businessMode: BusinessMode;
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const Inventory: React.FC<InventoryProps> = ({ businessMode, products, setProducts }) => {
  const [search, setSearch] = useState('');
  const [selectedQrProduct, setSelectedQrProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [creatingPackFor, setCreatingPackFor] = useState<Product | null>(null);
  
  // Audit/Adjust State
  const [isAuditMode, setIsAuditMode] = useState(false);
  const [auditCount, setAuditCount] = useState<string>('');
  
  // Quick Adjust Temp State
  const [tempStockValue, setTempStockValue] = useState<number>(0);
  
  // Camera Scanner State
  const [showScanner, setShowScanner] = useState(false);

  // Pack Creation State
  const [packName, setPackName] = useState('');
  const [isOneSizePack, setIsOneSizePack] = useState(false);
  const [packAvailableSizes, setPackAvailableSizes] = useState<string[]>([]);
  const [packDistribution, setPackDistribution] = useState<Record<string, number>>({});
  const [oneSizeQty, setOneSizeQty] = useState<number>(12);
  const [newSizeInput, setNewSizeInput] = useState('');

  // Check if current products suggest a specific industry
  const isFashionContext = products.some(p => p.sizes && p.sizes.length > 0);

  // Filter products based on the current mode
  const filteredByMode = products.filter(p => {
      if (businessMode === 'GENERAL') return true; 
      if (businessMode === 'MANUFACTURER') return p.originType === 'MANUFACTURED';
      if (businessMode === 'TRADER') return p.originType === 'IMPORTED';
      return true;
  });

  const filteredProducts = filteredByMode.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase()) || 
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const openQrModal = (product: Product) => {
      setSelectedQrProduct(product);
      setAuditCount(product.stock.toString());
      setIsAuditMode(false);
  };

  const openAdjustModal = (product: Product) => {
      setAdjustingProduct(product);
      setTempStockValue(product.stock);
  };

  const handleAuditSubmit = () => {
      if (!selectedQrProduct) return;
      const realCount = parseInt(auditCount);
      
      if (!isNaN(realCount)) {
          setProducts(prev => prev.map(p => 
              p.id === selectedQrProduct.id ? { ...p, stock: realCount } : p
          ));
          setSelectedQrProduct(null);
          setIsAuditMode(false);
      }
  };

  // Only updates local temp state
  const handleManualAdjustment = (delta: number) => {
      setTempStockValue(prev => Math.max(0, prev + delta));
  };

  // Only updates local temp state
  const handleStockInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    setTempStockValue(isNaN(val) ? 0 : Math.max(0, val));
  };

  // Commits the change to global state
  const confirmStockAdjustment = () => {
      if (!adjustingProduct) return;
      setProducts(prev => prev.map(p => 
          p.id === adjustingProduct.id ? { ...p, stock: tempStockValue } : p
      ));
      setAdjustingProduct(null);
  };

  const handleScanSuccess = (decodedText: string) => {
      try {
          const data = JSON.parse(decodedText);
          const productId = data.id;
          
          if (productId) {
              const product = products.find(p => p.id === productId);
              if (product) {
                  setShowScanner(false);
                  openQrModal(product); // Open the audit modal for this product
                  setIsAuditMode(true); // Auto-switch to audit mode
              } else {
                  alert('Producto no encontrado en la base de datos.');
                  setShowScanner(false);
              }
          }
      } catch (e) {
          alert('Código QR inválido. Asegúrese de escanear un código generado por TradeFlow.');
          setShowScanner(false);
      }
  };

  const handleCreateProduct = () => {
      const newProduct: Product = {
          id: Date.now().toString(),
          name: 'Nuevo Producto',
          sku: `NEW-${Math.floor(Math.random() * 1000)}`,
          category: 'General',
          salePrice: 0,
          stock: 0,
          lowStockThreshold: 10,
          costPrice: 0,
          rawMaterialCost: 0,
          laborCost: 0,
          description: '',
          features: [],
          originType: businessMode === 'MANUFACTURER' ? 'MANUFACTURED' : 'IMPORTED',
          supplier: 'Internal',
          packSize: 1,
          qualityStandards: ''
      };
      setEditingProduct(newProduct);
  };

  const handleEditSave = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editingProduct) return;

      setProducts(prev => {
          const exists = prev.find(p => p.id === editingProduct.id);
          if (exists) {
              return prev.map(p => p.id === editingProduct.id ? editingProduct : p);
          } else {
              return [...prev, editingProduct];
          }
      });
      setEditingProduct(null);
  };

  // Pack Logic
  const handleAddSize = () => {
      if (newSizeInput && !packAvailableSizes.includes(newSizeInput)) {
          setPackAvailableSizes([...packAvailableSizes, newSizeInput]);
          setNewSizeInput('');
      }
  };

  const handleCreatePack = () => {
      if (!creatingPackFor) return;

      let totalUnits = 0;
      let distributionDesc = '';

      if (isOneSizePack) {
          totalUnits = oneSizeQty;
          distributionDesc = `Pack x${oneSizeQty} (Estándar/Surtido)`;
      } else {
          // Calculate from distribution
          const distEntries = Object.entries(packDistribution).filter(([_, qty]) => (qty as number) > 0);
          totalUnits = distEntries.reduce((sum, [_, qty]) => sum + (qty as number), 0);
          const parts = distEntries.map(([size, qty]) => `${qty} ${size}`);
          distributionDesc = `Pack x${totalUnits}: ${parts.join(', ')}`;
      }

      if (totalUnits <= 0) return;

      const newPack: Product = {
          ...creatingPackFor,
          id: Date.now().toString(),
          name: packName || `${creatingPackFor.name} (Pack)`,
          sku: `${creatingPackFor.sku}-PK${totalUnits}`,
          salePrice: creatingPackFor.salePrice * totalUnits * 0.9, // 10% discount default
          stock: 0, // Starts at 0
          packSize: totalUnits,
          features: [...creatingPackFor.features, distributionDesc]
      };

      setProducts(prev => [...prev, newPack]);
      setCreatingPackFor(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Inventario {businessMode === 'MANUFACTURER' ? 'Producción' : businessMode === 'TRADER' ? 'Importación' : 'General'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            {businessMode === 'GENERAL' 
                ? 'Vista completa de todo el stock.' 
                : 'Gestión y control de mercancía.'}
          </p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowScanner(true)}
                className="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-900 dark:hover:bg-gray-600 transition-colors shadow-sm"
            >
                <ScanLine className="w-4 h-4" /> Escanear QR
            </button>
            <button 
                onClick={handleCreateProduct}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-sm"
            >
            <Plus className="w-4 h-4" /> Agregar Item
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden transition-colors">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Buscar por nombre o SKU..." 
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 font-medium border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3">Info del Producto</th>
                {businessMode === 'GENERAL' && (
                    <th className="px-6 py-3">Tipo / Origen</th>
                )}
                <th className="px-6 py-3">Costo Total</th>
                <th className="px-6 py-3">Precio Venta ($)</th>
                <th className="px-6 py-3">Margen</th>
                <th className="px-6 py-3 text-right">Stock</th>
                <th className="px-6 py-3 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {filteredProducts.map((product) => {
                
                // Determine Cost Calc Strategy
                let calculatedCost = 0;
                const isManuItem = product.originType === 'MANUFACTURED';
                const isLowStock = product.stock <= product.lowStockThreshold;
                const isPack = (product.packSize || 1) > 1;
                
                if (isManuItem) {
                    calculatedCost = (product.rawMaterialCost || 0) + (product.laborCost || 0);
                } else {
                    const dutyMultiplier = 1 + ((product.importDutyPercent || 0) / 100);
                    calculatedCost = product.costPrice * dutyMultiplier;
                }

                const margin = product.salePrice - calculatedCost;
                const marginPercent = product.salePrice > 0 ? ((margin / product.salePrice) * 100) : 0;
                const isProfitable = margin > 0;

                return (
                  <tr key={product.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 group transition-colors ${isLowStock ? 'bg-red-50 dark:bg-red-900/10' : ''}`}>
                    {/* Product Info */}
                    <td className="px-6 py-4">
                      <div className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                          {product.name}
                          {isLowStock && <AlertTriangle className="w-4 h-4 text-red-500" title="Low Stock Alert" />}
                          {isPack && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">Pack x{product.packSize}</span>}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">SKU: {product.sku}</div>
                      <div className="flex gap-1 mt-1">
                        <span className="inline-block px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full">
                            {product.category}
                        </span>
                      </div>
                    </td>

                    {/* GENERAL COLUMNS */}
                    {businessMode === 'GENERAL' && (
                        <td className="px-6 py-4">
                            <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded ${isManuItem ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'}`}>
                                {isManuItem ? 'Manufactura' : 'Importación'}
                            </span>
                        </td>
                    )}

                    {/* SHARED COLUMNS */}
                    <td className="px-6 py-4 font-bold text-gray-700 dark:text-gray-300">
                        ${calculatedCost.toFixed(2)}
                    </td>

                    <td className="px-6 py-4 text-gray-900 dark:text-white font-medium">
                        ${product.salePrice.toFixed(2)}
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className={`font-medium ${isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {margin < 0 ? '-' : ''}${Math.abs(margin).toFixed(2)}
                        </span>
                        <div className="flex items-center gap-1 text-xs">
                            {isProfitable ? <TrendingUp className="w-3 h-3 text-green-500" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
                            <span className={`${marginPercent < 20 ? 'text-yellow-600 dark:text-yellow-400' : isProfitable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {marginPercent.toFixed(1)}%
                            </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                        <div className={`font-mono font-bold ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400'}`}>
                            {product.stock}
                        </div>
                        {isLowStock && <span className="text-[10px] text-red-500 font-medium">Bajo Stock</span>}
                    </td>

                    <td className="px-6 py-4 text-center">
                        <div className="flex justify-center gap-1">
                             <button 
                                onClick={() => setEditingProduct(product)}
                                className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Editar Producto"
                            >
                                <Edit className="w-4 h-4" />
                            </button>
                             <button 
                                onClick={() => {
                                    setCreatingPackFor(product);
                                    setPackName(`${product.name} Pack`);
                                    setPackAvailableSizes(product.sizes && product.sizes.length > 0 ? product.sizes : ['Standard']);
                                    setPackDistribution({});
                                    setOneSizeQty(12);
                                    setIsOneSizePack(true);
                                }}
                                className="p-2 text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Crear Pack/Bulto"
                            >
                                <Package className="w-4 h-4" />
                            </button>
                             <button 
                                onClick={() => openAdjustModal(product)}
                                className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Ajuste Manual Rápido"
                            >
                                <RefreshCw className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => openQrModal(product)}
                                className="p-2 text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                title="Ver QR / Auditar Stock"
                            >
                                <QrCode className="w-4 h-4" />
                            </button>
                        </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Adjust Modal */}
      {adjustingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in duration-200">
                  <button 
                      onClick={() => setAdjustingProduct(null)}
                      className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                      <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Ajuste Rápido de Stock</h3>
                  
                  <div className="text-center mb-6 flex flex-col items-center">
                      <p className="text-sm text-gray-500 mb-2">{adjustingProduct.name}</p>
                      <input 
                        type="number" 
                        min="0"
                        value={tempStockValue}
                        onChange={handleStockInputChange}
                        className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 text-center w-48 bg-transparent border-b-2 border-indigo-100 dark:border-indigo-900 focus:border-indigo-600 dark:focus:border-indigo-400 outline-none transition-colors"
                      />
                      <p className="text-xs text-gray-400 mt-2">Nuevo Stock (Borrador)</p>
                  </div>

                  <div className="flex gap-4 justify-center mb-6">
                      <button 
                        onClick={() => handleManualAdjustment(-1)}
                        className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                      >
                          <Minus className="w-8 h-8" />
                      </button>
                      <button 
                        onClick={() => handleManualAdjustment(1)}
                        className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                      >
                          <Plus className="w-8 h-8" />
                      </button>
                  </div>

                  <div className="flex gap-2">
                       <button 
                          onClick={() => setAdjustingProduct(null)}
                          className="flex-1 py-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors font-medium"
                       >
                           Cancelar
                       </button>
                       <button 
                          onClick={confirmStockAdjustment}
                          className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 shadow-sm flex items-center justify-center gap-2 font-medium"
                       >
                           <Check className="w-4 h-4" /> Confirmar
                       </button>
                  </div>
              </div>
          </div>
      )}

      {/* Edit/Create Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-2xl w-full p-6 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                <button 
                  onClick={() => setEditingProduct(null)}
                  className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                    {products.find(p => p.id === editingProduct.id) ? 'Editar Producto' : 'Crear Producto'}
                </h3>
                
                <form onSubmit={handleEditSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                    {/* Origin Type Selector - Circle Option Menu */}
                    <div className="md:col-span-2 mb-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Origen del Producto (Grupo)</label>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                type="button"
                                onClick={() => setEditingProduct({...editingProduct, originType: 'MANUFACTURED'})}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all flex-1 ${editingProduct.originType === 'MANUFACTURED' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-800 dark:text-orange-200 ring-1 ring-orange-500' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${editingProduct.originType === 'MANUFACTURED' ? 'border-orange-500' : 'border-gray-400'}`}>
                                    {editingProduct.originType === 'MANUFACTURED' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm flex items-center gap-2">
                                        <Factory className="w-4 h-4" /> Manufactura
                                    </div>
                                    <div className="text-xs opacity-75">Producción Interna</div>
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setEditingProduct({...editingProduct, originType: 'IMPORTED'})}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all flex-1 ${editingProduct.originType === 'IMPORTED' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 ring-1 ring-blue-500' : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50'}`}
                            >
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${editingProduct.originType === 'IMPORTED' ? 'border-blue-500' : 'border-gray-400'}`}>
                                    {editingProduct.originType === 'IMPORTED' && <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />}
                                </div>
                                <div className="text-left">
                                    <div className="font-bold text-sm flex items-center gap-2">
                                        <Ship className="w-4 h-4" /> Importación
                                    </div>
                                    <div className="text-xs opacity-75">Trader / Reventa</div>
                                </div>
                            </button>
                        </div>
                    </div>

                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Producto</label>
                        <input 
                            type="text" 
                            value={editingProduct.name}
                            onChange={e => setEditingProduct({...editingProduct, name: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                        <input 
                            type="text" 
                            value={editingProduct.sku}
                            onChange={e => setEditingProduct({...editingProduct, sku: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                        <input 
                            type="text" 
                            value={editingProduct.category}
                            onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    
                    {/* Dynamic Cost Fields based on Origin */}
                    {editingProduct.originType === 'IMPORTED' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Costo Compra ($)</label>
                                <input 
                                    type="number" 
                                    value={editingProduct.costPrice}
                                    onChange={e => setEditingProduct({...editingProduct, costPrice: parseFloat(e.target.value) || 0})}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Duty / Arancel (%)</label>
                                <input 
                                    type="number" 
                                    value={editingProduct.importDutyPercent || 0}
                                    onChange={e => setEditingProduct({...editingProduct, importDutyPercent: parseFloat(e.target.value) || 0})}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    placeholder="Ej. 10"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Costo Materia Prima ($)</label>
                                <input 
                                    type="number" 
                                    value={editingProduct.rawMaterialCost || 0}
                                    onChange={e => setEditingProduct({...editingProduct, rawMaterialCost: parseFloat(e.target.value) || 0})}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Costo Mano de Obra ($)</label>
                                <input 
                                    type="number" 
                                    value={editingProduct.laborCost || 0}
                                    onChange={e => setEditingProduct({...editingProduct, laborCost: parseFloat(e.target.value) || 0})}
                                    className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                        </>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio Venta ($)</label>
                        <input 
                            type="number" 
                            value={editingProduct.salePrice}
                            onChange={e => setEditingProduct({...editingProduct, salePrice: parseFloat(e.target.value) || 0})}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Límite Alerta Stock Bajo</label>
                        <input 
                            type="number" 
                            value={editingProduct.lowStockThreshold}
                            onChange={e => setEditingProduct({...editingProduct, lowStockThreshold: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tamaño Pack (1 = Unidad)</label>
                        <input 
                            type="number" 
                            value={editingProduct.packSize || 1}
                            onChange={e => setEditingProduct({...editingProduct, packSize: parseFloat(e.target.value)})}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                        />
                    </div>

                    <div className="md:col-span-2 mt-2">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                            <ShieldCheck className="w-4 h-4 text-indigo-600" /> Criterios de Calidad (Entrenamiento IA)
                        </label>
                        <textarea 
                            value={editingProduct.qualityStandards || ''}
                            onChange={e => setEditingProduct({...editingProduct, qualityStandards: e.target.value})}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white text-sm"
                            rows={3}
                            placeholder="Describa los estándares de calidad: 'Costuras azules, logo centrado, sin rayones'..."
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Estos criterios se usarán para que la IA detecte defectos automáticamente en las fotos de control de calidad.
                        </p>
                    </div>

                    <div className="md:col-span-2 pt-4 flex gap-3">
                        <button type="button" onClick={() => setEditingProduct(null)} className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg">Cancelar</button>
                        <button type="submit" className="flex-1 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg">Guardar Cambios</button>
                    </div>
                </form>
            </div>
        </div>
      )}

      {/* Create Pack Modal */}
      {creatingPackFor && (
           <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
               <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
                   <button 
                     onClick={() => setCreatingPackFor(null)}
                     className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                   >
                     <X className="w-5 h-5" />
                   </button>
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Crear Versión Pack</h3>
                   <p className="text-sm text-gray-500 mb-6">Crear un nuevo SKU que representa un bulto/pack de: {creatingPackFor.name}</p>

                   <div className="space-y-4">
                       <div>
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Pack</label>
                           <input 
                               type="text" 
                               value={packName}
                               onChange={(e) => setPackName(e.target.value)}
                               className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                           />
                       </div>

                       {/* Mode Toggle */}
                       <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg">
                           {isFashionContext && (
                               <button 
                                onClick={() => setIsOneSizePack(false)}
                                className={`flex-1 py-2 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-all ${!isOneSizePack ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                               >
                                   <Layers className="w-3 h-3" /> Desglose por Talla
                               </button>
                           )}
                           <button 
                            onClick={() => setIsOneSizePack(true)}
                            className={`flex-1 py-2 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-all ${isOneSizePack ? 'bg-white dark:bg-gray-600 shadow text-indigo-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                           >
                               <Hash className="w-3 h-3" /> Cantidad Única
                           </button>
                       </div>

                       {isOneSizePack ? (
                           <div>
                               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Total Unidades</label>
                               <input 
                                   type="number" 
                                   value={oneSizeQty}
                                   onChange={(e) => setOneSizeQty(Math.max(1, Number(e.target.value)))}
                                   className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white dark:border-gray-600"
                               />
                           </div>
                       ) : (
                           <div className="space-y-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-700">
                               <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold mb-2">Composición del Pack</p>
                               <div className="grid grid-cols-2 gap-2">
                                   {packAvailableSizes.map(size => (
                                       <div key={size} className="flex items-center justify-between bg-white dark:bg-gray-600 p-2 rounded border border-gray-200 dark:border-gray-500">
                                           <span className="text-sm font-medium text-gray-700 dark:text-white">{size}</span>
                                           <input 
                                               type="number" 
                                               min="0"
                                               placeholder="0"
                                               className="w-16 text-center border-b border-gray-300 dark:border-gray-400 bg-transparent outline-none dark:text-white text-sm"
                                               value={packDistribution[size] || ''}
                                               onChange={(e) => setPackDistribution({ ...packDistribution, [size]: Number(e.target.value) })}
                                           />
                                       </div>
                                   ))}
                               </div>
                               
                               <div className="mt-3 flex gap-2">
                                   <input 
                                       type="text" 
                                       placeholder="Agregar talla (ej. XL, 42)"
                                       className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-white"
                                       value={newSizeInput}
                                       onChange={(e) => setNewSizeInput(e.target.value)}
                                   />
                                   <button 
                                       onClick={handleAddSize}
                                       className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white px-3 py-1 rounded text-sm hover:bg-gray-300 dark:hover:bg-gray-500"
                                   >
                                       <Plus className="w-4 h-4" />
                                   </button>
                               </div>
                           </div>
                       )}

                       <div className="pt-2">
                           <div className="flex justify-between items-center text-sm mb-3 font-medium text-gray-900 dark:text-white">
                               <span>Total Unidades:</span>
                               <span className="text-lg text-indigo-600 dark:text-indigo-400">
                                   {isOneSizePack ? oneSizeQty : Object.values(packDistribution).reduce((a: number, b) => a + (b as number), 0)}
                               </span>
                           </div>
                           <button 
                               onClick={handleCreatePack}
                               className="w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 shadow-sm font-medium"
                           >
                               Crear Pack
                           </button>
                       </div>
                   </div>
               </div>
           </div>
      )}

      {/* QR Code & Audit Modal */}
      {selectedQrProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setSelectedQrProduct(null)}
              className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-center space-y-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isAuditMode ? 'Auditoría de Inventario' : 'Etiqueta de Producto'}
              </h3>
              
              {!isAuditMode ? (
                  <>
                    <div className="bg-white p-4 rounded-xl border-2 border-gray-100 inline-block">
                        <QRCode value={JSON.stringify({ id: selectedQrProduct.id, sku: selectedQrProduct.sku })} size={160} />
                    </div>
                    <div className="space-y-1">
                        <p className="text-xl font-bold text-indigo-600">{selectedQrProduct.sku}</p>
                        <p className="font-medium text-gray-900 dark:text-white">{selectedQrProduct.name}</p>
                    </div>
                    <div className="pt-2 flex flex-col gap-2">
                         <button 
                            onClick={() => setIsAuditMode(true)}
                            className="w-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 py-2 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/50 font-medium flex items-center justify-center gap-2"
                        >
                            <AlertTriangle className="w-4 h-4" /> Verificar Stock Físico
                        </button>
                    </div>
                  </>
              ) : (
                  <div className="py-2 space-y-4">
                      <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-left">
                          <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-semibold">Stock en Sistema</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">{selectedQrProduct.stock} uds</p>
                      </div>

                      <div className="text-left">
                           <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conteo Físico Real</label>
                           <input 
                                type="number" 
                                value={auditCount}
                                onChange={(e) => setAuditCount(e.target.value)}
                                className="w-full text-center text-xl font-bold py-3 rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                autoFocus
                           />
                           {parseInt(auditCount) !== selectedQrProduct.stock && auditCount !== '' && (
                               <p className={`text-xs mt-2 font-medium ${parseInt(auditCount) < selectedQrProduct.stock ? 'text-red-500' : 'text-green-500'}`}>
                                   Diferencia: {parseInt(auditCount) - selectedQrProduct.stock} uds
                               </p>
                           )}
                      </div>

                      <div className="flex gap-2 pt-2">
                           <button 
                                onClick={() => setIsAuditMode(false)}
                                className="flex-1 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleAuditSubmit}
                                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 flex items-center justify-center gap-2"
                            >
                                <RefreshCw className="w-4 h-4" /> Ajustar Stock
                            </button>
                      </div>
                  </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* QR Scanner Overlay */}
      {showScanner && (
          <QRScanner 
            onScanSuccess={handleScanSuccess} 
            onClose={() => setShowScanner(false)} 
            instructionText="Escanee el código de un producto para auditar"
          />
      )}
    </div>
  );
};
