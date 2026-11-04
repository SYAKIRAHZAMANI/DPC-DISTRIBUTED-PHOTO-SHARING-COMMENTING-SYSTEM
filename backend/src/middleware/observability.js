import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const logDir = path.resolve(__dirname, '../../logs');
fs.mkdirSync(logDir, { recursive: true });
const logStream = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });

// Every request is logged with WHICH user made it and how long it took.
// logs/access.log is your evidence of many users hitting the server at once.
morgan.token('user', (req) => (req.user ? `${req.user.name}(${req.user._id})` : 'anon'));
const format = ':date[iso] :method :url :status user=:user :response-time ms';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.AUTH_RATE_LIMIT || 100),
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many attempts. Please try again later.' }
});

export function applyObservability(app) {
  app.set('trust proxy', 1); // real client IPs when running behind a cloud load balancer
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } })); // security headers; still lets the React app load images
  app.use(morgan(format));
  app.use(morgan(format, { stream: logStream }));
  app.use('/api/auth/login', authLimiter);
  app.use('/api/auth/register', authLimiter);
}
