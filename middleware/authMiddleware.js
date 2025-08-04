const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // Attach user info to request
        next();
    } catch (err) {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};


const checkRole = (requiredRole) => (req, res, next) => {
    if (!req.user || req.user.role !== requiredRole) {
      return res.status(403).json({ message: 'Access denied' });
    }
    next();
  };
  
  // Check if logged-in user owns the survey
  const checkSurveyOwnership = async (req, res, next) => {
    const surveyId = req.params.id || req.params.surveyId;
  
    try {
      const [rows] = await db.query(`SELECT user_id FROM surveys WHERE id = ?`, [surveyId]);
      if (rows.length === 0) return res.status(404).json({ message: 'Survey not found' });
  
      const survey = rows[0];
      if (req.user.role !== 'admin' && survey.user_id !== req.user.id) {
        return res.status(403).json({ message: 'Not your survey' });
      }
  
      next();
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Server error' });
    }
  };

module.exports = {
  authenticateToken,
  checkRole,
  checkSurveyOwnership
};