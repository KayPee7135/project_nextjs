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
  const { type } = req.query; // 'faq' or 'blog'

  if (!type || !['faq', 'blog'].includes(type)) {
    return res.status(400).json({ message: 'Invalid content type' });
  }

  const collection = type === 'faq' ? 'faqs' : 'blogs';

  switch (req.method) {
    case 'GET':
      try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
          db.collection(collection)
            .find({})
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .toArray(),
          db.collection(collection).countDocuments()
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

    case 'POST':
      try {
        const { title, content, category, tags, status = 'draft' } = req.body;
        
        if (!title || !content) {
          return res.status(400).json({ message: 'Title and content are required' });
        }

        const newItem = {
          title,
          content,
          category,
          tags: tags || [],
          status,
          createdBy: new ObjectId(req.body.adminId),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const result = await db.collection(collection).insertOne(newItem);

        // Log admin action
        await db.collection('admin_logs').insertOne({
          adminId: new ObjectId(req.body.adminId),
          action: `create ${type}`,
          targetId: result.insertedId,
          details: { title, status },
          timestamp: new Date()
        });

        return res.status(201).json({
          message: `${type.charAt(0).toUpperCase() + type.slice(1)} created successfully`,
          id: result.insertedId
        });
      } catch (error) {
        return res.status(500).json({ message: `Error creating ${type}` });
      }

    case 'PUT':
      try {
        const { id } = req.query;
        const { title, content, category, tags, status } = req.body;

        const update = {
          ...(title && { title }),
          ...(content && { content }),
          ...(category && { category }),
          ...(tags && { tags }),
          ...(status && { status }),
          updatedBy: new ObjectId(req.body.adminId),
          updatedAt: new Date()
        };

        const result = await db.collection(collection).updateOne(
          { _id: new ObjectId(id) },
          { $set: update }
        );

        if (result.matchedCount === 0) {
          return res.status(404).json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} not found` });
        }

        // Log admin action
        await db.collection('admin_logs').insertOne({
          adminId: new ObjectId(req.body.adminId),
          action: `update ${type}`,
          targetId: new ObjectId(id),
          details: { title, status },
          timestamp: new Date()
        });

        return res.status(200).json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} updated successfully` });
      } catch (error) {
        return res.status(500).json({ message: `Error updating ${type}` });
      }

    case 'DELETE':
      try {
        const { id } = req.query;

        const result = await db.collection(collection).deleteOne({
          _id: new ObjectId(id)
        });

        if (result.deletedCount === 0) {
          return res.status(404).json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} not found` });
        }

        // Log admin action
        await db.collection('admin_logs').insertOne({
          adminId: new ObjectId(req.body.adminId),
          action: `delete ${type}`,
          targetId: new ObjectId(id),
          timestamp: new Date()
        });

        return res.status(200).json({ message: `${type.charAt(0).toUpperCase() + type.slice(1)} deleted successfully` });
      } catch (error) {
        return res.status(500).json({ message: `Error deleting ${type}` });
      }

    default:
      res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
} 