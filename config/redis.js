const redis = require('redis');

const client = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    retry_strategy: (options) => {
        if (options.error && options.error.code === 'ECONNREFUSED') {
            console.log('Redis server connection refused');
            return new Error('Redis server connection refused');
        }
        if (options.total_retry_time > 1000 * 60 * 60) {
            console.log('Redis retry time exhausted');
            return new Error('Retry time exhausted');
        }
        if (options.attempt > 10) {
            console.log('Redis max retry attempts reached');
            return undefined;
        }
        return Math.min(options.attempt * 100, 3000);
    }
});

client.on('error', (err) => {
    console.log('Redis Client Error', err);
});

client.on('connect', () => {
    console.log('Redis client connected');
});

client.on('ready', () => {
    console.log('Redis client ready');
});

// Connect to Redis
client.connect().catch(console.error);

module.exports = client;
