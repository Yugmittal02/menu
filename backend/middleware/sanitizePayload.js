/**
 * Mass-assignment protection, field allowlisting, and sensitive data masking.
 */

const PROTECTED_FIELDS = [
  'tenant_id',
  'cafe',
  'cafeId',
  'owner_id',
  'role',
  'permissions',
  'is_admin',
  'isAdmin',
  'paymentStatus',
  'payment_status',
  'bill_status',
  'invoiceNumber',
  'invoice_number',
  'createdAt',
  'created_at',
  'updatedAt',
  'updated_at',
  'audit'
];

/**
 * Middleware: Strips globally protected fields from req.body
 */
const stripProtectedFields = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    PROTECTED_FIELDS.forEach((field) => {
      delete req.body[field];
    });
  }
  next();
};

/**
 * Middleware factory: Allows ONLY explicitly declared fields in req.body
 * @param {string[]} allowedFields
 */
const filterAllowedFields = (allowedFields) => {
  return (req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      const sanitized = {};
      allowedFields.forEach((field) => {
        if (req.body[field] !== undefined) {
          sanitized[field] = req.body[field];
        }
      });
      req.body = sanitized;
    }
    next();
  };
};

/**
 * Helper: Masks customer phone numbers for public tracking or unauthorized interfaces
 * Example: '+91 98765 43210' -> '******3210'
 */
const maskPhoneNumber = (phone) => {
  if (!phone || typeof phone !== 'string') return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '****';
  const lastFour = digits.slice(-4);
  return `******${lastFour}`;
};

module.exports = {
  PROTECTED_FIELDS,
  stripProtectedFields,
  filterAllowedFields,
  maskPhoneNumber
};
