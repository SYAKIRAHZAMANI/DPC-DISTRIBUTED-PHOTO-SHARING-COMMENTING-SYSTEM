import Photo from '../models/Photo.js';
import User from '../models/User.js';
import Group from '../models/Group.js';
import { saveImage, deleteImage } from '../config/storage.js';
import { getFriendIds, canSeePhoto, escapeRegex } from '../utils/friends.js';
const populate = { path: 'uploader', select: 'name email' };
const populated = (q) => q.populate(populate).populate('comments.user', 'name');

// Feed: only photos uploaded by me or my friends (people sharing a group with me).
// All filters run inside MongoDB so results are correct however many photos exist.
export async function listPhotos(req, res) {
  const { search = '', uploader = '', from = '', to = '', group = '' } = req.query;
  let allowed = await getFriendIds(req.user._id);
  if (group) {
    const g = await Group.findOne({ _id: group, members: req.user._id }).select('members');
    if (!g) return res.status(404).json({ message: 'Group not found or you are not a member.' });
    allowed = g.members.map(String);
  }
  if (uploader.trim()) {
    const users = await User.find({ _id: { $in: allowed }, name: { $regex: escapeRegex(uploader.trim()), $options: 'i' } }).select('_id');
    allowed = users.map(u => String(u._id));
  }
  const filter = { uploader: { $in: allowed } };
  if (search.trim()) {
    const rx = { $regex: escapeRegex(search.trim()), $options: 'i' };
    filter.$or = [{ caption: rx }, { 'comments.text': rx }]; // search captions AND comment content
  }
  if (from || to) { filter.createdAt = {}; if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00.000Z`); if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999Z`); }
  const photos = await populated(Photo.find(filter).sort({ createdAt: -1 }).limit(100));
  res.json({ photos });
}

export async function createPhoto(req, res) {
  if (!req.file) return res.status(400).json({ message: 'Please select an image to upload.' });
  const stored = await saveImage(req.file);
  const imageUrl = stored.provider === 'local' ? `${req.protocol}://${req.get('host')}${stored.imageUrl}` : stored.imageUrl;
  const photo = await Photo.create({ uploader: req.user._id, imageUrl, storageId: stored.storageId, caption: req.body.caption || '' });
  await photo.populate(populate);
  res.status(201).json({ photo });
}

export async function getPhoto(req, res) {
  if (!(await canSeePhoto(req.user._id, req.params.id))) return res.status(404).json({ message: 'Photo not found.' });
  const photo = await populated(Photo.findById(req.params.id));
  res.json({ photo });
}

// Atomic $push: the database appends the comment in one operation, so when many
// friends comment on the same photo at the same instant, no comment is lost.
// Replies: send parentId. Replies are one level deep (like Instagram): replying to a
// reply attaches it to the same top-level thread.
export async function addComment(req, res) {
  const text = req.body.text?.trim();
  if (!text) return res.status(400).json({ message: 'Comment cannot be empty.' });
  if (text.length > 500) return res.status(400).json({ message: 'Comment must be 500 characters or fewer.' });
  if (!(await canSeePhoto(req.user._id, req.params.id))) return res.status(404).json({ message: 'Photo not found.' });
  const gone = { message: 'The comment you are replying to no longer exists.' };
  let parent = null;
  if (req.body.parentId) {
    const p = await Photo.findOne({ _id: req.params.id, 'comments._id': req.body.parentId }, { 'comments.$': 1 });
    if (!p) return res.status(404).json(gone);
    parent = p.comments[0].parent || p.comments[0]._id;
  }
  // If replying, the thread's first comment must still exist AT THE MOMENT OF WRITING.
  // Putting it in the filter means a reply can never be attached to a comment that
  // another user deleted a split second earlier.
  const filter = parent ? { _id: req.params.id, 'comments._id': parent } : { _id: req.params.id };
  const photo = await populated(Photo.findOneAndUpdate(filter, { $push: { comments: { user: req.user._id, text, parent } } }, { new: true }));
  if (!photo) return res.status(404).json(gone);
  res.status(201).json({ photo });
}

// Only the comment's author can edit it. The ownership check is part of the update
// query itself, so nobody can slip in between "check" and "write".
export async function editComment(req, res) {
  const { id, commentId } = req.params;
  const text = req.body.text?.trim();
  if (!text) return res.status(400).json({ message: 'Comment cannot be empty.' });
  if (text.length > 500) return res.status(400).json({ message: 'Comment must be 500 characters or fewer.' });
  const photo = await populated(Photo.findOneAndUpdate(
    { _id: id, comments: { $elemMatch: { _id: commentId, user: req.user._id } } },
    { $set: { 'comments.$.text': text, 'comments.$.edited': true, 'comments.$.updatedAt': new Date() } },
    { new: true }
  ));
  if (!photo) {
    const exists = await Photo.exists({ _id: id, 'comments._id': commentId });
    return res.status(exists ? 403 : 404).json({ message: exists ? 'You can only edit your own comments.' : 'Comment not found.' });
  }
  res.json({ photo });
}

// The comment's author OR the photo's owner can delete a comment.
// Deleting a top-level comment also deletes its replies.
export async function deleteComment(req, res) {
  const { id, commentId } = req.params;
  const removed = await Photo.findOneAndUpdate(
    { _id: id, 'comments._id': commentId, $or: [{ uploader: req.user._id }, { comments: { $elemMatch: { _id: commentId, user: req.user._id } } }] },
    { $pull: { comments: { _id: commentId } } }
  );
  if (!removed) {
    const exists = await Photo.exists({ _id: id, 'comments._id': commentId });
    return res.status(exists ? 403 : 404).json({ message: exists ? 'You can only delete your own comments, or comments on your own photo.' : 'Comment not found.' });
  }
  const photo = await populated(Photo.findByIdAndUpdate(id, { $pull: { comments: { parent: commentId } } }, { new: true }));
  res.json({ photo });
}

export async function deletePhoto(req, res) {
  const photo = await Photo.findById(req.params.id);
  if (!photo) return res.status(404).json({ message: 'Photo not found.' });
  if (String(photo.uploader) !== String(req.user._id)) return res.status(403).json({ message: 'You can only delete your own photos.' });
  await deleteImage(photo.storageId);
  await photo.deleteOne();
  res.json({ message: 'Photo deleted.' });
}
