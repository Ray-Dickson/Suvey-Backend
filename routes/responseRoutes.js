const express = require('express');
const router = express.Router();
const { handleSubmitResponse, handleGetSurveyResponses, deleteResponse  } = require('../controllers/responseController');
const {authenticateToken, checkSurveyOwnership } = require('../middleware/authMiddleware');
const db = require('../config/db');

// Optional Auth Middleware
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authenticateToken(req, res, next); // Go through regular auth middleware
  }

  // If no token, proceed without user
  req.user = null;
  next();
};

// POST /api/responses/:surveyId — Accepts both anonymous and logged-in users
router.post('/:surveyId', handleSubmitResponse);

router.get('/:surveyId',authenticateToken,checkSurveyOwnership, handleGetSurveyResponses);

router.delete('/delete/:responseId', authenticateToken, async (req, res, next) => {
  try {
    const [[{ survey_id }]] = await db.query(`SELECT survey_id FROM responses WHERE id = ?`, [req.params.responseId]);
    req.params.surveyId = survey_id;
    next();
  } catch (err) {
    res.status(500).json({ message: 'Error checking ownership' });
  }
}, checkSurveyOwnership, deleteResponse);

module.exports = router;
