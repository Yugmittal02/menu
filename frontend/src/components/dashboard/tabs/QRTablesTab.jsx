import React, { useState, useMemo, useCallback } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  FiDownload,
  FiPrinter,
  FiPlus,
  FiExternalLink,
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

  // Robust single table QR download using Blob URL instead of btoa
  const downloadQR = useCallback((tableNo) => {
    const svg = document.getElementById(`qr-${tableNo}`);
    if (!svg) return;

    const svgClone = svg.cloneNode(true);
    svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    const svgData = new XMLSerializer().serializeToString(svgClone);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    const canvas = document.createElement('canvas');
    const W = 480, H = 600;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const drawFrame = (image) => {
      // Background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);

      // Top gradient bar
      const topGrad = ctx.createLinearGradient(0, 0, W, 0);
      topGrad.addColorStop(0, '#7C3AED');
      topGrad.addColorStop(1, '#A78BFA');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, W, 14);

      // Decorative corner dots
      ctx.fillStyle = '#7C3AED';
      ctx.beginPath(); ctx.arc(30, 40, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(W - 30, 40, 6, 0, Math.PI * 2); ctx.fill();

      // Ornamental lines
      ctx.strokeStyle = '#E9E5F5';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(18, 22, W - 36, H - 44);

      // Inner decorative frame
      ctx.strokeStyle = '#DDD6FE';
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.strokeRect(28, 32, W - 56, H - 64);
      ctx.setLineDash([]);

      // Draw QR image centered
      const qrSize = 260;
      const qrX = (W - qrSize) / 2;
      ctx.drawImage(image, qrX, 70, qrSize, qrSize);

      // QR border
      ctx.strokeStyle = '#7C3AED';
      ctx.lineWidth = 3;
      ctx.strokeRect(qrX - 6, 64, qrSize + 12, qrSize + 12);

      // Cafe Name (auto branding)
      ctx.fillStyle = '#1E1B4B';
      ctx.font = 'bold 26px Inter, Arial, sans-serif';
      ctx.textAlign = 'center';
      const nameText = cafeName.length > 24 ? cafeName.substring(0, 22) + '...' : cafeName;
      ctx.fillText(nameText, W / 2, 380);

      // Decorative divider
      ctx.strokeStyle = '#C4B5FD';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 60, 395);
      ctx.lineTo(W / 2 + 60, 395);
      ctx.stroke();
      // Center diamond
      ctx.fillStyle = '#7C3AED';
      ctx.beginPath();
      ctx.moveTo(W / 2, 390);
      ctx.lineTo(W / 2 + 6, 395);
      ctx.lineTo(W / 2, 400);
      ctx.lineTo(W / 2 - 6, 395);
      ctx.closePath();
      ctx.fill();

      // Table Number Badge
      const badgeW = 160, badgeH = 38;
      const badgeX = (W - badgeW) / 2, badgeY = 412;
      const badgeGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeW, badgeY);
      badgeGrad.addColorStop(0, '#7C3AED');
      badgeGrad.addColorStop(1, '#6D28D9');
      ctx.fillStyle = badgeGrad;
      // Rounded rect badge
      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px Inter, Arial, sans-serif';
      ctx.fillText(`TABLE ${tableNo}`, W / 2, badgeY + 26);

      // Call-to-action
      ctx.fillStyle = '#64748B';
      ctx.font = '14px Inter, Arial, sans-serif';
      ctx.fillText('📱 Scan to View Menu & Order', W / 2, 485);

      // Footer
      ctx.fillStyle = '#94A3B8';
      ctx.font = '11px Inter, Arial, sans-serif';
      ctx.fillText('Powered by Digital QR Menu', W / 2, 520);

      // Bottom gradient bar
      const btmGrad = ctx.createLinearGradient(0, 0, W, 0);
      btmGrad.addColorStop(0, '#A78BFA');
      btmGrad.addColorStop(1, '#7C3AED');
      ctx.fillStyle = btmGrad;
      ctx.fillRect(0, H - 14, W, 14);

      // Bottom corner dots
      ctx.fillStyle = '#7C3AED';
      ctx.beginPath(); ctx.arc(30, H - 40, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(W - 30, H - 40, 6, 0, Math.PI * 2); ctx.fill();
    };

    img.onload = () => {
      drawFrame(img);
      const link = document.createElement('a');
      link.download = `${cafeName.replace(/\s+/g, '_')}_Table_${tableNo}_QR.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      try {
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          drawFrame(fallbackImg);
          const link = document.createElement('a');
          link.download = `${cafeName.replace(/\s+/g, '_')}_Table_${tableNo}_QR.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        };
        fallbackImg.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      } catch (e) {
        console.error('QR download failed:', e);
      }
    };

    img.src = url;
  }, [cafeName]);

  // Download all QRs sequentially
  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    for (let i = 1; i <= tableCount; i++) {
      downloadQR(i);
      await new Promise((r) => setTimeout(r, 350));
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
          backgroundColor: 'var(--dash-surface)',
          border: '1px solid var(--dash-border)'
        }}
      >
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-bold" style={{ color: 'var(--dash-text)' }}>QR Codes & Tables</h2>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-[#7C3AED]/20 text-[#A78BFA]">
              {tableCount} Tables Configured
            </span>
          </div>
          <p className="text-xs mt-0.5" style={{ color: 'var(--dash-text-muted2)' }}>
            Customers scan these QR codes on tables to browse your live menu and place orders.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAddTable}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors"
            style={{
              color: 'var(--dash-text-secondary)',
              backgroundColor: 'var(--dash-surface-secondary)',
              border: '1px solid var(--dash-border)'
            }}
          >
            <FiPlus size={14} />
            <span>Add Table</span>
          </button>

          <button
            onClick={handleDownloadAll}
            disabled={downloadingAll}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
            style={{
              color: 'var(--dash-text-secondary)',
              backgroundColor: 'var(--dash-surface-secondary)',
              border: '1px solid var(--dash-border)'
            }}
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
              className="rounded-2xl p-4 flex flex-col justify-between items-center text-center transition-all duration-200"
              style={{
                backgroundColor: 'var(--dash-surface)',
                border: '1px solid var(--dash-border)'
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
                <div className="bg-white p-3.5 rounded-2xl inline-block mb-3 shadow-lg shadow-black/20">
                  <QRCodeSVG
                    id={`qr-${tableNo}`}
                    value={tableUrl}
                    size={140}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                {/* URL preview */}
                <p className="text-[10px] truncate max-w-full px-2 font-mono mb-3" style={{ color: 'var(--dash-text-muted)' }}>
                  /cafe/{cafeId}/table/{tableNo}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 w-full pt-3" style={{ borderTop: '1px solid var(--dash-border)' }}>
                <button
                  onClick={() => downloadQR(tableNo)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-semibold transition-colors"
                  style={{
                    color: 'var(--dash-text)',
                    backgroundColor: 'var(--dash-surface-secondary)',
                    border: '1px solid var(--dash-border)'
                  }}
                >
                  <FiDownload size={13} />
                  <span>Download</span>
                </button>

                <a
                  data-tour="qr-preview-card"
                  href={tableUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-xl transition-colors"
                  style={{
                    color: 'var(--dash-text-muted)',
                    backgroundColor: 'var(--dash-surface-secondary)',
                    border: '1px solid var(--dash-border)'
                  }}
                  title="Test scan / open menu in new tab"
                >
                  <FiExternalLink size={14} />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      {/* Print QR Sheet Modal - with qr-printable-area class for @media print */}
      {printingSheet && (
        <div id="qr-print-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn print:p-0 print:bg-white print:static">
          <div
            className="w-full max-w-4xl max-h-[90vh] rounded-2xl p-6 shadow-2xl overflow-y-auto print:max-h-none print:overflow-visible print:border-none print:shadow-none print:p-0 print:bg-white"
            style={{ backgroundColor: 'var(--dash-surface-secondary)', border: '1px solid var(--dash-border-light)' }}
          >
            <div className="flex items-center justify-between pb-3 mb-4 print:hidden" style={{ borderBottom: '1px solid var(--dash-border)' }}>
              <div>
                <h3 className="text-base font-bold" style={{ color: 'var(--dash-text)' }}>Printable QR Code Sheet</h3>
                <p className="text-xs" style={{ color: 'var(--dash-text-muted2)' }}>
                  Print these premium QR frames on cardstock to paste on tables.
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
                  className="p-1.5 rounded-lg"
                  style={{ color: 'var(--dash-text-muted)' }}
                >
                  <FiX size={18} />
                </button>
              </div>
            </div>

            {/* Printable Cards Grid - THIS has the qr-printable-area class so @media print shows it */}
            <div className="qr-printable-area grid grid-cols-2 sm:grid-cols-3 gap-5 p-4 bg-white rounded-xl">
              {Array.from({ length: tableCount }, (_, i) => i + 1).map((tableNo) => (
                <div
                  key={tableNo}
                  className="qr-card-frame flex flex-col items-center justify-center text-center text-black relative overflow-hidden"
                  style={{
                    border: '3px solid #7C3AED',
                    borderRadius: '16px',
                    padding: '16px 12px 14px',
                    background: 'linear-gradient(180deg, #FAFAFE 0%, #FFFFFF 100%)',
                    boxShadow: '0 2px 12px rgba(124, 58, 237, 0.08)'
                  }}
                >
                  {/* Top accent bar */}
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: '6px',
                    background: 'linear-gradient(90deg, #7C3AED, #A78BFA, #7C3AED)',
                    borderRadius: '13px 13px 0 0'
                  }} />

                  {/* Decorative corner ornaments */}
                  <div style={{ position: 'absolute', top: '10px', left: '10px', width: '16px', height: '16px', borderTop: '2px solid #C4B5FD', borderLeft: '2px solid #C4B5FD', borderRadius: '4px 0 0 0' }} />
                  <div style={{ position: 'absolute', top: '10px', right: '10px', width: '16px', height: '16px', borderTop: '2px solid #C4B5FD', borderRight: '2px solid #C4B5FD', borderRadius: '0 4px 0 0' }} />
                  <div style={{ position: 'absolute', bottom: '10px', left: '10px', width: '16px', height: '16px', borderBottom: '2px solid #C4B5FD', borderLeft: '2px solid #C4B5FD', borderRadius: '0 0 0 4px' }} />
                  <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '16px', height: '16px', borderBottom: '2px solid #C4B5FD', borderRight: '2px solid #C4B5FD', borderRadius: '0 0 4px 0' }} />

                  {/* Cafe Name - Auto Branding */}
                  <p style={{
                    fontWeight: 800, fontSize: '13px', color: '#1E1B4B',
                    letterSpacing: '0.5px', marginBottom: '2px', marginTop: '4px',
                    maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                  }}>
                    {cafeName}
                  </p>

                  {/* Thin divider */}
                  <div style={{
                    width: '50px', height: '2px', margin: '4px auto 8px',
                    background: 'linear-gradient(90deg, transparent, #7C3AED, transparent)'
                  }} />

                  {/* QR Code with styled border */}
                  <div style={{
                    padding: '8px', border: '2px solid #E9E5F5', borderRadius: '12px',
                    background: '#FFFFFF', marginBottom: '8px',
                    boxShadow: '0 1px 6px rgba(124, 58, 237, 0.06)'
                  }}>
                    <QRCodeSVG
                      value={`${getBaseUrl()}/cafe/${cafeId}/table/${tableNo}`}
                      size={110}
                      level="H"
                    />
                  </div>

                  {/* Table Number Badge */}
                  <div style={{
                    background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                    color: '#FFFFFF', fontWeight: 800, fontSize: '13px',
                    padding: '5px 20px', borderRadius: '20px',
                    letterSpacing: '1.5px', marginBottom: '6px',
                    boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
                  }}>
                    TABLE {tableNo}
                  </div>

                  {/* CTA */}
                  <p style={{ fontSize: '10px', color: '#64748B', fontWeight: 500, marginBottom: '2px' }}>
                    📱 Scan to View Menu & Order
                  </p>

                  {/* Footer branding */}
                  <p style={{ fontSize: '8px', color: '#94A3B8', letterSpacing: '0.5px' }}>
                    Powered by Digital QR Menu
                  </p>

                  {/* Bottom accent bar */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: 0, right: 0, height: '4px',
                    background: 'linear-gradient(90deg, #A78BFA, #7C3AED, #A78BFA)',
                    borderRadius: '0 0 13px 13px'
                  }} />
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
