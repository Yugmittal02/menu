const router = require('express').Router();
const { verifyToken, isAdmin } = require('../middleware/authMiddleware');
const {
    getAllOffers,
    getActiveOffers,
    createOffer,
    updateOffer,
    deleteOffer,
    toggleOffer
} = require('../controllers/offerController');

// Public
router.get('/active', getActiveOffers);

// Admin
router.get('/', verifyToken, isAdmin, getAllOffers);
router.post('/', verifyToken, isAdmin, createOffer);
router.put('/:id', verifyToken, isAdmin, updateOffer);
router.patch('/:id/toggle', verifyToken, isAdmin, toggleOffer);
router.delete('/:id', verifyToken, isAdmin, deleteOffer);

module.exports = router;
