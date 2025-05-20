import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { toast } from 'react-toastify';

export default function UserManagement() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (session && !session.user.roles.includes('admin') && !session.user.roles.includes('superadmin')) {
      router.push('/');
    }
  }, [session, status, router]);

  useEffect(() => {
    fetchUsers();
  }, [searchQuery, roleFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/users?search=${searchQuery}&role=${roleFilter}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId, newStatus) => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success('User status updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user status:', error);
      toast.error(error.message || 'Failed to update user status');
    } finally {
      setProcessing(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success('User role updated successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error(error.message || 'Failed to update user role');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      setProcessing(true);
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success('User deleted successfully');
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setProcessing(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold text-black">User Management</h1>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          {/* Filters */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search users..."
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-48">
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="all">All Roles</option>
                <option value="jobseeker">Job Seeker</option>
                <option value="recruiter">Recruiter</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          {/* Users Table */}
          <div className="mt-8 flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          User
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          Role
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          Status
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          Joined
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-black uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-sm text-black">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user._id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                      {user.name?.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-black">{user.name}</div>
                                  <div className="text-sm text-black">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                className="text-sm text-black border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={user.roles[0]}
                                onChange={(e) => handleRoleChange(user._id, e.target.value)}
                                disabled={processing}
                              >
                                <option value="jobseeker">Job Seeker</option>
                                <option value="recruiter">Recruiter</option>
                                {session.user.roles.includes('superadmin') && (
                                  <option value="admin">Admin</option>
                                )}
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <select
                                className="text-sm text-black border-black rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={user.isActive ? 'active' : 'inactive'}
                                onChange={(e) => handleStatusChange(user._id, e.target.value === 'active')}
                                disabled={processing}
                              >
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                              </select>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-black">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleDelete(user._id)}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50"
                                disabled={processing}
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 