import React from 'react';
import { useTheme } from '../../context/ThemeContext';

const LoadingSpinner = ({ size = 'md', text = 'Loading...' }) => {
  const { current } = useTheme();

  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16'
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${current.bg.primary}`}>
      <div className="flex items-center space-x-3">
        <svg
          className={`animate-spin ${sizeClasses[size]} text-primary-600`}
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
        {text && (
          <span className={`text-sm font-medium ${current.text.secondary}`}>
            {text}
          </span>
        )}
      </div>
    </div>
  );
};

export default LoadingSpinner;
