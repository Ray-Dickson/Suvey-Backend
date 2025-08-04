const express = require('express');
const router = express.Router();
const {authenticateToken, checkSurveyOwnership} = require('../middleware/authMiddleware');
const { handleAddQuestion, handleGetSurveyQuestions, updateQuestion, deleteQuestion  } = require('../controllers/questionController');

// Add question to survey
router.post('/:surveyId/add', authenticateToken,checkSurveyOwnership, handleAddQuestion);

router.get('/:surveyId', handleGetSurveyQuestions);

router.put('/:id', authenticateToken, checkSurveyOwnership, updateQuestion);


  router.delete('/:id', authenticateToken, async (req, res, next) => {
    try {
      const [[{ survey_id }]] = await db.query(`SELECT survey_id FROM questions WHERE id = ?`, [req.params.id]);
      req.params.surveyId = survey_id;
      next();
    } catch (err) {
      res.status(500).json({ message: 'Error checking ownership' });
    }
  }, checkSurveyOwnership, deleteQuestion);


module.exports = router;
