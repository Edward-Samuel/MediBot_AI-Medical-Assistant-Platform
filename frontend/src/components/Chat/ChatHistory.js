import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { History, MessageCircle, Trash2, Search, X, Plus, Loader2 } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

// Simple debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Loading spinner component
const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  return (
    <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />
  );
};

const ChatHistory = ({ onLoadSession, currentSessionId, isOpen, onClose, onNewSession }) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  
  // Use refs to avoid dependency issues
  const cacheRef = useRef({
    sessions: [],
    lastFetch: 0,
    isInitialized: false
  });
  
  const abortControllerRef = useRef(null);
  const searchAbortControllerRef = useRef(null);

  // Cache duration: 30 seconds (reduced from 2 minutes to prevent stale data)
  const CACHE_DURATION = 30000;

  // Debounced search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Simple axios instance
  const api = useMemo(() => {
    return axios.create({
      timeout: 8000,
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }, []);

  // Load sessions function - simplified and optimized
  const loadSessions = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    const now = Date.now();
    const cache = cacheRef.current;

    // Use cache if valid and not forcing refresh
    if (!forceRefresh && cache.sessions.length > 0 && (now - cache.lastFetch) < CACHE_DURATION) {
      setSessions(cache.sessions);
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    
    try {
      const response = await api.get('/api/chat-history/sessions', {
        signal: abortControllerRef.current.signal
      });
      
      const newSessions = response.data.sessions || [];
      
      // Sort by most recent
      const sortedSessions = newSessions.sort((a, b) => 
        new Date(b.updatedAt) - new Date(a.updatedAt)
      );
      
      // Update cache and state
      cache.sessions = sortedSessions;
      cache.lastFetch = now;
      cache.isInitialized = true;
      
      setSessions(sortedSessions);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading sessions:', error);
        toast.error('Failed to load chat history');
      }
    } finally {
      setLoading(false);
    }
  }, [user, api]);

  // Search sessions function - simplified
  const searchSessions = useCallback(async (query) => {
    if (!user || !query.trim()) {
      setIsSearching(false);
      setSearchLoading(false);
      setSessions(cacheRef.current.sessions);
      return;
    }

    // Cancel existing search
    if (searchAbortControllerRef.current) {
      searchAbortControllerRef.current.abort();
    }
    searchAbortControllerRef.current = new AbortController();

    setIsSearching(true);
    setSearchLoading(true);
    
    try {
      const response = await api.get('/api/chat-history/search', {
        params: { query: query.trim(), limit: 30 },
        signal: searchAbortControllerRef.current.signal
      });

      setSessions(response.data.results || []);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Search error:', error);
        toast.error('Search failed');
      }
    } finally {
      setSearchLoading(false);
    }
  }, [user, api]);

  // Delete session function - simplified
  const deleteSession = useCallback(async (sessionId, e) => {
    e.stopPropagation();
    if (!user) return;

    // Optimistic update
    const originalSessions = sessions;
    const updatedSessions = sessions.filter(s => s.sessionId !== sessionId);
    setSessions(updatedSessions);
    
    // Update cache
    cacheRef.current.sessions = updatedSessions;

    try {
      await api.delete(`/api/chat-history/session/${sessionId}`);
      toast.success('Chat deleted');
    } catch (error) {
      // Revert on error
      setSessions(originalSessions);
      cacheRef.current.sessions = originalSessions;
      console.error('Delete error:', error);
      toast.error('Failed to delete chat');
    }
  }, [user, sessions, api]);

  // Handle search input
  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim()) {
      setSearchLoading(true);
    }
  }, []);

  // Clear search
  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearching(false);
    setSearchLoading(false);
    setSessions(cacheRef.current.sessions);
  }, []);

  // Initial load effect - simplified
  useEffect(() => {
    if (user && !cacheRef.current.isInitialized) {
      loadSessions(true);
    } else if (!user) {
      // Reset everything when user logs out
      setSessions([]);
      setSearchQuery('');
      setIsSearching(false);
      setSearchLoading(false);
      cacheRef.current = {
        sessions: [],
        lastFetch: 0,
        isInitialized: false
      };
    }
  }, [user, loadSessions]);

  // Search effect - simplified
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      searchSessions(debouncedSearchQuery);
    } else if (isSearching) {
      clearSearch();
    }
  }, [debouncedSearchQuery, isSearching, searchSessions, clearSearch]);

  // Sidebar open effect - simplified
  useEffect(() => {
    if (isOpen && user && cacheRef.current.isInitialized) {
      const now = Date.now();
      // Only refresh if cache is expired
      if ((now - cacheRef.current.lastFetch) >= CACHE_DURATION) {
        loadSessions(false);
      }
    }
  }, [isOpen, user, loadSessions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
    };
  }, []);

  // Format date - memoized
  const formatDate = useCallback((dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) return 'Today';
      if (diffDays === 2) return 'Yesterday';
      if (diffDays <= 7) return `${diffDays - 1}d ago`;
      return date.toLocaleDateString();
    } catch {
      return 'Unknown';
    }
  }, []);

  // Get language flag - memoized
  const getLanguageFlag = useCallback((langCode) => {
    const flags = {
      en: '🇺🇸', es: '🇪🇸', fr: '🇫�', de: '🇩🇪', it: '🇮🇹',
      pt: '🇵🇹', zh: '🇨🇳', ja: '🇯🇵', ko: '🇰🇷', ar: '🇸🇦',
      hi: '🇮🇳', ru: '🇷🇺', ta: '🇮🇳'
    };
    return flags[langCode] || '🌐';
  }, []);

  // Render loading state
  const renderLoading = () => (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size="lg" />
      <span className="ml-2 text-gray-600 dark:text-gray-400 text-sm">
        {searchLoading ? 'Searching...' : 'Loading chats...'}
      </span>
    </div>
  );

  // Render empty state
  const renderEmpty = () => (
    <div className="text-center py-8 px-4">
      <MessageCircle className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
      <p className="text-gray-600 dark:text-gray-400 text-sm">
        {searchQuery ? 'No matching conversations found' : 'No chat history yet'}
      </p>
      {!searchQuery && (
        <p className="text-gray-500 text-xs mt-1">
          Start a conversation to see it here
        </p>
      )}
    </div>
  );

  // Render session item
  const renderSession = (session) => (
    <div
      key={session.sessionId}
      className={`group flex items-start justify-between p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-800 ${
        currentSessionId === session.sessionId
          ? 'bg-gray-100 dark:bg-gray-800 border-l-2 border-blue-500'
          : ''
      }`}
      onClick={() => onLoadSession(session.sessionId)}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <span className="text-sm">{getLanguageFlag(session.language)}</span>
          <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
            {session.title}
          </h4>
        </div>
        <div className="flex items-center space-x-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center space-x-1">
            <MessageCircle className="h-3 w-3" />
            <span>{session.messageCount || 0}</span>
          </span>
          <span>{formatDate(session.updatedAt)}</span>
        </div>
      </div>
      
      <button
        onClick={(e) => deleteSession(session.sessionId, e)}
        className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 transition-all"
        title="Delete session"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  // Render content
  const renderContent = () => {
    if (!user) {
      return (
        <div className="p-4 text-center">
          <div className="bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <h3 className="font-medium text-gray-700 dark:text-gray-200 mb-2">Login Required</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Login to save and access your chat history across sessions.
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* New Chat Button */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <button
            onClick={() => {
              onNewSession();
              if (isOpen) onClose();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white px-4 py-3 rounded-lg transition-colors border border-gray-200 dark:border-gray-600"
          >
            <Plus className="h-4 w-4" />
            <span>New chat</span>
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
              />
            </div>
            {searchQuery ? (
              <button
                onClick={clearSearch}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-sm transition-colors border border-gray-300 dark:border-gray-600"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => searchSessions(searchQuery)}
                className="px-3 py-2 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-sm transition-colors border border-gray-300 dark:border-gray-600 flex items-center"
                disabled={searchLoading}
              >
                {searchLoading ? <LoadingSpinner size="sm" /> : <Search className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {(loading || searchLoading) ? renderLoading() : 
           sessions.length === 0 ? renderEmpty() : (
            <div className="space-y-1 p-2">
              {sessions.map(renderSession)}
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 flex flex-col lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span className="font-semibold">Chat History</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Mobile Content */}
        <div className="flex flex-col flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-64 bg-white dark:bg-gray-900 text-gray-900 dark:text-white flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span className="font-semibold">Chat History</span>
          </div>
        </div>

        {/* Desktop Content */}
        <div className="flex flex-col h-[calc(100vh-8rem)] overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default ChatHistory;