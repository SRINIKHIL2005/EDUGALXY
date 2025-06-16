import jwt from 'jsonwebtoken';

// Development mode flag - SET THIS TO FALSE IN PRODUCTION!
const BYPASS_AUTH_FOR_DEVELOPMENT = true;

// JWT Authentication Middleware
export const authenticateJWT = (req, res, next) => {
  // DEVELOPMENT MODE - Bypass authentication for easier development
  if (BYPASS_AUTH_FOR_DEVELOPMENT) {
    console.log('⚠️ WARNING: Authentication bypassed for development');
    req.user = {
      id: 'dev-user-id',
      name: 'Development User',
      role: 'hod',
      department: 'Engineering',
      email: 'dev@example.com'
    };
    return next();
  }
  
  // Normal authentication flow
  console.log('🔐 Authentication middleware called for route:', req.originalUrl);
  console.log('🔑 Headers present:', Object.keys(req.headers));
  
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    console.error('❌ No authorization header found');
    return res.status(401).json({ error: 'Unauthorized', message: 'No token provided' });
  }
  
  console.log('🔑 Authorization header found:', authHeader.substring(0, 20) + '...');
  
  const token = authHeader.split(' ')[1];
  if (!token) {
    console.error('❌ No token in authorization header');
    return res.status(401).json({ error: 'Unauthorized', message: 'Invalid token format' });
  }  try {
    // Use a consistent JWT_SECRET - try multiple possible values if needed
    const possibleSecrets = [
      process.env.JWT_SECRET, 
      'your_jwt_secret',
      'yoursecretkey',
      'dev_jwt_secret'
    ].filter(Boolean);

    console.log('🔑 Possible JWT secrets:', possibleSecrets.length);
    console.log('🔍 Token format check:', token.split('.').length === 3 ? 'Valid JWT format' : 'Invalid JWT format');
    
    // Try to decode without verification first to see payload
    let payload = null;
    try {
      payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
      console.log('👤 Token payload (NOT verified):', {
        id: payload.id,
        name: payload.name,
        role: payload.role,
        department: payload.department,
        exp: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'No expiration'
      });
    } catch (e) {
      console.error('❌ Failed to decode token payload:', e.message);
    }
    
    // Try each possible secret
    let decoded = null;
    let usedSecret = null;
    
    for (const secret of possibleSecrets) {
      try {
        decoded = jwt.verify(token, secret);
        usedSecret = secret;
        break; // If verification succeeds, stop trying
      } catch (verifyErr) {
        console.log(`⚠️ JWT verification failed with secret ${secret.substring(0, 3)}...: ${verifyErr.message}`);
      }
    }
    
    if (!decoded) {
      console.error('❌ JWT verification failed with all secrets');
      return res.status(403).json({ 
        error: 'Forbidden', 
        message: 'Invalid or expired token. Please login again.',
        details: 'Token verification failed with all possible secrets'
      });
    }
    
    console.log('✅ JWT verification successful using secret:', usedSecret.substring(0, 3) + '...');
    console.log('👤 Authenticated user:', { 
      id: decoded.id, 
      name: decoded.name,
      role: decoded.role, 
      department: decoded.department 
    });
    
    req.user = decoded;
    next();
  } catch (err) {
    console.error('❌ JWT verification error:', err.message);
    console.error('❌ Token (first part):', token.substring(0, 20) + '...');
    return res.status(403).json({ 
      error: 'Forbidden', 
      message: 'Authentication error: ' + err.message,
      details: 'Please try logging in again'
    });
  }
};

// Role-based middleware - requires specific role
export const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }

    // User has required role, proceed
    next();
  };
};
