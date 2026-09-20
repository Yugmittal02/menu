const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Cafe = require('../models/Cafe');

// Verify any JWT token
exports.verifyToken = async (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ message: 'Access Denied' });

  try {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;

    // Ensure cafeId is a valid ObjectId for MongoDB
    if (req.user.role === 'cafeowner' && !mongoose.Types.ObjectId.isValid(req.user.cafeId)) {
      if (mongoose.connection.readyState === 2) {
        await new Promise((resolve) => {
          mongoose.connection.once('connected', resolve);
          setTimeout(resolve, 3500);
        });
      }

      if (mongoose.connection.readyState === 1) {
        let foundCafe = req.user.cafeCode ? await Cafe.findOne({ cafeId: req.user.cafeCode.toUpperCase() }) : null;
        if (!foundCafe) {
          // If token has no valid cafe binding, reject strictly - NEVER fall back to another cafe
          return res.status(401).json({ message: 'Invalid tenant binding for cafe owner' });
        }
        req.user.cafeId = foundCafe._id;
      }
    }

    // Attach verified cafe context
    if (req.user.cafeId) {
      req.cafeId = req.user.cafeId;
    }

    next();
  } catch (error) {
    res.status(400).json({ message: 'Invalid Token' });
  }
};

// Optional token verification - proceeds as guest if no token or invalid token
exports.optionalVerifyToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return next();

  try {
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    if (req.user.cafeId) {
      req.cafeId = req.user.cafeId;
    }
  } catch (error) {
    // Proceed as guest without setting req.user
  }
  next();
};

// Strict tenant scope validator - blocks any request where client attempts to pass a different tenant ID
exports.enforceTenantScope = (req, res, next) => {
  if (!req.user || !req.user.cafeId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  const clientCafeId = req.body?.cafeId || req.body?.cafe || req.params?.cafeId || req.query?.cafeId;
  if (clientCafeId) {
    const userCafeIdStr = String(req.user.cafeId);
    const clientCafeIdStr = String(clientCafeId);
    const matchesCode = req.user.cafeCode && clientCafeIdStr.toUpperCase() === req.user.cafeCode.toUpperCase();
    if (clientCafeIdStr !== userCafeIdStr && !matchesCode) {
      return res.status(403).json({ message: 'Access denied: Cross-tenant operation rejected' });
    }
  }

  // Force server-derived tenant ID onto req.body for safety
  if (req.body && typeof req.body === 'object') {
    delete req.body.cafeId;
    req.body.cafe = req.user.cafeId;
  }

  next();
};

// Admin / SuperAdmin check
exports.isAdmin = (req, res, next) => {
  if (req.user && (req.user.role === 'admin' || req.user.role === 'superadmin')) {
    next();
  } else {
    res.status(403).json({ message: 'Admin access required' });
  }
};

// SuperAdmin only
exports.isSuperAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'superadmin') {
    next();
  } else {
    res.status(403).json({ message: 'SuperAdmin access required' });
  }
};

// Cafe Owner only
exports.isCafeOwner = (req, res, next) => {
  if (req.user && req.user.role === 'cafeowner') {
    next();
  } else {
    res.status(403).json({ message: 'Cafe owner access required' });
  }
};

const offlineStore = require('../utils/offlineStore');

// Attach cafe document to req for cafe owner routes
exports.attachCafe = async (req, res, next) => {
  try {
    if (req.user && req.user.role === 'cafeowner' && req.user.cafeId) {
      let cafe;
      if (mongoose.connection.readyState === 1) {
        cafe = await Cafe.findById(req.user.cafeId);
      } else {
        cafe = offlineStore.findCafe(c => c._id === req.user.cafeId || c.cafeId === req.user.cafeCode);
      }
      if (!cafe) return res.status(404).json({ message: 'Cafe not found' });
      if (cafe.isActive === false) return res.status(403).json({ message: 'Cafe is deactivated' });
      req.cafe = cafe;
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};
