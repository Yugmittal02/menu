import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { cafeOwnerLogin } from '../services/api';
import { FiCoffee, FiHash, FiLock, FiArrowLeft } from 'react-icons/fi';
import ProductSignature from '../components/brand/ProductSignature';
import PoweredByKrixov from '../components/brand/PoweredByKrixov';

const CafeLogin = () => {
  const [cafeId, setCafeId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { loginAsCafeOwner, isCafeOwner } = useAuth();

  useEffect(() => {
    if (isCafeOwner) {
      navigate('/cafe/dashboard');
    }
  }, [isCafeOwner, navigate]);

  if (isCafeOwner) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await cafeOwnerLogin({ cafeId });
      loginAsCafeOwner(data.user, data.token);
      navigate('/cafe/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{background:'linear-gradient(145deg,#0B0B14,#151525,#1A1A30)'}}>
      <div className="glass-card p-8 w-full max-w-md slide-up" style={{maxWidth:'420px'}}>
        <Link to="/" className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm mb-6 transition-colors">
          <FiArrowLeft /> Back
        </Link>

        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <ProductSignature align="center" />
          </div>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center" style={{background:'linear-gradient(135deg,#F43F5E,#E11D48)',boxShadow:'0 8px 25px rgba(244,63,94,0.3)'}}>
            <FiCoffee className="text-white text-2xl" />
          </div>
          <h1 className="text-xl font-bold text-white">Cafe Owner Login</h1>
          <p className="text-gray-400 text-xs mt-1">Sign in with your registered Cafe ID</p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl text-sm text-red-400" style={{background:'rgba(255,107,107,0.1)',border:'1px solid rgba(255,107,107,0.2)'}}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-gray-400 mb-1 block">Cafe ID</label>
            <div className="relative">
              <FiHash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              <input type="text" value={cafeId} onChange={e => setCafeId(e.target.value.toUpperCase())} placeholder="CAFE-XXXXXX" className="input-field pl-11 uppercase" required />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 pt-4 border-t border-white/5 flex justify-center text-slate-500">
          <PoweredByKrixov className="text-slate-400 hover:text-white" />
        </div>
      </div>
    </div>
  );
};

export default CafeLogin;
