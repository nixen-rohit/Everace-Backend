import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import bcrypt from 'bcryptjs';
import { pool, testConnection } from './src/config/database.js';
import swaggerSpec from './src/config/swagger.js';
import errorHandler from './src/middlewares/errorHandler.js';
import authRoutes from './src/routes/auth.routes.js';
import adminRoutes from './src/routes/admin.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:3000',
    credentials: true
}));

// Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handler
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
        
        
    } catch (error) {
        console.error('Error creating admin:', error.message);
    }
};

// Start server
const startServer = async () => {
    const dbConnected = await testConnection();
    if (!dbConnected) {
        console.error('❌ Cannot start server without database');
        process.exit(1);
    }
    
    await createDefaultAdmin();
    
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
        
    });
};

startServer();