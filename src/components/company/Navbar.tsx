'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '../ui/button';

export function CompanyNavbar() {
  const pathname = usePathname();

  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/company/dashboard" className="font-semibold">
            Company Dashboard
          </Link>
          <nav className="flex items-center space-x-6">
            <Link
              href="/company/dashboard"
              className={`text-sm ${pathname === '/company/dashboard' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Dashboard
            </Link>
            <Link
              href="/company/knowledge-base"
              className={`text-sm ${pathname === '/company/knowledge-base' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Knowledge Base
            </Link>
            <Link
              href="/company/customization"
              className={`text-sm ${pathname === '/company/customization' ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Customization
            </Link>
            <Link
              href="/company/analytics"
              className={`text-sm ${pathname === '/company/analytics' ? 'text-primary' : 'text-muted-foreground'}`}
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