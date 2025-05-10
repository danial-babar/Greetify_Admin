import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the token from the cookies
  const user = request.cookies.get('user')?.value;

  // Check if the request is for the dashboard
  if (request.nextUrl.pathname.startsWith('/dashboard')) {

    try {
      // Parse the user data from the cookie
      const userData = user ? JSON.parse(user) : null;

      // Check if user has admin role
      if (!userData?.isAdmin) {
        // Redirect to login if not admin
        return NextResponse.redirect(new URL('/', request.url));
      }
    } catch (error) {
      // If there's any error parsing the user data, redirect to login
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: '/dashboard/:path*',
}; 