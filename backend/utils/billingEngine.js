/**
 * Authoritative Central Financial & Billing Engine for QR Menu & POS
 * Single Source of Truth for:
 * - Line item subtotals
 * - Tax and discount calculations
 * - Order financial breakdown
 * - Session total aggregation and recalculation
 */

/**
 * Calculate accurate financial breakdown for an individual order
 * @param {Object} params
 * @param {Array} params.items - Array of { price, quantity }
 * @param {number} [params.discount=0] - Discount amount or coupon discount
 * @param {number} [params.taxPercent=0] - Cafe tax percentage (e.g. 5)
 * @returns {Object} { subtotal, discount, taxableAmount, taxAmount, grandTotal, totalAmount }
 */
function calculateOrderAmounts({ items = [], discount = 0, taxPercent = 0 }) {
  if (!Array.isArray(items)) {
    items = [];
  }

  const subtotal = Math.round(items.reduce((sum, it) => {
    const price = Number(it.price) || 0;
    const qty = Number(it.quantity) || 1;
    return sum + (price * qty);
  }, 0) * 100) / 100;

  const disc = Math.round(Math.min(subtotal, Math.max(0, parseFloat(discount) || 0)) * 100) / 100;
  const taxableAmount = Math.max(0, Math.round((subtotal - disc) * 100) / 100);
  const taxRate = Math.max(0, parseFloat(taxPercent) || 0);
  
  // Decimal-safe GST breakdown (50% CGST + 50% SGST)
  const cgstRate = Math.round((taxRate / 2) * 100) / 100;
  const sgstRate = Math.round((taxRate / 2) * 100) / 100;
  const cgstAmount = Math.round(((taxableAmount * cgstRate) / 100) * 100) / 100;
  const sgstAmount = Math.round(((taxableAmount * sgstRate) / 100) * 100) / 100;
  const taxAmount = Math.round((cgstAmount + sgstAmount) * 100) / 100;
  const rawGrandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;
  const roundOff = Math.round((Math.round(rawGrandTotal) - rawGrandTotal) * 100) / 100;
  const grandTotal = rawGrandTotal;

  return {
    subtotal,
    discount: disc,
    taxableAmount,
    taxRate,
    cgstRate,
    sgstRate,
    cgstAmount,
    sgstAmount,
    taxAmount,
    roundOff,
    grandTotal,
    totalAmount: grandTotal
  };
}

/**
 * Authoritatively recalculate running totals for a TableSession
 * Iterates through non-cancelled orders to prevent financial drift.
 * Works seamlessly with both Mongoose TableSession documents and offlineStore session objects.
 * 
 * @param {Object} session - TableSession document or offline store session
 * @param {Object|number} [cafeOrTaxPercent=0] - Cafe document/object or direct taxPercent number
 * @param {number|null} [customDiscount=null] - Optional override discount for billing
 * @returns {Object} calculated totals
 */
function recalculateSessionTotals(session, cafeOrTaxPercent = 0, customDiscount = null) {
  if (!session) return { subtotal: 0, discount: 0, taxableAmount: 0, taxAmount: 0, grandTotal: 0 };

  const taxPercent = (typeof cafeOrTaxPercent === 'object' && cafeOrTaxPercent !== null)
    ? (Number(cafeOrTaxPercent.taxPercent) || 0)
    : (Number(cafeOrTaxPercent) || 0);

  const rawOrders = session.orders || [];
  
  // Filter out cancelled orders (ignore non-object IDs if unpopulated)
  const validOrders = rawOrders.filter(o => {
    if (!o || typeof o !== 'object') return false;
    const status = (o.status || '').toLowerCase();
    return status !== 'cancelled';
  });

  let sessionSubtotal = 0;
  let orderDiscounts = 0;

  for (const o of validOrders) {
    let orderSub = 0;
    if (Array.isArray(o.items) && o.items.length > 0) {
      orderSub = o.items.reduce((sum, it) => {
        const p = Number(it.price) || 0;
        const q = Number(it.quantity) || 1;
        return sum + (p * q);
      }, 0);
    } else if (typeof o.subtotal === 'number' && !isNaN(o.subtotal)) {
      orderSub = o.subtotal;
    } else if (typeof o.itemTotal === 'number' && !isNaN(o.itemTotal)) {
      orderSub = o.itemTotal;
    } else if (typeof o.totalAmount === 'number' && !isNaN(o.totalAmount)) {
      orderSub = o.totalAmount;
    }

    sessionSubtotal += orderSub;

    const disc = Number(o.discount) || Number(o.discountAmount) || 0;
    orderDiscounts += disc;
  }

  sessionSubtotal = Math.round(sessionSubtotal * 100) / 100;

  let finalDiscount = 0;
  if (customDiscount !== null && customDiscount !== undefined && !isNaN(Number(customDiscount))) {
    finalDiscount = Math.min(sessionSubtotal, Math.max(0, Number(customDiscount)));
  } else {
    const existingSessionDiscount = Number(session.discount) || Number(session.discountAmount) || 0;
    finalDiscount = Math.min(sessionSubtotal, Math.max(orderDiscounts, existingSessionDiscount));
  }
  finalDiscount = Math.round(finalDiscount * 100) / 100;

  const taxableAmount = Math.max(0, Math.round((sessionSubtotal - finalDiscount) * 100) / 100);
  const taxRate = Math.max(0, parseFloat(taxPercent) || 0);
  const cgstRate = Math.round((taxRate / 2) * 100) / 100;
  const sgstRate = Math.round((taxRate / 2) * 100) / 100;
  const cgstAmount = Math.round(((taxableAmount * cgstRate) / 100) * 100) / 100;
  const sgstAmount = Math.round(((taxableAmount * sgstRate) / 100) * 100) / 100;
  const taxAmount = Math.round((cgstAmount + sgstAmount) * 100) / 100;
  const rawGrandTotal = Math.round((taxableAmount + taxAmount) * 100) / 100;
  const roundOff = Math.round((Math.round(rawGrandTotal) - rawGrandTotal) * 100) / 100;
  const grandTotal = rawGrandTotal;

  // Apply to session object (supports both schemas)
  session.subtotal = sessionSubtotal;
  session.discount = finalDiscount;
  session.discountAmount = finalDiscount; // offline store / legacy support
  session.taxAmount = taxAmount;
  session.grandTotal = grandTotal;
  session.totalAmount = grandTotal;

  return {
    subtotal: sessionSubtotal,
    discount: finalDiscount,
    taxableAmount,
    taxRate,
    cgstRate,
    sgstRate,
    cgstAmount,
    sgstAmount,
    taxAmount,
    roundOff,
    grandTotal,
    totalAmount: grandTotal
  };
}

module.exports = {
  calculateOrderAmounts,
  recalculateSessionTotals
};
