import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: Record<string, unknown>) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  
  console.log('AuthProvider rendered');
  console.log('AuthProvider state:', { user, session, loading });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Set user's preferred language if available
      if (session?.user?.user_metadata?.preferred_language) {
        import('@/i18n').then((i18nModule) => {
          i18nModule.default.changeLanguage(session.user.user_metadata.preferred_language);
        });
      }
      
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state change - Session:', session);
      console.log('Auth state change - User:', session?.user);
      setSession(session);
      setUser(session?.user ?? null);
      
      // Set user's preferred language if available
      if (session?.user?.user_metadata?.preferred_language) {
        import('@/i18n').then((i18nModule) => {
          i18nModule.default.changeLanguage(session.user.user_metadata.preferred_language);
        });
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('🔐 Starting sign in process...');
      console.log('📧 Email:', email);
      console.log('🔗 Supabase URL:', import.meta.env.VITE_SUPABASE_URL || 'Not set');
      console.log('🔑 Supabase client initialized:', typeof supabase);
      
      // Validate inputs
      if (!email || !password) {
        console.error('❌ Missing email or password');
        return { 
          error: { 
            message: 'Email und Passwort sind erforderlich' 
          } 
        };
      }
      
      if (!email.includes('@')) {
        console.error('❌ Invalid email format');
        return { 
          error: { 
            message: 'Ungültiges E-Mail-Format' 
          } 
        };
      }
      
      console.log('✅ Input validation passed');
      console.log('🔄 Attempting Supabase auth sign in...');
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      
      console.log('📊 Sign in response received');
      console.log('👤 User data:', data?.user ? 'User object present' : 'No user data');
      console.log('❌ Error:', error ? error.message : 'No error');
      
      if (error) {
        console.error('🚨 Supabase auth error:', error);
        
        // Provide user-friendly error messages
        let userMessage = error.message;
        
        if (error.message.includes('Invalid login credentials')) {
          userMessage = 'Ungültige Anmeldedaten. Bitte überprüfen Sie Ihre E-Mail und Ihr Passwort.';
        } else if (error.message.includes('Email not confirmed')) {
          userMessage = 'Bitte bestätigen Sie Ihre E-Mail-Adresse.';
        } else if (error.message.includes('Too many requests')) {
          userMessage = 'Zu viele Anmeldeversuche. Bitte warten Sie einen Moment.';
        } else if (error.message.includes('network')) {
          userMessage = 'Netzwerkfehler. Bitte überprüfen Sie Ihre Internetverbindung.';
        }
        
        return { 
          error: { 
            message: userMessage,
            original: error.message
          } 
        };
      }
      
      if (data?.user) {
        console.log('✅ Sign in successful!');
        console.log('🆔 User ID:', data.user.id);
        console.log('📧 User email:', data.user.email);
        console.log('⏰ Created at:', data.user.created_at);
        
        // Check if this user is an admin
        try {
          const { data: adminData, error: adminError } = await supabase
            .from('admin_users')
            .select('is_super_admin, permissions')
            .eq('user_id', data.user.id)
            .single();
            
          if (adminData) {
            console.log('👑 Admin status:', adminData.is_super_admin ? 'Super Admin' : 'Admin');
            console.log('🔐 Permissions:', adminData.permissions);
          } else {
            console.log('👤 Regular user (not admin)');
          }
        } catch (adminCheckError) {
          console.log('ℹ️ Could not check admin status:', adminCheckError);
        }
        
        return { error: null };
      }
      
      console.error('❌ No user data returned despite no error');
      return { 
        error: { 
          message: 'Anmeldung fehlgeschlagen. Kein Benutzerdatenrückgabe.' 
        } 
      };
      
    } catch (error) {
      console.error('🚨 Unexpected sign in error:', error);
      return { 
        error: { 
          message: 'Verbindungsfehler. Bitte versuchen Sie es später erneut.' 
        } 
      };
    }
  };

  const signUp = async (email: string, password: string, metadata?: Record<string, unknown>) => {
    try {
      console.log('Attempting sign up with supabase client:', typeof supabase);
      console.log('Supabase auth object:', supabase.auth);
      const redirectUrl = `${window.location.origin}/`;
      console.log('Redirect URL:', redirectUrl);
      console.log('User metadata:', metadata);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: metadata || {}
        }
      });
      console.log('Sign up result:', { error });
      return { error };
    } catch (error) {
      console.error('Sign up error:', error);
      return { 
        error: { 
          message: 'Bağlantı hatası. Lütfen tekrar deneyin.' 
        } 
      };
    }
  };

  const signOut = async () => {
    try {
      console.log('Attempting sign out...');
      
      // Clear local state first
      setUser(null);
      setSession(null);
      
      // Then attempt to sign out from Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.log('Sign out error (but continuing):', error);
      } else {
        console.log('Sign out successful');
      }
      
      // Clear any local storage items related to auth
      localStorage.removeItem('sb-wnedqmxejgynelhtbpmw-auth-token');
      
    } catch (error) {
      console.error('Sign out error:', error);
      // Even if there's an error, clear local state
      setUser(null);
      setSession(null);
    }
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}