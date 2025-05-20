import { useSession, signOut } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function Layout({ children }) {
  const { data: session } = useSession();
  const router = useRouter();

  const isActive = (path) => router.pathname === path;

  const renderNavLinks = () => {
    if (!session) {
      return (
        <>
          <Link href="/jobs" className={`text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium ${isActive('/jobs') ? 'bg-blue-700' : ''}`} onClick={e => { if (router.pathname === '/jobs') e.preventDefault(); }}>
            Browse Jobs
          </Link>
          <Link href="/auth/signin" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium" onClick={e => { if (router.pathname === '/auth/signin') e.preventDefault(); }}>
            Sign In
          </Link>
          <Link href="/auth/signup" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700" onClick={e => { if (router.pathname === '/auth/signup') e.preventDefault(); }}>
            Sign Up
          </Link>
        </>
      );
    }

    const { roles } = session.user;

    if (session?.user?.roles?.includes('admin') || session?.user?.roles?.includes('superadmin')) {
      return (
        <>
          {/* Admin links here, update as needed */}
        </>
      );
    }

    if (session?.user?.roles?.includes('recruiter')) {
      return (
        <>
          <Link href="/jobs/new" className={`text-white hover:text-blue-300 px-3 py-2 rounded-md text-sm font-medium ${isActive('/jobs/new') ? 'bg-blue-700' : ''}`} onClick={e => { if (router.pathname === '/jobs/new') e.preventDefault(); }}>
            Post Job
          </Link>
          <Link href="/jobs" className={`text-white hover:text-blue-300 px-3 py-2 rounded-md text-sm font-medium ${isActive('/jobs') ? 'bg-blue-700' : ''}`} onClick={e => { if (router.pathname === '/jobs') e.preventDefault(); }}>
            My Jobs
          </Link>
        </>
      );
    }

    if (session?.user?.roles?.includes('jobseeker')) {
      return (
        <>
          <Link href="/listed-jobs" className={`text-black hover:text-white px-3 py-2 rounded-md text-sm font-medium ${isActive('/listed-jobs') ? 'bg-blue-700' : ''}`} onClick={e => { if (router.pathname === '/listed-jobs') e.preventDefault(); }}>
            Browse Jobs
          </Link>
          <Link href="/saved-jobs" className={`text-black hover:text-white px-3 py-2 rounded-md text-sm font-medium ${isActive('/saved-jobs') ? 'bg-blue-700' : ''}`} onClick={e => { if (router.pathname === '/saved-jobs') e.preventDefault(); }}>
            Saved Jobs
          </Link>
        </>
      );
    }

    return null;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <nav className="bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/admin/login" className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium mr-4">
                Admin Login
              </Link>
              <Link href="/" className="flex-shrink-0">
                <span className="text-white text-xl font-bold">InternMate</span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {renderNavLinks()}
              {session && (
                <div className="relative ml-3">
                  <div className="flex items-center space-x-4">
                    <Link
                      href="/notifications"
                      className="text-black hover:text-white"
                      onClick={e => { if (router.pathname === '/notifications') e.preventDefault(); }}
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </Link>
                    <Link href="/profile" className="text-black hover:text-white">
                      <div className="flex items-center space-x-2">
                        <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {session.user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </Link>
                    {session && (
                      <button
                        onClick={() => signOut({ callbackUrl: '/' })}
                        className="text-black hover:text-white px-3 py-2 rounded-md text-sm font-medium"
                      >
                        Logout
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>

      <footer className="bg-gray-800 text-white mt-auto text-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <h3 className="text-base font-semibold mb-2">About Us</h3>
              <p className="text-black text-xs">Connecting talented professionals with amazing opportunities.</p>
            </div>
            <div>
              <h3 className="text-base font-semibold mb-2">Quick Links</h3>
              <ul className="space-y-1">
                <li><Link href="/jobs" className="text-black hover:text-white">Browse Jobs</Link></li>
                <li><Link href="/about" className="text-black hover:text-white">About Us</Link></li>
                <li><Link href="/contact" className="text-black hover:text-white">Contact</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-base font-semibold mb-2">Legal</h3>
              <ul className="space-y-1">
                <li><Link href="/privacy" className="text-black hover:text-white">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-black hover:text-white">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-gray-700 text-center text-black text-xs">
            <p>&copy; {new Date().getFullYear()} InternMate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 