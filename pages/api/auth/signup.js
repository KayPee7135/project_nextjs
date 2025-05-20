import bcrypt from 'bcryptjs';
import { connectToDatabase } from '../../../lib/mongodb';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Prevent admin role creation through signup
    if (role === 'admin' || role === 'superadmin') {
      return res.status(403).json({ message: 'Invalid role selection' });
    }

    const { db } = await connectToDatabase();

    // Check if user already exists
    const existingUser = await db.collection('users').findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user with role array for future role expansion
    const result = await db.collection('users').insertOne({
      name,
      email,
      password: hashedPassword,
      roles: [role], // Store roles as an array
      isActive: true,
      createdAt: new Date(),
      lastLogin: null,
      profile: {
        company: role === 'recruiter' ? '' : null,
        title: role === 'recruiter' ? '' : null,
        bio: '',
        skills: [],
        education: [],
        experience: [],
      }
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      userId: result.insertedId,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 