const jwt = require('jsonwebtoken');

/**
 * Generates a signed JWT for authenticated user session
 * @param {string} id - User ID
 * @returns {string} Signed JWT Token
 */
const generateToken = (id) => {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must contain at least 32 characters');
  }
  return jwt.sign(
    { id },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d'
    }
  );
};

module.exports = generateToken;
