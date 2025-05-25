import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import Job from '../../../models/Job';
import Application from '../../../models/Application';
import AdminLog from '../../../models/AdminLog';

// Helper function to check if user is admin
async function isAdmin(req) {
  const session = await getServerSession(req, authOptions);
  if (!session) return false;
  await dbConnect();
  const user = await User.findOne({
    _id: session.user.id,
    roles: { $in: ['admin', 'superadmin'] }
  });
  return !!user;
}

export default async function handler(req, res) {
  // Check if user is admin
  const admin = await isAdmin(req);
  if (!admin) {
    return res.status(403).json({ message: 'Unauthorized' });
  }

  await dbConnect();
  const { type, startDate, endDate } = req.query;

  if (!type || !['overview', 'users', 'jobs', 'applications'].includes(type)) {
    return res.status(400).json({ message: 'Invalid analytics type' });
  }

  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();

  try {
    let data = {};
    switch (type) {
      case 'overview': {
        const [totalUsers, totalJobs, totalApplications] = await Promise.all([
          User.countDocuments(),
          Job.countDocuments(),
          Application.countDocuments()
        ]);
        const [activeUsers, activeJobs] = await Promise.all([
          User.countDocuments({ isActive: true }),
          Job.countDocuments({ status: 'active' })
        ]);
        const recentActivity = await AdminLog.find({
          timestamp: { $gte: start, $lte: end }
        })
          .sort({ timestamp: -1 })
          .limit(10);
        data = {
          totalUsers,
          activeUsers,
          totalJobs,
          activeJobs,
          totalApplications,
          recentActivity
        };
        break;
      }
      case 'users': {
        // Get user registrations over time
        const userRegistrations = await User.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        // Get user roles distribution
        const userRoles = await User.aggregate([
          { $unwind: '$roles' },
          {
            $group: {
              _id: '$roles',
              count: { $sum: 1 }
            }
          }
        ]);
        data = {
          userRegistrations,
          userRoles
        };
        break;
      }
      case 'jobs': {
        // Get job postings over time
        const jobPostings = await Job.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        // Get job status distribution
        const jobStatus = await Job.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);
        data = {
          jobPostings,
          jobStatus
        };
        break;
      }
      case 'applications': {
        // Get applications over time
        const applications = await Application.aggregate([
          {
            $match: {
              createdAt: { $gte: start, $lte: end }
            }
          },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]);
        // Get application status distribution
        const applicationStatus = await Application.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);
        data = {
          applications,
          applicationStatus
        };
        break;
      }
    }
    return res.status(200).json(data);
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ message: 'Error fetching analytics data' });
  }
} 