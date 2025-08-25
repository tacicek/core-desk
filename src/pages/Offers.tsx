import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Download, Edit, Trash2, Send, CheckCircle, XCircle, Clock, Settings, Mail, Copy } from "lucide-react";
import { Offer } from "@/types/offer";
import { offerStorage, offerItemStorage } from "@/lib/offerStorage";
import { settingsStorage } from "@/lib/storage-simple";
import { generateOfferPDF } from "@/lib/offerPdfGenerator";
import { EmailService } from "@/lib/emailService";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { useVendor } from "@/contexts/VendorContext";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusLabels = {
  draft: 'Entwurf',
  sent: 'Offen', 
  rejected: 'Abgelehnt',
  accepted: 'Angenommen'
};

const statusColors = {
  draft: 'secondary',
  sent: 'default',
  rejected: 'destructive',
  accepted: 'success'
} as const;

export default function Offers() {
  const { vendor, userProfile } = useVendor();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    loadOffers();
  }, [searchParams]);

  const loadOffers = async () => {
    if (!vendor) return;
    
    const allOffers = await offerStorage.getAll(vendor.id);
    
    setOffers(allOffers);
    
    // Apply status filter from URL params
    const statusFilter = searchParams.get('status');
    if (statusFilter) {
      const filtered = allOffers.filter(offer => offer.status === statusFilter);
      setFilteredOffers(filtered);
    } else {
      setFilteredOffers(allOffers);
    }
  };

  const handleDeleteOffer = async (offerId: string, offerNumber: string) => {
    try {
      if (!vendor) return;
      await offerStorage.delete(offerId, vendor.id);
      await loadOffers();
      toast({
        title: "Angebot gelöscht",
        description: `Angebot ${offerNumber} wurde erfolgreich gelöscht.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Beim Löschen des Angebots ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (offer: Offer, newStatus: Offer['status']) => {
    try {
      if (!vendor) return;
      await offerStorage.update(offer.id, { status: newStatus }, vendor.id);
      await loadOffers();
      toast({
        title: "Status aktualisiert",
        description: `Angebot ${offer.offer_no} wurde als ${statusLabels[newStatus]} markiert.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Beim Aktualisieren des Status ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadOffer = async (offer: Offer) => {
    try {
      const [items, companySettings] = await Promise.all([
        offerItemStorage.getByOfferId(offer.id),
        settingsStorage.get()
      ]);

      if (!offer.customer) {
        toast({
          title: "Fehler",
          description: "Kundeninformationen nicht gefunden.",
          variant: "destructive",
        });
        return;
      }

      generateOfferPDF({
        offer,
        customer: offer.customer,
        items,
        companyInfo: {
          name: companySettings.name || 'Mein Unternehmen',
          address: companySettings.address || '',
          phone: companySettings.phone || '',
          email: companySettings.email || ''
        }
      });

      toast({
        title: "PDF erstellt",
        description: `Angebot ${offer.offer_no} wurde als PDF heruntergeladen.`,
      });
    } catch (error) {
      toast({
        title: "Fehler",
        description: "Beim Erstellen der PDF ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    }
  };

  const handleSendEmail = async (offer: Offer) => {
    try {
      if (!offer.customer?.email) {
        toast({
          title: "Fehler",
          description: "Kunde hat keine E-Mail-Adresse.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "E-Mail wird gesendet...",
        description: `Angebot ${offer.offer_no} wird per E-Mail gesendet.`,
      });

      // Send email with PDF attachment using EmailService
      const emailSent = await EmailService.sendOfferEmail(offer.id, offer.customer.email);
      
      if (emailSent) {
        // Update status to sent
        await offerStorage.update(offer.id, { status: 'sent' });
        await loadOffers();
        
        toast({
          title: "E-Mail gesendet",
          description: `Angebot ${offer.offer_no} wurde an ${offer.customer.email} gesendet.`,
        });
      } else {
        toast({
          title: "Fehler",
          description: "E-Mail wurde nicht gesendet.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error sending offer email:', error);
      toast({
        title: "Fehler",
        description: "Beim Senden der E-Mail ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    }
  };

  // Duplicate offer
  const handleDuplicateOffer = async (offer: Offer) => {
    try {
      if (!vendor || !userProfile) return;
      
      toast({
        title: "Dupliziert...",
        description: "Angebot wird dupliziert..."
      });
      
      // Generate unique ID with fallback for older browsers
      const generateId = () => {
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
          return crypto.randomUUID();
        } else {
          // Fallback: Generate UUID v4 format for older browsers
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
          });
        }
      };
      
      // Get new offer number
      const newOfferNumber = await offerStorage.getNextOfferNumber(vendor.id);
      
      // Create new offer with today's date
      const today = new Date();
      const validUntil = new Date();
      validUntil.setDate(today.getDate() + 30); // 30 days validity
      
      const duplicatedOffer: Offer = {
        ...offer,
        id: generateId(),
        offer_no: newOfferNumber,
        issue_date: today.toISOString().split('T')[0],
        valid_until: validUntil.toISOString().split('T')[0],
        status: 'draft', // Always start as draft
        notes: `Dupliziert von Angebot ${offer.offer_no} am ${today.toLocaleDateString('de-DE')}${offer.notes ? '\n\n' + offer.notes : ''}`,
        created_by: userProfile.id,
        created_at: today.toISOString(),
        updated_at: today.toISOString()
      };
      
      console.log('Duplicating offer:', {
        original: offer.offer_no,
        new: newOfferNumber
      });
      
      // Add the duplicated offer
      await offerStorage.add(duplicatedOffer, vendor.id, userProfile.id);
      
      // Duplicate offer items if they exist
      const originalItems = await offerItemStorage.getByOfferId(offer.id);
      if (originalItems.length > 0) {
        const duplicatedItems = originalItems.map(item => ({
          ...item,
          id: generateId(),
          offer_id: duplicatedOffer.id,
          created_by: userProfile.id
        }));
        
        for (const item of duplicatedItems) {
          await offerItemStorage.add(duplicatedOffer.id, item, vendor.id, userProfile.id);
        }
      }
      
      await loadOffers(); // Reload to get updated data
      
      toast({
        title: "Erfolgreich",
        description: `Angebot "${offer.offer_no}" wurde als "${newOfferNumber}" dupliziert (als Entwurf).`
      });
    } catch (error) {
      console.error('Error duplicating offer:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
      toast({
        title: "Fehler",
        description: `Fehler beim Duplizieren des Angebots: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  // Remove duplicate status from offer
  const handleRemoveDuplicateStatus = async (offer: Offer) => {
    try {
      if (!vendor) return;
      
      // Remove duplicate information from notes
      const cleanNotes = offer.notes
        ?.replace(/Dupliziert von Angebot .*? am \d{1,2}\.\d{1,2}\.\d{4}\n\n/, '')
        ?.replace(/Dupliziert von Angebot .*? am \d{1,2}\.\d{1,2}\.\d{4}/, '')
        ?.trim() || '';
      
      const updatedOffer = {
        notes: cleanNotes,
        updated_at: new Date().toISOString()
      };
      
      await offerStorage.update(offer.id, updatedOffer, vendor.id);
      await loadOffers(); // Reload to get updated data
      
      toast({
        title: "Erfolgreich",
        description: "Duplikat-Status wurde entfernt."
      });
    } catch (error) {
      console.error('Error removing duplicate status:', error);
      toast({
        title: "Fehler",
        description: "Fehler beim Entfernen des Duplikat-Status.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: Offer['status']) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'sent': return <Clock className="h-4 w-4" />;
      default: return <Edit className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-clamp-2xl font-bold">Offerte</h1>
          <p className="text-clamp-base text-muted-foreground">Verwalten Sie Ihre Offerte</p>
        </div>
        <Link to="/dashboard/offers/new">
          <Button size="sm" className="md:size-default h-10 px-3 md:px-4">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Neue Offerte</span>
            <span className="sm:hidden">Neu</span>
          </Button>
        </Link>
      </div>

      {filteredOffers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-6 md:py-8">
            <p className="text-muted-foreground mb-4">Noch keine Angebote vorhanden</p>
            <Link to="/dashboard/offers/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Erstes Angebot erstellen
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:gap-4">
          {filteredOffers.map((offer) => {
            const isDuplicate = offer.notes?.includes('Dupliziert von Angebot') && offer.status === 'draft';
            return (
            <Card key={offer.id}>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <h3 className="text-clamp-base font-semibold">{offer.customer?.name || 'Kunde nicht gefunden'}</h3>
                          <span className="text-clamp-sm text-muted-foreground">#{offer.offer_no}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusColors[offer.status]} className="flex-shrink-0">
                            {statusLabels[offer.status]}
                          </Badge>
                          {isDuplicate && (
                            <div className="relative group">
                              <Badge variant="outline" className="flex-shrink-0 text-blue-600 border-blue-300 bg-blue-50 pr-6">
                                <Copy className="w-3 h-3 mr-1" />
                                Duplikat
                              </Badge>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveDuplicateStatus(offer);
                                }}
                                className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center hover:bg-red-600"
                                title="Duplikat-Status entfernen"
                              >
                                ×
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-clamp-stat-subtitle text-muted-foreground">
                      <span>{format(new Date(offer.issue_date), 'dd MMM yyyy', { locale: de })}</span>
                      {offer.valid_until && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span>Gültig bis {format(new Date(offer.valid_until), 'dd MMM yyyy', { locale: de })}</span>
                        </>
                      )}
                      {isDuplicate && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span className="text-blue-600 font-medium">
                            {offer.notes?.match(/Dupliziert von Angebot ([^\s]+)/)?.[1] && 
                              `Original: ${offer.notes.match(/Dupliziert von Angebot ([^\s]+)/)?.[1]}`
                            }
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="text-left lg:text-right">
                      <div className="text-clamp-stat-value font-bold flex items-baseline gap-1">
                        <span className="text-clamp-stat-subtitle text-muted-foreground">CHF</span>
                        <span>{offer.total.toLocaleString('de-CH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-1 flex-wrap justify-start lg:justify-end lg:flex-shrink-0 mt-2 lg:mt-0">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleSendEmail(offer)}
                        title="Per E-Mail senden"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Status ändern">
                            {getStatusIcon(offer.status)}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleStatusChange(offer, 'draft')}>
                            <Edit className="h-4 w-4 mr-2" />
                            Entwurf
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(offer, 'sent')}>
                            <Send className="h-4 w-4 mr-2" />
                            Offen
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(offer, 'accepted')}>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Angenommen
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleStatusChange(offer, 'rejected')}>
                            <XCircle className="h-4 w-4 mr-2" />
                            Abgelehnt
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0"
                        onClick={() => handleDownloadOffer(offer)}
                        title="PDF herunterladen"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        onClick={() => handleDuplicateOffer(offer)}
                        title="Angebot duplizieren"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      
                      <Link to={`/dashboard/offers/${offer.id}/edit`}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Bearbeiten">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </Link>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Angebot löschen">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Angebot löschen</AlertDialogTitle>
                            <AlertDialogDescription>
                              Sind Sie sicher, dass Sie Angebot #{offer.offer_no} löschen möchten? 
                              Diese Aktion kann nicht rückgängig gemacht werden.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Abbrechen</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDeleteOffer(offer.id, offer.offer_no)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Löschen
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
