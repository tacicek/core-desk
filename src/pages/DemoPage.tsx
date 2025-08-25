import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  TrendingUp, 
  Calculator,
  Receipt,
  Building2,
  CheckCircle
} from 'lucide-react';
import { useEffect } from 'react';

const DemoPage = () => {
  useEffect(() => {
    // SEO Meta Tags
    document.title = "CoreDesk Demo - Live Vorschau des Business Management Systems";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Erleben Sie CoreDesk live in Aktion. Testen Sie alle Funktionen unseres Business Management Systems für Schweizer Unternehmen.');
    }
  }, []);

  const demoFeatures = [
    {
      icon: FileText,
      title: "Rechnungsverwaltung",
      description: "Erstellen, versenden und verwalten Sie Rechnungen mit Swiss QR-Code",
      status: "Vollständig"
    },
    {
      icon: Users,
      title: "Kundenverwaltung", 
      description: "Zentrale Verwaltung aller Kundendaten und Kontaktinformationen",
      status: "Vollständig"
    },
    {
      icon: TrendingUp,
      title: "Ausgabenverfolgung",
      description: "Erfassen und kategorisieren Sie alle Geschäftsausgaben",
      status: "Vollständig"
    },
    {
      icon: Calculator,
      title: "Lohnbuchhaltung",
      description: "Verwalten Sie Mitarbeiterdaten und Lohnabrechnungen",
      status: "Vollständig"
    },
    {
      icon: Receipt,
      title: "Offertenverwaltung",
      description: "Erstellen Sie professionelle Angebote für Ihre Kunden",
      status: "Vollständig"
    },
    {
      icon: Building2,
      title: "Berichte & Analytics",
      description: "Detaillierte Finanzberichte und Geschäftsanalysen",
      status: "Vollständig"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/50">
      {/* Navigation */}
      <nav className="border-b bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/landing" className="flex items-center space-x-2">
                <ArrowLeft className="h-5 w-5" />
                <span>Zurück zur Hauptseite</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Badge variant="secondary">Demo Version</Badge>
              <Button asChild>
                <Link to="/auth">Jetzt registrieren</Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-12">
        {/* Hero Section */}
        <header className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-6">
            CoreDesk Demo
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Erleben Sie alle Funktionen unseres Business Management Systems live in Aktion. 
            Klicken Sie auf "Live Demo starten" um das vollständige System zu testen.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link to="/auth">Live Demo starten</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
              <Link to="/contact">Persönliche Demo vereinbaren</Link>
            </Button>
          </div>
        </header>

        {/* Demo Features Grid */}
        <section className="mb-16">
          <h2 className="text-3xl font-bold text-center mb-12">
            Verfügbare Demo-Funktionen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demoFeatures.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <feature.icon className="h-10 w-10 text-primary" />
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {feature.status}
                    </Badge>
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Demo Information */}
        <section className="mb-16">
          <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/50 dark:to-purple-950/50">
            <CardHeader>
              <CardTitle className="text-2xl text-center">
                Was Sie in der Demo erwartet
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold text-lg mb-2">✅ Vollständige Funktionalität</h3>
                  <p className="text-muted-foreground">
                    Testen Sie alle Features des Systems mit Beispieldaten - 
                    keine Einschränkungen oder versteckte Kosten.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">🇨🇭 Swiss-spezifische Features</h3>
                  <p className="text-muted-foreground">
                    Erleben Sie Swiss QR-Code Integration, MWST-konforme Rechnungen 
                    und Schweizer Geschäftsstandards.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">📊 Beispieldaten</h3>
                  <p className="text-muted-foreground">
                    Das System ist mit realistischen Beispieldaten gefüllt, 
                    damit Sie sofort alle Funktionen testen können.
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">🔒 Sicher & DSGVO-konform</h3>
                  <p className="text-muted-foreground">
                    Alle Daten werden sicher verarbeitet und entsprechen 
                    den neuesten Datenschutzbestimmungen.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Call to Action */}
        <section className="text-center">
          <h2 className="text-3xl font-bold mb-6">
            Bereit für Ihre eigene CoreDesk Installation?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Nach der Demo können Sie sofort mit Ihrem eigenen Account starten. 
            Alle Ihre Daten bleiben privat und sicher.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link to="/auth">Jetzt kostenlos registrieren</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
              <Link to="/pricing">Preise ansehen</Link>
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default DemoPage;