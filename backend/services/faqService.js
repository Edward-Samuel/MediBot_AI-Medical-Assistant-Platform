const FAQ = require('../models/FAQ');

class FAQService {
  // Search FAQs using text search and return relevant results for RAG
  async searchFAQs(query, limit = 3) {
    try {
      if (!query || query.trim().length === 0) {
        return [];
      }

      // First try text search
      let faqs = await FAQ.find(
        { 
          $text: { $search: query },
          isActive: true 
        },
        { score: { $meta: 'textScore' } }
      )
      .sort({ score: { $meta: 'textScore' }, priority: -1 })
      .limit(limit)
      .select('question answer category tags priority');

      // If no text search results, try partial matching
      if (faqs.length === 0) {
        faqs = await FAQ.find({
          $or: [
            { question: { $regex: query, $options: 'i' } },
            { answer: { $regex: query, $options: 'i' } },
            { tags: { $in: [new RegExp(query, 'i')] } }
          ],
          isActive: true
        })
        .sort({ priority: -1, viewCount: -1 })
        .limit(limit)
        .select('question answer category tags priority');
      }

      return faqs;

    } catch (error) {
      console.error('FAQ search error:', error);
      return [];
    }
  }

  // Get FAQ context for RAG - formats FAQs for AI consumption
  async getFAQContext(query) {
    try {
      const faqs = await this.searchFAQs(query, 5);
      
      if (faqs.length === 0) {
        return null;
      }

      // Format FAQs for AI context
      const faqContext = faqs.map((faq, index) => {
        return `FAQ ${index + 1}:
Question: ${faq.question}
Answer: ${faq.answer}
Category: ${faq.category}`;
      }).join('\n\n');

      return {
        context: faqContext,
        count: faqs.length,
        faqs: faqs
      };

    } catch (error) {
      console.error('Get FAQ context error:', error);
      return null;
    }
  }

  // Check if a query is FAQ-related
  isFAQQuery(message) {
    const faqKeywords = [
      'how do i', 'how to', 'what is', 'what are', 'can i', 'is it',
      'help', 'question', 'faq', 'frequently asked', 'guide', 'tutorial',
      'explain', 'tell me about', 'information about', 'details about'
    ];

    const lowerMessage = message.toLowerCase();
    return faqKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  // Get popular FAQs
  async getPopularFAQs(limit = 10) {
    try {
      return await FAQ.find({ isActive: true })
        .sort({ viewCount: -1, priority: -1 })
        .limit(limit)
        .select('question answer category viewCount helpfulCount');
    } catch (error) {
      console.error('Get popular FAQs error:', error);
      return [];
    }
  }

  // Get FAQs by category
  async getFAQsByCategory(category, limit = 20) {
    try {
      return await FAQ.find({ 
        category: category,
        isActive: true 
      })
      .sort({ priority: -1, viewCount: -1 })
      .limit(limit)
      .select('question answer tags viewCount helpfulCount');
    } catch (error) {
      console.error('Get FAQs by category error:', error);
      return [];
    }
  }
}

module.exports = new FAQService();