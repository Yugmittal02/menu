import React, { useState } from "react";
import { LuX, LuLock, LuDelete, LuUserCheck, LuCircleAlert } from "react-icons/lu";

export default function StaffPinModal({ isOpen, onClose, onPinSubmit, activeStaff, onLogoutStaff }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleKeyPress = (num) => {
    if (pin.length < 4) {
      const next = pin + num;
      setPin(next);
      setError("");
      if (next.length === 4) {
        handleSubmitPin(next);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError("");
  };

  const handleClear = () => {
    setPin("");
    setError("");
  };

  const handleSubmitPin = async (fullPin) => {
    setLoading(true);
    setError("");
    try {
      await onPinSubmit(fullPin);
      setPin("");
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Invalid 4-digit PIN");
      setPin("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-[#12121e] border border-white/10 rounded-3xl shadow-2xl p-6 text-white animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-violet-600/20 text-violet-400 flex items-center justify-center">
              <LuLock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Staff PIN Access</h3>
              <p className="text-[11px] text-slate-400">Enter your 4-digit secret PIN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LuX className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Staff Badge */}
        {activeStaff && (
          <div className="mt-4 p-2.5 rounded-xl bg-violet-950/40 border border-violet-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LuUserCheck className="w-4 h-4 text-emerald-400" />
              <div className="text-xs">
                <span className="text-slate-300">Signed in as: </span>
                <strong className="text-white capitalize">{activeStaff.name}</strong>
                <span className="text-[10px] text-violet-300 ml-1.5 px-1.5 py-0.5 rounded bg-violet-500/20 uppercase font-mono">
                  {activeStaff.role}
                </span>
              </div>
            </div>
            {onLogoutStaff && (
              <button
                onClick={() => {
                  onLogoutStaff();
                  onClose();
                }}
                className="text-[11px] text-rose-400 hover:underline"
              >
                Sign Out
              </button>
            )}
          </div>
        )}

        {/* PIN Dots Display */}
        <div className="my-6 text-center">
          <div className="flex justify-center items-center gap-4 mb-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full transition-all duration-150 ${
                  pin.length > i
                    ? "bg-violet-500 scale-110 shadow-lg shadow-violet-500/50"
                    : "border-2 border-white/20 bg-transparent"
                }`}
              />
            ))}
          </div>
          {error ? (
            <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400 mt-2 font-medium">
              <LuCircleAlert className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          ) : (
            <p className="text-xs text-slate-400 mt-2">
              {loading ? "Verifying PIN..." : "Enter your PIN on the keypad"}
            </p>
          )}
        </div>

        {/* On-screen Keypad */}
        <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => handleKeyPress(num)}
              className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-violet-600/30 border border-white/5 text-xl font-bold text-white transition-all flex items-center justify-center cursor-pointer select-none"
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-white/20 border border-white/5 text-xs font-semibold text-slate-400 transition-all flex items-center justify-center cursor-pointer select-none"
          >
            Clear
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress(0)}
            className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-violet-600/30 border border-white/5 text-xl font-bold text-white transition-all flex items-center justify-center cursor-pointer select-none"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDelete}
            className="h-14 rounded-2xl bg-white/5 hover:bg-white/10 active:bg-rose-600/20 border border-white/5 text-slate-300 transition-all flex items-center justify-center cursor-pointer select-none"
          >
            <LuDelete className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
