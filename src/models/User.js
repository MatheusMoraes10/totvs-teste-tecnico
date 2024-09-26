import mongoose from 'mongoose';

const environmentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  softwareType: { type: String, enum: ['erp', 'sgbd'], required: true },
  expirationDate: { type: Date, required: true },
  active: { type: Boolean, default: true }
});

const userSchema = new mongoose.Schema({
  uuid: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  squad: { type: String, required: true },
  active: { type: Boolean, default: true },
  activeEnvironments: { type: Number, default: 0 },
  environments: { type: [environmentSchema], default: [] },
  lastSession: { type: Date }
});

const User = mongoose.model('User', userSchema);
export default User;
