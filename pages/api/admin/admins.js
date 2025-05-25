import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import AdminLog from '../../../models/AdminLog';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// Helper function to check if user is superadmin
async function isSuperAdmin(req) {
  const session = await getServerSession(req, authOptions);
  if (!session) return false;
  await dbConnect();
  const user = await User.findOne({
    _id: session.user.id,
    roles: 'superadmin'
  });
  return !!user;
}

export default async function handler(req, res) {
  // Check if user is superadmin
  const superAdmin = await isSuperAdmin(req);
  if (!superAdmin) {
    return res.status(403).json({ message: 'Only superadmin can manage admin accounts' });
  }

  await dbConnect();

  switch (req.method) {
    case 'GET': {
      try {
        const admins = await User.find(
          { roles: { $in: ['admin', 'superadmin'] } },
          { password: 0 }
        ).sort({ createdAt: -1 });
        return res.status(200).json(admins);
      } catch (error) {
        return res.status(500).json({ message: 'Error fetching admin accounts' });
      }
    }
    case 'POST': {
      try {
        const { email, password, name, role, adminId } = req.body;
        if (!email || !password || !name || !role) {
          return res.status(400).json({ message: 'All fields are required' });
        }
        if (!['admin', 'superadmin'].includes(role)) {
          return res.status(400).json({ message: 'Invalid role' });
        }
        // Check if email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'Email already registered' });
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create admin account
        const newAdmin = await User.create({
          email,
          password: hashedPassword,
          name,
          roles: [role],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        // Log admin action
        await AdminLog.create({
          adminId,
          action: 'create admin',
          targetUserId: newAdmin._id,
          details: { email, role },
          timestamp: new Date()
        });
        return res.status(201).json({
          message: 'Admin account created successfully',
          id: newAdmin._id
        });
      } catch (error) {
        return res.status(500).json({ message: 'Error creating admin account' });
      }
    }
    case 'PUT': {
      try {
        const { adminId, action, role, targetAdminId } = req.body;
        // Prevent modifying superadmin accounts
        const targetAdmin = await User.findOne({
          _id: targetAdminId,
          roles: 'superadmin'
        });
        if (targetAdmin) {
          return res.status(403).json({ message: 'Cannot modify superadmin accounts' });
        }
        let update = {};
        switch (action) {
          case 'activate':
            update = { isActive: true };
            break;
          case 'deactivate':
            update = { isActive: false };
            break;
          case 'changeRole':
            if (!['admin', 'superadmin'].includes(role)) {
              return res.status(400).json({ message: 'Invalid role' });
            }
            update = { roles: [role] };
            break;
          default:
            return res.status(400).json({ message: 'Invalid action' });
        }
        const result = await User.updateOne(
          { _id: targetAdminId },
          { $set: { ...update, updatedAt: new Date() } }
        );
        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'Admin account not found' });
        }
        // Log admin action
        await AdminLog.create({
          adminId,
          action: `${action} admin`,
          targetUserId: targetAdminId,
          details: { action, role },
          timestamp: new Date()
        });
        return res.status(200).json({ message: 'Admin account updated successfully' });
      } catch (error) {
        return res.status(500).json({ message: 'Error updating admin account' });
      }
    }
    case 'DELETE': {
      try {
        const { adminId, targetAdminId } = req.body;
        // Prevent deleting superadmin accounts
        const targetAdmin = await User.findOne({
          _id: targetAdminId,
          roles: 'superadmin'
        });
        if (targetAdmin) {
          return res.status(403).json({ message: 'Cannot delete superadmin accounts' });
        }
        const result = await User.deleteOne({ _id: targetAdminId });
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Admin account not found' });
        }
        // Log admin action
        await AdminLog.create({
          adminId,
          action: 'delete admin',
          targetUserId: targetAdminId,
          timestamp: new Date()
        });
        return res.status(200).json({ message: 'Admin account deleted successfully' });
      } catch (error) {
        return res.status(500).json({ message: 'Error deleting admin account' });
      }
    }
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 