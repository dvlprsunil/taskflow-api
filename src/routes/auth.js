const express = require('express');
const bcrypt = require('bcryptjs');
const db = require('../db');
const { signToken } = require('../auth');

const router = express.Router();

const BCRYPT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(body) {
  const errors = [];
  if (typeof body.email !== 'string' || !EMAIL_PATTERN.test(body.email)) {
    errors.push('email must be a valid email address');
  }
  if (typeof body.password !== 'string' || body.password.length < MIN_PASSWORD_LENGTH) {
    errors.push(`password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  return errors;
}

// Wraps async handlers so rejected promises reach the error handler
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// POST /auth/register - create an account
router.post(
  '/register',
  asyncHandler(async (req, res) => {
    const errors = validateCredentials(req.body);
    if (errors.length) return res.status(400).json({ errors });

    const email = req.body.email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(req.body.password, BCRYPT_ROUNDS);

    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (email) DO NOTHING
       RETURNING id, email, created_at`,
      [email, passwordHash]
    );
    if (rows.length === 0) return res.status(409).json({ error: 'Email is already registered' });

    const user = rows[0];
    res.status(201).json({ user, token: signToken(user) });
  })
);

// POST /auth/login - exchange credentials for a token
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [
      email.trim().toLowerCase(),
    ]);
    const user = rows[0];
    const valid = user && (await bcrypt.compare(password, user.password_hash));
    if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

    res.json({
      user: { id: user.id, email: user.email, created_at: user.created_at },
      token: signToken(user),
    });
  })
);

module.exports = router;
