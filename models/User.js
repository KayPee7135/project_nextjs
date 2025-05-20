import mongoose from 'mongoose';

const ProfileSchema = new mongoose.Schema({
  company: { type: String, default: '' },
  title: { type: String, default: '' },
  bio: { type: String, default: '' },
  skills: { type: [String], default: [] },
  education: { type: [String], default: [] },
  experience: { type: [String], default: [] }
}, { _id: false });

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  roles: { type: [String], default: ['jobseeker'] },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null },
  profile: { type: ProfileSchema, default: () => ({}) }
});

export default mongoose.models.User || mongoose.model('User', UserSchema); 