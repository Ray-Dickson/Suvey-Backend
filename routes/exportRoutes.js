const express = require('express');
const router = express.Router();
const { exportSurveyData } = require('../controllers/exportController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Export survey data (CSV or Excel)
router.get('/survey/:surveyId', authenticateToken, exportSurveyData);

module.exports = router;
