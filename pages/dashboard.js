import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  if (status === 'loading') {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return null;
  }

  const isRecruiter = session.user.roles?.includes('recruiter');
  const isJobseeker = session.user.roles?.includes('jobseeker');
  const isAdmin = session.user.roles?.includes('admin') || session.user.roles?.includes('superadmin');

  const handleNavigation = (path) => {
    if (router.pathname !== path) {
      router.push(path);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
    <div className="px-4 py-6 sm:px-0">
        {isRecruiter && (
        <div className="mt-6">
            <h2 className="text-black hover:text-white-xl font-semibold mb-4">Recruiter Dashboard</h2>
            <div className="mb-6 p-4 bg-gray-100 rounded shadow text-black">
              <p><strong>Name:</strong> {session.user.name}</p>
              <p><strong>Email:</strong> {session.user.email}</p>
            </div>
        </div>
        )}

        {isJobseeker && (
        <div className="mt-6">
            <h2 className="text-black hover:text-white-xl font-semibold mb-4">Jobseeker Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900">Saved Jobs</h3>
                <p className="mt-2 text-sm text-gray-500">View and manage your saved jobs</p>
                <Link href="/saved-jobs" legacyBehavior>
                  <a className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 block text-center">
                    View Saved Jobs
                  </a>
                </Link>
                </div>
            </div>
            </div>
        </div>
        )}

        {isAdmin && (
        <div className="mt-6">
            <h2 className="text-xl font-semibold mb-4">Admin Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900">Manage Users</h3>
                <p className="mt-2 text-sm text-gray-500">View and manage user accounts</p>
                <Link href="/admin/users" legacyBehavior>
                  <a className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 block text-center">
                    Manage Users
                  </a>
                </Link>
                </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                <h3 className="text-lg font-medium text-gray-900">Manage Jobs</h3>
                <p className="mt-2 text-sm text-gray-500">Review and manage job listings</p>
                <Link href="/admin/jobs" legacyBehavior>
                  <a className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 block text-center">
                    Manage Jobs
                  </a>
                </Link>
                </div>
            </div>
            </div>
        </div>
        )}
    </div>
    </div>
  );
} 