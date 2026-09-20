const router = require('express').Router();
const { verifyToken, isCafeOwner, enforceTenantScope } = require('../middleware/authMiddleware');
const {
  getMenuByCafe, getMyMenu, addMenuItem, updateMenuItem,
  deleteMenuItem, toggleAvailability, getCategories
} = require('../controllers/menuController');

// Public routes
router.get('/cafe/:cafeId', getMenuByCafe);
router.get('/cafe/:cafeId/categories', getCategories);

// Cafe Owner routes (strictly tenant isolated)
router.get('/my', verifyToken, isCafeOwner, enforceTenantScope, getMyMenu);
router.post('/', verifyToken, isCafeOwner, enforceTenantScope, addMenuItem);
router.put('/:id', verifyToken, isCafeOwner, enforceTenantScope, updateMenuItem);
router.delete('/:id', verifyToken, isCafeOwner, enforceTenantScope, deleteMenuItem);
router.patch('/:id/toggle', verifyToken, isCafeOwner, enforceTenantScope, toggleAvailability);

module.exports = router;
