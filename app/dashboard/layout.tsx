'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Layout as LayoutIcon, Database, Users, Settings, Menu, X, Folder } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, username, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  useEffect(() => {
    // setIsMobileMenuOpen(false); // Can be handled via another mechanism or simply bypassed
    const handleClose = () => {
      setTimeout(() => setIsMobileMenuOpen(false), 0);
    };
    handleClose();
  }, [pathname]);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (!mounted) return <div className="min-h-screen flex items-center justify-center"></div>;
  if (loading || !user) return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <div className="min-h-screen flex bg-gray-50 overflow-hidden relative">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-64 bg-white border-r flex flex-col z-50 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b flex justify-between items-center shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 tracking-tighter">Joex</h1>
            <p className="text-sm text-gray-500 mt-1">@{username}</p>
          </div>
          <button 
            className="md:hidden p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition" 
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link href="/dashboard" className={`flex items-center px-4 py-3 rounded-lg transition ${pathname === '/dashboard' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
            <LayoutIcon className="w-5 h-5 mr-3" />
            Pages
          </Link>
          <Link href="/dashboard/database" className={`flex items-center px-4 py-3 rounded-lg transition ${pathname === '/dashboard/database' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Database className="w-5 h-5 mr-3" />
            Database
          </Link>
          <Link href="/dashboard/files" className={`flex items-center px-4 py-3 rounded-lg transition ${pathname === '/dashboard/files' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Folder className="w-5 h-5 mr-3" />
            Files
          </Link>
          <Link href="/dashboard/users" className={`flex items-center px-4 py-3 rounded-lg transition ${pathname === '/dashboard/users' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Users className="w-5 h-5 mr-3" />
            Users
          </Link>
          <Link href="/dashboard/settings" className={`flex items-center px-4 py-3 rounded-lg transition ${pathname === '/dashboard/settings' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Settings className="w-5 h-5 mr-3" />
            Settings
          </Link>
        </nav>
        <div className="p-4 border-t">
          <button onClick={logout} className="flex items-center w-full px-4 py-3 text-gray-600 hover:bg-red-50 hover:text-red-700 rounded-lg transition">
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden w-full relative">
        {/* Top Header Bar for Desktop & Mobile */}
        <header className="bg-white border-b px-5 py-3 flex justify-between items-center shrink-0 z-30 shadow-2xs">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 -ml-1 text-gray-600 hover:bg-gray-100 rounded-lg transition md:hidden focus:outline-none"
              title="فتح القائمة"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-800 text-sm hidden sm:inline">لوحة التحكم</span>
              <span className="text-gray-300 hidden sm:inline">/</span>
              <span className="text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-2.5 py-1 rounded-md capitalize">
                {pathname === '/dashboard' ? 'الصفحات (Pages)' : 
                 pathname === '/dashboard/database' ? 'قواعد البيانات (Database)' :
                 pathname === '/dashboard/files' ? 'الملفات (Files)' :
                 pathname === '/dashboard/users' ? 'المستخدمين (Users)' :
                 pathname === '/dashboard/settings' ? 'الإعدادات (Settings)' : 'Dashboard'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={logout} 
              className="p-2 text-gray-500 hover:bg-red-50 hover:text-red-600 transition rounded-lg md:hidden"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto relative w-full">
            {children}
        </div>
      </main>
    </div>
  );
}
