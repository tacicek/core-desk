import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Settings, ArrowRight, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthSystemManager from '@/components/AuthSystemManager';

export default function SetupPage() {
  const navigate = useNavigate();

  const goToLogin = () => {
    navigate('/auth');
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-blue-800">
              🔧 System Setup & Authentication Manager
            </CardTitle>
            <CardDescription className="text-lg">
              Comprehensive solution for all authentication issues and system setup
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <div className="space-y-2">
                  <p className="font-bold">✨ New Consolidated System!</p>
                  <p>This page now features a single, powerful authentication manager that:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                    <li>Automatically diagnoses all system issues</li>
                    <li>Provides real-time status of all components</li>
                    <li>Fixes all authentication problems in one operation</li>
                    <li>Replaces all previous auth repair tools</li>
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Main Authentication System Manager */}
        <AuthSystemManager />

        {/* Navigation */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={goToLogin}
                className="flex-1"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Go to Login Page
              </Button>
              <Button 
                variant="outline" 
                onClick={goToDashboard}
                className="flex-1"
              >
                <ArrowRight className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Help Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Quick Help
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h3 className="font-bold text-blue-700">If you're experiencing:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>"ungültige login daten" errors</li>
                  <li>"Anmeldung fehlgeschlagen" messages</li>
                  <li>Cannot access dashboard</li>
                  <li>Authentication system issues</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-green-700">This system will:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>✅ Diagnose all problems automatically</li>
                  <li>✅ Fix authentication issues completely</li>
                  <li>✅ Provide working login credentials</li>
                  <li>✅ Verify system is fully functional</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}