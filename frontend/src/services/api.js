import axios from "axios";

const API = axios.create({ baseURL: import.meta.env.VITE_API_URL || "/api" });

// Token interceptor — cafe-owner /cafes/me routes must use cafeToken, not superAdminToken
API.interceptors.request.use((req) => {
  const cafeToken = localStorage.getItem("cafeToken");
  const adminToken = localStorage.getItem("superAdminToken");
  const url = req.url || '';
  const isCafeOwnerCafeRoute = url.includes('/cafes/me') || url.includes('/cafes/public');
  const useAdminToken =
    adminToken &&
    !isCafeOwnerCafeRoute &&
    (url.includes('/auth/superadmin') || url.includes('/cafes') || url.includes('/applications') || url.includes('/support/admin') || url.includes('/admin/payments'));

  if (useAdminToken) {
    req.headers.Authorization = `Bearer ${adminToken}`;
  } else if (cafeToken) {
    req.headers.Authorization = `Bearer ${cafeToken}`;
  }
  return req;
});

// Handle expired tokens — clear storage and redirect to login
API.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isPublicCustomerRoute =
        url.includes('/cafes/public') ||
        url.includes('/menu/cafe') ||
        url.includes('/coupons/public') ||
        url.includes('/coupons/validate') ||
        url.includes('/sessions/resolve') ||
        url.includes('/sessions/customer') ||
        (url.includes('/orders') && !url.includes('/orders/cafe'));

      if (isPublicCustomerRoute) {
        return Promise.reject(error);
      }

      if (url.includes('/auth/superadmin')) {
        localStorage.removeItem('superAdminToken');
        localStorage.removeItem('superAdmin');
        if (!window.location.pathname.includes('/admin/login')) {
          window.location.href = '/admin/login';
        }
      } else if (url.includes('/cafes/me') || url.includes('/menu/my') || url.includes('/orders/cafe') || url.includes('/sessions')) {
        localStorage.removeItem('cafeToken');
        localStorage.removeItem('cafeUser');
        if (!window.location.pathname.includes('/cafe/login')) {
          window.location.href = '/cafe/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

// ============ AUTH ============
export const superAdminLogin = (data) => API.post("/auth/superadmin/login", data);
export const cafeOwnerLogin = (data) => API.post("/auth/cafe/login", data);

// ============ CAFES (SuperAdmin) ============
export const createCafe = (data) => API.post("/cafes", data);
export const getAllCafes = () => API.get("/cafes");
export const updateCafe = (id, data) => API.put(`/cafes/${id}`, data);
export const toggleCafeStatus = (id) => API.patch(`/cafes/${id}/toggle`);
export const deleteCafe = (id) => API.delete(`/cafes/${id}`);

// ============ CAFE OWNER ============
export const getMyCafe = () => API.get("/cafes/me");
export const updateMyCafe = (data) => API.put("/cafes/me/update", data);
export const changeCafePassword = (data) => API.put("/cafes/me/password", data);
export const getMyOnboarding = () => API.get("/cafes/me/onboarding");
export const updateMyOnboarding = (data) => API.put("/cafes/me/onboarding", data);

// ============ CAFE PUBLIC ============
export const getPublicCafe = (cafeId) => API.get(`/cafes/public/${cafeId}`);

// ============ MENU ============
export const getPublicMenu = (cafeId) => API.get(`/menu/cafe/${cafeId}`);
export const getMenuCategories = (cafeId) => API.get(`/menu/cafe/${cafeId}/categories`);
export const getMyMenu = () => API.get("/menu/my");
export const addMenuItem = (data) => API.post("/menu", data);
export const updateMenuItem = (id, data) => API.put(`/menu/${id}`, data);
export const deleteMenuItem = (id) => API.delete(`/menu/${id}`);
export const toggleMenuItemAvailability = (id) => API.patch(`/menu/${id}/toggle`);

// ============ ORDERS ============
export const placeOrder = (data) => API.post("/orders", data);
export const trackOrder = (orderNumber) => API.get(`/orders/track/${orderNumber}`);
export const getCafeOrders = (params) => API.get("/orders/cafe", { params });
export const updateOrderStatus = (id, status) => API.put(`/orders/${id}/status`, { status });
export const getCafeStats = (params) => API.get("/orders/cafe/stats", { params });
export const markOrderPaid = (id, paymentMethod) => API.patch(`/orders/${id}/payment`, { paymentMethod });

// ============ UPLOAD ============
export const uploadImage = (formData) =>
  API.post("/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// ============ COUPONS ============
export const createCoupon = (data) => API.post("/coupons", data);
export const getMyCoupons = () => API.get("/coupons");
export const getPublicOffers = (cafeId) => API.get(`/coupons/public/${cafeId}`);
export const updateCoupon = (id, data) => API.put(`/coupons/${id}`, data);
export const deleteCoupon = (id) => API.delete(`/coupons/${id}`);
export const toggleCouponStatus = (id) => API.patch(`/coupons/${id}/toggle`);
export const validateCoupon = (data) => API.post("/coupons/validate", data);

// ============ APPLICATIONS / LEADS ============
export const submitApplication = (data) => API.post("/applications", data);
export const getAllApplications = (params) => API.get("/applications", { params });
export const updateApplicationStatus = (id, data) => API.patch(`/applications/${id}/status`, data);
export const convertApplicationToCafe = (id) => API.post(`/applications/${id}/convert`);
export const deleteApplication = (id) => API.delete(`/applications/${id}`);

// ============ TABLE SESSIONS ============
export const resolveQrSession = (data) => API.post("/sessions/resolve", data);
export const getCustomerSession = (sessionId) => API.get(`/sessions/customer/${sessionId}`);
export const requestTableBill = (sessionId) => API.patch(`/sessions/${sessionId}/request-bill`);
export const openSession = (data) => API.post("/sessions", data);
export const getActiveSessions = () => API.get("/sessions/active");
export const getSessionDetail = (id) => API.get(`/sessions/${id}`);
export const moveSessionToBilling = (id, data) => API.patch(`/sessions/${id}/billing`, data);
export const closeSession = (id, data) => API.patch(`/sessions/${id}/close`, data);
export const cancelSession = (id) => API.delete(`/sessions/${id}`);

// ============ POS & BILLING ============
export const placePosOrder = (data) => API.post("/pos/order", data);
export const quickTakeaway = (data) => API.post("/pos/takeaway", data);
export const getKotData = (orderId) => API.get(`/pos/kot/${orderId}`);
export const getInvoiceData = (sessionId, params) => API.get(`/pos/invoice/${sessionId}`, { params });
export const markInvoicePrinted = (sessionId) => API.post(`/pos/invoice/${sessionId}/print`);

// ============ RESERVATIONS (Phase 2) ============
export const getReservations = (params) => API.get("/reservations", { params });
export const createReservation = (data) => API.post("/reservations", data);
export const updateReservationStatus = (id, data) => API.patch(`/reservations/${id}/status`, data);
export const seatReservation = (id, data) => API.post(`/reservations/${id}/seat`, data);
export const deleteReservation = (id) => API.delete(`/reservations/${id}`);

// ============ STAFF & ROLES (Phase 2) ============
export const getStaff = () => API.get("/staff");
export const createStaff = (data) => API.post("/staff", data);
export const updateStaff = (id, data) => API.put(`/staff/${id}`, data);
export const resetStaffPin = (id, data) => API.patch(`/staff/${id}/pin`, data);
export const toggleStaffStatus = (id) => API.patch(`/staff/${id}/toggle`);
export const deleteStaff = (id) => API.delete(`/staff/${id}`);
export const staffPinLogin = (data) => API.post("/staff/pin-login", data);

// ============ CUSTOMER CRM (Phase 2) ============
export const getCustomers = (params) => API.get("/customers", { params });
export const getCustomerDetail = (id) => API.get(`/customers/${id}`);
export const updateCustomer = (id, data) => API.patch(`/customers/${id}`, data);
export const deleteCustomer = (id) => API.delete(`/customers/${id}`);
export const syncCustomers = () => API.post("/customers/sync");

// ============ INVENTORY & STOCK (Phase 2) ============
export const getInventory = (params) => API.get("/inventory", { params });
export const addInventoryItem = (data) => API.post("/inventory/item", data);
export const updateItemStock = (itemId, data) => API.patch(`/inventory/${itemId}`, data);
export const toggle86Item = (itemId) => API.patch(`/inventory/${itemId}/toggle-86`);
export const bulkRestockInventory = (data) => API.post("/inventory/bulk-restock", data);
// ============ HELP & SUPPORT WORKFLOW ============
export const createSupportTicket = (data) => API.post("/support/tickets", data);
export const getMySupportTickets = (params) => API.get("/support/tickets", { params });
export const getSupportTicketDetail = (id) => API.get(`/support/tickets/${id}`);
export const replySupportTicket = (id, data) => API.post(`/support/tickets/${id}/reply`, data);
export const resolveSupportTicket = (id) => API.patch(`/support/tickets/${id}/resolve`);
export const reopenSupportTicket = (id) => API.patch(`/support/tickets/${id}/reopen`);
export const getSystemStatus = () => API.get("/support/system-status");

// Super Admin Support
export const getAdminSupportStats = () => API.get("/support/admin/stats");
export const getAdminSupportTickets = (params) => API.get("/support/admin/tickets", { params });
export const getAdminTicketDetail = (id) => API.get(`/support/admin/tickets/${id}`);
export const adminReplySupportTicket = (id, data) => API.post(`/support/admin/tickets/${id}/reply`, data);
export const updateSupportTicketStatus = (id, data) => API.patch(`/support/admin/tickets/${id}/status`, data);
export const updateSupportTicketPriority = (id, data) => API.patch(`/support/admin/tickets/${id}/priority`, data);
export const assignSupportTicket = (id, data) => API.patch(`/support/admin/tickets/${id}/assign`, data);

// ============ PAYMENTS (Multi-Tenant Cashfree Easy Split) ============
export const getPaymentAccount = () => API.get("/payments/account");
export const connectPaymentAccount = (data) => API.post("/payments/connect", data);
export const disconnectPaymentAccount = (reason) => API.post("/payments/disconnect", { reason });
export const reconnectPaymentAccount = () => API.post("/payments/reconnect");
export const toggleOnlinePayments = (enabled) => API.post("/payments/toggle", { enabled });
export const getPaymentTransactions = (params) => API.get("/payments/transactions", { params });
export const getPaymentSettlements = () => API.get("/payments/settlements");
export const refundPayment = (paymentId, data) => API.post(`/payments/${paymentId}/refund`, data);

// Customer checkout
export const createPaymentSession = (data) => API.post("/payments/create-session", data);
export const verifyPaymentSession = (orderId) => API.get(`/payments/verify/${orderId}`);

// Super Admin Payments Center
export const getAdminPaymentOverview = () => API.get("/admin/payments/overview");
export const getAdminPaymentAccounts = () => API.get("/admin/payments/accounts");
export const getAdminPaymentTransactions = (params) => API.get("/admin/payments/transactions", { params });
export const getAdminPaymentWebhooks = (params) => API.get("/admin/payments/webhooks", { params });
export const getAdminPaymentReconciliation = () => API.get("/admin/payments/reconciliation");
export const adminSuspendPaymentAccount = (id, data) => API.post(`/admin/payments/accounts/${id}/suspend`, data);

export default API;


