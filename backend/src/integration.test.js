'use strict';

/**
 * Integration tests — Full CRUD flow:
 * register → login → create marker → edit marker → delete marker → verify exclusion
 *
 * Validates: Requirements 1.5, 2.2, 3.8, 4.6, 5.3, 5.6
 */

const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('./app');

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);

  // Set JWT env vars for the test run
  process.env.JWT_SECRET = 'integration-test-secret';
  process.env.JWT_EXPIRES_IN = '1h';
}, 30_000);

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
}, 15_000);

describe('Full CRUD integration flow', () => {
  const testUser = {
    username: 'integrationuser',
    email: 'integration@test.com',
    password: 'SecurePass123!',
  };

  let authToken;
  let markerId;

  it('should register a new user and return a token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body).toHaveProperty('token');
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.user.email).toBe(testUser.email);
    // Save token for subsequent requests
    authToken = res.body.token;
  });

  it('should login with registered credentials and return a token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body).toHaveProperty('token');
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.username).toBe(testUser.username);
    expect(res.body.user.email).toBe(testUser.email);
    // Use fresh token from login
    authToken = res.body.token;
  });

  it('should create a marker with required fields', async () => {
    const res = await request(app)
      .post('/api/markers')
      .set('Authorization', `Bearer ${authToken}`)
      .field('title', 'Test Mural')
      .field('category', 'mural')
      .field('description', 'A beautiful street mural')
      .field('longitude', '-3.7038')
      .field('latitude', '40.4168')
      .expect(201);

    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('Test Mural');
    expect(res.body.category).toBe('mural');
    expect(res.body.description).toBe('A beautiful street mural');
    expect(res.body.location.type).toBe('Point');
    expect(res.body.location.coordinates).toEqual([-3.7038, 40.4168]);
    expect(res.body.deletedAt).toBeNull();

    markerId = res.body._id;
  });

  it('should edit the marker title and preserve other fields', async () => {
    const res = await request(app)
      .put(`/api/markers/${markerId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Updated Mural Title' })
      .expect(200);

    expect(res.body.title).toBe('Updated Mural Title');
    // Original fields preserved
    expect(res.body.category).toBe('mural');
    expect(res.body.description).toBe('A beautiful street mural');
    expect(res.body.location.type).toBe('Point');
    expect(res.body.location.coordinates).toEqual([-3.7038, 40.4168]);
    expect(res.body.deletedAt).toBeNull();
  });

  it('should soft-delete the marker', async () => {
    const res = await request(app)
      .delete(`/api/markers/${markerId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.message).toBe('Marker deleted');
  });

  it('should exclude the deleted marker from the markers list', async () => {
    const res = await request(app)
      .get('/api/markers')
      .expect(200);

    const ids = res.body.map((m) => m._id);
    expect(ids).not.toContain(markerId);
  });
});
