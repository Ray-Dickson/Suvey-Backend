const db = require('../config/db');

// Save response to the "responses" table
const saveResponse = async ({ survey_id, user_id = null, respondent_email = null }) => {
    const [result] = await db.query(
        `INSERT INTO responses (survey_id, user_id, respondent_email)
         VALUES (?, ?, ?)`,
        [survey_id, user_id, respondent_email]
    );

    return result.insertId; // This will be used to save answers
};

// Save answers to the "answers" table
const saveAnswers = async (response_id, answers) => {
    for (const answer of answers) {
        const { question_id, answer_text } = answer;

        await db.query(
            `INSERT INTO answers (response_id, question_id, answer_text)
             VALUES (?, ?, ?)`,
            [response_id, question_id, answer_text]
        );
    }
};

const getSurveyResponses = async (surveyId) => {
    // Step 1: Get all responses for the survey
    const [responses] = await db.query(
        `SELECT * FROM responses WHERE survey_id = ? ORDER BY submitted_at DESC`,
        [surveyId]
    );

    // Step 2: For each response, fetch the related answers
    for (const response of responses) {
        const [answers] = await db.query(
            `SELECT question_id, answer_text FROM answers WHERE response_id = ?`,
            [response.id]
        );
        response.answers = answers;
    }

    return responses;
};

module.exports = {
    saveResponse,
    saveAnswers,
    getSurveyResponses
};

