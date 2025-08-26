# InvoiceApp - Vollständiges Finanzverwaltungssystem

> Moderne, umfassende Finanzverwaltung für Freiberufler und kleine Unternehmen mit automatischen n8n-Integrationen

## 📋 Inhaltsverzeichnis

- [Über das Projekt](#-über-das-projekt)
- [Funktionen](#-funktionen)
- [System-Architektur](#-system-architektur)
- [API-Integrationen](#-api-integrationen)
- [Technologie-Stack](#-technologie-stack)
- [Installation](#-installation)
- [Verwendung](#-verwendung)
- [Datenstruktur](#-datenstruktur)
- [n8n Webhook Integration](#-n8n-webhook-integration)
- [Entwicklung](#-entwicklung)
- [Mitwirken](#-mitwirken)
- [Lizenz](#-lizenz)

## 🚀 Über das Projekt

InvoiceApp ist ein vollständiges Finanzverwaltungssystem für Freiberufler und kleine Unternehmen. Das System integriert Rechnungsstellung, Ausgabenverwaltung, Umsatzverfolgung, Mitarbeitergehälter und bietet umfassende API-Integrationen für automatisierte Workflows.

### Zielgruppe
- Freiberufler und Selbstständige
- Kleinunternehmer
- Berater und Dienstleister
- Teams mit mehreren Mitarbeitern
- Unternehmen mit komplexen Finanzworkflows

### Grundphilosophie
- **Vollständigkeit**: Alle Finanzaspekte in einem System
- **Automatisierung**: n8n-Integration für automatische Datenverarbeitung
- **Sicherheit**: Supabase-Backend mit Row-Level Security
- **Compliance**: Swiss QR-Rechnungen und Steuerkonformität
- **Moderne UX**: Responsive Design mit Tailwind CSS

## ✨ Funktionen

### 🏠 Dashboard
- Umfassende Finanzübersicht
- Umsatz-, Ausgaben- und Gewinnstatistiken
- Rechnungsstatus-Übersicht
- Lieferantenstatistiken
- Schnellzugriff auf alle Bereiche

### 💰 Finanzverwaltung
Das Herzstück des Systems mit sechs Hauptbereichen:

#### 🧾 Geschäftsausgaben (Business Expenses)
- Automatischer Import von Einkaufsbelegen
- Manuelle Belegeingabe
- VAT-Berechnung und Kategorisierung
- Geschäftszweck-Dokumentation
- Verschiedene Ausgabentypen (Einkauf, Service, Reisen)

#### 📈 Umsatzverwaltung (Revenue Management)
- Tägliche Umsatzeingabe
- Automatischer Import von Verkaufsdaten
- Umsatzquellen-Tracking
- Währungsunterstützung (CHF, EUR, USD)

#### 👥 Mitarbeiterverwaltung (Employee Management)
- Gehaltsabrechnung und -tracking
- Mitarbeiterausgaben
- Verschiedene Ausgabentypen (Gehalt, Benefits, Weiterbildung)
- Nebenleistungen-Verwaltung

#### 📄 PDF-Scanner für Rechnungen
- KI-gestützte Rechnungsanalyse mit OpenAI
- Automatische Datenextraktion
- Manuelle Nachbearbeitung
- Konfidenz-Scoring

#### 📊 Jahresberichte
- Vollständige Steuerberichte
- Kategorisierte Ausgabenübersicht
- Excel- und PDF-Export
- VAT-Berechnungen

#### 📋 Eingangsrechnungen
- Verwaltung aller eingehenden Rechnungen
- Status-Tracking (Ausstehend, Bezahlt, Überfällig)
- Fälligkeitserinnerungen
- Zahlungshistorie

### 🧾 Ausgangsrechnungen (Invoicing)
- **Rechnung Erstellen**
  - Drag & Drop für Artikelhinzufügung
  - Automatische Berechnungen (MwSt., Gesamt)
  - Automatische Rechnungsnummer-Erhöhung
  - Entwürfe speichern
- **Rechnungsliste**
  - Erweiterte Filter- und Suchfunktionen
  - Statusverfolgung (Entwurf, Versendet, Bezahlt)
  - Massenoperationen
- **PDF-Export**
  - Swiss QR-Rechnungen
  - Professionelle Vorlagen
  - Logo- und Branding-Unterstützung

### 💡 Angebotsverwaltung
- Angebotserstellung und -verwaltung
- Umwandlung von Angeboten in Rechnungen
- Gültigkeitsdaten
- Status-Tracking

### 👥 Kundenverwaltung
- Vollständige Kundendatenbank
- Kontaktinformationsverwaltung
- Kundenspezifische Rechnungshistorie
- Adressverwaltung mit JSON-Format

### 🛍️ Produktkatalog
- Artikel- und Dienstleistungsverwaltung
- Standard-Preise und MwSt.-Sätze
- Schnelles Hinzufügen zur Rechnung
- Kategorienverwaltung

### 🔧 API Management
Zentrale Verwaltung aller API-Integrationen:

#### n8n Workflow Automation
- Webhook-Endpunkte für verschiedene Datentypen
- Testfunktionen für alle Integrationen
- Automatische Datenvalidierung

#### OpenAI Integration
- Rechnungsanalyse und PDF-Scanning
- KI-gestützte Datenextraktion
- Konfidenz-Bewertung

#### Resend Email API
- Automatischer E-Mail-Versand
- Rechnungsversand
- Erinnerungen

### 📊 Berichte und Analysen
- Steuerberichte für verschiedene Kategorien
- Monatliche/jährliche Auswertungen
- VAT-Berichte
- Gewinn- und Verlustrechnung

## 🏗️ System-Architektur

### Frontend-Architektur
```
src/
├── components/
│   ├── ui/                 # Shadcn/ui Komponenten
│   ├── dashboard/         # Dashboard-spezifische Komponenten
│   ├── invoice/           # Rechnungsverwaltung
│   ├── expense/           # Ausgabenverwaltung
│   ├── employee/          # Mitarbeiterverwaltung
│   ├── revenue/           # Umsatzverwaltung
│   ├── reports/           # Berichtswesen
│   └── layout/            # Layout-Komponenten
├── pages/                 # Hauptseiten
├── contexts/              # React Context (Auth, Vendor)
├── hooks/                 # Custom React Hooks
├── lib/                   # Utility-Bibliotheken
├── types/                 # TypeScript-Definitionen
└── integrations/          # Supabase-Integration
```

### Backend-Architektur (Supabase)
```
supabase/
├── functions/             # Edge Functions
│   ├── n8n-webhook/      # n8n Integration
│   ├── scan-invoice/     # PDF-Scanning mit OpenAI
│   └── check-overdue-invoices/ # Automatische Erinnerungen
├── migrations/            # Datenbank-Migrationen
└── config.toml           # Supabase-Konfiguration
```

## 🔌 API-Integrationen

### n8n Webhook Endpunkte
- **Rechnungen**: `POST /functions/v1/n8n-webhook`
- **Umsatz**: `POST /functions/v1/n8n-webhook?type=revenue`
- **Mitarbeitergehälter**: `POST /functions/v1/n8n-webhook?type=employee`
- **Geschäftsausgaben**: `POST /functions/v1/n8n-webhook?type=expense`

### OpenAI Integration
- GPT-4 Vision für PDF-Analyse
- Automatische Datenextraktion
- Konfidenz-Bewertung

### Resend Email
- Transactional Email-Versand
- Rechnungsversand
- Automatische Erinnerungen

## 🛠️ Technologie-Stack

### Frontend
- **React 18** mit TypeScript
- **Vite** als Build-Tool
- **Tailwind CSS** für Styling
- **Shadcn/ui** als UI-Komponentenbibliothek
- **React Router** für Navigation
- **React Hook Form** für Formulare
- **Lucide React** für Icons

### Backend
- **Supabase** als Backend-as-a-Service
- **PostgreSQL** als Datenbank
- **Row-Level Security (RLS)** für Datensicherheit
- **Edge Functions** für serverlose Funktionen
- **Real-time Subscriptions**

### PDF und Berichte
- **jsPDF** für PDF-Generierung
- **QRCode.js** für Swiss QR-Codes
- **Recharts** für Diagramme

### Integrationen
- **n8n** für Workflow-Automatisierung
- **OpenAI** für KI-gestützte Datenverarbeitung
- **Resend** für E-Mail-Versand

## 📦 Installation

### Voraussetzungen
- Node.js 18+
- Supabase-Projekt
- API-Keys für OpenAI und Resend (optional)

### Schnellstart

```bash
# Repository klonen
git clone https://github.com/username/invoice-app.git
cd invoice-app

# Abhängigkeiten installieren
npm install

# Supabase-Setup (siehe Supabase-Konfiguration)
npx supabase init
npx supabase start

# Development-Server starten
npm run dev

# Production-Build
npm run build
```

### Supabase-Konfiguration

1. **Neues Supabase-Projekt erstellen**
2. **Datenbank-Migrationen ausführen**
3. **API-Keys in Supabase Secrets hinterlegen**:
   - `OPENAI_API_KEY`
   - `RESEND_API_KEY`
4. **Authentication konfigurieren**

## 🎮 Verwendung

### Ersteinrichtung
1. **Authentifizierung**: Registrierung und Anmeldung
2. **Firmeninformationen**: Grunddaten und Bankverbindung
3. **API-Integration**: n8n Webhooks konfigurieren
4. **Erste Daten**: Kunden und Produkte anlegen

### Workflow-Beispiele

#### Automatischer Rechnungsimport
```bash
# n8n Workflow konfigurieren
URL: https://ihr-projekt.supabase.co/functions/v1/n8n-webhook
Method: POST
Body: {
  "vendor_name": "Lieferant GmbH",
  "invoice_number": "RE-2024-001",
  "amount": 150.50,
  "currency": "CHF",
  "vendor_id": "uuid",
  "user_id": "uuid"
}
```

#### PDF-Scanning
1. PDF-Datei hochladen
2. OpenAI analysiert automatisch
3. Daten überprüfen und speichern

## 📄 Datenstruktur

### Haupttabellen

#### Rechnungen (Invoices)
```
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  invoice_no TEXT NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE,
  subtotal NUMERIC NOT NULL DEFAULT 0,
  tax_total NUMERIC NOT NULL DEFAULT 0,
  total NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  currency TEXT NOT NULL DEFAULT 'CHF'
);
```

#### Geschäftsausgaben (Business Expenses)
```sql
CREATE TABLE business_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  vendor_name TEXT,
  document_number TEXT,
  expense_date DATE,
  amount NUMERIC NOT NULL,
  net_amount NUMERIC,
  vat_amount NUMERIC,
  vat_rate NUMERIC DEFAULT 8.1,
  currency TEXT DEFAULT 'CHF',
  tax_category TEXT DEFAULT 'operating_expenses',
  business_purpose TEXT,
  status TEXT DEFAULT 'pending'
);
```

#### Mitarbeiterausgaben (Employee Expenses)
```sql
CREATE TABLE employee_expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  employee_name TEXT NOT NULL,
  expense_date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'CHF',
  expense_type TEXT DEFAULT 'salary',
  description TEXT
);
```

#### Täglicher Umsatz (Daily Revenue)
```sql
CREATE TABLE daily_revenue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL,
  revenue_date DATE NOT NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'CHF',
  description TEXT,
  source TEXT DEFAULT 'manual'
);
```

## 🔗 n8n Webhook Integration

### Unterstützte Datentypen

#### 1. Rechnungen (Invoices)
```
{
  "vendor_name": "Lieferant GmbH",
  "invoice_number": "RE-2024-001",
  "invoice_date": "2024-01-15",
  "due_date": "2024-02-15",
  "amount": 150.50,
  "currency": "CHF",
  "description": "Büromaterial",
  "category": "office",
  "vendor_id": "uuid",
  "user_id": "uuid"
}
```

#### 2. Umsatz (Revenue)
```json
{
  "revenue_date": "2024-01-15",
  "amount": 1500.00,
  "currency": "CHF",
  "description": "Täglicher Umsatz",
  "vendor_id": "uuid",
  "user_id": "uuid"
}
```

#### 3. Mitarbeitergehälter (Employee Expenses)
```json
{
  "employee_name": "Max Mustermann",
  "expense_date": "2024-01-15",
  "amount": 5000.00,
  "currency": "CHF",
  "expense_type": "salary",
  "description": "Monatliches Gehalt",
  "vendor_id": "uuid",
  "user_id": "uuid"
}
```

#### 4. Geschäftsausgaben (Business Expenses)
```json
{
  "vendor_name": "Supermarkt AG",
  "document_number": "RECEIPT-001",
  "expense_date": "2024-01-15",
  "amount": 85.50,
  "currency": "CHF",
  "description": "Büromaterial",
  "business_purpose": "Büroausstattung",
  "expense_type": "purchase",
  "tax_category": "operating_expenses",
  "vendor_id": "uuid",
  "user_id": "uuid"
}
```

### Webhook-URLs
- **Basis-URL**: `https://ihr-projekt.supabase.co/functions/v1/n8n-webhook`
- **Rechnungen**: Basis-URL (Standard)
- **Umsatz**: `?type=revenue`
- **Mitarbeiter**: `?type=employee`
- **Ausgaben**: `?type=expense`

## 👨‍💻 Entwicklung

### Development Server
```bash
npm run dev
```

### Supabase Development
```bash
# Lokale Supabase starten
npx supabase start

# Edge Functions deployen
npx supabase functions deploy

# Datenbank-Schema ändern
npx supabase db reset
```

### Code-Qualität
```bash
# Linting
npm run lint

# Type-Check
npm run type-check

# Build
npm run build
```

## 🔐 Sicherheit

### Row-Level Security (RLS)
- Alle Tabellen sind durch RLS geschützt
- Benutzer können nur ihre eigenen Daten sehen
- Vendor-basierte Isolation

### API-Sicherheit
- JWT-basierte Authentifizierung
- Sichere Supabase Edge Functions
- API-Keys in Supabase Secrets

### Datenschutz
- DSGVO-konform
- Daten werden in Europa gehostet (Supabase)
- Verschlüsselte Übertragung

## 📈 Performance

### Frontend-Optimierung
- Code-Splitting mit React.lazy
- Optimierte Bundle-Größe
- Progressive Web App (PWA) ready

### Backend-Optimierung
- Effiziente Datenbankabfragen
- Edge Functions für geringe Latenz
- Caching-Strategien

## 🗺️ Roadmap

### v1.0 (Aktuell)
- [x] Vollständige Finanzverwaltung
- [x] n8n Webhook-Integration
- [x] PDF-Scanning mit OpenAI
- [x] Swiss QR-Rechnungen
- [x] Multi-Benutzer-Unterstützung

### v1.1 (Geplant)
- [ ] Wiederkehrende Rechnungen
- [ ] Erweiterte E-Mail-Integration
- [ ] Automatische Erinnerungen
- [ ] Mobile App

### v1.2 (Zukunft)
- [ ] Mehrsprachigkeit (DE/FR/IT/EN)
- [ ] Erweiterte Berichte
- [ ] Bank-Integration
- [ ] White-Label-Lösung

## 📝 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert. Details finden Sie in der [LICENSE](LICENSE)-Datei.

## 🙏 Danksagungen

- [Supabase](https://supabase.com) - Backend-as-a-Service
- [n8n](https://n8n.io) - Workflow-Automatisierung
- [OpenAI](https://openai.com) - KI-Integration
- [Tailwind CSS](https://tailwindcss.com) - CSS-Framework
- [Shadcn/ui](https://ui.shadcn.com) - UI-Komponenten

---

⭐ Wenn Ihnen das Projekt gefällt, vergessen Sie nicht, einen Stern zu geben!

**Made with ❤️ in der Schweiz**
```

```
# 📄 Cozy Invoice - Rechnungssystem

Ein modernes, webbasiertes Rechnungssystem für kleine Unternehmen und Freelancer mit erweiterten Produktmanagement-Funktionen.

## 🚀 Deployment

Das System ist für Coolify deployment konfiguriert.

## ✨ Funktionen

### 📦 **Erweiterte Produktverwaltung**
- **Kategoriebasierte Filterung** - Filtern Sie Produkte nach Kategorien
- **Dynamische Kategorien** - Erstellen und verwalten Sie eigene Kategorien  
- **Bildunterstützung** - Fügen Sie Produktbilder hinzu (bis 5MB)
- **Excel-ähnliche Tabellenansicht** - Professionelle Datenverwaltung
- **Flexible Beschreibungen** - Optionale Produktbeschreibungen

### 🧾 **Rechnungserstellung**
- **Visuelle Produktauswahl** - Dropdown mit Bildern und vollständigen Produktinformationen
- **Swiss QR Code** - Automatische QR-Rechnungen für die Schweiz
- **PDF Export** - Professionelle PDF-Generierung
- **Kundenmanagement** - Vollständige CRM-Funktionen

### 💼 **Geschäftsmanagement**  
- **Dashboard** - Finanzübersicht mit Statistiken
- **Ausgabenverfolgung** - MwSt.-Berechnung und Kategorisierung
- **Umsatzverfolgung** - Tägliche Eingabe mit Währungsunterstützung
- **Berichte** - Steuer-, MwSt.- und Jahresberichte

## 🛠️ Technologie

- **Frontend**: React 18 mit TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS mit Shadcn/ui
- **Backend**: Supabase (PostgreSQL, Row Level Security)
- **Deployment**: GitHub Pages mit automatischen Deployments

## 🔧 Lokale Entwicklung

```bash
# Repository klonen
git clone https://github.com/tacicek/Rechnungssytem.git
cd Rechnungssytem

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev

# Projekt bauen
npm run build
```

## 🚀 Coolify Deployment

Das System ist für Coolify deployment konfiguriert:

### Deployment-Workflow:
- ✅ Code wird automatisch gebaut
- ✅ Tests und Lint-Checks werden ausgeführt  
- ✅ Deployment zu Coolify
- ✅ PWA-fähig mit Service Worker

## 📱 Progressive Web App (PWA)

Die Anwendung unterstützt:
- **Offline-Funktionalität**
- **App-Installation** auf mobilen Geräten
- **Caching** für bessere Performance
- **Service Worker** für automatische Updates

## 🔐 Sicherheit

- **Row Level Security (RLS)** für Datenisolation
- **JWT-basierte Authentifizierung** 
- **GDPR-konform** mit europäischem Hosting
- **Verschlüsselte Datenübertragung** (HTTPS)

## 🎯 Für Unternehmen

Das System ist perfekt geeignet für:
- **IT-Unternehmen** - Software, Hardware, Beratung
- **Beratungsfirmen** - Dienstleistungen, Schulungen
- **Hersteller** - Produkte, Material, Ersatzteile
- **Restaurants** - Menüs mit Bildern und Kategorien
- **Freelancer** - Projekte und Dienstleistungen

## 📞 Support

Bei Fragen oder Problemen:
1. **Issues** auf GitHub erstellen
2. **Pull Requests** für Verbesserungen einreichen
3. **Dokumentation** in diesem README beachten

---

**🎉 Viel Erfolg mit Ihrem neuen Rechnungssystem!**