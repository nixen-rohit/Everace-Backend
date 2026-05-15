import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool } from '../config/database.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';

const generateTokens = (user) => {
    const accessToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    
    const refreshToken = jwt.sign(
        { id: user.id },
        process.env.JWT_REFRESH_SECRET,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
    );
    
    return { accessToken, refreshToken };
};

// Register new user
export const register = asyncHandler(async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    
    // Check if user exists
    const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
        throw new AppError('Email already registered', 400);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS));
    
    // Create user
    const [result] = await pool.query(
        'INSERT INTO users (email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?)',
        [email, hashedPassword, firstName, lastName, 'user']
    );
    
    const user = { id: result.insertId, email, role: 'user' };
    const tokens = generateTokens(user);
    
    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await pool.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [result.insertId, tokens.refreshToken, expiresAt]
    );
    
    res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
            user: { id: result.insertId, email, firstName, lastName, role: 'user' },
            ...tokens
        }
    });
});

// Login user
export const login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    const [users] = await pool.query(
        'SELECT id, email, password, first_name, last_name, role, is_active FROM users WHERE email = ?',
        [email]
    );
    
    if (users.length === 0) {
        throw new AppError('Invalid email or password', 401);
    }
    
    const user = users[0];
    
    if (!user.is_active) {
        throw new AppError('Your account has been deactivated', 401);
    }
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
    }
    
    const tokens = generateTokens(user);
    
    // Save refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await pool.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [user.id, tokens.refreshToken, expiresAt]
    );
    
    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);
    
    res.json({
        success: true,
        message: 'Login successful',
        data: {
            user: {
                id: user.id,
                email: user.email,
                firstName: user.first_name,
                lastName: user.last_name,
                role: user.role
            },
            ...tokens
        }
    });
});

// Logout
export const logout = asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (token) {
        await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [token]);
    }
    res.json({ success: true, message: 'Logged out successfully' });
});

// Refresh token
export const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
        throw new AppError('Refresh token required', 400);
    }
    
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    const [tokens] = await pool.query(
        'SELECT * FROM refresh_tokens WHERE token = ? AND expires_at > NOW()',
        [refreshToken]
    );
    
    if (tokens.length === 0) {
        throw new AppError('Invalid refresh token', 401);
    }
    
    const [users] = await pool.query(
        'SELECT id, email, role FROM users WHERE id = ? AND is_active = true',
        [decoded.id]
    );
    
    if (users.length === 0) {
        throw new AppError('User not found', 401);
    }
    
    const newTokens = generateTokens(users[0]);
    
    // Delete old and save new refresh token
    await pool.query('DELETE FROM refresh_tokens WHERE token = ?', [refreshToken]);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    await pool.query(
        'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
        [users[0].id, newTokens.refreshToken, expiresAt]
    );
    
    res.json({ success: true, data: newTokens });
});

// Get current user
export const getMe = asyncHandler(async (req, res) => {
    res.json({ success: true, data: { user: req.user } });
});

// Change password
export const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [req.user.id]);
    const isPasswordValid = await bcrypt.compare(currentPassword, users[0].password);
    
    if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, parseInt(process.env.BCRYPT_SALT_ROUNDS));
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, req.user.id]);
    
    // Delete all refresh tokens
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = ?', [req.user.id]);
    
    res.json({ success: true, message: 'Password changed successfully. Please login again.' });
});