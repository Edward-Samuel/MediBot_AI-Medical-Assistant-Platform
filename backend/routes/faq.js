const express = require('express');
const FAQ = require('../models/FAQ');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware to authenticate user
const authenticateToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token.' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }
  next();
};

// Get all FAQs (public endpoint)
router.get('/', async (req, res) => {
  try {
    const { category, search, page = 1, limit = 20 } = req.query;
    
    let query = { isActive: true };
    
    // Add category filter
    if (category && category !== 'all') {
      query.category = category;
    }
    
    // Add search functionality for RAG
    if (search) {
      query.$text = { $search: search };
    }
    
    const faqs = await FAQ.find(query)
      .sort(search ? { score: { $meta: 'textScore' }, priority: -1 } : { priority: -1, createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('createdBy', 'profile.firstName profile.lastName')
      .populate('updatedBy', 'profile.firstName profile.lastName');

    const total = await FAQ.countDocuments(query);

    res.json({
      faqs,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });

  } catch (error) {
    console.error('Get FAQs error:', error);
    res.status(500).json({ message: 'Error fetching FAQs' });
  }
});

// Get FAQ categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await FAQ.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Error fetching categories' });
  }
});

// Search FAQs for RAG (enhanced search)
router.post('/search', async (req, res) => {
  try {
    const { query, limit = 5 } = req.body;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Text search with scoring
    const faqs = await FAQ.find(
      { 
        $text: { $search: query },
        isActive: true 
      },
      { score: { $meta: 'textScore' } }
    )
    .sort({ score: { $meta: 'textScore' }, priority: -1 })
    .limit(limit);

    // If no text search results, try partial matching
    if (faqs.length === 0) {
      const partialFaqs = await FAQ.find({
        $or: [
          { question: { $regex: query, $options: 'i' } },
          { answer: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ],
        isActive: true
      })
      .sort({ priority: -1 })
      .limit(limit);
      
      return res.json({ faqs: partialFaqs, searchType: 'partial' });
    }

    res.json({ faqs, searchType: 'text' });

  } catch (error) {
    console.error('Search FAQs error:', error);
    res.status(500).json({ message: 'Error searching FAQs' });
  }
});

// Get single FAQ by ID
router.get('/:id', async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id)
      .populate('createdBy', 'profile.firstName profile.lastName')
      .populate('updatedBy', 'profile.firstName profile.lastName');

    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    // Increment view count
    await faq.incrementViewCount();

    res.json({ faq });

  } catch (error) {
    console.error('Get FAQ error:', error);
    res.status(500).json({ message: 'Error fetching FAQ' });
  }
});

// Mark FAQ as helpful
router.post('/:id/helpful', async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    await faq.markHelpful();
    res.json({ message: 'Marked as helpful', helpfulCount: faq.helpfulCount });

  } catch (error) {
    console.error('Mark helpful error:', error);
    res.status(500).json({ message: 'Error marking FAQ as helpful' });
  }
});

// Mark FAQ as not helpful
router.post('/:id/not-helpful', async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    await faq.markNotHelpful();
    res.json({ message: 'Marked as not helpful', notHelpfulCount: faq.notHelpfulCount });

  } catch (error) {
    console.error('Mark not helpful error:', error);
    res.status(500).json({ message: 'Error marking FAQ as not helpful' });
  }
});

// Admin routes below this point
router.use(authenticateToken);
router.use(requireAdmin);

// Create new FAQ (admin only)
router.post('/', async (req, res) => {
  try {
    const { question, answer, category, tags, priority } = req.body;

    if (!question || !answer) {
      return res.status(400).json({ message: 'Question and answer are required' });
    }

    const faq = new FAQ({
      question,
      answer,
      category: category || 'General',
      tags: tags || [],
      priority: priority || 0,
      createdBy: req.user._id,
      updatedBy: req.user._id
    });

    await faq.save();
    await faq.populate('createdBy', 'profile.firstName profile.lastName');

    res.status(201).json({ faq, message: 'FAQ created successfully' });

  } catch (error) {
    console.error('Create FAQ error:', error);
    res.status(500).json({ message: 'Error creating FAQ' });
  }
});

// Update FAQ (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { question, answer, category, tags, priority, isActive } = req.body;

    const faq = await FAQ.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    // Update fields
    if (question !== undefined) faq.question = question;
    if (answer !== undefined) faq.answer = answer;
    if (category !== undefined) faq.category = category;
    if (tags !== undefined) faq.tags = tags;
    if (priority !== undefined) faq.priority = priority;
    if (isActive !== undefined) faq.isActive = isActive;
    
    faq.updatedBy = req.user._id;

    await faq.save();
    await faq.populate('createdBy', 'profile.firstName profile.lastName');
    await faq.populate('updatedBy', 'profile.firstName profile.lastName');

    res.json({ faq, message: 'FAQ updated successfully' });

  } catch (error) {
    console.error('Update FAQ error:', error);
    res.status(500).json({ message: 'Error updating FAQ' });
  }
});

// Delete FAQ (admin only)
router.delete('/:id', async (req, res) => {
  try {
    const faq = await FAQ.findById(req.params.id);
    if (!faq) {
      return res.status(404).json({ message: 'FAQ not found' });
    }

    await FAQ.findByIdAndDelete(req.params.id);
    res.json({ message: 'FAQ deleted successfully' });

  } catch (error) {
    console.error('Delete FAQ error:', error);
    res.status(500).json({ message: 'Error deleting FAQ' });
  }
});

// Get FAQ analytics (admin only)
router.get('/admin/analytics', async (req, res) => {
  try {
    const totalFAQs = await FAQ.countDocuments({ isActive: true });
    const totalViews = await FAQ.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: null, total: { $sum: '$viewCount' } } }
    ]);

    const categoryStats = await FAQ.aggregate([
      { $match: { isActive: true } },
      { 
        $group: { 
          _id: '$category', 
          count: { $sum: 1 },
          totalViews: { $sum: '$viewCount' },
          avgHelpful: { $avg: '$helpfulCount' }
        } 
      },
      { $sort: { count: -1 } }
    ]);

    const topFAQs = await FAQ.find({ isActive: true })
      .sort({ viewCount: -1 })
      .limit(10)
      .select('question viewCount helpfulCount notHelpfulCount');

    res.json({
      summary: {
        totalFAQs,
        totalViews: totalViews[0]?.total || 0
      },
      categoryStats,
      topFAQs
    });

  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ message: 'Error fetching analytics' });
  }
});

module.exports = router;