import React, { useState } from 'react';
import { Product } from '../types';
import { generatePresentationContent } from '../services/geminiService';
import { Sparkles, FileText, Mail, Loader2, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

// Reuse initial products mock for selection translated
const products: Product[] = [
  { id: '1', name: 'Camiseta Algodón Premium', sku: 'TSH-001', category: 'Camisetas', costPrice: 5.50, salePrice: 19.99, stock: 500, lowStockThreshold: 50, description: '100% Algodón orgánico peinado', features: ['Transpirable', 'Pre-encogido', 'Corte Regular'], originType: 'MANUFACTURED' },
  { id: '2', name: 'Jeans Slim Fit Azul', sku: 'JNS-102', category: 'Pantalones', costPrice: 14.00, salePrice: 45.00, stock: 200, lowStockThreshold: 30, description: 'Denim elástico duradero', features: ['5 Bolsillos', 'Costuras reforzadas', 'Lavado a la piedra'], originType: 'IMPORTED' },
  { id: '3', name: 'Vestido Verano Floral', sku: 'DRS-055', category: 'Vestidos', costPrice: 18.50, salePrice: 49.99, stock: 80, lowStockThreshold: 20, description: 'Diseño ligero y fresco para temporada', features: ['Estampado floral', 'Cintura ajustable', 'Tela viscosa'], originType: 'MANUFACTURED' },
  { id: '4', name: 'Chaqueta Bomber Urbana', sku: 'JKT-021', category: 'Abrigos', costPrice: 25.00, salePrice: 69.99, stock: 120, lowStockThreshold: 40, description: 'Estilo moderno casual', features: ['Impermeable', 'Forro interior', 'Cierre metálico'], originType: 'IMPORTED' },
];

export const PresentationMaker: React.FC = () => {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0].id);
  const [contentType, setContentType] = useState<'sales_pitch' | 'email_draft'>('sales_pitch');
  const [generatedContent, setGeneratedContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    const product = products.find(p => p.id === selectedProductId);
    if (!product) return;

    setIsLoading(true);
    setGeneratedContent('');
    
    const content = await generatePresentationContent(product, contentType);
    
    setGeneratedContent(content);
    setIsLoading(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            Estudio de Contenido y Presentaciones IA <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
        </h1>
        <p className="text-gray-500 dark:text-gray-400">Genere textos de marketing y presentaciones de ventas al instante para sus productos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Controls */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-fit transition-colors">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Configuración</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seleccionar Producto</label>
              <select 
                className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tipo de Contenido</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setContentType('sales_pitch')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all
                    ${contentType === 'sales_pitch' 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-400' 
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <FileText className="w-5 h-5 mb-1" />
                  Presentación de Ventas
                </button>
                <button
                  onClick={() => setContentType('email_draft')}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all
                    ${contentType === 'email_draft' 
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 border-indigo-500 text-indigo-700 dark:text-indigo-400' 
                      : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <Mail className="w-5 h-5 mb-1" />
                  Correo en Frío
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isLoading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {isLoading ? <><Loader2 className="w-5 h-5 animate-spin" /> Generando...</> : <><Sparkles className="w-5 h-5" /> Generar con IA</>}
            </button>
          </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                <h4 className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Consejo Pro</h4>
                <p className="text-xs text-blue-600 dark:text-blue-400 leading-relaxed">
                    La IA utiliza las características y márgenes del producto seleccionado para adaptar el discurso específicamente para mayoristas que buscan maximizar ganancias.
                </p>
            </div>
        </div>

        {/* Preview Area */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden transition-colors">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                <h3 className="font-semibold text-gray-700 dark:text-gray-300">Vista Previa del Contenido</h3>
                {generatedContent && (
                    <button 
                        onClick={handleCopy}
                        className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 text-sm font-medium"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? '¡Copiado!' : 'Copiar'}
                    </button>
                )}
            </div>
            <div className="flex-1 p-8 overflow-y-auto bg-white dark:bg-gray-800">
                {isLoading ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <Loader2 className="w-10 h-10 animate-spin mb-4 text-indigo-200 dark:text-indigo-800" />
                        <p>Creando su contenido...</p>
                    </div>
                ) : generatedContent ? (
                    <div className="prose prose-indigo dark:prose-invert max-w-none text-gray-700 dark:text-gray-300">
                        <ReactMarkdown>{generatedContent}</ReactMarkdown>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-300 dark:text-gray-600">
                        <Sparkles className="w-16 h-16 mb-4 opacity-20" />
                        <p>Seleccione un producto y haga clic en generar para ver los resultados.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};