# Cloud Deployment (Cloud & Data Lead) notes

## Live deployment
- Frontend: https://main.dwsf1fsep5mac.amplifyapp.com (AWS Amplify Hosting)
- Backend API: https://3-135-88-103.sslip.io/api (AWS EC2 + Nginx + Let's Encrypt)

## Infrastructure
- **Compute**: AWS EC2, region us-east-2 (Ohio), t2/t3.micro, instance name `moments-backend`
- **Reverse proxy / TLS**: Nginx (`/etc/nginx/conf.d/moments.conf`) proxies to the Express app on `localhost:5000`. HTTPS certificate issued by Let's Encrypt via certbot for the sslip.io hostname `3-135-88-103.sslip.io`, which maps DNS straight to the instance's public IP — no registered domain needed.
- **Process manager**: pm2 (`pm2 start/restart moments-backend`)
- **Frontend hosting**: AWS Amplify Hosting, connected to this repo's `main` branch; builds and serves the Vite build over HTTPS + CDN. Redeploys automatically on push to `main`, or manually via "Redeploy this version" in the Amplify console.
- **Database**: MongoDB Atlas (managed, free M0 tier)
- **Image storage**: Cloudinary (`STORAGE_PROVIDER=cloudinary`)

## Security
- EC2 security group: inbound 80/443 open to the internet (required for the web app); inbound 22 (SSH) restricted to a single IP, opened only transiently via AWS EC2 Instance Connect for maintenance.
- Passwords hashed with bcrypt; JWT-based auth. Secrets live only in `backend/.env` on the server — never committed (see `backend/.env.example` for the required keys, no values).

## Redeploying after a backend code change
```bash
# on the EC2 instance
cd DPC-DISTRIBUTED-PHOTO-SHARING-COMMENTING-SYSTEM
git pull
cd backend && npm install
pm2 restart moments-backend --update-env
```

## Required backend `.env` keys on the server
`PORT`, `MONGO_URI` (Atlas connection string), `JWT_SECRET`, `CLIENT_URL` (Amplify URL),
`STORAGE_PROVIDER=cloudinary`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`,
`AUTH_RATE_LIMIT` (used by the backend-member2 rate limiter)

## Cost
AWS Free Plan credits cover all usage to date — USD 0.00 actual charges, confirmed via the AWS Billing console (November 2026 billing period). See the report's Cost Considerations section for the full breakdown.
