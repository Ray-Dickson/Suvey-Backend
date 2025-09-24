const { createSurvey } = require('../models/surveyModel');
const db = require('../config/db');

// const handleCreateSurvey = async (req, res) => {
//     const {
//         title,
//         description,
//         is_public,
//         allow_multiple_submissions,
//         requires_login,
//         access_password,
//         open_at,
//         close_at,
//         status
//     } = req.body;

//     const user_id = req.user.id;

//     if (!title) {
//         return res.status(400).json({ message: 'Title is required' });
//     }

//     try {
//         const surveyId = await createSurvey({
//             user_id,
//             title,
//             description,
//             is_public,
//             allow_multiple_submissions,
//             requires_login,
//             access_password,
//             open_at,
//             close_at,
//             status
//         });

//         res.status(201).json({
//             message: 'Survey created successfully',
//             surveyId
//         });
//     } catch (error) {
//         console.error('Error creating survey:', error.message);
//         res.status(500).json({ message: 'Server error' });
//     }
// };


const updateSurvey = async (req, res) => {
    const surveyId = req.params.id;
    const { 
        title, 
        description, 
        is_public, 
        allow_multiple_submissions, 
        requires_login, 
        access_password, 
        open_at, 
        close_at, 
        status,
        questions = [] // Array of questions to update
    } = req.body;

    console.log('Update survey request:', { 
        surveyId, 
        title, 
        status, 
        questionsCount: questions.length,
        user: req.user?.id,
        body: req.body
    });
  
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // Enforce: Only surveys in draft status can be edited/updated
        const [statusRows] = await connection.query(
            `SELECT status FROM surveys WHERE id = ?`,
            [surveyId]
        );
        if (statusRows.length === 0) {
            await connection.rollback();
            return res.status(404).json({ message: 'Survey not found' });
        }
        const currentStatus = (statusRows[0].status || '').toLowerCase();
        if (currentStatus !== 'draft') {
            await connection.rollback();
            return res.status(403).json({ message: 'Published surveys cannot be edited' });
        }

        // 1. Update survey metadata
        await connection.query(
            `UPDATE surveys SET title = ?, description = ?, is_public = ?, allow_multiple_submissions = ?, requires_login = ?, access_password = ?, open_at = ?, close_at = ?, status = ?, last_edited = CURRENT_TIMESTAMP WHERE id = ?`,
            [title, description, is_public, allow_multiple_submissions, requires_login, access_password, open_at, close_at, status, surveyId]
        );

        // 2. If questions are provided, update them (only if there are no responses)
        if (questions && questions.length > 0) {
            // Check if the survey already has responses/answers
            const [answerRows] = await connection.query(
                `SELECT COUNT(*) AS answerCount
                 FROM answers a
                 INNER JOIN responses r ON r.id = a.response_id
                 WHERE r.survey_id = ?`,
                [surveyId]
            );
            const answerCount = answerRows[0]?.answerCount || 0;

            if (answerCount > 0) {
                // Do not modify questions if there are existing answers to preserve data integrity
                console.log(`Survey ${surveyId} has ${answerCount} answers. Skipping question updates to avoid deleting referenced rows.`);
            } else {
                // Safe to replace questions/options when there are no responses
                // Delete existing questions and options
                await connection.query(`DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE survey_id = ?)`, [surveyId]);
                await connection.query(`DELETE FROM questions WHERE survey_id = ?`, [surveyId]);

                // Insert updated questions
                for (const [index, question] of questions.entries()) {
                    const {
                        question_text,
                        type,
                        is_required = true,
                        options = []
                    } = question;

                    // Debug logging
                    console.log('Updating question:', { question_text, type, is_required, options });

                    // Validate question type
                    const validTypes = ['short_text', 'long_text', 'multiple_choice', 'checkbox', 'dropdown', 'rating', 'scale', 'matrix'];
                    if (!validTypes.includes(type)) {
                        throw new Error(`Invalid question type: ${type}. Valid types are: ${validTypes.join(', ')}`);
                    }

                    const [questionResult] = await connection.query(
                        `INSERT INTO questions (survey_id, question_text, type, is_required, display_order)
                         VALUES (?, ?, ?, ?, ?)`,
                        [surveyId, question_text, type, is_required, index + 1]
                    );

                    const questionId = questionResult.insertId;

                    // Insert options for questions that need them
                    if (['multiple_choice', 'checkbox', 'dropdown'].includes(type)) {
                        for (let i = 0; i < options.length; i++) {
                            const optionText = options[i];
                            await connection.query(
                                `INSERT INTO question_options (question_id, option_text, display_order)
                                 VALUES (?, ?, ?)`,
                                [questionId, optionText, i + 1]
                            );
                        }
                    }
                }
            }
        }

        await connection.commit();
        console.log('Survey updated successfully:', surveyId);
        res.status(200).json({ message: 'Survey updated successfully' });
    } catch (err) {
        await connection.rollback();
        console.error('Error updating survey:', err.message);
        console.error('Full error:', err);
        res.status(500).json({ 
            message: 'Error updating survey', 
            error: err.message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    } finally {
        connection.release();
    }
};
  
  const deleteSurvey = async (req, res) => {
    const surveyId = req.params.id;
  
    try {
      // Delete related questions, options, responses, answers first
      await db.query(`DELETE FROM answers WHERE response_id IN (SELECT id FROM responses WHERE survey_id = ?)`, [surveyId]);
      await db.query(`DELETE FROM responses WHERE survey_id = ?`, [surveyId]);
      await db.query(`DELETE FROM question_options WHERE question_id IN (SELECT id FROM questions WHERE survey_id = ?)`, [surveyId]);
      await db.query(`DELETE FROM questions WHERE survey_id = ?`, [surveyId]);
      await db.query(`DELETE FROM surveys WHERE id = ?`, [surveyId]);
  
      res.status(200).json({ message: 'Survey and related data deleted successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Error deleting survey' });
    }
  };

  const getSurveysByUser = async (req, res) => {
  const userId = req.params.id;

  if (req.user.id !== parseInt(userId) && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Unauthorized access to surveys' });
  }

  try {
    const [surveys] = await db.query(
      `
      SELECT 
        s.*, 
        COUNT(r.id) AS responses 
      FROM surveys s
      LEFT JOIN responses r ON s.id = r.survey_id
      WHERE s.user_id = ?
      GROUP BY s.id
      ORDER BY s.created_at DESC
      `,
      [userId]
    );

    res.status(200).json(surveys);
  } catch (err) {
    console.error('Error fetching surveys by user:', err.message);
    res.status(500).json({ message: 'Server error fetching surveys' });
  }
};


  const getSurveyById = async (req, res) => {
    const surveyId = req.params.id;
  
    try {
      // 1. Fetch survey
      const [surveyRows] = await db.query(`SELECT * FROM surveys WHERE id = ?`, [surveyId]);
      if (surveyRows.length === 0) {
        return res.status(404).json({ message: 'Survey not found' });
      }
      const survey = surveyRows[0];
  
      // 2. Fetch questions
      const [questions] = await db.query(`SELECT * FROM questions WHERE survey_id = ? ORDER BY display_order ASC`, [surveyId]);
  
      // 3. Fetch options for each question (if applicable)
      for (let q of questions) {
        if (['multiple_choice', 'checkbox', 'dropdown'].includes(q.type)) {
          const [options] = await db.query(`SELECT * FROM question_options WHERE question_id = ? ORDER BY display_order ASC`, [q.id]);
          q.options = options;
        } else {
          q.options = [];
        }
      }
  
      // 4. Return full survey with questions
      res.status(200).json({ ...survey, questions });
  
    } catch (err) {
      console.error('Error fetching survey by ID:', err.message);
      res.status(500).json({ message: 'Server error' });
    }
  };


  // Route: POST /api/surveys/create
const handleCreateSurveyWithQuestions = async (req, res) => {
    const {
        title,
        description,
        is_public,
        allow_multiple_submissions,
        requires_login,
        access_password,
        open_at,
        close_at,
        status,
        questions = [] // Array of questions
    } = req.body;

    const user_id = req.user.id;

    if (!title || questions.length === 0) {
        return res.status(400).json({ message: 'Title and at least one question are required' });
    }

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Insert survey
        const [surveyResult] = await connection.query(
            `INSERT INTO surveys 
             (user_id, title, description, is_public, allow_multiple_submissions, requires_login, access_password, open_at, close_at, status) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                user_id,
                title,
                description,
                is_public,
                allow_multiple_submissions,
                requires_login,
                access_password,
                open_at,
                close_at,
                status
            ]
        );

        const surveyId = surveyResult.insertId;

        // 2. Insert questions and options
        for (const [index, question] of questions.entries()) {
            const {
                question_text,
                type,
                is_required = true,
                options = []
            } = question;

            // Debug logging
            console.log('Processing question:', { question_text, type, is_required, options });

            // Validate question type
            const validTypes = ['short_text', 'long_text', 'multiple_choice', 'checkbox', 'dropdown', 'rating', 'scale', 'matrix'];
            if (!validTypes.includes(type)) {
                throw new Error(`Invalid question type: ${type}. Valid types are: ${validTypes.join(', ')}`);
            }

            const [questionResult] = await connection.query(
                `INSERT INTO questions (survey_id, question_text, type, is_required, display_order)
                 VALUES (?, ?, ?, ?, ?)`,
                [surveyId, question_text, type, is_required, index + 1]
            );

            const questionId = questionResult.insertId;

            if (['multiple_choice', 'checkbox', 'dropdown'].includes(type)) {
                for (let i = 0; i < options.length; i++) {
                    const optionText = options[i];
                    await connection.query(
                        `INSERT INTO question_options (question_id, option_text, display_order)
                         VALUES (?, ?, ?)`,
                        [questionId, optionText, i + 1]
                    );
                }
            }
        }

        await connection.commit();

        res.status(201).json({
            message: 'Survey and questions created successfully',
            surveyId
        });
    } catch (error) {
        await connection.rollback();
        console.error('Error creating survey with questions:', error.message);
        res.status(500).json({ message: 'Server error while creating survey and questions' });
    } finally {
        connection.release();
    }
};

  

module.exports = {
    handleCreateSurveyWithQuestions,
   // handleCreateSurvey,
    updateSurvey,
    deleteSurvey,
    getSurveysByUser,
    getSurveyById
  };