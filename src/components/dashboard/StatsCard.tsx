
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  changeType?: 'positive' | 'negative' | 'neutral';
  icon: LucideIcon;
  iconColor?: string;
  onClick?: () => void;
  href?: string;
}

export function StatsCard({ 
  title, 
  value, 
  change, 
  changeType = 'neutral',
  icon: Icon,
  iconColor = "text-primary",
  onClick,
  href
}: StatsCardProps) {
  const CardWrapper = ({ children }: { children: React.ReactNode }) => {
    if (href) {
      return (
        <Link to={href} className="block">
          {children}
        </Link>
      );
    }
    
    if (onClick) {
      return (
        <button onClick={onClick} className="w-full text-left">
          {children}
        </button>
      );
    }
    
    return <>{children}</>;
  };

  return (
    <CardWrapper>
      <Card className={cn(
        "relative overflow-hidden bg-gradient-card border-l-4 border-l-primary hover:shadow-lg transition-all duration-300",
        (onClick || href) && "cursor-pointer hover:scale-105 hover:shadow-xl"
      )}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 md:p-6">
          <CardTitle className="text-clamp-stat-title font-medium text-muted-foreground leading-tight">
            {title}
          </CardTitle>
          <div className="p-2 rounded-full bg-primary/10">
            <Icon className={cn("h-4 w-4 md:h-5 md:w-5 flex-shrink-0", iconColor)} />
          </div>
        </CardHeader>
        <CardContent className="p-3 md:p-6 pt-0">
          <div className="text-clamp-base font-bold leading-tight text-foreground">{value}</div>
          {change && (
            <p className={cn(
              "text-clamp-stat-subtitle mt-1 leading-tight font-medium",
              changeType === 'positive' && "text-success",
              changeType === 'negative' && "text-destructive",
              changeType === 'neutral' && "text-muted-foreground"
            )}>
              {change}
            </p>
          )}
        </CardContent>
      </Card>
    </CardWrapper>
  );
}
