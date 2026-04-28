'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BarChart3, Users, FileUp, Eye, Map, Home, LogIn, LogOut, UserPlus } from 'lucide-react';
import { clearSession, getSessionUser, type AuthUser } from '@/lib/auth';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/', label: 'Dashboard', icon: Home },
  { href: '/needs-board', label: 'Needs Board', icon: Map },
  { href: '/upload-report', label: 'Upload Report', icon: FileUp },
  { href: '/volunteers', label: 'Volunteer Directory', icon: Users },
  { href: '/insights', label: 'Insights', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    function loadUser() {
      setUser(getSessionUser());
    }

    loadUser();
    window.addEventListener('volunteeriq_session_changed', loadUser);
    window.addEventListener('storage', loadUser);

    return () => {
      window.removeEventListener('volunteeriq_session_changed', loadUser);
      window.removeEventListener('storage', loadUser);
    };
  }, []);

  function handleLogout() {
    clearSession();
    router.push('/login');
  }

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="px-6 py-8 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Eye className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-sidebar-foreground">VolunteerIQ</h1>
            <p className="text-xs text-sidebar-foreground/60">Volunteer Ops</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium',
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/20'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-4 border-t border-sidebar-border">
        {user ? (
          <div className="space-y-3">
            <div className="text-xs text-sidebar-foreground/70">
              <p className="font-semibold text-sidebar-foreground truncate">{user.name}</p>
              <p className="truncate">{user.email}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium text-sidebar-foreground hover:bg-sidebar-accent/20"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Link
              href="/login"
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium',
                pathname === '/login'
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/20'
              )}
            >
              <LogIn className="w-4 h-4" />
              Login
            </Link>
            <Link
              href="/register"
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium',
                pathname === '/register'
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent/20'
              )}
            >
              <UserPlus className="w-4 h-4" />
              Register
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
