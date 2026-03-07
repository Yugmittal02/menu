import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Interceptor to add admin token to requests
API.interceptors.request.use((req) => {
  const adminToken = localStorage.getItem("adminToken");
  const customerToken = localStorage.getItem("customerToken");

  if (adminToken) {
    req.headers.Authorization = `Bearer ${adminToken}`;
  } else if (customerToken) {
    req.headers.Authorization = `Bearer ${customerToken}`;
  }
  return req;
});

// Auth
export const registerCustomer = (data) => API.post("/auth/customer", data);
export const adminLogin = (data) => API.post("/auth/admin/login", data);

// Products
export const fetchProducts = (category) =>
  API.get(`/products${category ? `?category=${category}` : ""}`);
export const fetchProductBySlug = (slug) =>
  API.get(`/products/slug/${slug}`);
export const createProduct = (data) => API.post("/products", data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const deleteProduct = (id) => API.delete(`/products/${id}`);
export const toggleProductAvailability = (id) =>
  API.patch(`/products/${id}/toggle-availability`);
export const deleteAllProducts = () => API.delete("/products/all");

// Orders
export const createOrder = (data) => API.post("/orders", data);
export const fetchOrderStatus = (id) => API.get(`/orders/track/${id}`);
export const fetchMyOrders = () => API.get("/orders/my-orders");
export const fetchAllOrders = () => API.get("/orders/all");
export const updateOrderStatus = (id, status) =>
  API.put(`/orders/${id}/status`, { status });
export const acceptOrder = (id) => API.put(`/orders/${id}/accept`);
export const cancelOrder = (id) => API.put(`/orders/${id}/cancel`);


// Ratings
export const submitRating = (data) => API.post("/ratings", data);
export const fetchProductRatings = (productId) =>
  API.get(`/ratings/product/${productId}`);
export const fetchAllRatings = () => API.get("/ratings/all");

// Upload
export const uploadImage = (formData) =>
  API.post("/upload/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

// Settings
export const getUPISettings = () => API.get("/settings/upi");
export const getUPISettingsAdmin = () => API.get("/settings/upi/admin");
export const updateUPISettings = (data) => API.put("/settings/upi", data);
export const getStoreSettings = () => API.get("/settings/store");
export const updateStoreSettings = (data) => API.put("/settings/store", data);
export const verifySettingsPassword = (password, type) =>
  API.post("/settings/verify-password", { password, type });
export const changeSettingsPassword = (data) =>
  API.put("/settings/change-password", data);

// Fee Settings
export const getFeeSettings = () => API.get("/settings/fees");
export const updateFeeSettings = (data) => API.put("/settings/fees", data);
export const calculateDeliveryFee = (customerLat, customerLng, orderTotal) =>
  API.post("/settings/calculate-delivery", { customerLat, customerLng, orderTotal });

// Homepage Badges
export const getHomepageBadges = () => API.get("/settings/homepage-badges");
export const updateHomepageBadges = (badges) => API.put("/settings/homepage-badges", { badges });

// Payments (Razorpay)
export const getRazorpayKey = () => API.get("/payments/key");
export const createPaymentOrder = (data) =>
  API.post("/payments/create-order", data);
export const verifyPayment = (data) => API.post("/payments/verify", data);
export const getPaymentStatus = (orderId) =>
  API.get(`/payments/status/${orderId}`);
export const manualVerifyPayment = (orderId, data) =>
  API.put(`/payments/manual-verify/${orderId}`, data);

// Payment Screenshot (for manual UPI verification)
export const uploadPaymentScreenshot = (orderId, screenshotUrl) =>
  API.put(`/orders/${orderId}/screenshot`, { screenshotUrl });
export const verifyPaymentScreenshotAdmin = (orderId, verified) =>
  API.put(`/orders/${orderId}/verify-payment`, { verified });

// Cart sync
export const syncCartToDB = (cart) => API.put("/auth/cart", { cart });
export const getCartFromDB = () => API.get("/auth/cart");

// Activity log
export const logUserActivity = (data) => API.post("/auth/activity", data);
export const getUserActivity = () => API.get("/auth/activity");

// Categories
export const fetchCategories = () => API.get("/categories");
export const fetchCategoryBySlug = (slug) => API.get(`/categories/${slug}`);
export const createCategory = (data) => API.post("/categories", data);
export const updateCategory = (id, data) => API.put(`/categories/${id}`, data);
export const deleteCategory = (id) => API.delete(`/categories/${id}`);

// Offers
export const fetchAllOffers = () => API.get("/offers");
export const fetchActiveOffers = () => API.get("/offers/active");
export const createOffer = (data) => API.post("/offers", data);
export const updateOffer = (id, data) => API.put(`/offers/${id}`, data);
export const toggleOffer = (id) => API.patch(`/offers/${id}/toggle`);
export const deleteOffer = (id) => API.delete(`/offers/${id}`);

export default API;


