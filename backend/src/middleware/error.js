export function notFound(req, res) { res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` }); }
export function errorHandler(err, req, res, next) {
  console.error(err);
  if (err.code === 11000) return res.status(409).json({ message: 'An account with this email already exists.' });
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid resource ID.' });
  res.status(err.status || 500).json({ message: err.message || 'Server error.' });
}
