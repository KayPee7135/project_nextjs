import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

export default function JobDetail() {
  const router = useRouter();
  const { id } = router.query;
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchJob = async () => {
      const res = await fetch(`/api/jobs/${id}`);
      if (res.ok) {
        const data = await res.json();
        setJob(data);
      }
      setLoading(false);
    };
    fetchJob();
  }, [id]);

  if (loading) return <div>Loading...</div>;
  if (!job) return <div>Job not found.</div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-4 text-black">{job.title}</h1>
      <div className="mb-2 text-black">{job.company} &middot; {job.address}</div>
      <div className="mb-2 text-black">{job.type}</div>
      <div className="mb-2 text-black">{job.description}</div>
      <div className="mb-2 text-black">Contact: {job.email}</div>
      <div className="mb-2 text-black">Category: {job.category}</div>
      <div className="mb-2 text-black">Date: {job.date}</div>
      <div className="mb-2 text-black">Slots: {job.slots}</div>
    </div>
  );
} 