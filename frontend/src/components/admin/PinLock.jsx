import React, { useState, useRef, useEffect } from 'react';
import { FaLock, FaTimes } from 'react-icons/fa';

const ADMIN_PIN_KEY = 'sewashubham_admin_pin';
const DEFAULT_PIN = '1234';

/**
 * 4-digit PIN Lock overlay.
 * Shows a PIN pad that the admin must enter to access protected tabs.
 * PIN is stored in localStorage. Default is 1234.
 */
const PinLock = ({ onUnlock, tabName = 'this section' }) => {
    const [pin, setPin] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);
    const inputRefs = [useRef(), useRef(), useRef(), useRef()];

    const savedPin = localStorage.getItem(ADMIN_PIN_KEY) || DEFAULT_PIN;

    useEffect(() => {
        // Focus first input on mount
        setTimeout(() => inputRefs[0].current?.focus(), 100);
    }, []);

    const handleChange = (index, value) => {
        if (!/^\d*$/.test(value)) return; // Only digits

        const newPin = [...pin];
        newPin[index] = value.slice(-1); // Only last digit
        setPin(newPin);
        setError('');

        if (value && index < 3) {
            inputRefs[index + 1].current?.focus();
        }

        // Auto-submit when all 4 digits entered
        if (index === 3 && value) {
            const fullPin = newPin.join('');
            if (fullPin.length === 4) {
                setTimeout(() => checkPin(fullPin), 150);
            }
        }
    };

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs[index - 1].current?.focus();
        }
    };

    const checkPin = (fullPin) => {
        if (fullPin === savedPin) {
            onUnlock();
        } else {
            setError('Wrong PIN');
            setShake(true);
            setPin(['', '', '', '']);
            setTimeout(() => {
                setShake(false);
                inputRefs[0].current?.focus();
            }, 500);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4 animate-fade-in">
            {/* Lock Icon */}
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6"
                style={{
                    background: 'linear-gradient(135deg, #C97B4B 0%, #E8956A 100%)',
                    boxShadow: '0 8px 32px rgba(201,123,75,0.3)'
                }}>
                <FaLock size={32} color="#FFFFFF" />
            </div>

            <h2 className="text-xl font-bold mb-2" style={{ color: '#1C1C1C' }}>
                Enter PIN to Access
            </h2>
            <p className="text-sm mb-8 text-center" style={{ color: '#7E7E7E' }}>
                Enter your 4-digit PIN to access {tabName}
            </p>

            {/* PIN Inputs */}
            <div className={`flex gap-3 mb-6 ${shake ? 'animate-shake' : ''}`}>
                {pin.map((digit, i) => (
                    <input
                        key={i}
                        ref={inputRefs[i]}
                        type="password"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleChange(i, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(i, e)}
                        className="w-14 h-16 text-center text-2xl font-bold rounded-2xl outline-none transition-all"
                        style={{
                            background: digit ? '#FEF3E2' : '#FFFFFF',
                            border: digit ? '2px solid #C97B4B' : '2px solid #E8E3DB',
                            color: '#1C1C1C',
                            boxShadow: digit ? '0 4px 12px rgba(201,123,75,0.15)' : 'none',
                        }}
                    />
                ))}
            </div>

            {/* Error */}
            {error && (
                <p className="text-sm font-bold mb-4 animate-fade-in" style={{ color: '#DC2626' }}>
                    ❌ {error}
                </p>
            )}

            {/* Hint */}
            <p className="text-xs" style={{ color: '#A0998F' }}>
                Default PIN: 1234
            </p>

            {/* Shake animation */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    20% { transform: translateX(-10px); }
                    40% { transform: translateX(10px); }
                    60% { transform: translateX(-6px); }
                    80% { transform: translateX(6px); }
                }
                .animate-shake { animation: shake 0.4s ease; }
            `}</style>
        </div>
    );
};

export default PinLock;
