
import { GoogleGenAI } from "@google/genai";
import { Product, HistoricalDataPoint } from "../types";

const apiKey = process.env.API_KEY || '';

// Initialize the client
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export const generatePresentationContent = async (product: Product, type: 'sales_pitch' | 'email_draft'): Promise<string> => {
  if (!ai) {
    return "Falta la clave API. Por favor configura tu API Key para usar las funciones de IA.";
  }

  try {
    const prompt = type === 'sales_pitch' 
      ? `Crea un esquema de presentación de ventas estructurado para un producto mayorista. 
         Producto: ${product.name}
         Características: ${product.features.join(', ')}
         Consideración de costo para el revendedor: Potencial de alto margen.
         
         Formato de salida: Markdown en Español. Incluye 3 diapositivas: 1. Gancho/Problema, 2. Solución (Producto), 3. Valor Comercial (Rentabilidad).`
      : `Escribe un correo electrónico profesional y persuasivo de venta en frío para un minorista presentando este producto.
         Producto: ${product.name}
         Categoría: ${product.category}
         Punto de venta clave: Grandes márgenes de ganancia.
         
         Formato de salida: Texto plano en Español, listo para copiar.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "No se pudo generar el contenido.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Ocurrió un error al generar el contenido. Por favor intenta de nuevo.";
  }
};

export interface QualityAnalysisResult {
    status: 'PASS' | 'FAIL' | 'WARNING';
    reason: string;
}

export const analyzeQualityControlImage = async (base64Image: string, standardsContext?: string): Promise<QualityAnalysisResult> => {
    if (!ai) return { status: 'WARNING', reason: 'API Key missing.' };

    try {
        const base64Data = base64Image.split(',')[1] || base64Image;

        const prompt = `You are a strict Quality Control Inspector. 
        Specific Quality Standards for this product (Training Context): "${standardsContext || 'Standard commercial quality criteria. No damage, no stains, proper packaging.'}".
        
        Analyze this image of the product. 
        Compare it against the standards above.
        Look for defects like: damage, stains, errors, poor finish, or packaging issues.
        
        Respond with a JSON object ONLY, no markdown formatting:
        {
            "status": "PASS" (if meets standards), "FAIL" (if defects found), or "WARNING" (if unclear/minor issue),
            "reason": "A short description in Spanish of what you see and if it complies (max 20 words)."
        }`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: prompt }
                ]
            }
        });

        const text = response.text || '';
        // Improved JSON extraction
        const match = text.match(/\{[\s\S]*\}/);
        const jsonStr = match ? match[0] : '{}';
        
        return JSON.parse(jsonStr) as QualityAnalysisResult;

    } catch (e) {
        console.error("Vision AI Error:", e);
        return { status: 'WARNING', reason: 'Error al analizar la imagen.' };
    }
};

export interface InvoiceData {
    supplierName?: string;
    totalAmount?: number;
    date?: string;
    itemsSummary?: string;
}

export const parseInvoiceDocument = async (base64Image: string): Promise<InvoiceData> => {
    if (!ai) return {};

    try {
        const base64Data = base64Image.split(',')[1] || base64Image;

        const prompt = `Analyze this invoice image. Extract the following details into a JSON object.
        If a field is not found, leave it as null or 0.
        
        Response JSON format:
        {
            "supplierName": "string",
            "totalAmount": number,
            "date": "YYYY-MM-DD",
            "itemsSummary": "string (short summary of what is being bought)"
        }`;

        const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: base64Data } },
                    { text: prompt }
                ]
            }
        });

        const text = response.text || '';
        const match = text.match(/\{[\s\S]*\}/);
        const jsonStr = match ? match[0] : '{}';
        return JSON.parse(jsonStr) as InvoiceData;

    } catch (error) {
        console.error("OCR Error:", error);
        return {};
    }
};

export interface DemandForecast {
    productId: string;
    productName: string;
    predictedDemand: number;
    suggestedReorder: number;
    reasoning: string;
}

export const generateDemandForecast = async (products: Product[], salesHistory: any[]): Promise<DemandForecast[]> => {
    if (!ai) return [];

    try {
        // Prepare simplified data context for AI
        const context = products.map(p => ({
            id: p.id,
            name: p.name,
            currentStock: p.stock,
            lowStockThreshold: p.lowStockThreshold
        }));

        const prompt = `Act as a Supply Chain Demand Planner.
        Here is the current inventory status: ${JSON.stringify(context)}.
        Here is recent sales data (mock context): Generally high demand for items with low stock. Seasonal trends apply.
        
        Constraint: Respond in Spanish. Keep the reasoning very brief.
        
        Predict which items are at risk of stockout next month.
        Return a JSON array of objects. ONLY return items that need reordering.
        
        Format:
        [
            {
                "productId": "id",
                "productName": "name",
                "predictedDemand": number,
                "suggestedReorder": number,
                "reasoning": "short spanish explanation"
            }
        ]`;

        const response = await ai.models.generateContent({
             model: 'gemini-2.5-flash',
             contents: prompt
        });

        const text = response.text || '';
        
        // Fix: Use Regex to extract the array, ignoring potential markdown code blocks
        const match = text.match(/\[[\s\S]*\]/);
        const jsonStr = match ? match[0] : '[]';
        
        return JSON.parse(jsonStr) as DemandForecast[];

    } catch (error) {
        console.error("Forecast Error:", error);
        return [];
    }
}

export const analyzeHistoricalTrend = async (data: HistoricalDataPoint[]): Promise<string> => {
    if (!ai) return "Por favor configure su API Key para ver análisis de tendencias.";

    try {
        const prompt = `Act as a Senior Operations Manager.
        
        Here is the 5-year historical data (Monthly resolution):
        ${JSON.stringify(data)}
        
        Fields: unitsSold, unitsManufactured, unitsImported.
        
        Tasks:
        1. Compare ACTUAL TREND vs HISTORICAL averages.
        2. Predict FUTURE CONSUMPTION for the next season.
        3. Recommend specific mix (Manufacture vs Import).
        
        CRITICAL CONSTRAINTS:
        - Response MUST be under 300 words.
        - Response MUST be in Spanish.
        - Use Markdown.
        - Be direct and actionable. No fluff.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });

        return response.text || "No se pudo generar el análisis.";

    } catch (error) {
        console.error("Historical Analysis Error:", error);
        return "Error al analizar los datos históricos.";
    }
};

export const generateCollectionsMessage = async (customerName: string, amountDue: number, daysOverdue: number, invoiceId: string): Promise<string> => {
    if (!ai) return "Error: API Key missing";

    const isEarlyReminder = daysOverdue < 0; // 5 days before due date
    
    const prompt = `Act as a polite but firm Accounts Receivable specialist.
    Generate a short message (for Email/WhatsApp) to customer "${customerName}".
    Invoice ID: ${invoiceId}
    Amount: $${amountDue}
    
    Context:
    ${isEarlyReminder 
      ? "The payment is due in upcoming days. This is a friendly reminder." 
      : `The payment is ${daysOverdue} days OVERDUE. Request immediate payment. Be professional.`}
    
    Format: Plain text in Spanish. Keep it under 50 words for WhatsApp friendly reading.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt
        });
        return response.text || "Recordatorio de pago pendiente.";
    } catch (e) {
        return "Estimado cliente, le recordamos su pago pendiente.";
    }
};

export const analyzeCreditRisk = async (orders: any[]): Promise<string[]> => {
    if (!ai) return [];
    // Simulating AI analyzing payment patterns
    // In real app, pass order history
    return [];
};
