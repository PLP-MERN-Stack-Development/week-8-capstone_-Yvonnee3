// routes/documents.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const Request = require('../models/request');
const { isAdmin } = require('../middleware/authMiddleware')

// Initialize GridFS bucket
let gfs;
const conn = mongoose.connection;
conn.once('open', () => {
  gfs = new GridFSBucket(conn.db, {
    bucketName: 'uploads' // Make sure this matches your upload bucket
  });
});

// Download document
router.get('/:id', async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.id);
    
    // 1. Verify file exists
    const file = await gfs.find({ _id: fileId }).next();
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // 2. Get all chunks at once
    const chunks = await mongoose.connection.db.collection('uploads.chunks')
      .find({ files_id: fileId })
      .sort({ n: 1 })
      .toArray();

    // 3. Combine chunks into single buffer
    const buffer = Buffer.concat(chunks.map(c => c.data.buffer));
    
    // 4. Verify length matches
    if (buffer.length !== file.length) {
      throw new Error(`Size mismatch: Expected ${file.length} bytes, got ${buffer.length}`);
    }

    // 5. Send file
    res.set({
      'Content-Type': file.contentType,
      'Content-Disposition': `attachment; filename="${encodeURIComponent(file.filename)}"`,
      'Content-Length': file.length,
      'Cache-Control': 'no-store'
    });
    
    res.end(buffer);
    console.log(`Successfully sent ${file.length} bytes`);

  } catch (err) {
    console.error('Download Error:', err);
    res.status(500).json({ 
      error: 'Download failed',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});



// routes/documents.js
router.get('/:id/status', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }

    const fileId = new mongoose.Types.ObjectId(req.params.id);
    const file = await gfs.find({ _id: fileId }).next();
    
    if (!file) {
      return res.json({ exists: false, inGridFS: false });
    }

    // Check request association
    const request = await Request.findOne({ 
      'documents._id': fileId 
    }).populate('user');

    // Permission logic
    let canAccess = false;
    if (request) {
      canAccess = !req.user || 
                 req.user.isAdmin || 
                 request.user._id.equals(req.user._id);
    }

    return res.json({
      exists: true,
      inGridFS: true,
      inRequests: !!request,
      canAccess,
      file: {
        id: file._id,
        filename: file.filename,
        size: file.length,
        uploadDate: file.uploadDate,
        contentType: file.contentType
      },
      request: request ? {
        id: request._id,
        status: request.status,
        userId: request.user._id
      } : null
    });

  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;