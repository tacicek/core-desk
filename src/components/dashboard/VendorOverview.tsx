import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, Users, Globe, Phone, Mail, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function VendorOverview() {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState({
    name: "Mein Unternehmen",
    slug: "mein-unternehmen",
    logo: null,
    address: "Musterstrasse 123\n8000 Zürich",
    phone: "+41 44 123 45 67",
    email: "info@meinunternehmen.ch",
    website: "www.meinunternehmen.ch",
    created_at: "2024-01-01T00:00:00Z"
  });

  useEffect(() => {
    const loadVendorData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('No authenticated user found for VendorOverview');
          return;
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('vendor_id, vendor:vendors(*)')
          .eq('user_id', user.id)
          .single();

        if (profile?.vendor) {
          // Get company settings for detailed information
          const { data: companySettings } = await supabase
            .from('company_settings')
            .select('*')
            .eq('vendor_id', profile.vendor_id)
            .single();

          setVendor({
            name: companySettings?.name || profile.vendor.name || "Mein Unternehmen",
            slug: profile.vendor.slug || "mein-unternehmen", 
            logo: companySettings?.logo || profile.vendor.logo || null,
            address: companySettings?.address || (typeof profile.vendor.address === 'string' ? profile.vendor.address : JSON.stringify(profile.vendor.address)) || "Musterstrasse 123\n8000 Zürich",
            phone: companySettings?.phone || profile.vendor.phone || "+41 44 123 45 67",
            email: companySettings?.email || profile.vendor.email || "info@meinunternehmen.ch",
            website: profile.vendor.website || "www.meinunternehmen.ch",
            created_at: profile.vendor.created_at || "2024-01-01T00:00:00Z"
          });

          console.log('✅ VendorOverview loaded from Supabase:', companySettings);
        }
      } catch (error) {
        console.log('Error loading vendor data, using default values:', error);
      }
    };
    
    loadVendorData();
  }, []);


  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {vendor.logo ? (
              <img src={vendor.logo} alt={vendor.name} className="h-12 w-12 rounded-lg object-cover" />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
            )}
            <div>
              <CardTitle className="text-xl text-foreground">{vendor.name}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">
                  {vendor.slug}
                </Badge>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate('/dashboard/company-info')}
          >
            Verwalten
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendor.address && (
            <div className="flex items-start gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Adresse</p>
                <p className="text-sm text-muted-foreground">
                  {typeof vendor.address === 'string' ? vendor.address : JSON.stringify(vendor.address)}
                </p>
              </div>
            </div>
          )}
          
          {vendor.phone && (
            <div className="flex items-start gap-2">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Telefon</p>
                <p className="text-sm text-muted-foreground">{vendor.phone}</p>
              </div>
            </div>
          )}
          
          {vendor.email && (
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">E-Mail</p>
                <p className="text-sm text-muted-foreground">{vendor.email}</p>
              </div>
            </div>
          )}
          
          {vendor.website && (
            <div className="flex items-start gap-2">
              <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm font-medium">Website</p>
                <p className="text-sm text-muted-foreground">{vendor.website}</p>
              </div>
            </div>
          )}
          
          <div className="flex items-start gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Erstellt</p>
              <p className="text-sm text-muted-foreground">
                {new Date(vendor.created_at).toLocaleDateString('de-DE')}
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-2">
            <Users className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div>
              <p className="text-sm font-medium">Ihre Rolle</p>
              <p className="text-sm text-muted-foreground capitalize">
                Inhaber
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}