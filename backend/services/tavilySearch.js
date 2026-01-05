const axios = require('axios');

class TavilySearchService {
  constructor() {
    this.apiKey = process.env.TAVILY_API_KEY;
    this.baseUrl = 'https://api.tavily.com/search';
    this.initialized = !!this.apiKey;
    
    if (!this.initialized) {
      console.log('⚠️  Tavily Search API key not found - web search will be disabled');
    }
  }

  async searchMedical(query, options = {}) {
    if (!this.initialized) {
      throw new Error('Tavily Search API not configured');
    }

    try {
      const {
        maxResults = 5,
        includeAnswer = true,
        includeRawContent = false,
        searchDepth = 'basic', // 'basic' or 'advanced'
        language = 'en'
      } = options;

      // Medical domain restrictions - only search trusted medical sources
      const medicalDomains = [
        'mayoclinic.org',
        'webmd.com',
        'healthline.com',
        'medicalnewstoday.com',
        'nih.gov',
        'cdc.gov',
        'who.int',
        'medlineplus.gov',
        'clevelandclinic.org',
        'hopkinsmedicine.org',
        'harvard.edu',
        'ncbi.nlm.nih.gov',
        'pubmed.ncbi.nlm.nih.gov',
        'bmj.com',
        'thelancet.com',
        'nejm.org',
        'nature.com',
        'sciencedirect.com',
        'uptodate.com',
        'drugs.com',
        'rxlist.com',
        'medscape.com',
        'emedicine.medscape.com',
        'patient.info',
        'nhs.uk',
        'healthdirect.gov.au',
        'health.gov',
        'fda.gov',
        'aafp.org',
        'acog.org',
        'heart.org',
        'cancer.org',
        'diabetes.org',
        'arthritis.org',
        'alzheimers.org.uk',
        'parkinson.org',
        'epilepsy.com',
        'asthma.org.uk',
        'copdfoundation.org'
      ];

      // Enhanced medical query with context
      const medicalQuery = `medical health ${query} symptoms treatment diagnosis`;

      const requestData = {
        api_key: this.apiKey,
        query: medicalQuery,
        search_depth: searchDepth,
        include_answer: includeAnswer,
        include_raw_content: includeRawContent,
        max_results: maxResults,
        include_domains: medicalDomains, // Restrict to medical domains only
        exclude_domains: [
          'reddit.com',
          'quora.com',
          'yahoo.com',
          'answers.com',
          'ehow.com',
          'wikihow.com',
          'facebook.com',
          'twitter.com',
          'instagram.com',
          'tiktok.com',
          'youtube.com' // Exclude social media and unreliable sources
        ]
      };

      console.log(`🔍 Searching medical information for: "${query}"`);
      
      const response = await axios.post(this.baseUrl, requestData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      });

      const searchResults = response.data;
      
      // Filter and validate results
      const validResults = this.filterMedicalResults(searchResults.results || []);
      
      console.log(`✅ Found ${validResults.length} medical search results`);
      
      return {
        query: query,
        answer: searchResults.answer || null,
        results: validResults,
        searchTime: new Date().toISOString(),
        totalResults: validResults.length
      };

    } catch (error) {
      console.error('❌ Tavily search error:', error.message);
      
      if (error.response?.status === 401) {
        throw new Error('Invalid Tavily API key');
      } else if (error.response?.status === 429) {
        throw new Error('Tavily API rate limit exceeded');
      } else if (error.code === 'ECONNABORTED') {
        throw new Error('Search request timeout');
      } else {
        throw new Error(`Search failed: ${error.message}`);
      }
    }
  }

  filterMedicalResults(results) {
    return results
      .filter(result => {
        // Additional filtering for medical relevance
        const title = (result.title || '').toLowerCase();
        const content = (result.content || '').toLowerCase();
        const url = (result.url || '').toLowerCase();
        
        // Must contain medical keywords
        const medicalKeywords = [
          'health', 'medical', 'medicine', 'doctor', 'treatment', 'symptom',
          'diagnosis', 'disease', 'condition', 'therapy', 'patient', 'clinical',
          'hospital', 'healthcare', 'wellness', 'prevention', 'cure', 'medication',
          'drug', 'pharmaceutical', 'surgery', 'procedure', 'specialist'
        ];
        
        const hasRelevantContent = medicalKeywords.some(keyword => 
          title.includes(keyword) || content.includes(keyword) || url.includes(keyword)
        );
        
        // Exclude non-medical content
        const excludeKeywords = [
          'recipe', 'cooking', 'food blog', 'restaurant', 'shopping',
          'fashion', 'beauty', 'makeup', 'entertainment', 'sports',
          'politics', 'news', 'weather', 'travel', 'hotel'
        ];
        
        const hasExcludedContent = excludeKeywords.some(keyword => 
          title.includes(keyword) || content.includes(keyword)
        );
        
        return hasRelevantContent && !hasExcludedContent && result.url && result.title;
      })
      .map(result => ({
        title: result.title,
        url: result.url,
        content: result.content,
        score: result.score || 0,
        publishedDate: result.published_date || null
      }))
      .sort((a, b) => (b.score || 0) - (a.score || 0)) // Sort by relevance score
      .slice(0, 5); // Limit to top 5 results
  }

  // Check if a query seems to be asking for web search
  isWebSearchQuery(message) {
    const webSearchIndicators = [
      'search for',
      'look up',
      'find information',
      'what does research say',
      'latest studies',
      'recent research',
      'current guidelines',
      'new treatment',
      'latest news',
      'recent developments',
      'studies show',
      'research shows',
      'according to studies',
      'clinical trials',
      'medical research',
      'scientific evidence',
      'peer reviewed',
      'published studies'
    ];
    
    const lowerMessage = message.toLowerCase();
    return webSearchIndicators.some(indicator => lowerMessage.includes(indicator));
  }

  // Generate search-enhanced response
  async generateSearchEnhancedResponse(query, searchResults, language = 'en') {
    if (!searchResults.results || searchResults.results.length === 0) {
      return null;
    }

    const sources = searchResults.results.map((result, index) => 
      `${index + 1}. **${result.title}** - ${result.content.substring(0, 200)}... [Source: ${new URL(result.url).hostname}]`
    ).join('\n\n');

    const response = language === 'ta' ? 
      `இணையத்தில் கிடைத்த மருத்துவ தகவல்கள்:\n\n${sources}\n\n**முக்கியம்:** இந்த தகவல்கள் பொதுவான கல்வி நோக்கத்திற்காக மட்டுமே. சரியான நோயறிதல் மற்றும் சிகிச்சைக்கு மருத்துவ நிபுணரை அணுகவும்.` :
      `Based on current medical information from trusted sources:\n\n${sources}\n\n**Important:** This information is for educational purposes only. Please consult with healthcare professionals for proper diagnosis and treatment.`;

    return response;
  }

  // Test the search functionality
  async testSearch() {
    try {
      if (!this.initialized) {
        console.log('❌ Tavily Search not configured');
        return false;
      }

      const testResult = await this.searchMedical('diabetes symptoms', { maxResults: 2 });
      console.log('✅ Tavily Search test successful');
      console.log(`   Found ${testResult.totalResults} results`);
      return true;
    } catch (error) {
      console.error('❌ Tavily Search test failed:', error.message);
      return false;
    }
  }
}

module.exports = new TavilySearchService();