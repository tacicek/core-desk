import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface LocalApiKeyInputProps {
  keyName: string;
  label: string;
  placeholder: string;
  helpText?: string;
  helpLink?: string;
  onKeyChange?: () => void;
}

export function LocalApiKeyInput({ 
  keyName, 
  label, 
  placeholder, 
  helpText, 
  helpLink,
  onKeyChange
}: LocalApiKeyInputProps) {
  const [value, setValue] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadExistingKey();
  }, [keyName]);

  const loadExistingKey = () => {
    try {
      const existingKey = localStorage.getItem(keyName);
      if (existingKey && existingKey.trim().length > 0) {
        setHasExistingKey(true);
        setValue('***********'); // Show masked value
      }
    } catch (error) {
      console.error('Error loading API key from localStorage:', error);
      setHasExistingKey(false);
    }
  };

  const saveApiKey = () => {
    if (!value || value === '***********' || !value.trim()) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie einen gültigen API-Schlüssel ein.",
        variant: "destructive"
      });
      return;
    }
    
    try {
      localStorage.setItem(keyName, value.trim());
      setHasExistingKey(true);
      setValue('***********');
      setIsVisible(false);
      onKeyChange?.();
      
      toast({
        title: "API-Schlüssel gespeichert",
        description: "Ihr API-Schlüssel wurde lokal gespeichert.",
      });
    } catch (error) {
      console.error('Error saving API key to localStorage:', error);
      toast({
        title: "Speicherfehler",
        description: "API-Schlüssel konnte nicht gespeichert werden. Überprüfen Sie die Browser-Einstellungen.",
        variant: "destructive"
      });
    }
  };

  const deleteApiKey = () => {
    try {
      localStorage.removeItem(keyName);
      setHasExistingKey(false);
      setValue('');
      setIsVisible(false);
      onKeyChange?.();
      
      toast({
        title: "API-Schlüssel gelöscht",
        description: "Ihr API-Schlüssel wurde gelöscht.",
      });
    } catch (error) {
      console.error('Error deleting API key from localStorage:', error);
      toast({
        title: "Löschfehler",
        description: "API-Schlüssel konnte nicht gelöscht werden.",
        variant: "destructive"
      });
    }
  };

  const toggleVisibility = () => {
    if (hasExistingKey && !isVisible) {
      // Show input to edit existing key
      setValue('');
      setIsVisible(true);
    } else {
      setIsVisible(!isVisible);
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={keyName}>{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={keyName}
            type={isVisible ? "text" : "password"}
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={hasExistingKey && value === '***********'}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-7 w-7 p-0"
            onClick={toggleVisibility}
          >
            {isVisible ? (
              <EyeOffIcon className="h-4 w-4" />
            ) : (
              <EyeIcon className="h-4 w-4" />
            )}
          </Button>
        </div>
        {value && value !== '***********' && (
          <Button
            type="button"
            onClick={saveApiKey}
            size="sm"
          >
            Speichern
          </Button>
        )}
        {hasExistingKey && (
          <Button
            type="button"
            variant="destructive"
            onClick={deleteApiKey}
            size="sm"
          >
            Löschen
          </Button>
        )}
      </div>
      {helpText && (
        <p className="text-xs text-muted-foreground">
          {helpText}
          {helpLink && (
            <>
              {' '}
              <a 
                href={helpLink}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                {new URL(helpLink).hostname}
              </a>
            </>
          )}
        </p>
      )}
    </div>
  );
}