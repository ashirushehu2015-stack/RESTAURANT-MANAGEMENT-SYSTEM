import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import type { RestaurantTable } from '../types';
import { 
  QrCode, 
  Printer, 
  ExternalLink, 
  Copy, 
  Check, 
  X, 
  UtensilsCrossed, 
  Wifi, 
  Sparkles, 
  Share2,
  Table as TableIcon
} from 'lucide-react';

interface TableQRCodeModalProps {
  tables: RestaurantTable[];
  selectedTable?: RestaurantTable | null;
  onClose: () => void;
  onOpenCustomerView?: (tableNumber: string) => void;
}

export const TableQRCodeModal: React.FC<TableQRCodeModalProps> = ({
  tables = [],
  selectedTable: initialTable,
  onClose,
  onOpenCustomerView
}) => {
  const [activeTable, setActiveTable] = useState<RestaurantTable>(() => {
    return initialTable || tables[0] || {
      id: 'table-08',
      tableNumber: 'Table 08 (Garden)',
      floor: 'Ground Floor',
      seats: 4,
      shape: 'round',
      status: 'Available'
    };
  });

  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedToast, setCopiedToast] = useState(false);

  // Computed URL for QR code
  const tableUrl = `${window.location.origin}${window.location.pathname}?table=${encodeURIComponent(activeTable.tableNumber)}`;

  // Generate QR Code on table change
  useEffect(() => {
    QRCode.toDataURL(tableUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0b1221',
        light: '#ffffff'
      }
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Failed to generate QR Code:', err));
  }, [tableUrl, activeTable]);

  // Copy Link
  const handleCopyLink = () => {
    navigator.clipboard.writeText(tableUrl);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  // Print Acrylic Stand / Tent Card (A5 format)
  const handlePrintTentCard = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print table tent card.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Table QR Stand - ${activeTable.tableNumber}</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A5 portrait; margin: 12mm; }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #0b1221;
              margin: 0;
              padding: 10px;
              text-align: center;
              background: #fff;
            }
            .stand-border {
              border: 3px solid #0b1221;
              border-radius: 12px;
              padding: 24px 20px;
              max-width: 480px;
              margin: 0 auto;
            }
            .brand-sub {
              font-size: 11px;
              font-weight: 800;
              color: #b45309;
              text-transform: uppercase;
              letter-spacing: 1.5px;
            }
            .brand-name {
              font-size: 20px;
              font-weight: 900;
              font-style: italic;
              text-transform: uppercase;
              margin: 4px 0 16px 0;
            }
            .table-badge {
              display: inline-block;
              background: #0b1221;
              color: #fff;
              font-size: 18px;
              font-weight: 900;
              padding: 8px 24px;
              border-radius: 30px;
              letter-spacing: 0.5px;
              margin-bottom: 20px;
            }
            .qr-image {
              width: 220px;
              height: 220px;
              margin: 0 auto 16px auto;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 6px;
            }
            .scan-callout {
              font-size: 14px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              color: #024628;
              margin-bottom: 6px;
            }
            .instructions {
              font-size: 11px;
              color: #475569;
              line-height: 1.4;
              margin-bottom: 16px;
            }
            .wifi-box {
              background: #f8fafc;
              border: 1px dashed #cbd5e1;
              border-radius: 8px;
              padding: 8px 12px;
              font-size: 10px;
              display: flex;
              justify-content: space-around;
            }
          </style>
        </head>
        <body>
          <div class="stand-border">
            <div class="brand-sub">Standalone Dining & Lounge Experience</div>
            <div class="brand-name">RESTAURANT MANAGEMENT SYSTEM</div>

            <div class="table-badge">${activeTable.tableNumber.toUpperCase()}</div>

            <div>
              <img src="${qrDataUrl}" class="qr-image" alt="Table QR Code" />
            </div>

            <div class="scan-callout">📱 Scan with Phone Camera to Order & Pay</div>
            <div class="instructions">
              1. Point your phone camera at this QR code • 2. Browse full menu with photos<br />
              3. Customize your order • 4. Pay online or bill directly to this table
            </div>

            <div class="wifi-box">
              <div>📶 Wi-Fi: <strong>RestaurantGuest</strong></div>
              <div>🔑 Password: <strong>DineVIPGuest2026</strong></div>
            </div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E5E2DA] p-6 space-y-5">
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-[#E5E2DA] pb-3">
          <div>
            <div className="flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#b45309]" />
              <h3 className="text-lg font-bold text-[#1A1A1A]">
                Table QR Codes & Contactless Ordering
              </h3>
            </div>
            <p className="text-xs text-[#73706B] mt-0.5">
              Print acrylic tent cards for physical tables or preview guest self-ordering flow.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Table Selector */}
        <div>
          <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1.5">
            Select Dining Table / Station
          </label>
          <select
            value={activeTable.id}
            onChange={(e) => {
              const found = tables.find(t => t.id === e.target.value);
              if (found) setActiveTable(found);
            }}
            className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282] font-semibold"
          >
            {tables.map(t => (
              <option key={t.id} value={t.id}>
                {t.tableNumber} — ({t.floor}, {t.seats} Seats, Status: {t.status})
              </option>
            ))}
          </select>
        </div>

        {/* QR Code Card Display */}
        <div className="bg-[#FDFCF9] p-5 rounded-xl border border-[#E5E2DA] flex flex-col items-center text-center">
          <span className="text-[10px] font-black uppercase text-[#b45309] tracking-widest px-2.5 py-0.5 bg-[#fef3c7] rounded-full mb-3">
            {activeTable.tableNumber} QR BADGE
          </span>

          {/* QR Image */}
          <div className="bg-white p-3 rounded-xl border-2 border-dashed border-[#C8B282] shadow-sm mb-3">
            {qrDataUrl ? (
              <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 rounded" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-xs text-gray-400">
                Generating QR...
              </div>
            )}
          </div>

          <div className="text-xs font-bold text-[#1A1A1A]">
            Scan with any phone camera to launch digital menu
          </div>
          <div className="text-[11px] text-[#73706B] font-mono mt-0.5 truncate max-w-sm">
            {tableUrl}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-[#E5E2DA]">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyLink}
              className="py-2.5 bg-gray-100 hover:bg-gray-200 text-[#1A1A1A] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              {copiedToast ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
              <span>{copiedToast ? 'URL Copied!' : 'Copy Table URL'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (onOpenCustomerView) {
                  onOpenCustomerView(activeTable.tableNumber);
                  onClose();
                } else {
                  window.open(tableUrl, '_blank');
                }
              }}
              className="py-2.5 bg-[#0b1221] hover:bg-[#1e293b] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-[#C8B282]" />
              <span>Preview Menu</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handlePrintTentCard}
            className="w-full py-2.5 bg-[#b45309] hover:bg-[#92400e] text-white text-xs font-bold uppercase tracking-wider rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Acrylic Table Tent Card (A5 Stand)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
