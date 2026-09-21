const router = require('express').Router();
const { verifyToken, isSuperAdmin } = require('../middleware/authMiddleware');
const { getModuleStatuses, updateModuleStatuses } = require('../controllers/systemController');

// Public / Cafe can read statuses
router.get('/modules', getModuleStatuses);

// SuperAdmin only can update statuses
router.put('/modules', verifyToken, isSuperAdmin, updateModuleStatuses);

module.exports = router;
