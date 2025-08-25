import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useVendor } from '@/contexts/VendorContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Users, 
  Settings, 
  FileText,
  Save,
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  CreditCard,
  ArrowLeft
} from 'lucide-react';

export default function VendorManagement() {
  const navigate = useNavigate();
  const { vendor, userProfile, updateVendor, loading: vendorLoading } = useVendor();
  const [loading, setLoading] = useState(false);
  const [vendorData, setVendorData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    website: '',
    tax_number: ''
  });
  const { toast } = useToast();

  useEffect(() => {
    if (vendor) {
      setVendorData({
        name: vendor.name || '',
        email: vendor.email || '',
        phone: vendor.phone || '',
        address: typeof vendor.address === 'string' ? vendor.address : JSON.stringify(vendor.address || ''),
        website: vendor.website || '',
        tax_number: vendor.tax_number || ''
      });
    }
  }, [vendor]);

  const handleSaveVendor = async () => {
    if (!vendor?.id) return;

    try {
      setLoading(true);
      console.log('Updating vendor:', vendorData);

      const { error } = await supabase
        .from('vendors')
        .update({
          name: vendorData.name,
          email: vendorData.email,
          phone: vendorData.phone,
          address: vendorData.address,
          website: vendorData.website,
          tax_number: vendorData.tax_number,
          updated_at: new Date().toISOString()
        })
        .eq('id', vendor.id);

      if (error) {
        console.error('Error updating vendor:', error);
        toast({
          title: "Fehler",
          description: "Vendor-Informationen konnten nicht gespeichert werden.",
          variant: "destructive"
        });
        return;
      }

      // Update context
      await updateVendor(vendorData);
      
      toast({
        title: "Erfolg",
        description: "Vendor-Informationen wurden erfolgreich gespeichert."
      });
    } catch (error) {
      console.error('Error saving vendor:', error);
      toast({
        title: "Fehler",
        description: "Ein unerwarteter Fehler ist aufgetreten.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (vendorLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Vendor-Informationen konnten nicht geladen werden.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/dashboard')}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Vendor Verwaltung</h1>
            <p className="text-muted-foreground">
              Verwalten Sie Ihre Vendor-Einstellungen und Unternehmensdaten
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Owner
        </Badge>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general" className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Allgemein
          </TabsTrigger>
          <TabsTrigger value="contact" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Kontakt
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Benutzer
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Unternehmensdaten
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vendor-name">Unternehmensname</Label>
                  <Input
                    id="vendor-name"
                    value={vendorData.name}
                    onChange={(e) => setVendorData({ ...vendorData, name: e.target.value })}
                    placeholder="Ihr Unternehmensname"
                  />
                </div>
                <div>
                  <Label htmlFor="tax-number">Steuernummer</Label>
                  <Input
                    id="tax-number"
                    value={vendorData.tax_number}
                    onChange={(e) => setVendorData({ ...vendorData, tax_number: e.target.value })}
                    placeholder="CHE-123.456.789"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  value={vendorData.website}
                  onChange={(e) => setVendorData({ ...vendorData, website: e.target.value })}
                  placeholder="https://www.example.com"
                />
              </div>

              <div>
                <Label htmlFor="address">Adresse</Label>
                <Textarea
                  id="address"
                  value={vendorData.address}
                  onChange={(e) => setVendorData({ ...vendorData, address: e.target.value })}
                  placeholder="Strasse, PLZ Ort"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Contact Settings */}
        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Kontaktinformationen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="email">E-Mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={vendorData.email}
                    onChange={(e) => setVendorData({ ...vendorData, email: e.target.value })}
                    placeholder="info@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Telefon</Label>
                  <Input
                    id="phone"
                    value={vendorData.phone}
                    onChange={(e) => setVendorData({ ...vendorData, phone: e.target.value })}
                    placeholder="+41 44 123 45 67"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Users Management */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Benutzer Verwaltung
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {userProfile?.first_name && userProfile?.last_name 
                          ? `${userProfile.first_name} ${userProfile.last_name}`
                          : 'Benutzer'
                        }
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {userProfile?.role || 'admin'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Owner</Badge>
                    <Badge variant="outline">Admin</Badge>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">
                  Weitere Benutzer-Verwaltungsoptionen werden in zukünftigen Updates hinzugefügt.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSaveVendor} disabled={loading} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {loading ? 'Speichern...' : 'Änderungen speichern'}
        </Button>
      </div>
    </div>
  );
}