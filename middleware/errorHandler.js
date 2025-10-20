const errorHandler = (err, req, res, next) => {
    console.error('Error:', err);

    // Database connection errors
    if (err.code === 'ECONNREFUSED') {
        return res.status(503).json({
            error: 'Database connection failed',
            message: 'Service temporarily unavailable'
        });
    }

    // MySQL errors
    if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({
            error: 'Duplicate entry',
            message: 'Resource already exists'
        });
    }

    if (err.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            error: 'Foreign key constraint',
            message: 'Referenced resource does not exist'
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            error: 'Invalid token',
            message: 'Authentication failed'
        });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            error: 'Token expired',
            message: 'Please login again'
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation failed',
            message: err.message
        });
    }

    // Default error
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal server error';

    res.status(statusCode).json({
        error: 'Server error',
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : message
    });
};

const notFoundHandler = (req, res) => {
    res.status(404).json({
        error: 'Not found',
        message: `Route ${req.originalUrl} not found`
    });
};

module.exports = { errorHandler, notFoundHandler };
