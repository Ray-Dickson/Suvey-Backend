const db = require('../config/db');

// Get survey analytics – accessible only to creator or admin
const getSurveyAnalytics = async (req, res) => {
  const surveyId = req.params.surveyId;
  const userId = req.user.id;
  const userRole = req.user.role;

  try {
    // Step 1: Get survey details including title and creation date
    const [[survey]] = await db.query(
      'SELECT id, title, description, user_id, created_at FROM surveys WHERE id = ?',
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

    // Step 3: Get all responses with submission dates
    const [responses] = await db.query(
      'SELECT id, submitted_at FROM responses WHERE survey_id = ? ORDER BY submitted_at',
      [surveyId]
    );

    // Step 4: Get all questions in this survey with options
    const [questions] = await db.query(
      `SELECT 
        q.id, 
        q.question_text, 
        q.type, 
        q.is_required as required,
        GROUP_CONCAT(o.option_text) as option_texts
      FROM questions q
      LEFT JOIN question_options o ON o.question_id = q.id
      WHERE q.survey_id = ?
      GROUP BY q.id`,
      [surveyId]
    );

    // Step 5: Get all answers for these questions
    const [answers] = await db.query(
      `SELECT 
        question_id,
        response_id,
        answer_text
      FROM answers
      WHERE question_id IN (?)`,
      [questions.map(q => q.id)]
    );

    // Step 6: Format questions with options
    const formattedQuestions = questions.map(q => ({
      id: q.id,
      question: q.question_text,
      type: mapQuestionType(q.type), // Map to frontend types
      required: q.required,
      options: q.option_texts ? q.option_texts.split(',') : []
    }));

    // Step 7: Format responses with answers
    const formattedResponses = responses.map(r => ({
      id: r.id,
      surveyId: survey.id,
      submittedAt: r.submitted_at,
      answers: answers
        .filter(a => a.response_id === r.id)
        .reduce((acc, curr) => {
          const question = questions.find(q => q.id === curr.question_id);
          acc[curr.question_id] = formatAnswer(curr.answer_text, question.type);
          return acc;
        }, {})
    }));

    // Final response
    res.json({
      id: survey.id,
      title: survey.title,
      description: survey.description,
      createdAt: survey.created_at,
      questions: formattedQuestions,
      responses: formattedResponses
    });

  } catch (err) {
    console.error('Error generating analytics:', err.message);
    res.status(500).json({ message: 'Server error generating analytics' });
  }
};

// Helper function to map database question types to frontend types
function mapQuestionType(dbType) {
  const typeMap = {
    'short_text': 'short_text',
    'long_text': 'long_text',
    'multiple_choice': 'multiple_choice',
    'checkbox': 'checkbox',
    'dropdown': 'dropdown',
    'rating': 'rating',
    'scale': 'scale',
    'matrix': 'matrix'
  };
  return typeMap[dbType] || dbType;
}

// Helper function to format answers based on question type
function formatAnswer(answer, questionType) {
  if (!answer) return null;
  
  switch (questionType) {
    case 'checkbox':
      return answer.split(',');
    case 'rating':
      return answer.toString();
    default:
      return answer;
  }
}

module.exports = { getSurveyAnalytics };