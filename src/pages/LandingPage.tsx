import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Shield, 
  Users, 
  Building2, 
  FileText, 
  Calculator, 
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  Mail,
  Phone,
  Menu
} from 'lucide-react';

// Import images
import heroImage from '@/assets/hero-business-team.jpg';
import featuresImage from '@/assets/features-workspace.jpg';
import quickSetupImage from '@/assets/quick-setup-workspace.jpg';
import testimonialWoman from '@/assets/testimonial-woman.jpg';
import testimonialMan from '@/assets/testimonial-man.jpg';
import testimonialCfo from '@/assets/testimonial-cfo.jpg';

const LandingPage = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">CoreDesk</span>
          </Link>
          <div className="hidden md:flex items-center space-x-6">
            <Link to="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link to="/pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Preise
            </Link>
            <Link to="/about" className="text-sm font-medium hover:text-primary transition-colors">
              Über uns
            </Link>
            <Link to="/contact" className="text-sm font-medium hover:text-primary transition-colors">
              Kontakt
            </Link>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" asChild>
                <Link to="/auth">Anmelden</Link>
              </Button>
              <Button asChild>
                <Link to="/auth">Kostenlos starten</Link>
              </Button>
            </div>
          </div>
          
          {/* Mobile Menu */}
          <div className="flex md:hidden items-center space-x-2">
            <Button variant="ghost" asChild size="sm">
              <Link to="/auth">Anmelden</Link>
            </Button>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Menü öffnen</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <nav className="flex flex-col gap-4">
                  <div className="flex items-center space-x-2 mb-4">
                    <Building2 className="h-6 w-6 text-primary" />
                    <span className="text-xl font-bold">CoreDesk</span>
                  </div>
                  <Link 
                    to="#features" 
                    className="flex items-center py-2 text-lg font-medium hover:text-primary transition-colors"
                  >
                    Features
                  </Link>
                  <Link 
                    to="/pricing" 
                    className="flex items-center py-2 text-lg font-medium hover:text-primary transition-colors"
                  >
                    Preise
                  </Link>
                  <Link 
                    to="/about" 
                    className="flex items-center py-2 text-lg font-medium hover:text-primary transition-colors"
                  >
                    Über uns
                  </Link>
                  <Link 
                    to="/contact" 
                    className="flex items-center py-2 text-lg font-medium hover:text-primary transition-colors"
                  >
                    Kontakt
                  </Link>
                  <div className="pt-4 border-t">
                    <Button asChild className="w-full">
                      <Link to="/auth">Kostenlos starten</Link>
                    </Button>
                  </div>
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-6">
                CoreDesk
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground mb-8">
                Das umfassende Business Management System für Schweizer Unternehmen
              </p>
              <p className="text-lg text-muted-foreground mb-8">
                Verwalten Sie Rechnungen, Kunden, Angebote, Ausgaben und Lohnabrechnungen an einem Ort. 
                Speziell entwickelt für die Schweizer Geschäftswelt.
              </p>
              <div className="flex justify-center lg:justify-start">
                <Button size="lg" asChild className="text-lg px-8 py-6">
                  <Link to="/auth">Kostenlos testen</Link>
                </Button>
              </div>
            </div>
            <div className="relative">
              <img 
                src={heroImage} 
                alt="Professionelles Business Team arbeitet zusammen"
                className="rounded-2xl shadow-2xl w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/10 to-transparent rounded-2xl"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-muted/50">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-16">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Alles was Ihr Business braucht
              </h2>
              <p className="text-lg text-muted-foreground">
                CoreDesk bietet alle Tools, die Sie für die effiziente Verwaltung Ihres Unternehmens benötigen.
              </p>
            </div>
            <div>
              <img 
                src={featuresImage} 
                alt="Moderner Arbeitsplatz mit Finanzunterlagen und digitalen Tools"
                className="rounded-xl shadow-lg w-full h-auto object-cover"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <FileText className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Rechnungsverwaltung</CardTitle>
                <CardDescription>
                  Erstellen, versenden und verwalten Sie Rechnungen mit Schweizer QR-Bills
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Kundenverwaltung</CardTitle>
                <CardDescription>
                  Zentrale Verwaltung aller Kundendaten und Kommunikationshistorie
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Calculator className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Ausgabenverwaltung</CardTitle>
                <CardDescription>
                  Digitale Belegerfassung und automatische Kategorisierung von Geschäftsausgaben
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CreditCard className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Lohnabrechnung</CardTitle>
                <CardDescription>
                  Automatisierte Lohnabrechnung nach Schweizer Standards
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <TrendingUp className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Reporting & Analytics</CardTitle>
                <CardDescription>
                  Detaillierte Berichte und Analysen für bessere Geschäftsentscheidungen
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <Shield className="h-12 w-12 text-primary mb-4" />
                <CardTitle>Schweizer Hosting</CardTitle>
                <CardDescription>
                  Ihre Daten bleiben in der Schweiz - DSGVO-konform und sicher
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Warum CoreDesk?
              </h2>
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Speziell für die Schweiz</h3>
                    <p className="text-muted-foreground">
                      QR-Bills, Schweizer Steuervorschriften und lokale Compliance-Standards
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Zeit sparen</h3>
                    <p className="text-muted-foreground">
                      Automatisierung von Routineaufgaben spart bis zu 10 Stunden pro Woche
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Einfach zu bedienen</h3>
                    <p className="text-muted-foreground">
                      Intuitive Benutzeroberfläche - keine Schulung erforderlich
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Skalierbar</h3>
                    <p className="text-muted-foreground">
                      Wächst mit Ihrem Unternehmen - von Einzelunternehmer bis KMU
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative">
              <img 
                src={quickSetupImage} 
                alt="Moderne Büroumgebung mit digitalen Business-Tools"
                className="rounded-2xl shadow-xl w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-black/40 rounded-2xl flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <Clock className="h-16 w-16 mx-auto mb-6 drop-shadow-lg" />
                  <h3 className="text-2xl font-bold mb-4 drop-shadow-md">In 5 Minuten startbereit</h3>
                  <p className="mb-6 drop-shadow-sm">
                    Keine komplizierte Installation oder Einrichtung. 
                    Registrieren Sie sich und starten Sie sofort.
                  </p>
                  <Button size="lg" asChild variant="secondary">
                    <Link to="/auth">
                      Jetzt starten <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Was unsere Kunden sagen
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-4 mb-4">
                  <img 
                    src={testimonialWoman} 
                    alt="Maria Müller, Geschäftsführerin" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center space-x-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current text-yellow-500" />
                      ))}
                    </div>
                    <div>
                      <p className="font-semibold">Maria Müller</p>
                      <p className="text-sm text-muted-foreground">Geschäftsführerin, Müller AG</p>
                    </div>
                  </div>
                </div>
                <CardDescription>
                  "CoreDesk hat unsere Buchhaltung revolutioniert. Die QR-Bill Integration 
                  funktioniert perfekt und spart uns täglich Zeit."
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-4 mb-4">
                  <img 
                    src={testimonialMan} 
                    alt="Thomas Schmidt, Einzelunternehmer" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center space-x-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current text-yellow-500" />
                      ))}
                    </div>
                    <div>
                      <p className="font-semibold">Thomas Schmidt</p>
                      <p className="text-sm text-muted-foreground">Einzelunternehmer</p>
                    </div>
                  </div>
                </div>
                <CardDescription>
                  "Endlich eine Software, die speziell für Schweizer Unternehmen entwickelt wurde. 
                  Alles funktioniert wie erwartet."
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center space-x-4 mb-4">
                  <img 
                    src={testimonialCfo} 
                    alt="Anna Weber, CFO" 
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <div className="flex items-center space-x-1 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-current text-yellow-500" />
                      ))}
                    </div>
                    <div>
                      <p className="font-semibold">Anna Weber</p>
                      <p className="text-sm text-muted-foreground">CFO, Weber Solutions</p>
                    </div>
                  </div>
                </div>
                <CardDescription>
                  "Der Support ist erstklassig und die Software sehr benutzerfreundlich. 
                  Kann CoreDesk nur weiterempfehlen."
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Bereit für effizientere Geschäftsverwaltung?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Starten Sie noch heute kostenlos und entdecken Sie, 
            wie CoreDesk Ihr Business vereinfachen kann.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link to="/auth">7 Tage kostenlos testen</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
              <Link to="/contact">Kontakt aufnehmen</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/50 py-12 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="text-lg font-semibold">CoreDesk</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Das führende Business Management System für Schweizer Unternehmen.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Produkt</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="#features" className="hover:text-primary">Features</Link></li>
                <li><Link to="/pricing" className="hover:text-primary">Preise</Link></li>
                <li><Link to="/auth" className="hover:text-primary">Kostenlos testen</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Unternehmen</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link to="/about" className="hover:text-primary">Über uns</Link></li>
                <li><Link to="/contact" className="hover:text-primary">Kontakt</Link></li>
                <li><Link to="#" className="hover:text-primary">Datenschutz</Link></li>
                <li><Link to="#" className="hover:text-primary">AGB</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Kontakt</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center space-x-2">
                  <Mail className="h-4 w-4" />
                  <span>info@coredesk.ch</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Phone className="h-4 w-4" />
                  <a href="tel:+41793363402" className="hover:text-primary transition-colors">+41 79 336 34 02</a>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center text-sm text-muted-foreground">
            <p>&copy; 2024 CoreDesk. Alle Rechte vorbehalten.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;