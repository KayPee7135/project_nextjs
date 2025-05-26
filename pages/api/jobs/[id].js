import dbConnect from '../../../lib/mongodb';
import Job from '../../../models/Job';

export default async function handler(req, res) {
  const {
    query: { id },
    method,
  } = req;

  await dbConnect();

  switch (method) {
    case 'GET':
      try {
        const job = await Job.findById(id);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        res.status(200).json(job);
      } catch (error) {
        res.status(400).json({ message: 'Invalid job ID' });
      }
      break;
    default:
      res.setHeader('Allow', ['GET']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 