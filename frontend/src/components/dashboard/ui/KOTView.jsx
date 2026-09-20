import React from "react";
import { LuPrinter, LuX, LuClock, LuUtensils, LuUser } from "react-icons/lu";

export default function KOTView({ kotData, onClose }) {
  if (!kotData) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = kotData.printedAt
    ? new Date(kotData.printedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const formattedDay = kotData.printedAt
    ? new Date(kotData.printedAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    : new Date().toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-white print:static print:inset-auto">
      <div className="relative w-full max-w-md bg-[#12121e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:max-w-none print:w-auto">
        {/* Top Modal Controls (Hidden in print) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#171727] print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm font-semibold text-white tracking-wide uppercase">
              Kitchen Order Ticket (KOT)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
            >
              <LuPrinter className="w-3.5 h-3.5" />
              Print KOT
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <LuX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div className="p-6 text-slate-200 print:text-black print:p-0 font-mono text-sm leading-relaxed kot-printable-area">
          <div className="border-2 border-dashed border-white/20 print:border-black rounded-xl p-5 bg-[#0b0b14] print:bg-white">
            {/* Header */}
            <div className="text-center pb-4 border-b-2 border-dashed border-white/20 print:border-black">
              <h2 className="text-xl font-black tracking-wider uppercase text-white print:text-black">
                {kotData.cafe?.name || "KITCHEN TICKET"}
              </h2>
              <div className="text-xs text-slate-400 print:text-black font-sans mt-0.5">
                *** KITCHEN COPY ***
              </div>
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-2 py-3 border-b-2 border-dashed border-white/20 print:border-black text-xs">
              <div>
                <span className="text-slate-400 print:text-black">KOT #: </span>
                <span className="font-bold text-emerald-400 print:text-black">{kotData.kotNumber || "KOT-001"}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 print:text-black">Order: </span>
                <span className="font-semibold text-white print:text-black">{kotData.orderNumber}</span>
              </div>
              <div className="flex items-center gap-1 text-slate-400 print:text-black">
                <LuClock className="w-3 h-3 print:hidden" />
                <span>{formattedDay} {formattedDate}</span>
              </div>
              <div className="text-right font-semibold text-amber-400 print:text-black uppercase">
                {kotData.orderType || "Dine-In"}
              </div>
            </div>

            {/* Table Number Highlight */}
            <div className="my-3 py-2 px-3 rounded-lg bg-violet-950/40 print:bg-transparent border border-violet-800/40 print:border-black text-center">
              <div className="text-xs uppercase tracking-widest text-violet-300 print:text-black font-sans">
                {kotData.tableNumber > 0 ? "Dining Table" : "Counter Service"}
              </div>
              <div className="text-2xl font-black text-white print:text-black tracking-tight">
                {kotData.tableNumber > 0 ? `TABLE #${kotData.tableNumber}` : "TAKEAWAY / COUNTER"}
              </div>
              {kotData.customerName && (
                <div className="text-xs text-slate-400 print:text-black mt-0.5 flex items-center justify-center gap-1">
                  <LuUser className="w-3 h-3 print:hidden" />
                  <span>Guest: {kotData.customerName}</span>
                </div>
              )}
            </div>

            {/* Items Table */}
            <div className="mt-3">
              <div className="flex justify-between text-xs font-bold text-slate-400 print:text-black pb-1.5 border-b border-white/10 print:border-black uppercase">
                <span>Item</span>
                <span>Qty</span>
              </div>
              <div className="divide-y divide-white/5 print:divide-black">
                {(kotData.items || []).map((item, idx) => (
                  <div key={idx} className="py-2 flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="font-bold text-white print:text-black text-sm">
                        {item.name}
                      </div>
                      {item.notes && (
                        <div className="text-xs text-amber-300 print:text-black italic pl-2 border-l-2 border-amber-500/50 mt-0.5">
                          Note: {item.notes}
                        </div>
                      )}
                    </div>
                    <div className="text-base font-black px-2 py-0.5 rounded bg-white/10 print:bg-transparent print:border print:border-black text-white print:text-black">
                      ×{item.quantity}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Special instructions */}
            {kotData.specialInstructions && (
              <div className="mt-4 pt-3 border-t-2 border-dashed border-white/20 print:border-black">
                <div className="text-xs font-bold text-amber-400 print:text-black uppercase">
                  Special Kitchen Note:
                </div>
                <div className="text-xs bg-amber-950/30 print:bg-transparent p-2 rounded text-amber-200 print:text-black mt-1 font-sans">
                  {kotData.specialInstructions}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="mt-4 pt-3 border-t-2 border-dashed border-white/20 print:border-black text-center text-xs text-slate-500 print:text-black">
              <div>Source: {kotData.orderSource?.toUpperCase() || "POS"} | Placed by: {kotData.placedBy || "Staff"}</div>
              <div className="text-[10px] mt-1 text-slate-600 print:text-black font-sans">
                --- End of KOT ---
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
