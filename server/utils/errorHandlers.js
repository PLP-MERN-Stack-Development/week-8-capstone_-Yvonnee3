
const ErrorResponse = (message, statusCode, details = {}) => ({
  success: false,
  error: {
    message,
    statusCode,
    ...details
  },
  stack: process.env.NODE_ENV === 'development' ? new Error().stack : undefined
});

/**
 * Global error handler middleware
 */
const handleErrors = (err, req, res, next) => {
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json(
      ErrorResponse('Invalid token', 401)
    );
  }

  // Handle token expiration
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json(
      ErrorResponse('Token expired', 401, { expiredAt: err.expiredAt })
    );
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json(
      ErrorResponse('Validation failed', 400, { errors })
    );
  }

  // Handle duplicate key errors
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json(
      ErrorResponse('Duplicate field value', 400, { field })
    );
  }

  // Handle custom error responses
  if (err.error?.statusCode) {
    return res.status(err.error.statusCode).json(err);
  }

  // Fallback to generic server error
  console.error('Server Error:', err);
  res.status(500).json(
    ErrorResponse('Server Error', 500)
  );
};

/**
 * Async handler wrapper to catch promise rejections
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = {
  ErrorResponse,
  handleErrors,
  asyncHandler
};