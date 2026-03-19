import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  History,
  MessageCircle,
  Trash2,
  Search,
  X,
  Plus,
  Loader2,
} from 'lucide-react';
import axios from '../../config/axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { getRelativeTime } from '../../utils/dateFormatter';

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

const LoadingSpinner = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]}`} />;
};

const ChatHistory = ({
  onLoadSession,
  currentSessionId,
  isOpen,
  onClose,
  onNewSession,
  onSessionDeleted,
}) => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [requestError, setRequestError] = useState('');

  const cacheRef = useRef({
    sessions: [],
    lastFetch: 0,
    isInitialized: false,
  });

  const abortControllerRef = useRef(null);
  const searchAbortControllerRef = useRef(null);
  const CACHE_DURATION = 30000;
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const api = useMemo(() => {
    const token = localStorage.getItem('adminToken') || localStorage.getItem('token');
    return axios.create({
      timeout: 8000,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }, []);

  const loadSessions = useCallback(
    async (forceRefresh = false) => {
      if (!user) return;

      const now = Date.now();
      const cache = cacheRef.current;

      if (
        !forceRefresh &&
        cache.sessions.length > 0 &&
        now - cache.lastFetch < CACHE_DURATION
      ) {
        setRequestError('');
        setSessions(cache.sessions);
        return;
      }

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setLoading(true);
      setRequestError('');

      try {
        const response = await api.get('/api/chat-history/sessions', {
          signal: abortControllerRef.current.signal,
        });

        const sortedSessions = (response.data.sessions || []).sort(
          (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
        );

        cache.sessions = sortedSessions;
        cache.lastFetch = now;
        cache.isInitialized = true;
        setSessions(sortedSessions);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error loading sessions:', error);
          setRequestError('Chat history is unavailable right now.');
          toast.error('Failed to load chat history');
        }
      } finally {
        setLoading(false);
      }
    },
    [user, api],
  );

  const searchSessions = useCallback(
    async (query) => {
      if (!user || !query.trim()) {
        setIsSearching(false);
        setSearchLoading(false);
        setRequestError('');
        setSessions(cacheRef.current.sessions);
        return;
      }

      if (searchAbortControllerRef.current) {
        searchAbortControllerRef.current.abort();
      }
      searchAbortControllerRef.current = new AbortController();

      setIsSearching(true);
      setSearchLoading(true);
      setRequestError('');

      try {
        const response = await api.get('/api/chat-history/search', {
          params: { query: query.trim(), limit: 30 },
          signal: searchAbortControllerRef.current.signal,
        });

        setSessions(response.data.results || []);
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Search error:', error);
          setRequestError('Search is unavailable right now.');
          toast.error('Search failed');
        }
      } finally {
        setSearchLoading(false);
      }
    },
    [user, api],
  );

  const deleteSession = useCallback(
    async (sessionId, e) => {
      e.stopPropagation();
      if (!user) return;

      const originalSessions = sessions;
      const updatedSessions = sessions.filter((session) => session.sessionId !== sessionId);
      setSessions(updatedSessions);
      cacheRef.current.sessions = updatedSessions;

      try {
        await api.delete(`/api/chat-history/session/${sessionId}`);
        if (sessionId === currentSessionId && onSessionDeleted) {
          onSessionDeleted();
        }
        toast.success('Chat deleted');
      } catch (error) {
        setSessions(originalSessions);
        cacheRef.current.sessions = originalSessions;
        console.error('Delete error:', error);
        setRequestError('Unable to delete that chat right now.');
        toast.error('Failed to delete chat');
      }
    },
    [user, sessions, api, currentSessionId, onSessionDeleted],
  );

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchQuery(value);

    if (value.trim()) {
      setSearchLoading(true);
    }
  }, []);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearching(false);
    setSearchLoading(false);
    setRequestError('');
    setSessions(cacheRef.current.sessions);
  }, []);

  useEffect(() => {
    if (user && !cacheRef.current.isInitialized) {
      loadSessions(true);
    } else if (!user) {
      setSessions([]);
      setSearchQuery('');
      setIsSearching(false);
      setSearchLoading(false);
      setRequestError('');
      cacheRef.current = {
        sessions: [],
        lastFetch: 0,
        isInitialized: false,
      };
    }
  }, [user, loadSessions]);

  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      searchSessions(debouncedSearchQuery);
    } else if (isSearching) {
      clearSearch();
    }
  }, [debouncedSearchQuery, isSearching, searchSessions, clearSearch]);

  useEffect(() => {
    if (isOpen && user && cacheRef.current.isInitialized) {
      const now = Date.now();
      if (now - cacheRef.current.lastFetch >= CACHE_DURATION) {
        loadSessions(false);
      }
    }
  }, [isOpen, user, loadSessions]);

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

  const formatDate = useCallback((dateString) => getRelativeTime(dateString), []);
  const getLanguageLabel = useCallback((langCode) => (langCode || 'en').toUpperCase(), []);

  const renderLoading = () => (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size="lg" />
      <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">
        {searchLoading ? 'Searching...' : 'Loading chats...'}
      </span>
    </div>
  );

  const renderError = () => (
    <div className="px-4 py-8 text-center">
      <div className="mx-auto max-w-xs rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900/40 dark:bg-red-900/10 dark:text-red-300">
        <p className="text-sm font-medium">{requestError}</p>
        <button
          onClick={() => {
            if (searchQuery.trim()) {
              searchSessions(searchQuery);
            } else {
              loadSessions(true);
            }
          }}
          className="mt-3 inline-flex items-center rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-900/20"
        >
          Try again
        </button>
      </div>
    </div>
  );

  const renderEmpty = () => (
    <div className="px-4 py-8 text-center">
      <MessageCircle className="mx-auto mb-2 h-12 w-12 text-gray-400 dark:text-gray-500" />
      <p className="text-sm text-gray-600 dark:text-gray-400">
        {searchQuery ? 'No matching conversations found' : 'No chat history yet'}
      </p>
      {!searchQuery && (
        <p className="mt-1 text-xs text-gray-500">Start a conversation to see it here.</p>
      )}
    </div>
  );

  const renderSession = (session) => (
    <div
      key={session.sessionId}
      className={`group flex cursor-pointer items-start justify-between rounded-lg border p-3 transition-all hover:bg-gray-100 dark:hover:bg-gray-800 ${
        currentSessionId === session.sessionId
          ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
          : 'border-transparent'
      }`}
      onClick={() => {
        onLoadSession(session.sessionId);
        if (window.innerWidth < 1024) {
          onClose();
        }
      }}
    >
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center space-x-2">
          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            {getLanguageLabel(session.language)}
          </span>
          <h4 className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">
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
        className="p-1 text-gray-400 opacity-0 transition-all hover:text-red-500 group-hover:opacity-100 dark:text-gray-500 dark:hover:text-red-400"
        title="Delete chat"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );

  const renderContent = () => {
    if (!user) {
      return (
        <div className="p-4 text-center">
          <div className="rounded-lg border border-gray-200 bg-gray-100 p-4 dark:border-gray-700 dark:bg-gray-800">
            <History className="mx-auto mb-2 h-12 w-12 text-gray-400" />
            <h3 className="mb-2 font-medium text-gray-700 dark:text-gray-200">Login Required</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Login to save and access your chat history across sessions.
            </p>
          </div>
        </div>
      );
    }

    return (
      <>
        <div className="flex-shrink-0 border-b border-gray-200 p-4 dark:border-gray-700">
          <button
            onClick={() => {
              onNewSession();
              if (window.innerWidth < 1024) {
                onClose();
              }
            }}
            className="flex w-full items-center justify-center space-x-2 rounded-lg border border-gray-200 bg-gray-100 px-4 py-3 text-gray-900 transition-colors hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>

        <div className="flex-shrink-0 border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full rounded-md border border-gray-300 bg-white py-2 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
            {searchQuery ? (
              <button
                onClick={clearSearch}
                className="rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600 transition-colors hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                title="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => searchSessions(searchQuery)}
                className="flex items-center rounded-md border border-gray-300 bg-gray-100 px-3 py-2 text-gray-600 transition-colors hover:bg-gray-200 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
                disabled={searchLoading}
                title="Search chat history"
              >
                {searchLoading ? <LoadingSpinner size="sm" /> : <Search className="h-4 w-4" />}
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading || searchLoading
            ? renderLoading()
            : requestError
              ? renderError()
              : sessions.length === 0
                ? renderEmpty()
                : <div className="space-y-1 p-2">{sessions.map(renderSession)}</div>}
        </div>
      </>
    );
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed left-0 top-16 z-50 flex h-[calc(100vh-4rem)] w-64 transform flex-col bg-white text-gray-900 shadow-lg transition-transform duration-300 ease-in-out dark:bg-gray-900 dark:text-white lg:hidden ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span className="font-semibold">Chat History</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            title="Close chat history"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">{renderContent()}</div>
      </div>

      <div
        className={`hidden flex-shrink-0 overflow-hidden bg-white text-gray-900 transition-all duration-300 ease-in-out dark:bg-gray-900 dark:text-white lg:flex lg:flex-col ${
          isOpen
            ? 'translate-x-0 opacity-100 lg:w-64 lg:border-r lg:border-gray-200 dark:lg:border-gray-700'
            : 'pointer-events-none -translate-x-full opacity-0 lg:w-0 lg:border-r-0'
        }`}
      >
        <div className="flex flex-shrink-0 items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span className="font-semibold">Chat History</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
            title="Close chat history"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex h-[calc(100vh-8rem)] flex-col overflow-hidden">{renderContent()}</div>
      </div>
    </>
  );
};

export default ChatHistory;
