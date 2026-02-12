import React, { useState, useEffect, useCallback } from "react";
import {
  MessageCircle,
  Search,
  Filter,
  Eye,
  Trash2,
  Download,
  User,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import axios from "../../config/axios";
import toast from "react-hot-toast";

const AdminChatHistory = () => {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    language: "",
    userId: "",
    dateFrom: "",
    dateTo: "",
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalSessions: 0,
    limit: 20,
  });
  const [showFilters, setShowFilters] = useState(false);

  const loadChatSessions = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: pagination.limit,
        ...(searchTerm && { search: searchTerm }),
        ...(filters.language && { language: filters.language }),
        ...(filters.userId && { userId: filters.userId }),
      });

      const response = await axios.get(`/api/admin/chat-history?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSessions(response.data.sessions);
      setPagination((prev) => ({
        ...prev,
        totalPages: response.data.totalPages,
        totalSessions: response.data.totalSessions,
      }));
    } catch (error) {
      console.error("Error loading chat sessions:", error);
      toast.error("Failed to load chat sessions");
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, pagination.limit, searchTerm, filters]);

  useEffect(() => {
    loadChatSessions();
  }, [pagination.currentPage, searchTerm, filters, loadChatSessions]);

  const loadSessionDetails = async (sessionId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`/api/admin/chat-history/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSelectedSession(response.data);
    } catch (error) {
      console.error("Error loading session details:", error);
      toast.error("Failed to load session details");
    }
  };

  const deleteSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to delete this chat session?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`/api/admin/chat-history/${sessionId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Session deleted successfully");
      loadChatSessions();
      if (selectedSession?.sessionId === sessionId) {
        setSelectedSession(null);
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      toast.error("Failed to delete session");
    }
  };

  const exportSessions = async (format = "json") => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `/api/admin/chat-history/export/${format}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          responseType: "blob",
        },
      );

      const blob = new Blob([response.data], {
        type: format === "json" ? "application/json" : "text/csv",
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `chat-history-${new Date().toISOString().split("T")[0]}.${format}`;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Chat history exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error("Error exporting sessions:", error);
      toast.error("Failed to export sessions");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatMessageContent = (content) => {
    if (!content) {
      return "";
    }

    if (content.length > 100) {
      return content.substring(0, 100) + "...";
    }
    return content;
  };

  if (selectedSession) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedSession(null)}
              className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Back to Sessions</span>
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => deleteSession(selectedSession.sessionId)}
              className="flex items-center space-x-2 px-3 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors"
            >
              <Trash2 className="h-4 w-4" />
              <span>Delete Session</span>
            </button>
          </div>
        </div>

        {/* Session Info */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                User
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {selectedSession.user?.profile?.firstName}{" "}
                {selectedSession.user?.profile?.lastName}
                <br />
                <span className="text-gray-500">
                  {selectedSession.user?.email}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Session Info
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                {selectedSession.title}
                <br />
                <span className="text-gray-500">
                  Language: {selectedSession.language}
                </span>
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Timing
              </label>
              <p className="mt-1 text-sm text-gray-900 dark:text-white">
                Started: {formatDate(selectedSession.createdAt)}
                <br />
                <span className="text-gray-500">
                  Last: {formatDate(selectedSession.updatedAt)}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Messages ({selectedSession.messages?.length || 0})
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {selectedSession.messages?.map((message, index) => (
              <div
                key={message.id || index}
                className={`p-4 rounded-lg ${
                  message.role === "user"
                    ? "bg-blue-50 dark:bg-blue-900/20 ml-8"
                    : "bg-gray-50 dark:bg-gray-700 mr-8"
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`text-sm font-medium ${
                        message.role === "user"
                          ? "text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {message.role === "user" ? "User" : "Bot"}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formatDate(message.timestamp)}
                  </span>
                </div>
                <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                  {message.content}
                </p>
                {message.images && message.images.length > 0 && (
                  <div className="mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {message.images.length} image(s) attached
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Chat History Management
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            View and manage all user chat sessions ({pagination.totalSessions}{" "}
            total)
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => exportSessions("json")}
            className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export JSON</span>
          </button>
          <button
            onClick={() => exportSessions("csv")}
            className="flex items-center space-x-2 px-3 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={loadChatSessions}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search sessions, messages, or user info..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Language
                </label>
                <select
                  value={filters.language}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      language: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Languages</option>
                  <option value="en">English</option>
                  <option value="ta">Tamil</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User ID
                </label>
                <input
                  type="text"
                  placeholder="Filter by user ID"
                  value={filters.userId}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, userId: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      dateFrom: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, dateTo: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sessions List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Loading sessions...
            </p>
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">
              No chat sessions found
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Session
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Messages
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Last Activity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
                  {sessions.map((session) => (
                    <tr
                      key={session.sessionId}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {session.user?.profile?.firstName}{" "}
                              {session.user?.profile?.lastName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {session.user?.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {session.title}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {session.language} •{" "}
                            {session.sessionId.substring(0, 8)}...
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <MessageCircle className="h-4 w-4 text-gray-400 mr-2" />
                          <span className="text-sm text-gray-900 dark:text-white">
                            {session.messageCount}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {formatDate(session.updatedAt)}
                            </div>
                            {session.lastMessage && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {formatMessageContent(
                                  session.lastMessage.content,
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() =>
                              loadSessionDetails(session.sessionId)
                            }
                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => deleteSession(session.sessionId)}
                            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing page {pagination.currentPage} of{" "}
                    {pagination.totalPages}({pagination.totalSessions} total
                    sessions)
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          currentPage: prev.currentPage - 1,
                        }))
                      }
                      disabled={pagination.currentPage === 1}
                      className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </button>
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {pagination.currentPage} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() =>
                        setPagination((prev) => ({
                          ...prev,
                          currentPage: prev.currentPage + 1,
                        }))
                      }
                      disabled={
                        pagination.currentPage === pagination.totalPages
                      }
                      className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminChatHistory;
