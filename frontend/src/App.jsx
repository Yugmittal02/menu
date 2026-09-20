import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

const Loading = () => (
  <div style={{display:'flex',justifyContent:'center',alignItems:'center',height:'100vh',background:'#0B0B14'}}>
    <div style={{width:40,height:40,border:'3px solid rgba(124,58,237,0.2)',borderTop:'3px solid #7C3AED',borderRadius:'50%',animation:'spin 0.8s linear infinite'}}/>
    <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
  </div>
);

const LandingPage = lazy(() => import('./pages/LandingPage'));
const SuperAdminLogin = lazy(() => import('./pages/SuperAdminLogin'));
const SuperAdminDashboard = lazy(() => import('./pages/SuperAdminDashboard'));
const CafeLogin = lazy(() => import('./pages/CafeLogin'));
const CafeDashboard = lazy(() => import('./pages/CafeDashboard'));
const CustomerMenu = lazy(() => import('./pages/CustomerMenu'));
const OrderTrack = lazy(() => import('./pages/OrderTrack'));

const AdminRoute = ({ children }) => {
  const { isSuperAdmin, loading } = useAuth();
  if (loading) return <Loading />;
  return isSuperAdmin ? children : <Navigate to="/admin/login" />;
};

const CafeRoute = ({ children }) => {
  const { isCafeOwner, loading } = useAuth();
  if (loading) return <Loading />;
  return isCafeOwner ? children : <Navigate to="/cafe/login" />;
};

const App = () => (
  <AuthProvider>
    <CartProvider>
      <Router>
        <Suspense fallback={<Loading />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/apply" element={<LandingPage />} />
            <Route path="/demo" element={<LandingPage />} />
            <Route path="/login" element={<Navigate to="/cafe/login" replace />} />
            <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
            <Route path="/admin/login" element={<SuperAdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminRoute><SuperAdminDashboard /></AdminRoute>} />
            <Route path="/admin/support" element={<AdminRoute><SuperAdminDashboard initialTab="support" /></AdminRoute>} />
            <Route path="/cafe/login" element={<CafeLogin />} />
            <Route path="/cafe/dashboard" element={<CafeRoute><CafeDashboard /></CafeRoute>} />
            <Route path="/c/:cafeSlug/t/:tableId" element={<CustomerMenu />} />
            <Route path="/c/:cafeSlug" element={<CustomerMenu />} />
            <Route path="/cafe/:cafeId/table/:tableNo" element={<CustomerMenu />} />
            <Route path="/order/track/:orderNumber" element={<OrderTrack />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </Router>
    </CartProvider>
  </AuthProvider>
);

export default App;
