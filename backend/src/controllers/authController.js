const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { sendVerificationEmail } = require('../services/emailService');
const logger = require('../utils/logger');

// POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { email, password, inviteToken } = req.body;

    // Check duplicate
    const existing = await db('users').where({ email }).first();
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    let role = 'volunteer';
    let organizationId = null;

    // If invite token provided → org_admin registration
    if (inviteToken) {
      const invite = await db('invite_tokens')
        .where({ token: inviteToken, email, is_used: false })
        .first();
      if (!invite) return res.status(400).json({ error: 'Invalid or expired invite token' });
      if (new Date(invite.expires_at) < new Date()) {
        return res.status(400).json({ error: 'Invite token has expired' });
      }
      role = 'org_admin';
      organizationId = invite.organization_id;
      // Mark token as used
      await db('invite_tokens').where({ id: invite.id }).update({ is_used: true });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const userId = uuidv4();

    await db('users').insert({
      id: userId,
      email,
      password_hash,
      role,
      organization_id: organizationId,
      email_verified: role === 'org_admin', // Org admins auto-verified via invite
    });

    // Send email verification for volunteers
    if (role === 'volunteer') {
      const verifyToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await db('email_verification_tokens').insert({
        user_id: userId,
        token: verifyToken,
        expires_at: expires,
      });
      await sendVerificationEmail(email, verifyToken);
    }

    res.status(201).json({
      message: role === 'volunteer'
        ? 'Registration successful. Please check your email to verify your account.'
        : 'Registration successful. You can now log in.',
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/verify/:token
const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;
    const record = await db('email_verification_tokens').where({ token }).first();
    if (!record) return res.status(400).json({ error: 'Invalid verification token' });
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Verification token has expired. Please request a new one.' });
    }
    await db('users').where({ id: record.user_id }).update({ email_verified: true });
    await db('email_verification_tokens').where({ id: record.id }).delete();
    res.json({ message: 'Email verified successfully. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/resend-verification
const resendVerification = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await db('users').where({ email, role: 'volunteer' }).first();
    if (!user) return res.status(404).json({ error: 'User not found' });
    if (user.email_verified) return res.status(400).json({ error: 'Email already verified' });

    await db('email_verification_tokens').where({ user_id: user.id }).delete();
    const verifyToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await db('email_verification_tokens').insert({ user_id: user.id, token: verifyToken, expires_at: expires });
    await sendVerificationEmail(email, verifyToken);
    res.json({ message: 'Verification email resent.' });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await db('users').where({ email, is_active: true }).first();
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (!user.email_verified) {
      return res.status(403).json({ error: 'Please verify your email before logging in.' });
    }

    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organization_id,
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/auth/me
const me = async (req, res, next) => {
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    if (!user) return res.status(404).json({ error: 'User not found' });

    let profile = null;
    if (user.role === 'volunteer') {
      profile = await db('volunteer_profiles').where({ user_id: user.id }).first();
    }

    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organization_id,
      emailVerified: user.email_verified,
      profile,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, verifyEmail, resendVerification, login, me };
