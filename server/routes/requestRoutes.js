const { Router } = require('express');
const { 
  getAllRequests,
  getUserRequests,
  requestBenefit,
  cancelRequest,
  reviewRequest,
  uploadRequestDocuments,
  getDocument,
  deleteDocument,
  getRequestsStats
} = require('../controllers/requestController');
const Request = require('../models/request');
const { getGfs, gfs, upload } = require('../utils/fileUtils');


const router = Router();

// Employee routes
router.get('/', getUserRequests);
router.post('/', requestBenefit);
router.delete('/:requestId', cancelRequest);

// Admin routes
router.get('/all', getAllRequests);
router.patch('/:requestId/review', reviewRequest);
router.get('/stats', getRequestsStats);


// Add to your existing routes
router.post('/:requestId/documents', uploadRequestDocuments);

router.get('/documents/:fileId', getDocument);

router.delete('/:requestId/documents/:fileId', deleteDocument);

// In your routes file
router.get('/api/documents/list', async (req, res) => {
  try {
    const gfs = getGfs();
    const files = await gfs.find().toArray();
    res.json(files);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


router.get('/test-gfs', async (req, res) => {
  try {
    const gfs = await getGfs();
    res.json({ status: 'GridFS ready' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;