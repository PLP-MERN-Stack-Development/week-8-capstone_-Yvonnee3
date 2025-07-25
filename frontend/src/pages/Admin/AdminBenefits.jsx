import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../api';

const AdminBenefits = () => {
  const [benefits, setBenefits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBenefit, setSelectedBenefit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    benefitType: 'fixed',
    amount: 0,
    rateTiers: [],
    eligibleRanks: [],
    minTenure: 0,
    documentsRequired: [],
    isActive: true,
    autoApply: false // Added autoApply field
  });
  const [newDocument, setNewDocument] = useState({ name: '', description: '' });
  const [newRateTier, setNewRateTier] = useState({ rank: '', rate: 0, description: '' });

  // Available ranks
  const availableRanks = [
    'Support Staff',
    'Junior Officer',
    'Officer',
    'Senior Officer',
    'Assistant Director',
    'Director'
  ];

  // Fetch all benefits
  const fetchBenefits = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/benefits`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch benefits');
      }

      const data = await response.json();
      if (data.success) {
        setBenefits(data.data);
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenefits();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle rank selection
  const handleRankChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => {
      const newRanks = checked 
        ? [...prev.eligibleRanks, value]
        : prev.eligibleRanks.filter(rank => rank !== value);
      return { ...prev, eligibleRanks: newRanks };
    });
  };

  // Handle document addition
  const handleAddDocument = () => {
    if (newDocument.name.trim()) {
      setFormData(prev => ({
        ...prev,
        documentsRequired: [...prev.documentsRequired, newDocument]
      }));
      setNewDocument({ name: '', description: '' });
    }
  };

  // Handle document removal
  const handleRemoveDocument = (index) => {
    setFormData(prev => ({
      ...prev,
      documentsRequired: prev.documentsRequired.filter((_, i) => i !== index)
    }));
  };

  // Handle rate tier addition
  const handleAddRateTier = () => {
    if (newRateTier.rank && newRateTier.rate >= 0) {
      setFormData(prev => ({
        ...prev,
        rateTiers: [...prev.rateTiers, newRateTier]
      }));
      setNewRateTier({ rank: '', rate: 0, description: '' });
    }
  };

  // Handle rate tier removal
  const handleRemoveRateTier = (index) => {
    setFormData(prev => ({
      ...prev,
      rateTiers: prev.rateTiers.filter((_, i) => i !== index)
    }));
  };

  // Open create modal
  const openCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      benefitType: 'fixed',
      amount: 0,
      rateTiers: [],
      eligibleRanks: [],
      minTenure: 0,
      documentsRequired: [],
      isActive: true,
      autoApply: false
    });
    setIsCreateModalOpen(true);
  };

  // Open edit modal
  const openEditModal = (benefit) => {
    setSelectedBenefit(benefit);
    setFormData({
      name: benefit.name,
      description: benefit.description,
      benefitType: benefit.benefitType,
      amount: benefit.amount || 0,
      rateTiers: benefit.rateTiers || [],
      eligibleRanks: benefit.eligibleRanks,
      minTenure: benefit.minTenure,
      documentsRequired: benefit.documentsRequired,
      isActive: benefit.isActive,
      autoApply: benefit.autoApply || false
    });
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const openDeleteModal = (benefit) => {
    setSelectedBenefit(benefit);
    setIsDeleteModalOpen(true);
  };

  // Submit form (create or update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Validate form based on benefit type
      if (formData.benefitType === 'fixed' && !formData.amount) {
        throw new Error('Amount is required for fixed benefits');
      }
      
      if (formData.benefitType === 'tiered' && formData.rateTiers.length === 0) {
        throw new Error('At least one rate tier is required for tiered benefits');
      }

      const url = selectedBenefit 
        ? `${API_BASE_URL}/api/benefits/${selectedBenefit._id}`
        : `${API_BASE_URL}/api/benefits`;
      const method = selectedBenefit ? 'PUT' : 'POST';

      // Prepare data to send
      const dataToSend = {
        ...formData,
        // Only send rateTiers for tiered benefits, amount for fixed
        rateTiers: formData.benefitType === 'tiered' ? formData.rateTiers : undefined,
        amount: formData.benefitType === 'fixed' ? formData.amount : undefined
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(dataToSend)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Operation failed');
      }

      // Refresh benefits list and close modal
      fetchBenefits();
      setIsCreateModalOpen(false);
      setIsEditModalOpen(false);
      setSelectedBenefit(null);
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete a benefit
  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/benefits/${selectedBenefit._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Delete failed');
      }

      fetchBenefits();
      setIsDeleteModalOpen(false);
      setSelectedBenefit(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Benefits Management</h1>
            <p className="text-gray-600">Create and manage employee benefits</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create Benefit
          </button>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
            <p>{error}</p>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Total Benefits</p>
                <h3 className="text-2xl font-bold text-gray-800">{benefits.length}</h3>
              </div>
              <div className="p-3 bg-indigo-50 rounded-full">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Active Benefits</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {benefits.filter(b => b.isActive).length}
                </h3>
              </div>
              <div className="p-3 bg-green-50 rounded-full">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500">Auto-Applied Benefits</p>
                <h3 className="text-2xl font-bold text-gray-800">
                  {benefits.filter(b => b.autoApply).length}
                </h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-full">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
          </div>
        ) : benefits.length === 0 ? (
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-100 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">No benefits found</h3>
            <p className="mt-1 text-gray-500">Get started by creating a new benefit.</p>
            <div className="mt-6">
              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700 transition-colors"
              >
                Create Benefit
              </button>
            </div>
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
                  <div className="mt-2">
                    <span className="inline-block px-2 py-1 text-xs font-medium rounded bg-blue-100 text-blue-800">
                      {benefit.benefitType === 'fixed' ? 'Fixed Amount' : 'Tiered Rates'}
                    </span>
                    {benefit.benefitType === 'fixed' && (
                      <span className="ml-2 text-sm font-medium text-gray-700">
                        ${benefit.amount}
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4 border-t border-gray-100">
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Eligible Ranks</h4>
                    <p className="mt-1 text-sm text-gray-800">{benefit.eligibleRanks.join(', ')}</p>
                  </div>
                  <div className="mb-3">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Minimum Tenure</h4>
                    <p className="mt-1 text-sm text-gray-800">{benefit.minTenure} months</p>
                  </div>
                  {benefit.benefitType === 'tiered' && benefit.rateTiers && (
                    <div className="mb-3">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Rate Tiers</h4>
                      <ul className="mt-1 space-y-1">
                        {benefit.rateTiers.map((tier, index) => (
                          <li key={index} className="text-sm text-gray-800">
                            {tier.rank}: ${tier.rate} {tier.description && `- ${tier.description}`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => openEditModal(benefit)}
                      className="px-3 py-1 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => openDeleteModal(benefit)}
                      className="px-3 py-1 text-sm text-red-600 hover:text-red-800 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create Benefit Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Create New Benefit</h2>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows="3"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Benefit Type*</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="benefitType"
                            value="fixed"
                            checked={formData.benefitType === 'fixed'}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2 text-gray-700">Fixed Amount</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="benefitType"
                            value="tiered"
                            checked={formData.benefitType === 'tiered'}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2 text-gray-700">Tiered Rates</span>
                        </label>
                      </div>
                    </div>
                    
                    {formData.benefitType === 'fixed' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount*</label>
                        <input
                          type="number"
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>
                    )}
                    
                    {formData.benefitType === 'tiered' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rate Tiers*</label>
                        <div className="space-y-2 mb-2">
                          {formData.rateTiers.map((tier, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <div>
                                <span className="font-medium text-gray-800">{tier.rank}: ${tier.rate}</span>
                                {tier.description && <span className="text-gray-600 ml-2">- {tier.description}</span>}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveRateTier(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <select
                            value={newRateTier.rank}
                            onChange={(e) => setNewRateTier({...newRateTier, rank: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Select Rank</option>
                            {availableRanks.map(rank => (
                              <option key={rank} value={rank}>{rank}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            placeholder="Rate"
                            value={newRateTier.rate}
                            onChange={(e) => setNewRateTier({...newRateTier, rate: parseFloat(e.target.value) || 0})}
                            min="0"
                            step="0.01"
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={newRateTier.description}
                            onChange={(e) => setNewRateTier({...newRateTier, description: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddRateTier}
                          disabled={!newRateTier.rank || newRateTier.rate < 0}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Rate Tier
                        </button>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Tenure (months)</label>
                      <input
                        type="number"
                        name="minTenure"
                        value={formData.minTenure}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Eligible Ranks*</label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableRanks.map(rank => (
                          <label key={rank} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              value={rank}
                              checked={formData.eligibleRanks.includes(rank)}
                              onChange={handleRankChange}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{rank}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Documents Required</label>
                      <div className="space-y-2 mb-2">
                        {formData.documentsRequired.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div>
                              <span className="font-medium text-gray-800">{doc.name}</span>
                              {doc.description && <span className="text-gray-600 ml-2">- {doc.description}</span>}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDocument(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Document name"
                          value={newDocument.name}
                          onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          value={newDocument.description}
                          onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddDocument}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">Active Benefit</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="autoApply"
                          checked={formData.autoApply}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">Auto-apply to all eligible employees</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsCreateModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Create Benefit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit Benefit Modal */}
        {isEditModalOpen && selectedBenefit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Edit Benefit</h2>
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        rows="3"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Benefit Type*</label>
                      <div className="flex space-x-4">
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="benefitType"
                            value="fixed"
                            checked={formData.benefitType === 'fixed'}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2 text-gray-700">Fixed Amount</span>
                        </label>
                        <label className="flex items-center">
                          <input
                            type="radio"
                            name="benefitType"
                            value="tiered"
                            checked={formData.benefitType === 'tiered'}
                            onChange={handleInputChange}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="ml-2 text-gray-700">Tiered Rates</span>
                        </label>
                      </div>
                    </div>
                    
                    {formData.benefitType === 'fixed' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount*</label>
                        <input
                          type="number"
                          name="amount"
                          value={formData.amount}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          required
                        />
                      </div>
                    )}
                    
                    {formData.benefitType === 'tiered' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rate Tiers*</label>
                        <div className="space-y-2 mb-2">
                          {formData.rateTiers.map((tier, index) => (
                            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                              <div>
                                <span className="font-medium text-gray-800">{tier.rank}: ${tier.rate}</span>
                                {tier.description && <span className="text-gray-600 ml-2">- {tier.description}</span>}
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveRateTier(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2 mb-2">
                          <select
                            value={newRateTier.rank}
                            onChange={(e) => setNewRateTier({...newRateTier, rank: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="">Select Rank</option>
                            {availableRanks.map(rank => (
                              <option key={rank} value={rank}>{rank}</option>
                            ))}
                          </select>
                          <input
                            type="number"
                            placeholder="Rate"
                            value={newRateTier.rate}
                            onChange={(e) => setNewRateTier({...newRateTier, rate: parseFloat(e.target.value) || 0})}
                            min="0"
                            step="0.01"
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            type="text"
                            placeholder="Description"
                            value={newRateTier.description}
                            onChange={(e) => setNewRateTier({...newRateTier, description: e.target.value})}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleAddRateTier}
                          disabled={!newRateTier.rank || newRateTier.rate < 0}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Add Rate Tier
                        </button>
                      </div>
                    )}
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Tenure (months)</label>
                      <input
                        type="number"
                        name="minTenure"
                        value={formData.minTenure}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Eligible Ranks*</label>
                      <div className="grid grid-cols-2 gap-2">
                        {availableRanks.map(rank => (
                          <label key={rank} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              value={rank}
                              checked={formData.eligibleRanks.includes(rank)}
                              onChange={handleRankChange}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="text-sm text-gray-700">{rank}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Documents Required</label>
                      <div className="space-y-2 mb-2">
                        {formData.documentsRequired.map((doc, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                            <div>
                              <span className="font-medium text-gray-800">{doc.name}</span>
                              {doc.description && <span className="text-gray-600 ml-2">- {doc.description}</span>}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemoveDocument(index)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Document name"
                          value={newDocument.name}
                          onChange={(e) => setNewDocument({...newDocument, name: e.target.value})}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <input
                          type="text"
                          placeholder="Description"
                          value={newDocument.description}
                          onChange={(e) => setNewDocument({...newDocument, description: e.target.value})}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddDocument}
                          className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">Active Benefit</label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          name="autoApply"
                          checked={formData.autoApply}
                          onChange={handleInputChange}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-700">Auto-apply to all eligible employees</label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                    >
                      Update Benefit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {isDeleteModalOpen && selectedBenefit && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl shadow-lg w-full max-w-md">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">Delete Benefit</h2>
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-gray-600 mb-6">Are you sure you want to delete the benefit <span className="font-semibold">"{selectedBenefit.name}"</span>? This action cannot be undone.</p>
                
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminBenefits;