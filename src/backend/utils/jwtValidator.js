/**
 * JWT token validation utilities for WebSocket connections
 * Validates Supabase JWT tokens without requiring full Supabase client
 */

import jwt from 'jsonwebtoken';

// Supabase JWT secret (found in Supabase dashboard -> Settings -> API -> JWT Secret)
// For development, you can use the anon key, but for production use the JWT secret
const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.SUPABASE_ANON_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;

/**
 * Validates a Supabase JWT token
 * @param {string} token - JWT token to validate
 * @returns {Object|null} - Decoded token payload with user info, or null if invalid
 */
function validateSupabaseToken(token) {
  if (!token) {
    return null;
  }

  if (!JWT_SECRET) {
    console.warn('⚠️  JWT_SECRET not configured - token validation disabled');
    return null;
  }

  try {
    // Verify JWT signature
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256'],
      issuer: SUPABASE_URL ? `${SUPABASE_URL}/auth/v1` : undefined
    });

    // Check if token is expired (JWT library does this, but double-check)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      return null;
    }

    return {
      userId: decoded.sub,
      email: decoded.email,
      role: decoded.role || 'authenticated',
      exp: decoded.exp,
      raw: decoded
    };
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      console.warn('Token expired');
      return null;
    }
    if (error.name === 'JsonWebTokenError') {
      console.warn('Invalid token format');
      return null;
    }
    console.error('Token validation error:', error.message);
    return null;
  }
}

/**
 * Validates token and returns user ID if valid
 * @param {string} token - JWT token
 * @returns {string|null} - User ID (UUID) or null if invalid
 */
function getUserIdFromToken(token) {
  const validated = validateSupabaseToken(token);
  return validated ? validated.userId : null;
}

/**
 * Verifies that a player ID matches the authenticated user
 * @param {string} token - JWT token
 * @param {string} playerId - Player ID to verify
 * @returns {boolean} - True if playerId matches authenticated user
 */
function verifyPlayerId(token, playerId) {
  const userId = getUserIdFromToken(token);
  if (!userId) {
    return false;
  }

  // In Supabase, the user.id is typically a UUID
  // If your playerId is stored differently, you may need to look it up
  // For now, we assume playerId === userId (Supabase auth UUID)
  return userId === playerId;
}

export {
  validateSupabaseToken,
  getUserIdFromToken,
  verifyPlayerId
};

