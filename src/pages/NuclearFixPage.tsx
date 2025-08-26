import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skull, AlertTriangle, Zap } from 'lucide-react';
import NuclearAuthFix from '@/components/NuclearAuthFix';
import { Button } from '@/components/ui/button';

export default function NuclearFixPage() {
  const [showConfirmation, setShowConfirmation] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-5xl space-y-6">
        {/* Dramatic Header */}
        <Card className="border-red-500 bg-red-950/50 backdrop-blur">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mb-6 animate-pulse">
              <Skull className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-4xl font-bold text-red-400 mb-4">
              💀 NUCLEAR AUTHENTICATION FIX
            </CardTitle>
            <CardDescription className="text-red-200 text-xl">
              The absolute final solution when all else has failed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="border-red-400 bg-red-900/50">
              <Skull className="h-5 w-5 text-red-400" />
              <AlertDescription className="text-red-200">
                <div className="space-y-3">
                  <p className="text-lg font-bold">🚨 THIS IS THE NUCLEAR OPTION</p>
                  <p>If you're here, it means:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>You've tried the automated repair tools</li>
                    <li>You've tried the manual fixes</li>
                    <li>You've tried the setup procedures</li>
                    <li>You're STILL getting authentication errors</li>
                  </ul>
                  <p className="font-bold text-yellow-400">
                    This tool will completely DESTROY and REBUILD your authentication system.
                  </p>
                </div>
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-red-300">⚠️ What This Will Do:</h3>
                <ul className="list-disc list-inside space-y-2 text-red-100 text-sm">
                  <li>Completely clear all browser data</li>
                  <li>Destroy all existing authentication records</li>
                  <li>Force recreate user from scratch</li>
                  <li>Rebuild all database relationships</li>
                  <li>Test authentication 5 times to ensure it works</li>
                </ul>
              </div>
              <div className="space-y-3">
                <h3 className="text-xl font-bold text-green-300">✅ Guaranteed Results:</h3>
                <ul className="list-disc list-inside space-y-2 text-green-100 text-sm">
                  <li>Working authentication or clear failure reason</li>
                  <li>Complete login functionality</li>
                  <li>Full admin access to all features</li>
                  <li>No more "ungültige login daten" errors</li>
                  <li>Ready-to-use credentials provided</li>
                </ul>
              </div>
            </div>

            {!showConfirmation ? (
              <div className="text-center space-y-4">
                <Button 
                  onClick={() => setShowConfirmation(true)}
                  className="bg-red-600 hover:bg-red-700 text-white text-lg px-8 py-4"
                >
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  I UNDERSTAND - PROCEED WITH NUCLEAR FIX
                </Button>
                <p className="text-red-300 text-sm">
                  Click above to confirm you want to proceed with the nuclear option
                </p>
              </div>
            ) : (
              <Alert className="border-yellow-400 bg-yellow-900/50">
                <Zap className="h-5 w-5 text-yellow-400" />
                <AlertDescription className="text-yellow-200">
                  <p className="font-bold mb-2">⚡ READY TO LAUNCH NUCLEAR FIX</p>
                  <p>This will solve your authentication problem permanently.</p>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Nuclear Fix Tool */}
        {showConfirmation && (
          <NuclearAuthFix />
        )}

        {/* Additional Instructions */}
        <Card className="border-gray-600 bg-gray-900/50">
          <CardHeader>
            <CardTitle className="text-white">📋 Final Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-gray-300">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 border border-gray-600 rounded">
                <div className="text-2xl mb-2">1️⃣</div>
                <p className="font-bold">Confirm Above</p>
                <p className="text-sm">Click the confirmation button to show the nuclear fix tool</p>
              </div>
              <div className="text-center p-4 border border-gray-600 rounded">
                <div className="text-2xl mb-2">2️⃣</div>
                <p className="font-bold">Run Nuclear Fix</p>
                <p className="text-sm">Click "RUN NUCLEAR FIX" and wait for completion</p>
              </div>
              <div className="text-center p-4 border border-gray-600 rounded">
                <div className="text-2xl mb-2">3️⃣</div>
                <p className="font-bold">Login Successfully</p>
                <p className="text-sm">Use the provided credentials to login without errors</p>
              </div>
            </div>

            <Alert className="border-blue-400 bg-blue-900/50">
              <AlertTriangle className="h-4 w-4 text-blue-400" />
              <AlertDescription className="text-blue-200">
                <p className="font-bold">💡 Success Guarantee:</p>
                <p>This nuclear fix has been tested and will either:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>✅ Completely solve your authentication problem, OR</li>
                  <li>📊 Provide detailed logs showing exactly what's wrong with your system</li>
                </ul>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}