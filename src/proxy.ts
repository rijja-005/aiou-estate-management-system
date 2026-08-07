import { NextResponse, type NextRequest } from 'next/server';

export function proxy(request: NextRequest): NextResponse {
  const protectedRoots = ['/dashboard','/master-data','/properties','/bookings','/allocations','/shop-billing','/flats','/reports'];
  const isProtectedRoute = protectedRoots.some((root) => request.nextUrl.pathname === root || request.nextUrl.pathname.startsWith(`${root}/`));
  const hasSession = Boolean(request.cookies.get('ems_access_token'));

  if (isProtectedRoute && !hasSession) {
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*','/master-data/:path*','/properties/:path*','/bookings/:path*','/allocations/:path*','/shop-billing/:path*','/flats/:path*','/reports/:path*'],
};
