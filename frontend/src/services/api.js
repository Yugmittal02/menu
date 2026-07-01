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
    (url.includes('/auth/superadmin') || url.includes('/cafes'));

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
      if (url.includes('/cafes') || url.includes('/auth/superadmin')) {
        localStorage.removeItem('superAdminToken');
        localStorage.removeItem('superAdmin');
        if (!window.location.pathname.includes('/admin/login')) {
          window.location.href = '/admin/login';
        }
      } else {
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
export const updateCoupon = (id, data) => API.put(`/coupons/${id}`, data);
export const deleteCoupon = (id) => API.delete(`/coupons/${id}`);
export const toggleCouponStatus = (id) => API.patch(`/coupons/${id}/toggle`);
export const validateCoupon = (data) => API.post("/coupons/validate", data);

export default API;
