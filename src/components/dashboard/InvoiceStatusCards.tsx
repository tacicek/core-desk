import { Card, CardContent } from "@/components/ui/card";
import { Invoice } from "@/types";
import { useNavigate } from "react-router-dom";

interface InvoiceStatusCardsProps {
  invoices: Invoice[];
}

export function InvoiceStatusCards({ invoices }: InvoiceStatusCardsProps) {
  const navigate = useNavigate();
  
  // Helper function to determine if an invoice is overdue
  const isOverdue = (invoice: Invoice) => {
    if (invoice.status === 'paid') return false; // Paid invoices are never overdue
    if (invoice.status === 'draft') return false; // Draft invoices are never overdue
    if (invoice.status !== 'sent') return false; // Only sent invoices can be overdue
    const dueDate = new Date(invoice.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day for fair comparison
    return dueDate < today;
  };
  
  // Group invoices by status
  const draftCount = invoices.filter(inv => inv.status === 'draft').length;
  const openCount = invoices.filter(inv => inv.status === 'sent' && !isOverdue(inv)).length;
  const paidCount = invoices.filter(inv => inv.status === 'paid').length;
  const overdueCount = invoices.filter(inv => isOverdue(inv)).length;

  const statusCards = [
    {
      status: 'draft',
      label: 'Entwürfe',
      count: draftCount,
      accentColor: 'hsl(var(--warning))',
      dotColor: 'bg-warning',
      shadowColor: 'shadow-warning/20'
    },
    {
      status: 'sent',
      label: 'Versendet',
      count: openCount,
      accentColor: 'hsl(var(--primary))',
      dotColor: 'bg-primary',
      shadowColor: 'shadow-primary/20'
    },
    {
      status: 'paid',
      label: 'Bezahlt',
      count: paidCount,
      accentColor: 'hsl(var(--success))',
      dotColor: 'bg-success',
      shadowColor: 'shadow-success/20'
    },
    {
      status: 'overdue',
      label: 'Überfällig',
      count: overdueCount,
      accentColor: 'hsl(var(--destructive))',
      dotColor: 'bg-destructive',
      shadowColor: 'shadow-destructive/20'
    }
  ];

  const handleStatusClick = (status: string) => {
    // Navigate to invoices page with status filter
    navigate(`/dashboard/invoices?status=${status}`);
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {statusCards.map((card) => (
        <Card 
          key={card.status}
          className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] relative overflow-hidden border-0 shadow-lg"
          style={{ backgroundColor: '#FDFDFE' }}
          onClick={() => handleStatusClick(card.status)}
        >
          <div 
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{ backgroundColor: card.accentColor }}
          />
          <CardContent className="p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div 
                className={`h-3 w-3 rounded-full ${card.dotColor} shadow-lg`}
                style={{ boxShadow: `0 0 12px ${card.accentColor}40` }}
              />
              <span className="text-sm font-semibold text-foreground/80">{card.label}</span>
            </div>
            <div className="text-3xl font-bold text-foreground mb-1">{card.count}</div>
            <div className="text-xs text-foreground/60 font-medium">
              {card.count === 1 ? 'Rechnung' : 'Rechnungen'}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}