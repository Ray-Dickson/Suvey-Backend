const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/authMiddleware');
const { getAllSurveysForAdmin, getAllUsersForAdmin, getSystemStats } = require('../controllers/surveyController');

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(checkRole('admin'));

// Get all surveys with user details
router.get('/surveys', getAllSurveysForAdmin);

// Get all users
router.get('/users', getAllUsersForAdmin);

// Get system statistics
router.get('/stats', getSystemStats);

module.exports = router;
