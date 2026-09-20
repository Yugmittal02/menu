const express = require('express');
const router = express.Router();
const { verifyToken, isCafeOwner, enforceTenantScope } = require('../middleware/authMiddleware');
const {
  getInventory,
  updateStock,
  toggle86,
  bulkRestock,
  addInventoryItem
} = require('../controllers/inventoryController');

router.use(verifyToken, isCafeOwner, enforceTenantScope);

router.get('/', getInventory);
router.post('/item', addInventoryItem);
router.patch('/:itemId', updateStock);
router.patch('/:itemId/toggle-86', toggle86);
router.post('/bulk-restock', bulkRestock);

module.exports = router;
