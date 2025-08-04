const express = require('express');
const router = express.Router();
const { handleCreateSurvey, updateSurvey, deleteSurvey, getSurveysByUser, getSurveyById } = require('../controllers/surveyController');
const {authenticateToken, checkSurveyOwnership} = require('../middleware/authMiddleware');

router.post('/create', authenticateToken, handleCreateSurvey);
router.put('/:id', authenticateToken, checkSurveyOwnership, updateSurvey);
router.delete('/:id', authenticateToken, checkSurveyOwnership, deleteSurvey);
router.get('/user/:id', authenticateToken, getSurveysByUser);
router.get('/:id', getSurveyById);

module.exports = router;
