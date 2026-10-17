import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
  uploadResource, 
  getDownloadUrl,
  deleteResource,
  getResources
} from '../controllers/resourceController.js';
import { uploadToMemory } from '../config/supabase.js';

const router = express.Router();

/**
 * @desc    Multer error handler middleware
 */
const multerErrorHandler = (err, req, res, next) => {
  if (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next();
};

// @route   GET /api/resources/ping
// @desc    Check if resource routes are active
router.get('/ping', (req, res) => res.json({ status: 'Resource routes active' }));

// @route   POST /api/resources/upload
// @desc    Upload a file to Supabase
router.post('/upload', protect, uploadToMemory.single('file'), multerErrorHandler, uploadResource);

// @route   GET /api/resources/:id/download
// @desc    Get download URL for a resource
router.get('/:id/download', protect, getDownloadUrl);

// Existing routes for group-specific resources
router.get('/group/:id', protect, getResources);
router.delete('/:resourceId', protect, deleteResource);

export default router;
