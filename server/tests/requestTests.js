const request = require('supertest');
const app = require('../app');
const Benefit = require('../models/benefit');
const User = require('../models/user');
const Request = require('../models/request');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

describe('Request Controller', () => {
  let adminToken;
  let employeeToken;
  let employeeId;
  let testBenefitId;
  let testRequestId;

  beforeAll(async () => {
    // Clear test data
    await Request.deleteMany({});
    await Benefit.deleteMany({});
    await User.deleteMany({});

    // Create test admin user
    const adminUser = await User.create({
      email: 'requestadmin@test.com',
      password: 'Admin@123',
      firstName: 'Request',
      lastName: 'Admin',
      role: 'employer'
    });

    // Create test employee user
    const employeeUser = await User.create({
      email: 'requestemployee@test.com',
      password: 'Employee@123',
      firstName: 'Request',
      lastName: 'Employee',
      role: 'employee',
      department: 'Finance',
      rank: 'senior',
      tenureMonths: 12
    });
    employeeId = employeeUser._id;

    // Create test benefit
    const benefit = await Benefit.create({
      name: 'Test Benefit',
      description: 'For testing requests',
      benefitType: 'fixed',
      amount: 1000,
      eligibleRanks: ['senior'],
      minTenure: 6,
      isActive: true,
      createdBy: adminUser._id
    });
    testBenefitId = benefit._id;

    // Generate tokens
    adminToken = jwt.sign({ id: adminUser._id }, 'secret', { expiresIn: '1h' });
    employeeToken = jwt.sign({ id: employeeUser._id }, 'secret', { expiresIn: '1h' });
  });

  afterAll(async () => {
    await Request.deleteMany({});
    await Benefit.deleteMany({});
    await User.deleteMany({});
  });

  describe('Employee Operations', () => {
    describe('POST /requests', () => {
      it('should create a new benefit request', async () => {
        const res = await request(app)
          .post('/api/requests')
          .set('Cookie', [`jwt=${employeeToken}`])
          .send({
            benefitId: testBenefitId,
            documents: [
              { name: 'Document 1', url: 'http://example.com/doc1.pdf' }
            ]
          });

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('_id');
        expect(res.body.data.status).toBe('pending');
        testRequestId = res.body.data._id;
      });

      it('should return 400 for ineligible benefit', async () => {
        // Create a benefit the employee isn't eligible for
        const ineligibleBenefit = await Benefit.create({
          name: 'Ineligible Benefit',
          description: 'For testing ineligibility',
          benefitType: 'fixed',
          amount: 500,
          eligibleRanks: ['junior'],
          minTenure: 3,
          isActive: true
        });

        const res = await request(app)
          .post('/api/requests')
          .set('Cookie', [`jwt=${employeeToken}`])
          .send({
            benefitId: ineligibleBenefit._id
          });

        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('not eligible');
      });

      it('should return 400 for duplicate pending request', async () => {
        const res = await request(app)
          .post('/api/requests')
          .set('Cookie', [`jwt=${employeeToken}`])
          .send({
            benefitId: testBenefitId
          });

        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toBe(false);
        expect(res.body.error).toContain('already applied');
      });

      it('should return 403 for admin users', async () => {
        const res = await request(app)
          .post('/api/requests')
          .set('Cookie', [`jwt=${adminToken}`])
          .send({
            benefitId: testBenefitId
          });

        expect(res.statusCode).toEqual(403);
      });
    });

    describe('GET /requests', () => {
      it('should get employee requests', async () => {
        const res = await request(app)
          .get('/api/requests')
          .set('Cookie', [`jwt=${employeeToken}`]);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
        expect(res.body.data[0].user._id).toBe(employeeId.toString());
      });

      it('should return 401 without authentication', async () => {
        const res = await request(app)
          .get('/api/requests');

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('DELETE /requests/:requestId', () => {
      it('should cancel a pending request', async () => {
        const res = await request(app)
          .delete(`/api/requests/${testRequestId}`)
          .set('Cookie', [`jwt=${employeeToken}`]);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id', testRequestId);
      });

      it('should return 404 when canceling non-existent request', async () => {
        const res = await request(app)
          .delete(`/api/requests/${testRequestId}`)
          .set('Cookie', [`jwt=${employeeToken}`]);

        expect(res.statusCode).toEqual(404);
      });

      it('should return 403 when canceling another user\'s request', async () => {
        // Create another employee and request
        const otherEmployee = await User.create({
          email: 'other@test.com',
          password: 'Other@123',
          firstName: 'Other',
          lastName: 'Employee',
          role: 'employee',
          department: 'HR',
          rank: 'junior'
        });
        const otherToken = jwt.sign({ id: otherEmployee._id }, 'secret', { expiresIn: '1h' });
        
        const otherRequest = await Request.create({
          user: otherEmployee._id,
          benefit: testBenefitId,
          status: 'pending'
        });

        const res = await request(app)
          .delete(`/api/requests/${otherRequest._id}`)
          .set('Cookie', [`jwt=${employeeToken}`]);

        expect(res.statusCode).toEqual(403);
      });
    });
  });

  describe('Admin Operations', () => {
    let pendingRequestId;

    beforeAll(async () => {
      // Create a pending request for admin to review
      const request = await Request.create({
        user: employeeId,
        benefit: testBenefitId,
        status: 'pending'
      });
      pendingRequestId = request._id;
    });

    describe('GET /requests/all', () => {
      it('should get all requests as admin', async () => {
        const res = await request(app)
          .get('/api/requests/all')
          .set('Cookie', [`jwt=${adminToken}`]);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      });

      it('should return 403 for non-admin users', async () => {
        const res = await request(app)
          .get('/api/requests/all')
          .set('Cookie', [`jwt=${employeeToken}`]);

        expect(res.statusCode).toEqual(403);
      });
    });

    describe('PATCH /requests/:requestId/review', () => {
      it('should approve a request as admin', async () => {
        const res = await request(app)
          .patch(`/api/requests/${pendingRequestId}/review`)
          .set('Cookie', [`jwt=${adminToken}`])
          .send({
            status: 'approved',
            comment: 'Looks good!'
          });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('approved');
        expect(res.body.data.reviewerComments.length).toBe(1);
      });

      it('should reject a request with reason', async () => {
        // Create another pending request
        const request = await Request.create({
          user: employeeId,
          benefit: testBenefitId,
          status: 'pending'
        });

        const res = await request(app)
          .patch(`/api/requests/${request._id}/review`)
          .set('Cookie', [`jwt=${adminToken}`])
          .send({
            status: 'rejected',
            comment: 'Needs more info',
            rejectionReason: 'Incomplete documentation'
          });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.status).toBe('rejected');
        expect(res.body.data.rejectionReason).toBe('Incomplete documentation');
      });

      it('should return 400 for invalid status', async () => {
        const res = await request(app)
          .patch(`/api/requests/${pendingRequestId}/review`)
          .set('Cookie', [`jwt=${adminToken}`])
          .send({
            status: 'invalid'
          });

        expect(res.statusCode).toEqual(400);
      });

      it('should return 400 when rejecting without reason', async () => {
        const request = await Request.create({
          user: employeeId,
          benefit: testBenefitId,
          status: 'pending'
        });

        const res = await request(app)
          .patch(`/api/requests/${request._id}/review`)
          .set('Cookie', [`jwt=${adminToken}`])
          .send({
            status: 'rejected'
          });

        expect(res.statusCode).toEqual(400);
      });

      it('should return 403 for non-admin users', async () => {
        const res = await request(app)
          .patch(`/api/requests/${pendingRequestId}/review`)
          .set('Cookie', [`jwt=${employeeToken}`])
          .send({
            status: 'approved'
          });

        expect(res.statusCode).toEqual(403);
      });
    });

    describe('GET /requests/stats', () => {
      it('should get request statistics as admin', async () => {
        const res = await request(app)
          .get('/api/requests/stats')
          .set('Cookie', [`jwt=${adminToken}`]);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('totalRequests');
        expect(res.body.data).toHaveProperty('pendingRequests');
        expect(res.body.data).toHaveProperty('approvedRequests');
        expect(res.body.data).toHaveProperty('rejectedRequests');
      });

      it('should return 403 for non-admin users', async () => {
        const res = await request(app)
          .get('/api/requests/stats')
          .set('Cookie', [`jwt=${employeeToken}`]);

        expect(res.statusCode).toEqual(403);
      });
    });
  });

  describe('Document Operations', () => {
    let requestWithDocs;
    let testFileId;

    beforeAll(async () => {
      // Create a request with documents
      requestWithDocs = await Request.create({
        user: employeeId,
        benefit: testBenefitId,
        status: 'pending',
        documents: [
          {
            _id: new mongoose.Types.ObjectId(),
            name: 'Test Document',
            url: 'http://example.com/test.pdf',
            gridFSId: new mongoose.Types.ObjectId()
          }
        ]
      });
      testFileId = requestWithDocs.documents[0].gridFSId;
    });

    describe('POST /requests/:requestId/documents', () => {
      // Note: Actual file upload tests would require more complex setup with multer
      it('should return 401 without authentication', async () => {
        const res = await request(app)
          .post(`/api/requests/${requestWithDocs._id}/documents`);

        expect(res.statusCode).toEqual(401);
      });
    });

    describe('GET /documents/:fileId', () => {
      // Note: Actual file download tests would require GridFS setup
      it('should return 400 for invalid file ID', async () => {
        const res = await request(app)
          .get('/api/documents/invalid');

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('DELETE /:requestId/documents/:fileId', () => {
      it('should delete a document', async () => {
        const res = await request(app)
          .delete(`/api/requests/${requestWithDocs._id}/documents/${testFileId}`)
          .set('Cookie', [`jwt=${employeeToken}`]);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
      });

      it('should return 403 when deleting another user\'s document', async () => {
        // Create another employee
        const otherEmployee = await User.create({
          email: 'docemployee@test.com',
          password: 'Doc@123',
          firstName: 'Doc',
          lastName: 'Employee',
          role: 'employee'
        });
        const otherToken = jwt.sign({ id: otherEmployee._id }, 'secret', { expiresIn: '1h' });

        // Create a request with document for this employee
        const otherRequest = await Request.create({
          user: otherEmployee._id,
          benefit: testBenefitId,
          status: 'pending',
          documents: [
            {
              _id: new mongoose.Types.ObjectId(),
              name: 'Other Document',
              url: 'http://example.com/other.pdf',
              gridFSId: new mongoose.Types.ObjectId()
            }
          ]
        });

        const res = await request(app)
          .delete(`/api/requests/${otherRequest._id}/documents/${otherRequest.documents[0].gridFSId}`)
          .set('Cookie', [`jwt=${employeeToken}`]);

        expect(res.statusCode).toEqual(403);
      });
    });
  });
});