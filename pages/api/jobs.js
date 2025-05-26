import { getToken } from 'next-auth/jwt';
import dbConnect from '../../lib/mongodb';
import Job from '../../models/Job';
import User from '../../models/User';

export default async function handler(req, res) {
  const { method } = req;

  try {
    await dbConnect();

    switch (method) {
      case 'GET': {
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

        const jobs = await Job.find(query).sort({ createdAt: -1 });
        return res.status(200).json(jobs);
      }
      case 'POST': {
        const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
        if (!token) {
          return res.status(401).json({ message: 'Unauthorized' });
        }
        if (!token.roles || !token.roles.includes('recruiter')) {
          return res.status(403).json({ message: 'Forbidden: Only recruiters can post jobs.' });
        }

        const { title, company, address, type, description, email, category, date } = req.body;

        if (!title || !company || !address || !type || !description || !email) {
          return res.status(400).json({ message: 'Missing required fields' });
        }

        const job = await Job.create({
          title,
          company,
          address,
          type,
          description,
          email,
          category,
          date,
          status: 'active',
          recruiterId: token.id,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        return res.status(201).json({
          message: 'Job posted successfully',
          jobId: job._id
        });
      }
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ message: `Method ${method} Not Allowed` });
    }
  } catch (error) {
    console.error('Jobs API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 