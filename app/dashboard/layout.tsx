'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Layout as LayoutIcon, Database, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, username, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading || !user) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col hidden md:flex">
        <div className="p-6 border-b">
          <h1 className="text-2xl font-bold text-gray-800 tracking-tighter">Joex</h1>
          <p className="text-sm text-gray-500 mt-1">@{username}</p>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <Link href="/dashboard" className={`flex items-center px-4 py-3 rounded-lg transition ${pathname === '/dashboard' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
            <LayoutIcon className="w-5 h-5 mr-3" />
            Pages
          </Link>
          <Link href="/dashboard/database" className={`flex items-center px-4 py-3 rounded-lg transition ${pathname === '/dashboard/database' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Database className="w-5 h-5 mr-3" />
            Database
          </Link>
          <Link href="/dashboard/users" className={`flex items-center px-4 py-3 rounded-lg transition ${pathname === '/dashboard/users' ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}>
            <Users className="w-5 h-5 mr-3" />
            Users
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
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b p-4 flex justify-between items-center md:hidden">
            <h1 className="text-xl font-bold text-gray-800">Joex</h1>
            <button onClick={logout} className="text-gray-500"><LogOut className="w-5 h-5" /></button>
        </header>

        <div className="flex-1 overflow-y-auto">
            {children}
        </div>
      </main>
    </div>
  );
}
