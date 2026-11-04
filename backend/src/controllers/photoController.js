import Photo from '../models/Photo.js';
import { saveImage, deleteImage } from '../config/storage.js';
const populate = { path: 'uploader', select: 'name email' };
export async function listPhotos(req, res) {
  const { search = '', uploader = '', from = '', to = '' } = req.query;
  const filter = {};
  if (search.trim()) filter.caption = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' };
  if (from || to) { filter.createdAt = {}; if (from) filter.createdAt.$gte = new Date(`${from}T00:00:00.000Z`); if (to) filter.createdAt.$lte = new Date(`${to}T23:59:59.999Z`); }
  let query = Photo.find(filter).populate(populate).populate('comments.user', 'name').sort({ createdAt: -1 });
  const photos = await query.limit(100);
  const filtered = uploader.trim() ? photos.filter(p => p.uploader?.name?.toLowerCase().includes(uploader.trim().toLowerCase())) : photos;
  res.json({ photos: filtered });
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
  const photo = await Photo.findById(req.params.id).populate(populate).populate('comments.user', 'name');
  if (!photo) return res.status(404).json({ message: 'Photo not found.' });
  res.json({ photo });
}
export async function addComment(req, res) {
  const text = req.body.text?.trim();
  if (!text) return res.status(400).json({ message: 'Comment cannot be empty.' });
  const photo = await Photo.findById(req.params.id);
  if (!photo) return res.status(404).json({ message: 'Photo not found.' });
  photo.comments.push({ user: req.user._id, text });
  await photo.save();
  await photo.populate(populate);
  await photo.populate('comments.user', 'name');
  res.status(201).json({ photo });
}
export async function deletePhoto(req, res) {
  const photo = await Photo.findById(req.params.id);
  if (!photo) return res.status(404).json({ message: 'Photo not found.' });
  if (String(photo.uploader) !== String(req.user._id)) return res.status(403).json({ message: 'You can only delete your own photos.' });
  await deleteImage(photo.storageId);
  await photo.deleteOne();
  res.json({ message: 'Photo deleted.' });
}
