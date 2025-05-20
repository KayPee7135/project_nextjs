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
  const { startDate, endDate, action, adminId, page = 1, limit = 50 } = req.query;

  try {
    // Build query
    const query = {};
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    if (action) {
      query.action = action;
    }

    if (adminId) {
      query.adminId = new ObjectId(adminId);
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Get logs with pagination
    const [logs, total] = await Promise.all([
      db.collection('admin_logs')
        .find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .toArray(),
      db.collection('admin_logs').countDocuments(query)
    ]);

    // Get admin details for each log
    const adminIds = [...new Set(logs.map(log => log.adminId))];
    const admins = await db.collection('users')
      .find(
        { _id: { $in: adminIds } },
        { name: 1, email: 1 }
      )
      .toArray();

    const adminMap = admins.reduce((acc, admin) => {
      acc[admin._id.toString()] = admin;
      return acc;
    }, {});

    // Add admin details to logs
    const logsWithAdminDetails = logs.map(log => ({
      ...log,
      admin: adminMap[log.adminId.toString()]
    }));

    return res.status(200).json({
      logs: logsWithAdminDetails,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching admin logs:', error);
    return res.status(500).json({ message: 'Error fetching admin logs' });
  }
} 