import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  Building2, 
  Mail, 
  Phone, 
  MapPin,
  Clock,
  Send,
  ArrowLeft,
  MessageCircle,
  HeadphonesIcon,
  Users
} from 'lucide-react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send email via Supabase Edge Function
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: formData
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Nachricht gesendet!",
        description: "Vielen Dank für Ihre Nachricht. Wir melden uns innerhalb von 24 Stunden bei Ihnen.",
      });
      
      // Reset form
      setFormData({
        name: '',
        email: '',
        company: '',
        phone: '',
        subject: '',
        message: ''
      });
    } catch (error: any) {
      console.error('Contact form error:', error);
      toast({
        title: "Fehler beim Senden",
        description: "Es gab ein Problem beim Versenden Ihrer Nachricht. Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt per E-Mail.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">CoreDesk</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Anmelden</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Kontakt
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Haben Sie Fragen zu CoreDesk? Wir sind hier, um zu helfen. 
            Kontaktieren Sie uns und lassen Sie uns gemeinsam die beste Lösung für Ihr Unternehmen finden.
          </p>
        </div>
      </section>

      <div className="container max-w-6xl mx-auto px-4 pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Information */}
          <div className="space-y-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Mail className="h-8 w-8 text-primary mb-4" />
                <CardTitle>E-Mail</CardTitle>
                <CardDescription>
                  Schreiben Sie uns eine E-Mail und wir antworten innerhalb von 24 Stunden.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-medium">info@coredesk.ch</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Für allgemeine Anfragen und Support
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Phone className="h-8 w-8 text-primary mb-4" />
                <CardTitle>Telefon</CardTitle>
                <CardDescription>
                  Rufen Sie uns an für direkten Support oder ein persönliches Gespräch.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-medium">
                  <a href="tel:+41793363402" className="hover:text-primary transition-colors">
                    +41 79 336 34 02
                  </a>
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Mo-Fr: 08:00 - 18:00 Uhr
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <MapPin className="h-8 w-8 text-primary mb-4" />
                <CardTitle>Adresse</CardTitle>
                <CardDescription>
                  Besuchen Sie uns in unserem Büro in Zürich.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-medium">CoreDesk</p>
                <p className="text-sm text-muted-foreground">
                  Habsburgerstrasse 20<br />
                  6003 Luzern<br />
                  Schweiz
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Clock className="h-8 w-8 text-primary mb-4" />
                <CardTitle>Support-Zeiten</CardTitle>
                <CardDescription>
                  Unser Support-Team ist zu diesen Zeiten für Sie da.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Montag - Freitag:</span>
                    <span className="font-medium">08:00 - 18:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Samstag:</span>
                    <span className="font-medium">09:00 - 16:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Sonntag:</span>
                    <span className="font-medium">Geschlossen</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-2xl">Nachricht senden</CardTitle>
                <CardDescription>
                  Füllen Sie das Formular aus und wir melden uns schnellstmöglich bei Ihnen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Ihr vollständiger Name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-Mail *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="ihre.email@beispiel.ch"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="company">Unternehmen</Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        placeholder="Ihr Unternehmen"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+41 44 123 45 67"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Betreff *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      placeholder="Worum geht es in Ihrer Nachricht?"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Nachricht *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      placeholder="Beschreiben Sie Ihr Anliegen oder Ihre Frage detailliert..."
                    />
                  </div>

                  <Button 
                    type="submit" 
                    size="lg" 
                    className="w-full" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Wird gesendet...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Nachricht senden
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-muted-foreground">
                    * Pflichtfelder. Mit dem Absenden stimmen Sie unserer Datenschutzerklärung zu.
                  </p>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Additional Contact Options */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">
            Weitere Kontaktmöglichkeiten
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <MessageCircle className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Live Chat</CardTitle>
                <CardDescription>
                  Chatten Sie direkt mit unserem Support-Team während den Geschäftszeiten.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.open('https://wa.me/41793363402?text=Hallo%2C%20ich%20h%C3%A4tte%20eine%20Frage%20zu%20CoreDesk...', '_blank')}
                >
                  Chat starten
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <HeadphonesIcon className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Technischer Support</CardTitle>
                <CardDescription>
                  Für technische Fragen und Probleme mit der Software.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Link to="mailto:support@coredesk.ch">
                    support@coredesk.ch
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Verkauf</CardTitle>
                <CardDescription>
                  Fragen zu Preisen, Paketen und individuellen Lösungen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" className="w-full">
                  <Link to="mailto:sales@coredesk.ch">
                    sales@coredesk.ch
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;