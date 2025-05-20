import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import { connectToDatabase } from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';

// Helper function to check if user is superadmin
async function isSuperAdmin(req) {
  const session = await getServerSession(req, authOptions);
  if (!session) return false;
  
  const { db } = await connectToDatabase();
  const user = await db.collection('users').findOne({ 
    _id: new ObjectId(session.user.id),
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

  const { db } = await connectToDatabase();

  switch (req.method) {
    case 'GET':
      try {
        const admins = await db.collection('users')
          .find(
            { roles: { $in: ['admin', 'superadmin'] } },
            { password: 0 } // Exclude password
          )
          .sort({ createdAt: -1 })
          .toArray();
        
        return res.status(200).json(admins);
      } catch (error) {
        return res.status(500).json({ message: 'Error fetching admin accounts' });
      }

    case 'POST':
      try {
        const { email, password, name, role } = req.body;

        if (!email || !password || !name || !role) {
          return res.status(400).json({ message: 'All fields are required' });
        }

        if (!['admin', 'superadmin'].includes(role)) {
          return res.status(400).json({ message: 'Invalid role' });
        }

        // Check if email already exists
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser) {
          return res.status(400).json({ message: 'Email already registered' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin account
        const newAdmin = {
          email,
          password: hashedPassword,
          name,
          roles: [role],
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await db.collection('users').insertOne(newAdmin);

        // Log admin action
        await db.collection('admin_logs').insertOne({
          adminId: new ObjectId(req.body.adminId),
          action: 'create admin',
          targetUserId: result.insertedId,
          details: { email, role },
          timestamp: new Date()
        });

        return res.status(201).json({
          message: 'Admin account created successfully',
          id: result.insertedId
        });
      } catch (error) {
        return res.status(500).json({ message: 'Error creating admin account' });
      }

    case 'PUT':
      try {
        const { adminId, action, role } = req.body;

        // Prevent modifying superadmin accounts
        const targetAdmin = await db.collection('users').findOne({
          _id: new ObjectId(adminId),
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

        const result = await db.collection('users').updateOne(
          { _id: new ObjectId(adminId) },
          { $set: { ...update, updatedAt: new Date() } }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: 'Admin account not found' });
        }

        // Log admin action
        await db.collection('admin_logs').insertOne({
          adminId: new ObjectId(req.body.adminId),
          action: `${action} admin`,
          targetUserId: new ObjectId(adminId),
          details: { action, role },
          timestamp: new Date()
        });

        return res.status(200).json({ message: 'Admin account updated successfully' });
      } catch (error) {
        return res.status(500).json({ message: 'Error updating admin account' });
      }

    case 'DELETE':
      try {
        const { adminId } = req.body;

        // Prevent deleting superadmin accounts
        const targetAdmin = await db.collection('users').findOne({
          _id: new ObjectId(adminId),
          roles: 'superadmin'
        });

        if (targetAdmin) {
          return res.status(403).json({ message: 'Cannot delete superadmin accounts' });
        }

        const result = await db.collection('users').deleteOne({
          _id: new ObjectId(adminId)
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: 'Admin account not found' });
        }

        // Log admin action
        await db.collection('admin_logs').insertOne({
          adminId: new ObjectId(req.body.adminId),
          action: 'delete admin',
          targetUserId: new ObjectId(adminId),
          timestamp: new Date()
        });

        return res.status(200).json({ message: 'Admin account deleted successfully' });
      } catch (error) {
        return res.status(500).json({ message: 'Error deleting admin account' });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 