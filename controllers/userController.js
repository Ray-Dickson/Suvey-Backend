const db = require('../config/db');
const {updateUserById,findUserById } = require('../models/userModel');

const getMe = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, phone_number, role FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateUser = async (req, res) => {
    const userId = parseInt(req.params.id);
    const requesterId = req.user.id;
    const requesterRole = req.user.role;

    if (userId !== requesterId && requesterRole !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized to update this user' });
    }

    const { name, email, phone_number } = req.body;

    if (!name && !email && !phone_number) {
        return res.status(400).json({ message: 'No update fields provided' });
    }

    try {
        const user = await findUserById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        const result = await updateUserById(userId, { name, email, phone_number });
        if (result.affectedRows === 0) {
            return res.status(400).json({ message: 'No changes made' });
        }

        res.json({ message: 'User information updated successfully' });
    } catch (err) {
        console.error('Error updating user:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

module.exports = { getMe, updateUser };
