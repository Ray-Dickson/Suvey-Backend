const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const app = express();
const authRoutes = require('./routes/authRoutes');
const {authenticateToken }= require('./middleware/authMiddleware');
const surveyRoutes = require('./routes/surveyRoutes');
const questionRoutes = require('./routes/questionRoutes');
const responseRoutes = require('./routes/responseRoutes');
const userRoutes = require('./routes/userRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const adminRoutes = require('./routes/adminRoutes');
const exportRoutes = require('./routes/exportRoutes');
const conditionalLogicRoutes = require('./routes/conditionalLogicRoutes');
const verifyToken = require('./routes/verifyToken');
const { sanitizeInput, sanitizeQuery } = require('./middleware/sanitize');
const { authLimiter, generalLimiter, surveyLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');

// Load env variables
dotenv.config();

// Security middleware
app.use(helmet());
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/surveys', surveyLimiter);
app.use('/api', generalLimiter);

// Body parsing and sanitization
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitizeInput);
app.use(sanitizeQuery);

app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/responses', responseRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/conditional', conditionalLogicRoutes);
app.use('/api/verify', verifyToken);

// API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Survey App API Documentation'
}));


// Root route
app.get('/', (req, res) => {
    res.send('Survey API is running');
});



//testing protected route
app.get('/protected', authenticateToken, (req, res) => {
    res.json({ message: 'You are authorized!', user: req.user });
});

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
