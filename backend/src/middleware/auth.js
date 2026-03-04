const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Middleware untuk verifikasi JWT token
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header required' });
  }
  
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ error: 'Invalid authorization format. Use: Bearer <token>' });
  }
  
  const token = parts[1];
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Generate JWT token
function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

// Optional auth - tidak throw error jika tidak ada token
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  
  if (!authHeader) {
    req.user = null;
    return next();
  }
  
  const parts = authHeader.split(' ');
  
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    req.user = null;
    return next();
  }
  
  try {
    const decoded = jwt.verify(parts[1], JWT_SECRET);
    req.user = decoded;
  } catch (err) {
    req.user = null;
  }
  
  next();
}

// API Key auth middleware
function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  const validKey = process.env.API_KEY;
  
  if (!validKey) {
    // Jika API_KEY tidak diset, skip auth
    return next();
  }
  
  if (apiKey !== validKey) {
    return res.status(401).json({ error: 'Invalid API key' });
  }
  
  next();
}

module.exports = {
  authMiddleware,
  generateToken,
  optionalAuth,
  apiKeyAuth
};
