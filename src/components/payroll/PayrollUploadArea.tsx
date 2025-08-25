import React, { useState, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface PayrollUploadAreaProps {
  onUpload: (files: File[]) => Promise<void>;
}

export function PayrollUploadArea({ onUpload }: PayrollUploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = '.pdf,.xlsx,.xls,.csv';
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const validateFiles = (files: File[]): { valid: File[], invalid: string[] } => {
    const valid: File[] = [];
    const invalid: string[] = [];

    files.forEach(file => {
      const isValidType = file.type === 'application/pdf' || 
                         file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                         file.type === 'application/vnd.ms-excel' ||
                         file.type === 'text/csv' ||
                         file.name.endsWith('.pdf') ||
                         file.name.endsWith('.xlsx') ||
                         file.name.endsWith('.xls') ||
                         file.name.endsWith('.csv');

      if (!isValidType) {
        invalid.push(`${file.name}: Nicht unterstütztes Dateiformat`);
      } else if (file.size > maxFileSize) {
        invalid.push(`${file.name}: Datei zu groß (max. 10MB)`);
      } else {
        valid.push(file);
      }
    });

    return { valid, invalid };
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileUpload(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileUpload(files);
  };

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    const { valid, invalid } = validateFiles(files);

    if (invalid.length > 0) {
      setUploadStatus('error');
      setErrorMessage(invalid.join('\n'));
      return;
    }

    setIsUploading(true);
    setUploadStatus('idle');
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      await onUpload(valid);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');
      
      // Reset after 3 seconds
      setTimeout(() => {
        setUploadStatus('idle');
        setUploadProgress(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }, 3000);
    } catch (error) {
      setUploadStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten');
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Lohnabrechnungen hochladen
        </CardTitle>
        <CardDescription>
          PDF, Excel (XLSX/XLS) oder CSV Lohnabrechnungsdateien können hochgeladen werden
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragOver
              ? 'border-primary bg-primary/5'
              : isUploading
              ? 'border-blue-300 bg-blue-50'
              : uploadStatus === 'success'
              ? 'border-green-300 bg-green-50'
              : uploadStatus === 'error'
              ? 'border-red-300 bg-red-50'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {isUploading ? (
              <div className="space-y-4">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Dateien werden hochgeladen...</p>
                <Progress value={uploadProgress} className="w-full max-w-md mx-auto" />
                <p className="text-xs text-muted-foreground">{uploadProgress}%</p>
              </div>
            </div>
          ) : uploadStatus === 'success' ? (
            <div className="space-y-2">
              <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
              <p className="text-sm text-green-600 font-medium">Dateien erfolgreich hochgeladen!</p>
              <p className="text-xs text-muted-foreground">
                Lohnabrechnungsdaten werden verarbeitet und analysiert...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="text-lg font-medium mb-2">
                  Dateien hier hineinziehen
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  oder klicken um Dateien auszuwählen
                </p>
                <Button onClick={handleButtonClick} variant="outline">
                  Datei auswählen
                </Button>
              </div>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Unterstützte Formate: PDF, XLSX, XLS, CSV</p>
                <p>Maximale Dateigröße: 10MB</p>
                <p>Mehrere Dateien können ausgewählt werden</p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedTypes}
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {uploadStatus === 'error' && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="whitespace-pre-line">
              {errorMessage}
            </AlertDescription>
          </Alert>
        )}

        <div className="mt-4 text-xs text-muted-foreground">
          <p className="font-medium mb-2">Unterstützte Lohnabrechnungsformate:</p>
          <ul className="space-y-1 ml-4">
            <li>• PDF Lohnabrechnungsdateien (OCR für Texterkennung)</li>
            <li>• Excel-Dateien (.xlsx, .xls)</li>
            <li>• CSV-Dateien (Komma oder Semikolon getrennt)</li>
            <li>• Deutsche und englische Lohnabrechnungsterminologie</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}