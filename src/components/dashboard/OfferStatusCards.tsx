import { Card, CardContent } from "@/components/ui/card";
import { Offer } from "@/types/offer";
import { useNavigate } from "react-router-dom";

interface OfferStatusCardsProps {
  offers: Offer[];
}

export function OfferStatusCards({ offers }: OfferStatusCardsProps) {
  const navigate = useNavigate();
  
  // Group offers by status
  const draftCount = offers.filter(offer => offer.status === 'draft').length;
  const sentCount = offers.filter(offer => offer.status === 'sent').length;
  const acceptedCount = offers.filter(offer => offer.status === 'accepted').length;
  const rejectedCount = offers.filter(offer => offer.status === 'rejected').length;

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
      label: 'Offen',
      count: sentCount,
      accentColor: 'hsl(var(--primary))',
      dotColor: 'bg-primary',
      shadowColor: 'shadow-primary/20'
    },
    {
      status: 'accepted',
      label: 'Angenommen',
      count: acceptedCount,
      accentColor: 'hsl(var(--success))',
      dotColor: 'bg-success',
      shadowColor: 'shadow-success/20'
    },
    {
      status: 'rejected',
      label: 'Abgelehnt',
      count: rejectedCount,
      accentColor: 'hsl(var(--destructive))',
      dotColor: 'bg-destructive',
      shadowColor: 'shadow-destructive/20'
    }
  ];

  const handleStatusClick = (status: string) => {
    // Navigate to offers page with status filter
    navigate(`/dashboard/offers?status=${status}`);
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
              {card.count === 1 ? 'Angebot' : 'Angebote'}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}