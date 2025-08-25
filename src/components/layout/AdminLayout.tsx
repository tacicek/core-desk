import { Outlet, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Shield, LogOut, Settings, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function AdminLayout() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success('Admin oturumu kapatıldı');
      navigate('/admin/login');
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Oturum kapatılırken hata oluştu');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Admin Header */}
      <header className="border-b border-purple-500/20 bg-slate-800/50 backdrop-blur-sm">
        <div className="flex h-16 items-center justify-between px-6">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-purple-500/20 border border-purple-500/30">
              <Shield className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Admin Panel</h1>
              <p className="text-sm text-purple-300">System Verwaltung</p>
            </div>
          </div>

          {/* Admin User Menu */}
          <div className="flex items-center space-x-4">
            <div className="hidden md:block">
              <div className="flex items-center space-x-2 text-sm text-purple-200">
                <Shield className="h-4 w-4" />
                <span>Super Administrator</span>
              </div>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full border-2 border-purple-500/30 hover:border-purple-400">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-purple-500/20 text-purple-300 font-semibold">
                      SA
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 bg-slate-800 border-purple-500/20" 
                align="end" 
                forceMount
              >
                <div className="flex items-center justify-start gap-2 p-2">
                  <div className="flex flex-col space-y-1 leading-none">
                    <p className="font-medium text-white">Super Administrator</p>
                    <p className="w-[200px] truncate text-sm text-purple-300">
                      tuncaycicek@outlook.com
                    </p>
                  </div>
                </div>
                <DropdownMenuSeparator className="bg-purple-500/20" />
                <DropdownMenuItem className="text-slate-300 hover:bg-purple-500/20 hover:text-white focus:bg-purple-500/20 focus:text-white">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-300 hover:bg-purple-500/20 hover:text-white focus:bg-purple-500/20 focus:text-white">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Ayarlar</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-purple-500/20" />
                <DropdownMenuItem 
                  className="text-red-400 hover:bg-red-500/20 hover:text-red-300 focus:bg-red-500/20 focus:text-red-300"
                  onClick={handleSignOut}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Çıkış Yap</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="min-h-[calc(100vh-4rem)]">
        <Outlet />
      </main>
    </div>
  );
}