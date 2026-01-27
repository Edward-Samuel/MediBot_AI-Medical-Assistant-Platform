import React, { useState, useEffect } from 'react';
import { Search, Loader, BookOpen, Tag, Calendar } from 'lucide-react';
import axios from 'axios';

const FAQSearch = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [recentQueries, setRecentQueries] = useState([]);

  // Load categories on component mount
  useEffect(() => {
    loadCategories();
    loadRecentQueries();
  }, []);

  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/faq/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadRecentQueries = () => {
    const saved = localStorage.getItem('faq_recent_queries');
    if (saved) {
      setRecentQueries(JSON.parse(saved));
    }
  };

  const saveRecentQuery = (query) => {
    const updated = [query, ...recentQueries.filter(q => q !== query)].slice(0, 5);
    setRecentQueries(updated);
    localStorage.setItem('faq_recent_queries', JSON.stringify(updated));
  };

  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await axios.post('/api/faq/search', {
        query: searchQuery.trim(),
        category: selectedCategory || undefined,
        limit: 5
      });

      setResult(response.data);
      saveRecentQuery(searchQuery.trim());
    } catch (error) {
      console.error('FAQ search error:', error);
      setResult({
        query: searchQuery,
        answer: 'Sorry, there was an error searching the FAQ database. Please try again.',
        searchResults: { totalResults: 0, results: [] }
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSearch();
  };

  const handleRecentQueryClick = (recentQuery) => {
    setQuery(recentQuery);
    handleSearch(recentQuery);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <BookOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            FAQ Assistant
          </h2>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask a question about medical topics..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                disabled={isLoading}
              />
            </div>
            
            {categories.length > 0 && (
              <div className="sm:w-48">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={isLoading}
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <Loader className="h-5 w-5 animate-spin" />
              ) : (
                <Search className="h-5 w-5" />
              )}
              <span>{isLoading ? 'Searching...' : 'Search'}</span>
            </button>
          </div>
        </form>

        {/* Recent Queries */}
        {recentQueries.length > 0 && !result && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Recent Queries
            </h3>
            <div className="flex flex-wrap gap-2">
              {recentQueries.map((recentQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentQueryClick(recentQuery)}
                  className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-sm transition-colors"
                >
                  {recentQuery}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {result && (
          <div className="mt-8 space-y-6">
            {/* Answer */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3">
                Answer
              </h3>
              <div className="text-gray-800 dark:text-gray-200 leading-relaxed">
                {result.answer}
              </div>
            </div>

            {/* Search Metadata */}
            {result.searchResults && result.searchResults.totalResults > 0 && (
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span>
                      Found {result.searchResults.totalResults} relevant document{result.searchResults.totalResults !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center space-x-1">
                      <span>Source: {result.searchResults.source}</span>
                    </span>
                  </div>
                </div>

                {/* Source Documents */}
                {result.searchResults.results && result.searchResults.results.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Source Documents
                    </h4>
                    <div className="space-y-2">
                      {result.searchResults.results.map((source, index) => (
                        <div
                          key={index}
                          className="flex items-start space-x-3 p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-600"
                        >
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h5 className="font-medium text-gray-900 dark:text-white text-sm">
                                {source.title}
                              </h5>
                              {source.category && (
                                <span className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                                  <Tag className="h-3 w-3" />
                                  <span>{source.category}</span>
                                </span>
                              )}
                            </div>
                            {source.uploadedAt && (
                              <div className="flex items-center space-x-1 text-xs text-gray-500 dark:text-gray-400">
                                <Calendar className="h-3 w-3" />
                                <span>
                                  {new Date(source.uploadedAt).toLocaleDateString()}
                                </span>
                              </div>
                            )}
                          </div>
                          {source.score && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {Math.round(source.score * 100)}% match
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* No Results */}
            {result.searchResults && result.searchResults.totalResults === 0 && (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No FAQ documents found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try rephrasing your question or using different keywords.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQSearch;