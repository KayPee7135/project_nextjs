import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// Helper function to check if user is admin
async function isAdmin(req) {
  const session = await getServerSession(req, authOptions);
  if (!session) return false;
  
  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ 
    _id: new ObjectId(session.user.id),
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

  const { db } = await connectToDatabase();
  const { type, startDate, endDate } = req.query;

  if (!type || !['overview', 'users', 'jobs', 'applications'].includes(type)) {
    return res.status(400).json({ message: 'Invalid analytics type' });
  }

  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
  const end = endDate ? new Date(endDate) : new Date();

  try {
    let data = {};

    switch (type) {
      case 'overview':
        // Get total counts
        const [totalUsers, totalJobs, totalApplications] = await Promise.all([
          db.collection('users').countDocuments(),
          db.collection('jobs').countDocuments(),
          db.collection('applications').countDocuments()
        ]);

        // Get active counts
        const [activeUsers, activeJobs] = await Promise.all([
          db.collection('users').countDocuments({ isActive: true }),
          db.collection('jobs').countDocuments({ status: 'active' })
        ]);

        // Get recent activity
        const recentActivity = await db.collection('admin_logs')
          .find({ timestamp: { $gte: start, $lte: end } })
          .sort({ timestamp: -1 })
          .limit(10)
          .toArray();

        data = {
          totalUsers,
          activeUsers,
          totalJobs,
          activeJobs,
          totalApplications,
          recentActivity
        };
        break;

      case 'users':
        // Get user registrations over time
        const userRegistrations = await db.collection('users')
          .aggregate([
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
            {
              $sort: { _id: 1 }
            }
          ])
          .toArray();

        // Get user roles distribution
        const userRoles = await db.collection('users')
          .aggregate([
            {
              $unwind: '$roles'
            },
            {
              $group: {
                _id: '$roles',
                count: { $sum: 1 }
              }
            }
          ])
          .toArray();

        data = {
          userRegistrations,
          userRoles
        };
        break;

      case 'jobs':
        // Get job postings over time
        const jobPostings = await db.collection('jobs')
          .aggregate([
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
            {
              $sort: { _id: 1 }
            }
          ])
          .toArray();

        // Get job status distribution
        const jobStatus = await db.collection('jobs')
          .aggregate([
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ])
          .toArray();

        data = {
          jobPostings,
          jobStatus
        };
        break;

      case 'applications':
        // Get applications over time
        const applications = await db.collection('applications')
          .aggregate([
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
            {
              $sort: { _id: 1 }
            }
          ])
          .toArray();

        // Get application status distribution
        const applicationStatus = await db.collection('applications')
          .aggregate([
            {
              $group: {
                _id: '$status',
                count: { $sum: 1 }
              }
            }
          ])
          .toArray();

        data = {
          applications,
          applicationStatus
        };
        break;
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error('Analytics error:', error);
    return res.status(500).json({ message: 'Error fetching analytics data' });
  }
} 