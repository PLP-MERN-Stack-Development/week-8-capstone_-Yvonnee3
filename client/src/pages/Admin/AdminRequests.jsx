import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api';
import RequestModal from '../../components/RequestModal';
import { motion, AnimatePresence } from 'framer-motion';
import { FiClock, FiCheck, FiX, FiSearch, FiFilter, FiUser, FiChevronRight, FiRefreshCw, FiDownload, FiEye } from 'react-icons/fi';
import { toast } from 'react-toastify';

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/requests/all`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch requests');
      
      const data = await response.json();
      if (data.success) {
        setRequests(data.data.map(request => ({
          ...request,
          userName: `${request.user.firstName} ${request.user.lastName}`,
          // Process documents to include proper URLs
          documents: request.documents.map(doc => ({
            ...doc,
            url: `${API_BASE_URL}/api/documents/${doc._id}`
          }))
        })));
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, status, comments = '', rejectionReason = '') => {
    try {
      setIsProcessing(true);
      const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ 
          status, 
          comment: comments,
          ...(status === 'rejected' && { rejectionReason }) 
        })
      });

      if (!response.ok) throw new Error('Failed to update request');

      const data = await response.json();
      if (data.success) {
        toast.success(`Request status updated to ${status} successfully`);
        fetchRequests();
        setIsModalOpen(false);
      } else {
        throw new Error(data.error || 'Failed to update request');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadDocument = async (documentId, filename) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/requests/documents/${documentId}`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to download document');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || 'document';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const filteredRequests = requests.filter(request => {
    if (filter !== 'all' && request.status !== filter) return false;
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        request.userName.toLowerCase().includes(term) ||
        request.benefit.name.toLowerCase().includes(term) ||
        request.status.toLowerCase().includes(term)
      );
    }
    
    return true;
  });

  const statusIcons = {
    pending: <FiClock className="text-yellow-500" />,
    approved: <FiCheck className="text-green-500" />,
    rejected: <FiX className="text-red-500" />,
    needs_revision: <FiRefreshCw className="text-blue-500" />
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    needs_revision: 'bg-blue-100 text-blue-800'
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        className="w-12 h-12 rounded-full border-4 border-blue-500 border-t-transparent"
      />
    </div>
  );
  
  if (error) return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-sm"
    >
      <div className="flex items-center">
        <FiX className="text-red-500 mr-2" />
        <p className="text-red-700 font-medium">Error: {error}</p>
      </div>
    </motion.div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Benefit Requests</h1>
        <p className="text-gray-600">Review and manage employee benefit applications</p>
      </motion.div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by employee or benefit..."
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {['all', 'pending', 'approved', 'rejected', 'needs_revision'].map((f) => (
            <motion.button
              key={f}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap flex items-center ${
                filter === f 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {f === 'all' ? <FiFilter className="mr-2" /> : statusIcons[f]}
              {f.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
            </motion.button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {filteredRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-100"
          >
            <FiUser className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
            <p className="mt-1 text-gray-500">
              {filter === 'all' 
                ? "There are no benefit requests to display" 
                : `No ${filter.split('_').join(' ')} requests found`}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRequests.map((request, index) => (
              <motion.div
                key={request._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex items-start space-x-4">
                      <div className={`p-2 rounded-lg ${statusColors[request.status]}`}>
                        {statusIcons[request.status]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {request.userName}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-sm text-gray-600">{request.benefit.name}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(request.requestedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {request.documents && request.documents.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            {request.documents.map(doc => (
                              <div key={doc._id} className="flex items-center text-xs bg-gray-100 rounded px-2 py-1">
                                <span className="truncate max-w-xs">{doc.filename || doc.metadata?.originalName}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                        {request.status.split('_').join(' ')}
                      </span>
                      <motion.button
                        whileHover={{ x: 3 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsModalOpen(true);
                        }}
                        className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        Review <FiChevronRight className="ml-1" />
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AnimatePresence>

      <RequestModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        request={selectedRequest}
        isAdmin={true}
        onStatusUpdate={handleStatusUpdate}
        isProcessing={isProcessing}
        onDocumentsUpdate={(updatedRequest) => {
          setRequests(prevRequests => 
            prevRequests.map(req => 
              req._id === updatedRequest._id ? updatedRequest : req
            )
          );
          setSelectedRequest(updatedRequest);
        }}
        onDownloadDocument={handleDownloadDocument}
      />
    </div>
  );
};

export default AdminRequests;