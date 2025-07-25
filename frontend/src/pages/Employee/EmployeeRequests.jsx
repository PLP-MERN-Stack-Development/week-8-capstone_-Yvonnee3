import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api';
import RequestModal from '../../components/RequestModal';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiClock, FiCheck, FiX, FiUser, FiChevronRight, FiDollarSign, FiRefreshCw, FiDownload, FiEye } from 'react-icons/fi';
import { toast } from 'react-toastify';
import DocumentUploader from '../../components/DocumentUploader';

const EmployeeRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);

  const [showRequestForm, setShowRequestForm] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [availableBenefits, setAvailableBenefits] = useState([]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/requests/`, {
        credentials: 'include'
      });
      
      if (!response.ok) throw new Error('Failed to fetch requests');
      
      const data = await response.json();
      if (data.success) {
        setRequests(data.data.map(request => ({
          ...request,
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

  const fetchAvailableBenefits = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/benefits/employee`, {
        credentials: 'include'
      });
      const data = await response.json();
      if (data.success) {
        setAvailableBenefits(data.data);
      }
    } catch (err) {
      console.error('Failed to fetch benefits:', err);
    }
  };

  const handleCreateRequest = async () => {
    try {
      setIsProcessing(true);
      const formData = new FormData();
      uploadedFiles.forEach(file => formData.append('documents', file));
      formData.append('benefitId', selectedBenefit._id);

      const response = await fetch(`${API_BASE_URL}/api/requests`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setRequests([{
          ...result.data,
          documents: result.data.documents.map(doc => ({
            ...doc,
            url: `${API_BASE_URL}/api/requests/documents/${doc._id}`
          }))
        }, ...requests]);
        setShowRequestForm(false);
        setSelectedBenefit(null);
        setUploadedFiles([]);
        toast.success('Request submitted successfully');
      } else {
        throw new Error('Failed to create request');
      }
    } catch (error) {
      toast.error(error.message || 'Request creation failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStatusUpdate = async (requestId, status, comments = '') => {
    try {
      setIsProcessing(true);
      const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/review`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status, comments })
      });

      if (!response.ok) throw new Error('Failed to update request');

      const data = await response.json();
      if (data.success) {
        toast.success(`Request ${status} successfully`);
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

// Add this handler to update the requests list
const handleDocumentsUpdate = (updatedRequest) => {
  setRequests(prevRequests => 
    prevRequests.map(req => 
      req._id === updatedRequest._id ? updatedRequest : req
    )
  );
};

// Updated handleDownloadDocument function
const handleDownloadDocument = async (documentId, filename) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
      credentials: 'include'
    });
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = 'Failed to download document';
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
      } catch (e) {
        console.error('Error parsing error response:', e);
      }
      throw new Error(errorMessage);
    }
    
    // Get filename from content-disposition header if available
    const contentDisposition = response.headers.get('content-disposition');
    let finalFilename = filename;
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?(.+?)"?$/);
      if (filenameMatch && filenameMatch[1]) {
        finalFilename = filenameMatch[1];
      }
    }
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (err) {
    toast.error(`Download failed: ${err.message}`);
    console.error('Download error:', err);
  }
};

  useEffect(() => {
    fetchRequests();
    fetchAvailableBenefits();
  }, []);

  const filteredRequests = requests.filter(request => {
    if (filter === 'all') return true;
    return request.status === filter;
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
        className="mb-8 flex justify-between items-center"
      >
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Benefit Requests</h1>
          <p className="text-gray-600">View and manage your benefit applications</p>
        </div>
        
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowRequestForm(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg"
        >
          <FiPlus className="mr-2" />
          New Request
        </motion.button>
      </motion.div>

      {showRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-xl w-full max-w-md"
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">
                  {selectedBenefit ? `Request ${selectedBenefit.name}` : 'Select Benefit'}
                </h3>
                <button 
                  onClick={() => {
                    setShowRequestForm(false);
                    setSelectedBenefit(null);
                    setUploadedFiles([]);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX size={24} />
                </button>
              </div>

              {!selectedBenefit ? (
                <div className="space-y-3">
                  {availableBenefits.map(benefit => (
                    <motion.div
                      key={benefit._id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedBenefit(benefit)}
                      className="p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <h4 className="font-medium">{benefit.name}</h4>
                      <p className="text-sm text-gray-600 truncate">{benefit.description}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <>
                  <DocumentUploader 
                    requestId={null}
                    documents={[]}
                    onFilesSelected={setUploadedFiles}
                  />
                  
                  <div className="flex justify-end space-x-3 mt-4">
                    <button 
                      onClick={() => setSelectedBenefit(null)}
                      className="px-4 py-2 border border-gray-300 rounded-md"
                    >
                      Back
                    </button>
                    <button 
                      onClick={handleCreateRequest}
                      disabled={isProcessing || uploadedFiles.length === 0}
                      className={`px-4 py-2 bg-blue-600 text-white rounded-md ${isProcessing ? 'opacity-70' : 'hover:bg-blue-700'}`}
                    >
                      {isProcessing ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}

      <div className="flex gap-3 mb-6 overflow-x-auto pb-2">
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
            {statusIcons[f] && React.cloneElement(statusIcons[f], { className: "mr-2" })}
            {f.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {filteredRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-white rounded-lg shadow-sm p-8 text-center border border-gray-100"
          >
            <FiDollarSign className="mx-auto text-4xl text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No requests found</h3>
            <p className="mt-1 text-gray-500">
              {filter === 'all' 
                ? "You haven't made any benefit requests yet" 
                : `No ${filter.split('_').join(' ')} requests found`}
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRequests.map((request, index) => (
              <motion.div
                key={request._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                whileHover={{ y: -3 }}
                className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-200"
              >
                <div className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {request.benefit.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(request.requestedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[request.status]} flex items-center`}>
                      {statusIcons[request.status]}
                      <span className="ml-1">{request.status.split('_').join(' ')}</span>
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-5 line-clamp-2">
                    {request.benefit.description}
                  </p>

                  {request.documents && request.documents.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-gray-500 mb-1">Attached Documents:</h4>
                      <div className="flex flex-wrap gap-2">
                        {request.documents.map(doc => (
                          <div key={doc._id} className="flex items-center text-xs bg-gray-100 rounded px-2 py-1">
                            <span className="truncate max-w-xs">{doc.filename || doc.metadata?.originalName}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                    <div className="flex items-center text-sm text-gray-500">
                      <FiUser className="mr-2" />
                      <span>Your request</span>
                    </div>
                    <motion.button
                      whileHover={{ x: 3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        setSelectedRequest(request);
                        setIsModalOpen(true);
                      }}
                      className="flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Details <FiChevronRight className="ml-1" />
                    </motion.button>
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
        isAdmin={false}
        onStatusUpdate={handleStatusUpdate}
        isProcessing={isProcessing}
        onDownloadDocument={handleDownloadDocument}
        onDocumentsUpdate={handleDocumentsUpdate}
      />
    </div>
  );
};

export default EmployeeRequests;