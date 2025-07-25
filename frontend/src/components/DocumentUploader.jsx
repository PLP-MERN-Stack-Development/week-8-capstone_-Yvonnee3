import React, { useState } from 'react';
import { FiUpload, FiX, FiPaperclip, FiCheck, FiRefreshCw } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../api';
const DocumentUploader = ({ 
  requestId, 
  documents = [], 
  onUploadComplete, 
  onDelete,
  onDocumentsUpdate,
  isEditable = true
}) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    if (selectedFiles.length > 0) {
      // Validate file types and sizes
      const validFiles = selectedFiles.filter(file => {
        const validTypes = ['image/jpeg', 'image/png', 'application/pdf'];
        const isValidType = validTypes.includes(file.type);
        const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB
        
        if (!isValidType) {
          toast.error(`Invalid file type: ${file.name}`);
          return false;
        }
        if (!isValidSize) {
          toast.error(`File too large (max 10MB): ${file.name}`);
          return false;
        }
        return true;
      });
      
      setFiles(validFiles);
    }
  };

const handleUpload = async () => {
  if (!requestId || files.length === 0) return;

  setIsUploading(true);
  setUploadProgress(0);

  try {
    const formData = new FormData();
    files.forEach(file => formData.append('documents', file));

    const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}/documents`, {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Upload failed');
    }

    const result = await response.json();
    
    if (result.success) {
      toast.success(`${files.length} document(s) uploaded successfully`);
      if (onUploadComplete) onUploadComplete(result.documents);
      if (onDocumentsUpdate) {
        onDocumentsUpdate([...documents, ...result.documents.map(doc => ({
          ...doc,
          url: `${API_BASE_URL}/api/documents/${doc.id}`
        }))]);
      }
      setFiles([]);
    } else {
      throw new Error(result.error || 'Upload failed');
    }
  } catch (error) {
    console.error('Upload error:', error);
    // More specific error message for this case
    if (error.message.includes('not in editable state')) {
      toast.error('Cannot upload documents: This request is no longer editable');
    } else {
      toast.error(`Upload failed: ${error.message}`);
    }
  } finally {
    setIsUploading(false);
    setUploadProgress(0);
  }
};

  const handleDelete = async (fileId) => {
    try {
      if (onDelete) {
        await onDelete(fileId);
        toast.success('Document deleted successfully');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(`Delete failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current Documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Current Documents</h4>
          {documents.map((doc, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <div className="flex items-center truncate">
                <FiPaperclip className="text-gray-400 mr-2 flex-shrink-0" />
                <span className="truncate">{doc.originalName || doc.filename}</span>
              </div>
              <div className="flex space-x-2">
                <a 
                  href={doc.url} 
                  download
                  className="text-blue-600 hover:text-blue-800"
                >
                  Download
                </a>
                {onDelete && (
                  <button 
                    onClick={() => handleDelete(doc._id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiX />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Section */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        <div className="flex flex-col items-center justify-center space-y-2">
          <FiUpload className="text-gray-400 text-2xl" />
          <p className="text-sm text-gray-600">Drag & drop files here or</p>
          <label className="px-4 py-2 bg-blue-50 text-blue-600 rounded-md cursor-pointer hover:bg-blue-100">
            Browse Files
            <input 
              type="file" 
              onChange={handleFileChange}
              multiple
              className="hidden"
              accept=".jpg,.jpeg,.png,.pdf"
            />
          </label>
        </div>
        
        {files.length > 0 && (
          <div className="mt-4 space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                <div className="flex items-center truncate">
                  <FiPaperclip className="text-gray-400 mr-2 flex-shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <button 
                  onClick={() => setFiles(files.filter((_, i) => i !== index))}
                  className="text-gray-500 hover:text-red-500"
                >
                  <FiX />
                </button>
              </div>
            ))}
            
            {isUploading && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            )}
            
            <button
                onClick={handleUpload}
                disabled={!isEditable || isUploading || files.length === 0}
                className={`w-full mt-2 px-4 py-2 rounded-md flex items-center justify-center ${
                !isEditable ? 'bg-gray-400 cursor-not-allowed' :
                isUploading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
            >
              {isUploading ? (
                <>
                  <FiRefreshCw className="animate-spin mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <FiUpload className="mr-2" />
                  Upload {files.length > 1 ? `${files.length} Files` : 'File'}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUploader;