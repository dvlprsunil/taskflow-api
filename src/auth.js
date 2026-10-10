const jwt = require('jsonwebtoken');

const TOKEN_TTL = '1h';

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set. Add it to your .env file.');
  }
  return secret;
}

function signToken(user) {
  return jwt.sign({ sub: String(user.id), email: user.email }, getSecret(), {
    expiresIn: TOKEN_TTL,
  });
}

function verifyToken(token) {
  return jwt.verify(token, getSecret(), { algorithms: ['HS256'] });
}

module.exports = { signToken, verifyToken };
