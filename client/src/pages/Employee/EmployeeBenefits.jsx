import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api';
import { useUser } from '../../context/UserContext';

const EmployeeBenefits = () => {
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { user } = useUser();

  const fetchEmployeeBenefits = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE_URL}/api/benefits/employee`, {
        credentials: 'include'
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to fetch benefits');
      }

      if (responseData.success) {
        setBenefits(responseData.data);
      } else {
        throw new Error(responseData.error || 'Unknown error');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeBenefits();
  }, []);

  const handleRequestBenefit = async (benefitId) => {
    try {
      setError('');
      setSuccessMessage('');
      
      const response = await fetch(`${API_BASE_URL}/api/requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ benefitId })
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Request failed');
      }

      setSuccessMessage('Benefit requested successfully!');
      fetchEmployeeBenefits();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      setError('');
      setSuccessMessage('');
      
      const response = await fetch(`${API_BASE_URL}/api/requests/${requestId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Cancel request failed');
      }

      setSuccessMessage('Request canceled successfully!');
      fetchEmployeeBenefits();
    } catch (err) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-4">Loading benefits...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">My Benefits</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
          <p>{error}</p>
        </div>
      )}
      
      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 rounded">
          <p>{successMessage}</p>
        </div>
      )}

      {benefits.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
          <h3 className="text-lg font-medium text-gray-900">No benefits available</h3>
          <p className="mt-1 text-gray-500">You currently don't have any benefits assigned.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map(benefit => (
            <div key={benefit._id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:shadow-md transition-shadow">
              <div className={`p-4 ${benefit.isActive ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-semibold text-gray-800">{benefit.name}</h3>
                  <div className="flex flex-col items-end">
                    <span className={`px-2 py-1 text-xs rounded-full ${benefit.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {benefit.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {benefit.autoApply && (
                      <span className="mt-1 px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                        Auto-Applied
                      </span>
                    )}
                  </div>
                </div>
                <p className="mt-1 text-sm text-gray-600 line-clamp-2">{benefit.description}</p>
                {benefit.benefitType === 'fixed' && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-700">
                      Amount: ${benefit.amount}
                    </span>
                  </div>
                )}
                {benefit.benefitType === 'tiered' && benefit.applicableRate !== undefined && (
                  <div className="mt-2">
                    <span className="text-sm font-medium text-gray-700">
                      Your Rate: ${benefit.applicableRate}
                    </span>
                    {benefit.rateDescription && (
                      <p className="text-xs text-gray-500 mt-1">{benefit.rateDescription}</p>
                    )}
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-gray-100">
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Required Documents</h4>
                  {benefit.documentsRequired.length > 0 ? (
                    <ul className="mt-1 space-y-1">
                      {benefit.documentsRequired.map((doc, index) => (
                        <li key={index} className="text-sm text-gray-800">
                          • {doc.name}{doc.description && ` - ${doc.description}`}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-gray-500">No documents required</p>
                  )}
                </div>
                
                <div className="mt-4">
                  {benefit.autoApply ? (
                    <div className="text-center py-2 text-sm text-green-600">
                      This benefit is automatically applied
                    </div>
                  ) : benefit.isRequested ? (
                    <div className="flex justify-between items-center">
                      <span className={`text-sm ${
                        benefit.requestStatus === 'approved' ? 'text-green-600' :
                        benefit.requestStatus === 'rejected' ? 'text-red-600' :
                        'text-yellow-600'
                      }`}>
                        Status: {benefit.requestStatus}
                      </span>
                      {benefit.requestStatus === 'pending' && (
                        <button
                          onClick={() => handleCancelRequest(benefit.requestId)}
                          className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRequestBenefit(benefit._id)}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Request Benefit
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmployeeBenefits;