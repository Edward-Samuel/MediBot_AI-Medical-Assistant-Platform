const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const faqService = require('../services/faqService');
const { adminAuth, checkPermission } = require('../middleware/adminAuth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/faq');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['pdf', 'docx', 'txt', 'csv', 'md'];
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
  
  if (allowedTypes.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type. Allowed types: ${allowedTypes.join(', ')}`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Public route: Search FAQs and get answer
router.post('/search', async (req, res) => {
  try {
    const { query, category, limit = 5 } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        message: 'Query is required'
      });
    }

    if (query.trim().length < 3) {
      return res.status(400).json({
        message: 'Query must be at least 3 characters long'
      });
    }

    // Search for relevant FAQs
    const searchResults = await faqService.searchFAQ(query.trim(), {
      limit: parseInt(limit),
      category: category || undefined
    });

    // Generate answer based on search results
    const answer = await faqService.generateAnswer(query.trim(), searchResults);

    res.json({
      query: query.trim(),
      answer,
      searchResults: {
        totalResults: searchResults.totalResults,
        source: searchResults.source,
        results: searchResults.results.map(result => ({
          title: result.title,
          category: result.category,
          score: result.score,
          uploadedAt: result.uploadedAt
        }))
      }
    });

  } catch (error) {
    console.error('FAQ search error:', error);
    res.status(500).json({
      message: 'Error searching FAQs',
      error: error.message
    });
  }
});

// Public route: Get available categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await faqService.getCategories();
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      message: 'Error fetching categories'
    });
  }
});

// Admin route: Upload FAQ file
router.post('/upload', adminAuth, checkPermission('canUpload'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        message: 'No file uploaded'
      });
    }

    const { title, category, description, tags } = req.body;

    const fileData = {
      filePath: req.file.path,
      originalName: req.file.originalname,
      fileSize: req.file.size,
      title: title || req.file.originalname,
      category: category || 'General',
      description: description || '',
      tags: tags ? tags.split(',').map(tag => tag.trim()) : []
    };

    const faq = await faqService.uploadFAQ(fileData, req.admin._id);

    // Clean up uploaded file
    try {
      await fs.unlink(req.file.path);
    } catch (cleanupError) {
      console.error('Error cleaning up uploaded file:', cleanupError);
    }

    res.status(201).json({
      message: 'FAQ uploaded successfully',
      faq: {
        id: faq._id,
        title: faq.title,
        category: faq.category,
        fileType: faq.fileType,
        fileSize: faq.fileSize,
        chunksCount: faq.chunks.length,
        isActive: faq.isActive,
        uploadedAt: faq.uploadedAt
      }
    });

  } catch (error) {
    console.error('FAQ upload error:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up uploaded file:', cleanupError);
      }
    }

    res.status(500).json({
      message: 'Error uploading FAQ',
      error: error.message
    });
  }
});

// Admin route: Get all FAQs
router.get('/admin/list', adminAuth, async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      isActive, 
      sortBy = 'uploadedAt',
      sortOrder = 'desc' 
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      category,
      isActive: isActive !== undefined ? isActive === 'true' : undefined,
      sortBy,
      sortOrder
    };

    const result = await faqService.getAllFAQs(options);

    res.json(result);

  } catch (error) {
    console.error('Get FAQs list error:', error);
    res.status(500).json({
      message: 'Error fetching FAQs'
    });
  }
});

// Admin route: Get FAQ statistics
router.get('/admin/stats', adminAuth, async (req, res) => {
  try {
    const stats = await faqService.getStats();
    res.json({ stats });
  } catch (error) {
    console.error('Get FAQ stats error:', error);
    res.status(500).json({
      message: 'Error fetching FAQ statistics'
    });
  }
});

// Admin route: Test FAQ search (for debugging)
router.post('/admin/test-search', adminAuth, async (req, res) => {
  try {
    const { query, category, limit = 5 } = req.body;

    if (!query) {
      return res.status(400).json({
        message: 'Query is required'
      });
    }

    const searchResults = await faqService.searchFAQ(query, {
      limit: parseInt(limit),
      category,
      includeInactive: true // Include inactive FAQs for admin testing
    });

    res.json({
      query,
      searchResults,
      serviceStatus: {
        faqServiceInitialized: faqService.isInitialized(),
        pineconeAvailable: faqService.isInitialized()
      }
    });

  } catch (error) {
    console.error('Test FAQ search error:', error);
    res.status(500).json({
      message: 'Error testing FAQ search',
      error: error.message
    });
  }
});

// Admin route: Get FAQ by ID
router.get('/admin/:faqId', adminAuth, async (req, res) => {
  try {
    const { faqId } = req.params;
    const faq = await faqService.getFAQById(faqId);

    if (!faq) {
      return res.status(404).json({
        message: 'FAQ not found'
      });
    }

    res.json({ faq });

  } catch (error) {
    console.error('Get FAQ by ID error:', error);
    res.status(500).json({
      message: 'Error fetching FAQ'
    });
  }
});

// Admin route: Update FAQ status
router.put('/admin/:faqId/status', adminAuth, async (req, res) => {
  try {
    const { faqId } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        message: 'isActive must be a boolean value'
      });
    }

    const faq = await faqService.updateFAQStatus(faqId, isActive);

    res.json({
      message: `FAQ ${isActive ? 'activated' : 'deactivated'} successfully`,
      faq: {
        id: faq._id,
        title: faq.title,
        isActive: faq.isActive,
        lastUpdated: faq.lastUpdated
      }
    });

  } catch (error) {
    console.error('Update FAQ status error:', error);
    res.status(500).json({
      message: 'Error updating FAQ status',
      error: error.message
    });
  }
});

// Admin route: Delete FAQ
router.delete('/admin/:faqId', adminAuth, checkPermission('canDelete'), async (req, res) => {
  try {
    const { faqId } = req.params;
    
    await faqService.deleteFAQ(faqId);

    res.json({
      message: 'FAQ deleted successfully'
    });

  } catch (error) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({
      message: 'Error deleting FAQ',
      error: error.message
    });
  }
});

module.exports = router;