import { auth } from "@/app/api/auth/[...nextauth]/route";
import { NextResponse } from 'next/server';

export default auth((req:any)=> {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Define protected routes and their allowed roles
  const protectedRoutes = [
    { path: /^\/admin/, roles: ['admin'] },
    { path: /^\/company/, roles: ['company'] },
    { path: /^\/chat/, roles: ['customer'] },
  ];

  // Check if the current route is protected
  const matchedRoute = protectedRoutes.find((route) =>
    route.path.test(nextUrl.pathname)
  );

  if (matchedRoute) {
    if (!isLoggedIn) {
      // Redirect to login if not authenticated
      const loginUrl = new URL('/login', nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check if user has the required role
    const userRole = req.auth?.user?.role;
    if (!matchedRoute.roles.includes(userRole)) {
      // Redirect to home if role doesn't match
      return NextResponse.redirect(new URL('/', nextUrl.origin));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};