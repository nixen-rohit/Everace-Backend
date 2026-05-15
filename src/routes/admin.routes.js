import express from 'express';
import { protect, adminOnly } from '../middlewares/auth.middleware.js';
import { pool } from '../config/database.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/AppError.js';

const router = express.Router();

// Apply admin middleware to all routes
router.use(protect, adminOnly);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Get all users (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users', asyncHandler(async (req, res) => {
    const [users] = await pool.query(
        'SELECT id, email, first_name, last_name, role, is_active, last_login, created_at FROM users ORDER BY created_at DESC'
    );
    
    res.json({
        success: true,
        data: { users }
    });
}));

/**
 * @swagger
 * /admin/users/{id}:
 *   get:
 *     summary: Get user by ID (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/users/:id', asyncHandler(async (req, res) => {
    const [users] = await pool.query(
        'SELECT id, email, first_name, last_name, role, is_active, last_login, created_at FROM users WHERE id = ?',
        [req.params.id]
    );
    
    if (users.length === 0) {
        throw new AppError('User not found', 404);
    }
    
    res.json({
        success: true,
        data: { user: users[0] }
    });
}));

/**
 * @swagger
 * /admin/users/{id}:
 *   put:
 *     summary: Update user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.put('/users/:id', asyncHandler(async (req, res) => {
    const { firstName, lastName, role, isActive } = req.body;
    const userId = req.params.id;
    
    // Prevent admin from deactivating themselves
    if (parseInt(userId) === req.user.id && isActive === false) {
        throw new AppError('You cannot deactivate your own account', 400);
    }
    
    await pool.query(
        `UPDATE users 
         SET first_name = COALESCE(?, first_name),
             last_name = COALESCE(?, last_name),
             role = COALESCE(?, role),
             is_active = COALESCE(?, is_active)
         WHERE id = ?`,
        [firstName, lastName, role, isActive, userId]
    );
    
    res.json({
        success: true,
        message: 'User updated successfully'
    });
}));

/**
 * @swagger
 * /admin/users/{id}:
 *   delete:
 *     summary: Delete user (Admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.delete('/users/:id', asyncHandler(async (req, res) => {
    const userId = req.params.id;
    
    if (parseInt(userId) === req.user.id) {
        throw new AppError('You cannot delete your own account', 400);
    }
    
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [userId]);
    
    if (result.affectedRows === 0) {
        throw new AppError('User not found', 404);
    }
    
    res.json({
        success: true,
        message: 'User deleted successfully'
    });
}));

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Get admin statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', asyncHandler(async (req, res) => {
    const [[userCount]] = await pool.query('SELECT COUNT(*) as total FROM users');
    const [[adminCount]] = await pool.query('SELECT COUNT(*) as total FROM users WHERE role = "admin"');
    const [[activeUsers]] = await pool.query('SELECT COUNT(*) as total FROM users WHERE is_active = true');
    
    res.json({
        success: true,
        data: {
            totalUsers: userCount.total,
            totalAdmins: adminCount.total,
            activeUsers: activeUsers.total
        }
    });
}));

export default router;