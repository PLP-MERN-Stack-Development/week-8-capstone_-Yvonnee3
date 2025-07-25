import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api';
import { FiUsers, FiDollarSign, FiClock, FiCheckCircle, FiFileText, FiTrendingUp, FiRefreshCw } from 'react-icons/fi';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalBenefits: 0,
    activeBenefits: 0,
    autoAppliedBenefits: 0,
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch benefits stats
      const benefitsResponse = await fetch(`${API_BASE_URL}/api/benefits/stats`, {
        credentials: 'include'
      });
      
      if (!benefitsResponse.ok) {
        throw new Error('Failed to fetch benefits statistics');
      }
      
      const benefitsData = await benefitsResponse.json();
      
      // Fetch requests stats
      const requestsResponse = await fetch(`${API_BASE_URL}/api/requests/stats`, {
        credentials: 'include'
      });
      
      if (!requestsResponse.ok) {
        throw new Error('Failed to fetch requests statistics');
      }
      
      const requestsData = await requestsResponse.json();
      
      setStats({
        totalBenefits: benefitsData.data?.totalBenefits || 0,
        activeBenefits: benefitsData.data?.activeBenefits || 0,
        autoAppliedBenefits: benefitsData.data?.autoAppliedBenefits || 0,
        totalRequests: requestsData.data?.totalRequests || 0,
        pendingRequests: requestsData.data?.pendingRequests || 0,
        approvedRequests: requestsData.data?.approvedRequests || 0,
        rejectedRequests: requestsData.data?.rejectedRequests || 0
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const refreshStats = () => {
    fetchStats();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm">
        <div className="flex items-center">
          <span className="text-red-500 font-medium">Error:</span>
          <p className="ml-2 text-red-700">{error}</p>
          <button 
            onClick={refreshStats}
            className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
          >
            <FiRefreshCw className="mr-1" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-gray-600">Overview of system statistics and management</p>
          </div>
          <button
            onClick={refreshStats}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 flex items-center"
          >
            <FiRefreshCw className="mr-2" /> Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Benefits Stats */}
          <Link 
            to="/admin/benefits" 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Total Benefits</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.totalBenefits}</h3>
              </div>
              <div className="p-3 bg-indigo-50 rounded-full">
                <FiDollarSign className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-green-600 flex items-center">
                <FiTrendingUp className="mr-1" /> {stats.activeBenefits} active
              </span>
              <span className="text-blue-600">{stats.autoAppliedBenefits} auto-applied</span>
            </div>
          </Link>

          {/* Requests Stats */}
          <Link 
            to="/admin/requests" 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Total Requests</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.totalRequests}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <FiFileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full flex items-center justify-center">
                <FiClock className="mr-1" /> {stats.pendingRequests}
              </span>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full flex items-center justify-center">
                <FiCheckCircle className="mr-1" /> {stats.approvedRequests}
              </span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center justify-center">
                <FiClock className="mr-1" /> {stats.rejectedRequests}
              </span>
            </div>
          </Link>

          {/* Quick Actions - Benefits */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800">Benefits Management</h3>
              <FiDollarSign className="text-gray-400" />
            </div>
            <div className="space-y-3">
              <Link
                to="/admin/benefits"
                className="block px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                View All Benefits
              </Link>
              <Link
                to="/admin/benefits?create=true"
                className="block px-4 py-3 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Create New Benefit
              </Link>
            </div>
          </div>

          {/* Quick Actions - Requests */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800">Requests Management</h3>
              <FiFileText className="text-gray-400" />
            </div>
            <div className="space-y-3">
              <Link
                to="/admin/requests"
                className="block px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                View All Requests
              </Link>
              <Link
                to="/admin/requests?filter=pending"
                className="block px-4 py-3 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Review Pending Requests
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Recent Activity</h2>
            <Link to="/admin/requests" className="text-sm text-indigo-600 hover:text-indigo-800">
              View All
            </Link>
          </div>
          
          {/* Placeholder for recent activity - would normally fetch this data */}
          <div className="space-y-4">
            <div className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="p-2 bg-green-100 rounded-full mr-3">
                <FiCheckCircle className="text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">New request approved</p>
                <p className="text-xs text-gray-500">Housing allowance for John Doe was approved</p>
                <p className="text-xs text-gray-400 mt-1">2 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="p-2 bg-yellow-100 rounded-full mr-3">
                <FiClock className="text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">New request submitted</p>
                <p className="text-xs text-gray-500">Medical benefit request from Jane Smith</p>
                <p className="text-xs text-gray-400 mt-1">5 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start p-3 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="p-2 bg-blue-100 rounded-full mr-3">
                <FiDollarSign className="text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">New benefit created</p>
                <p className="text-xs text-gray-500">"Remote Work Stipend" benefit was added</p>
                <p className="text-xs text-gray-400 mt-1">1 day ago</p>
              </div>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-800 mb-4">System Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">API Status</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Operational</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Database</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Connected</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Storage</span>
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">78% used</span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-800 mb-4">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              <Link
                to="/admin/benefits"
                className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-center text-sm font-medium text-gray-700 transition-colors"
              >
                Benefits
              </Link>
              <Link
                to="/admin/requests"
                className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-center text-sm font-medium text-gray-700 transition-colors"
              >
                Requests
              </Link>
              <Link
                to="/admin/users"
                className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-center text-sm font-medium text-gray-700 transition-colors"
              >
                Users
              </Link>
              <Link
                to="/admin/settings"
                className="p-3 bg-gray-50 hover:bg-gray-100 rounded-lg text-center text-sm font-medium text-gray-700 transition-colors"
              >
                Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;