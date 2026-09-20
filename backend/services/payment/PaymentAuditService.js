const AuditLog = require('../../models/AuditLog');

class PaymentAuditService {
  /**
   * Record a financial or operational audit event
   */
  static async log({
    actorType = 'SYSTEM',
    actorId = 'SYSTEM',
    actorEmail = '',
    restaurantId = null,
    action,
    entityType,
    entityId,
    oldState = null,
    newState = null,
    ipAddress = '',
    userAgent = '',
    metadata = {}
  }) {
    try {
      const entry = new AuditLog({
        actor_type: actorType,
        actor_id: String(actorId),
        actor_email: actorEmail,
        restaurant_id: restaurantId,
        action,
        entity_type: entityType,
        entity_id: String(entityId),
        old_state: oldState,
        new_state: newState,
        ip_address: ipAddress,
        user_agent: userAgent,
        metadata
      });
      return await entry.save();
    } catch (err) {
      console.error('[PaymentAuditService] Failed to write audit log:', err.message);
      // Non-blocking in production so audit failure doesn't halt payment execution
      return null;
    }
  }

  /**
   * Fetch recent audit logs for a restaurant
   */
  static async getRestaurantLogs(restaurantId, limit = 50) {
    return await AuditLog.find({ restaurant_id: restaurantId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }
}

module.exports = PaymentAuditService;
