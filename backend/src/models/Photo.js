import mongoose from 'mongoose';
const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 500 }
}, { timestamps: true });
const photoSchema = new mongoose.Schema({
  uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  imageUrl: { type: String, required: true },
  storageId: { type: String, default: '' },
  caption: { type: String, trim: true, maxlength: 300, default: '' },
  comments: [commentSchema]
}, { timestamps: true });
photoSchema.index({ createdAt: -1 });
photoSchema.index({ caption: 'text' });
export default mongoose.model('Photo', photoSchema);
