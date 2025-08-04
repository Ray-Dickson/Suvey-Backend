const express = require('express');
const router = express.Router();
const { handleCreateSurveyWithQuestions, updateSurvey, deleteSurvey, getSurveysByUser, getSurveyById } = require('../controllers/surveyController');
const {authenticateToken, checkSurveyOwnership} = require('../middleware/authMiddleware');

router.post('/create', authenticateToken, handleCreateSurveyWithQuestions);
router.put('/:id', authenticateToken, checkSurveyOwnership, updateSurvey);
router.delete('/:id', authenticateToken, checkSurveyOwnership, deleteSurvey);
router.get('/user/:id', authenticateToken, getSurveysByUser);
router.get('/:id', getSurveyById);

module.exports = router;
