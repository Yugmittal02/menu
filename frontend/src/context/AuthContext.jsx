import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';

const AuthContext = createContext();

// Helper to check if cookies are accepted
const isCookieConsentAccepted = () => {
    return localStorage.getItem('cookieConsent') === 'accepted';
};

// Helper to get the appropriate storage based on consent
const getCustomerStorage = () => {
    return isCookieConsentAccepted() ? localStorage : sessionStorage;
};

export const AuthProvider = ({ children }) => {
    const [customer, setCustomer] = useState(null);
    const [admin, setAdmin] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for customer in both localStorage and sessionStorage
        // localStorage takes priority if cookies are accepted
        let storedCustomer = null;
        let customerToken = null;

        if (isCookieConsentAccepted()) {
            // Check localStorage first when cookies accepted
            storedCustomer = localStorage.getItem('customer');
            customerToken = localStorage.getItem('customerToken');
            
            // Migrate from sessionStorage to localStorage if needed
            if (!storedCustomer && sessionStorage.getItem('customer')) {
                storedCustomer = sessionStorage.getItem('customer');
                localStorage.setItem('customer', storedCustomer);
            }
            if (!customerToken && sessionStorage.getItem('customerToken')) {
                customerToken = sessionStorage.getItem('customerToken');
                localStorage.setItem('customerToken', customerToken);
            }
        } else {
            // Use sessionStorage when cookies not accepted
            storedCustomer = sessionStorage.getItem('customer');
            customerToken = sessionStorage.getItem('customerToken') || localStorage.getItem('customerToken');
        }
        
        if (storedCustomer && customerToken) {
            setCustomer(JSON.parse(storedCustomer));
        } else {
            // Invalid state: Clear potential leftovers
            sessionStorage.removeItem('customer');
            localStorage.removeItem('customer');
            localStorage.removeItem('customerToken');
        }

        // Check for admin in localStorage (admin always uses localStorage)
        const storedAdmin = localStorage.getItem('admin');
        const token = localStorage.getItem('adminToken');
        if (storedAdmin && token) {
            setAdmin(JSON.parse(storedAdmin));
        }
        
        setLoading(false);
    }, []);

    // Customer entry (API-based with token)
    const enterAsCustomer = async (name, phone) => {
        try {
            const { data } = await API.post('/auth/customer', { name, phone });
            
            const storage = getCustomerStorage();
            
            // Store token in localStorage always for API auth
            localStorage.setItem('customerToken', data.token);
            // Store customer data based on consent
            storage.setItem('customer', JSON.stringify(data.user));
            
            // If cookies accepted, ensure data is in localStorage
            if (isCookieConsentAccepted()) {
                localStorage.setItem('customer', JSON.stringify(data.user));
            }
            
// DO NOT clear Admin session here so developers can test customer & admin simultaneously across tabs.
// localStorage.removeItem('adminToken');
// localStorage.removeItem('admin');
// setAdmin(null);

            setCustomer(data.user);
            return { success: true };
        } catch (error) {
            console.error('Customer login failed:', error);
            const errData = error.response?.data;
            const message = errData?.errors?.length
                ? errData.errors.join(', ')
                : errData?.message || 'Login failed';
            return { success: false, message };
        }
    };

    // Admin login (JWT-based)
    const adminLogin = async (email, password) => {
        try {
            const { data } = await API.post('/auth/admin/login', { email, password });
            localStorage.setItem('adminToken', data.token);
            localStorage.setItem('admin', JSON.stringify(data.user));
            setAdmin(data.user);
            return { success: true };
        } catch (error) {
            return { success: false, message: error.response?.data?.message || 'Login failed' };
        }
    };

    const logout = () => {
        // Clear customer session
        sessionStorage.removeItem('customer');
        localStorage.removeItem('customer');
        localStorage.removeItem('customerToken');
        setCustomer(null);
        
        // Clear admin session
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        setAdmin(null);
    };

    const logoutCustomer = () => {
        sessionStorage.removeItem('customer');
        localStorage.removeItem('customer');
        localStorage.removeItem('customerToken');
        setCustomer(null);
    };

    const logoutAdmin = () => {
        localStorage.removeItem('adminToken');
        localStorage.removeItem('admin');
        setAdmin(null);
    };

    return (
        <AuthContext.Provider value={{ 
            customer, 
            admin, 
            loading, 
            enterAsCustomer, 
            adminLogin, 
            logout,
            logoutCustomer,
            logoutAdmin,
            isCustomer: !!customer,
            isAdmin: !!admin
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
