import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, 
  Check, 
  X,
  ArrowLeft,
  Star,
  Zap,
  Crown,
  Users,
  FileText,
  Calculator,
  CreditCard,
  Shield,
  Clock,
  Headphones,
  Globe
} from 'lucide-react';

const PricingPage = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Starter',
      description: 'Perfekt für Einzelunternehmer und kleine Betriebe',
      icon: <Users className="h-8 w-8 text-blue-500" />,
      monthlyPrice: 29,
      yearlyPrice: 290,
      yearlyDiscount: '2 Monate gratis',
      popular: false,
      features: [
        'Bis zu 50 Rechnungen/Monat',
        'Bis zu 25 Kunden',
        'Grundlegende Ausgabenverwaltung',
        'QR-Bill Integration',
        'E-Mail Support',
        'Schweizer Hosting',
        'DSGVO-konform',
        'Mobile App',
      ],
      limitations: [
        'Keine Lohnabrechnung',
        'Keine API-Integration',
        'Kein Priority Support',
        'Keine erweiterten Reports'
      ]
    },
    {
      name: 'Professional',
      description: 'Ideal für wachsende KMUs und Teams',
      icon: <Zap className="h-8 w-8 text-green-500" />,
      monthlyPrice: 79,
      yearlyPrice: 790,
      yearlyDiscount: '2 Monate gratis',
      popular: true,
      features: [
        'Unbegrenzte Rechnungen',
        'Unbegrenzte Kunden',
        'Vollständige Ausgabenverwaltung',
        'Lohnabrechnung (bis 10 Mitarbeiter)',
        'Erweiterte Reports & Analytics',
        'API-Integration',
        'Priority E-Mail Support',
        'Benutzerrollen & Berechtigungen',
        'Automatisierte Workflows',
        'Datenexport (Excel, PDF)',
        'Customizable Rechnungsvorlagen'
      ],
      limitations: [
        'Max. 10 Mitarbeiter für Lohnabrechnung',
        'Kein Telefon-Support'
      ]
    },
    {
      name: 'Enterprise',
      description: 'Für große Unternehmen mit speziellen Anforderungen',
      icon: <Crown className="h-8 w-8 text-purple-500" />,
      monthlyPrice: 199,
      yearlyPrice: 1990,
      yearlyDiscount: '2 Monate gratis',
      popular: false,
      features: [
        'Alle Professional Features',
        'Unbegrenzte Mitarbeiter',
        'Dedicated Account Manager',
        'Telefon & Priority Support',
        'Custom Integrationen',
        'Advanced Security Features',
        'Audit Logs',
        'Multi-Company Management',
        'White-Label Option',
        'On-Premise Deployment Option',
        'SLA Garantie (99.9% Uptime)',
        'Individuelle Schulungen'
      ],
      limitations: []
    }
  ];

  const addOns = [
    {
      name: 'Zusätzliche Mitarbeiter',
      description: 'Für Lohnabrechnung (Professional Plan)',
      price: 5,
      unit: 'pro Mitarbeiter/Monat'
    },
    {
      name: 'Premium Support',
      description: 'Telefon-Support und 4h Response Time',
      price: 29,
      unit: 'pro Monat'
    },
    {
      name: 'Erweiterte API',
      description: 'Höhere Rate Limits und Webhooks',
      price: 19,
      unit: 'pro Monat'
    },
    {
      name: 'Custom Reports',
      description: 'Individuelle Report-Erstellung',
      price: 49,
      unit: 'pro Monat'
    }
  ];

  const getPrice = (plan: typeof plans[0]) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : Math.round(plan.yearlyPrice / 12);
  };

  const getAnnualSavings = (plan: typeof plans[0]) => {
    const monthlyTotal = plan.monthlyPrice * 12;
    const savings = monthlyTotal - plan.yearlyPrice;
    return savings;
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
            Preise & Pakete
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Wählen Sie das perfekte Paket für Ihr Unternehmen. 
            Alle Preise in CHF und ohne versteckte Kosten.
          </p>
          
          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`text-sm ${billingCycle === 'monthly' ? 'font-semibold' : 'text-muted-foreground'}`}>
              Monatlich
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                billingCycle === 'yearly' ? 'bg-primary' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  billingCycle === 'yearly' ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm ${billingCycle === 'yearly' ? 'font-semibold' : 'text-muted-foreground'}`}>
              Jährlich
            </span>
            {billingCycle === 'yearly' && (
              <Badge variant="secondary" className="ml-2">
                2 Monate gratis
              </Badge>
            )}
          </div>
        </div>
      </section>

      {/* Pricing Plans */}
      <section className="py-0 px-4">
        <div className="container max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card key={index} className={`relative border-2 ${plan.popular ? 'border-primary shadow-lg scale-105' : 'border-border'}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                    <Star className="h-3 w-3 mr-1" />
                    Beliebteste
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <div className="flex justify-center mb-4">
                    {plan.icon}
                  </div>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {plan.description}
                  </CardDescription>
                  
                  <div className="mt-6">
                    <div className="flex items-center justify-center">
                      <span className="text-4xl font-bold">CHF {getPrice(plan)}</span>
                      <span className="text-muted-foreground ml-2">
                        {billingCycle === 'monthly' ? '/Monat' : '/Monat*'}
                      </span>
                    </div>
                    {billingCycle === 'yearly' && (
                      <div className="mt-2">
                        <span className="text-sm text-green-600 font-medium">
                          Sparen Sie CHF {getAnnualSavings(plan)} pro Jahr
                        </span>
                        <p className="text-xs text-muted-foreground">
                          *Bei jährlicher Zahlung: CHF {plan.yearlyPrice}
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent>
                  <Button 
                    className={`w-full mb-6 ${plan.popular ? '' : 'variant-outline'}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    asChild
                  >
                    <Link to="/auth">
                      {billingCycle === 'yearly' ? 'Jährlich starten' : 'Monatlich starten'}
                    </Link>
                  </Button>
                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                      Enthalten:
                    </h4>
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start space-x-3">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                    
                    {plan.limitations.length > 0 && (
                      <>
                        <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mt-6">
                          Nicht enthalten:
                        </h4>
                        {plan.limitations.map((limitation, limitIndex) => (
                          <div key={limitIndex} className="flex items-start space-x-3">
                            <X className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-sm text-muted-foreground">{limitation}</span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Add-ons Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Zusätzliche Services
            </h2>
            <p className="text-lg text-muted-foreground">
              Erweitern Sie Ihr CoreDesk mit zusätzlichen Features
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addOns.map((addon, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardHeader className="text-center">
                  <CardTitle className="text-lg">{addon.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {addon.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-4">
                    <span className="text-2xl font-bold">CHF {addon.price}</span>
                    <span className="text-sm text-muted-foreground block">
                      {addon.unit}
                    </span>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">
                    Hinzufügen
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Comparison */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Detaillierter Vergleich
            </h2>
            <p className="text-lg text-muted-foreground">
              Alle Features im Überblick
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-4 px-6 font-semibold">Features</th>
                  <th className="text-center py-4 px-6 font-semibold">Starter</th>
                  <th className="text-center py-4 px-6 font-semibold">Professional</th>
                  <th className="text-center py-4 px-6 font-semibold">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="py-4 px-6 font-medium">Rechnungen pro Monat</td>
                  <td className="text-center py-4 px-6">50</td>
                  <td className="text-center py-4 px-6">Unbegrenzt</td>
                  <td className="text-center py-4 px-6">Unbegrenzt</td>
                </tr>
                <tr className="bg-muted/50">
                  <td className="py-4 px-6 font-medium">Kunden</td>
                  <td className="text-center py-4 px-6">25</td>
                  <td className="text-center py-4 px-6">Unbegrenzt</td>
                  <td className="text-center py-4 px-6">Unbegrenzt</td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Lohnabrechnung</td>
                  <td className="text-center py-4 px-6"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                  <td className="text-center py-4 px-6">Bis 10 Mitarbeiter</td>
                  <td className="text-center py-4 px-6">Unbegrenzt</td>
                </tr>
                <tr className="bg-muted/50">
                  <td className="py-4 px-6 font-medium">API Integration</td>
                  <td className="text-center py-4 px-6"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-4 px-6 font-medium">Support</td>
                  <td className="text-center py-4 px-6">E-Mail</td>
                  <td className="text-center py-4 px-6">Priority E-Mail</td>
                  <td className="text-center py-4 px-6">Telefon + E-Mail</td>
                </tr>
                <tr className="bg-muted/50">
                  <td className="py-4 px-6 font-medium">Dedicated Account Manager</td>
                  <td className="text-center py-4 px-6"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><X className="h-4 w-4 text-red-500 mx-auto" /></td>
                  <td className="text-center py-4 px-6"><Check className="h-4 w-4 text-green-500 mx-auto" /></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="container max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              Häufige Fragen
            </h2>
          </div>
          
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kann ich jederzeit upgraden oder downgraden?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Ja, Sie können Ihr Paket jederzeit ändern. Upgrades werden sofort aktiviert, 
                  bei Downgrades gilt die Änderung ab dem nächsten Abrechnungszyklus.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Gibt es Setup-Gebühren?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Nein, es gibt keine Setup-Gebühren. Sie zahlen nur die monatliche oder jährliche Abonnementgebühr.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Kann ich CoreDesk kostenlos testen?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Ja, wir bieten eine 7-tägige kostenlose Testversion für alle Pakete an. 
                  Keine Kreditkarte erforderlich.
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sind meine Daten sicher?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Ja, alle Daten werden in der Schweiz gehostet und sind DSGVO-konform. 
                  Wir verwenden modernste Verschlüsselungstechnologien.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Bereit zu starten?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Beginnen Sie noch heute mit Ihrer 7-tägigen kostenlosen Testversion.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link to="/auth">7 Tage kostenlos testen</Link>
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-6" asChild>
              <Link to="/contact">Demo vereinbaren</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default PricingPage;