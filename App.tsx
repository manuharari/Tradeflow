
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/Dashboard';
import { Inventory } from './components/Inventory';
import { CRM } from './components/CRM';
import { PresentationMaker } from './components/PresentationMaker';
import { Orders, INITIAL_ORDERS } from './components/Orders';
import { SupplyChain } from './components/SupplyChain';
import { SuperAdmin } from './components/SuperAdmin';
import { Finance } from './components/Finance';
import { History } from './components/History';
import { Channels } from './components/Channels';
import { Login } from './components/Login';
import { ViewState, BusinessMode, Company, User, INITIAL_COMPANIES, INITIAL_PRODUCTS, Product, Order, SupplyOrder, SupplyStatus, AppNotification, INITIAL_SUPPLY_ORDERS } from './types';
import { Bell, X, CheckCheck, Lock } from 'lucide-react';

const App: React.FC = () => {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App Data State (Lifted from SuperAdmin for persistence)
  const [companies, setCompanies] = useState<Company[]>(INITIAL_COMPANIES);
  
  // Products State (Lifted for global access)
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);

  // Orders State (Lifted for global access & Finance integration)
  const [orders, setOrders] = useState<Order[]>(INITIAL_ORDERS);

  // Supply Chain State
  const [supplyOrders, setSupplyOrders] = useState<SupplyOrder[]>(INITIAL_SUPPLY_ORDERS);

  // Notification State
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  // Navigation State
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.SUPER_ADMIN);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  
  // Business Mode State (General, Manu, Trader)
  const [businessMode, setBusinessMode] = useState<BusinessMode>('GENERAL');
  
  // Dark Mode Logic
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  // --- Notification Logic ---
  const notifyStakeholders = (title: string, message: string, type: 'INFO' | 'SUCCESS' | 'ALERT', roles: string[]) => {
      // 1. In-App Notification
      const newNotif: AppNotification = {
          id: Date.now().toString() + Math.random().toString(),
          title,
          message,
          type,
          targetRoles: roles,
          date: new Date().toISOString(),
          read: false
      };
      setNotifications(prev => [newNotif, ...prev]);

      // 2. Simulated Email Notification
      // In a real app, this would call an backend API like /api/send-email
      console.group('📧 Email Notification Dispatched');
      console.log(`%cSubject: ${title}`, 'font-weight: bold; color: #4f46e5');
      console.log(`To Departments: ${roles.join(', ')}`);
      console.log(`Body: ${message}`);
      console.groupEnd();

      // Optional: Browser Alert to prove it happened (can be annoying, so we'll skip the alert but maybe show a subtle toast if we had a toast system)
  };

  const markAsRead = (id: string) => {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };
  
  const clearNotifications = () => setNotifications([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  // Handle Login Logic
  const handleLogin = (user: User) => {
    if (user.role === 'MASTER_ADMIN' || user.role === 'ONBOARDING_ADMIN') {
        setCurrentUser(user);
        // Admin roles go to Super Admin view
        setActiveCompany(null);
        setCurrentView(ViewState.SUPER_ADMIN);
    } else if (user.role === 'TENANT_ADMIN' && user.companyId) {
        // Tenant Admin goes directly to their Company Dashboard
        const userCompany = companies.find(c => c.id === user.companyId);
        if (userCompany) {
            setCurrentUser(user); // Set user only if company found
            handleCompanySelect(userCompany);
        } else {
            console.error("User company not found");
            alert("Error: No se encontró la empresa asignada a este usuario. Contacte al soporte.");
        }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveCompany(null);
    setCurrentView(ViewState.SUPER_ADMIN); // Reset view
  };

  // Handle Tenant Selection (Used by SuperAdmin or Auto-Select by Tenant Login)
  const handleCompanySelect = (company: Company) => {
    setActiveCompany(company);
    // Set initial business mode based on company type
    if (company.type === 'HYBRID') {
        setBusinessMode('GENERAL');
    } else if (company.type === 'MANUFACTURER') {
        setBusinessMode('MANUFACTURER');
    } else {
        setBusinessMode('TRADER');
    }
    setCurrentView(ViewState.DASHBOARD);
  };

  const handleExitContext = () => {
    if (currentUser?.role === 'MASTER_ADMIN' || currentUser?.role === 'ONBOARDING_ADMIN') {
        // Admins go back to list
        setActiveCompany(null);
        setCurrentView(ViewState.SUPER_ADMIN);
    } else {
        // Tenant logs out
        handleLogout();
    }
  };

  // Live Inventory Logic: Deduct stock when an order is shipped
  const handleOrderShipped = (order: Order) => {
    setProducts(prevProducts => {
      const newProducts = [...prevProducts];
      order.items.forEach(item => {
        const productIndex = newProducts.findIndex(p => p.id === item.productId);
        if (productIndex >= 0) {
          // Deduct the quantity
          const currentStock = newProducts[productIndex].stock;
          newProducts[productIndex] = {
            ...newProducts[productIndex],
            stock: Math.max(0, currentStock - item.quantity)
          };
        }
      });
      return newProducts;
    });
  };

  // Supply Chain Logic: Add order & Notify
  const handleCreateSupplyOrder = (order: SupplyOrder) => {
      setSupplyOrders([...supplyOrders, order]);

      // Notification Logic based on Type
      if (order.type === 'PRODUCTION_ORDER') {
          const hasDesign = order.attachments.some(a => a.type === 'DESIGN');
          const extraMsg = hasDesign ? ' Se adjuntaron especificaciones de diseño.' : '';
          
          notifyStakeholders(
              'Nueva Orden de Manufactura',
              `Orden #${order.id} creada para ${order.quantity}u de ${order.productName}.${extraMsg}`,
              'INFO',
              ['Producción', 'Compras', 'CEO']
          );
      } else {
          notifyStakeholders(
              'Nueva Orden de Compra',
              `Orden #${order.id} al proveedor ${order.supplierOrFacility}.`,
              'INFO',
              ['Compras', 'CEO']
          );
      }
  };

  // Supply Chain Logic: Update status & Increase Stock & Notify
  const handleUpdateSupplyStatus = (orderId: string, status: SupplyStatus) => {
      const orderIndex = supplyOrders.findIndex(o => o.id === orderId);
      if (orderIndex === -1) return;

      const order = supplyOrders[orderIndex];
      const previousStatus = order.status;

      // Update Order Status
      const updatedOrders = [...supplyOrders];
      updatedOrders[orderIndex] = { ...order, status };
      setSupplyOrders(updatedOrders);

      // Trigger Stock Update & Notifications if moving to Completed state
      const isCompleting = (status === 'RECEIVED' || status === 'FINISHED');
      const wasCompleted = (previousStatus === 'RECEIVED' || previousStatus === 'FINISHED');

      if (isCompleting && !wasCompleted) {
          setProducts(prev => prev.map(p => {
              if (p.id === order.productId) {
                  return { ...p, stock: p.stock + order.quantity };
              }
              return p;
          }));

          // Notify Stakeholders of completion
          const action = order.type === 'PRODUCTION_ORDER' ? 'Producción Finalizada' : 'Mercancía Recibida';
          notifyStakeholders(
              action,
              `Orden #${order.id} completada. ${order.quantity} unidades ingresadas a inventario.`,
              'SUCCESS',
              ['Almacén', 'Ventas', 'CEO']
          );
      } else {
          // General status update alert (e.g. In Transit)
          notifyStakeholders(
              'Actualización de Estado',
              `Orden #${order.id} cambió a ${status}.`,
              'INFO',
              ['CEO', 'Compras']
          );
      }
  };

  const handleQualityIssueDetected = (orderId: string, issue: string) => {
      notifyStakeholders(
          'Alerta de Control de Calidad',
          `La IA detectó un posible defecto en la orden #${orderId}: "${issue}". Se requiere inspección humana inmediata.`,
          'ALERT',
          ['Calidad', 'Producción', 'CEO']
      );
  };

  // Checks if user has access to a view based on active modules
  const canAccessView = (view: ViewState): boolean => {
      if (!activeCompany) return true; // Safety check (shouldn't happen in restricted flow but safe to allow)
      if (view === ViewState.DASHBOARD) return true;
      // Use optional chaining for safety
      if (view === ViewState.INVENTORY && activeCompany.activeModules?.includes('INVENTORY')) return true;
      if (view === ViewState.SUPPLY_CHAIN && activeCompany.activeModules?.includes('SUPPLY_CHAIN')) return true;
      if (view === ViewState.ORDERS && activeCompany.activeModules?.includes('ORDERS')) return true;
      if (view === ViewState.CRM && activeCompany.activeModules?.includes('CRM')) return true;
      if (view === ViewState.CHANNELS && activeCompany.activeModules?.includes('CHANNELS')) return true;
      if (view === ViewState.PRESENTATION && activeCompany.activeModules?.includes('AI_STUDIO')) return true;
      if (view === ViewState.FINANCE && activeCompany.activeModules?.includes('FINANCE')) return true;
      if (view === ViewState.HISTORY && activeCompany.activeModules?.includes('HISTORY')) return true;
      return false;
  };

  const renderContent = () => {
    // If not logged in, show Login
    if (!currentUser) {
        return <Login onLogin={handleLogin} />;
    }

    // If Admin and no company selected, show Super Admin
    if ((currentUser.role === 'MASTER_ADMIN' || currentUser.role === 'ONBOARDING_ADMIN') && (!activeCompany || currentView === ViewState.SUPER_ADMIN)) {
        return (
            <SuperAdmin 
                onSelectCompany={handleCompanySelect} 
                companies={companies}
                setCompanies={setCompanies}
                userRole={currentUser.role}
            />
        );
    }

    // Check Module Permission
    if (!canAccessView(currentView)) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <Lock className="w-16 h-16 mb-4 text-gray-300" />
                <h2 className="text-xl font-bold mb-2">Módulo No Disponible</h2>
                <p>Este plan no incluye acceso a esta funcionalidad.</p>
                <button 
                    onClick={() => setCurrentView(ViewState.DASHBOARD)} 
                    className="mt-4 text-indigo-600 hover:underline"
                >
                    Volver al Dashboard
                </button>
            </div>
        );
    }

    // Otherwise render the specific company view
    switch (currentView) {
      case ViewState.DASHBOARD:
        return <Dashboard businessMode={businessMode} orders={orders} />;
      case ViewState.INVENTORY:
        return (
          <Inventory 
            businessMode={businessMode} 
            products={products}
            setProducts={setProducts}
          />
        );
      case ViewState.SUPPLY_CHAIN:
        // Pass function to update orders (needed for adding attachments post-creation)
        return (
           <SupplyChain 
              supplyOrders={supplyOrders}
              setSupplyOrders={setSupplyOrders}
              products={products}
              onCreateOrder={handleCreateSupplyOrder}
              onUpdateStatus={handleUpdateSupplyStatus}
              onQualityIssueDetected={handleQualityIssueDetected}
           />
        );
      case ViewState.ORDERS:
        return (
          <Orders 
            products={products}
            onOrderShipped={handleOrderShipped}
            orders={orders}
            setOrders={setOrders}
          />
        );
      case ViewState.CRM:
        return <CRM />;
      case ViewState.CHANNELS:
        return <Channels />;
      case ViewState.PRESENTATION:
        return <PresentationMaker />;
      case ViewState.FINANCE:
        return <Finance orders={orders} />;
      case ViewState.HISTORY:
        return <History />;
      default:
        return <Dashboard businessMode={businessMode} orders={orders} />;
    }
  };

  // Login view shouldn't have sidebar or layout wrapper
  if (!currentUser) {
      return renderContent();
  }

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300 relative overflow-hidden">
      
      {/* Show Sidebar only if a company is active */}
      {activeCompany && (
        <Sidebar 
            currentView={currentView} 
            onChangeView={setCurrentView}
            isDarkMode={isDarkMode}
            toggleDarkMode={toggleDarkMode}
            businessMode={businessMode}
            setBusinessMode={setBusinessMode}
            activeCompany={activeCompany}
            onExitCompany={handleExitContext}
            currentUser={currentUser}
            onToggleNotifications={() => setIsNotifDrawerOpen(true)}
            unreadNotifications={unreadCount}
        />
      )}
      
      <main className={`flex-1 ${activeCompany ? 'ml-64' : ''} p-8 h-screen overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600`}>
        <div className="max-w-7xl mx-auto">
          {renderContent()}
        </div>
      </main>

      {/* Notification Drawer (Right Side) */}
      {isNotifDrawerOpen && (
          <>
            <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                onClick={() => setIsNotifDrawerOpen(false)}
            ></div>
            <div className="fixed top-0 right-0 h-full w-80 bg-white dark:bg-gray-800 shadow-2xl z-50 transform transition-transform duration-300 border-l border-gray-200 dark:border-gray-700 flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-2">
                        <Bell className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        <h3 className="font-bold text-gray-900 dark:text-white">Centro de Alertas</h3>
                    </div>
                    <button onClick={() => setIsNotifDrawerOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {notifications.length === 0 ? (
                        <div className="text-center text-gray-400 mt-10">
                            <CheckCheck className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p className="text-sm">Todo al día. No hay alertas.</p>
                        </div>
                    ) : (
                        notifications.map(notif => (
                            <div 
                                key={notif.id} 
                                onClick={() => markAsRead(notif.id)}
                                className={`p-3 rounded-lg border transition-all cursor-pointer ${notif.read ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 opacity-70' : 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800 shadow-sm'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`text-sm font-semibold ${notif.type === 'ALERT' ? 'text-red-600' : notif.type === 'SUCCESS' ? 'text-green-600' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                        {notif.title}
                                    </h4>
                                    {!notif.read && <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>}
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">{notif.message}</p>
                                
                                <div className="flex flex-wrap gap-1 mb-2">
                                    {notif.targetRoles.map(role => (
                                        <span key={role} className="text-[10px] bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded border border-gray-200 dark:border-gray-600">
                                            @{role}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-[10px] text-gray-400 text-right">
                                    {new Date(notif.date).toLocaleTimeString()}
                                </p>
                            </div>
                        ))
                    )}
                </div>

                {notifications.length > 0 && (
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                        <button 
                            onClick={clearNotifications}
                            className="w-full py-2 text-xs font-medium text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                        >
                            Limpiar todo
                        </button>
                    </div>
                )}
            </div>
          </>
      )}
    </div>
  );
};

export default App;
