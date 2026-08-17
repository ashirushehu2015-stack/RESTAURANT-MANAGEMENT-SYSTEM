import React, { useState } from 'react';
import type { PaymentRecord, HotelInfo } from '../types';
import { formatNaira, formatDateFormatted } from '../utils/formatters';
import { Printer, Download, X, CheckCircle, Copy, Share2, RefreshCw, FileText } from 'lucide-react';

interface ReceiptViewModalProps {
  payment: PaymentRecord | null;
  hotelInfo: HotelInfo;
  onClose: () => void;
  onReprint?: (paymentId: string) => void;
}

export const ReceiptViewModal: React.FC<ReceiptViewModalProps> = ({
  payment,
  hotelInfo,
  onClose,
  onReprint
}) => {
  const [layoutMode, setLayoutMode] = useState<'thermal' | 'a4'>('thermal');
  const [copied, setCopied] = useState(false);

  if (!payment) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleReprintClick = () => {
    if (onReprint) {
      onReprint(payment.id);
    }
  };

  const generateReceiptText = () => {
    return `--------------------------------------------------
        ${hotelInfo.name}
${hotelInfo.tagline}
Address: ${hotelInfo.address}
Tel: ${hotelInfo.phone} | Email: ${hotelInfo.email}

OFFICIAL PAYMENT RECEIPT
--------------------------------------------------
Receipt No:      ${payment.receiptNo}
Invoice No:      ${payment.invoiceNo}
Guest Name:      ${payment.guestName}
Room No:         ${payment.roomNumber}
Room Type:       ${payment.roomType}
Check-in:        ${formatDateFormatted(payment.checkInDate)}
Check-out:       ${formatDateFormatted(payment.checkOutDate)}
Nights:          ${payment.nights}
--------------------------------------------------
Room Charge:     ${formatNaira(payment.roomCharge)}
Add. Services:   ${formatNaira(payment.additionalServicesTotal)}
Discount:        ${formatNaira(payment.discount)}
Tax:             ${formatNaira(payment.tax)}
TOTAL AMOUNT:    ${formatNaira(payment.amountDue)}
--------------------------------------------------
AMOUNT PAID:     ${formatNaira(payment.amountPaid)}
BALANCE DUE:     ${formatNaira(payment.balance)}
PAYMENT METHOD:  ${payment.paymentMethod}
${payment.paymentMethod === 'Bank Transfer' ? `DEPOSITED TO:    ${payment.bankName || 'N/A'}\n` : ''}TRANS. REF:      ${payment.transactionReference || 'N/A'}
--------------------------------------------------
CASHIER:         ${payment.receivedBy}
DATE:            ${formatDateFormatted(payment.paymentDate)}
TIME:            ${payment.paymentTime}
STATUS:          ${payment.paymentStatus.toUpperCase()}
--------------------------------------------------
        THANK YOU FOR YOUR PATRONAGE
--------------------------------------------------`;
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(generateReceiptText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#FDFCF9] rounded-none shadow-2xl max-w-xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#E5E2DA]">
        
        {/* Modal Top Actions Header (Hidden during Print) */}
        <div className="bg-[#1A1A1A] text-[#FDFCF9] p-4 flex items-center justify-between border-b border-[#E5E2DA] print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-[#C8B282]" />
            <div>
              <h3 className="font-serif text-sm sm:text-base">Official Payment Receipt</h3>
              <p className="text-[10px] text-[#A3A09A]">Ref: {payment.receiptNo}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Switcher */}
            <div className="bg-[#2A2A2A] p-1 flex items-center gap-1 border border-[#3A3A3A] text-xs">
              <button
                onClick={() => setLayoutMode('thermal')}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  layoutMode === 'thermal' ? 'bg-[#C8B282] text-[#1A1A1A]' : 'text-[#A3A09A] hover:text-[#FDFCF9]'
                }`}
              >
                POS Thermal
              </button>
              <button
                onClick={() => setLayoutMode('a4')}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                  layoutMode === 'a4' ? 'bg-[#C8B282] text-[#1A1A1A]' : 'text-[#A3A09A] hover:text-[#FDFCF9]'
                }`}
              >
                A4 Letterhead
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-[#A3A09A] hover:text-[#FDFCF9] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-[#F5F2ED] flex justify-center">
          
          {layoutMode === 'thermal' ? (
            /* ================= THERMAL RECEIPT STYLE ================= */
            <div className="bg-white w-[320px] p-6 shadow-xs border border-[#E5E2DA] rounded-none font-mono text-xs text-[#1A1A1A] printable-receipt flex flex-col justify-between">
              <div>
                {payment.reprintCount && payment.reprintCount > 0 ? (
                  <div className="bg-[#FAF6F2] text-[#8C4A27] border border-[#EAD3C6] text-[10px] font-bold text-center py-1 mb-2 tracking-wider uppercase">
                    *** OFFICIAL REPRINT #{payment.reprintCount} ***
                  </div>
                ) : null}

                {/* Header */}
                <div className="text-center border-b border-dashed border-[#A3A09A] pb-3 mb-3">
                  <h2 className="font-serif font-bold text-base tracking-wide text-[#1A1A1A] uppercase">
                    {hotelInfo.name}
                  </h2>
                  <p className="text-[10px] text-[#73706B] font-sans mt-0.5">
                    {hotelInfo.tagline}
                  </p>
                  <p className="text-[10px] text-[#8C8984] mt-1 font-sans">
                    {hotelInfo.address}
                  </p>
                  <p className="text-[10px] text-[#8C8984] font-sans">
                    Tel: {hotelInfo.phone}
                  </p>
                  <div className="mt-2 font-bold text-[10px] uppercase tracking-widest bg-[#1A1A1A] text-[#FDFCF9] py-0.5 px-2 inline-block font-sans">
                    PAYMENT RECEIPT
                  </div>
                </div>

                {/* Receipt Details */}
                <div className="space-y-1.5 border-b border-dashed border-[#A3A09A] pb-3 mb-3">
                  <div className="flex justify-between">
                    <span className="text-[#8C8984]">Receipt No:</span>
                    <span className="font-bold">{payment.receiptNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C8984]">Invoice No:</span>
                    <span className="font-semibold">{payment.invoiceNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C8984]">Date/Time:</span>
                    <span>{formatDateFormatted(payment.paymentDate)} {payment.paymentTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C8984]">Guest:</span>
                    <span className="font-bold uppercase">{payment.guestName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#8C8984]">Room:</span>
                    <span className="font-bold">{payment.roomNumber} ({payment.roomType})</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#8C8984]">Check-in:</span>
                    <span>{formatDateFormatted(payment.checkInDate)}</span>
                  </div>
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#8C8984]">Check-out:</span>
                    <span>{formatDateFormatted(payment.checkOutDate)} ({payment.nights} nights)</span>
                  </div>
                </div>

                {/* Bill Breakdown */}
                <div className="space-y-1.5 border-b border-dashed border-[#A3A09A] pb-3 mb-3">
                  <div className="flex justify-between">
                    <span>Room Charge ({payment.nights} nights):</span>
                    <span>{formatNaira(payment.roomCharge)}</span>
                  </div>
                  {payment.additionalServicesTotal > 0 && (
                    <div className="flex justify-between">
                      <span>Add. Services:</span>
                      <span>{formatNaira(payment.additionalServicesTotal)}</span>
                    </div>
                  )}
                  {payment.discount > 0 && (
                    <div className="flex justify-between text-[#2D5A44]">
                      <span>Discount:</span>
                      <span>-{formatNaira(payment.discount)}</span>
                    </div>
                  )}
                  {payment.tax > 0 && (
                    <div className="flex justify-between">
                      <span>Tax/VAT:</span>
                      <span>{formatNaira(payment.tax)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm pt-1 border-t border-[#E5E2DA]">
                    <span>TOTAL BILL:</span>
                    <span>{formatNaira(payment.amountDue)}</span>
                  </div>
                </div>

                {/* Payment Breakdown */}
                <div className="space-y-1.5 border-b border-dashed border-[#A3A09A] pb-3 mb-3 bg-[#FDFCF9] p-2.5 border border-[#E5E2DA]">
                  <div className="flex justify-between font-bold text-[#2D5A44] text-sm">
                    <span>AMOUNT PAID:</span>
                    <span>{formatNaira(payment.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between text-[#1A1A1A]">
                    <span>BALANCE DUE:</span>
                    <span className={payment.balance > 0 ? 'text-[#8B2626] font-bold' : 'text-[#73706B]'}>
                      {formatNaira(payment.balance)}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 text-[11px]">
                    <span className="text-[#8C8984]">Payment Method:</span>
                    <span className="font-bold text-[#1A1A1A]">{payment.paymentMethod}</span>
                  </div>
                  {payment.bankName && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#8C8984]">Deposited To:</span>
                      <span>{payment.bankName}</span>
                    </div>
                  )}
                  {payment.transactionReference && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#8C8984]">Trans Ref:</span>
                      <span className="font-mono font-bold text-[#243B6B]">{payment.transactionReference}</span>
                    </div>
                  )}
                </div>

                {/* Footer Info */}
                <div className="text-[11px] space-y-1 text-[#73706B]">
                  <div className="flex justify-between">
                    <span>Cashier:</span>
                    <span className="font-semibold text-[#1A1A1A]">{payment.receivedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Authorized By:</span>
                    <span className="text-[#1A1A1A]">{payment.authorizedBy || payment.receivedBy}</span>
                  </div>
                  {payment.remarks && (
                    <div className="text-[10px] text-[#8C8984] italic mt-1">
                      Note: {payment.remarks}
                    </div>
                  )}
                </div>
              </div>

              <div className="text-center mt-6 pt-3 border-t border-dashed border-[#A3A09A] font-sans">
                <p className="font-bold text-[10px] uppercase tracking-[0.2em] text-[#1A1A1A]">THANK YOU FOR YOUR PATRONAGE</p>
                <p className="text-[9px] text-[#A3A09A] mt-0.5">Please keep this receipt for verification.</p>
              </div>
            </div>
          ) : (
            /* ================= A4 LETTERHEAD RECEIPT STYLE ================= */
            <div className="bg-white w-full max-w-lg p-6 sm:p-8 shadow-md border border-[#E5E2DA] rounded-none text-[#1A1A1A] printable-receipt relative flex flex-col justify-between">
              
              <div>
                {/* Reprint Banner */}
                {payment.reprintCount && payment.reprintCount > 0 ? (
                  <div className="bg-[#FAF6F2] text-[#8C4A27] border border-[#EAD3C6] text-xs font-bold text-center py-1.5 mb-4 tracking-widest uppercase">
                    *** OFFICIAL REPRINT #{payment.reprintCount} ***
                  </div>
                ) : null}

                {/* Letterhead Header matching Restaurant style */}
                <div className="border-b border-[#1A1A1A] pb-4 mb-4 text-center">
                  <div className="flex justify-center items-center gap-2 mb-1">
                    <div className="w-10 h-10 border border-[#C8B282] bg-[#1A1A1A] text-[#FDFCF9] flex items-center justify-center font-serif italic text-lg">
                      FE
                    </div>
                    <h1 className="text-xl sm:text-2xl font-serif tracking-wide text-[#1A1A1A]">
                      {hotelInfo.name}
                    </h1>
                  </div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#A3A09A]">
                    {hotelInfo.tagline}
                  </p>
                  <p className="text-[11px] text-[#73706B] mt-1 max-w-md mx-auto">
                    {hotelInfo.address}
                  </p>
                  <p className="text-[11px] text-[#73706B]">
                    E-mail: {hotelInfo.email} | Tel: {hotelInfo.phone}
                  </p>
                  
                  <div className="mt-3 inline-block bg-[#1A1A1A] text-[#FDFCF9] font-bold text-[10px] px-4 py-1 uppercase tracking-[0.2em]">
                    CASH COLLECTED RECEIPT
                  </div>
                </div>

                {/* Top Info Grid */}
                <div className="grid grid-cols-2 gap-3 text-xs mb-4 bg-[#FDFCF9] p-3 border border-[#E5E2DA]">
                  <div>
                    <span className="text-[#8C8984] block text-[9px] uppercase tracking-wider font-bold">Receipt Number</span>
                    <span className="font-bold text-sm text-[#1A1A1A] font-serif">{payment.receiptNo}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#8C8984] block text-[9px] uppercase tracking-wider font-bold">Invoice Number</span>
                    <span className="font-bold text-sm text-[#1A1A1A] font-serif">{payment.invoiceNo}</span>
                  </div>
                  <div>
                    <span className="text-[#8C8984] block text-[9px] uppercase tracking-wider font-bold">Date & Time</span>
                    <span className="font-medium text-[#1A1A1A]">{formatDateFormatted(payment.paymentDate)} at {payment.paymentTime}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[#8C8984] block text-[9px] uppercase tracking-wider font-bold">Payment Status</span>
                    <span className={`inline-block font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 ${
                      payment.paymentStatus === 'Paid' ? 'bg-[#F0F7F3] text-[#2D5A44] border border-[#C4E2D2]' : 'bg-[#FAF6F2] text-[#8C4A27] border border-[#EAD3C6]'
                    }`}>
                      {payment.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* Guest & Stay Details */}
                <div className="border border-[#E5E2DA] mb-4 text-xs">
                  <div className="bg-[#F5F2ED] px-3 py-1.5 font-bold text-[#1A1A1A] border-b border-[#E5E2DA] uppercase tracking-wider text-[10px]">
                    Guest & Reservation Details
                  </div>
                  <div className="p-3 grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-[#8C8984]">Guest Name:</span>
                      <p className="font-bold text-[#1A1A1A] text-sm">{payment.guestName}</p>
                    </div>
                    <div>
                      <span className="text-[#8C8984]">Phone Contact:</span>
                      <p className="font-medium text-[#1A1A1A]">{payment.guestPhone || 'N/A'}</p>
                    </div>
                    <div>
                      <span className="text-[#8C8984]">Room Number:</span>
                      <p className="font-bold text-[#243B6B]">{payment.roomNumber} ({payment.roomType})</p>
                    </div>
                    <div>
                      <span className="text-[#8C8984]">Stay Duration:</span>
                      <p className="font-medium text-[#1A1A1A]">
                        {formatDateFormatted(payment.checkInDate)} to {formatDateFormatted(payment.checkOutDate)} ({payment.nights} Nights)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Financial Summary Table */}
                <table className="w-full text-xs border border-[#E5E2DA] mb-4">
                  <thead className="bg-[#1A1A1A] text-[#FDFCF9] text-left font-semibold">
                    <tr>
                      <th className="p-2.5 uppercase tracking-wider text-[10px]">Description</th>
                      <th className="p-2.5 text-right uppercase tracking-wider text-[10px]">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E2DA]">
                    <tr>
                      <td className="p-2.5">Room Charge ({payment.nights} nights @ {payment.roomType})</td>
                      <td className="p-2.5 text-right font-medium font-serif">{formatNaira(payment.roomCharge)}</td>
                    </tr>
                    {payment.additionalServicesTotal > 0 && (
                      <tr>
                        <td className="p-2.5">Additional Services (Laundry, Room Service, etc.)</td>
                        <td className="p-2.5 text-right font-medium font-serif">{formatNaira(payment.additionalServicesTotal)}</td>
                      </tr>
                    )}
                    {payment.discount > 0 && (
                      <tr className="text-[#2D5A44] font-medium">
                        <td className="p-2.5">Special Discount Applied</td>
                        <td className="p-2.5 text-right font-serif">-{formatNaira(payment.discount)}</td>
                      </tr>
                    )}
                    {payment.tax > 0 && (
                      <tr>
                        <td className="p-2.5">Tax / VAT</td>
                        <td className="p-2.5 text-right font-medium font-serif">{formatNaira(payment.tax)}</td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-[#FDFCF9] font-bold border-t border-[#E5E2DA]">
                    <tr>
                      <td className="p-2.5 text-[#1A1A1A] uppercase text-[10px] tracking-wider">TOTAL GRAND BILL</td>
                      <td className="p-2.5 text-right text-[#1A1A1A] font-serif text-sm">{formatNaira(payment.amountDue)}</td>
                    </tr>
                    <tr className="bg-[#F0F7F3] text-[#2D5A44] border-t border-[#C4E2D2]">
                      <td className="p-2.5 font-bold uppercase text-[10px] tracking-wider">AMOUNT PAID TODAY ({payment.paymentMethod})</td>
                      <td className="p-2.5 text-right font-serif text-base">{formatNaira(payment.amountPaid)}</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 text-[#73706B] uppercase text-[10px] tracking-wider">OUTSTANDING BALANCE</td>
                      <td className={`p-2.5 text-right font-serif font-bold ${payment.balance > 0 ? 'text-[#8B2626]' : 'text-[#73706B]'}`}>
                        {formatNaira(payment.balance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>

                {/* Payment Reference Box */}
                <div className="bg-[#FDFCF9] border border-[#E5E2DA] p-3 text-xs space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span className="text-[#73706B]">Payment Method:</span>
                    <span className="font-bold text-[#1A1A1A]">{payment.paymentMethod}</span>
                  </div>
                  {payment.bankName && (
                    <div className="flex justify-between">
                      <span className="text-[#73706B]">Deposited To:</span>
                      <span className="font-medium text-[#1A1A1A]">{payment.bankName}</span>
                    </div>
                  )}
                  {payment.transactionReference && (
                    <div className="flex justify-between">
                      <span className="text-[#73706B]">Transaction Ref / POS Slip:</span>
                      <span className="font-mono font-bold text-[#243B6B]">
                        {payment.transactionReference}
                      </span>
                    </div>
                  )}
                </div>

                {/* Signatures & Cashier Footer */}
                <div className="pt-4 border-t border-[#E5E2DA] grid grid-cols-2 gap-6 text-center text-xs">
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">{payment.receivedBy}</p>
                    <div className="border-b border-[#A3A09A] my-2 w-3/4 mx-auto"></div>
                    <p className="text-[10px] text-[#A3A09A] uppercase tracking-wider font-bold">Cashier / Receiver Sign</p>
                  </div>
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">{payment.guestName}</p>
                    <div className="border-b border-[#A3A09A] my-2 w-3/4 mx-auto"></div>
                    <p className="text-[10px] text-[#A3A09A] uppercase tracking-wider font-bold">Customer Sign</p>
                  </div>
                </div>
              </div>

              <div className="text-center mt-6 pt-2 text-[10px] text-[#A3A09A] border-t border-[#E5E2DA]">
                <p className="font-bold text-[#1A1A1A] uppercase tracking-widest">{hotelInfo.name}</p>
                <p>Generated automatically on {new Date().toLocaleString()}</p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Action Controls (Hidden during Print) */}
        <div className="bg-[#1A1A1A] text-[#FDFCF9] p-3 sm:p-4 border-t border-[#E5E2DA] flex flex-wrap items-center justify-between gap-2 print:hidden">
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="bg-[#2D5A44] hover:bg-[#234836] text-[#FDFCF9] font-bold px-4 py-2 text-xs uppercase tracking-[0.18em] flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>

            {onReprint && (
              <button
                onClick={handleReprintClick}
                className="bg-[#C8B282] hover:bg-[#B8A272] text-[#1A1A1A] font-bold px-3 py-2 text-xs uppercase tracking-[0.18em] flex items-center gap-1.5 transition-all"
                title="Register a formal reprint log and refresh watermark"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Record Reprint</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="bg-[#2A2A2A] hover:bg-[#3A3A3A] text-[#FDFCF9] font-medium px-3 py-2 text-xs uppercase tracking-wider flex items-center gap-1.5 border border-[#3A3A3A] transition-all"
            >
              {copied ? <CheckCircle className="w-4 h-4 text-[#C8B282]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied Text!' : 'Copy Summary'}</span>
            </button>

            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-[#A3A09A] hover:text-[#FDFCF9] transition-colors"
            >
              Close
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
