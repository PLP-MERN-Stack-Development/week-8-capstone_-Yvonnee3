// // const mongoose = require('mongoose');
// // const { GridFSBucket } = require('mongodb');
// // const multer = require('multer');
// // const crypto = require('crypto');
// // const path = require('path');
// // require('dotenv').config();

// // // Initialize GridFSBucket
// // let gfs;

// // // Simple memory storage for multer
// // const storage = multer.memoryStorage();

// // // Configure multer upload
// // const upload = multer({
// //   storage,
// //   limits: {
// //     fileSize: 10 * 1024 * 1024 // 10MB limit
// //   }
// // });

// // // Initialize GridFS when MongoDB connection is ready
// // mongoose.connection.once('open', () => {
// //   gfs = new GridFSBucket(mongoose.connection.db, {
// //     bucketName: 'uploads'
// //   });
// //   console.log('GridFSBucket initialized');
// // });

// // // Safe accessor for gfs
// // const getGfs = () => {
// //   if (!gfs) {
// //     throw new Error('GridFS not initialized. Check MongoDB connection.');
// //   }
// //   return gfs;
// // };

// // module.exports = {
// //   getGfs,
// //   upload
// // };

// const mongoose = require('mongoose');
// const { GridFSBucket } = require('mongodb');
// const multer = require('multer');

// let gfs;
// let gfsPromise;

// // Simple memory storage for multer
// const storage = multer.memoryStorage();

// // Configure multer upload
// const upload = multer({
//   storage,
//   limits: {
//     fileSize: 10 * 1024 * 1024 // 10MB limit
//   }
// });

// const initGFS = () => {
//   return new Promise((resolve) => {
//     if (gfs) return resolve(gfs);
    
//     mongoose.connection.once('open', () => {
//       gfs = new GridFSBucket(mongoose.connection.db, {
//         bucketName: 'uploads'
//       });
//       console.log('GridFS initialized');
//       resolve(gfs);
//     });
//   });
// };

// // Make this available immediately
// gfsPromise = initGFS();

// const getGfs = async () => {
//   if (!gfs) {
//     console.log('Waiting for GridFS initialization...');
//     await gfsPromise;
//   }
//   return gfs;
// };

// module.exports = {
//   getGfs,
//   mongoose,
//   upload
// };

const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
const multer = require('multer');

class GridFSManager {
  constructor() {
    this.gfs = null;
    this.initialized = false;
    this.initPromise = null;
  }

  async initialize() {
    if (this.initialized) return this.gfs;
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        // Wait for connection if not ready
        if (mongoose.connection.readyState !== 1) {
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('MongoDB connection timeout'));
            }, 5000);

            mongoose.connection.once('open', () => {
              clearTimeout(timeout);
              resolve();
            });

            mongoose.connection.on('error', reject);
          });
        }

        this.gfs = new GridFSBucket(mongoose.connection.db, {
          bucketName: 'uploads'
        });

        // Verify GridFS collections exist
        const collections = await mongoose.connection.db.listCollections().toArray();
        const requiredCollections = ['uploads.files', 'uploads.chunks'];
        const missing = requiredCollections.filter(c => !collections.some(x => x.name === c));
        
        if (missing.length > 0) {
          throw new Error(`Missing GridFS collections: ${missing.join(', ')}`);
        }

        this.initialized = true;
        console.log('GridFS fully initialized and verified');
        return this.gfs;
      } catch (err) {
        console.error('GridFS initialization failed:', err);
        throw err;
      }
    })();

    return this.initPromise;
  }

  getGfs() {
    if (!this.initialized) {
      throw new Error('GridFS not initialized. Call initialize() first.');
    }
    return this.gfs;
  }
}

const gridFSManager = new GridFSManager();

// Multer configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

module.exports = {
  mongoose,
  gridFSManager,
  upload
};