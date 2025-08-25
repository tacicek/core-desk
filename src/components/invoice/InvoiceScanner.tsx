import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useVendor } from '@/contexts/VendorContext';

interface ScannedInvoiceData {
  vendor_name: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  currency: string;
  description: string;
  category: string;
  confidence: number;
  needs_review: boolean;
}

interface ScanResult {
  success: boolean;
  invoice?: any;
  extracted_data?: ScannedInvoiceData;
  error?: string;
}

export function InvoiceScanner() {
  const { toast } = useToast();
  const { vendor, userProfile } = useVendor();
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scanProgress, setScanProgress] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isUsingCamera, setIsUsingCamera] = useState(false);

  const handleFileSelect = useCallback((file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';
    
    if (!isImage && !isPDF) {
      toast({
        title: "Ungültige Datei",
        description: "Bitte wählen Sie eine Bilddatei oder PDF aus",
        variant: "destructive",
      });
      return;
    }

    setSelectedFile(file);
    setScanResult(null);
  }, [toast]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setIsUsingCamera(true);
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast({
        title: "Kamerazugriff",
        description: "Kamerazugriff wurde verweigert oder keine Kamera verfügbar",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsUsingCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], 'camera-capture.jpg', { type: 'image/jpeg' });
          handleFileSelect(file);
          stopCamera();
        }
      }, 'image/jpeg', 0.8);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const scanInvoice = async () => {
    if (!selectedFile || !vendor || !userProfile) {
      toast({
        title: "Fehler",
        description: "Datei auswählen und sicherstellen, dass Sitzungsinformationen geladen sind",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setScanResult(null);
    setScanProgress('Datei wird vorbereitet...');

    try {
      const isImage = selectedFile.type.startsWith('image/');
      const isPDF = selectedFile.type === 'application/pdf';
      let result;

      if (isPDF) {
        setScanProgress('PDF wird hochgeladen...');
        // For PDF files, use FormData to upload the file directly
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('vendor_id', vendor.id);
        formData.append('user_id', userProfile.user_id);

        setScanProgress('KI analysiert PDF...');
        // Call scan-invoice edge function with FormData
        const { data: sessionData } = await supabase.auth.getSession();
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co'}/functions/v1/scan-invoice`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${sessionData.session?.access_token}`,
            },
            body: formData,
          }
        );

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Scan fehlgeschlagen');
        }

        result = data;
        setScanResult(data);
      } else {
        setScanProgress('Bild wird verarbeitet...');
        // For images, use the existing base64 method
        const imageBase64 = await fileToBase64(selectedFile);

        setScanProgress('KI extrahiert Daten...');
        const { data, error } = await supabase.functions.invoke('scan-invoice', {
          body: {
            image_base64: imageBase64,
            vendor_id: vendor.id,
            user_id: userProfile.user_id,
          },
        });

        if (error) {
          throw error;
        }

        result = data;
        setScanResult(data);
      }
      
      setScanProgress('Speichere in Datenbank...');
      
      // Check the actual result, not the async state
      if (result?.success) {
        toast({
          title: "Scan erfolgreich!",
          description: `${isPDF ? 'PDF' : 'Bild'} von ${result.extracted_data?.vendor_name} über ${result.extracted_data?.amount} ${result.extracted_data?.currency} verarbeitet`,
        });
      } else {
        throw new Error(result?.error || 'Scan fehlgeschlagen');
      }

    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: "Scan-Fehler",
        description: error instanceof Error ? error.message : "Fehler beim Scannen der Rechnung",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
      setScanProgress('');
    }
  };

  const resetScanner = () => {
    setSelectedFile(null);
    setScanResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Intelligenter Rechnungsscanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Section */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              Datei wählen
            </Button>
            <Button
              variant="outline"
              onClick={isUsingCamera ? stopCamera : startCamera}
              className="flex-1"
            >
              <Camera className="h-4 w-4 mr-2" />
              {isUsingCamera ? 'Kamera schließen' : 'Kamera öffnen'}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileInputChange}
            className="hidden"
          />
        </div>

        {/* Camera Section */}
        {isUsingCamera && (
          <div className="space-y-4">
            <video
              ref={videoRef}
              className="w-full max-h-64 object-cover rounded-lg border"
              autoPlay
              playsInline
            />
            <Button onClick={capturePhoto} className="w-full">
              Foto aufnehmen
            </Button>
          </div>
        )}

        {/* Selected File Preview */}
        {selectedFile && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg bg-muted/50">
              <p className="text-sm font-medium">Ausgewählte Datei:</p>
              <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {Math.round(selectedFile.size / 1024)} KB
              </p>
            </div>

            {/* Preview Image or PDF */}
            {selectedFile.type.startsWith('image/') ? (
              <img
                src={URL.createObjectURL(selectedFile)}
                alt="Ausgewählte Rechnung"
                className="w-full max-h-64 object-contain rounded-lg border"
              />
            ) : (
              <div className="w-full h-32 flex items-center justify-center border rounded-lg bg-muted/50">
                <div className="text-center">
                  <p className="text-sm font-medium">PDF Dokument</p>
                  <p className="text-xs text-muted-foreground">{selectedFile.name}</p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button 
                onClick={scanInvoice} 
                disabled={isScanning}
                className="flex-1"
              >
                {isScanning ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Wird gescannt...
                    </div>
                    {scanProgress && (
                      <span className="text-xs opacity-80 mt-1">{scanProgress}</span>
                    )}
                  </div>
                ) : (
                  'Rechnung scannen'
                )}
              </Button>
              <Button variant="outline" onClick={resetScanner} disabled={isScanning}>
                Zurücksetzen
              </Button>
            </div>
          </div>
        )}

        {/* Scan Results */}
        {scanResult && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {scanResult.success ? (
                <>
                  <Check className="h-5 w-5 text-green-600" />
                  <span className="font-medium text-green-600">Scan erfolgreich!</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-600">Scan fehlgeschlagen</span>
                </>
              )}
            </div>

            {scanResult.success && scanResult.extracted_data && (
              <div className="grid gap-4 p-4 border rounded-lg bg-muted/50">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold">Extrahierte Informationen</h3>
                  <div className="flex gap-2">
                    <Badge 
                      variant={scanResult.extracted_data.confidence > 0.8 ? "default" : "secondary"}
                    >
                      {Math.round(scanResult.extracted_data.confidence * 100)}% Vertrauen
                    </Badge>
                    {scanResult.extracted_data.needs_review && (
                      <Badge variant="destructive">
                        Überprüfung erforderlich
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Firma:</span>
                    <p>{scanResult.extracted_data.vendor_name}</p>
                  </div>
                  <div>
                    <span className="font-medium">Rechnung Nr.:</span>
                    <p>{scanResult.extracted_data.invoice_number}</p>
                  </div>
                  <div>
                    <span className="font-medium">Rechnungsdatum:</span>
                    <p>{scanResult.extracted_data.invoice_date}</p>
                  </div>
                  <div>
                    <span className="font-medium">Fälligkeitsdatum:</span>
                    <p>{scanResult.extracted_data.due_date}</p>
                  </div>
                  <div>
                    <span className="font-medium">Betrag:</span>
                    <p className="font-bold">
                      {scanResult.extracted_data.amount} {scanResult.extracted_data.currency}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">Kategorie:</span>
                    <p>{scanResult.extracted_data.category}</p>
                  </div>
                </div>

                {scanResult.extracted_data.description && (
                  <div>
                    <span className="font-medium">Beschreibung:</span>
                    <p className="text-sm text-muted-foreground">
                      {scanResult.extracted_data.description}
                    </p>
                  </div>
                )}
              </div>
            )}

            {scanResult.error && (
              <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                <p className="text-sm text-red-600">{scanResult.error}</p>
              </div>
            )}
          </div>
        )}

        {/* Info */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Laden Sie Ihr Rechnungsbild (JPG, PNG) oder PDF hoch oder fotografieren Sie es</p>
          <p>• KI extrahiert automatisch die Rechnungsinformationen aus Bildern und PDFs</p>
          <p>• Sie erhalten eine Erinnerung, wenn sich das Fälligkeitsdatum nähert</p>
        </div>
      </CardContent>
    </Card>
  );
}