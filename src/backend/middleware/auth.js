/**
 * Authentication middleware for Express routes
 * Validates Supabase JWT tokens and attaches user info to request
 */

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase admin client for server-side token verification
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('⚠️  WARNING: SUPABASE_URL and SUPABASE_ANON_KEY must be set for authentication');
}

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Middleware to require authentication on routes
 * Validates JWT token from Authorization header or cookie
 */
const requireAuth = async (req, res, next) => {
  if (!supabase) {
    return res.status(503).json({ 
      error: 'Authentication service not configured',
      success: false 
    });
  }

  try {
    // Get token from Authorization header or cookie
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.sb_access_token) {
      token = req.cookies.sb_access_token;
    } else if (req.headers['x-access-token']) {
      token = req.headers['x-access-token'];
    }

    if (!token) {
      return res.status(401).json({ 
        error: 'No authentication token provided',
        success: false 
      });
    }

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ 
        error: 'Invalid or expired authentication token',
        success: false 
      });
    }

    // Attach user to request for use in route handlers
    req.user = user;
    req.userId = user.id;
    
    next();
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return res.status(500).json({ 
      error: 'Authentication verification failed',
      success: false 
    });
  }
};

/**
 * Optional authentication - attaches user if token is valid, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  if (!supabase) {
    return next();
  }

  try {
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies?.sb_access_token) {
      token = req.cookies.sb_access_token;
    } else if (req.headers['x-access-token']) {
      token = req.headers['x-access-token'];
    }

    if (token) {
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (!error && user) {
        req.user = user;
        req.userId = user.id;
      }
    }
    
    next();
  } catch (error) {
    // Ignore errors in optional auth
    next();
  }
};

/**
 * Middleware to verify player ownership
 * Ensures the playerId in request matches the authenticated user
 */
const verifyPlayerOwnership = (req, res, next) => {
  if (!req.userId) {
    return res.status(401).json({ 
      error: 'Authentication required',
      success: false 
    });
  }

  const requestedPlayerId = req.body?.playerId || req.params?.playerId || req.query?.playerId;
  
  // Allow if no playerId specified (will be checked in route handler)
  if (!requestedPlayerId) {
    return next();
  }

  // In Supabase, user.id is the UUID - if playerId is UUID, verify directly
  // If playerId is a different format, you may need to look up in profiles table
  if (requestedPlayerId !== req.userId) {
    // Check if this is a profile lookup scenario
    // For now, we'll require exact match or proper profile relationship
    return res.status(403).json({ 
      error: 'You do not have permission to access this player\'s data',
      success: false 
    });
  }

  next();
};

module.exports = {
  requireAuth,
  optionalAuth,
  verifyPlayerOwnership,
  supabase
};

