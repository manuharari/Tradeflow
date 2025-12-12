
import React, { useState, useEffect } from 'react';
import { Order, OrderStatus, Product, Customer, OrderItem, OrderAttachment, INITIAL_CUSTOMERS } from '../types';
import { Plus, Search, Eye, ShoppingCart, ArrowLeft, Trash2, CheckCircle, Clock, Truck, XCircle, MapPin, Package, X, Tag, Palette, PenLine, FileText, Upload, Download, Paperclip, DollarSign, ShieldCheck, ScanLine, Box, Calendar } from 'lucide-react';
import { QRScanner } from './QRScanner';

// Expanded Mock Orders to test AI Velocity
const initialOrdersMock: Order[] = [
  {
    id: 'ORD-2024-001',
    customerId: '1',
    customerName: 'Alice Johnson',
    date: '2024-03-10',
    status: 'Enviado',
    items: [
      { productId: '1', productName: 'Camiseta Algodón Premium', quantity: 50, unitPrice: 19.99, total: 999.50, selectedSize: 'M', selectedColor: 'Blanco' },
      { productId: '4', productName: 'Auriculares Noise Cancel', quantity: 10, unitPrice: 89.99, total: 899.90 }
    ],
    totalAmount: 1949.40,
    trackingNumber: 'TRK-8842-XJ9',
    logisticsProvider: 'FedEx Express',
    estimatedDelivery: '2024-03-15',
    attachments: [],
    shippingCost: 50.00,
    paymentTerms: 30,
    dueDate: '2024-04-09',
    paymentStatus: 'PENDING',
    remindersSent: 0
  },
  {
    id: 'ORD-2024-002',
    customerId: '4',
    customerName: 'Diana Prince',
    date: '2024-03-08',
    status: 'Procesando',
    items: [
      { productId: '3', productName: 'Smart Watch Series 5', quantity: 15, unitPrice: 120.00, total: 1800.00, selectedColor: 'Black' },
      { productId: '5', productName: 'Cargador Rápido GaN 65W', quantity: 30, unitPrice: 29.99, total: 899.70 }
    ],
    totalAmount: 2750.00,
    shippingCost: 50.30,
    paymentTerms: 0,
    dueDate: '2024-03-08',
    paymentStatus: 'PAID',
    remindersSent: 0
  },
  {
    id: 'ORD-2024-003',
    customerId: '1',
    customerName: 'Alice Johnson',
    date: '2024-02-28',
    status: 'Entregado',
    items: [
      { productId: '2', productName: 'Jeans Slim Fit Denim', quantity: 100, unitPrice: 45.00, total: 4500.00, selectedSize: '32', selectedColor: 'Azul Indigo' }
    ],
    totalAmount: 4600.00,
    trackingNumber: 'DHL-2291',
    logisticsProvider: 'DHL',
    shippingCost: 100,
    paymentTerms: 15,
    dueDate: '2024-03-14',
    paymentStatus: 'OVERDUE',
    remindersSent: 1
  },
];

export const INITIAL_ORDERS = initialOrdersMock;

const getStatusColor = (status: OrderStatus) => {
  switch (status) {
    case 'Pendiente': return 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800';
    case 'Procesando': return 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
    case 'Enviado': return 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
    case 'Entregado': return 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800';
    case 'Cancelado': return 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800';
    default: return 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600';
  }
};

const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
        case 'Pendiente': return Clock;
        case 'Procesando': return Eye;
        case 'Enviado': return Truck;
        case 'Entregado': return CheckCircle;
        case 'Cancelado': return XCircle;
        default: return Clock;
    }
}

interface OrdersProps {
    products: Product[];
    onOrderShipped?: (order: Order) => void;
    orders: Order[];
    setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

export const Orders: React.FC<OrdersProps> = ({ products, onOrderShipped, orders, setOrders }) => {
  const [view, setView] = useState<'list' | 'create'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [trackingOrder, setTrackingOrder] = useState<Order | null>(null);
  const [docsOrder, setDocsOrder] = useState<Order | null>(null);
  
  // Fulfillment Verification Modal State
  const [verifyingOrder, setVerifyingOrder] = useState<Order | null>(null);
  const [scannedItems, setScannedItems] = useState<Map<string, number>>(new Map()); // Key: ProductID, Value: Count
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Tracking Manual Edit State
  const [isEditingTracking, setIsEditingTracking] = useState(false);
  const [manualTracking, setManualTracking] = useState('');

  // Create Order State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [insuranceCost, setInsuranceCost] = useState<number>(0);
  const [paymentTerms, setPaymentTerms] = useState<number>(30); // Default Net 30
  
  // Variant Selection State (Now Matrix)
  const [configuringProduct, setConfiguringProduct] = useState<Product | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [sizeQuantities, setSizeQuantities] = useState<Record<string, number>>({});

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Configure Product Logic
  const handleOpenConfigure = (product: Product) => {
      setConfiguringProduct(product);
      setSelectedColor(product.colors?.[0] || '');
      // Initialize matrix
      const initialQtys: Record<string, number> = {};
      if (product.sizes) {
          product.sizes.forEach(s => initialQtys[s] = 0);
      } else {
          initialQtys['Standard'] = 0;
      }
      setSizeQuantities(initialQtys);
  };

  const handleConfirmConfiguration = () => {
      if (configuringProduct) {
          // Iterate over size quantities and add items
          Object.entries(sizeQuantities).forEach(([size, qty]) => {
              const quantity = qty as number;
              if (quantity > 0) {
                  addToCart(configuringProduct, size, selectedColor, quantity);
              }
          });
          setConfiguringProduct(null);
          setSelectedColor('');
          setSizeQuantities({});
      }
  };

  // Cart Logic
  const addToCart = (product: Product, size: string, color: string, qty: number) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => 
          item.productId === product.id && 
          item.selectedSize === size && 
          item.selectedColor === color
      );

      if (existingIndex >= 0) {
        // Update existing item quantity
        const newCart = [...prev];
        const item = newCart[existingIndex];
        const newQuantity = item.quantity + qty;
        newCart[existingIndex] = {
            ...item,
            quantity: newQuantity,
            total: newQuantity * item.unitPrice
        };
        return newCart;
      } else {
        // Add new item
        return [...prev, {
            productId: product.id,
            productName: product.name,
            quantity: qty,
            unitPrice: product.salePrice,
            total: product.salePrice * qty,
            selectedSize: size,
            selectedColor: color
        }];
      }
    });
  };

  const updateQuantity = (index: number, newQty: number) => {
    setCart(prev => {
        const newCart = [...prev];
        const item = newCart[index];
        const safeQty = Math.max(1, newQty);
        newCart[index] = { ...item, quantity: safeQty, total: safeQty * item.unitPrice };
        return newCart;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateOrder = () => {
    if (!selectedCustomerId || cart.length === 0) return;
    
    const customer = INITIAL_CUSTOMERS.find(c => c.id === selectedCustomerId);
    const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
    const finalTotal = subtotal + shippingCost + insuranceCost;
    
    // Calculate Due Date
    const today = new Date();
    const dueDateObj = new Date(today.setDate(today.getDate() + paymentTerms));
    const dueDateStr = dueDateObj.toISOString().split('T')[0];

    const newOrder: Order = {
      id: `ORD-2024-${(orders.length + 1).toString().padStart(3, '0')}`,
      customerId: selectedCustomerId,
      customerName: customer?.name || 'Desconocido',
      date: new Date().toISOString().split('T')[0],
      status: 'Pendiente',
      items: [...cart],
      totalAmount: finalTotal,
      attachments: [],
      shippingCost,
      insuranceCost,
      paymentTerms,
      dueDate: dueDateStr,
      paymentStatus: paymentTerms === 0 ? 'PAID' : 'PENDING',
      remindersSent: 0
    };

    setOrders([newOrder, ...orders]);
    setView('list');
    setCart([]);
    setSelectedCustomerId('');
    setShippingCost(0);
    setInsuranceCost(0);
    setPaymentTerms(30);
  };

  // --- ORDER FULFILLMENT VERIFICATION LOGIC ---

  const initiateStatusChange = (order: Order, newStatus: OrderStatus) => {
      // If moving to "Enviado", force verification
      if (newStatus === 'Enviado' && order.status !== 'Enviado') {
          setVerifyingOrder(order);
          setScannedItems(new Map()); // Reset scans
      } else {
          // Normal status update without verification
          confirmStatusChange(order.id, newStatus);
      }
  };

  const confirmStatusChange = (orderId: string, newStatus: OrderStatus) => {
      setOrders(prev => prev.map(o => {
          if (o.id === orderId) {
              const prevStatus = o.status;
              const updates: Partial<Order> = { status: newStatus };
              const updatedOrder = { ...o, ...updates };

              // Trigger Stock Deduction
              if (newStatus === 'Enviado' && prevStatus !== 'Enviado' && onOrderShipped) {
                  onOrderShipped(updatedOrder);
              }

              return updatedOrder;
          }
          return o;
      }));
      setVerifyingOrder(null); // Close modal if open
  };

  const handleVerificationScan = (decodedText: string) => {
      if (!verifyingOrder) return;

      try {
          const data = JSON.parse(decodedText);
          const productId = data.id;

          // Check if product is in the order
          const orderItem = verifyingOrder.items.find(item => item.productId === productId);
          
          if (!orderItem) {
              alert('¡ALERTA! Este producto no pertenece a esta orden.');
              return;
          }

          // Check if we've already scanned enough of this item
          const currentCount = scannedItems.get(productId) || 0;
          
          // Get total quantity required for this product ID (aggregating variants if needed)
          const totalRequired = verifyingOrder.items
            .filter(i => i.productId === productId)
            .reduce((sum, i) => sum + i.quantity, 0);

          if (currentCount >= totalRequired) {
              alert('Orden completa para este ítem. No es necesario escanear más.');
          } else {
              // Increment count
              const newMap = new Map(scannedItems);
              newMap.set(productId, currentCount + 1);
              setScannedItems(newMap);
          }

      } catch (e) {
          alert('Código QR inválido');
      }
  };

  // Calculate fulfillment progress
  const getFulfillmentProgress = () => {
      if (!verifyingOrder) return { percent: 0, isComplete: false };
      
      const totalItems = verifyingOrder.items.reduce((sum, item) => sum + item.quantity, 0);
      let scannedTotal = 0;
      scannedItems.forEach((count) => scannedTotal += count);
      
      return {
          percent: Math.min(100, Math.round((scannedTotal / totalItems) * 100)),
          isComplete: scannedTotal >= totalItems,
          scannedTotal,
          totalItems
      };
  };

  const saveManualTracking = () => {
    if (trackingOrder) {
        setOrders(prev => prev.map(o => o.id === trackingOrder.id ? { ...o, trackingNumber: manualTracking, logisticsProvider: 'Manual / Otro' } : o));
        setTrackingOrder(prev => prev ? { ...prev, trackingNumber: manualTracking } : null);
        setIsEditingTracking(false);
    }
  }

  // File Upload Logic
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!docsOrder || !e.target.files?.[0]) return;
      
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onloadend = () => {
          const newAttachment: OrderAttachment = {
              id: Date.now().toString(),
              name: file.name,
              type: file.type.includes('image') ? 'IMAGE' : 'DOCUMENT',
              url: reader.result as string, // Base64
              date: new Date().toISOString().split('T')[0],
              uploadedBy: 'Current User'
          };
          
          setOrders(prev => prev.map(o => 
              o.id === docsOrder.id 
              ? { ...o, attachments: [...(o.attachments || []), newAttachment] } 
              : o
          ));
          setDocsOrder(prev => prev ? { ...prev, attachments: [...(prev.attachments || []), newAttachment] } : null);
      };
      
      reader.readAsDataURL(file);
  };

  if (view === 'create') {
    const cartTotal = cart.reduce((sum, item) => sum + item.total, 0);
    const grandTotal = cartTotal + shippingCost + insuranceCost;
    
    return (
      <div className="space-y-6 h-full flex flex-col">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nuevo Pedido</h1>
            <p className="text-gray-500 dark:text-gray-400">Seleccione cliente y agregue productos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          {/* Left Col: Product Catalog */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Catálogo de Moda</h3>
            </div>
            <div className="overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {products.map(product => (
                        <div key={product.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-indigo-300 dark:hover:border-indigo-500 transition-colors flex flex-col justify-between bg-white dark:bg-gray-800">
                            <div>
                                <div className="flex justify-between items-start mb-2">
                                    <h4 className="font-medium text-gray-900 dark:text-white">{product.name}</h4>
                                    <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">{product.sku}</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{product.category}</p>
                                <div className="flex justify-between items-center text-xs mb-3">
                                    <span className={product.stock > 10 ? 'text-green-600' : 'text-red-500 font-bold'}>
                                        Stock: {product.stock}
                                    </span>
                                    {(product.packSize || 1) > 1 && <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-bold">Pack x{product.packSize}</span>}
                                </div>
                            </div>
                            <div className="flex justify-between items-center mt-auto">
                                <span className="font-bold text-lg text-indigo-600 dark:text-indigo-400">${product.salePrice.toFixed(2)}</span>
                                <button 
                                    onClick={() => handleOpenConfigure(product)}
                                    disabled={product.stock <= 0}
                                    className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Plus className="w-4 h-4" /> Agregar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
          </div>

          {/* Right Col: Order Builder */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col h-fit transition-colors">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cliente</label>
                    <select 
                        className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        value={selectedCustomerId}
                        onChange={(e) => setSelectedCustomerId(e.target.value)}
                    >
                        <option value="">Seleccionar Cliente...</option>
                        {INITIAL_CUSTOMERS.map(c => (
                            <option key={c.id} value={c.id}>{c.name} - {c.company}</option>
                        ))}
                    </select>
                </div>
                
                {/* Payment Terms Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Días de Crédito (Pago)</label>
                    <div className="flex gap-2">
                        {[0, 15, 30, 60].map(days => (
                            <button
                                key={days}
                                onClick={() => setPaymentTerms(days)}
                                className={`flex-1 py-1.5 text-xs font-medium rounded border transition-all ${paymentTerms === days ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50'}`}
                            >
                                {days === 0 ? 'Contado' : `${days} Días`}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto max-h-[300px]">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Items del Pedido</h3>
                {cart.length === 0 ? (
                    <div className="text-center text-gray-400 dark:text-gray-500 py-8 border-2 border-dashed border-gray-100 dark:border-gray-700 rounded-lg">
                        <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">El carrito está vacío</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {cart.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-start bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg group">
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">{item.productName}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">${item.unitPrice.toFixed(2)} / un</p>
                                    {(item.selectedSize || item.selectedColor) && (
                                        <div className="flex gap-2 mt-1">
                                            {item.selectedSize && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">Talla: {item.selectedSize}</span>}
                                            {item.selectedColor && <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">{item.selectedColor}</span>}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-3 ml-2">
                                    <div className="flex items-center">
                                        <input 
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => updateQuantity(idx, parseInt(e.target.value) || 0)}
                                            className="w-16 px-2 py-1 text-sm text-center border rounded dark:bg-gray-600 dark:text-white dark:border-gray-500"
                                            min="1"
                                        />
                                    </div>
                                    <button onClick={() => removeFromCart(idx)} className="text-red-400 hover:text-red-600">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="p-4 bg-gray-50 dark:bg-gray-900/30 border-t border-gray-200 dark:border-gray-700 space-y-3">
                 <div className="flex gap-3">
                    <div className="flex-1">
                         <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Costo Envío</label>
                         <div className="relative">
                             <Truck className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                             <input 
                                type="number" 
                                min="0"
                                value={shippingCost}
                                onChange={(e) => setShippingCost(Number(e.target.value))}
                                className="w-full pl-7 pr-2 py-1.5 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none"
                             />
                         </div>
                    </div>
                    <div className="flex-1">
                         <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Seguro (Opc.)</label>
                         <div className="relative">
                             <ShieldCheck className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 w-3 h-3" />
                             <input 
                                type="number" 
                                min="0"
                                value={insuranceCost}
                                onChange={(e) => setInsuranceCost(Number(e.target.value))}
                                className="w-full pl-7 pr-2 py-1.5 text-sm border rounded bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white outline-none"
                             />
                         </div>
                    </div>
                 </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 rounded-b-xl">
                <div className="space-y-1 mb-4">
                    <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                        <span>Subtotal</span>
                        <span>${cartTotal.toFixed(2)}</span>
                    </div>
                    {(shippingCost > 0 || insuranceCost > 0) && (
                        <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                            <span>Envío + Seguro</span>
                            <span>${(shippingCost + insuranceCost).toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-200 dark:border-gray-700">
                        <span className="font-bold text-gray-900 dark:text-white">Total</span>
                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">${grandTotal.toFixed(2)}</span>
                    </div>
                </div>
                <button 
                    onClick={handleCreateOrder}
                    disabled={!selectedCustomerId || cart.length === 0}
                    className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                    Confirmar Pedido
                </button>
            </div>
          </div>
        </div>

        {/* Configure Product Modal (Matrix Input) */}
        {configuringProduct && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-md w-full p-6 relative animate-in fade-in zoom-in duration-200">
                    <button 
                        onClick={() => setConfiguringProduct(null)}
                        className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{configuringProduct.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{configuringProduct.sku} - ${configuringProduct.salePrice}</p>

                    <div className="space-y-6">
                        {/* Color Selector */}
                        <div>
                            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                <Palette className="w-4 h-4" /> 1. Seleccionar Color
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {configuringProduct.colors?.map(color => (
                                    <button
                                        key={color}
                                        onClick={() => setSelectedColor(color)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all
                                            ${selectedColor === color 
                                                ? 'bg-indigo-600 border-indigo-600 text-white' 
                                                : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-indigo-400'}`}
                                    >
                                        {color}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Size Matrix */}
                        <div>
                             <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                <Tag className="w-4 h-4" /> 2. Cantidad por Talla
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {Object.keys(sizeQuantities).map(size => (
                                    <div key={size} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg border border-gray-200 dark:border-gray-600">
                                        <span className="font-medium text-gray-700 dark:text-gray-200">{size}</span>
                                        <input 
                                            type="number" 
                                            min="0"
                                            className="w-20 px-2 py-1 rounded border border-gray-300 dark:border-gray-500 text-center dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={sizeQuantities[size]}
                                            onChange={(e) => setSizeQuantities({...sizeQuantities, [size]: parseInt(e.target.value) || 0})}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex gap-3">
                        <button 
                            onClick={() => setConfiguringProduct(null)}
                            className="flex-1 px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={handleConfirmConfiguration}
                            disabled={!selectedColor}
                            className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            Confirmar
                        </button>
                    </div>
                </div>
            </div>
        )}
      </div>
    );
};
