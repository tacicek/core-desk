import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  variant?: 'default' | 'dots' | 'pulse' | 'bounce' | 'bars';
  color?: 'primary' | 'secondary' | 'muted' | 'white';
  text?: string;
}

export const LoadingSpinner = ({ 
  size = 'md', 
  className = '', 
  variant = 'default',
  color = 'primary',
  text
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  const colorClasses = {
    primary: 'text-primary border-primary',
    secondary: 'text-secondary border-secondary',
    muted: 'text-muted-foreground border-muted-foreground',
    white: 'text-white border-white'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  if (variant === 'default') {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <Loader2 className={cn(
          'animate-spin',
          sizeClasses[size],
          colorClasses[color]
        )} />
        {text && (
          <span className={cn(
            'font-medium',
            textSizeClasses[size],
            colorClasses[color]
          )}>
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded-full animate-pulse',
                size === 'sm' ? 'h-2 w-2' : 
                size === 'md' ? 'h-3 w-3' :
                size === 'lg' ? 'h-4 w-4' : 'h-6 w-6',
                color === 'primary' ? 'bg-primary' :
                color === 'secondary' ? 'bg-secondary' :
                color === 'muted' ? 'bg-muted-foreground' : 'bg-white'
              )}
              style={{
                animationDelay: `${i * 0.2}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
        {text && (
          <span className={cn(
            'font-medium',
            textSizeClasses[size],
            colorClasses[color]
          )}>
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'pulse') {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div className={cn(
          'rounded-full animate-pulse',
          sizeClasses[size],
          color === 'primary' ? 'bg-primary' :
          color === 'secondary' ? 'bg-secondary' :
          color === 'muted' ? 'bg-muted-foreground' : 'bg-white'
        )} />
        {text && (
          <span className={cn(
            'font-medium animate-pulse',
            textSizeClasses[size],
            colorClasses[color]
          )}>
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'bounce') {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                'rounded-full animate-bounce',
                size === 'sm' ? 'h-2 w-2' : 
                size === 'md' ? 'h-3 w-3' :
                size === 'lg' ? 'h-4 w-4' : 'h-6 w-6',
                color === 'primary' ? 'bg-primary' :
                color === 'secondary' ? 'bg-secondary' :
                color === 'muted' ? 'bg-muted-foreground' : 'bg-white'
              )}
              style={{
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
        {text && (
          <span className={cn(
            'font-medium',
            textSizeClasses[size],
            colorClasses[color]
          )}>
            {text}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'bars') {
    return (
      <div className={cn('flex flex-col items-center gap-2', className)}>
        <div className="flex space-x-1 items-end">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={cn(
                'animate-pulse',
                size === 'sm' ? 'w-1' : 
                size === 'md' ? 'w-1.5' :
                size === 'lg' ? 'w-2' : 'w-3',
                color === 'primary' ? 'bg-primary' :
                color === 'secondary' ? 'bg-secondary' :
                color === 'muted' ? 'bg-muted-foreground' : 'bg-white'
              )}
              style={{
                height: `${(i + 1) * (size === 'sm' ? 4 : size === 'md' ? 6 : size === 'lg' ? 8 : 12)}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: '1s'
              }}
            />
          ))}
        </div>
        {text && (
          <span className={cn(
            'font-medium',
            textSizeClasses[size],
            colorClasses[color]
          )}>
            {text}
          </span>
        )}
      </div>
    );
  }

  // Fallback to default
  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-transparent',
        sizeClasses[size],
        colorClasses[color]
      )} />
      {text && (
        <span className={cn(
          'font-medium',
          textSizeClasses[size],
          colorClasses[color]
        )}>
          {text}
        </span>
      )}
    </div>
  );
};

// Loading overlay component
export interface LoadingOverlayProps {
  isLoading: boolean;
  text?: string;
  variant?: LoadingSpinnerProps['variant'];
  size?: LoadingSpinnerProps['size'];
  className?: string;
  backdrop?: boolean;
  children?: React.ReactNode;
}

export const LoadingOverlay = ({
  isLoading,
  text = 'Wird geladen...',
  variant = 'default',
  size = 'lg',
  className = '',
  backdrop = true,
  children
}: LoadingOverlayProps) => {
  if (!isLoading && !children) return null;

  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className={cn(
          'absolute inset-0 flex items-center justify-center z-50',
          backdrop && 'bg-background/80 backdrop-blur-sm'
        )}>
          <LoadingSpinner
            variant={variant}
            size={size}
            text={text}
            color={backdrop ? 'primary' : 'white'}
          />
        </div>
      )}
    </div>
  );
};

// Loading page component
export interface LoadingPageProps {
  text?: string;
  variant?: LoadingSpinnerProps['variant'];
  size?: LoadingSpinnerProps['size'];
  showLogo?: boolean;
}

export const LoadingPage = ({
  text = 'CoreDesk wird geladen...',
  variant = 'default',
  size = 'xl',
  showLogo = true
}: LoadingPageProps) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      {showLogo && (
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            CoreDesk
          </h1>
        </div>
      )}
      <LoadingSpinner
        variant={variant}
        size={size}
        text={text}
      />
    </div>
  );
};

// Loading button component
export interface LoadingButtonProps {
  isLoading: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const LoadingButton = ({
  isLoading,
  loadingText,
  children,
  className = '',
  disabled = false,
  onClick,
  variant = 'default',
  size = 'default',
  ...props
}: LoadingButtonProps & React.ButtonHTMLAttributes<HTMLButtonElement>) => {
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading && (
        <LoadingSpinner
          size="sm"
          variant="default"
          color="white"
          className="mr-2"
        />
      )}
      {isLoading ? (loadingText || 'Wird geladen...') : children}
    </Button>
  );
};