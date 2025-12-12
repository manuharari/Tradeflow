
export type CompanyType = 'MANUFACTURER' | 'TRADER' | 'HYBRID';

export type BusinessMode = 'GENERAL' | 'MANUFACTURER' | 'TRADER';

export type UserRole = 'MASTER_ADMIN' | 'ONBOARDING_ADMIN' | 'TENANT_ADMIN';

export type IndustryType = 'FASHION' | 'ELECTRONICS' | 'FMCG' | 'GENERIC';

// NEW: Module Definitions
export type ModuleType = 'INVENTORY' | 'ORDERS' | 'SUPPLY_CHAIN' | 'CRM' | 'AI_STUDIO' | 'FINANCE' | 'HISTORY' | 'CHANNELS';

// Changed to string to allow custom user channels, while keeping standard ones as constants in code
export type SalesChannel = string; 

export interface ChannelConfig {
    id: string;
    name: string;
    type: 'B2B' | 'B2C' | 'DIGITAL';
    fixedCost: number; // Rent, Salaries
    variableCostPercent: number; // Commission, Gateway fees (0-100)
    marketingBudget: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  companyId?: string; // Only for TENANT_ADMIN
}

export interface Company {
  id: string;
  name: string;
  type: CompanyType;
  industry: IndustryType; // NEW: To handle generalization
  logoUrl?: string;
  joinedDate: string;
  activeModules: ModuleType[]; // NEW: Feature Toggles
}

// Centralized Mock Data for Companies
export const INITIAL_COMPANIES: Company[] = [
  { 
    id: '1', 
    name: 'Global Textiles Ltd', 
    type: 'MANUFACTURER', 
    industry: 'FASHION',
    joinedDate: '2023-01-15',
    activeModules: ['INVENTORY', 'SUPPLY_CHAIN', 'ORDERS', 'FINANCE', 'HISTORY', 'CHANNELS', 'CRM'] 
  },
  { 
    id: '2', 
    name: 'Urban Electronics', 
    type: 'TRADER', 
    industry: 'ELECTRONICS',
    joinedDate: '2023-03-22',
    activeModules: ['INVENTORY', 'ORDERS', 'CRM', 'AI_STUDIO', 'FINANCE', 'HISTORY', 'CHANNELS'] 
  },
  { 
    id: '3', 
    name: 'Fusion Generic Group', 
    type: 'HYBRID', 
    industry: 'GENERIC',
    joinedDate: '2023-06-10',
    activeModules: ['INVENTORY', 'SUPPLY_CHAIN', 'ORDERS', 'HISTORY', 'CHANNELS'] 
  },
];

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  
  // Base Pricing
  salePrice: number;
  stock: number;
  lowStockThreshold: number;
  packSize?: number; // If > 1, it's a bundle/pack
  
  // Trader Specifics
  costPrice: number; // Purchase price from supplier
  supplier?: string;
  importDutyPercent?: number;

  // Manufacturer Specifics
  rawMaterialCost?: number; // Cost of fabric/materials OR components
  laborCost?: number; // Cost of sewing/assembly
  productionTimeDays?: number;

  description: string;
  features: string[];
  
  // Quality "Training" Data
  qualityStandards?: string;

  // Fashion Specifics (Optional if Generic)
  sizes?: string[];
  colors?: string[];
  
  // Type tag for hybrid filtering
  originType: 'MANUFACTURED' | 'IMPORTED';
}

// Initial Mock Data - Expanded for AI Testing
export const INITIAL_PRODUCTS: Product[] = [
  // --- FASHION (Manufactured) ---
  { 
      id: '1', name: 'Camiseta Algodón Premium', sku: 'TSH-001', category: 'Camisetas', 
      costPrice: 5.50, salePrice: 19.99, stock: 500, lowStockThreshold: 100, 
      description: '100% Algodón orgánico peinado', features: ['Transpirable', 'Pre-encogido', 'Eco-Friendly'],
      rawMaterialCost: 3.50, laborCost: 2.00, productionTimeDays: 2,
      originType: 'MANUFACTURED', supplier: 'Internal Factory',
      sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'], colors: ['Blanco', 'Negro', 'Gris Melange', 'Azul Marino'], packSize: 1,
      qualityStandards: 'El logo debe estar perfectamente centrado. Sin hilos sueltos en costuras. Etiqueta interna sin arrugas.'
  },
  { 
      id: '2', name: 'Jeans Slim Fit Denim', sku: 'JNS-SLIM-02', category: 'Pantalones', 
      costPrice: 12.00, salePrice: 45.00, stock: 45, lowStockThreshold: 50, // AI Trigger: Low Stock
      description: 'Denim elástico de alta resistencia', features: ['5 Bolsillos', 'Lavado a la piedra', 'Cierre YKK'],
      rawMaterialCost: 8.00, laborCost: 4.00, productionTimeDays: 4,
      originType: 'MANUFACTURED', supplier: 'Planta Norte',
      sizes: ['30', '32', '34', '36', '38'], colors: ['Azul Indigo', 'Negro'], packSize: 1,
      qualityStandards: 'Remaches metálicos deben estar firmes. El lavado a la piedra debe ser uniforme. Cremallera YKK funcional.'
  },
  
  // --- ELECTRONICS (Imported) ---
  { 
      id: '3', name: 'Smart Watch Series 5', sku: 'ELC-SW5', category: 'Wearables', 
      costPrice: 45.00, salePrice: 120.00, stock: 12, lowStockThreshold: 20, // AI Trigger: Critical Low
      description: 'Reloj inteligente con monitor cardiaco y GPS', features: ['Bluetooth 5.0', 'Waterproof IP68', 'Batería 7 días'],
      importDutyPercent: 10, originType: 'IMPORTED', supplier: 'TechShenzhen Ltd',
      colors: ['Black', 'Silver', 'Rose Gold'], packSize: 1,
      qualityStandards: 'La pantalla no debe tener rayones. El empaque debe incluir cargador y manual en inglés. Sello de seguridad intacto.'
  },
  { 
      id: '4', name: 'Auriculares Noise Cancel', sku: 'AUD-NC-PRO', category: 'Audio', 
      costPrice: 25.00, salePrice: 89.99, stock: 150, lowStockThreshold: 30, 
      description: 'Auriculares over-ear con cancelación activa', features: ['ANC', '30h Batería', 'USB-C'],
      importDutyPercent: 15, originType: 'IMPORTED', supplier: 'AudioGlobal CN',
      colors: ['Black', 'White'], packSize: 1
  },
  { 
      id: '5', name: 'Cargador Rápido GaN 65W', sku: 'PWR-GAN-65', category: 'Accesorios', 
      costPrice: 8.50, salePrice: 29.99, stock: 800, lowStockThreshold: 100, 
      description: 'Cargador compacto para laptops y móviles', features: ['GaN Tech', 'Dual USB-C', 'Compacto'],
      importDutyPercent: 5, originType: 'IMPORTED', supplier: 'TechShenzhen Ltd',
      packSize: 1
  },

  // --- INDUSTRIAL / HYBRID (Manufactured & Imported) ---
  { 
      id: '6', name: 'Válvula Industrial 2"', sku: 'IND-VLV-02', category: 'Hardware', 
      costPrice: 18.50, salePrice: 55.00, stock: 80, lowStockThreshold: 20, 
      description: 'Válvula de acero inoxidable alta presión', features: ['High Pressure', 'ISO Certified', '316 Steel'],
      rawMaterialCost: 12.50, laborCost: 5.00, productionTimeDays: 3,
      originType: 'MANUFACTURED', supplier: 'Internal Factory', packSize: 1,
      qualityStandards: 'Acabado pulido sin rebabas. Logotipo grabado con láser visible. Rosca sin daños.'
  },
  { 
      id: '7', name: 'Kit Sellos Hidráulicos', sku: 'IND-SEAL-KIT', category: 'Repuestos', 
      costPrice: 3.20, salePrice: 15.00, stock: 25, lowStockThreshold: 40, // AI Trigger: Low Stock
      description: 'Kit de mantenimiento preventivo', features: ['O-Rings', 'Gaskets', 'Lubricante'],
      importDutyPercent: 8, originType: 'IMPORTED', supplier: 'Seals & Parts Co.',
      packSize: 10
  },
  
  // --- FMCG (Generic) ---
  { 
      id: '8', name: 'Pack Botellas Vidrio 500ml', sku: 'PKG-GLS-500', category: 'Envases', 
      costPrice: 0.80, salePrice: 2.50, stock: 5000, lowStockThreshold: 1000, 
      description: 'Botellas para bebidas artesanales', features: ['Reciclable', 'Tapa incluida'],
      importDutyPercent: 0, originType: 'IMPORTED', supplier: 'GlassMasters',
      packSize: 24
  }
];

export interface Customer {
  id: string;
  name: string;
  company: string;
  email: string;
  phone?: string; // New field
  contactMethods: ('EMAIL' | 'WHATSAPP')[]; // New field
  status: 'Active' | 'Prospect' | 'Inactive';
  channel: SalesChannel; 
  lastOrderDate: string;
  totalSpend: number;
  outstandingBalance: number; 
}

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: '1', name: 'Alice Johnson', company: 'Moda Urbana S.A.', email: 'alice@modaurbana.com', phone: '+52 55 1234 5678', contactMethods: ['EMAIL', 'WHATSAPP'], status: 'Active', channel: 'DEPARTMENT_STORE', lastOrderDate: '2023-10-15', totalSpend: 42500, outstandingBalance: 0 },
  { id: '2', name: 'Bob Smith', company: 'Boutique Elegante', email: 'bob@boutique.net', phone: '+52 55 9876 5432', contactMethods: ['WHATSAPP'], status: 'Prospect', channel: 'BOUTIQUE', lastOrderDate: '-', totalSpend: 0, outstandingBalance: 0 },
  { id: '3', name: 'Charlie Davis', company: 'Mega Mayorista', email: 'charlie@megamayor.co', contactMethods: ['EMAIL'], status: 'Active', channel: 'WHOLESALE', lastOrderDate: '2024-02-10', totalSpend: 154000, outstandingBalance: 12000 },
  { id: '4', name: 'Diana Prince', company: 'Estilo Online', email: 'diana@estilo.com', phone: '+52 33 1122 3344', contactMethods: ['EMAIL', 'WHATSAPP'], status: 'Active', channel: 'ECOMMERCE', lastOrderDate: '2024-03-01', totalSpend: 28900, outstandingBalance: 4500 },
  { id: '5', name: 'Elena Torres', company: 'Mercado Libre Shop', email: '', phone: '+52 81 5566 7788', contactMethods: ['WHATSAPP'], status: 'Active', channel: 'MARKETPLACE', lastOrderDate: '2024-03-05', totalSpend: 8900, outstandingBalance: 0 },
  { id: '6', name: 'Frank Miller', company: 'Ropa x Kilo', email: 'frank@ropaxkilo.com', contactMethods: [], status: 'Inactive', channel: 'WHOLESALE', lastOrderDate: '2023-08-20', totalSpend: 67000, outstandingBalance: 500 },
];

export interface Sale {
  month: string;
  revenue: number;
  profit: number;
  type?: 'MANUFACTURED' | 'IMPORTED'; // For breakdown
}

// New: Historical Data Interface
export interface HistoricalDataPoint {
    year: number;
    month: number; // 1-12
    revenue: number;
    cost: number; 
    profit: number;
    // New: Supply Chain Specifics for AI
    unitsSold: number;
    unitsManufactured: number;
    unitsImported: number;
}

export type OrderStatus = 'Pendiente' | 'Procesando' | 'Enviado' | 'Entregado' | 'Cancelado';
export type PaymentStatus = 'PAID' | 'PENDING' | 'OVERDUE';

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
  selectedSize?: string;
  selectedColor?: string;
}

export interface OrderAttachment {
    id: string;
    name: string;
    type: 'INVOICE' | 'IMAGE' | 'DOCUMENT';
    url: string; // Base64 or URL
    date: string;
    uploadedBy: string;
}

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  totalAmount: number;
  trackingNumber?: string;
  logisticsProvider?: string;
  estimatedDelivery?: string;
  attachments?: OrderAttachment[];
  shippingCost?: number;
  insuranceCost?: number;
  
  // NEW: Credit & Payment Logic
  paymentTerms: number; // 0, 15, 30, 60 days
  dueDate: string; // ISO Date
  paymentStatus: PaymentStatus;
  remindersSent: number;
}

// Supply Chain Types
export type SupplyType = 'PURCHASE_ORDER' | 'PRODUCTION_ORDER';
export type SupplyStatus = 'DRAFT' | 'ORDERED' | 'IN_TRANSIT' | 'IN_PRODUCTION' | 'RECEIVED' | 'FINISHED' | 'CANCELLED';

export interface SupplyAttachment {
    id: string;
    url: string; // Base64
    type: 'DESIGN' | 'PRODUCTION_PROGRESS' | 'QUALITY_ALERT' | 'INVOICE';
    date: string;
    note?: string;
}

export interface SupplyOrder {
    id: string;
    type: SupplyType;
    productId: string;
    productName: string;
    quantity: number;
    costPerUnit: number;
    totalCost: number;
    supplierOrFacility: string; // Supplier Name or Factory Name
    orderDate: string;
    expectedArrivalDate: string;
    status: SupplyStatus;
    trackingNumber?: string;
    notes?: string;
    attachments: SupplyAttachment[];
    shippingCost?: number; // Added
    insuranceCost?: number; // Added
}

// Initial Supply Chain Data
export const INITIAL_SUPPLY_ORDERS: SupplyOrder[] = [
    {
        id: 'SUP-001',
        type: 'PURCHASE_ORDER',
        productId: '3', // Smart Watch
        productName: 'Smart Watch Series 5',
        quantity: 200,
        costPerUnit: 45.00,
        totalCost: 9500, // Inc shipping
        supplierOrFacility: 'TechShenzhen Ltd',
        orderDate: '2024-02-15',
        expectedArrivalDate: '2024-03-25',
        status: 'IN_TRANSIT',
        trackingNumber: 'OOLU8849201',
        attachments: [],
        shippingCost: 500,
        insuranceCost: 0
    },
    {
        id: 'SUP-002',
        type: 'PRODUCTION_ORDER',
        productId: '2', // Jeans
        productName: 'Jeans Slim Fit Denim',
        quantity: 500,
        costPerUnit: 12.00,
        totalCost: 6000,
        supplierOrFacility: 'Planta Norte',
        orderDate: '2024-03-01',
        expectedArrivalDate: '2024-03-20',
        status: 'IN_PRODUCTION',
        trackingNumber: 'LOTE-24-A',
        attachments: [],
        shippingCost: 0,
        insuranceCost: 0
    },
    {
        id: 'SUP-003',
        type: 'PURCHASE_ORDER',
        productId: '5', // Charger
        productName: 'Cargador Rápido GaN 65W',
        quantity: 1000,
        costPerUnit: 8.50,
        totalCost: 8800,
        supplierOrFacility: 'TechShenzhen Ltd',
        orderDate: '2024-01-10',
        expectedArrivalDate: '2024-02-15',
        status: 'RECEIVED',
        trackingNumber: 'DHL-992812',
        attachments: [],
        shippingCost: 300,
        insuranceCost: 0
    }
];

// New: Finance Types
export interface Invoice {
    id: string;
    orderId: string;
    customerId: string; // Added to link to Customer
    customerName: string;
    amount: number;
    issueDate: string;
    dueDate: string;
    status: PaymentStatus;
}

export interface CollectionSettings {
    daysBeforeDue: number;
    autoAiReminders: boolean;
    channels: ('EMAIL' | 'WHATSAPP')[];
}

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    date: string; // ISO String
    type: 'INFO' | 'SUCCESS' | 'ALERT';
    targetRoles: string[]; // e.g. ['CEO', 'Warehouse', 'Procurement']
    read: boolean;
}

export enum ViewState {
  SUPER_ADMIN = 'SUPER_ADMIN',
  DASHBOARD = 'DASHBOARD',
  INVENTORY = 'INVENTORY',
  ORDERS = 'ORDERS',
  SUPPLY_CHAIN = 'SUPPLY_CHAIN', // New View
  CRM = 'CRM',
  CHANNELS = 'CHANNELS', // New View
  PRESENTATION = 'PRESENTATION',
  FINANCE = 'FINANCE', // New View
  HISTORY = 'HISTORY' // New View
}
