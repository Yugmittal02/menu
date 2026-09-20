const mongoose = require('mongoose');
const Reservation = require('../models/Reservation');
const TableSession = require('../models/TableSession');
const Cafe = require('../models/Cafe');
const offlineStore = require('../utils/offlineStore');

// Helper: Generate session code
const generateSessionCode = (tableNum) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) rand += chars.charAt(Math.floor(Math.random() * chars.length));
  return `SES-T${tableNum}-${rand}`;
};

// 1. Get Reservations (Filter by date, status)
exports.getReservations = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { date, status } = req.query;

    if (mongoose.connection.readyState !== 1) {
      const list = offlineStore.getReservations ? offlineStore.getReservations(cafeId, { date, status }) : [];
      return res.json(list);
    }

    const filter = { cafe: cafeId };
    if (status && status !== 'all') {
      filter.status = status;
    }

    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        const startOfDay = new Date(d);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(d);
        endOfDay.setHours(23, 59, 59, 999);
        filter.reservationDate = { $gte: startOfDay, $lte: endOfDay };
      }
    }

    const reservations = await Reservation.find(filter)
      .sort({ reservationDate: 1, timeSlot: 1 })
      .populate('sessionId');

    res.json(reservations);
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2. Create Reservation
exports.createReservation = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const {
      customerName,
      customerPhone,
      customerEmail = '',
      pax = 2,
      reservationDate,
      timeSlot,
      tableNumber = null,
      specialRequests = ''
    } = req.body;

    if (!customerName || !customerPhone || !reservationDate || !timeSlot) {
      return res.status(400).json({ message: 'Name, phone, date, and time slot are required' });
    }

    if (mongoose.connection.readyState !== 1) {
      const reservation = offlineStore.createReservation
        ? offlineStore.createReservation({
          cafe: cafeId,
          customerName,
          customerPhone,
          customerEmail,
          pax: Number(pax) || 2,
          reservationDate,
          timeSlot,
          tableNumber: tableNumber ? Number(tableNumber) : null,
          specialRequests
        })
        : { _id: `res-${Date.now()}`, customerName, customerPhone, pax, reservationDate, timeSlot, status: 'confirmed' };

      return res.status(201).json({ message: 'Reservation created successfully', reservation });
    }

    const reservation = new Reservation({
      cafe: cafeId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim(),
      customerEmail: customerEmail.trim(),
      pax: Math.max(1, parseInt(pax) || 2),
      reservationDate: new Date(reservationDate),
      timeSlot: timeSlot.trim(),
      tableNumber: tableNumber ? parseInt(tableNumber) : null,
      specialRequests: specialRequests.trim(),
      status: 'confirmed'
    });

    await reservation.save();

    res.status(201).json({ message: 'Reservation created successfully', reservation });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3. Update Reservation Status / Table
exports.updateReservationStatus = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { id } = req.params;
    const { status, tableNumber, specialRequests } = req.body;

    if (mongoose.connection.readyState !== 1) {
      const updated = offlineStore.updateReservation ? offlineStore.updateReservation(id, { status, tableNumber, specialRequests }, cafeId) : null;
      if (!updated) return res.status(404).json({ message: 'Reservation not found' });
      return res.json({ message: 'Reservation updated', reservation: updated });
    }

    const reservation = await Reservation.findOne({ _id: id, cafe: cafeId });
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    if (status) {
      const validStatuses = ['pending', 'confirmed', 'seated', 'cancelled', 'no-show'];
      if (!validStatuses.includes(status.toLowerCase())) {
        return res.status(400).json({ message: 'Invalid reservation status. Allowed: pending, confirmed, seated, cancelled, no-show' });
      }
      reservation.status = status.toLowerCase();
    }
    if (tableNumber !== undefined) reservation.tableNumber = tableNumber ? parseInt(tableNumber) : null;
    if (specialRequests !== undefined) reservation.specialRequests = specialRequests;

    await reservation.save();
    res.json({ message: 'Reservation updated', reservation });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: error.message });
    }
    console.error('Update reservation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4. One-Click "Seat Guest" Action
exports.seatReservation = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { id } = req.params;
    const { tableNumber } = req.body;

    if (mongoose.connection.readyState !== 1) {
      if (offlineStore.seatReservation) {
        const result = offlineStore.seatReservation(id, tableNumber, cafeId);
        if (result && result.message === 'Reservation not found') {
          return res.status(404).json(result);
        }
        if (result && result.error) {
          return res.status(400).json(result);
        }
        return res.json(result);
      }
      return res.status(200).json({ message: 'Reservation seated' });
    }

    const reservation = await Reservation.findOne({ _id: id, cafe: cafeId });
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    const targetTable = tableNumber ? parseInt(tableNumber) : reservation.tableNumber;
    if (!targetTable || targetTable < 1) {
      return res.status(400).json({ message: 'A valid table number is required to seat this guest' });
    }

    // Check if table is occupied
    let session = await TableSession.findOne({
      cafe: cafeId,
      tableNumber: targetTable,
      status: { $in: ['active', 'billing'] }
    });

    if (!session) {
      // Create new session
      const sessionCode = generateSessionCode(targetTable);
      session = new TableSession({
        cafe: cafeId,
        tableNumber: targetTable,
        sessionCode,
        customerName: reservation.customerName,
        customerPhone: reservation.customerPhone,
        pax: reservation.pax,
        notes: `Reservation: ${reservation.timeSlot}${reservation.specialRequests ? ` (${reservation.specialRequests})` : ''}`,
        status: 'active',
        orders: []
      });
      await session.save();
    }

    reservation.status = 'seated';
    reservation.tableNumber = targetTable;
    reservation.sessionId = session._id;
    await reservation.save();

    res.json({
      message: `Guest seated at Table ${targetTable}`,
      reservation,
      session
    });
  } catch (error) {
    console.error('Seat reservation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5. Delete Reservation
exports.deleteReservation = async (req, res) => {
  try {
    const cafeId = req.user.cafeId;
    const { id } = req.params;

    if (mongoose.connection.readyState !== 1) {
      const deleted = offlineStore.deleteReservation ? offlineStore.deleteReservation(id, cafeId) : false;
      if (!deleted) return res.status(404).json({ message: 'Reservation not found' });
      return res.json({ message: 'Reservation deleted' });
    }

    const reservation = await Reservation.findOneAndDelete({ _id: id, cafe: cafeId });
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    res.json({ message: 'Reservation deleted' });
  } catch (error) {
    console.error('Delete reservation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
