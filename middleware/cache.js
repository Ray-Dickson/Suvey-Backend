const redis = require('../config/redis');

const cache = (duration = 300) => {
    return async (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const key = `cache:${req.originalUrl}`;
        
        try {
            const cached = await redis.get(key);
            if (cached) {
                console.log('Cache hit for:', key);
                return res.json(JSON.parse(cached));
            }
        } catch (error) {
            console.log('Cache error:', error);
        }

        // Store original res.json
        const originalJson = res.json;
        
        res.json = function(data) {
            // Cache the response
            redis.setEx(key, duration, JSON.stringify(data))
                .catch(error => console.log('Cache set error:', error));
            
            // Call original json method
            originalJson.call(this, data);
        };

        next();
    };
};

const clearCache = async (pattern) => {
    try {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
            await redis.del(keys);
            console.log(`Cleared ${keys.length} cache entries for pattern: ${pattern}`);
        }
    } catch (error) {
        console.log('Cache clear error:', error);
    }
};

module.exports = { cache, clearCache };
