import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SESSION_COOKIE_NAME = 'pos_session';
const SECRET_KEY = process.env.JWT_SECRET || 'pos-ruko-default-secret-key-change-in-production';
const key = new TextEncoder().encode(SECRET_KEY);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow static files, api auth endpoints, and next internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth/login') ||
    pathname.startsWith('/icons') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  let user = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, key, { algorithms: ['HS256'] });
      user = payload as { id: string; role: string; email: string; name: string };
    } catch {
      user = null;
    }
  }

  const isLoginPage = pathname === '/login';

  // If not logged in and not on login page
  if (!user && !isLoginPage) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If already logged in and on login page
  if (user && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Owner only routes
  const ownerRoutes = ['/settings', '/reports'];
  if (user && user.role !== 'OWNER') {
    const isOwnerRoute = ownerRoutes.some((route) => pathname.startsWith(route));
    if (isOwnerRoute) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

