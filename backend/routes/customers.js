const express = require('express');
const router = express.Router();
const { verifyToken, isCafeOwner, enforceTenantScope } = require('../middleware/authMiddleware');
const {
  getCustomers,
  getCustomerDetail,
  updateCustomer,
  deleteCustomer,
  syncCustomers
} = require('../controllers/customerController');

router.use(verifyToken, isCafeOwner, enforceTenantScope);

router.get('/', getCustomers);
router.post('/sync', syncCustomers);
router.get('/:id', getCustomerDetail);
router.patch('/:id', updateCustomer);
router.delete('/:id', deleteCustomer);

module.exports = router;
