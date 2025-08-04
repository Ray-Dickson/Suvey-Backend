const express = require('express');
const router = express.Router();
const { getSurveyAnalytics } = require('../controllers/analyticsController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Protected route (only survey creator or admin should access ideally)
router.get('/surveys/:surveyId', authenticateToken, getSurveyAnalytics);

module.exports = router;
