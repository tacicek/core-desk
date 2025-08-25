import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Building2, 
  Users, 
  Target, 
  Heart,
  Award,
  Globe,
  ArrowLeft
} from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <Building2 className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold">CoreDesk</span>
          </Link>
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
            Über CoreDesk
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Wir machen Geschäftsverwaltung für Schweizer Unternehmen einfach, 
            effizient und compliance-konform.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Unsere Mission</CardTitle>
                <CardDescription>
                  Schweizer Unternehmen dabei zu helfen, ihre Verwaltungsaufgaben 
                  zu digitalisieren und zu vereinfachen, damit sie sich auf ihr 
                  Kerngeschäft konzentrieren können.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <Heart className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Unsere Werte</CardTitle>
                <CardDescription>
                  Qualität, Zuverlässigkeit und Kundennähe stehen im Mittelpunkt 
                  unseres Handelns. Wir entwickeln Lösungen, die wirklich funktionieren 
                  und den Alltag erleichtern.
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Unsere Vision</CardTitle>
                <CardDescription>
                  Die führende Business Management Plattform für den 
                  deutschsprachigen Raum zu werden, mit besonderem Fokus 
                  auf lokale Compliance und Benutzerfreundlichkeit.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Unsere Geschichte
            </h2>
          </div>
          
          <div className="prose prose-lg max-w-none text-muted-foreground">
            <p className="text-lg leading-relaxed mb-6">
              CoreDesk wurde entwickelt, um Schweizer Unternehmen eine moderne, 
              benutzerfreundliche und compliance-konforme Business Management Software 
              zu bieten. Bestehende Lösungen waren oft zu komplex, nicht auf 
              Schweizer Standards ausgerichtet oder schwer zu bedienen.
            </p>
            
            <p className="text-lg leading-relaxed mb-6">
              Unser Ziel ist es, eine cloudbasierte Lösung zu schaffen, die speziell 
              auf die Bedürfnisse von KMUs und Einzelunternehmern in der Schweiz 
              zugeschnitten ist. Dabei stehen Einfachheit, Zuverlässigkeit und 
              exzellenter Kundensupport im Vordergrund.
            </p>
            
            <p className="text-lg leading-relaxed mb-6">
              CoreDesk hilft Unternehmen dabei, ihre Geschäftsprozesse zu digitalisieren 
              und zu optimieren. Unser Fokus liegt auf praktischen Lösungen, die den 
              Arbeitsalltag wirklich erleichtern.
            </p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Was uns antreibt
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <Award className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Qualität</h3>
              <p className="text-muted-foreground">
                Wir entwickeln Software, die nicht nur funktioniert, sondern begeistert. 
                Jede Funktion wird sorgfältig durchdacht und getestet.
              </p>
            </div>
            
            <div className="text-center">
              <Users className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Kundenfokus</h3>
              <p className="text-muted-foreground">
                Unsere Kunden stehen im Mittelpunkt. Ihr Feedback und ihre 
                Bedürfnisse fließen direkt in die Produktentwicklung ein.
              </p>
            </div>
            
            <div className="text-center">
              <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-4">Schweizer Wurzeln</h3>
              <p className="text-muted-foreground">
                Als Schweizer Unternehmen verstehen wir die lokalen Anforderungen 
                und Herausforderungen unserer Kunden.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Entdecken Sie CoreDesk
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Testen Sie CoreDesk kostenlos und erleben Sie, 
            wie einfach Geschäftsverwaltung sein kann.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link to="/auth">Kostenlos testen</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
              <Link to="/contact">Kontakt aufnehmen</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;