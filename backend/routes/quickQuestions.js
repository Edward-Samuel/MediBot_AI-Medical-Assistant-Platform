const express = require('express');
const router = express.Router();
const quickQuestionsService = require('../services/quickQuestionsService');
const { optionalAuth } = require('../middleware/auth');

/**
 * GET /api/quick-questions
 * Get personalized quick questions for the user
 * Query params:
 *   - language: Language code (default: 'en')
 *   - count: Number of questions to return (default: 5)
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { language = 'en', count = 5 } = req.query;
    const userId = req.user?.userId || null;

    // Validate count
    const questionCount = Math.min(Math.max(parseInt(count) || 5, 3), 10);

    // Generate personalized questions
    const questions = await quickQuestionsService.generateQuestions(
      userId,
      language,
      questionCount
    );

    res.json({
      success: true,
      questions,
      personalized: !!userId,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generating quick questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate quick questions',
      error: error.message
    });
  }
});

module.exports = router;
