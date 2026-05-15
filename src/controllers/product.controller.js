import { pool } from '../config/database.js';
import AppError from '../utils/AppError.js';
import asyncHandler from '../utils/asyncHandler.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to delete old image
const deleteOldImage = (imageUrl) => {
    if (imageUrl) {
        const filename = path.basename(imageUrl);
        const filepath = path.join(__dirname, '../../uploads', filename);
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }
    }
};

// Create product with image upload
export const createProduct = asyncHandler(async (req, res) => {
    const { 
        name, 
        description, 
        price, 
        currency = 'INR',
        stock_quantity = 0,
        category,
        tag,
        customTag 
    } = req.body;

    // Validate required fields
    if (!name || !price) {
        throw new AppError('Name and price are required', 400);
    }

    // Handle tag
    let tags = [];
    if (tag === 'other' && customTag) {
        tags = [customTag];
    } else if (tag && tag !== 'other') {
        tags = [tag];
    }

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
    }

    // Insert product
    const [result] = await pool.query(
        `INSERT INTO products (name, description, price, currency, stock_quantity, 
         category, tags, image_url, created_by) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description, price, currency, stock_quantity, category, 
         JSON.stringify(tags), imageUrl, req.user.id]
    );

    // Get created product
    const [products] = await pool.query(
        'SELECT * FROM products WHERE id = ?',
        [result.insertId]
    );

    res.status(201).json({
        success: true,
        message: 'Product created successfully',
        data: {
            product: {
                ...products[0],
                tags: JSON.parse(products[0].tags || '[]')
            }
        }
    });
});

// Get all products with filters
export const getAllProducts = asyncHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        search, 
        category, 
        tag,
        minPrice, 
        maxPrice,
        sortBy = 'created_at',
        sortOrder = 'DESC'
    } = req.query;

    const offset = (page - 1) * limit;
    let query = 'SELECT * FROM products WHERE is_active = true';
    let countQuery = 'SELECT COUNT(*) as total FROM products WHERE is_active = true';
    const params = [];
    const countParams = [];

    // Search by name
    if (search) {
        query += ' AND name LIKE ?';
        countQuery += ' AND name LIKE ?';
        params.push(`%${search}%`);
        countParams.push(`%${search}%`);
    }

    // Filter by category
    if (category) {
        query += ' AND category = ?';
        countQuery += ' AND category = ?';
        params.push(category);
        countParams.push(category);
    }

    // Filter by tag
    if (tag) {
        query += ' AND JSON_CONTAINS(tags, ?)';
        countQuery += ' AND JSON_CONTAINS(tags, ?)';
        params.push(JSON.stringify(tag));
        countParams.push(JSON.stringify(tag));
    }

    // Filter by price range
    if (minPrice) {
        query += ' AND price >= ?';
        countQuery += ' AND price >= ?';
        params.push(minPrice);
        countParams.push(minPrice);
    }
    if (maxPrice) {
        query += ' AND price <= ?';
        countQuery += ' AND price <= ?';
        params.push(maxPrice);
        countParams.push(maxPrice);
    }

    // Add sorting
    const allowedSortFields = ['name', 'price', 'created_at', 'stock_quantity'];
    const validSortBy = allowedSortFields.includes(sortBy) ? sortBy : 'created_at';
    const validSortOrder = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY ${validSortBy} ${validSortOrder}`;

    // Add pagination
    query += ' LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

    // Execute queries
    const [products] = await pool.query(query, params);
    const [[{ total }]] = await pool.query(countQuery, countParams);

    // Parse tags JSON
    const parsedProducts = products.map(product => ({
        ...product,
        tags: JSON.parse(product.tags || '[]')
    }));

    res.json({
        success: true,
        data: {
            products: parsedProducts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        }
    });
});

// Get single product
export const getProductById = asyncHandler(async (req, res) => {
    const [products] = await pool.query(
        'SELECT * FROM products WHERE id = ? AND is_active = true',
        [req.params.id]
    );

    if (products.length === 0) {
        throw new AppError('Product not found', 404);
    }

    const product = {
        ...products[0],
        tags: JSON.parse(products[0].tags || '[]')
    };

    res.json({
        success: true,
        data: { product }
    });
});

// Update product
export const updateProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { 
        name, 
        description, 
        price, 
        currency,
        stock_quantity,
        category,
        tag,
        customTag,
        is_active 
    } = req.body;

    // Check if product exists
    const [existing] = await pool.query(
        'SELECT * FROM products WHERE id = ?',
        [id]
    );

    if (existing.length === 0) {
        throw new AppError('Product not found', 404);
    }

    // Handle tag
    let tags = existing[0].tags ? JSON.parse(existing[0].tags) : [];
    if (tag) {
        if (tag === 'other' && customTag) {
            tags = [customTag];
        } else if (tag !== 'other') {
            tags = [tag];
        }
    }

    // Handle image upload
    let imageUrl = existing[0].image_url;
    if (req.file) {
        // Delete old image if exists
        if (imageUrl) {
            deleteOldImage(imageUrl);
        }
        imageUrl = `/uploads/${req.file.filename}`;
    }

    // Update product
    await pool.query(
        `UPDATE products 
         SET name = COALESCE(?, name),
             description = COALESCE(?, description),
             price = COALESCE(?, price),
             currency = COALESCE(?, currency),
             stock_quantity = COALESCE(?, stock_quantity),
             category = COALESCE(?, category),
             tags = COALESCE(?, tags),
             image_url = COALESCE(?, image_url),
             is_active = COALESCE(?, is_active)
         WHERE id = ?`,
        [name, description, price, currency, stock_quantity, 
         category, tags.length ? JSON.stringify(tags) : null, 
         imageUrl, is_active, id]
    );

    // Get updated product
    const [products] = await pool.query(
        'SELECT * FROM products WHERE id = ?',
        [id]
    );

    res.json({
        success: true,
        message: 'Product updated successfully',
        data: {
            product: {
                ...products[0],
                tags: JSON.parse(products[0].tags || '[]')
            }
        }
    });
});

// Delete product (soft delete)
export const deleteProduct = asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [result] = await pool.query(
        'UPDATE products SET is_active = false WHERE id = ?',
        [id]
    );

    if (result.affectedRows === 0) {
        throw new AppError('Product not found', 404);
    }

    res.json({
        success: true,
        message: 'Product deleted successfully'
    });
});

// Get product categories
export const getCategories = asyncHandler(async (req, res) => {
    const [categories] = await pool.query(
        'SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND is_active = true'
    );
    
    res.json({
        success: true,
        data: {
            categories: categories.map(c => c.category)
        }
    });
});

// Update product stock
export const updateStock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { quantity, operation = 'set' } = req.body;

    const [product] = await pool.query(
        'SELECT stock_quantity FROM products WHERE id = ?',
        [id]
    );

    if (product.length === 0) {
        throw new AppError('Product not found', 404);
    }

    let newQuantity;
    if (operation === 'add') {
        newQuantity = product[0].stock_quantity + quantity;
    } else if (operation === 'subtract') {
        newQuantity = product[0].stock_quantity - quantity;
        if (newQuantity < 0) {
            throw new AppError('Insufficient stock', 400);
        }
    } else {
        newQuantity = quantity;
    }

    await pool.query(
        'UPDATE products SET stock_quantity = ? WHERE id = ?',
        [newQuantity, id]
    );

    res.json({
        success: true,
        message: 'Stock updated successfully',
        data: { stock_quantity: newQuantity }
    });
});