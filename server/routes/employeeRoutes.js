const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  getEmployeeDashboardStats
} = require('../controllers/employeeController');
const {
  getRecentRequests
} = require('../controllers/requestController');

router.get('/dashboard-stats', protect, getEmployeeDashboardStats);
router.get('/recent', protect, getRecentRequests);

module.exports = router;