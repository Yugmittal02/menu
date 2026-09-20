const PaymentAccount = require('../models/PaymentAccount');
const Payment = require('../models/Payment');
const PaymentSplit = require('../models/PaymentSplit');
const WebhookEvent = require('../models/WebhookEvent');
const Cafe = require('../models/Cafe');
const ReconciliationService = require('../services/payment/ReconciliationService');
const PaymentAuditService = require('../services/payment/PaymentAuditService');

const reconciliationService = new ReconciliationService();

/**
 * Super Admin: Payments overview metrics
 */
exports.getOverview = async (req, res) => {
  try {
    const [
      totalAccounts,
      activeAccounts,
      totalPayments,
      successPayments,
      totalRevenuePaise,
      quarantinedWebhooks
    ] = await Promise.all([
      PaymentAccount.countDocuments(),
      PaymentAccount.countDocuments({ connection_status: 'CONNECTED', online_payment_enabled: true }),
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'SUCCESS' }),
      Payment.aggregate([
        { $match: { status: 'SUCCESS' } },
        { $group: { _id: null, total: { $sum: '$amount_minor' } } }
      ]),
      WebhookEvent.countDocuments({ processing_status: 'QUARANTINED' })
    ]);

    const grossRevenuePaise = totalRevenuePaise[0]?.total || 0;

    res.json({
      success: true,
      data: {
        totalAccounts,
        activeAccounts,
        totalPayments,
        successPayments,
        grossRevenueRupees: grossRevenuePaise / 100,
        quarantinedWebhooks
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Super Admin: List all restaurant payment accounts
 */
exports.listAccounts = async (req, res) => {
  try {
    const accounts = await PaymentAccount.find()
      .populate('restaurant_id', 'name cafeId city email phone')
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      success: true,
      data: accounts
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Super Admin: List all transactions across platform
 */
exports.listTransactions = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
    const payments = await Payment.find()
      .populate('restaurant_id', 'name cafeId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: payments
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Super Admin: List webhook events
 */
exports.listWebhooks = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '100', 10), 500);
    const filter = {};
    if (req.query.status) {
      filter.processing_status = req.query.status;
    }

    const events = await WebhookEvent.find(filter)
      .populate('restaurant_id', 'name cafeId')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: events
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Super Admin: Run reconciliation scan
 */
exports.getReconciliation = async (req, res) => {
  try {
    const report = await reconciliationService.runReconciliation();
    res.json({
      success: true,
      data: report
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Super Admin: Suspend or resume a restaurant payment account
 */
exports.suspendAccount = async (req, res) => {
  try {
    const { id } = req.params;
    const { suspend, reason } = req.body;

    const account = await PaymentAccount.findById(id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Payment account not found' });
    }

    const oldState = account.toObject();

    if (suspend) {
      account.connection_status = 'SUSPENDED';
      account.online_payment_enabled = false;
      account.suspension_reason = reason || 'Suspended by Super Admin';
    } else {
      account.connection_status = 'CONNECTED';
      account.online_payment_enabled = true;
      account.suspension_reason = '';
    }

    await account.save();

    // Sync cafe model
    await Cafe.findByIdAndUpdate(account.restaurant_id, {
      $set: { 'orderingConfig.allowOnlinePayment': !suspend }
    });

    await PaymentAuditService.log({
      actorType: 'SUPER_ADMIN',
      actorId: req.user.id || req.user._id,
      actorEmail: req.user.email,
      restaurantId: account.restaurant_id,
      action: suspend ? 'ACCOUNT_SUSPENDED' : 'ACCOUNT_RESUMED',
      entityType: 'PaymentAccount',
      entityId: account._id,
      oldState,
      newState: account.toObject(),
      metadata: { reason }
    });

    res.json({
      success: true,
      message: `Payment account ${suspend ? 'suspended' : 'resumed'} successfully`,
      data: account.toSafeJSON()
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
