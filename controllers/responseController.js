const { saveResponse, saveAnswers, getSurveyResponses  } = require('../models/responseModel');
const db = require('../config/db');

const handleSubmitResponse = async (req, res) => {
    const survey_id = req.params.surveyId;
    
    // Check for optional authentication
    const authHeader = req.headers['authorization'];
    let user = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const jwt = require('jsonwebtoken');
            const token = authHeader.split(' ')[1];
            user = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            // Invalid token, proceed as anonymous
        }
    }
    
    const { respondent_email, answers } = req.body;

    // Basic validation
    if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ message: 'Answers are required' });
    }

    try {
        // Save the main response entry
        const response_id = await saveResponse({
            survey_id,
            user_id: user ? user.id : null,
            respondent_email
        });

        // Save individual answers
        await saveAnswers(response_id, answers);

        res.status(201).json({
            message: 'Response submitted successfully',
            response_id
        });
    } catch (err) {
        console.error('Error submitting response:', err.message);
        res.status(500).json({ message: 'Internal server error' });
    }
};

const handleGetSurveyResponses = async (req, res) => {
    const surveyId = req.params.surveyId;

    try {
        const responses = await getSurveyResponses(surveyId);
        res.status(200).json(responses);
    } catch (err) {
        console.error('Error fetching responses:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};

const deleteResponse = async (req, res) => {
    const responseId = req.params.responseId;
  
    try {
      await db.query(`DELETE FROM answers WHERE response_id = ?`, [responseId]);
      await db.query(`DELETE FROM responses WHERE id = ?`, [responseId]);
      res.status(200).json({ message: 'Response deleted successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Error deleting response' });
    }
  };

module.exports = {
    handleSubmitResponse,
    handleGetSurveyResponses,
    deleteResponse
};
