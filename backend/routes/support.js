const router = require('express').Router();
const {
  verifyToken,
  isCafeOwner,
  isSuperAdmin,
  enforceTenantScope
} = require('../middleware/authMiddleware');

const {
  createTicket,
  getMyTickets,
  getTicketDetail,
  replyTicket,
  resolveTicket,
  reopenTicket,
  getSystemStatus,
  getAllTickets,
  getAdminTicketDetail,
  adminReplyTicket,
  updateTicketStatus,
  updateTicketPriority,
  assignTicket,
  getSupportStats
} = require('../controllers/supportController');

// System status (Public / safe)
router.get('/system-status', getSystemStatus);

// Cafe Owner Support Routes
router.post('/tickets', verifyToken, isCafeOwner, enforceTenantScope, createTicket);
router.get('/tickets', verifyToken, isCafeOwner, enforceTenantScope, getMyTickets);
router.get('/tickets/:id', verifyToken, isCafeOwner, enforceTenantScope, getTicketDetail);
router.post('/tickets/:id/reply', verifyToken, isCafeOwner, enforceTenantScope, replyTicket);
router.patch('/tickets/:id/resolve', verifyToken, isCafeOwner, enforceTenantScope, resolveTicket);
router.patch('/tickets/:id/reopen', verifyToken, isCafeOwner, enforceTenantScope, reopenTicket);

// SuperAdmin Support Center Routes
router.get('/admin/stats', verifyToken, isSuperAdmin, getSupportStats);
router.get('/admin/tickets', verifyToken, isSuperAdmin, getAllTickets);
router.get('/admin/tickets/:id', verifyToken, isSuperAdmin, getAdminTicketDetail);
router.post('/admin/tickets/:id/reply', verifyToken, isSuperAdmin, adminReplyTicket);
router.patch('/admin/tickets/:id/status', verifyToken, isSuperAdmin, updateTicketStatus);
router.patch('/admin/tickets/:id/priority', verifyToken, isSuperAdmin, updateTicketPriority);
router.patch('/admin/tickets/:id/assign', verifyToken, isSuperAdmin, assignTicket);

module.exports = router;
