import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FiX, 
  FiCheck, 
  FiXCircle, 
  FiEdit3, 
  FiClock, 
  FiRefreshCw, 
  FiAlertCircle,
  FiUser,
  FiCalendar,
  FiInfo,
  FiMessageSquare,
  FiPaperclip
} from 'react-icons/fi';
import { API_BASE_URL } from '../api';
import DocumentUploader from './DocumentUploader';
import { toast } from 'react-toastify';

const RequestModal = ({ 
  isOpen, 
  onClose, 
  request, 
  isAdmin, 
  onStatusUpdate, 
  isProcessing,
 onDocumentsUpdate
}) => {
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [newStatus, setNewStatus] = useState(null);

  if (!isOpen || !request) return null;

  const statusOptions = [
    { value: 'approved', label: 'Approve', icon: <FiCheck />, color: 'green' },
    { value: 'rejected', label: 'Reject', icon: <FiXCircle />, color: 'red' },
    { value: 'needs_revision', label: 'Needs Revision', icon: <FiEdit3 />, color: 'blue' },
    { value: 'pending', label: 'Reset to Pending', icon: <FiRefreshCw />, color: 'yellow' }
  ];

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    needs_revision: 'bg-blue-100 text-blue-800'
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'approved': return <FiCheck className="text-green-500" />;
      case 'rejected': return <FiXCircle className="text-red-500" />;
      case 'needs_revision': return <FiEdit3 className="text-blue-500" />;
      default: return <FiClock className="text-yellow-500" />;
    }
  };

  const handleSubmit = () => {
    if (!newStatus) {
      alert('Please select a new status');
      return;
    }
    
    if (newStatus === 'rejected' && !rejectionReason) {
      alert('Please provide a rejection reason');
      return;
    }
    
    onStatusUpdate(request._id, newStatus, comments, rejectionReason);
  };

    // Add this document update handler
// Inside RequestModal component
const handleDocumentsUpdate = (updatedDocuments) => {
  const updatedRequest = {
    ...request,
    documents: updatedDocuments
  };
  
  // Update local state immediately
  setSelectedRequest(updatedRequest);
  
  // Notify parent component if needed
  if (onDocumentsUpdate) {
    onDocumentsUpdate(updatedRequest);
  }
};

// In the documents section
// In the documents section
<DocumentUploader 
  requestId={request._id}
  documents={request.documents}
  onUploadComplete={(newDocs) => {
    const updatedDocuments = [
      ...request.documents,
      ...newDocs.map(doc => ({
        ...doc,
        url: `${API_BASE_URL}/api/documents/${doc.id}`
      }))
    ];
    handleDocumentsUpdate(updatedDocuments);
  }}
  onDelete={async (fileId) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/requests/${request._id}/documents/${fileId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      
      const updatedDocuments = request.documents.filter(doc => doc._id !== fileId);
      handleDocumentsUpdate(updatedDocuments);
      toast.success('Document deleted successfully');
    } catch (error) {
      toast.error(`Delete failed: ${error.message}`);
    }
  }}
/>

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {request.benefit?.name || 'Benefit Request'}
              </h2>
              <div className="flex items-center mt-1 space-x-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                  {request.status.replace('_', ' ')}
                </span>
                {request.lastReviewDate && (
                  <span className="inline-flex items-center text-xs text-gray-500">
                    <FiCalendar className="mr-1" />
                    Last reviewed: {new Date(request.lastReviewDate).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <FiX size={24} />
            </button>
          </div>

          <div className="space-y-6">
            {/* Request Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 flex items-center">
                  <FiUser className="mr-2" /> Requested By
                </h3>
                <p className="mt-1 text-gray-900 font-medium">
                  {request.user?.firstName} {request.user?.lastName}
                </p>
                {request.user?.rank && (
                  <p className="text-sm text-gray-600">{request.user.rank}</p>
                )}
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 flex items-center">
                  <FiCalendar className="mr-2" /> Timeline
                </h3>
                <p className="mt-1 text-gray-900">
                  <span className="font-medium">Requested:</span> {new Date(request.requestedAt).toLocaleString()}
                </p>
                {request.processedAt && (
                  <p className="mt-1 text-gray-900">
                    <span className="font-medium">Processed:</span> {new Date(request.processedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>

            {/* Benefit Details Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-sm font-medium text-gray-500 flex items-center">
                <FiInfo className="mr-2" /> Benefit Details
              </h3>
              <p className="mt-1 text-gray-900">
                {request.benefit?.description || 'No description available'}
              </p>
              {request.rejectionReason && (
                <div className="mt-3 bg-red-50 border-l-4 border-red-500 p-3 rounded-r">
                  <h4 className="text-sm font-medium text-red-800 flex items-center">
                    <FiAlertCircle className="mr-2" /> Current Rejection Reason
                  </h4>
                  <p className="mt-1 text-red-700">{request.rejectionReason}</p>
                </div>
              )}
            </div>

{/* Documents Section */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500 flex items-center mb-3">
              <FiPaperclip className="mr-2" /> Documents
            </h3>
            <DocumentUploader 
              requestId={request._id}
              documents={request.documents}
              onUploadComplete={(newDocs) => {
                const updatedRequest = {
                  ...request,
                  documents: [...request.documents, ...newDocs]
                };
                handleDocumentsUpdate(updatedRequest);
              }}
              onDelete={async (fileId) => {
                try {
                  await fetch(`${API_BASE_URL}/api/requests/${request._id}/documents/${fileId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                  });
                  const updatedRequest = {
                    ...request,
                    documents: request.documents.filter(doc => doc.gridFSId !== fileId)
                  };
                  handleDocumentsUpdate(updatedRequest);
                } catch (error) {
                  console.error('Delete failed:', error);
                }
              }}
            />
          </div>


            {/* Review History Section */}
            {request.reviewerComments?.length > 0 && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Review History</h3>
                <div className="space-y-4">
                  {[...request.reviewerComments].reverse().map((comment, i) => (
                    <div key={i} className="border-l-4 pl-4" style={{ 
                      borderColor: statusColors[comment.statusAtReview]?.split(' ')[0] || '#e5e7eb',
                      paddingBottom: '1rem'
                    }}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          {getStatusIcon(comment.statusAtReview)}
                          <span className="ml-2 font-medium text-gray-800 capitalize">
                            {comment.statusAtReview?.replace('_', ' ') || 'Reviewed'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </p>
                      </div>
                      
                      {comment.reviewedBy && (
                        <p className="text-xs text-gray-600 mt-1">
                          By: {comment.reviewedBy.firstName} {comment.reviewedBy.lastName}
                        </p>
                      )}
                      
                      {/* Unified display for all review information */}
                      <div className="mt-3 space-y-3">
                        {/* Rejection reason (if exists) */}
                        {comment.statusAtReview === 'rejected' && comment.rejectionReason && (
                          <div className="flex items-start">
                            <FiAlertCircle className="flex-shrink-0 mt-1 mr-2 text-red-500" />
                            <div>
                              <h4 className="text-xs font-medium text-gray-700">Rejection Reason</h4>
                              <p className="mt-1 text-sm text-gray-800">{comment.rejectionReason}</p>
                            </div>
                          </div>
                        )}
                        
                        {/* Reviewer comment (if exists) */}
                        {comment.text && (
                          <div className="flex items-start">
                            <FiMessageSquare className="flex-shrink-0 mt-1 mr-2 text-gray-500" />
                            <div>
                              <h4 className="text-xs font-medium text-gray-700">Reviewer Notes</h4>
                              <p className="mt-1 text-sm text-gray-800">{comment.text}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Actions Section */}
            {isAdmin && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-gray-700 mb-3">Update Request Status</h3>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNewStatus(option.value)}
                      className={`flex items-center justify-center p-3 rounded-lg border transition-colors ${
                        newStatus === option.value
                          ? `bg-${option.color}-100 border-${option.color}-500 text-${option.color}-800`
                          : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {option.icon}
                      <span className="ml-2 text-sm">{option.label}</span>
                    </button>
                  ))}
                </div>

                {newStatus === 'rejected' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rejection Reason (required)
                    </label>
                    <textarea
                      className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows={2}
                      required
                      placeholder="Please provide a clear reason for rejection..."
                    />
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Comments (optional)
                  </label>
                  <textarea
                    className="block w-full border border-gray-300 rounded-md shadow-sm p-2 text-sm"
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    rows={3}
                    placeholder="Add any additional notes about this decision..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 text-sm font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isProcessing || !newStatus || (newStatus === 'rejected' && !rejectionReason)}
                    className={`px-4 py-2 rounded-md text-white text-sm font-medium ${
                      isProcessing ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessing ? (
                      <span className="flex items-center justify-center">
                        <FiRefreshCw className="animate-spin mr-2" />
                        Updating...
                      </span>
                    ) : (
                      'Update Status'
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RequestModal;