import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileImage, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InvoiceUploadAreaProps {
  onUpload: (file: File) => Promise<void>;
}

export function InvoiceUploadArea({ onUpload }: InvoiceUploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes('image/') && !file.type.includes('pdf')) {
      alert('Bitte laden Sie nur Bild- oder PDF-Dateien hoch.');
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
          isDragOver 
            ? "border-primary bg-primary/5" 
            : "border-border hover:border-primary/50",
          isUploading && "opacity-50 pointer-events-none"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4">
          {isUploading ? (
            <Loader2 className="h-12 w-12 text-primary animate-spin" />
          ) : (
            <FileImage className="h-12 w-12 text-muted-foreground" />
          )}
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              {isUploading ? 'Rechnung wird hochgeladen...' : 'Rechnung hier hinziehen'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isUploading 
                ? 'KI-Analyse wird gestartet...' 
                : 'oder klicken Sie, um eine Datei auszuwählen (JPG, PNG, PDF)'
              }
            </p>
          </div>

          {!isUploading && (
            <Button onClick={handleButtonClick} variant="outline">
              <Upload className="h-4 w-4 mr-2" />
              Datei auswählen
            </Button>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="text-xs text-muted-foreground">
        <p><strong>Unterstützte Formate:</strong> JPG, PNG, PDF</p>
        <p><strong>Maximale Dateigröße:</strong> 10MB</p>
        <p><strong>KI-Analyse:</strong> Nach dem Upload wird die Rechnung automatisch mit N8n analysiert</p>
      </div>
    </div>
  );
}