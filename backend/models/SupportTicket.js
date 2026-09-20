const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  fileUrl: { type: String, required: true },
  fileType: { type: String, default: '' },
  uploadedAt: { type: Date, default: Date.now }
}, { _id: false });

const conversationMessageSchema = new mongoose.Schema({
  sender: {
    id: { type: String, default: '' },
    name: { type: String, required: true },
    role: { type: String, enum: ['cafeowner', 'staff', 'superadmin', 'support_agent'], required: true }
  },
  message: { type: String, required: true },
  isInternalNote: { type: Boolean, default: false }, // Internal notes strictly visible to SuperAdmin only
  attachments: [attachmentSchema],
  timestamp: { type: Date, default: Date.now }
});

const auditLogSchema = new mongoose.Schema({
  action: { type: String, required: true },
  performedBy: {
    id: { type: String, default: '' },
    name: { type: String, default: 'System' },
    role: { type: String, default: 'system' }
  },
  details: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const supportTicketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  cafe: { type: mongoose.Schema.Types.ObjectId, ref: 'Cafe', required: true },
  restaurantName: { type: String, default: '' },
  createdBy: { type: String, default: '' },
  creatorName: { type: String, default: 'Staff' },
  creatorRole: { type: String, default: 'cafeowner' },

  subject: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: [
      'Login',
      'QR Menu',
      'Orders',
      'Tables',
      'Billing',
      'GST',
      'Payments',
      'Printer',
      'Inventory',
      'Reservations',
      'Menu',
      'Technical Issue',
      'Other'
    ],
    required: true
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  status: {
    type: String,
    enum: [
      'Open',
      'Acknowledged',
      'In Progress',
      'Waiting for Customer',
      'Resolved',
      'Closed',
      'Reopened'
    ],
    default: 'Open'
  },
  description: { type: String, required: true, trim: true },
  attachments: [attachmentSchema],

  // Safe client diagnostic context (NEVER contains passwords or secrets)
  context: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  conversation: [conversationMessageSchema],
  assignedTo: {
    id: { type: String, default: '' },
    name: { type: String, default: 'Unassigned' },
    email: { type: String, default: '' }
  },
  auditLog: [auditLogSchema],

  resolvedAt: { type: Date, default: null },
  closedAt: { type: Date, default: null }
}, {
  timestamps: true
});

supportTicketSchema.index({ cafe: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1 });
supportTicketSchema.index({ priority: 1 });
supportTicketSchema.index({ category: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
