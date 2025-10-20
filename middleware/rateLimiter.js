const rateLimit = require('express-rate-limit');

const createRateLimit = (windowMs, max) => rateLimit({
    windowMs,
    max,
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

const authLimiter = createRateLimit(15 * 60 * 1000, 5); // 5 attempts per 15 minutes
const generalLimiter = createRateLimit(15 * 60 * 1000, 100); // 100 requests per 15 minutes
const surveyLimiter = createRateLimit(15 * 60 * 1000, 200); // 200 survey operations per 15 minutes

module.exports = { authLimiter, generalLimiter, surveyLimiter };
