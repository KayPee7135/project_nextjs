import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function PostJob() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [accessDenied, setAccessDenied] = useState(false);
  const [form, setForm] = useState({
    title: '',
    company: '',
    address: '',
    type: '',
    description: '',
    email: '',
    file: null,
    category: '',
    date: '',
    slots: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Debug logging
  console.log('Session:', session);
  console.log('Status:', status);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session || !session.user.roles?.includes('recruiter')) {
      setAccessDenied(true);
    }
  }, [session, status]);

  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (accessDenied) {
    return <div className="max-w-xl mx-auto py-16 px-4 text-center text-red-600 font-bold">Access Denied: Only recruiters can post jobs.</div>;
  }

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Job posted successfully!');
        setForm({ title: '', company: '', address: '', type: '', description: '', email: '', file: null, category: '', date: '', slots: '' });
        router.push('/jobs'); // Redirect to jobs list after successful posting
      } else {
        setMessage(data.message || 'Failed to post job.');
      }
    } catch (err) {
      setMessage('Failed to post job.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-200 to-purple-200 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-center mb-8 text-black drop-shadow">Post a New Job</h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input
            name="title"
            type="text"
            value={form.title}
            onChange={handleChange}
            placeholder="Job Title"
            className="w-full p-3 border border-black rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-black"
            required
          />
          <input
            name="company"
            type="text"
            value={form.company}
            onChange={handleChange}
            placeholder="Company Name"
            className="w-full p-3 border border-black rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-black"
            required
          />
          <input
            name="address"
            type="text"
            value={form.address}
            onChange={handleChange}
            placeholder="Company Address"
            className="w-full p-3 border border-black rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-black"
          />
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="w-full p-3 border border-black rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-black"
            required
          >
            <option value="">Select Job Type</option>
            <option value="Full Time">Full Time</option>
            <option value="Part Time">Part Time</option>
            <option value="Internship">Internship</option>
            <option value="Contract">Contract</option>
          </select>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Brief Description about the Job"
            className="w-full p-3 border border-black rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-black"
            rows={4}
            required
          />
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Contact Information (Email)"
            className="w-full p-3 border border-black rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-black"
            required
          />
          <input
            name="file"
            type="file"
            onChange={handleChange}
            className="w-full p-3 border border-black rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-black"
          />
          <input
            name="category"
            type="text"
            value={form.category}
            onChange={handleChange}
            placeholder="Category (e.g., IT, 3rd Year)"
            className="w-full p-3 border border-black rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-black"
          />
          <input
            name="date"
            type="date"
            value={form.date}
            onChange={handleChange}
            className="w-full p-3 border border-black rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-black"
            required
          />
          <input
            name="slots"
            type="number"
            value={form.slots}
            onChange={handleChange}
            placeholder="Slots Available"
            className="w-full p-3 border border-black rounded focus:outline-none focus:ring-2 focus:ring-purple-400 text-black"
            min={1}
            required
          />
          <button
            type="submit"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded shadow mt-4 transition-colors"
          >
            {loading ? 'Posting...' : 'Post Job'}
          </button>
          {message && <div className="text-center text-sm mt-2 text-black">{message}</div>}
        </form>
      </div>
    </div>
  );
} 