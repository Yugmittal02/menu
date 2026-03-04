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

// Lazy load all other pages for code splitting
const Home = lazy(() => import('./pages/Home'));
const Cart = lazy(() => import('./pages/Cart'));
const Payment = lazy(() => import('./pages/Payment'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const UserDashboard = lazy(() => import('./pages/UserDashboard'));
const Login = lazy(() => import('./pages/Login'));
const TermsConditions = lazy(() => import('./pages/TermsConditions'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const RefundPolicy = lazy(() => import('./pages/RefundPolicy'));
const ShippingPolicy = lazy(() => import('./pages/ShippingPolicy'));
const ContactUs = lazy(() => import('./pages/ContactUs'));
const CategoryPage = lazy(() => import('./pages/CategoryPage'));
const Categories = lazy(() => import('./pages/Categories'));

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
