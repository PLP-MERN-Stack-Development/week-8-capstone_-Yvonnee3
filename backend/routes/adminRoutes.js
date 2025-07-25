const express = require('express');
const { Router } = require('express');
const { getAllRequests, getUsers } = require('../controllers/adminController');
const { requireAdmin } = require('../middleware/authMiddleware');

const router = Router();

// Admin dashboard endpoints
router.get('/requests', requireAdmin, getAllRequests);
router.get('/users', requireAdmin, getUsers);

module.exports = router;