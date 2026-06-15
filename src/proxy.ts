import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 🚀 These routes will instantly kick guests back to the landing page
const protectedRoutes = ['/chat', '/alumni', '/voice', '/admin'];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if the route starts with any of our protected routes
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  
  // The base '/profile' is protected (My Profile), but '/profile/[id]' is public for guests!
  const isStrictProfileRoute = pathname === '/profile';

  if (isProtectedRoute || isStrictProfileRoute) {
    // 🚀 Check for the authentication cookie. 
    // Standard MERN stacks name this 'token', 'jwt', or 'connect.sid'. 
    // We check for the most common ones to ensure it catches your backend's cookie.
    const hasAuthCookie = request.cookies.has('token') || request.cookies.has('jwt') || request.cookies.has('connect.sid');

    if (!hasAuthCookie) {
      // 🚀 Instant redirect to landing page (No UI flickering!)
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes EXCEPT API, static files, and images
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};