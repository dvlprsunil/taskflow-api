const request = require('supertest');
const app = require('../../src/app');

// Registers a user and returns its bearer token
async function registerUser(email = 'user@example.com', password = 'password123') {
  const res = await request(app).post('/auth/register').send({ email, password });
  return res.body.token;
}

module.exports = { registerUser };
