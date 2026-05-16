import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, testConnection } from './src/config/database.js';
import swaggerSpec from './src/config/swagger.js';
import errorHandler from './src/middlewares/errorHandler.js';
import authRoutes from './src/routes/auth.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import productRoutes from './src/routes/product.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration - Fixed version
const allowedOrigins = [
    'http://localhost:3000',
    process.env.CLIENT_URL
].filter(Boolean);

// CORS middleware - Simplified version
app.use(cors({
    // origin: function (origin, callback) {
    //     // Allow requests with no origin (like mobile apps or curl requests)
    //     if (!origin) return callback(null, true);
        
    //     // Allow all origins in development
    //     if (process.env.NODE_ENV !== 'production') {
    //         return callback(null, true);
    //     }
        
    //     // Check against allowed origins in production
    //     if (allowedOrigins.indexOf(origin) !== -1) {
    //         callback(null, true);
    //     } else {
    //         console.log('Blocked origin:', origin);
    //         callback(new Error('Not allowed by CORS'));
    //     }
    // },
    origin: ['http://localhost:3000', 'https://everacee-seven.vercel.app'] ,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
    exposedHeaders: ['Authorization']
}));

// Other middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Request logging middleware
app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    if (req.headers.origin) {
        console.log('Origin:', req.headers.origin);
    }
    next();
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'E-Commerce API Documentation'
}));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV,
        uptime: process.uptime()
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.send('✅ API is running');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/products', productRoutes);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`
    });
});

// Error handling middleware
app.use(errorHandler);

// Create default admin user
const createDefaultAdmin = async () => {
    try {
        const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, parseInt(process.env.BCRYPT_SALT_ROUNDS));
        
        await pool.query(
            `INSERT INTO users (email, password, first_name, last_name, role, is_active) 
             VALUES (?, ?, 'Admin', 'User', 'admin', true)
             ON DUPLICATE KEY UPDATE id = id`,
            [process.env.ADMIN_EMAIL, hashedPassword]
        );
        
        console.log('✅ Default admin user created/verified');
    } catch (error) {
        console.error('Error creating admin:', error.message);
    }
};

// Start server
const startServer = async () => {
    try {
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Cannot start server without database');
            process.exit(1);
        }
        
        await createDefaultAdmin();
        
        app.listen(PORT, '0.0.0.0', () => {
            console.log(`\n🚀 Server running on port http://localhost:${PORT}`);
            console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`👤 Admin Email: ${process.env.ADMIN_EMAIL}`);
            console.log(`🔑 Admin Password: ${process.env.ADMIN_PASSWORD}`);
            console.log(`\n✅ Server is ready  \n`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

startServer();

// Graceful shutdown
const gracefulShutdown = () => {
    console.log('\nReceived shutdown signal, closing server...');
    process.exit(0);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

export default app;