import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertTriangle, Info, RefreshCw } from 'lucide-react';

interface DiagnosticCheck {
  name: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

export default function DiagnosticPage() {
  const [checks, setChecks] = useState<DiagnosticCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const runDiagnostics = async () => {
    setIsRunning(true);
    const diagnostics: DiagnosticCheck[] = [];

    // Check 1: React and DOM
    try {
      const rootElement = document.getElementById('root');
      if (rootElement) {
        diagnostics.push({
          name: 'DOM Root Element',
          status: 'success',
          message: 'Root element found successfully',
          details: `Element type: ${rootElement.tagName}, Children: ${rootElement.children.length}`
        });
      } else {
        diagnostics.push({
          name: 'DOM Root Element',
          status: 'error',
          message: 'Root element not found',
          details: 'The #root element is missing from the DOM'
        });
      }
    } catch (error) {
      diagnostics.push({
        name: 'DOM Root Element',
        status: 'error',
        message: 'Failed to check root element',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Check 2: React Rendering
    try {
      diagnostics.push({
        name: 'React Component',
        status: 'success',
        message: 'React component is rendering successfully',
        details: 'This diagnostic page is proof that React is working'
      });
    } catch (error) {
      diagnostics.push({
        name: 'React Component',
        status: 'error',
        message: 'React rendering issues detected',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Check 3: Environment Variables
    try {
      const hasSupabaseUrl = !!import.meta.env.VITE_SUPABASE_URL;
      const hasSupabaseKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (hasSupabaseUrl && hasSupabaseKey) {
        diagnostics.push({
          name: 'Environment Variables',
          status: 'success',
          message: 'Supabase environment variables are configured',
          details: `URL: ${hasSupabaseUrl ? 'Set' : 'Missing'}, Key: ${hasSupabaseKey ? 'Set' : 'Missing'}`
        });
      } else {
        diagnostics.push({
          name: 'Environment Variables',
          status: 'warning',
          message: 'Some environment variables are missing',
          details: `URL: ${hasSupabaseUrl ? 'Set' : 'Missing'}, Key: ${hasSupabaseKey ? 'Set' : 'Missing'}`
        });
      }
    } catch (error) {
      diagnostics.push({
        name: 'Environment Variables',
        status: 'error',
        message: 'Failed to check environment variables',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Check 4: CSS Styles
    try {
      const styles = getComputedStyle(document.body);
      const hasStyles = styles.fontSize !== '' && styles.fontFamily !== '';
      
      diagnostics.push({
        name: 'CSS Styles',
        status: hasStyles ? 'success' : 'warning',
        message: hasStyles ? 'CSS styles are loaded properly' : 'CSS styles may not be loading',
        details: `Font: ${styles.fontFamily}, Size: ${styles.fontSize}`
      });
    } catch (error) {
      diagnostics.push({
        name: 'CSS Styles',
        status: 'error',
        message: 'Failed to check CSS styles',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Check 5: JavaScript Errors
    try {
      const errorCount = (window as any).__errorCount || 0;
      diagnostics.push({
        name: 'JavaScript Errors',
        status: errorCount === 0 ? 'success' : 'warning',
        message: errorCount === 0 ? 'No JavaScript errors detected' : `${errorCount} errors detected`,
        details: 'Check browser console for details'
      });
    } catch (error) {
      diagnostics.push({
        name: 'JavaScript Errors',
        status: 'error',
        message: 'Failed to check for errors',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Check 6: Network Connectivity
    try {
      const isOnline = navigator.onLine;
      diagnostics.push({
        name: 'Network Connectivity',
        status: isOnline ? 'success' : 'warning',
        message: isOnline ? 'Network connection available' : 'No network connection',
        details: `Navigator.onLine: ${isOnline}`
      });
    } catch (error) {
      diagnostics.push({
        name: 'Network Connectivity',
        status: 'error',
        message: 'Failed to check network status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    setChecks(diagnostics);
    setIsRunning(false);
  };

  useEffect(() => {
    runDiagnostics();
    
    // Track errors globally
    const errorHandler = (event: ErrorEvent) => {
      (window as any).__errorCount = ((window as any).__errorCount || 0) + 1;
      console.error('🚨 Global error detected:', event.error);
    };
    
    window.addEventListener('error', errorHandler);
    
    return () => {
      window.removeEventListener('error', errorHandler);
    };
  }, []);

  const getIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getAlertClass = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'error': return 'border-red-200 bg-red-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const hasErrors = checks.some(check => check.status === 'error');
  const hasWarnings = checks.some(check => check.status === 'warning');

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">🔍 System Diagnostics</CardTitle>
            <CardDescription>
              Comprehensive system health check to identify white screen issues
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Button 
                onClick={runDiagnostics}
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" />
                    Run Diagnostics
                  </>
                )}
              </Button>
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
              >
                Go to Home
              </Button>
              <Button 
                onClick={() => window.location.href = '/setup'}
                variant="outline"
              >
                Go to Setup
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Overall Status */}
        {checks.length > 0 && (
          <Alert className={getAlertClass(hasErrors ? 'error' : hasWarnings ? 'warning' : 'success')}>
            {getIcon(hasErrors ? 'error' : hasWarnings ? 'warning' : 'success')}
            <AlertDescription>
              <div className="font-bold">
                {hasErrors ? '❌ Issues Detected' : hasWarnings ? '⚠️ Warnings Found' : '✅ All Systems OK'}
              </div>
              <div>
                {hasErrors 
                  ? 'Some critical issues were found that may cause white screen problems.'
                  : hasWarnings 
                  ? 'Some minor issues were found but the system should work.'
                  : 'All diagnostic checks passed successfully.'
                }
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Diagnostic Results */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Diagnostic Results</h2>
          {checks.map((check, index) => (
            <Card key={index} className={`border-l-4 ${
              check.status === 'success' ? 'border-l-green-500' :
              check.status === 'error' ? 'border-l-red-500' :
              check.status === 'warning' ? 'border-l-yellow-500' :
              'border-l-blue-500'
            }`}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  {getIcon(check.status)}
                  <div className="flex-1">
                    <div className="font-medium">{check.name}</div>
                    <div className="text-sm text-gray-600 mt-1">{check.message}</div>
                    {check.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-500 cursor-pointer">Show details</summary>
                        <div className="mt-1 text-xs bg-gray-100 p-2 rounded font-mono">
                          {check.details}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Browser Information */}
        <Card>
          <CardHeader>
            <CardTitle>Browser Information</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <div><strong>User Agent:</strong> {navigator.userAgent}</div>
            <div><strong>Language:</strong> {navigator.language}</div>
            <div><strong>Platform:</strong> {navigator.platform}</div>
            <div><strong>Cookies Enabled:</strong> {navigator.cookieEnabled ? 'Yes' : 'No'}</div>
            <div><strong>Screen Resolution:</strong> {screen.width}x{screen.height}</div>
            <div><strong>Viewport:</strong> {window.innerWidth}x{window.innerHeight}</div>
          </CardContent>
        </Card>

        {/* Quick Solutions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Solutions for White Screen Issues</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-bold text-blue-700 mb-2">1. Clear Browser Cache</h3>
                <p className="text-sm">Press Ctrl+Shift+R (Cmd+Shift+R on Mac) to hard refresh</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-bold text-blue-700 mb-2">2. Check Browser Console</h3>
                <p className="text-sm">Press F12 and look for errors in the Console tab</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-bold text-blue-700 mb-2">3. Disable Extensions</h3>
                <p className="text-sm">Try opening the site in incognito/private mode</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-bold text-blue-700 mb-2">4. Check Network</h3>
                <p className="text-sm">Ensure you have a stable internet connection</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}