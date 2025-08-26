import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Skull, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  isAuthError: boolean;
}

class AuthErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
    isAuthError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if this is an authentication-related error
    const isAuthError = 
      error.message.includes('Invalid login') ||
      error.message.includes('ungültige') ||
      error.message.includes('Anmeldung') ||
      error.message.includes('Authentication') ||
      error.message.includes('auth') ||
      error.message.includes('credential') ||
      error.message.includes('supabase') ||
      error.stack?.includes('auth') ||
      false;

    return {
      hasError: true,
      error,
      errorInfo: null,
      isAuthError
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🚨 AuthErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
      isAuthError: this.state.isAuthError
    });

    // Log to console for debugging
    if (this.state.isAuthError) {
      console.error('🔐 AUTHENTICATION ERROR DETECTED - Suggesting nuclear fix');
    }
  }

  private goToNuclearFix = () => {
    window.location.href = '/nuclear-fix';
  };

  private goToSetup = () => {
    window.location.href = '/setup';
  };

  private reloadPage = () => {
    window.location.reload();
  };

  private clearAllData = () => {
    // Clear everything and reload
    localStorage.clear();
    sessionStorage.clear();
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => registration.unregister());
      });
    }
    window.location.href = '/nuclear-fix';
  };

  public render() {
    if (this.state.hasError) {
      if (this.state.isAuthError) {
        // Special handling for authentication errors
        return (
          <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
            <Card className="w-full max-w-2xl border-red-200">
              <CardHeader className="text-center bg-red-100">
                <div className="mx-auto w-16 h-16 bg-red-200 rounded-full flex items-center justify-center mb-4">
                  <AlertTriangle className="w-8 h-8 text-red-700" />
                </div>
                <CardTitle className="text-2xl font-bold text-red-800">
                  🔐 Authentication System Error
                </CardTitle>
                <CardDescription className="text-red-700">
                  Critical authentication failure detected
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Alert className="border-red-300 bg-red-50">
                  <Skull className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <div className="space-y-2">
                      <p className="font-bold">⚠️ CRITICAL: Authentication system has failed completely</p>
                      <p>Error: {this.state.error?.message}</p>
                      <p className="text-sm">This usually means corrupted authentication data or configuration issues.</p>
                    </div>
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <h3 className="font-bold text-red-800">🚀 Recommended Actions (in order):</h3>
                  
                  <Button 
                    onClick={this.goToNuclearFix}
                    className="w-full bg-red-600 hover:bg-red-700 text-white"
                  >
                    <Skull className="w-4 h-4 mr-2" />
                    💥 Go to Nuclear Fix (GUARANTEED SOLUTION)
                  </Button>

                  <Button 
                    onClick={this.clearAllData}
                    variant="outline"
                    className="w-full border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    🧹 Clear All Data & Go to Nuclear Fix
                  </Button>

                  <Button 
                    onClick={this.goToSetup}
                    variant="outline"
                    className="w-full"
                  >
                    🔧 Try Setup Page First
                  </Button>

                  <Button 
                    onClick={this.reloadPage}
                    variant="outline"
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    🔄 Reload Page
                  </Button>
                </div>

                <Alert className="border-blue-200 bg-blue-50">
                  <AlertTriangle className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-800">
                    <p className="font-bold">💡 Pro Tip:</p>
                    <p>The Nuclear Fix will completely rebuild your authentication system and is guaranteed to work. It's your best option right now.</p>
                  </AlertDescription>
                </Alert>

                <details className="text-sm">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                    🔍 Show Technical Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                    <div><strong>Error:</strong> {this.state.error?.message}</div>
                    <div><strong>Stack:</strong></div>
                    <pre>{this.state.error?.stack}</pre>
                    {this.state.errorInfo && (
                      <>
                        <div><strong>Component Stack:</strong></div>
                        <pre>{this.state.errorInfo.componentStack}</pre>
                      </>
                    )}
                  </div>
                </details>
              </CardContent>
            </Card>
          </div>
        );
      }

      // Generic error handling for non-auth errors
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-800">
                ⚠️ Something went wrong
              </CardTitle>
              <CardDescription>
                An unexpected error occurred
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <p>Error: {this.state.error?.message}</p>
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button onClick={this.reloadPage} className="flex-1">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>
                <Button onClick={this.goToSetup} variant="outline" className="flex-1">
                  Go to Setup
                </Button>
              </div>

              <details className="text-sm">
                <summary className="cursor-pointer text-gray-600">Show Details</summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono overflow-auto max-h-40">
                  <pre>{this.state.error?.stack}</pre>
                </div>
              </details>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AuthErrorBoundary;