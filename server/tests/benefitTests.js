const request = require('supertest');
const app = require('../app');
const Benefit = require('../models/benefit');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

describe('Benefit Controller', () => {
  let adminToken;
  let employeeToken;
  let testBenefitId;

  beforeAll(async () => {
    // Clear test data
    await Benefit.deleteMany({});
    await User.deleteMany({});

    // Create test admin user
    const adminUser = await User.create({
      email: 'benefitadmin@test.com',
      password: 'Admin@123',
      firstName: 'Benefit',
      lastName: 'Admin',
      role: 'employer'
    });

    // Create test employee user
    const employeeUser = await User.create({
      email: 'benefitemployee@test.com',
      password: 'Employee@123',
      firstName: 'Benefit',
      lastName: 'Employee',
      role: 'employee',
      department: 'HR',
      rank: 'senior'
    });

    // Generate tokens
    adminToken = jwt.sign({ id: adminUser._id }, 'secret', { expiresIn: '1h' });
    employeeToken = jwt.sign({ id: employeeUser._id }, 'secret', { expiresIn: '1h' });
  });

  afterAll(async () => {
    await Benefit.deleteMany({});
    await User.deleteMany({});
  });

  describe('Admin Operations', () => {
    describe('POST /benefits', () => {
      it('should create a fixed benefit as admin', async () => {
        const res = await request(app)
          .post('/api/benefits')
          .set('Cookie', [`jwt=${adminToken}`])
          .send({
            name: 'Health Insurance',
            description: 'Comprehensive health coverage',
            benefitType: 'fixed',
            amount: 500,
            eligibleRanks: ['junior', 'senior'],
            minTenure: 3,
            isActive: true
          });

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('_id');
        expect(res.body.data.benefitType).toBe('fixed');
        testBenefitId = res.body.data._id;
      });

      it('should create a tiered benefit as admin', async () => {
        const res = await request(app)
          .post('/api/benefits')
          .set('Cookie', [`jwt=${adminToken}`])
          .send({
            name: 'Performance Bonus',
            description: 'Annual performance bonus',
            benefitType: 'tiered',
            rateTiers: [
              { rank: 'junior', rate: 1000, description: 'Junior bonus' },
              { rank: 'senior', rate: 2000, description: 'Senior bonus' }
            ],
            eligibleRanks: ['junior', 'senior'],
            minTenure: 6,
            isActive: true
          });

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.benefitType).toBe('tiered');
        expect(res.body.data.rateTiers.length).toBe(2);
      });

      it('should return 403 for non-admin users', async () => {
        const res = await request(app)
          .post('/api/benefits')
          .set('Cookie', [`jwt=${employeeToken}`])
          .send({
            name: 'Unauthorized Benefit',
            description: 'Should not be created',
            benefitType: 'fixed',
            amount: 100
          });

        expect(res.statusCode).toEqual(403);
      });

      it('should return 400 for invalid benefit data', async () => {
        const res = await request(app)
          .post('/api/benefits')
          .set('Cookie', [`jwt=${adminToken}`])
          .send({
            name: 'Invalid Benefit',
            benefitType: 'fixed'
            // Missing required fields
          });

        expect(res.statusCode).toEqual(400);
        expect(res.body.success).toBe(false);
      });
    });

    describe('GET /benefits', () => {
      it('should get all benefits as admin', async () => {
        const res = await request(app)
          .get('/api/benefits')
          .set('Cookie', [`jwt=${adminToken}`]);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        expect(res.body.data.length).toBeGreaterThanOrEqual(2);
      });

      it('should return 403 for non-admin users', async () => {
        const res = await request(app)
          .get('/api/benefits')
          .set('Cookie', [`jwt=${employeeToken}`]);

        expect(res.statusCode).toEqual(403);
      });
    });

    describe('PUT /benefits/:id', () => {
      it('should update a benefit as admin', async () => {
        const res = await request(app)
          .put(`/api/benefits/${testBenefitId}`)
          .set('Cookie', [`jwt=${adminToken}`])
          .send({
            name: 'Updated Health Insurance',
            amount: 600
          });

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.name).toBe('Updated Health Insurance');
        expect(res.body.data.amount).toBe(600);
      });

      it('should return 404 for non-existent benefit', async () => {
        const res = await request(app)
          .put('/api/benefits/507f1f77bcf86cd799439011')
          .set('Cookie', [`jwt=${adminToken}`])
          .send({
            name: 'Non-existent Benefit'
          });

        expect(res.statusCode).toEqual(404);
      });

      it('should return 400 for invalid update data', async () => {
        const res = await request(app)
          .put(`/api/benefits/${testBenefitId}`)
          .set('Cookie', [`jwt=${adminToken}`])
          .send({
            benefitType: 'tiered'
            // Missing rateTiers for tiered benefit
          });

        expect(res.statusCode).toEqual(400);
      });
    });

    describe('DELETE /benefits/:id', () => {
      it('should delete a benefit as admin', async () => {
        const res = await request(app)
          .delete(`/api/benefits/${testBenefitId}`)
          .set('Cookie', [`jwt=${adminToken}`]);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('id', testBenefitId);
      });

      it('should return 404 when deleting non-existent benefit', async () => {
        const res = await request(app)
          .delete(`/api/benefits/${testBenefitId}`)
          .set('Cookie', [`jwt=${adminToken}`]);

        expect(res.statusCode).toEqual(404);
      });
    });

    describe('GET /benefits/stats', () => {
      it('should get benefits statistics as admin', async () => {
        const res = await request(app)
          .get('/api/benefits/stats')
          .set('Cookie', [`jwt=${adminToken}`]);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('totalBenefits');
        expect(res.body.data).toHaveProperty('activeBenefits');
        expect(res.body.data).toHaveProperty('autoAppliedBenefits');
      });

      it('should return 403 for non-admin users', async () => {
        const res = await request(app)
          .get('/api/benefits/stats')
          .set('Cookie', [`jwt=${employeeToken}`]);

        expect(res.statusCode).toEqual(403);
      });
    });
  });

  describe('Employee Operations', () => {
    describe('GET /benefits/employee', () => {
      it('should get eligible benefits for employee', async () => {
        const res = await request(app)
          .get('/api/benefits/employee')
          .set('Cookie', [`jwt=${employeeToken}`]);

        expect(res.statusCode).toEqual(200);
        expect(res.body.success).toBe(true);
        expect(Array.isArray(res.body.data)).toBe(true);
        
        // Check enhanced benefit data
        if (res.body.data.length > 0) {
          const benefit = res.body.data[0];
          expect(benefit).toHaveProperty('isRequested');
          expect(benefit).toHaveProperty('requestStatus');
          
          if (benefit.benefitType === 'tiered') {
            expect(benefit).toHaveProperty('applicableRate');
            expect(benefit).toHaveProperty('rateDescription');
          }
        }
      });

      it('should return 403 for admin users', async () => {
        const res = await request(app)
          .get('/api/benefits/employee')
          .set('Cookie', [`jwt=${adminToken}`]);

        expect(res.statusCode).toEqual(403);
      });
    });
  });
});     