const db = require('../config/db');
const bcrypt = require('bcryptjs');

const createSurvey = async (surveyData) => {
    const {
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
    } = surveyData;

    const hashedPassword = access_password
        ? await bcrypt.hash(access_password, 10)
        : null;

    const [result] = await db.query(
        `INSERT INTO surveys (
            user_id, title, description,
            is_public, allow_multiple_submissions,
            requires_login, access_password,
            open_at, close_at, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            user_id,
            title,
            description,
            is_public,
            allow_multiple_submissions,
            requires_login,
            hashedPassword,
            open_at,
            close_at,
            status
        ]
    );

    return result.insertId;
};

module.exports = { createSurvey };
