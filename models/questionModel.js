const db = require('../config/db');

const addQuestion = async (survey_id, questionData) => {
    const {
        question_text,
        type,
        is_required = true,
        display_order,
        options = []
    } = questionData;

    const [result] = await db.query(
        `INSERT INTO questions (survey_id, question_text, type, is_required, display_order)
         VALUES (?, ?, ?, ?, ?)`,
        [survey_id, question_text, type, is_required, display_order]
    );

    const questionId = result.insertId;

    // Add options only for relevant types
    if (['multiple_choice', 'checkbox', 'dropdown'].includes(type)) {
        for (let i = 0; i < options.length; i++) {
            const optionText = options[i];
            await db.query(
                `INSERT INTO question_options (question_id, option_text, display_order)
                 VALUES (?, ?, ?)`,
                [questionId, optionText, i + 1]
            );
        }
    }

    return questionId;
};

const getQuestionsWithOptions = async (surveyId) => {
    // Get all questions for the survey
    const [questions] = await db.query(
        `SELECT * FROM questions WHERE survey_id = ? ORDER BY display_order ASC`,
        [surveyId]
    );

    // For each question, fetch its options (if needed)
    for (const question of questions) {
        if (['multiple_choice', 'checkbox', 'dropdown'].includes(question.type)) {
            const [options] = await db.query(
                `SELECT option_text FROM question_options WHERE question_id = ? ORDER BY display_order ASC`,
                [question.id]
            );
            question.options = options.map(opt => opt.option_text);
        } else {
            question.options = [];
        }
    }

    return questions;
};


module.exports = {
    addQuestion,
    getQuestionsWithOptions
};
