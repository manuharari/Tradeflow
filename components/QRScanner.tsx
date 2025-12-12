
import React, { useEffect, useState, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { X, Camera, RefreshCw } from 'lucide-react';

interface QRScannerProps {
    onScanSuccess: (decodedText: string) => void;
    onClose: () => void;
    instructionText?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({ onScanSuccess, onClose, instructionText }) => {
    const [permissionError, setPermissionError] = useState(false);
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isScanningRef = useRef(false);
    
    useEffect(() => {
        const scannerId = "reader";
        
        const startScanner = async () => {
            try {
                // Ensure previous instance is cleared if any
                if (scannerRef.current) {
                    try {
                        await scannerRef.current.stop();
                        scannerRef.current.clear();
                    } catch (e) {
                        // ignore stop error
                    }
                }

                const html5QrCode = new Html5Qrcode(scannerId);
                scannerRef.current = html5QrCode;
                
                const config = { 
                    fps: 10, 
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: 1.0,
                    formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
                };

                await html5QrCode.start(
                    { facingMode: "environment" }, // Prefer back camera
                    config,
                    (decodedText) => {
                        // Success callback
                        if (isScanningRef.current) {
                            onScanSuccess(decodedText);
                            // Optionally stop scanning immediately or wait for parent to unmount
                        }
                    },
                    (errorMessage) => {
                        // Error callback (scanning...)
                    }
                );
                isScanningRef.current = true;
            } catch (err) {
                console.error("Error starting scanner", err);
                setPermissionError(true);
            }
        };

        // Small timeout to allow DOM to render
        const timeoutId = setTimeout(() => {
            startScanner();
        }, 100);

        return () => {
            clearTimeout(timeoutId);
            isScanningRef.current = false;
            if (scannerRef.current && scannerRef.current.isScanning) {
                scannerRef.current.stop().then(() => {
                    scannerRef.current?.clear();
                }).catch(err => console.error("Failed to stop scanner cleanup", err));
            }
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl overflow-hidden relative shadow-2xl flex flex-col">
                <div className="p-4 bg-gray-900 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Camera className="w-5 h-5 text-indigo-400" />
                        <h3 className="font-bold">Escáner Activo</h3>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-700 rounded-full">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="relative bg-black h-80 w-full flex flex-col justify-center items-center overflow-hidden">
                    {!permissionError ? (
                        <>
                            <div id="reader" className="w-full h-full object-cover"></div>
                            {/* Overlay Guidelines */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="w-64 h-64 border-2 border-indigo-500/50 rounded-lg relative">
                                    <div className="absolute top-0 left-0 w-4 h-4 border-l-4 border-t-4 border-indigo-500 -ml-1 -mt-1"></div>
                                    <div className="absolute top-0 right-0 w-4 h-4 border-r-4 border-t-4 border-indigo-500 -mr-1 -mt-1"></div>
                                    <div className="absolute bottom-0 left-0 w-4 h-4 border-l-4 border-b-4 border-indigo-500 -ml-1 -mb-1"></div>
                                    <div className="absolute bottom-0 right-0 w-4 h-4 border-r-4 border-b-4 border-indigo-500 -mr-1 -mb-1"></div>
                                </div>
                            </div>
                            <div className="absolute bottom-4 bg-black/50 text-white px-4 py-1 rounded-full text-xs animate-pulse">
                                Buscando código QR...
                            </div>
                        </>
                    ) : (
                        <div className="text-center p-6 text-white">
                            <Camera className="w-12 h-12 text-red-500 mx-auto mb-2" />
                            <p>No se pudo acceder a la cámara.</p>
                            <p className="text-xs text-gray-400 mt-2">Por favor permita el acceso o use un dispositivo móvil.</p>
                        </div>
                    )}
                </div>

                <div className="p-6 text-center">
                    <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">
                        {instructionText || "Apunta al código QR del producto"}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        El sistema detectará automáticamente el código.
                    </p>
                </div>
            </div>
        </div>
    );
};
