import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';

export default function ListedJobs() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signup?role=jobseeker');
      return;
    }
    fetchJobs();
  }, [status, router]);

  const fetchJobs = async (params = {}) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        search: params.search || '',
        type: params.type || 'all',
        location: params.location || ''
      }).toString();
      const res = await fetch(`/api/jobs?${query}`);
      if (!res.ok) throw new Error('Failed to fetch jobs');
      const data = await res.json();
      setJobs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (!session) {
      router.push('/auth/signup?role=jobseeker');
      return;
    }
    fetchJobs({ search, type, location });
  };

  if (status === 'loading') {
    return (
      <Layout>
        <div className="max-w-5xl mx-auto py-8 px-4">
          <div className="text-black">Loading...</div>
        </div>
      </Layout>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6 text-black">Find Jobs & Internships</h1>
      <form onSubmit={handleSearch} className="mb-8 grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Job title, keywords, or company"
          className="px-4 py-2 border rounded text-black"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <input
          type="text"
          placeholder="Location"
          className="px-4 py-2 border rounded text-black"
          value={location}
          onChange={e => setLocation(e.target.value)}
        />
        <select
          className="px-4 py-2 border rounded text-black"
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
        <div className="text-black">Loading jobs...</div>
      ) : jobs.length === 0 ? (
        <div className="text-black">No jobs found.</div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job._id} className="bg-white p-4 rounded shadow flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-black">{job.title}</h2>
                <div className="text-black">{job.company} &middot; {job.address}</div>
                <div className="text-black text-sm">{job.type}</div>
              </div>
              <a href={`/jobs/${job._id}`} className="mt-2 md:mt-0 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">View</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 