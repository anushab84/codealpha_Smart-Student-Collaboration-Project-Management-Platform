process.env.JWT_SECRET = 'collabhub-integration-test-secret-at-least-32-chars';
const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { httpServer } = require('../server');

let baseUrl;
test.before(async () => {
  await new Promise((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${httpServer.address().port}`;
});
test.after(async () => { await new Promise((resolve, reject) => httpServer.close((error) => error ? reject(error) : resolve())); });

test('protected notification API rejects unauthenticated requests', async () => {
  const response = await fetch(`${baseUrl}/api/notifications`);
  assert.equal(response.status, 401);
});

test('admin API rejects a valid authenticated non-admin', async () => {
  const original = User.findById;
  User.findById = () => ({ select: async () => ({ _id: '507f1f77bcf86cd799439011', isActive: true, role: 'student' }) });
  try {
    const token = jwt.sign({ id: '507f1f77bcf86cd799439011' }, process.env.JWT_SECRET);
    const response = await fetch(`${baseUrl}/api/admin/overview`, { headers: { Authorization: `Bearer ${token}` } });
    assert.equal(response.status, 403);
    assert.equal((await response.json()).message, 'Administrator access required');
  } finally { User.findById = original; }
});

test('malformed JSON receives a client error without reaching an API controller', async () => {
  const response = await fetch(`${baseUrl}/api/posts`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{invalid' });
  assert.equal(response.status, 400);
});

test('API responses include security headers', async () => {
  const response = await fetch(`${baseUrl}/`);
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(response.headers.get('x-frame-options'), 'DENY');
});

test('health check reports unavailable when MongoDB is disconnected', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 503);
  assert.equal((await response.json()).database, 'Disconnected');
});
