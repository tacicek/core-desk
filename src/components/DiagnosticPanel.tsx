import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Settings, Database, Key, User } from 'lucide-react';

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'info';
  message: string;
  details?: any;
}

export default function DiagnosticPanel() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostics = async () => {
    setRunning(true);
    const testResults: DiagnosticResult[] = [];

    // Test 1: Supabase Configuration
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!supabaseUrl || !supabaseKey) {
        testResults.push({
          test: 'Supabase Configuration',
          status: 'error',
          message: 'Supabase environment variables not configured',
          details: { url: !!supabaseUrl, key: !!supabaseKey }
        });
      } else {
        testResults.push({
          test: 'Supabase Configuration',
          status: 'success',
          message: 'Environment variables are set',
          details: { url: supabaseUrl.substring(0, 30) + '...', hasKey: true }
        });
      }
    } catch (error) {
      testResults.push({
        test: 'Supabase Configuration',
        status: 'error',
        message: 'Failed to check configuration',
        details: error
      });
    }

    // Test 2: Database Connection
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('count(*)')
        .limit(1);

      if (error) {
        testResults.push({
          test: 'Database Connection',
          status: 'error',
          message: 'Database connection failed',
          details: error.message
        });
      } else {
        testResults.push({
          test: 'Database Connection',
          status: 'success',
          message: 'Database connection successful',
          details: data
        });
      }
    } catch (error) {
      testResults.push({
        test: 'Database Connection',
        status: 'error',
        message: 'Database connection error',
        details: error
      });
    }

    // Test 3: Admin User Check
    try {
      const { data: adminUsers, error } = await supabase
        .from('admin_users')
        .select('user_id, is_super_admin')
        .eq('is_super_admin', true);

      if (error) {
        testResults.push({
          test: 'Admin Users Check',
          status: 'error',
          message: 'Failed to check admin users',
          details: error.message
        });
      } else {
        testResults.push({
          test: 'Admin Users Check',
          status: adminUsers.length > 0 ? 'success' : 'info',
          message: `Found ${adminUsers.length} super admin(s) in database`,
          details: adminUsers
        });
      }
    } catch (error) {
      testResults.push({
        test: 'Admin Users Check',
        status: 'error',
        message: 'Admin users check failed',
        details: error
      });
    }

    // Test 4: Auth System Test
    try {
      const testEmail = 'tuncaycicek@outlook.com';
      const testPassword = 'Rz8#mK2$vL9@nX4!';
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (error) {
        testResults.push({
          test: 'Authentication Test',
          status: 'error',
          message: 'Authentication failed',
          details: error.message
        });
      } else if (data.user) {
        testResults.push({
          test: 'Authentication Test',
          status: 'success',
          message: 'Authentication successful',
          details: { userId: data.user.id, email: data.user.email }
        });
        
        // Sign out immediately after test
        await supabase.auth.signOut();
      }
    } catch (error) {
      testResults.push({
        test: 'Authentication Test',
        status: 'error',
        message: 'Authentication test error',
        details: error
      });
    }

    // Test 5: User Profile Check
    try {
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('user_id, first_name, last_name')
        .limit(5);

      if (error) {
        testResults.push({
          test: 'User Profiles Check',
          status: 'error',
          message: 'Failed to check user profiles',
          details: error.message
        });
      } else {
        testResults.push({
          test: 'User Profiles Check',
          status: 'success',
          message: `Found ${profiles.length} user profile(s)`,
          details: profiles
        });
      }
    } catch (error) {
      testResults.push({
        test: 'User Profiles Check',
        status: 'error',
        message: 'User profiles check failed',
        details: error
      });
    }

    setResults(testResults);
    setRunning(false);
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Settings className="w-4 h-4 text-blue-600" />;
    }
  };

  const getAlertClass = (status: string) => {
    switch (status) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'error': return 'border-red-200 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="w-5 h-5" />
          System Diagnostics
        </CardTitle>
        <CardDescription>
          Run comprehensive tests to identify authentication issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runDiagnostics}
          disabled={running}
          className="w-full"
        >
          {running ? 'Running Diagnostics...' : 'Run Full System Diagnostics'}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Diagnostic Results:</h3>
            {results.map((result, index) => (
              <Alert key={index} className={getAlertClass(result.status)}>
                <div className="flex items-start gap-2">
                  {getIcon(result.status)}
                  <div className="flex-1">
                    <div className="font-medium">{result.test}</div>
                    <AlertDescription className="mt-1">
                      {result.message}
                      {result.details && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs opacity-70">
                            Show details
                          </summary>
                          <pre className="mt-1 text-xs bg-black/5 p-2 rounded overflow-auto max-h-32">
                            {typeof result.details === 'string' 
                              ? result.details 
                              : JSON.stringify(result.details, null, 2)
                            }
                          </pre>
                        </details>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        <div className="text-xs text-gray-600 space-y-1">
          <p><strong>Note:</strong> These diagnostics help identify common authentication issues:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Supabase configuration problems</li>
            <li>Database connectivity issues</li>
            <li>Missing admin user records</li>
            <li>Authentication system failures</li>
            <li>User profile synchronization issues</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}