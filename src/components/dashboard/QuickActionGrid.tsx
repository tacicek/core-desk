import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { 
  Plus, 
  Users, 
  FileText, 
  ClipboardList, 
  CreditCard, 
  Package,
  BarChart3,
  Settings,
  Building2
} from "lucide-react";

interface ActionButton {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  bgColor: string;
}

interface ActionCategory {
  title: string;
  actions: ActionButton[];
}

export function QuickActionGrid() {
  const quickActions = [
    {
      title: "Neue Rechnung",
      description: "Rechnung erstellen",
      icon: Plus,
      href: "/dashboard/invoices/new",
      color: "text-primary"
    },
    {
      title: "Neue Offerte", 
      description: "Offerte erstellen",
      icon: ClipboardList,
      href: "/dashboard/offers/new",
      color: "text-primary"
    },
    {
      title: "Kunden",
      description: "Kunden verwalten",
      icon: Users,
      href: "/dashboard/customers",
      color: "text-primary"
    },
    {
      title: "Rechnungen",
      description: "Alle Rechnungen",
      icon: FileText,
      href: "/dashboard/invoices",
      color: "text-primary"
    },
    {
      title: "Berichte",
      description: "Umsatz & Statistiken",
      icon: BarChart3,
      href: "/dashboard/reports",
      color: "text-primary"
    },
    {
      title: "Einstellungen",
      description: "System konfigurieren",
      icon: Settings,
      href: "/dashboard/settings",
      color: "text-primary"
    }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {quickActions.map((action, index) => {
        const Icon = action.icon;
        return (
          <Button
            key={index}
            asChild
            variant="outline"
            className="h-24 p-4 hover:border-primary/50 transition-colors"
          >
            <Link 
              to={action.href}
              className="flex flex-col items-center text-center space-y-2 w-full"
            >
              <Icon className={`h-6 w-6 ${action.color}`} />
              <div className="space-y-1">
                <div className="text-sm font-medium text-foreground">
                  {action.title}
                </div>
                <div className="text-xs text-muted-foreground">
                  {action.description}
                </div>
              </div>
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
