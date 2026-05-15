import swaggerJsdoc from 'swagger-jsdoc';

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'E-Commerce Auth API',
            version: '1.0.0',
            description: 'Authentication and Admin API Documentation'
        },
        servers: [
            {
                url: 'http://localhost:5000/api',
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
                RegisterInput: {
                    type: 'object',
                    required: ['email', 'password', 'firstName', 'lastName'],
                    properties: {
                        email: { type: 'string', example: 'user@example.com' },
                        password: { type: 'string', example: 'Password123' },
                        firstName: { type: 'string', example: 'John' },
                        lastName: { type: 'string', example: 'Doe' }
                    }
                },
                LoginInput: {
                    type: 'object',
                    required: ['email', 'password'],
                    properties: {
                        email: { type: 'string', example: 'user@example.com' },
                        password: { type: 'string', example: 'Password123' }
                    }
                },
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer' },
                        email: { type: 'string' },
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        role: { type: 'string', enum: ['user', 'admin'] }
                    }
                }
                Product:{
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    name: { type: 'string', example: 'iPhone 15 Pro' },
                    description: { type: 'string', example: 'Latest Apple smartphone' },
                    price: { type: 'number', format: 'float', example: 999.99 },
                    currency: { type: 'string', example: 'INR' },
                    stock_quantity: { type: 'integer', example: 50 },
                    category: { type: 'string', example: 'Electronics' },
                    tags: { 
                        type: 'array', 
                        items: { type: 'string' },
                        example: ['trending', 'new']
                    },
                    image_url: { type: 'string', example: '/uploads/product-123.jpg' },
                    is_active: { type: 'boolean', example: true },
                    created_at: { type: 'string', format: 'date-time' }
                }
            },
            
            CreateProductInput: {
                type: 'object',
                required: ['name', 'price'],
                properties: {
                    name: { type: 'string', example: 'iPhone 15 Pro' },
                    description: { type: 'string', example: 'Latest Apple smartphone with A17 chip' },
                    price: { type: 'number', format: 'float', example: 999.99 },
                    currency: { type: 'string', example: 'INR', default: 'INR' },
                    stock_quantity: { type: 'integer', example: 50 },
                    category: { type: 'string', example: 'Electronics' },
                    tag: { 
                        type: 'string', 
                        enum: ['new', 'trending', 'out_of_stock', 'other'],
                        example: 'trending'
                    },
                    customTag: { 
                        type: 'string', 
                        description: 'Required if tag is "other"',
                        example: 'limited_edition'
                    },
                    image: { type: 'string', format: 'binary', description: 'Product image file' }
                }
            },
            
            UpdateStockInput: {
                type: 'object',
                properties: {
                    quantity: { type: 'integer', example: 10 },
                    operation: { 
                        type: 'string', 
                        enum: ['set', 'add', 'subtract'],
                        example: 'add',
                        default: 'set'
                    }}}
            }
        },
        tags: [
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Admin', description: 'Admin only endpoints' }
        ]
    },
    apis: ['./src/routes/*.js']
};

export default swaggerJsdoc(options);