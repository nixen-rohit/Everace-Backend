import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

// Protect routes - requires authentication
export const protect = asyncHandler(async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
        throw new AppError('You are not logged in. Please login first.', 401);
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const [users] = await pool.query(
        'SELECT id, email, first_name, last_name, role, is_active FROM users WHERE id = ?',
        [decoded.id]
    );
    
    if (users.length === 0) {
        throw new AppError('User no longer exists', 401);
    }
    
    if (!users[0].is_active) {
        throw new AppError('Your account is deactivated', 401);
    }
    
    req.user = users[0];
    next();
});

// Restrict to specific roles
export const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            throw new AppError('You do not have permission to perform this action', 403);
        }
        next();
    };
};

// Admin only middleware
export const adminOnly = restrictTo('admin');