
# TradeFlow Admin - Intelligent Wholesale Management SaaS

TradeFlow Admin is a high-performance, multi-tenant Dashboard designed for wholesale businesses, manufacturers, and hybrid traders. It leverages React 19, TypeScript, and Google Gemini AI to optimize inventory, supply chains, sales channels, and financial health.

![Dashboard Preview](https://via.placeholder.com/1200x600?text=TradeFlow+Dashboard+Preview)

## 🌟 Core Architecture

The application acts as a **Super App**, allowing different types of businesses (Manufacturers vs. Importers) to toggle specific modules and visualizations based on their operational model via a Super Admin interface.

### 🏗 Tech Stack
- **Frontend:** React 19, TypeScript, Vite
- **Styling:** Tailwind CSS (Dark/Light Mode)
- **AI Engine:** Google Gemini 2.5 Flash (Text & Vision) via `@google/genai`
- **Charting:** Recharts
- **Icons:** Lucide React
- **Utilities:** React Markdown, React QR Code, HTML5-QRCode

---

## 📦 Module Breakdown

### 1. Super Admin (Multi-Tenancy)
*   **Purpose:** Simulates a SaaS environment where a "Master Admin" manages different companies (Tenants).
*   **Features:**
    *   **Onboarding:** Create new companies with specific business models (Trader, Manufacturer, Hybrid).
    *   **Feature Flags:** Toggle active modules per company (e.g., enable CRM but disable Manufacturing).
    *   **Context Switching:** "Login as Tenant" functionality to inspect specific company data.

### 2. Dashboard (Command Center)
*   **Purpose:** High-level overview of business health.
*   **Features:**
    *   **Context Aware:** Changes metrics based on mode. Manufacturers see "Production Costs"; Traders see "Import Duties".
    *   **P&L Visualization:** Interactive charts showing Revenue vs. Profit.
    *   **AI Collections Widget:** An intelligent panel identifying overdue invoices and suggesting actions based on payment terms.

### 3. Inventory Management
*   **Purpose:** Real-time stock tracking with financial depth.
*   **Features:**
    *   **QR Code System:** Generate labels for products and scan them via webcam to audit stock physically.
    *   **Pack/Bundle Creator:** Create "Packs" (e.g., Size runs) from individual units dynamically.
    *   **Smart Costing:** Calculates total cost based on Raw Materials + Labor (Manu) or Purchase Price + Duty (Trader).

### 4. Supply Chain & Production
*   **Purpose:** Managing the flow of goods *into* the business.
*   **Features:**
    *   **Order Types:** Handles both `Purchase Orders` (from suppliers) and `Production Orders` (internal factories).
    *   **AI Forecasting:** Uses Gemini to analyze sales history and suggest reorder quantities to prevent stockouts.
    *   **AI Quality Control:** Upload a photo of a product, and the AI (Gemini Vision) analyzes it against defined quality standards to detect defects automatically.
    *   **Smart Invoice Scanning:** OCR to parse supplier invoices and auto-fill order forms.

### 5. Sales Orders
*   **Purpose:** Managing outgoing orders to B2B customers.
*   **Features:**
    *   **Matrix Ordering:** Efficient input for Size/Color variants (e.g., 10 Small/Red, 5 Med/Blue).
    *   **Fulfillment Verification:** Force-scan QR codes before marking an order as "Shipped" to ensure 100% accuracy.
    *   **Dynamic Pricing:** Auto-calculates shipping, insurance, and tax.

### 6. Channels & Profitability
*   **Purpose:** Financial analysis of different sales avenues.
*   **Features:**
    *   **Dynamic P&L:** Calculates Net Profit per channel (Wholesale, Own Store, E-commerce) by deducting specific Fixed Costs, Marketing Budgets, and Variable Costs.
    *   **Time Travel:** Toggle between Monthly, Quarterly, and Yearly views to see how fixed costs impact margins over time.

### 7. Finance & Collections
*   **Purpose:** Accounts receivable and cash flow optimization.
*   **Features:**
    *   **AI Collections Agent:** Generates polite but firm payment reminders (Email/WhatsApp) based on how many days an invoice is overdue.
    *   **Contact Validation:** Visual indicators showing if a customer has a valid Email or WhatsApp number before sending alerts.

### 8. AI Presentation Studio
*   **Purpose:** Marketing support.
*   **Features:** Uses Gemini to generate markdown-formatted sales pitches or cold emails based on specific product data (Price, Margin, Features).

---

## 🛠 Local Setup

1.  **Install dependencies:**
    ```bash
    npm install
    ```
2.  **Environment Setup:**
    Create a `.env` file in the root directory:
    ```env
    VITE_API_KEY=your_google_gemini_api_key
    ```
3.  **Run Development Server:**
    ```bash
    npm run dev
    ```

---

## 🚀 Roadmap to Production (Cloud & Database)

To take this application from a local demo (using `useState` and mock arrays) to a real-world SaaS product, follow this architectural implementation guide.

### 1. Backend-as-a-Service (BaaS) Selection
Since this is a React SPA, using a BaaS is the fastest path to production.
*   **Recommendation:** **Supabase** (Open-source Firebase alternative).
*   **Why?** It provides a hosted PostgreSQL database, Authentication, File Storage (for images), and Edge Functions out of the box.

### 2. Database Schema (PostgreSQL)
Migrate the TypeScript interfaces in `types.ts` to real SQL Tables.

**SQL Schema Strategy:**
*   **`tenants`**: `id, name, type, modules_config (jsonb)`
*   **`users`**: `id, email, tenant_id (FK), role`
*   **`products`**: `id, tenant_id (FK), sku, stock, cost_data (jsonb), quality_standards (text)`
*   **`customers`**: `id, tenant_id (FK), contact_info (jsonb), channel_id (FK)`
*   **`orders`**: `id, tenant_id (FK), customer_id (FK), status, total_amount, payment_status`
*   **`order_items`**: `id, order_id (FK), product_id (FK), quantity, variant_data (jsonb)`
*   **`supply_orders`**: `id, tenant_id (FK), type, status, ai_analysis_results (jsonb)`

**🔐 Security Critical:** Enable **Row Level Security (RLS)** in Supabase.
*   Create a policy: `auth.uid() = user_id` OR `tenant_id = (select tenant_id from users where id = auth.uid())`.
*   This ensures User A from "Company X" can **never** see data from "Company Y".

### 3. State Management & Data Fetching
Replace the `useState` mock data with a server-state library.
*   **Tool:** **TanStack Query (React Query)**.
*   **Implementation:**
    *   Instead of `const [products, setProducts] = useState(INITIAL_PRODUCTS)`, use:
        ```typescript
        const { data: products } = useQuery({
           queryKey: ['products', companyId],
           queryFn: async () => {
               const { data, error } = await supabase
                   .from('products')
                   .select('*')
                   .eq('tenant_id', companyId);
               if (error) throw error;
               return data;
           }
        })
        ```
    *   This handles caching, loading states, and auto-refetching/optimistic updates.

### 4. Authentication System
*   Replace `Login.tsx` mock logic.
*   Use `supabase.auth.signInWithPassword`.
*   Wrap the application in an `AuthProvider` context that listens for the session.
*   Store `role` and `tenant_id` in the user's `app_metadata` or a public `profiles` table to handle permissions efficiently.

### 5. File Storage (Images)
Currently, images are stored as Base64 strings (which bloats the browser memory).
*   **Production Approach:**
    1.  Create a Supabase Storage Bucket: `attachments`.
    2.  Folder structure: `/{tenant_id}/{order_id}/{filename}`.
    3.  Upload file -> Get Public URL -> Save URL in the database.

### 6. Secure AI Integration (Edge Functions)
**⚠️ IMPORTANT: Never expose `VITE_API_KEY` in a production frontend build.**

1.  **Create a Backend Function:** Use Supabase Edge Functions (Deno/Node).
2.  **Environment:** Store the Gemini API Key in the server-side secrets.
3.  **Flow:**
    *   **Frontend:** `POST /functions/v1/generate-ai-response` with `{ prompt, contextData }`.
    *   **Backend:**
        1.  Validate User Session (JWT).
        2.  Call Google Gemini API.
        3.  Return result to frontend.

### 7. Deployment
*   **Frontend:** Deploy to **Vercel** or **Netlify**. Connect your GitHub repo.
*   **Environment Variables:** Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the deployment platform.

### 8. Cost Optimization
*   **Free Tier:** You can launch comfortably on Vercel (Hobby) + Supabase (Free Tier) + Google Gemini (Free Tier).
*   **Scaling:** As you add real tenants, move to paid tiers. The PostgreSQL + React architecture scales vertically very well.
