const { addQuestion, getQuestionsWithOptions } = require('../models/questionModel');
const db = require('../config/db');

const handleAddQuestion = async (req, res) => {
    const survey_id = req.params.surveyId;
    const questionData = req.body;

    if (!questionData.question_text || !questionData.type) {
        return res.status(400).json({ message: 'Question text and type are required' });
    }

    try {
        const questionId = await addQuestion(survey_id, questionData);
        res.status(201).json({
            message: 'Question added successfully',
            questionId
        });
    } catch (error) {
        console.error('Error adding question:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
};


const handleGetSurveyQuestions = async (req, res) => {
    const surveyId = req.params.surveyId;

    try {
        const questions = await getQuestionsWithOptions(surveyId);
        res.status(200).json(questions);
    } catch (err) {
        console.error('Error fetching questions:', err.message);
        res.status(500).json({ message: 'Server error' });
    }
};


const updateQuestion = async (req, res) => {
    const questionId = req.params.id;
    const { question_text, type, is_required, display_order, options } = req.body;
  
    const conn = await db.getConnection(); // optional if using pool
    await conn.beginTransaction();
  
    try {
      // 1. Update the question fields
      await conn.query(
        `UPDATE questions SET question_text = ?, type = ?, is_required = ?, display_order = ? WHERE id = ?`,
        [question_text, type, is_required, display_order, questionId]
      );
  
      // 2. If new options are provided and type supports them
      const optionTypes = ['multiple_choice', 'checkbox', 'dropdown'];
      if (options && Array.isArray(options) && optionTypes.includes(type)) {
        // Delete existing options
        await conn.query(`DELETE FROM question_options WHERE question_id = ?`, [questionId]);
  
        // Insert new options
        for (let i = 0; i < options.length; i++) {
          const { option_text, display_order } = options[i];
          await conn.query(
            `INSERT INTO question_options (question_id, option_text, display_order) VALUES (?, ?, ?)`,
            [questionId, option_text, display_order || i + 1]
          );
        }
      }
  
      await conn.commit();
      res.status(200).json({ message: 'Question and options updated successfully' });
  
    } catch (err) {
      await conn.rollback();
      console.error(err.message);
      res.status(500).json({ message: 'Failed to update question and options' });
    } finally {
      conn.release();
    }
  };
  
  
  // Delete a question (and its options)
  const deleteQuestion = async (req, res) => {
    const questionId = req.params.id;
  
    try {
      await db.query(`DELETE FROM question_options WHERE question_id = ?`, [questionId]);
      await db.query(`DELETE FROM questions WHERE id = ?`, [questionId]);
      res.status(200).json({ message: 'Question and options deleted successfully' });
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ message: 'Error deleting question' });
    }
  };

module.exports = {
    handleAddQuestion,
    handleGetSurveyQuestions,
    updateQuestion,
    deleteQuestion
};
