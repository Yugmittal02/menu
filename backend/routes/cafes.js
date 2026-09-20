const router = require('express').Router();
const { verifyToken, isSuperAdmin, isCafeOwner, attachCafe } = require('../middleware/authMiddleware');
const {
  createCafe, getAllCafes, getPublicCafeInfo, getMyCafe,
  updateCafe, toggleCafeStatus, deleteCafe, changeCafePassword,
  getMyOnboarding, updateMyOnboarding
} = require('../controllers/cafeController');

// Public
router.get('/public/:cafeId', getPublicCafeInfo);

// SuperAdmin routes
router.post('/', verifyToken, isSuperAdmin, createCafe);
router.get('/', verifyToken, isSuperAdmin, getAllCafes);
router.put('/:id', verifyToken, isSuperAdmin, updateCafe);
router.patch('/:id/toggle', verifyToken, isSuperAdmin, toggleCafeStatus);
router.delete('/:id', verifyToken, isSuperAdmin, deleteCafe);

// Cafe Owner routes
router.get('/me', verifyToken, isCafeOwner, getMyCafe);
router.get('/me/onboarding', verifyToken, isCafeOwner, getMyOnboarding);
router.put('/me/onboarding', verifyToken, isCafeOwner, updateMyOnboarding);
router.put('/me/update', verifyToken, isCafeOwner, attachCafe, (req, res, next) => {
  req.params.id = req.user.cafeId;
  next();
}, updateCafe);
router.put('/me/password', verifyToken, isCafeOwner, changeCafePassword);

module.exports = router;
