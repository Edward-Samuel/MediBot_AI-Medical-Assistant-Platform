import React, { useState, useEffect, useCallback } from 'react';
import { 
  FileText, 
  Search, 
  Eye, 
  EyeOff, 
  Trash2, 
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Tag,
  Database,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const FAQManagement = ({ adminData, onUpdate }) => {
  const [faqs, setFaqs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalFAQs, setTotalFAQs] = useState(0);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    loadFAQs();
    loadCategories();
  }, [currentPage, selectedCategory, statusFilter, loadFAQs]);

  const loadFAQs = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('adminToken');
      
      const params = new URLSearchParams({
        page: currentPage,
        limit: 10,
        sortBy: 'uploadedAt',
        sortOrder: 'desc'
      });

      if (selectedCategory) params.append('category', selectedCategory);
      if (statusFilter !== 'all') params.append('isActive', statusFilter === 'active');

      const response = await axios.get(`/api/faq/admin/list?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setFaqs(response.data.faqs || []);
      setTotalPages(response.data.totalPages || 1);
      setTotalFAQs(response.data.totalFAQs || 0);
    } catch (error) {
      console.error('Error loading FAQs:', error);
      toast.error('Failed to load FAQs');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategory, statusFilter]);

  const loadCategories = async () => {
    try {
      const response = await axios.get('/api/faq/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleStatusToggle = async (faqId, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await axios.put(`/api/faq/admin/${faqId}/status`, {
        isActive: !currentStatus
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(`FAQ ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      loadFAQs();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error updating FAQ status:', error);
      toast.error('Failed to update FAQ status');
    }
  };

  const handleDelete = async (faqId, title) => {
    if (!adminData.permissions.canDelete) {
      toast.error('You do not have permission to delete FAQs');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(`/api/faq/admin/${faqId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('FAQ deleted successfully');
      loadFAQs();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      toast.error('Failed to delete FAQ');
    }
  };

  const filteredFAQs = faqs.filter(faq =>
    faq.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <FileText className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Manage FAQs
        </h2>
      </div>

      {/* Filters and Search */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search FAQs by title or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">All Categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={loadFAQs}
            className="flex items-center space-x-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <span>
            Showing {filteredFAQs.length} of {totalFAQs} FAQs
          </span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>
      </div>

      {/* FAQ List */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading FAQs...</p>
        </div>
      ) : filteredFAQs.length === 0 ? (
        <div className="text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No FAQs found</h3>
          <p className="text-gray-600 dark:text-gray-400">
            {searchTerm || selectedCategory || statusFilter !== 'all'
              ? 'Try adjusting your search criteria'
              : 'Upload your first FAQ document to get started'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredFAQs.map((faq) => (
            <div
              key={faq._id}
              className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {faq.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      faq.isActive
                        ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                    }`}>
                      {faq.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mb-3">
                    <div className="flex items-center space-x-1">
                      <Tag className="h-4 w-4" />
                      <span>{faq.category}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <FileText className="h-4 w-4" />
                      <span>{faq.fileType?.toUpperCase()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Database className="h-4 w-4" />
                      <span>{formatFileSize(faq.fileSize)}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDate(faq.uploadedAt)}</span>
                    </div>
                  </div>

                  {faq.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {faq.description}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>{faq.chunks?.length || 0} chunks</span>
                    {faq.uploadedBy && (
                      <span>Uploaded by {faq.uploadedBy.username}</span>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  {/* Toggle Status */}
                  <button
                    onClick={() => handleStatusToggle(faq._id, faq.isActive)}
                    className={`p-2 rounded-md transition-colors ${
                      faq.isActive
                        ? 'text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900'
                        : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                    title={faq.isActive ? 'Deactivate FAQ' : 'Activate FAQ'}
                  >
                    {faq.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>

                  {/* Delete */}
                  {adminData.permissions.canDelete && (
                    <button
                      onClick={() => handleDelete(faq._id, faq.title)}
                      className="p-2 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900 rounded-md transition-colors"
                      title="Delete FAQ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-2">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + 1;
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 text-sm rounded-md transition-colors ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
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
            className="flex items-center space-x-2 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default FAQManagement;