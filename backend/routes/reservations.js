const express = require('express');
const router = express.Router();
const { verifyToken, isCafeOwner, enforceTenantScope } = require('../middleware/authMiddleware');
const {
  getReservations,
  createReservation,
  updateReservationStatus,
  seatReservation,
  deleteReservation
} = require('../controllers/reservationController');

router.use(verifyToken, isCafeOwner, enforceTenantScope);

router.get('/', getReservations);
router.post('/', createReservation);
router.patch('/:id/status', updateReservationStatus);
router.post('/:id/seat', seatReservation);
router.delete('/:id', deleteReservation);

module.exports = router;
