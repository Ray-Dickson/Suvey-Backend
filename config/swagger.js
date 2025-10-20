const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Survey App API',
            version: '1.0.0',
            description: 'A comprehensive survey application API',
            contact: {
                name: 'API Support',
                email: 'support@surveyapp.com'
            }
        },
        servers: [
            {
                url: process.env.API_URL || 'http://localhost:5000',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT'
                }
            },
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        phone: { type: 'string' },
                        role: { type: 'string', enum: ['creator', 'admin'] }
                    }
                },
                Survey: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        title: { type: 'string' },
                        description: { type: 'string' },
                        status: { type: 'string', enum: ['draft', 'active', 'closed'] },
                        created_at: { type: 'string', format: 'date-time' }
                    }
                },
                Question: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        survey_id: { type: 'integer' },
                        question_text: { type: 'string' },
                        question_type: { type: 'string', enum: ['text', 'multiple_choice', 'rating', 'yes_no'] },
                        options: { type: 'array', items: { type: 'string' } },
                        order_index: { type: 'integer' }
                    }
                },
                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string' },
                        message: { type: 'string' }
                    }
                }
            }
        },
        security: [
            {
                bearerAuth: []
            }
        ]
    },
    apis: ['./routes/*.js', './controllers/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs;
