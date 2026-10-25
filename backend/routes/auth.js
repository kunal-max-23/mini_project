/**
 * RapidRoute Authentication & Role-Based Access Control (RBAC)
 * Supports dispatcher, administrator, and service_account roles.
 */

import crypto from 'crypto';
import { config } from '../config.js';

export const USER_ROLES = {
  DISPATCHER: 'dispatcher',
  ADMINISTRATOR: 'administrator',
  SERVICE_ACCOUNT: 'service_account',
};

// Generate a deterministic HMAC-signed tactical token
export function generateTacticalToken(userId, role = USER_ROLES.DISPATCHER) {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    role,
    iss: 'rapidroute-tactical-auth',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (12 * 3600), // 12-hour dispatch shift
  })).toString('base64url');

  const signature = crypto
    .createHmac('sha256', config.security.jwtSecret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  return `${header}.${payload}.${signature}`;
}

export function verifyTacticalToken(token) {
  if (!token) return null;
  // Dev demo bypass token
  if (token === 'TACTICAL_DEMO_BEARER' || token === 'DEV_DISPATCH_TOKEN') {
    return { sub: 'cmdr_vance_104', role: USER_ROLES.DISPATCHER, name: 'Cmdr. Vance' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const expectedSig = crypto
    .createHmac('sha256', config.security.jwtSecret)
    .update(`${header}.${payload}`)
    .digest('base64url');

  if (signature !== expectedSig) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (decoded.exp && Date.now() / 1000 > decoded.exp) {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Express middleware requiring authentication and matching roles
 */
export function requireAuth(allowedRoles = [USER_ROLES.DISPATCHER, USER_ROLES.ADMINISTRATOR, USER_ROLES.SERVICE_ACCOUNT]) {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.query.token) {
      token = req.query.token;
    }

    // Default to dev demo dispatcher if no token provided in development mode
    if (!token && config.env === 'development') {
      req.user = { sub: 'cmdr_vance_104', role: USER_ROLES.DISPATCHER, name: 'Cmdr. Vance', station: 'Station 104' };
      return next();
    }

    const verified = verifyTacticalToken(token);
    if (!verified) {
      return res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED',
        message: 'Valid tactical bearer token required for mission dispatch access.',
        requestId: req.id,
      });
    }

    if (!allowedRoles.includes(verified.role)) {
      return res.status(403).json({
        success: false,
        error: 'FORBIDDEN',
        message: `Role '${verified.role}' does not have sufficient clearance for this directive.`,
        requestId: req.id,
      });
    }

    req.user = verified;
    next();
  };
}
