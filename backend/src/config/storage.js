import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.resolve(__dirname, '../../uploads');
fs.mkdirSync(uploadDir, { recursive: true });
cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET });
export async function saveImage(file) {
  if (process.env.STORAGE_PROVIDER === 'cloudinary') {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) throw new Error('Cloudinary credentials are missing.');
    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream({ folder: 'moments' }, (error, result) => error ? reject(error) : resolve(result));
      stream.end(file.buffer);
    });
    return { imageUrl: result.secure_url, storageId: result.public_id, provider: 'cloudinary' };
  }
  const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`;
  fs.writeFileSync(path.join(uploadDir, filename), file.buffer);
  return { imageUrl: `/uploads/${filename}`, storageId: filename, provider: 'local' };
}
export async function deleteImage(storageId) {
  if (!storageId) return;
  if (process.env.STORAGE_PROVIDER === 'cloudinary') await cloudinary.uploader.destroy(storageId);
  else { try { fs.unlinkSync(path.join(uploadDir, path.basename(storageId))); } catch {} }
}
