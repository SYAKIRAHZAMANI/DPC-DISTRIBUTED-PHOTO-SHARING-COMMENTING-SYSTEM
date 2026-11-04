# Moments – Distributed Photo Sharing System

A full-stack starter application for the TEB3033 Distributed and Parallel Computing project.

## Technology
- Frontend: React + Vite
- Backend: Node.js + Express REST API
- Database: MongoDB (local or MongoDB Atlas)
- Authentication: JWT + bcrypt
- Image storage: local uploads by default; optional Cloudinary integration

## Requirements
- Node.js 20+ (LTS recommended)
- npm
- MongoDB local installation OR a MongoDB Atlas connection string
- VS Code

## 1. Open in VS Code
Extract the ZIP, open the `moments-photo-sharing` folder in VS Code, then open **Terminal → New Terminal**.

## 2. Configure the backend
```bash
cd backend
npm install
```
Copy `.env.example` to `.env` and edit it:
- `MONGO_URI`: your MongoDB connection string
- `JWT_SECRET`: use a long random secret
- `CLIENT_URL`: `http://localhost:5173`

For local MongoDB, use `mongodb://127.0.0.1:27017/moments_db`.

### Optional Cloudinary
By default, uploaded images are saved in `backend/uploads`, so the app can be tested without Cloudinary. To use Cloudinary, set `STORAGE_PROVIDER=cloudinary` and fill in `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET` in `.env`.

Start the backend:
```bash
npm run dev
```
Backend runs at `http://localhost:5000`.

## 3. Configure and run the frontend
Open a second VS Code terminal:
```bash
cd frontend
npm install
```
Copy `frontend/.env.example` to `frontend/.env` (the default API URL is already correct), then run:
```bash
npm run dev
```
Open `http://localhost:5173`.

## 4. Use the application
1. Create an account using Sign up.
2. Log in.
3. Upload a photo with a caption.
4. Browse the shared photo feed.
5. Add comments to photos.
6. Search by uploader or caption and filter by upload date.

The application is designed for a private friends group. This starter currently allows registered users to see the shared feed; a friend/group membership feature can be added as a further enhancement.

## API overview
| Method | Endpoint | Purpose | Auth |
|---|---|---|---|
| POST | `/api/auth/register` | Create account | No |
| POST | `/api/auth/login` | Log in | No |
| GET | `/api/auth/me` | Current user | Yes |
| GET | `/api/photos` | List/search/filter photos | Yes |
| POST | `/api/photos` | Upload photo | Yes |
| GET | `/api/photos/:id` | Get photo and comments | Yes |
| POST | `/api/photos/:id/comments` | Add comment | Yes |
| DELETE | `/api/photos/:id` | Delete own photo | Yes |

## Important project notes
- The React client is the presentation tier, Express is the application tier, MongoDB is the data tier, and local storage/Cloudinary is the photo-file storage service.
- For a cloud demonstration, deploy the frontend and backend to suitable hosting providers, use MongoDB Atlas, and configure persistent/cloud image storage. Local uploads on many free hosting services are temporary and should not be used as permanent cloud storage.
- Add your own cloud credentials only to `.env`; never commit `.env` or share secrets.
- This is a working educational starter, not a production-hardened service. Before public deployment, add rate limiting, email verification, password reset, stricter upload moderation, and a defined friends/group access-control model.
- Test concurrency with several separate user accounts and document actual results; do not claim load-test results without running tests.

## Troubleshooting
- `MongoServerSelectionError`: check that MongoDB is running or that your Atlas IP access list and URI are correct.
- `EADDRINUSE`: another process is using port 5000; stop it or change `PORT` in backend `.env`.
- Upload too large: the backend currently limits images to 8 MB.
- CORS error: ensure `CLIENT_URL` matches the frontend URL.
