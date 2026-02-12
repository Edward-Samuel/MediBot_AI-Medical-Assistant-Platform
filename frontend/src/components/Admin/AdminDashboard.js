import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Upload,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Database,
  Activity,
  TrendingUp,
  Shield,
  MessageCircle,
} from "lucide-react";
import axios from "axios";
import toast from "react-hot-toast";
import FAQUpload from "./FAQUpload";
import FAQManagement from "./FAQManagement";
import AdminStats from "./AdminStats";
import AdminChatHistory from "./AdminChatHistory";
import { useAuth } from "../../contexts/AuthContext";

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("stats");
  const [adminData, setAdminData] = useState(null);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  const checkAuth = useCallback(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "admin") {
      navigate("/");
      return;
    }

    setAdminData({
      username: user.profile?.firstName || user.email,
      email: user.email,
      role: user.role,
      lastLogin: user.lastLogin,
      permissions: user.adminPermissions || {
        canUpload: true,
        canDelete: true,
        canManageAdmins: false,
      },
    });
  }, [navigate, user]);

  useEffect(() => {
    checkAuth();
    loadStats();
  }, [checkAuth]);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("/api/faq/admin/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const handleLogout = () => {
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const tabs = [
    { id: "stats", label: "Dashboard", icon: BarChart3 },
    { id: "chat-history", label: "Chat History", icon: MessageCircle },
    { id: "upload", label: "Upload FAQ", icon: Upload },
    { id: "manage", label: "Manage FAQs", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (!adminData) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  FAQ Admin Panel
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Welcome back, {adminData.username}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {adminData.username}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {adminData.role === "super_admin" ? "Super Admin" : "Admin"}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64">
            <nav className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            {/* Quick Stats */}
            {stats && (
              <div className="mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                  Quick Stats
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Total FAQs
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {stats.database.totalFAQs}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Activity className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Active
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {stats.database.activeFAQs}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        Chunks
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {stats.database.totalChunks}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
              {activeTab === "stats" && (
                <AdminStats stats={stats} onRefresh={loadStats} />
              )}
              {activeTab === "chat-history" && <AdminChatHistory />}
              {activeTab === "upload" && (
                <FAQUpload adminData={adminData} onUploadSuccess={loadStats} />
              )}
              {activeTab === "manage" && (
                <FAQManagement adminData={adminData} onUpdate={loadStats} />
              )}
              {activeTab === "settings" && (
                <div className="p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Settings
                  </h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Account Information
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Username
                            </label>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                              {adminData.username}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Email
                            </label>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                              {adminData.email}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Role
                            </label>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                              {adminData.role === "super_admin"
                                ? "Super Admin"
                                : "Admin"}
                            </p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                              Last Login
                            </label>
                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                              {adminData.lastLogin
                                ? new Date(adminData.lastLogin).toLocaleString()
                                : "Never"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                        Permissions
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Can Upload Files
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                adminData.permissions.canUpload
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {adminData.permissions.canUpload ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Can Delete Files
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                adminData.permissions.canDelete
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {adminData.permissions.canDelete ? "Yes" : "No"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Can Manage Admins
                            </span>
                            <span
                              className={`text-sm font-medium ${
                                adminData.permissions.canManageAdmins
                                  ? "text-green-600 dark:text-green-400"
                                  : "text-red-600 dark:text-red-400"
                              }`}
                            >
                              {adminData.permissions.canManageAdmins
                                ? "Yes"
                                : "No"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
