const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const {getMe, updateUser} = require('../controllers/userController');

router.get('/me', authenticateToken, getMe);
router.put('/:id', authenticateToken, updateUser);

module.exports = router;
