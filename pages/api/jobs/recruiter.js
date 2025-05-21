import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/mongodb';
import Job from '../../../models/Job';

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session || !session.user.roles.includes('recruiter')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  await dbConnect();

  if (req.method === 'GET') {
    try {
      const jobs = await Job.find({ recruiterId: session.user.id })
        .sort({ createdAt: -1 }); // Most recent first
      res.status(200).json(jobs);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching jobs' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 