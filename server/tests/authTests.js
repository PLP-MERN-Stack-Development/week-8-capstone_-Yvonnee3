const request = require('supertest');
const app = require('../app');
const User = require('../models/user');
const jwt = require('jsonwebtoken');

describe('Auth Controller', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Clear test users
    await User.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
  });

  describe('POST /register', () => {
    it('should register a new employer/admin user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'admin@test.com',
          password: 'Admin@123',
          firstName: 'Admin',
          lastName: 'User',
          role: 'employer'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('success', true);
    });

    it('should register a new employee user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'employee@test.com',
          password: 'Employee@123',
          firstName: 'Employee',
          lastName: 'User',
          role: 'employee',
          department: 'IT',
          rank: 'junior'
        });

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      testUser = res.body.user;
    });

    it('should return 400 for duplicate email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'employee@test.com',
          password: 'Employee@123',
          firstName: 'Employee',
          lastName: 'User',
          role: 'employee'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errors.email).toBe('that email is already registered');
    });

    it('should return 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'incomplete@test.com',
          role: 'employee'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errors).toHaveProperty('password');
      expect(res.body.errors).toHaveProperty('firstName');
      expect(res.body.errors).toHaveProperty('lastName');
    });

    it('should return 400 for invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalidrole@test.com',
          password: 'Password@123',
          firstName: 'Test',
          lastName: 'User',
          role: 'invalid'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errors).toHaveProperty('role');
    });
  });

  describe('POST /login', () => {
    it('should login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee@test.com',
          password: 'Employee@123'
        });

      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('token');
      authToken = res.body.token;
    });

    it('should return 400 for incorrect email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'Password@123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errors.email).toBe('that email is not registered');
    });

    it('should return 400 for incorrect password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee@test.com',
          password: 'WrongPassword@123'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errors.password).toBe('that password is incorrect');
    });

    it('should return 400 for missing credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'employee@test.com'
        });

      expect(res.statusCode).toEqual(400);
      expect(res.body.errors).toHaveProperty('password');
    });
  });

  describe('GET /current-user', () => {
    it('should return current user with valid token', async () => {
      const res = await request(app)
        .get('/api/auth/current-user')
        .set('Cookie', [`jwt=${authToken}`]);

      expect(res.statusCode).toEqual(200);
      expect(res.body.user).toHaveProperty('email', 'employee@test.com');
      expect(res.body.user).toHaveProperty('role', 'employee');
    });

    it('should return 401 without token', async () => {
      const res = await request(app)
        .get('/api/auth/current-user');

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toBe('No token provided');
    });

    it('should return 401 with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/current-user')
        .set('Cookie', ['jwt=invalidtoken']);

      expect(res.statusCode).toEqual(401);
      expect(res.body.error).toBe('Invalid token');
    });
  });

  describe('GET /logout', () => {
    it('should clear jwt cookie on logout', async () => {
      const res = await request(app)
        .get('/api/auth/logout')
        .set('Cookie', [`jwt=${authToken}`]);

      expect(res.statusCode).toEqual(302); // Redirect
      expect(res.headers['set-cookie'][0]).toMatch(/jwt=;/);
    });
  });
});