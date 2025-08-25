import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useVendor } from "@/contexts/VendorContext";

interface SecureApiKeyInputProps {
  secretType: string;
  label: string;
  placeholder: string;
  helpText?: string;
  helpLink?: string;
}

export function SecureApiKeyInput({ 
  secretType, 
  label, 
  placeholder, 
  helpText, 
  helpLink 
}: SecureApiKeyInputProps) {
  const [value, setValue] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasExistingKey, setHasExistingKey] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const { vendor } = useVendor();

  useEffect(() => {
    loadExistingKey();
  }, [secretType]);

  const loadExistingKey = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('vendor_secrets')
        .select('encrypted_value')
        .eq('secret_type', secretType)
        .maybeSingle();

      if (data && !error) {
        setHasExistingKey(true);
        setValue('***********'); // Show masked value
      }
    } catch (error) {
      // No existing key, which is fine
    }
  };

  const saveApiKey = async () => {
    if (!user || !vendor || !value || value === '***********') return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('vendor_secrets')
        .upsert({
          vendor_id: vendor.id,
          secret_type: secretType,
          encrypted_value: value,
          user_id: user.id,
          created_by: user.id
        });

      if (error) throw error;

      setHasExistingKey(true);
      setValue('***********');
      setIsVisible(false);
      
      toast({
        title: "API-Schlüssel gespeichert",
        description: "Ihr API-Schlüssel wurde sicher gespeichert.",
      });
    } catch (error) {
      console.error('Error saving API key:', error);
      toast({
        title: "Fehler",
        description: "Beim Speichern des API-Schlüssels ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteApiKey = async () => {
    if (!user || !vendor) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('vendor_secrets')
        .delete()
        .eq('secret_type', secretType);

      if (error) throw error;

      setHasExistingKey(false);
      setValue('');
      setIsVisible(false);
      
      toast({
        title: "API-Schlüssel gelöscht",
        description: "Ihr API-Schlüssel wurde gelöscht.",
      });
    } catch (error) {
      console.error('Error deleting API key:', error);
      toast({
        title: "Fehler",
        description: "Beim Löschen des API-Schlüssels ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
      <Label htmlFor={secretType}>{label}</Label>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            id={secretType}
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
            disabled={isLoading}
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
            disabled={isLoading}
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