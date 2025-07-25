import React from 'react';

const LoadingSpinner = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <div className="spinner mx-auto mb-4"></div>
        <p className="text-lg text-gray-600 animate-pulse">Loading...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
