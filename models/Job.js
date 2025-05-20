import mongoose from 'mongoose';

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  address: { type: String, required: true },
  type: { type: String, required: true },
  description: { type: String, required: true },
  email: { type: String, required: true },
  category: { type: String },
  date: { type: String },
  status: { type: String, default: 'pending' },
  recruiterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  slots: { type: String }
});

export default mongoose.models.Job || mongoose.model('Job', JobSchema); 