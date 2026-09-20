const router = require('express').Router();
const { verifyToken, isCafeOwner, enforceTenantScope } = require('../middleware/authMiddleware');
const {
  createCoupon, getMyCoupons, updateCoupon, deleteCoupon, toggleCoupon, validateCoupon, getPublicCoupons
} = require('../controllers/couponController');

// Public — customer validates coupon and views active offers
router.post('/validate', validateCoupon);
router.get('/public/:cafeId', getPublicCoupons);

// Cafe Owner routes (strictly tenant isolated)
router.post('/', verifyToken, isCafeOwner, enforceTenantScope, createCoupon);
router.get('/', verifyToken, isCafeOwner, enforceTenantScope, getMyCoupons);
router.put('/:id', verifyToken, isCafeOwner, enforceTenantScope, updateCoupon);
router.delete('/:id', verifyToken, isCafeOwner, enforceTenantScope, deleteCoupon);
router.patch('/:id/toggle', verifyToken, isCafeOwner, enforceTenantScope, toggleCoupon);

module.exports = router;
