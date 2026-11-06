import { Router } from 'express';
import multer from 'multer';
import { protect } from '../middleware/auth.js';
import { listPhotos, createPhoto, getPhoto, addComment, editComment, deleteComment, deletePhoto } from '../controllers/photoController.js';
const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 8 * 1024 * 1024 }, fileFilter: (req, file, cb) => {
  if (!file.mimetype.startsWith('image/')) return cb(new Error('Only image files are allowed.'));
  cb(null, true);
} });
router.use(protect);
router.get('/', listPhotos);
router.post('/', upload.single('photo'), createPhoto);
router.get('/:id', getPhoto);
router.post('/:id/comments', addComment);
router.put('/:id/comments/:commentId', editComment);
router.delete('/:id/comments/:commentId', deleteComment);
router.delete('/:id', deletePhoto);
export default router;
