import React, { useState } from 'react';
import { Upload, FileText, X, Loader } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const FAQUpload = ({ adminData, onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    category: 'General',
    description: '',
    tags: ''
  });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const supportedTypes = ['pdf', 'docx', 'txt', 'csv', 'md'];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
    if (!supportedTypes.includes(fileExtension)) {
      toast.error(`Unsupported file type. Supported types: ${supportedTypes.join(', ')}`);
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
      toast.error('File size must be less than 10MB');
      return;
    }

    setFile(selectedFile);
    if (!formData.title) {
      setFormData(prev => ({
        ...prev,
        title: selectedFile.name.replace(/\.[^/.]+$/, '')
      }));
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRemoveFile = () => {
    setFile(null);
    setUploadProgress(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    if (!formData.title.trim()) {
      toast.error('Please enter a title');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const uploadData = new FormData();
      uploadData.append('file', file);
      uploadData.append('title', formData.title.trim());
      uploadData.append('category', formData.category);
      uploadData.append('description', formData.description.trim());
      uploadData.append('tags', formData.tags);

      const token = localStorage.getItem('adminToken');
      await axios.post('/api/faq/upload', uploadData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      toast.success('FAQ uploaded successfully!');
      
      // Reset form
      setFile(null);
      setFormData({
        title: '',
        category: 'General',
        description: '',
        tags: ''
      });
      setUploadProgress(0);

      // Notify parent component
      if (onUploadSuccess) {
        onUploadSuccess();
      }

    } catch (error) {
      console.error('Upload error:', error);
      const message = error.response?.data?.message || 'Upload failed. Please try again.';
      toast.error(message);
    } finally {
      setIsUploading(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Upload className="h-6 w-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          Upload FAQ Document
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select File
          </label>
          
          {!file ? (
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center hover:border-blue-400 dark:hover:border-blue-500 transition-colors">
              <input
                type="file"
                accept=".pdf,.docx,.txt,.csv,.md"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload"
                disabled={isUploading}
              />
              <label
                htmlFor="file-upload"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <FileText className="h-12 w-12 text-gray-400" />
                <div>
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    Click to upload
                  </span>
                  <span className="text-gray-500 dark:text-gray-400"> or drag and drop</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Supported formats: {supportedTypes.join(', ').toUpperCase()}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Maximum file size: 10MB
                </p>
              </label>
            </div>
          ) : (
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FileText className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {file.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                </div>
                {!isUploading && (
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              {isUploading && (
                <div className="mt-3">
                  <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Enter FAQ title"
              disabled={isUploading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              disabled={isUploading}
            >
              <option value="General">General</option>
              <option value="Medical">Medical</option>
              <option value="Appointments">Appointments</option>
              <option value="Procedures">Procedures</option>
              <option value="Medications">Medications</option>
              <option value="Insurance">Insurance</option>
              <option value="Emergency">Emergency</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Brief description of the FAQ content"
            disabled={isUploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tags
          </label>
          <input
            type="text"
            name="tags"
            value={formData.tags}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            placeholder="Enter tags separated by commas (e.g., medical, symptoms, treatment)"
            disabled={isUploading}
          />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Separate multiple tags with commas
          </p>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={!file || isUploading || !formData.title.trim()}
            className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors"
          >
            {isUploading ? (
              <>
                <Loader className="h-4 w-4 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                <span>Upload FAQ</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Upload Guidelines */}
      <div className="mt-8 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
          Upload Guidelines
        </h3>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Ensure documents contain accurate and up-to-date medical information</li>
          <li>• Use clear, descriptive titles for easy identification</li>
          <li>• Categorize documents appropriately for better organization</li>
          <li>• Add relevant tags to improve searchability</li>
          <li>• Review content before uploading to maintain quality standards</li>
        </ul>
      </div>
    </div>
  );
};

export default FAQUpload;