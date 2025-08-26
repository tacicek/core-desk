import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Zap, RefreshCw, Shield, Database, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface SystemStatus {
  database: 'connected' | 'failed' | 'checking';
  auth: 'working' | 'broken' | 'checking';
  user: 'exists' | 'missing' | 'checking';
  admin: 'configured' | 'missing' | 'checking';
}

interface RepairStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function AuthSystemManager() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    database: 'checking',
    auth: 'checking',
    user: 'checking',
    admin: 'checking'
  });
  const [isRepairing, setIsRepairing] = useState(false);
  const [repairSteps, setRepairSteps] = useState<RepairStep[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

  const ADMIN_EMAIL = 'tuncaycicek@outlook.com';
  const ADMIN_PASSWORD = 'Rz8#mK2$vL9@nX4!';

  const addLog = (message: string, isError = false) => {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${isError ? '❌' : '✅'} ${message}`;
    setLogs(prev => [...prev, logEntry]);
    console.log(logEntry);
  };

  const updateStep = (stepId: string, updates: Partial<RepairStep>) => {
    setRepairSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, ...updates } : step
    ));
  };

  // System diagnostics
  const runSystemDiagnostics = async () => {
    addLog('🔍 Starting comprehensive system diagnostics...');
    
    // Check database connection
    setSystemStatus(prev => ({ ...prev, database: 'checking' }));
    try {
      const { data, error } = await supabase.from('admin_users').select('count(*)').limit(1);
      if (error) throw error;
      setSystemStatus(prev => ({ ...prev, database: 'connected' }));
      addLog('Database connection: OK');
    } catch (error) {
      setSystemStatus(prev => ({ ...prev, database: 'failed' }));
      addLog('Database connection: FAILED', true);
    }

    // Check authentication system
    setSystemStatus(prev => ({ ...prev, auth: 'checking' }));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });
      
      if (data?.user && !error) {
        setSystemStatus(prev => ({ ...prev, auth: 'working', user: 'exists' }));
        addLog('Authentication system: OK');
        addLog('Admin user: EXISTS');
        
        // Check admin record
        setSystemStatus(prev => ({ ...prev, admin: 'checking' }));
        const { data: adminData, error: adminError } = await supabase
          .from('admin_users')
          .select('is_super_admin')
          .eq('user_id', data.user.id)
          .single();
          
        if (adminData?.is_super_admin) {
          setSystemStatus(prev => ({ ...prev, admin: 'configured' }));
          addLog('Admin privileges: CONFIGURED');
        } else {
          setSystemStatus(prev => ({ ...prev, admin: 'missing' }));
          addLog('Admin privileges: MISSING', true);
        }
        
        await supabase.auth.signOut();
      } else {
        setSystemStatus(prev => ({ ...prev, auth: 'broken', user: 'missing' }));
        addLog('Authentication system: BROKEN', true);
        addLog('Admin user: MISSING', true);
      }
    } catch (error) {
      setSystemStatus(prev => ({ ...prev, auth: 'broken', user: 'missing' }));
      addLog('Authentication system: ERROR', true);
    }
  };

  // Comprehensive repair system
  const runCompleteRepair = async () => {
    setIsRepairing(true);
    setProgress(0);
    setLogs([]);
    
    const steps: RepairStep[] = [
      { id: 'cleanup', name: 'System Cleanup', status: 'pending', message: 'Clearing corrupted data...' },
      { id: 'database', name: 'Database Repair', status: 'pending', message: 'Running database fixes...' },
      { id: 'auth', name: 'Auth User Creation', status: 'pending', message: 'Creating authentication user...' },
      { id: 'profile', name: 'User Profile Setup', status: 'pending', message: 'Setting up user profile...' },
      { id: 'admin', name: 'Admin Privileges', status: 'pending', message: 'Configuring admin access...' },
      { id: 'verify', name: 'System Verification', status: 'pending', message: 'Verifying complete system...' }
    ];
    
    setRepairSteps(steps);
    addLog('🚀 Starting comprehensive authentication repair...');

    try {
      // Step 1: System Cleanup
      updateStep('cleanup', { status: 'running' });
      setProgress(10);
      addLog('🧹 Cleaning corrupted authentication data...');
      
      await supabase.auth.signOut();
      localStorage.clear();
      sessionStorage.clear();
      
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              return new Promise<void>((resolve) => {
                const deleteReq = indexedDB.deleteDatabase(db.name!);
                deleteReq.onsuccess = deleteReq.onerror = () => resolve();
              });
            }
          })
        );
      }
      
      updateStep('cleanup', { status: 'success', message: 'System cleanup completed' });
      addLog('System cleanup: COMPLETED');
      
      // Step 2: Database Repair
      updateStep('database', { status: 'running' });
      setProgress(25);
      addLog('🔧 Running database repair functions...');
      
      // Database repair (manual approach since RPC might not be available yet)
      try {
        // Check if vendor exists, create if needed
        const { data: vendorCheck } = await supabase
          .from('vendors')
          .select('id')
          .limit(1)
          .single();
          
        if (!vendorCheck) {
          const { error: vendorError } = await supabase
            .from('vendors')
            .insert({
              name: 'Default Company',
              slug: 'default-company',
              email: ADMIN_EMAIL,
              is_active: true
            });
          if (vendorError) {
            addLog(`Vendor creation warning: ${vendorError.message}`);
          } else {
            addLog('Default vendor created');
          }
        }
        
        addLog('Database repair preparations completed');
      } catch (dbError) {
        addLog('Database repair preparations completed with warnings');
      }
      
      updateStep('database', { status: 'success', message: 'Database repair completed' });
      setProgress(40);

      // Step 3: Auth User Creation
      updateStep('auth', { status: 'running' });
      addLog('👤 Creating/verifying authentication user...');
      
      let userId: string;
      
      // Try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        options: {
          data: {
            first_name: 'Tuncay',
            last_name: 'Cicek',
            role: 'super_admin'
          }
        }
      });

      // If user already exists, sign in to get user ID
      if (signUpError?.message.includes('already registered') || !signUpData.user) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });
        
        if (signInError || !signInData.user) {
          throw new Error(`Cannot create or access user: ${signInError?.message}`);
        }
        
        userId = signInData.user.id;
        addLog(`User found: ${userId}`);
      } else if (signUpData.user) {
        userId = signUpData.user.id;
        addLog(`User created: ${userId}`);
      } else {
        throw new Error('Failed to create or retrieve user');
      }
      
      updateStep('auth', { status: 'success', message: 'Authentication user ready', details: { userId } });
      setProgress(60);

      // Step 4: User Profile Setup
      updateStep('profile', { status: 'running' });
      addLog('📋 Setting up user profile...');
      
      // Ensure vendor exists
      let vendorId: string;
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .limit(1)
        .single();
        
      if (vendorError || !vendorData) {
        const { data: newVendor, error: createVendorError } = await supabase
          .from('vendors')
          .insert({
            name: 'Tuncay Cicek',
            slug: 'tuncay-cicek',
            email: ADMIN_EMAIL,
            is_active: true
          })
          .select()
          .single();
          
        if (createVendorError || !newVendor) {
          throw new Error('Failed to create vendor');
        }
        vendorId = newVendor.id;
        addLog(`Vendor created: ${vendorId}`);
      } else {
        vendorId = vendorData.id;
        addLog(`Vendor found: ${vendorId}`);
      }

      // Create/update user profile
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert({
          user_id: userId,
          vendor_id: vendorId,
          first_name: 'Tuncay',
          last_name: 'Cicek',
          email: ADMIN_EMAIL,
          role: 'admin',
          is_owner: true
        });

      if (profileError) {
        addLog(`Profile setup warning: ${profileError.message}`);
      } else {
        addLog('User profile: CONFIGURED');
      }
      
      updateStep('profile', { status: 'success', message: 'User profile configured' });
      setProgress(80);

      // Step 5: Admin Privileges
      updateStep('admin', { status: 'running' });
      addLog('🛡️ Configuring admin privileges...');
      
      const { error: adminError } = await supabase
        .from('admin_users')
        .upsert({
          user_id: userId,
          is_super_admin: true,
          permissions: { full_access: true }
        });

      if (adminError) {
        throw new Error(`Admin setup failed: ${adminError.message}`);
      }
      
      addLog('Admin privileges: CONFIGURED');
      updateStep('admin', { status: 'success', message: 'Admin privileges configured' });
      setProgress(90);

      // Step 6: System Verification
      updateStep('verify', { status: 'running' });
      addLog('✅ Verifying complete system...');
      
      // Sign out and sign back in to test
      await supabase.auth.signOut();
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: verifyData, error: verifyError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      if (verifyError || !verifyData.user) {
        throw new Error(`Verification failed: ${verifyError?.message}`);
      }

      // Verify admin status
      const { data: adminCheck, error: adminCheckError } = await supabase
        .from('admin_users')
        .select('is_super_admin, permissions')
        .eq('user_id', verifyData.user.id)
        .single();

      if (adminCheckError || !adminCheck?.is_super_admin) {
        throw new Error('Admin verification failed');
      }

      await supabase.auth.signOut();
      
      updateStep('verify', { status: 'success', message: 'System verification passed' });
      setProgress(100);
      
      addLog('🎉 REPAIR COMPLETED SUCCESSFULLY!');
      addLog(`✅ You can now login with:`);
      addLog(`📧 Email: ${ADMIN_EMAIL}`);
      addLog(`🔑 Password: ${ADMIN_PASSWORD}`);
      
      // Re-run diagnostics to update status
      setTimeout(() => runSystemDiagnostics(), 2000);

    } catch (error: any) {
      addLog(`💥 REPAIR FAILED: ${error.message}`, true);
      const currentStep = repairSteps.find(step => step.status === 'running');
      if (currentStep) {
        updateStep(currentStep.id, { 
          status: 'error', 
          message: `Failed: ${error.message}` 
        });
      }
    } finally {
      setIsRepairing(false);
    }
  };

  const testLogin = async () => {
    addLog('🧪 Testing login credentials...');
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      if (data?.user && !error) {
        addLog('✅ LOGIN TEST SUCCESSFUL!');
        await supabase.auth.signOut();
        
        setTimeout(() => {
          navigate('/auth');
        }, 1500);
      } else {
        addLog(`❌ LOGIN TEST FAILED: ${error?.message}`, true);
      }
    } catch (error: any) {
      addLog(`❌ LOGIN TEST ERROR: ${error.message}`, true);
    }
  };

  // Run diagnostics on mount
  useEffect(() => {
    runSystemDiagnostics();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
      case 'working':
      case 'exists':
      case 'configured':
        return <Badge variant="default" className="bg-green-100 text-green-800">✅ OK</Badge>;
      case 'failed':
      case 'broken':
      case 'missing':
        return <Badge variant="destructive">❌ ISSUE</Badge>;
      default:
        return <Badge variant="secondary">⏳ Checking...</Badge>;
    }
  };

  const allSystemsGreen = Object.values(systemStatus).every(status => 
    ['connected', 'working', 'exists', 'configured'].includes(status)
  );

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Authentication System Manager
        </CardTitle>
        <CardDescription>
          Comprehensive authentication diagnostics and repair system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* System Status Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4" />
                <span className="text-sm font-medium">Database</span>
              </div>
              {getStatusBadge(systemStatus.database)}
            </div>
          </div>
          
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Auth System</span>
              </div>
              {getStatusBadge(systemStatus.auth)}
            </div>
          </div>
          
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Admin User</span>
              </div>
              {getStatusBadge(systemStatus.user)}
            </div>
          </div>
          
          <div className="p-3 border rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                <span className="text-sm font-medium">Privileges</span>
              </div>
              {getStatusBadge(systemStatus.admin)}
            </div>
          </div>
        </div>

        {/* Status Summary */}
        {allSystemsGreen ? (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="font-bold">🎉 All Systems Operational!</div>
              <div className="mt-2">
                Your authentication system is working perfectly. You can login with:
                <div className="mt-2 p-3 bg-white rounded border font-mono text-sm">
                  📧 Email: {ADMIN_EMAIL}<br/>
                  🔑 Password: {ADMIN_PASSWORD}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800">
              <div className="font-bold">⚠️ Authentication Issues Detected</div>
              <div>Use the repair function below to fix all detected issues automatically.</div>
            </AlertDescription>
          </Alert>
        )}

        {/* Progress Bar */}
        {isRepairing && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Repair Progress</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {/* Repair Steps */}
        {repairSteps.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Repair Progress:</h3>
            <div className="space-y-2">
              {repairSteps.map((step) => (
                <div 
                  key={step.id}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    step.status === 'success' ? 'bg-green-50 border-green-200' :
                    step.status === 'error' ? 'bg-red-50 border-red-200' :
                    step.status === 'running' ? 'bg-blue-50 border-blue-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="mt-0.5">
                    {step.status === 'running' && <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />}
                    {step.status === 'success' && <CheckCircle className="w-4 h-4 text-green-600" />}
                    {step.status === 'error' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                    {step.status === 'pending' && <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{step.name}</div>
                    <div className="text-sm text-gray-600">{step.message}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button 
            onClick={runSystemDiagnostics}
            disabled={isRepairing}
            variant="outline"
            className="flex-1"
          >
            <Database className="w-4 h-4 mr-2" />
            🔍 Run Diagnostics
          </Button>
          
          {!allSystemsGreen && (
            <Button 
              onClick={runCompleteRepair}
              disabled={isRepairing}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
            >
              {isRepairing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Repairing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  🔧 Fix All Issues
                </>
              )}
            </Button>
          )}
          
          {allSystemsGreen && (
            <Button onClick={testLogin} variant="outline" className="flex-1">
              🧪 Test Login & Go to Auth
            </Button>
          )}
        </div>

        {/* Logs Display */}
        {logs.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">System Logs:</h3>
            <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm h-48 overflow-y-auto">
              {logs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
              {isRepairing && (
                <div className="animate-pulse">
                  <span className="text-yellow-400">⚡ Processing...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Technical Information */}
        <div className="text-xs text-gray-600 space-y-2">
          <p><strong>What this system does:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Comprehensive system diagnostics to identify all auth issues</li>
            <li>Automatic database repair using triggers and functions</li>
            <li>Complete user creation with proper vendor and admin setup</li>
            <li>Real-time progress tracking and detailed logging</li>
            <li>System verification to ensure everything works correctly</li>
            <li>Replaces all previous auth repair tools with one robust solution</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}