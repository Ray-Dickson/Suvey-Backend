const express = require('express');
const router = express.Router();
const {authenticateToken} = require('../middleware/authMiddleware');


router.get('/', authenticateToken, (req, res) => {
  res.status(200).json({ valid: true });
});

module.exports = router;