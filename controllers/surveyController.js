const { createSurvey } = require('../models/surveyModel');
const db = require('../config/db');

const handleCreateSurvey = async (req, res) => {
    const {
        title,
        description,
        is_public,
        allow_multiple_submissions,
        requires_login,
        access_password,
        open_at,
        close_at,
        status
    } = req.body;

    const user_id = req.user.id;

    if (!title) {
        return res.status(400).json({ message: 'Title is required' });
    }

    try {
        const surveyId = await createSurvey({
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
        });

        res.status(201).json({
            message: 'Survey created successfully',
            surveyId
        });
    } catch (error) {
        console.error('Error creating survey:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


const updateSurvey = async (req, res) => {
    const surveyId = req.params.id;
    const { title, description, is_public, allow_multiple_submissions, requires_login, access_password, open_at, close_at, status } = req.body;
  
    try {
      await db.query(
        `UPDATE surveys SET title = ?, description = ?, is_public = ?, allow_multiple_submissions = ?, requires_login = ?, access_password = ?, open_at = ?, close_at = ?, status = ? WHERE id = ?`,
        [title, description, is_public, allow_multiple_submissions, requires_login, access_password, open_at, close_at, status, surveyId]
      );
  
      res.status(200).json({ message: 'Survey updated successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Error updating survey' });
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
        `SELECT * FROM surveys WHERE user_id = ? ORDER BY created_at DESC`,
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
  

module.exports = {
    handleCreateSurvey,
    updateSurvey,
    deleteSurvey,
    getSurveysByUser,
    getSurveyById
  };