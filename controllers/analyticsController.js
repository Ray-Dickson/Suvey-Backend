const db = require('../config/db');

// Get survey analytics – accessible only to creator or admin
const getSurveyAnalytics = async (req, res) => {
  const surveyId = req.params.surveyId;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // Step 1: Check if survey exists and get owner
    const [[survey]] = await db.query(
      'SELECT user_id FROM surveys WHERE id = ?',
      [surveyId]
    );

    if (!survey) {
      return res.status(404).json({ message: 'Survey not found' });
    }

    // Step 2: Access control – only survey creator or admin
    const isOwner = survey.user_id === userId;
    const isAdmin = userRole === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({
        message: 'Access denied: You are not authorized to view analytics for this survey.'
      });
    }

    // Step 3: Total responses
    const [[{ totalResponses }]] = await db.query(
      'SELECT COUNT(*) AS totalResponses FROM responses WHERE survey_id = ?',
      [surveyId]
    );

    // Step 4: Get all questions in this survey
    const [questions] = await db.query(
      'SELECT id, question_text, type FROM questions WHERE survey_id = ?',
      [surveyId]
    );

    // Step 5: Build analytics per question
    const analytics = [];

    for (const q of questions) {
      const questionData = {
        question_text: q.question_text,
        type: q.type,
      };

      // Handle choice-based questions
      if (['multiple_choice', 'checkbox', 'dropdown'].includes(q.type)) {
        const [optionCounts] = await db.query(
          `SELECT o.option_text,
                  COUNT(CASE WHEN a.answer_text = o.option_text THEN 1 END) AS count
           FROM question_options o
           LEFT JOIN answers a ON a.question_id = o.question_id
           WHERE o.question_id = ?
           GROUP BY o.option_text`,
          [q.id]
        );
        questionData.options = optionCounts;
      }

      // Handle rating-type questions
      if (q.type === 'rating') {
        const [[{ avg_rating }]] = await db.query(
          `SELECT AVG(CAST(answer_text AS DECIMAL)) AS avg_rating
           FROM answers WHERE question_id = ?`,
          [q.id]
        );
        questionData.average_rating = avg_rating
          ? parseFloat(avg_rating).toFixed(2)
          : "0.00";
      }

      analytics.push(questionData);
    }

    // Final response
    res.json({
      surveyId,
      totalResponses,
      questions: analytics
    });

  } catch (err) {
    console.error('Error generating analytics:', err.message);
    res.status(500).json({ message: 'Server error generating analytics' });
  }
};

module.exports = { getSurveyAnalytics };
