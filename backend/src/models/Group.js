import mongoose from 'mongoose';
import crypto from 'crypto';

// A friend group. Users who share at least one group are "friends" and can see
// and comment on each other's photos.
const groupSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 60 },
  description: { type: String, trim: true, maxlength: 200, default: '' },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  inviteCode: { type: String, unique: true, default: () => crypto.randomBytes(4).toString('hex') }
}, { timestamps: true });

groupSchema.index({ members: 1 }); // "which groups am I in?" runs on every feed request

export default mongoose.model('Group', groupSchema);
