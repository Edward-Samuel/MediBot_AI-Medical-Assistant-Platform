import React from 'react';
import { 
  Database, 
  Activity, 
  TrendingUp, 
  FileText, 
  RefreshCw,
  BarChart3,
  PieChart,
  Users
} from 'lucide-react';

const AdminStats = ({ stats, onRefresh }) => {
  if (!stats) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Dashboard Statistics
          </h2>
          <button
            onClick={onRefresh}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading statistics...</p>
        </div>
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, color, description }) => (
    <div className="bg-white dark:bg-gray-700 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-600">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const CategoryCard = ({ category, count }) => (
    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <span className="text-sm font-medium text-gray-900 dark:text-white">{category}</span>
      <span className="text-sm text-gray-600 dark:text-gray-400">{count} FAQs</span>
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Dashboard Statistics
          </h2>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors border border-gray-300 dark:border-gray-600 rounded-md hover:border-gray-400 dark:hover:border-gray-500"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total FAQs"
          value={stats.database?.totalFAQs || 0}
          icon={Database}
          color="bg-blue-500"
          description="All uploaded documents"
        />
        <StatCard
          title="Active FAQs"
          value={stats.database?.activeFAQs || 0}
          icon={Activity}
          color="bg-green-500"
          description="Currently searchable"
        />
        <StatCard
          title="Total Chunks"
          value={stats.database?.totalChunks || 0}
          icon={TrendingUp}
          color="bg-purple-500"
          description="Processed text segments"
        />
        <StatCard
          title="Categories"
          value={stats.categories?.length || 0}
          icon={PieChart}
          color="bg-orange-500"
          description="Unique categories"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Categories Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <PieChart className="h-5 w-5 text-orange-600 dark:text-orange-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Categories Breakdown
            </h3>
          </div>
          <div className="space-y-3">
            {stats.categories && stats.categories.length > 0 ? (
              stats.categories.map((category, index) => (
                <CategoryCard
                  key={index}
                  category={category._id || 'Uncategorized'}
                  count={category.count}
                />
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No categories found
              </p>
            )}
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 mb-4">
            <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              System Status
            </h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">FAQ Service</span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Active</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Vector Database</span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Connected</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Embedding Model</span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">ClinicalBERT</span>
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Search Capability</span>
              <span className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Operational</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3 mb-4">
          <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <Database className="h-8 w-8 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Upload New FAQ</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Add medical documents to the knowledge base
            </p>
          </div>
          <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <Activity className="h-8 w-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Manage FAQs</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Edit, activate, or deactivate existing documents
            </p>
          </div>
          <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400 mx-auto mb-2" />
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">View Analytics</h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Monitor search patterns and usage statistics
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStats;