import React, { useState, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  FiDownload,
  FiPrinter,
  FiPlus,
  FiExternalLink,
  FiCheck,
  FiX
} from 'react-icons/fi';
import StatusBadge from '../ui/StatusBadge';

const QRTablesTab = ({
  cafe,
  orders = [],
  onUpdateTableCount
}) => {
  const [printingSheet, setPrintingSheet] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);

  const cafeId = cafe?.cafeId || 'CAFE';
  const cafeName = cafe?.name || 'Restaurant';
  const tableCount = Math.max(1, cafe?.tableCount || 10);

  const getBaseUrl = () => {
    return window.location.origin;
  };

  // Compute live occupancy for each table from current orders
  const tableOccupancy = useMemo(() => {
    const map = {};
    orders.forEach((o) => {
      const t = o.tableNumber;
      if (t) {
        if (o.status === 'pending') {
          map[t] = { status: 'occupied', label: 'Ordering', order: o };
        } else if (o.status === 'confirmed' || o.status === 'preparing' || o.status === 'ready') {
          map[t] = { status: 'occupied', label: 'Kitchen Active', order: o };
        } else if ((o.status === 'served' || o.status === 'completed') && o.paymentStatus !== 'paid') {
          map[t] = { status: 'payment-pending', label: 'Payment Pending', order: o };
        }
      }
    });
    return map;
  }, [orders]);

  // Single table QR download
  const downloadQR = (tableNo) => {
    const svg = document.getElementById(`qr-${tableNo}`);
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // White clean card background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 400, 480);

      // Header top banner
      ctx.fillStyle = '#7C3AED';
      ctx.fillRect(0, 0, 400, 12);

      // Draw QR image
      ctx.drawImage(img, 60, 35, 280, 280);

      // Cafe Name
      ctx.fillStyle = '#0F172A';
      ctx.font = 'bold 24px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(cafeName, 200, 360);

      // Table Number Badge
      ctx.fillStyle = '#7C3AED';
      ctx.font = 'bold 20px Inter, sans-serif';
      ctx.fillText(`TABLE ${tableNo}`, 200, 395);

      // Subtitle
      ctx.fillStyle = '#64748B';
      ctx.font = '13px Inter, sans-serif';
      ctx.fillText('Scan with phone camera to view menu & order', 200, 428);

      // Footer
      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText('Powered by Digital QR Menu', 200, 452);

      const link = document.createElement('a');
      link.download = `${cafeName.replace(/\s+/g, '_')}_Table_${tableNo}_QR.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };

    img.src =
      'data:image/svg+xml;base64,' +
      btoa(unescape(encodeURIComponent(svgData)));
  };

  // Download all QRs sequentially
  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    for (let i = 1; i <= tableCount; i++) {
      downloadQR(i);
      await new Promise((r) => setTimeout(r, 250));
    }
    setDownloadingAll(false);
  };

  // Add 1 more table
  const handleAddTable = async () => {
    if (onUpdateTableCount) {
      await onUpdateTableCount(tableCount + 1);
    }
  };

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Top Banner & Actions */}
      <div
        className="p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3.5"
        style={{
          backgroundColor: '#11111D',
          border: '1px solid rgba(255, 255, 255, 0.07)'
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-bold text-white">QR Codes & Tables</h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#A78BFA]">
              {tableCount} Tables Configured
            </span>
          </div>
          <p className="text-xs text-[#8E8EA8] mt-0.5">
            Customers scan these QR codes on tables to browse your live menu and place orders.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAddTable}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#A1A1B5] hover:text-white bg-[#151523] border border-white/[0.08] hover:bg-[#1A1A2A] transition-colors"
          >
            <FiPlus size={14} />
            <span>Add Table</span>
          </button>

          <button
            onClick={handleDownloadAll}
            disabled={downloadingAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#A1A1B5] hover:text-white bg-[#151523] border border-white/[0.08] hover:bg-[#1A1A2A] transition-colors disabled:opacity-50"
          >
            <FiDownload size={14} />
            <span>{downloadingAll ? 'Downloading...' : 'Download All PNGs'}</span>
          </button>

          <button
            onClick={() => setPrintingSheet(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-md active:scale-95"
            style={{
              background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
            }}
          >
            <FiPrinter size={14} />
            <span>Print QR Sheet</span>
          </button>
        </div>
      </div>

      {/* Table Cards Grid */}
      <div data-tour="qr-table-grid" className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {Array.from({ length: tableCount }, (_, i) => i + 1).map((tableNo) => {
          const occupancy = tableOccupancy[tableNo] || { status: 'available', label: 'Available' };
          const tableUrl = `${getBaseUrl()}/cafe/${cafeId}/table/${tableNo}`;

          return (
            <div
              key={tableNo}
              className="rounded-2xl p-4 flex flex-col justify-between items-center text-center transition-all duration-200 border hover:border-white/[0.15]"
              style={{
                backgroundColor: '#11111D',
                borderColor: 'rgba(255, 255, 255, 0.07)'
              }}
            >
              <div className="w-full">
                {/* Table Header: Badge + Live Status */}
                <div className="flex items-center justify-between mb-3 w-full">
                  <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-lg bg-[#7C3AED]/15 text-[#A78BFA] border border-[#7C3AED]/25">
                    🪑 Table {tableNo}
                  </span>
                  <StatusBadge status={occupancy.status} labelOverride={occupancy.label} />
                </div>

                {/* High Contrast Scannable QR Code Canvas */}
                <div className="bg-white p-3.5 rounded-2xl inline-block mb-3 shadow-lg shadow-black/40">
                  <QRCodeSVG
                    id={`qr-${tableNo}`}
                    value={tableUrl}
                    size={140}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                {/* URL preview */}
                <p className="text-[10px] text-[#707089] truncate max-w-full px-2 font-mono mb-3">
                  /cafe/{cafeId}/table/{tableNo}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full pt-3 border-t border-white/[0.05]">
                <button
                  onClick={() => downloadQR(tableNo)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold text-white bg-[#151523] hover:bg-[#1A1A2A] border border-white/[0.08] transition-colors"
                >
                  <FiDownload size={13} />
                  <span>Download</span>
                </button>

                <a
                  data-tour="qr-preview-card"
                  href={tableUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl text-[#707089] hover:text-white bg-[#151523] hover:bg-[#1A1A2A] border border-white/[0.08] transition-colors"
                  title="Test scan / open menu in new tab"
                >
                  <FiExternalLink size={14} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Print QR Sheet Modal */}
      {printingSheet && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div
            className="w-full max-w-4xl max-h-[90vh] rounded-2xl p-6 shadow-2xl overflow-y-auto"
            style={{ backgroundColor: '#151523', border: '1px solid rgba(255, 255, 255, 0.1)' }}
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/[0.08]">
              <div>
                <h3 className="text-base font-bold text-white">Printable QR Code Sheet</h3>
                <p className="text-xs text-[#8E8EA8]">
                  Print these QR cards on sticker sheets or cardstock to place on tables.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#7C3AED] hover:bg-[#6D28D9] transition-all"
                >
                  <FiPrinter size={14} />
                  <span>Print Sheet</span>
                </button>
                <button
                  onClick={() => setPrintingSheet(false)}
                  className="p-1.5 text-[#707089] hover:text-white rounded-lg"
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Printable Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4 bg-white rounded-xl">
              {Array.from({ length: tableCount }, (_, i) => i + 1).map((tableNo) => (
                <div
                  key={tableNo}
                  className="p-4 border-2 border-dashed border-gray-300 rounded-xl text-center flex flex-col items-center justify-center text-black"
                >
                  <p className="font-bold text-sm text-gray-900 mb-1">{cafeName}</p>
                  <div className="my-2">
                    <QRCodeSVG
                      value={`${getBaseUrl()}/cafe/${cafeId}/table/${tableNo}`}
                      size={110}
                      level="H"
                    />
                  </div>
                  <p className="font-bold text-sm text-purple-700">TABLE {tableNo}</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Scan to Order</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QRTablesTab;
