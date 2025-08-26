import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  errorId?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  private retryCount = 0;
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { 
      hasError: true, 
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 Error caught by ErrorBoundary:', error);
    console.error('🔴 Component stack:', errorInfo.componentStack);

    this.setState({ errorInfo });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // Report error to backend
    this.reportError(error, errorInfo);
  }

  private async reportError(error: Error, errorInfo: ErrorInfo) {
    try {
      const errorReport = {
        errorId: this.state.errorId,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        userId: null as string | null,
        vendorId: null as string | null
      };

      // Get user context if available
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          errorReport.userId = user.id;
          
          // Get vendor context
          const { data: profile } = await supabase
            .from('user_profiles')
            .select('vendor_id')
            .eq('user_id', user.id)
            .single();
          
          if (profile?.vendor_id) {
            errorReport.vendorId = profile.vendor_id;
          }
        }
      } catch (e) {
        console.warn('Could not get user context for error report:', e);
      }

      // Log to Supabase edge function
      await supabase.functions.invoke('log-error', {
        body: errorReport
      });

      console.log('✅ Error reported with ID:', this.state.errorId);
    } catch (reportError) {
      console.error('❌ Failed to report error:', reportError);
      
      // Fallback: Store error locally for later reporting
      try {
        const existingErrors = JSON.parse(
          localStorage.getItem('unreported_errors') || '[]'
        );
        existingErrors.push({
          error: error.message,
          stack: error.stack,
          timestamp: new Date().toISOString()
        });
        
        // Keep only last 10 errors
        if (existingErrors.length > 10) {
          existingErrors.splice(0, existingErrors.length - 10);
        }
        
        localStorage.setItem('unreported_errors', JSON.stringify(existingErrors));
      } catch (e) {
        console.error('❌ Failed to store error locally:', e);
      }
    }
  }

  private handleRetry = () => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(`🔄 Retrying... (${this.retryCount}/${this.maxRetries})`);
      this.setState({ hasError: false, error: undefined, errorInfo: undefined });
    } else {
      console.log('❌ Max retries reached, reloading page...');
      window.location.reload();
    }
  };

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.href = '/dashboard';
  };

  private renderErrorDetails() {
    if (!this.state.error || process.env.NODE_ENV === 'production') {
      return null;
    }

    return (
      <details className="mt-4 text-left">
        <summary className="cursor-pointer text-sm font-medium text-gray-600 hover:text-gray-800">
          <Bug className="inline h-4 w-4 mr-1" />
          Technische Details (Entwicklungsmodus)
        </summary>
        <div className="mt-2 p-3 bg-gray-50 rounded-md">
          <div className="text-xs font-mono text-red-600 whitespace-pre-wrap">
            <strong>Error:</strong> {this.state.error.message}
          </div>
          {this.state.error.stack && (
            <div className="mt-2 text-xs font-mono text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
              <strong>Stack:</strong>
              {this.state.error.stack}
            </div>
          )}
          {this.state.errorInfo?.componentStack && (
            <div className="mt-2 text-xs font-mono text-gray-600 whitespace-pre-wrap max-h-32 overflow-y-auto">
              <strong>Component Stack:</strong>
              {this.state.errorInfo.componentStack}
            </div>
          )}
          {this.state.errorId && (
            <div className="mt-2 text-xs text-gray-500">
              <strong>Error ID:</strong> {this.state.errorId}
            </div>
          )}
        </div>
      </details>
    );
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <CardTitle className="text-xl font-bold text-gray-900">
                Oops! Etwas ist schiefgelaufen
              </CardTitle>
              <CardDescription className="text-gray-600">
                Es ist ein unerwarteter Fehler aufgetreten. Wir wurden automatisch über 
                dieses Problem informiert und arbeiten an einer Lösung.
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1"
                  disabled={this.retryCount >= this.maxRetries}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  {this.retryCount >= this.maxRetries ? 'Max. Versuche erreicht' : 'Erneut versuchen'}
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="h-4 w-4 mr-2" />
                  Zur Startseite
                </Button>
              </div>
              
              <Button 
                onClick={this.handleReload}
                variant="secondary"
                className="w-full"
              >
                Seite neu laden
              </Button>

              {this.renderErrorDetails()}
              
              <div className="text-center text-xs text-gray-500 pt-2">
                Falls das Problem weiterhin besteht, kontaktieren Sie bitte den Support.
                {this.state.errorId && (
                  <div className="mt-1">
                    Fehler-ID: <code className="text-gray-700">{this.state.errorId}</code>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>
) => {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Hook for manually reporting errors
export const useErrorReporting = () => {
  const reportError = async (error: Error, context?: Record<string, any>) => {
    try {
      const errorReport = {
        errorId: `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        message: error.message,
        stack: error.stack,
        context: context || {},
        userAgent: navigator.userAgent,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        type: 'manual'
      };

      await supabase.functions.invoke('log-error', {
        body: errorReport
      });

      console.log('✅ Manual error reported with ID:', errorReport.errorId);
      return errorReport.errorId;
    } catch (reportError) {
      console.error('❌ Failed to report manual error:', reportError);
      return null;
    }
  };

  return { reportError };
};