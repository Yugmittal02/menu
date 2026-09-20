import React from "react";
import { LuPrinter, LuX, LuReceipt, LuCircleCheck, LuPhone, LuMapPin } from "react-icons/lu";

export default function InvoiceView({ invoiceData, onClose }) {
  if (!invoiceData) return null;

  const handlePrint = () => {
    window.print();
  };

  const invoiceDate = invoiceData.invoiceDate
    ? new Date(invoiceData.invoiceDate)
    : new Date();

  const formattedDate = invoiceDate.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const formattedTime = invoiceDate.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit'
  });

  const currency = invoiceData.cafe?.currency || "₹";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm print:p-0 print:bg-white print:static print:inset-auto">
      <div className="relative w-full max-w-md bg-[#12121e] border border-white/10 rounded-2xl shadow-2xl overflow-hidden print:border-none print:shadow-none print:bg-white print:max-w-none print:w-auto">
        {/* Top Modal Controls (Hidden during print) */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-[#171727] print:hidden">
          <div className="flex items-center gap-2">
            <LuReceipt className="w-4 h-4 text-violet-400" />
            <span className="text-sm font-semibold text-white tracking-wide">
              Tax Invoice & Receipt
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              <LuPrinter className="w-3.5 h-3.5" />
              Print Receipt (80mm)
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
        <div className="p-6 text-slate-200 print:text-black font-mono text-xs leading-relaxed max-h-[85vh] overflow-y-auto invoice-printable-area print:max-h-none print:overflow-visible">
          <div className="border-2 border-dashed border-white/20 print:border-black rounded-xl p-5 bg-[#0b0b14] print:bg-white text-slate-300 print:text-black">
            {/* Cafe Info Header */}
            <div className="text-center pb-4 border-b-2 border-dashed border-white/20 print:border-black">
              <h1 className="text-lg font-black tracking-wider uppercase text-white print:text-black">
                {invoiceData.cafe?.name || "RESTAURANT & CAFE"}
              </h1>
              {invoiceData.cafe?.address && (
                <div className="text-[11px] text-slate-400 print:text-black mt-1 font-sans flex items-center justify-center gap-1">
                  <LuMapPin className="w-3 h-3 print:hidden" />
                  <span>{invoiceData.cafe.address}{invoiceData.cafe?.city ? `, ${invoiceData.cafe.city}` : ""}</span>
                </div>
              )}
              {invoiceData.cafe?.phone && (
                <div className="text-[11px] text-slate-400 print:text-black font-sans flex items-center justify-center gap-1 mt-0.5">
                  <LuPhone className="w-3 h-3 print:hidden" />
                  <span>Ph: {invoiceData.cafe.phone}</span>
                </div>
              )}
              <div className="inline-block mt-2 px-2 py-0.5 rounded border border-white/20 print:border-black text-[10px] uppercase font-bold tracking-widest text-slate-300 print:text-black">
                Tax Invoice
              </div>
            </div>

            {/* Bill Meta Details */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-1 py-3 border-b-2 border-dashed border-white/20 print:border-black text-[11px]">
              <div>
                <span className="text-slate-400 print:text-black">Inv #: </span>
                <span className="font-bold text-white print:text-black">{invoiceData.invoiceNumber}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 print:text-black">Date: </span>
                <span className="text-white print:text-black">{formattedDate}</span>
              </div>
              <div>
                <span className="text-slate-400 print:text-black">Time: </span>
                <span className="text-white print:text-black">{formattedTime}</span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 print:text-black">Service: </span>
                <span className="font-semibold uppercase text-amber-400 print:text-black">
                  {invoiceData.tableNumber > 0 ? `Table ${invoiceData.tableNumber}` : "Takeaway"}
                </span>
              </div>
              {invoiceData.customerName && (
                <div className="col-span-2 text-slate-300 print:text-black">
                  <span className="text-slate-400 print:text-black">Customer: </span>
                  <span className="font-medium">{invoiceData.customerName}</span>
                  {invoiceData.customerPhone && <span> ({invoiceData.customerPhone})</span>}
                </div>
              )}
              {invoiceData.sessionCode && (
                <div className="col-span-2 text-[10px] text-slate-500 print:text-black">
                  Session: {invoiceData.sessionCode} {invoiceData.pax ? `| Guests: ${invoiceData.pax}` : ""}
                </div>
              )}
            </div>

            {/* Itemized Table */}
            <div className="mt-3">
              <div className="flex justify-between text-[11px] font-bold text-slate-400 print:text-black pb-1.5 border-b border-white/10 print:border-black uppercase">
                <span className="w-1/2">Item</span>
                <span className="w-1/6 text-right">Qty</span>
                <span className="w-1/6 text-right">Rate</span>
                <span className="w-1/6 text-right">Amt</span>
              </div>
              <div className="divide-y divide-white/5 print:divide-black">
                {(invoiceData.items || []).map((item, idx) => (
                  <div key={idx} className="py-1.5 flex items-center text-[11px]">
                    <span className="w-1/2 font-bold text-white print:text-black truncate pr-1">
                      {item.name}
                    </span>
                    <span className="w-1/6 text-right text-slate-300 print:text-black">
                      {item.quantity}
                    </span>
                    <span className="w-1/6 text-right text-slate-400 print:text-black">
                      {item.price}
                    </span>
                    <span className="w-1/6 text-right font-bold text-white print:text-black">
                      {item.total || (item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="mt-3 pt-2 border-t-2 border-dashed border-white/20 print:border-black space-y-1 text-[11px]">
              <div className="flex justify-between text-slate-300 print:text-black">
                <span>Subtotal:</span>
                <span>{currency}{invoiceData.subtotal}</span>
              </div>

              {invoiceData.discount > 0 && (
                <div className="flex justify-between text-emerald-400 print:text-black">
                  <span>Discount:</span>
                  <span>-{currency}{invoiceData.discount}</span>
                </div>
              )}

              {invoiceData.taxPercent > 0 && (
                <div className="flex justify-between text-slate-300 print:text-black">
                  <span>{invoiceData.taxLabel || "GST"} ({invoiceData.taxPercent}%):</span>
                  <span>{currency}{invoiceData.taxAmount}</span>
                </div>
              )}

              <div className="pt-2 mt-2 border-t border-white/20 print:border-black flex justify-between items-baseline text-sm font-black text-white print:text-black">
                <span className="tracking-wider uppercase">GRAND TOTAL:</span>
                <span className="text-base text-emerald-400 print:text-black">{currency}{invoiceData.grandTotal}</span>
              </div>
            </div>

            {/* Payment status badge */}
            <div className="mt-3 pt-3 border-t-2 border-dashed border-white/20 print:border-black">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400 print:text-black">Payment Status:</span>
                <span className="font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950/60 print:bg-transparent text-emerald-400 print:text-black border border-emerald-800/40 print:border-black">
                  {invoiceData.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs mt-1">
                <span className="text-slate-400 print:text-black">Payment Method:</span>
                <span className="font-semibold uppercase text-white print:text-black">
                  {invoiceData.paymentMethod || "CASH"}
                </span>
              </div>
            </div>

            {/* Footer Message */}
            <div className="mt-4 pt-3 border-t-2 border-dashed border-white/20 print:border-black text-center font-sans">
              <div className="text-[11px] font-medium text-slate-300 print:text-black">
                {invoiceData.cafe?.footerText || "Thank you for dining with us! Please visit again."}
              </div>
              <div className="text-[9px] text-slate-500 print:text-black mt-1">
                Powered by QR Menu POS
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
