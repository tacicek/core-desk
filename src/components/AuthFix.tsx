import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, UserPlus, LogIn, RefreshCw } from 'lucide-react';

export default function AuthFix() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error' | 'info'>('idle');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState(0);

  const ADMIN_EMAIL = 'tuncaycicek@outlook.com';
  const ADMIN_PASSWORD = 'Rz8#mK2$vL9@nX4!';

  const log = (msg: string, data?: any) => {
    console.log(`🔧 [AuthFix] ${msg}`, data || '');
  };

  const forceCreateUser = async () => {
    setLoading(true);
    setStatus('info');
    setStep(1);
    setMessage('Starting forced user creation...');

    try {
      log('Step 1: Force creating user in Supabase Auth');

      // First, let's try to sign out any existing session
      await supabase.auth.signOut();
      log('Signed out any existing session');

      // Try to register the user (this will work even if user exists)
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

      log('Sign up attempt result:', { 
        hasUser: !!signUpData?.user, 
        error: signUpError?.message 
      });

      setStep(2);
      setMessage('Testing sign in...');
      
      // Now try to sign in
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      if (signInError) {
        log('Sign in failed:', signInError);
        throw new Error(`Sign in failed: ${signInError.message}`);
      }

      if (!signInData.user) {
        throw new Error('No user returned from sign in');
      }

      log('Sign in successful:', signInData.user.id);

      setStep(3);
      setMessage('Creating/updating admin record...');

      // Create or update admin record
      const { data: existingAdmin, error: checkError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', signInData.user.id)
        .single();

      if (checkError && checkError.code === 'PGRST116') {
        // Admin record doesn't exist, create it
        log('Creating new admin record');
        const { error: insertError } = await supabase
          .from('admin_users')
          .insert({
            user_id: signInData.user.id,
            is_super_admin: true,
            permissions: { full_access: true }
          });

        if (insertError) {
          log('Failed to create admin record:', insertError);
          throw insertError;
        }

        log('Admin record created successfully');
      } else if (existingAdmin) {
        log('Admin record already exists:', existingAdmin);
        
        // Update to ensure super admin status
        const { error: updateError } = await supabase
          .from('admin_users')
          .update({
            is_super_admin: true,
            permissions: { full_access: true }
          })
          .eq('user_id', signInData.user.id);

        if (updateError) {
          log('Failed to update admin record:', updateError);
        } else {
          log('Admin record updated successfully');
        }
      }

      setStep(4);
      setMessage('Final verification...');

      // Final verification - sign out and sign in again
      await supabase.auth.signOut();
      log('Signed out for verification');

      const { data: verifyData, error: verifyError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      if (verifyError || !verifyData.user) {
        throw new Error(`Verification failed: ${verifyError?.message || 'No user'}`);
      }

      log('Final verification successful');

      // Check admin status
      const { data: adminCheck, error: adminError } = await supabase
        .from('admin_users')
        .select('is_super_admin, permissions')
        .eq('user_id', verifyData.user.id)
        .single();

      if (adminCheck) {
        log('Admin status verified:', adminCheck);
      }

      // Sign out after verification
      await supabase.auth.signOut();

      setStatus('success');
      setMessage(`✅ SUCCESS! 

User created and verified successfully!

👤 User ID: ${verifyData.user.id}
📧 Email: ${ADMIN_EMAIL}
🔑 Password: ${ADMIN_PASSWORD}
🛡️ Admin Status: ${adminCheck?.is_super_admin ? 'Super Admin' : 'Regular Admin'}

You can now login with these credentials!`);

    } catch (error: any) {
      log('Error in force create:', error);
      setStatus('error');
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testCredentials = async () => {
    setLoading(true);
    setStatus('info');
    setMessage('Testing login credentials...');

    try {
      log('Testing credentials');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        log('Credentials work!', data.user.id);
        
        // Check admin status
        const { data: adminData } = await supabase
          .from('admin_users')
          .select('is_super_admin')
          .eq('user_id', data.user.id)
          .single();

        await supabase.auth.signOut();

        setStatus('success');
        setMessage(`✅ Credentials work!

User ID: ${data.user.id}
Admin: ${adminData?.is_super_admin ? 'Yes' : 'No'}

You can now go to login page and use these credentials.`);
      }

    } catch (error: any) {
      log('Credentials test failed:', error);
      setStatus('error');
      setMessage(`❌ Credentials don't work: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const resetAndRetry = async () => {
    setLoading(true);
    setStatus('info');
    setMessage('Resetting authentication state...');

    try {
      // Clear any existing session
      await supabase.auth.signOut();
      
      // Clear browser storage
      localStorage.clear();
      sessionStorage.clear();
      
      setStatus('success');
      setMessage('Reset complete. Try the force create again.');
      
    } catch (error: any) {
      setStatus('error');
      setMessage(`Reset failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Authentication Fix Tool
        </CardTitle>
        <CardDescription>
          Force create and test the super admin user to fix login issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress indicator */}
        {loading && step > 0 && (
          <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-medium text-blue-800">
              Step {step}/4: {
                step === 1 ? 'Creating user in Auth' :
                step === 2 ? 'Testing sign in' :
                step === 3 ? 'Setting up admin record' :
                'Final verification'
              }
            </span>
          </div>
        )}

        {/* Status messages */}
        {status === 'success' && (
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 whitespace-pre-line font-mono text-sm">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {status === 'error' && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 whitespace-pre-line">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {status === 'info' && (
          <Alert className="border-blue-200 bg-blue-50">
            <RefreshCw className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* Action buttons */}
        <div className="space-y-3">
          <Button 
            onClick={forceCreateUser}
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white"
          >
            {loading ? 'Creating...' : '🔧 Force Create Super Admin User'}
          </Button>

          <Button 
            onClick={testCredentials}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Testing...' : '🧪 Test Credentials'}
          </Button>

          <Button 
            onClick={resetAndRetry}
            disabled={loading}
            variant="outline"
            className="w-full"
          >
            {loading ? 'Resetting...' : '🔄 Reset & Clear Cache'}
          </Button>
        </div>

        {/* Credentials display */}
        <div className="p-4 bg-gray-50 rounded-lg space-y-2">
          <p className="font-medium text-sm">Super Admin Credentials:</p>
          <p className="font-mono text-sm">📧 Email: {ADMIN_EMAIL}</p>
          <p className="font-mono text-sm">🔑 Password: {ADMIN_PASSWORD}</p>
        </div>

        <div className="text-xs text-gray-600">
          <p><strong>Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Click "Force Create Super Admin User" first</li>
            <li>Wait for success message</li>
            <li>Test credentials to verify they work</li>
            <li>Go to login page and use the credentials above</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}