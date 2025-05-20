import { getSession } from 'next-auth/react';
import { connectToDatabase } from '../../lib/mongodb';

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { method } = req;

  try {
    const { db } = await connectToDatabase();

    switch (method) {
      case 'GET':
        const { search, type, location } = req.query;
        let query = { status: 'active' };

        if (search) {
          query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ];
        }

        if (type && type !== 'all') {
          query.type = type;
        }

        if (location) {
          query.address = { $regex: location, $options: 'i' };
        }

        const jobs = await db.collection('jobs')
          .find(query)
          .sort({ createdAt: -1 })
          .toArray();

        return res.status(200).json(jobs);

      case 'POST':
        if (!session.user.roles.includes('recruiter')) {
          return res.status(403).json({ message: 'Forbidden: Only recruiters can post jobs.' });
        }

        const { title, company, address, jobType, description, email, category, date } = req.body;

        if (!title || !company || !address || !jobType || !description || !email) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        const job = {
          title,
          company,
          address,
          type: jobType,
          description,
          email,
          category,
          date,
          status: 'pending',
          recruiterId: session.user.id,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await db.collection('jobs').insertOne(job);

        return res.status(201).json({
          message: 'Job posted successfully',
          jobId: result.insertedId
        });

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Jobs API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 