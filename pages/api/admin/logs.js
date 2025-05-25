import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import AdminLog from '../../../models/AdminLog';
import User from '../../../models/User';
import { ObjectId } from 'mongodb';

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
    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total] = await Promise.all([
      AdminLog.find(query)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      AdminLog.countDocuments(query)
    ]);
    // Get admin details for each log
    const adminIds = [...new Set(logs.map(log => log.adminId.toString()))];
    const admins = await User.find({ _id: { $in: adminIds } }, { name: 1, email: 1 });
    const adminMap = admins.reduce((acc, admin) => {
      acc[admin._id.toString()] = admin;
      return acc;
    }, {});
    // Add admin details to logs
    const logsWithAdminDetails = logs.map(log => ({
      ...log.toObject(),
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