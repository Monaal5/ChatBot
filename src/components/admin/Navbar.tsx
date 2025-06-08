'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '../ui/button';

export function AdminNavbar() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/admin/dashboard" className="font-semibold">
            Admin Panel
          </Link>
          <nav className="flex items-center space-x-6">
            <Link
              href="/admin/dashboard"
              className={`text-sm ${pathname === '/admin/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Dashboard
            </Link>
            <Link
              href="/admin/companies"
              className={`text-sm ${pathname === '/admin/companies' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Companies
            </Link>
            <Link
              href="/admin/analytics"
              className={`text-sm ${pathname === '/admin/analytics' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Analytics
            </Link>
          </nav>
        </div>
        <Button
          variant="ghost"
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-sm"
        >
          Sign Out
        </Button>
      </div>
    </header>
  );
}