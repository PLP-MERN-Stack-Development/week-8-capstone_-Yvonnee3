import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api';
import { FiDollarSign, FiFileText, FiClock, FiCheckCircle, FiUser, FiRefreshCw, FiAlertCircle, FiChevronRight } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const EmployeeDashboard = () => {
  const [stats, setStats] = useState({
    availableBenefits: 0,
    activeBenefits: 0,
    pendingRequests: 0,
    approvedRequests: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [recentRequests, setRecentRequests] = useState([]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch employee stats
      const statsResponse = await fetch(`${API_BASE_URL}/api/employees/dashboard-stats`, {
        credentials: 'include'
      });
      
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch dashboard statistics');
      }
      
      const statsData = await statsResponse.json();
      
      // Fetch recent requests
      const requestsResponse = await fetch(`${API_BASE_URL}/api/employees/recent`, {
        credentials: 'include'
      });
      
      if (!requestsResponse.ok) {
        throw new Error('Failed to fetch recent requests');
      }
      
      const requestsData = await requestsResponse.json();
      
      setStats({
        availableBenefits: statsData.data?.availableBenefits || 0,
        activeBenefits: statsData.data?.activeBenefits || 0,
        pendingRequests: statsData.data?.pendingRequests || 0,
        approvedRequests: statsData.data?.approvedRequests || 0
      });
      
      setRecentRequests(requestsData.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const refreshData = () => {
    fetchDashboardData();
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
            onClick={refreshData}
            className="ml-auto px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
          >
            <FiRefreshCw className="mr-1" /> Retry
          </button>
        </div>
      </div>
    );
  }

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    needs_revision: 'bg-blue-100 text-blue-800'
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Employee Dashboard</h1>
            <p className="text-gray-600">Overview of your benefits and requests</p>
          </div>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 flex items-center"
          >
            <FiRefreshCw className="mr-2" /> Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Available Benefits */}
          <Link 
            to="/employee/benefits" 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Available Benefits</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.availableBenefits}</h3>
              </div>
              <div className="p-3 bg-indigo-50 rounded-full">
                <FiDollarSign className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <div className="mt-4 text-sm text-gray-600">
              {stats.activeBenefits} currently active
            </div>
          </Link>

          {/* Requests Stats */}
          <Link 
            to="/employee/requests" 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Your Requests</p>
                <h3 className="text-2xl font-bold text-gray-800">{stats.pendingRequests + stats.approvedRequests}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <FiFileText className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex justify-between text-sm">
              <span className="text-yellow-600">{stats.pendingRequests} pending</span>
              <span className="text-green-600">{stats.approvedRequests} approved</span>
            </div>
          </Link>

          {/* Quick Actions - Benefits */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800">Benefits</h3>
              <FiDollarSign className="text-gray-400" />
            </div>
            <div className="space-y-3">
              <Link
                to="/employee/benefits"
                className="block px-4 py-3 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                View All Benefits
              </Link>
              <Link
                to="/employee/benefits?filter=available"
                className="block px-4 py-3 bg-white border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 transition-colors"
              >
                View Available Benefits
              </Link>
            </div>
          </div>

          {/* Quick Actions - Requests */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-800">Requests</h3>
              <FiFileText className="text-gray-400" />
            </div>
            <div className="space-y-3">
              <Link
                to="/employee/requests"
                className="block px-4 py-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
              >
                View All Requests
              </Link>
              <Link
                to="/employee/requests/new"
                className="block px-4 py-3 bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
              >
                Submit New Request
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Recent Requests</h2>
            <Link to="/employee/requests" className="text-sm text-indigo-600 hover:text-indigo-800">
              View All
            </Link>
          </div>
          
          {recentRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FiFileText className="mx-auto text-4xl mb-3" />
              <p>No recent requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {recentRequests.map((request, index) => (
                <motion.div
                  key={request._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                  className="flex items-start p-4 hover:bg-gray-50 rounded-lg transition-all border border-gray-100"
                >
                  <div className={`p-2 rounded-full mr-4 ${statusColors[request.status]}`}>
                    {request.status === 'pending' && <FiClock />}
                    {request.status === 'approved' && <FiCheckCircle />}
                    {request.status === 'rejected' && <FiAlertCircle />}
                    {request.status === 'needs_revision' && <FiRefreshCw />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-gray-800">{request.benefit.name}</h3>
                      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[request.status]}`}>
                        {request.status.split('_').join(' ')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      Submitted on {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                    {request.comments && (
                      <p className="text-sm text-gray-500 mt-2 italic">
                        "{request.comments}"
                      </p>
                    )}
                  </div>
                  <Link 
                    to={`/employee/requests/${request._id}`}
                    className="ml-4 text-indigo-600 hover:text-indigo-800 flex items-center"
                  >
                    <FiChevronRight />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-800 mb-4">Benefits Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Available</span>
                <span className="font-medium">{stats.availableBenefits}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Currently Active</span>
                <span className="font-medium text-green-600">{stats.activeBenefits}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Auto-Applied</span>
                <span className="font-medium text-blue-600">
                  {stats.availableBenefits > 0 ? 
                    Math.round((stats.activeBenefits / stats.availableBenefits) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-medium text-gray-800 mb-4">Requests Status</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Pending Review</span>
                <span className="font-medium text-yellow-600">{stats.pendingRequests}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Approved</span>
                <span className="font-medium text-green-600">{stats.approvedRequests}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Completion Rate</span>
                <span className="font-medium">
                  {stats.pendingRequests + stats.approvedRequests > 0 ? 
                    Math.round((stats.approvedRequests / (stats.pendingRequests + stats.approvedRequests)) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDashboard;