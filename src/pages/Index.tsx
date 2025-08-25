import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Shield, Users, Building2 } from 'lucide-react';
import { useEffect } from 'react';

const Index = () => {
  useEffect(() => {
    // SEO Meta Tags
    document.title = "CoreDesk - Schweizer Business Management System | Rechnungen, Kunden, Finanzen";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Das umfassende Business Management System für Schweizer Unternehmen. Rechnungsverwaltung, Kundenverwaltung, Ausgabenverfolgung und mehr - alles an einem Ort.');
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/50">
      <div className="text-center space-y-8 max-w-2xl mx-auto p-8">
        <header className="space-y-4">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            CoreDesk
          </h1>
          <p className="text-xl text-muted-foreground">
            Ihr umfassendes Business Management System für die Schweiz
          </p>
        </header>
        
        <main className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
          {/* Normal User Login */}
          <section className="p-6 rounded-lg border bg-card/50 backdrop-blur-sm">
            <Users className="h-12 w-12 text-primary mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Kunden-Anmeldung</h2>
            <p className="text-muted-foreground mb-4">
              Zugang zu Geschäftsverwaltung und Rechnungssystemen
            </p>
            <Button asChild className="w-full">
              <Link to="/auth" aria-label="Zur Kunden-Anmeldung">Anmelden</Link>
            </Button>
          </section>
          
          {/* Admin Login */}
          <section className="p-6 rounded-lg border bg-gradient-to-br from-purple-500/10 to-blue-500/10 backdrop-blur-sm">
            <Shield className="h-12 w-12 text-purple-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Admin-Panel</h2>
            <p className="text-muted-foreground mb-4">
              Systemverwaltung und Admin-Funktionen
            </p>
            <Button asChild variant="outline" className="w-full border-purple-500/30 hover:bg-purple-500/10">
              <Link to="/admin/login" aria-label="Zur Admin-Anmeldung">Admin-Anmeldung</Link>
            </Button>
          </section>
        </main>
        
        <footer className="flex items-center justify-center space-x-2 text-sm text-muted-foreground mt-8">
          <Building2 className="h-4 w-4" />
          <span>Professionelle Geschäftsverwaltung für die Schweiz</span>
        </footer>
      </div>
    </div>
  );
};

export default Index;
