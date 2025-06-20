import { auth } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export default auth((req: NextRequest & { auth?: any }) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Define protected routes and their allowed roles
  const protectedRoutes = [
    { path: /^\/admin/, roles: ['admin'] },
    { path: /^\/company/, roles: ['company'] },
    { path: /^\/chat/, roles: ['customer'] },
  ];

  // Check if the current route matches a protected route
  const matchedRoute = protectedRoutes.find((route) =>
    route.path.test(nextUrl.pathname)
  );

  if (matchedRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL('/auth/login', nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    const userRole = req.auth?.user?.role;
    if (!userRole || !matchedRoute.roles.includes(userRole)) {
      return NextResponse.redirect(new URL('/', nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
