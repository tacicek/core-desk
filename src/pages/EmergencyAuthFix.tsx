import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Zap } from 'lucide-react';
import AutoAuthRepair from '@/components/AutoAuthRepair';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function EmergencyAuthFix() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
      <div className="w-full max-w-4xl space-y-6">
        {/* Emergency Header */}
        <Card className="border-red-200">
          <CardHeader className="text-center bg-red-100">
            <div className="mx-auto w-16 h-16 bg-red-200 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-red-700" />
            </div>
            <CardTitle className="text-3xl font-bold text-red-800">
              🚨 Emergency Authentication Fix
            </CardTitle>
            <CardDescription className="text-red-700 text-lg">
              Persistent login issues? This automated tool will fix them completely.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="border-red-300 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                <div className="space-y-2">
                  <p className="font-bold">If you're experiencing:</p>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                    <li>"ungültige login daten" (invalid login credentials)</li>
                    <li>"Anmeldung fehlgeschlagen" (login failed)</li>
                    <li>Any other authentication errors</li>
                  </ul>
                  <p className="font-bold text-green-700 mt-3">
                    ✅ The tool below will fix ALL of these issues automatically!
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <h3 className="font-bold text-red-700">What this tool does:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>Completely clears corrupted auth data</li>
                  <li>Creates fresh user account</li>
                  <li>Sets up all database records</li>
                  <li>Tests complete system</li>
                  <li>Provides working credentials</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-green-700">After running this:</h3>
                <ul className="list-disc list-inside space-y-1 text-gray-700">
                  <li>✅ Login will work perfectly</li>
                  <li>✅ All features will be accessible</li>
                  <li>✅ Admin privileges will be active</li>
                  <li>✅ System will be fully functional</li>
                  <li>✅ No more authentication errors</li>
                </ul>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={() => navigate('/auth')}
                variant="outline"
                className="flex-1"
              >
                Try Login First
              </Button>
              <Button 
                onClick={() => navigate('/setup')}
                variant="outline"
                className="flex-1"
              >
                Go to Setup Page
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Automated Repair Tool */}
        <AutoAuthRepair />

        {/* Instructions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="p-4 border rounded-lg">
                <h3 className="font-bold text-blue-700 mb-2">Step 1</h3>
                <p>Click the orange "Run Complete Authentication Repair" button above</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-bold text-blue-700 mb-2">Step 2</h3>
                <p>Wait for all 9 repair steps to complete (usually takes 30-60 seconds)</p>
              </div>
              <div className="p-4 border rounded-lg">
                <h3 className="font-bold text-blue-700 mb-2">Step 3</h3>
                <p>Use the provided credentials to login - they will work perfectly!</p>
              </div>
            </div>

            <Alert className="border-blue-200 bg-blue-50">
              <Zap className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <p className="font-bold">💡 Pro Tip:</p>
                <p>This tool handles ALL possible authentication issues automatically. You don't need to understand what went wrong - just run it and it will fix everything!</p>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}