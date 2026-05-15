import express from 'express';
import { protect, adminOnly } from '../middlewares/auth.middleware.js';
import { upload } from '../config/upload.js';
import {
    createProduct,
    getAllProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getCategories,
    updateStock
} from '../controllers/product.controller.js';

const router = express.Router();

// Public routes (no authentication required)
router.get('/', getAllProducts);
router.get('/categories', getCategories);
router.get('/:id', getProductById);

// Admin only routes
router.use(protect, adminOnly);
router.post('/', upload.single('image'), createProduct);
router.put('/:id', upload.single('image'), updateProduct);
router.delete('/:id', deleteProduct);
router.patch('/:id/stock', updateStock);

export default router;