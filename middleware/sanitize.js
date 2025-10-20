const sanitizeHtml = require('sanitize-html');
const validator = require('validator');

const sanitizeInput = (req, res, next) => {
    if (req.body) {
        Object.keys(req.body).forEach(key => {
            if (typeof req.body[key] === 'string') {
                // Sanitize HTML content
                req.body[key] = sanitizeHtml(req.body[key], {
                    allowedTags: [],
                    allowedAttributes: {}
                });
                
                // Additional validation for specific fields
                if (key === 'email' && !validator.isEmail(req.body[key])) {
                    return res.status(400).json({ error: 'Invalid email format' });
                }
                
                if (key === 'password' && req.body[key].length < 6) {
                    return res.status(400).json({ error: 'Password must be at least 6 characters long' });
                }
            }
        });
    }
    next();
};

const sanitizeQuery = (req, res, next) => {
    if (req.query) {
        Object.keys(req.query).forEach(key => {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeHtml(req.query[key], {
                    allowedTags: [],
                    allowedAttributes: {}
                });
            }
        });
    }
    next();
};

module.exports = { sanitizeInput, sanitizeQuery };
