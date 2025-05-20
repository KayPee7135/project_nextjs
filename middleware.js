import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;
  const { pathname } = req.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/auth/signin', '/auth/signup', '/'];
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return NextResponse.redirect(new URL('/auth/signin', req.url));
  }

  // Role-based access control
  const role = token.role;

  // Jobseeker routes
  if (pathname.startsWith('/jobs') || pathname.startsWith('/applications') || pathname.startsWith('/profile')) {
    if (role !== 'jobseeker') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  // Recruiter routes
  if (pathname.startsWith('/post-job') || pathname.startsWith('/my-jobs') || pathname.startsWith('/applicants')) {
    if (role !== 'recruiter') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/jobs/:path*',
    '/applications/:path*',
    '/profile/:path*',
    '/post-job/:path*',
    '/my-jobs/:path*',
    '/applicants/:path*',
    '/dashboard/:path*',
  ],
}; 