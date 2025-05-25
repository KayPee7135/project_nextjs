import { getSession } from 'next-auth/react';
import dbConnect from '../../../lib/mongodb';
import Job from '../../../models/Job';
import User from '../../../models/User';
import Notification from '../../../models/Notification';
import Application from '../../../models/Application';
import { ObjectId } from 'mongodb';

export default async function handler(req, res) {
  const session = await getSession({ req });

  if (!session) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (!session.user.roles.includes('admin') && !session.user.roles.includes('superadmin')) {
    return res.status(403).json({ message: 'Forbidden' });
  }

  const { method } = req;
  await dbConnect();

  switch (method) {
    case 'GET': {
      try {
        const { search, status } = req.query;
        let query = {};
        if (search) {
          query.$or = [
            { title: { $regex: search, $options: 'i' } },
            { company: { $regex: search, $options: 'i' } }
          ];
        }
        if (status && status !== 'all') {
          query.status = status;
        }
        const jobs = await Job.find(query)
          .populate('recruiterId', 'name email')
          .sort({ createdAt: -1 });
        res.status(200).json(jobs);
      } catch (error) {
        console.error('Error fetching jobs:', error);
        res.status(500).json({ message: 'Error fetching jobs' });
      }
      break;
    }
    case 'POST': {
      if (!session.user.roles.includes('recruiter')) {
        return res.status(403).json({ message: 'Forbidden: Only recruiters can post jobs.' });
      }
      res.status(200).json({ message: 'Job posted (placeholder)' });
      break;
    }
    case 'PUT': {
      try {
        const { id } = req.query;
        const { status } = req.body;
        if (!status) {
          return res.status(400).json({ message: 'Status is required' });
        }
        const job = await Job.findById(id);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        job.status = status;
        await job.save();
        // If job is rejected, notify the recruiter
        if (status === 'rejected') {
          await Notification.create({
            userId: job.recruiterId,
            type: 'job_rejected',
            message: `Your job posting "${job.title}" has been rejected.`,
            read: false,
            createdAt: new Date()
          });
        }
        res.status(200).json({ message: 'Job updated successfully' });
      } catch (error) {
        console.error('Error updating job:', error);
        res.status(500).json({ message: 'Error updating job' });
      }
      break;
    }
    case 'DELETE': {
      try {
        const { id } = req.query;
        const job = await Job.findById(id);
        if (!job) {
          return res.status(404).json({ message: 'Job not found' });
        }
        // Delete associated applications
        await Application.deleteMany({ jobId: id });
        // Delete the job
        const result = await Job.deleteOne({ _id: id });
        if (result.deletedCount === 0) {
          return res.status(400).json({ message: 'Failed to delete job' });
        }
        res.status(200).json({ message: 'Job deleted successfully' });
      } catch (error) {
        console.error('Error deleting job:', error);
        res.status(500).json({ message: 'Error deleting job' });
      }
      break;
    }
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
} 