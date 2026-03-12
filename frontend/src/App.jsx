import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import LoadingSpinner from './components/LoadingSpinner';
import CookieConsent from './components/CookieConsent';
import BottomNav from './components/BottomNav';
import ErrorBoundary from './components/ErrorBoundary';

// Keep Welcome static for instant landing page load
import Welcome from './pages/Welcome';

// Retry wrapper for lazy imports — handles stale chunk failures after deploy
function lazyRetry(importFn) {
  return lazy(() =>
    importFn().catch(() => {
      // If chunk load fails (stale hash after deploy), reload once
      const hasReloaded = sessionStorage.getItem('chunk_reload');
      if (!hasReloaded) {
        sessionStorage.setItem('chunk_reload', '1');
        window.location.reload();
        return new Promise(() => {}); // never resolves — page is reloading
      }
      sessionStorage.removeItem('chunk_reload');
      // If reload didn't fix it, re-throw to show error boundary
      return importFn();
    })
  );
}

// Lazy load all other pages for code splitting (with retry on chunk failure)
const Home = lazyRetry(() => import('./pages/Home'));
const Cart = lazyRetry(() => import('./pages/Cart'));
const Payment = lazyRetry(() => import('./pages/Payment'));
const OrderSuccess = lazyRetry(() => import('./pages/OrderSuccess'));
const AdminLogin = lazyRetry(() => import('./pages/AdminLogin'));
const AdminDashboard = lazyRetry(() => import('./pages/AdminDashboard'));
const UserDashboard = lazyRetry(() => import('./pages/UserDashboard'));
const Login = lazyRetry(() => import('./pages/Login'));
const TermsConditions = lazyRetry(() => import('./pages/TermsConditions'));
const PrivacyPolicy = lazyRetry(() => import('./pages/PrivacyPolicy'));
const RefundPolicy = lazyRetry(() => import('./pages/RefundPolicy'));
const ShippingPolicy = lazyRetry(() => import('./pages/ShippingPolicy'));
const ContactUs = lazyRetry(() => import('./pages/ContactUs'));
const CategoryPage = lazyRetry(() => import('./pages/CategoryPage'));
const Categories = lazyRetry(() => import('./pages/Categories'));
const ProductDetail = lazyRetry(() => import('./pages/ProductDetail'));

// Protected Route for Admin
const AdminRoute = ({ children }) => {
    const { isAdmin, loading } = useAuth();
    if (loading) return <LoadingSpinner />;
    return isAdmin ? children : <Navigate to="/admin/login" />;
};

const App = () => {
    return (
        <ErrorBoundary>
            <AuthProvider>
                <CartProvider>
                    <Router>
                    <Suspense fallback={<LoadingSpinner />}>
                        <div className="pb-20 md:pb-0 min-h-screen">
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/" element={<Welcome />} />
                                <Route path="/menu" element={<Home />} />
                                <Route path="/cart" element={<Cart />} />
                                <Route path="/payment" element={<Payment />} />
                                <Route path="/order-success" element={<OrderSuccess />} />
                                <Route path="/dashboard" element={<UserDashboard />} />
                                <Route path="/categories" element={<Categories />} />
                                <Route path="/category/:categoryId" element={<CategoryPage />} />
                                <Route path="/product/:slug" element={<ProductDetail />} />
                                <Route path="/login" element={<Login />} />

                                {/* Static Pages */}
                                <Route path="/terms" element={<TermsConditions />} />
                                <Route path="/privacy" element={<PrivacyPolicy />} />
                                <Route path="/refund" element={<RefundPolicy />} />
                                <Route path="/shipping" element={<ShippingPolicy />} />
                                <Route path="/contact" element={<ContactUs />} />

                                {/* Admin Routes - Protected */}
                                <Route path="/admin/login" element={<AdminLogin />} />
                                <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
                                <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />

                                {/* Fallback */}
                                <Route path="*" element={<Navigate to="/" />} />
                            </Routes>
                        </div>
                        <BottomNav />
                        <CookieConsent />
                    </Suspense>
                    </Router>
                </CartProvider>
            </AuthProvider>
        </ErrorBoundary>
    );
};

export default App;
