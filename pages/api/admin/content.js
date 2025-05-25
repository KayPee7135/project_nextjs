import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]';
import dbConnect from '../../../lib/mongodb';
import Faq from '../../../models/Faq';
import Blog from '../../../models/Blog';
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
  const { type } = req.query; // 'faq' or 'blog'

  if (!type || !['faq', 'blog'].includes(type)) {
    return res.status(400).json({ message: 'Invalid content type' });
  }

  const Model = type === 'faq' ? Faq : Blog;

  switch (req.method) {
    case 'GET': {
      try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;
        const [items, total] = await Promise.all([
          Model.find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit)),
          Model.countDocuments()
        ]);
        return res.status(200).json({
          items,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        return res.status(500).json({ message: `Error fetching ${type}s` });
      }
    }
    case 'POST': {
      try {
        const { title, content, category, tags, status = 'draft', adminId } = req.body;
        if (!title || !content) {
          return res.status(400).json({ message: 'Title and content are required' });
        }
        const newItem = await Model.create({
          title,
          content,
          category,
          tags: tags || [],
          status,
          createdBy: adminId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        await AdminLog.create({
          adminId,
          action: `create ${type}`,
          targetId: newItem._id,
          details: { title, status },
          timestamp: new Date()
        });
        return res.status(201).json({
          message: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully`,
          id: newItem._id
        });
      } catch (error) {
        return res.status(500).json({ message: `Error creating ${type}` });
      }
    }
    case 'PUT': {
      try {
        const { id } = req.query;
        const { title, content, category, tags, status, adminId } = req.body;
        const update = {
          ...(title && { title }),
          ...(content && { content }),
          ...(category && { category }),
          ...(tags && { tags }),
          ...(status && { status }),
          updatedBy: adminId,
          updatedAt: new Date()
        };
        const result = await Model.updateOne(
          { _id: id },
          { $set: update }
        );
        if (result.matchedCount === 0) {
          return res.status(404).json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} not found` });
        }
        await AdminLog.create({
          adminId,
          action: `update ${type}`,
          targetId: id,
          details: { title, status },
          timestamp: new Date()
        });
        return res.status(200).json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully` });
      } catch (error) {
        return res.status(500).json({ message: `Error updating ${type}` });
      }
    }
    case 'DELETE': {
      try {
        const { id } = req.query;
        const { adminId } = req.body;
        const result = await Model.deleteOne({ _id: id });
        if (result.deletedCount === 0) {
          return res.status(404).json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} not found` });
        }
        await AdminLog.create({
          adminId,
          action: `delete ${type}`,
          targetId: id,
          timestamp: new Date()
        });
        return res.status(200).json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully` });
      } catch (error) {
        return res.status(500).json({ message: `Error deleting ${type}` });
      }
    }
    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 