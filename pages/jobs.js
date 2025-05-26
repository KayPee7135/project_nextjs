import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Layout from '../components/Layout';
import { useRouter } from 'next/router';

export default function JobsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (session?.user?.roles?.includes('recruiter')) {
      fetchRecruiterJobs();
    } else {
      fetchJobs();
    }
  }, [session]);

  const fetchRecruiterJobs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/jobs/recruiter');
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching recruiter jobs:', error);
    }
    setLoading(false);
  };

  const fetchJobs = async (params = {}) => {
    setLoading(true);
    const query = new URLSearchParams({
      search: params.search || '',
      type: params.type || 'all',
      location: params.location || ''
    }).toString();
    try {
      const res = await fetch(`/api/jobs?${query}`);
      const data = await res.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
    setLoading(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchJobs({ search, type, location });
  };

  const handleDelete = async (jobId) => {
    if (window.confirm('Are you sure you want to delete this job?')) {
      try {
        const res = await fetch(`/api/jobs/${jobId}`, {
          method: 'DELETE',
        });
        if (res.ok) {
          fetchRecruiterJobs(); // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting job:', error);
      }
    }
  };

  const handleEdit = (jobId) => {
    router.push(`/jobs/edit/${jobId}`);
  };

  if (session?.user?.roles?.includes('recruiter')) {
    return (
      <div className="max-w-5xl mx-auto py-8 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">My Posted Jobs</h1>
          <button
            onClick={() => router.push('/jobs/new')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Post New Job
          </button>
        </div>
        {loading ? (
          <div>Loading your jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">You haven&apos;t posted any jobs yet.</p>
            <button
              onClick={() => router.push('/jobs/new')}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Post Your First Job
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job._id} className="bg-white p-4 rounded shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-semibold">{job.title}</h2>
                    <div className="text-gray-600">{job.company} • {job.location}</div>
                    <div className="text-gray-500 text-sm">{job.type}</div>
                    <div className="text-gray-500 text-sm mt-2">
                      Posted: {new Date(job.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(job._id)}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded hover:bg-gray-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(job._id)}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-5xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold mb-6">Find Jobs & Internships</h1>
        <form onSubmit={handleSearch} className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
          <input
            type="text"
            placeholder="Job title, keywords, or company"
            className="px-4 py-2 border rounded"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <input
            type="text"
            placeholder="Location"
            className="px-4 py-2 border rounded"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
          <select
            className="px-4 py-2 border rounded"
            value={type}
            onChange={e => setType(e.target.value)}
          >
            <option value="all">All Types</option>
            <option value="internship">Internship</option>
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
          </select>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">Search</button>
        </form>
        {loading ? (
          <div>Loading jobs...</div>
        ) : jobs.length === 0 ? (
          <div>No jobs found.</div>
        ) : (
          <div className="space-y-4">
            {jobs.map(job => (
              <div key={job._id} className="bg-white p-4 rounded shadow flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{job.title}</h2>
                  <div className="text-gray-600">{job.company} • {job.location}</div>
                  <div className="text-gray-500 text-sm">{job.type}</div>
                </div>
                <a href={`/jobs/${job._id}`} className="mt-2 md:mt-0 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">View</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
} 