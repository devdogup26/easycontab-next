import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const pathname = request.nextUrl.pathname;

  const isAuthPage = pathname.startsWith('/login');
  const isLogoutPage = pathname.startsWith('/logout');
  const isPublicPath = isAuthPage || isLogoutPage || pathname === '/';

  // Public paths - allow access
  if (isPublicPath) {
    return NextResponse.next();
  }

  // Not authenticated - redirect to login
  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes - require SUPER_ADMIN
  if (pathname.startsWith('/admin')) {
    if (token.globalRole !== 'SUPER_ADMIN') {
      // Not super admin - redirect to dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Dashboard routes - require CONTADOR role
  if (pathname.startsWith('/dashboard')) {
    if (token.globalRole !== 'CONTADOR') {
      // If super admin trying to access dashboard, redirect to admin
      if (token.globalRole === 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      // Otherwise redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|login|logout).*)'],
};
