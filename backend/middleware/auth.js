const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Check for JWT token in Authorization header
  const token = req.headers.authorization?.split(' ')[1];
  
  let userId = null;
  let stockName = null;

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      userId = decoded.userId;
      stockName = decoded.stockName;
    } catch (error) {
      // Token invalid, continue to check session
    }
  }

  // Fall back to session-based auth
  if (!userId && req.session && req.session.userId) {
    userId = req.session.userId;
  }

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Attach userId and stockName to request
  req.userId = userId;
  req.stockName = stockName;
  next();
};

module.exports = authMiddleware;
