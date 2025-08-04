const db = require('../config/db');

const findUserByEmail = async (email) => {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0];
};

const findUserByPhone = async (phone) => {
    const [rows] = await db.query('SELECT * FROM users WHERE phone_number = ?', [phone]);
    return rows[0];
};



const createUser = async (name, phone, email, passwordHash, role = 'creator') => {
    const [result] = await db.query(
        'INSERT INTO users (name, phone_number, email, password_hash, role) VALUES (?, ?, ?, ?, ?)',
        [name, phone, email, passwordHash, role]
    );
    return result.insertId;
};


const updateUserById = async (id, updatedFields) => {
    const fields = [];
    const values = [];

    for (const key in updatedFields) {
        if (updatedFields[key] !== undefined && updatedFields[key] !== null) {
            fields.push(`${key} = ?`);
            values.push(updatedFields[key]);
        }
    }

    if (fields.length === 0) return false;

    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    const [result] = await db.query(query, values);
    return result;
};

const findUserById = async (id) => {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0];
};



module.exports = {
    updateUserById,
    findUserByEmail,
    findUserByPhone,
    createUser,
    findUserById
};
