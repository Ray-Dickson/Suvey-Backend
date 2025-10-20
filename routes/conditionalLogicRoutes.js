const express = require('express');
const router = express.Router();
const {
    createConditionalRule,
    getConditionalRules,
    updateConditionalRule,
    deleteConditionalRule,
    evaluateConditionalLogic
} = require('../controllers/conditionalLogicController');
const { authenticateToken } = require('../middleware/authMiddleware');

// Create conditional rule
router.post('/rules', authenticateToken, createConditionalRule);

// Get conditional rules for a question
router.get('/rules/:questionId', authenticateToken, getConditionalRules);

// Update conditional rule
router.put('/rules/:ruleId', authenticateToken, updateConditionalRule);

// Delete conditional rule
router.delete('/rules/:ruleId', authenticateToken, deleteConditionalRule);

// Evaluate conditional logic
router.post('/evaluate', authenticateToken, evaluateConditionalLogic);

module.exports = router;
