const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');
const { protect } = require('../middleware/authMiddleware');
const { authorizeAdmin } = require('../middleware/adminMiddleware');
const { getProjectAccess } = require('../middleware/projectAccess');
const { validateBoardItems } = require('../socket/socketHandler');
const { validateFileContent } = require('../utils/fileValidation');
const validateConfig = require('../config/validateConfig');

process.env.JWT_SECRET = 'collabhub-unit-test-secret-at-least-32-characters';
const userId = '507f1f77bcf86cd799439011';
const memberId = '507f1f77bcf86cd799439012';
const projectId = '507f1f77bcf86cd799439013';

function mockResponse() {
  return { statusCode: 200, status(code) { this.statusCode = code; return this; }, json(body) { this.body = body; return this; } };
}

test('protect rejects requests without a bearer token', async () => {
  const response = mockResponse();
  await protect({ headers: {} }, response, () => assert.fail('next must not run'));
  assert.equal(response.statusCode, 401);
});

test('protect accepts a valid token for an active user', async () => {
  const original = User.findById;
  User.findById = () => ({ select: async () => ({ _id: userId, isActive: true }) });
  try {
    const response = mockResponse(); let proceeded = false;
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
    await protect({ headers: { authorization: `Bearer ${token}` } }, response, () => { proceeded = true; });
    assert.equal(proceeded, true);
    assert.equal(response.statusCode, 200);
  } finally { User.findById = original; }
});

test('protect blocks suspended users even when their JWT remains valid', async () => {
  const original = User.findById;
  User.findById = () => ({ select: async () => ({ _id: userId, isActive: false }) });
  try {
    const response = mockResponse();
    const token = jwt.sign({ id: userId }, process.env.JWT_SECRET);
    await protect({ headers: { authorization: `Bearer ${token}` } }, response, () => assert.fail('next must not run'));
    assert.equal(response.statusCode, 403);
  } finally { User.findById = original; }
});

test('admin middleware rejects normal users and accepts database role admin', () => {
  const denied = mockResponse();
  authorizeAdmin({ user: { role: 'student' } }, denied, () => assert.fail('next must not run'));
  assert.equal(denied.statusCode, 403);
  let proceeded = false;
  authorizeAdmin({ user: { role: 'admin' } }, mockResponse(), () => { proceeded = true; });
  assert.equal(proceeded, true);
});

test('project access permits members and denies non-members', async () => {
  const original = Project.findById;
  Project.findById = async () => ({ _id: projectId, owner: userId, members: [{ user: memberId }] });
  try {
    assert.equal((await getProjectAccess(projectId, memberId)).isMember, true);
    assert.equal((await getProjectAccess(projectId, '507f1f77bcf86cd799439014')).status, 403);
    assert.equal((await getProjectAccess('invalid', memberId)).status, 400);
  } finally { Project.findById = original; }
});

test('whiteboard validator accepts basic vector items and rejects invalid payloads', () => {
  const valid = [
    { type: 'stroke', points: [{ x: 0.1, y: 0.2 }, { x: 0.4, y: 0.5 }], color: '#123abc', width: 3 },
    { type: 'text', x: 0.2, y: 0.3, text: 'Project goal', color: '#ffffff', width: 3 }
  ];
  assert.equal(validateBoardItems(valid).length, 2);
  assert.equal(validateBoardItems([{ type: 'stroke', points: [{ x: 2, y: 0 }], color: '#fff', width: 2 }]), null);
  assert.equal(validateBoardItems(new Array(1001).fill(valid[0])), null);
});

test('file validation checks extension, MIME type, and file signatures', () => {
  assert.equal(validateFileContent('application/pdf', '.pdf', Buffer.from('%PDF-1.7')), true);
  assert.equal(validateFileContent('image/png', '.png', Buffer.from('not a png')), false);
  assert.equal(validateFileContent('application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.docx', Buffer.from([0x50, 0x4b, 0x03, 0x04])), false);
});

test('startup configuration rejects placeholder secrets and production HTTP origins', () => {
  const base = { MONGO_URI: 'mongodb+srv://db.example/collabhub', JWT_SECRET: 'a-random-secret-with-at-least-32-characters', NODE_ENV: 'production', CORS_ORIGINS: 'http://client.example.com' };
  assert.throws(() => validateConfig(base), /HTTPS/);
  assert.throws(() => validateConfig({ ...base, JWT_SECRET: 'replace_with_a_real_secret_that_is_long' }), /JWT_SECRET/);
  assert.deepEqual(validateConfig({ ...base, CORS_ORIGINS: 'https://client.example.com' }).origins, ['https://client.example.com']);
});
