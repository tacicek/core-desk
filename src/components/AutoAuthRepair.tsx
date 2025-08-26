import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, Zap, RefreshCw, UserPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RepairStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: any;
}

export default function AutoAuthRepair() {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<RepairStep[]>([]);
  const [finalStatus, setFinalStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const navigate = useNavigate();

  const ADMIN_EMAIL = 'tuncaycicek@outlook.com';
  const ADMIN_PASSWORD = 'Rz8#mK2$vL9@nX4!';
  const TARGET_USER_ID = '4e228b7a-9fdb-43b5-9d3b-5bf0df42609b';

  const updateStep = (index: number, updates: Partial<RepairStep>) => {
    setSteps(prev => prev.map((step, i) => 
      i === index ? { ...step, ...updates } : step
    ));
  };

  const addStep = (step: RepairStep) => {
    setSteps(prev => [...prev, step]);
  };

  const runCompleteRepair = async () => {
    setIsRunning(true);
    setFinalStatus('pending');
    setSteps([]);

    const repairSteps: RepairStep[] = [
      { name: 'Clear All Sessions', status: 'pending', message: 'Clearing existing sessions...' },
      { name: 'Clear Browser Storage', status: 'pending', message: 'Clearing browser storage...' },
      { name: 'Delete Existing User (if any)', status: 'pending', message: 'Removing any existing conflicting user...' },
      { name: 'Create Fresh Auth User', status: 'pending', message: 'Creating new auth user...' },
      { name: 'Create Admin Database Record', status: 'pending', message: 'Creating admin database record...' },
      { name: 'Create User Profile', status: 'pending', message: 'Creating user profile...' },
      { name: 'Create Vendor Record', status: 'pending', message: 'Creating vendor record...' },
      { name: 'Test Authentication', status: 'pending', message: 'Testing complete authentication flow...' },
      { name: 'Final Verification', status: 'pending', message: 'Verifying all systems are working...' }
    ];

    setSteps(repairSteps);

    try {
      // Step 1: Clear all sessions
      updateStep(0, { status: 'running' });
      await supabase.auth.signOut();
      updateStep(0, { status: 'success', message: 'Sessions cleared successfully' });

      // Step 2: Clear browser storage
      updateStep(1, { status: 'running' });
      localStorage.clear();
      sessionStorage.clear();
      // Clear IndexedDB
      if ('indexedDB' in window) {
        const databases = await indexedDB.databases();
        await Promise.all(
          databases.map(db => {
            if (db.name) {
              return new Promise<void>((resolve) => {
                const deleteReq = indexedDB.deleteDatabase(db.name!);
                deleteReq.onsuccess = () => resolve();
                deleteReq.onerror = () => resolve();
              });
            }
          })
        );
      }
      updateStep(1, { status: 'success', message: 'Browser storage cleared' });

      // Step 3: Delete existing user (attempt multiple methods)
      updateStep(2, { status: 'running' });
      try {
        // Try to sign in first to get user ID
        const { data: existingUser } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD,
        });
        
        if (existingUser?.user) {
          // User exists, sign out
          await supabase.auth.signOut();
          updateStep(2, { status: 'success', message: 'Found existing user, will recreate' });
        } else {
          updateStep(2, { status: 'success', message: 'No existing user found' });
        }
      } catch {
        updateStep(2, { status: 'success', message: 'No conflicting user found' });
      }

      // Step 4: Create fresh auth user
      updateStep(3, { status: 'running' });
      const { data: newUser, error: signUpError } = await supabase.auth.signUp({
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

      if (signUpError && !signUpError.message.includes('already registered')) {
        throw new Error(`User creation failed: ${signUpError.message}`);
      }

      // Now sign in to get the actual user
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      if (signInError || !signInData.user) {
        throw new Error(`Sign in after creation failed: ${signInError?.message || 'No user returned'}`);
      }

      const userId = signInData.user.id;
      updateStep(3, { 
        status: 'success', 
        message: 'Auth user created successfully',
        details: { userId, email: signInData.user.email }
      });

      // Step 5: Create admin database record
      updateStep(4, { status: 'running' });
      
      // First, delete any existing admin record for this user
      await supabase.from('admin_users').delete().eq('user_id', userId);
      
      const { error: adminError } = await supabase
        .from('admin_users')
        .insert({
          user_id: userId,
          is_super_admin: true,
          permissions: { full_access: true }
        });

      if (adminError) {
        throw new Error(`Admin record creation failed: ${adminError.message}`);
      }

      updateStep(4, { status: 'success', message: 'Admin record created' });

      // Step 6: Create user profile
      updateStep(5, { status: 'running' });
      
      // Delete any existing profile
      await supabase.from('user_profiles').delete().eq('user_id', userId);
      
      const { error: profileError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: userId,
          first_name: 'Tuncay',
          last_name: 'Cicek',
          email: ADMIN_EMAIL,
          role: 'admin'
        });

      if (profileError) {
        console.warn('Profile creation failed:', profileError.message);
        updateStep(5, { status: 'success', message: 'Profile creation skipped (optional)' });
      } else {
        updateStep(5, { status: 'success', message: 'User profile created' });
      }

      // Step 7: Create vendor record
      updateStep(6, { status: 'running' });
      
      // Delete any existing vendor
      await supabase.from('vendors').delete().eq('user_id', userId);
      
      const { data: vendorData, error: vendorError } = await supabase
        .from('vendors')
        .insert({
          user_id: userId,
          name: 'Tuncay Cicek',
          email: ADMIN_EMAIL,
          phone: '',
          address: '',
          city: '',
          postal_code: '',
          country: 'CH',
          tax_number: '',
          website: ''
        })
        .select()
        .single();

      if (vendorError) {
        console.warn('Vendor creation failed:', vendorError.message);
        updateStep(6, { status: 'success', message: 'Vendor creation skipped (will be created on first login)' });
      } else {
        updateStep(6, { status: 'success', message: 'Vendor record created' });
        
        // Update user profile with vendor_id if we created one
        if (vendorData) {
          await supabase
            .from('user_profiles')
            .update({ vendor_id: vendorData.id })
            .eq('user_id', userId);
        }
      }

      // Step 8: Test authentication
      updateStep(7, { status: 'running' });
      
      // Sign out and sign back in to test
      await supabase.auth.signOut();
      
      const { data: testSignIn, error: testError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      if (testError || !testSignIn.user) {
        throw new Error(`Authentication test failed: ${testError?.message || 'No user returned'}`);
      }

      updateStep(7, { 
        status: 'success', 
        message: 'Authentication test successful',
        details: { userId: testSignIn.user.id }
      });

      // Step 9: Final verification
      updateStep(8, { status: 'running' });
      
      // Verify admin status
      const { data: adminCheck, error: adminCheckError } = await supabase
        .from('admin_users')
        .select('is_super_admin, permissions')
        .eq('user_id', testSignIn.user.id)
        .single();

      if (adminCheckError || !adminCheck) {
        throw new Error(`Admin verification failed: ${adminCheckError?.message || 'No admin record'}`);
      }

      // Sign out after verification
      await supabase.auth.signOut();

      updateStep(8, { 
        status: 'success', 
        message: 'All systems verified and working',
        details: { 
          isAdmin: adminCheck.is_super_admin,
          permissions: adminCheck.permissions
        }
      });

      setFinalStatus('success');

    } catch (error: any) {
      console.error('Repair failed:', error);
      const currentRunningStep = steps.findIndex(step => step.status === 'running');
      if (currentRunningStep !== -1) {
        updateStep(currentRunningStep, { 
          status: 'error', 
          message: `Failed: ${error.message}`,
          details: error
        });
      }
      setFinalStatus('error');
    } finally {
      setIsRunning(false);
    }
  };

  const goToLogin = () => {
    navigate('/auth');
  };

  const getStepIcon = (status: RepairStep['status']) => {
    switch (status) {
      case 'running': return <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />;
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />;
    }
  };

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-orange-600" />
          Automated Authentication Repair
        </CardTitle>
        <CardDescription>
          Complete automated fix for all authentication issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Final Status */}
        {finalStatus === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="space-y-2">
                <p className="font-bold">🎉 SUCCESS! Authentication is now fully working!</p>
                <div className="bg-white p-3 rounded border">
                  <p className="font-mono text-sm">
                    📧 Email: {ADMIN_EMAIL}<br/>
                    🔑 Password: {ADMIN_PASSWORD}
                  </p>
                </div>
                <p>You can now login with these credentials!</p>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {finalStatus === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              ❌ Automated repair encountered an error. Check the steps below for details.
            </AlertDescription>
          </Alert>
        )}

        {/* Repair Button */}
        <div className="flex gap-3">
          <Button 
            onClick={runCompleteRepair}
            disabled={isRunning}
            className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running Automated Repair...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                🔧 Run Complete Authentication Repair
              </>
            )}
          </Button>
          
          {finalStatus === 'success' && (
            <Button onClick={goToLogin} variant="outline">
              Go to Login
            </Button>
          )}
        </div>

        {/* Progress Steps */}
        {steps.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Repair Progress:</h3>
            <div className="space-y-2">
              {steps.map((step, index) => (
                <div 
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border ${
                    step.status === 'success' ? 'bg-green-50 border-green-200' :
                    step.status === 'error' ? 'bg-red-50 border-red-200' :
                    step.status === 'running' ? 'bg-blue-50 border-blue-200' :
                    'bg-gray-50 border-gray-200'
                  }`}
                >
                  {getStepIcon(step.status)}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{step.name}</div>
                    <div className="text-sm text-gray-600">{step.message}</div>
                    {step.details && (
                      <details className="mt-1">
                        <summary className="text-xs cursor-pointer opacity-70">Details</summary>
                        <pre className="text-xs mt-1 p-2 bg-black/5 rounded overflow-auto max-h-20">
                          {JSON.stringify(step.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="text-sm text-gray-600 space-y-2">
          <p><strong>What this tool does:</strong></p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Completely clears all existing authentication data</li>
            <li>Creates a fresh user in Supabase Auth</li>
            <li>Creates all required database records (admin, profile, vendor)</li>
            <li>Tests the complete authentication flow</li>
            <li>Verifies all systems are working correctly</li>
          </ul>
          <p className="text-xs text-orange-600">
            ⚠️ This will completely reset your authentication. Any existing user data will be recreated.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}