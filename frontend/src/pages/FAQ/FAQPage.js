import React, { useState, useEffect } from 'react';
import { Search, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, HelpCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedFAQ, setExpandedFAQ] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Fetch FAQs
  const fetchFAQs = async (page = 1, category = 'all', search = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });
      
      if (category !== 'all') {
        params.append('category', category);
      }
      
      if (search.trim()) {
        params.append('search', search.trim());
      }

      const response = await axios.get(`/api/faq?${params}`);
      
      if (response.data.faqs) {
        setFaqs(response.data.faqs);
        setTotalPages(response.data.pagination?.pages || 1);
      } else {
        setFaqs([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      toast.error('Failed to load FAQs');
      setFaqs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/faq/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Load FAQs on component mount and when filters change
  useEffect(() => {
    fetchFAQs(currentPage, selectedCategory, searchTerm);
  }, [currentPage, selectedCategory]);

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchFAQs(1, selectedCategory, searchTerm);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, []);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const toggleFAQ = (faqId) => {
    setExpandedFAQ(expandedFAQ === faqId ? null : faqId);
  };

  const markHelpful = async (faqId) => {
    try {
      await axios.post(`/api/faq/${faqId}/helpful`);
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Error marking helpful:', error);
      toast.error('Failed to submit feedback');
    }
  };

  const markNotHelpful = async (faqId) => {
    try {
      await axios.post(`/api/faq/${faqId}/not-helpful`);
      toast.success('Thank you for your feedback!');
    } catch (error) {
      console.error('Error marking not helpful:', error);
      toast.error('Failed to submit feedback');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 transition-colors duration-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <HelpCircle className="h-16 w-16 text-medical-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4 transition-colors duration-200">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Find answers to common questions about our medical platform
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search FAQs..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-medical-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-colors duration-200"
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
            >
              <option value="all">All Categories</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id}>
                  {cat._id} ({cat.count})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-medical-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading FAQs...</span>
          </div>
        )}

        {/* FAQ List */}
        {!loading && (
          <div className="space-y-4">
            {faqs.map(faq => (
              <div key={faq._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200">
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => toggleFAQ(faq._id)}
                >
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                      {faq.question}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-medical-100 text-medical-800 dark:bg-medical-900 dark:text-medical-200">
                        {faq.category}
                      </span>
                      {faq.viewCount > 0 && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {faq.viewCount} views
                        </span>
                      )}
                    </div>
                  </div>
                  {expandedFAQ === faq._id ? (
                    <ChevronUp className="h-5 w-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-400" />
                  )}
                </button>
                
                {expandedFAQ === faq._id && (
                  <div className="px-6 pb-4">
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                        {faq.answer}
                      </p>
                      
                      {faq.tags && faq.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {faq.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2 py-1 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            Was this helpful?
                          </span>
                          <button
                            onClick={() => markHelpful(faq._id)}
                            className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700 transition-colors"
                          >
                            <ThumbsUp className="h-4 w-4" />
                            Yes ({faq.helpfulCount || 0})
                          </button>
                          <button
                            onClick={() => markNotHelpful(faq._id)}
                            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700 transition-colors"
                          >
                            <ThumbsDown className="h-4 w-4" />
                            No ({faq.notHelpfulCount || 0})
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && faqs.length === 0 && (
          <div className="text-center py-12">
            <HelpCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg transition-colors duration-200 mb-2">
              No FAQs found matching your criteria
            </p>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Try adjusting your search terms or filters
            </p>
          </div>
        )}

        {/* Pagination */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center mt-8 space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Previous
            </button>
            
            <div className="flex space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-2 rounded-md transition-colors ${
                      currentPage === page
                        ? 'bg-medical-600 text-white'
                        : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQPage;