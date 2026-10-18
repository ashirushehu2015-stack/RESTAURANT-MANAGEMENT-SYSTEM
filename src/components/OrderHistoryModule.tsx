import React, { useState } from 'react';
import type { RestaurantOrder, PaymentMethod } from '../types';
import { formatNaira } from '../utils/formatters';
import { 
  History, 
  Receipt, 
  Search, 
  Filter, 
  Printer, 
  Eye, 
  Download, 
  DollarSign, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  CreditCard, 
  Banknote, 
  Landmark, 
  UtensilsCrossed, 
  User, 
  FileText, 
  TrendingUp, 
  ShoppingBag,
  ArrowUpRight,
  ShieldCheck,
  Check
} from 'lucide-react';

interface OrderHistoryModuleProps {
  orders: RestaurantOrder[];
  onReprintReceipt?: (order: RestaurantOrder) => void;
}

// Number to Words Converter for official corporate invoice
function numberToNairaWords(num: number): string {
  if (num === 0) return 'Zero Naira Only';
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function inWords(n: number): string {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + inWords(n % 100) : '');
    if (n < 1000000) return inWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + inWords(n % 1000) : '');
    if (n < 1000000000) return inWords(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 !== 0 ? ' ' + inWords(n % 1000000) : '');
    return n.toString();
  }

  return inWords(Math.floor(num)) + ' Naira Only';
}

// Print Formal A4 Corporate Tax Invoice
function printA4CorporateInvoice(order: RestaurantOrder) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print the Tax Invoice.');
    return;
  }

  const itemsRows = order.items.map((i, idx) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e2da; font-size: 12px;">${idx + 1}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e2da; font-size: 12px;">
        <strong>${i.menuItem.name}</strong>
        ${i.notes ? `<div style="font-size: 11px; color: #555; margin-top: 2px;">* Note: ${i.notes}</div>` : ''}
      </td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e2da; font-size: 12px;">${i.menuItem.category}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e2da; font-size: 12px; text-align: right; font-family: monospace;">${formatNaira(i.menuItem.price)}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e2da; font-size: 12px; text-align: center; font-weight: 700;">${i.quantity}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e5e2da; font-size: 12px; text-align: right; font-family: monospace; font-weight: 700; color: #024628;">${formatNaira(i.menuItem.price * i.quantity)}</td>
    </tr>
  `).join('');

  const amountInWords = numberToNairaWords(order.grandTotal);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Tax Invoice - ${order.id}</title>
        <meta charset="utf-8" />
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #1a1a1a;
            line-height: 1.4;
            margin: 0;
            padding: 24px;
            background: #fff;
          }
          .invoice-box {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #0b1221;
            padding: 30px;
            border-radius: 8px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0b1221;
            padding-bottom: 18px;
            margin-bottom: 20px;
          }
          .brand h1 {
            font-size: 22px;
            font-weight: 900;
            color: #0b1221;
            margin: 0;
            text-transform: uppercase;
            letter-spacing: -0.5px;
          }
          .brand .sub {
            font-size: 11px;
            font-weight: 700;
            color: #b45309;
            margin-top: 3px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .brand .address {
            font-size: 11px;
            color: #555;
            margin-top: 4px;
            max-width: 440px;
          }
          .inv-meta {
            text-align: right;
          }
          .inv-badge {
            background: #024628;
            color: #fff;
            padding: 4px 12px;
            font-size: 11px;
            font-weight: 800;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: inline-block;
          }
          .inv-id {
            font-size: 22px;
            font-weight: 900;
            font-family: monospace;
            color: #0b1221;
            margin-top: 6px;
          }
          .inv-date {
            font-size: 11px;
            color: #555;
            margin-top: 4px;
          }
          .two-cols {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 22px;
          }
          .card {
            background: #faf9f5;
            border: 1px solid #e5e2da;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 12px;
          }
          .card-title {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #8c8984;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #e5e2da;
            padding-bottom: 4px;
            margin-bottom: 8px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 22px;
          }
          .table th {
            background: #0b1221;
            color: #fff;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            padding: 10px 12px;
            text-align: left;
          }
          .totals-wrapper {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 24px;
          }
          .totals-table {
            width: 350px;
            background: #faf9f5;
            border: 1px solid #e5e2da;
            border-radius: 6px;
            padding: 14px 18px;
          }
          .tot-row {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-bottom: 6px;
          }
          .tot-row.grand {
            border-top: 2px solid #0b1221;
            padding-top: 8px;
            margin-top: 6px;
            font-size: 16px;
            font-weight: 900;
            color: #0b1221;
          }
          .words-box {
            background: #faf9f5;
            border: 1px solid #e5e2da;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 12px;
            margin-bottom: 26px;
          }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 40px;
            margin-top: 30px;
            padding-top: 16px;
            border-top: 1px dashed #d1d5db;
          }
          .sig-box { text-align: center; }
          .sig-line {
            border-top: 1px solid #1a1a1a;
            margin-top: 45px;
            margin-bottom: 6px;
          }
          .sig-label {
            font-size: 10px;
            font-weight: 700;
            color: #555;
            text-transform: uppercase;
          }
          .footer-note {
            text-align: center;
            font-size: 10px;
            color: #8c8984;
            margin-top: 24px;
            border-top: 1px solid #e5e2da;
            padding-top: 8px;
          }
          .no-print { text-align: center; margin-bottom: 20px; }
          .btn-print {
            background: #024628;
            color: #fff;
            border: none;
            padding: 10px 24px;
            font-size: 14px;
            font-weight: 800;
            border-radius: 6px;
            cursor: pointer;
          }
          @media print {
            .no-print { display: none !important; }
            body { padding: 0 !important; }
            .invoice-box { border: 1px solid #1a1a1a !important; padding: 20px !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn-print" onclick="window.print()">🖨️ Print Corporate Tax Invoice</button>
        </div>

        <div class="invoice-box">
          <div class="header">
            <div class="brand">
              <h1>Restaurant Management System</h1>
              <div class="sub">Official Corporate Tax Invoice & Bill Receipt</div>
              <div class="address">
                Opp. Mareri Juma'at Mosque Lalan Zaria Road, S/fulani Park Box 767, Gusau, Zamfara State.<br/>
                TEL: +234 803 000 0000 • Email: billing@restaurant-management.ng • TIN: 102938475-001
              </div>
            </div>
            <div class="inv-meta">
              <div class="inv-badge">PAID IN FULL</div>
              <div class="inv-id">INV-${order.id}</div>
              <div class="inv-date">
                <strong>Date & Time:</strong> ${order.createdAt}<br/>
                <strong>Status:</strong> ${order.paymentStatus.toUpperCase()}
              </div>
            </div>
          </div>

          <div class="two-cols">
            <div class="card">
              <div class="card-title">Customer / Billing Details</div>
              <div><strong>Billed To:</strong> ${order.customerName || 'Walk-in Dining Guest'}</div>
              <div><strong>Dining Location:</strong> ${order.tableOrRoom}</div>
              <div><strong>Order Classification:</strong> ${order.orderType}</div>
            </div>

            <div class="card">
              <div class="card-title">Payment & Cashier Verification</div>
              <div><strong>Payment Method:</strong> ${order.paymentMethod}</div>
              <div><strong>Duty Cashier:</strong> ${order.cashierName}</div>
              <div><strong>Kitchen Status:</strong> ${order.kitchenStatus}</div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Item Description</th>
                <th>Category</th>
                <th style="text-align: right; width: 120px;">Unit Price (₦)</th>
                <th style="text-align: center; width: 60px;">Qty</th>
                <th style="text-align: right; width: 130px;">Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>

          <div class="totals-wrapper">
            <div class="totals-table">
              <div class="tot-row">
                <span>Subtotal:</span>
                <span style="font-family: monospace; font-weight: 700;">${formatNaira(order.subtotal)}</span>
              </div>
              <div class="tot-row">
                <span>VAT (5%):</span>
                <span style="font-family: monospace;">${formatNaira(order.tax)}</span>
              </div>
              ${order.serviceCharge > 0 ? `
                <div class="tot-row">
                  <span>Service Charge:</span>
                  <span style="font-family: monospace;">${formatNaira(order.serviceCharge)}</span>
                </div>
              ` : ''}
              <div class="tot-row grand">
                <span>GRAND TOTAL:</span>
                <span style="font-family: monospace;">${formatNaira(order.grandTotal)}</span>
              </div>
            </div>
          </div>

          <div class="words-box">
            <strong>Amount in Words:</strong> ${amountInWords}
          </div>

          <div class="signatures">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-label">Authorized Cashier / Manager Signature</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-label">Customer Acknowledgment</div>
            </div>
          </div>

          <div class="footer-note">
            This document serves as an official proof of payment and tax invoice. Thank you for dining with us!
          </div>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 350);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

// Thermal Reprint Function with Official Duplicate Banner
function printThermalReprint(order: RestaurantOrder) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const itemsRows = order.items.map((i) => `
    <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
      <div style="flex: 1;">
        <div style="font-weight: bold;">${i.quantity}x ${i.menuItem.name}</div>
        ${i.notes ? `<div style="font-size: 9px; color: #555; font-style: italic;">* ${i.notes}</div>` : ''}
      </div>
      <div style="font-weight: bold; width: 65px; text-align: right;">${formatNaira(i.menuItem.price * i.quantity)}</div>
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Receipt Reprint - ${order.id}</title>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          body { font-family: monospace; width: 72mm; margin: 0 auto; color: #000; font-size: 11px; line-height: 1.3; }
          .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
          .title { font-size: 15px; font-weight: bold; text-transform: uppercase; }
          .reprint-banner { border: 1px dashed #000; padding: 4px; font-size: 10px; font-weight: bold; margin: 6px 0; background: #f0f0f0; }
          .sub { font-size: 9px; text-transform: uppercase; margin-top: 2px; }
          .meta { border-bottom: 1px dashed #000; padding-bottom: 6px; margin-bottom: 8px; font-size: 10px; }
          .totals { border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 6px 0; margin-top: 8px; font-size: 11px; }
          .tot-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
          .grand { font-size: 14px; font-weight: bold; border-top: 1px double #000; padding-top: 4px; margin-top: 4px; }
          .footer { text-align: center; margin-top: 12px; font-size: 9px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">RESTAURANT MANAGEMENT SYSTEM</div>
          <div class="reprint-banner">*** OFFICIAL DUPLICATE / REPRINT ***</div>
          <div class="sub">Opp. Mareri Juma'at Mosque Lalan Zaria Road, S/fulani Park Box 767, Gusau, Zamfara State.</div>
          <div class="sub">TEL: +234 803 000 0000 • HISTORICAL BILL</div>
        </div>

        <div class="meta">
          <div><strong>ORDER NO:</strong> ${order.id}</div>
          <div><strong>LOCATION:</strong> ${order.tableOrRoom} (${order.orderType})</div>
          <div><strong>CUSTOMER:</strong> ${order.customerName || 'Walk-in Dining Guest'}</div>
          <div><strong>ORDER TIME:</strong> ${order.createdAt}</div>
          <div><strong>REPRINTED:</strong> ${new Date().toLocaleString()}</div>
          <div><strong>CASHIER:</strong> ${order.cashierName}</div>
          <div><strong>PAYMENT:</strong> ${order.paymentMethod} [${order.paymentStatus.toUpperCase()}]</div>
        </div>

        <div>
          ${itemsRows}
        </div>

        <div class="totals">
          <div class="tot-row">
            <span>Subtotal:</span>
            <span>${formatNaira(order.subtotal)}</span>
          </div>
          <div class="tot-row">
            <span>VAT (5%):</span>
            <span>${formatNaira(order.tax)}</span>
          </div>
          ${order.serviceCharge > 0 ? `
            <div class="tot-row">
              <span>Service Charge:</span>
              <span>${formatNaira(order.serviceCharge)}</span>
            </div>
          ` : ''}
          <div class="tot-row grand">
            <span>GRAND TOTAL:</span>
            <span>${formatNaira(order.grandTotal)}</span>
          </div>
        </div>

        <div class="footer">
          <p>*** REPRINTED FROM AUDIT LEDGER ***</p>
          <p>This is a certified historical record.</p>
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() { window.print(); }, 300);
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}

export const OrderHistoryModule: React.FC<OrderHistoryModuleProps> = ({
  orders,
  onReprintReceipt
}) => {
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Order for Modal Inspection
  const [selectedOrder, setSelectedOrder] = useState<RestaurantOrder | null>(null);

  // Helper date checking
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  // Filtering Logic
  const filteredOrders = orders.filter((order) => {
    // Parse order date (e.g. "2026-08-02 11:30 AM" or ISO string)
    const orderDateOnly = order.createdAt ? order.createdAt.split(' ')[0] : '';

    if (periodFilter === 'today' && orderDateOnly !== todayStr) return false;
    if (periodFilter === 'yesterday' && orderDateOnly !== yesterdayStr) return false;
    if (periodFilter === 'week') {
      const oDate = new Date(orderDateOnly);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (oDate < weekAgo) return false;
    }
    if (periodFilter === 'month') {
      const oMonth = orderDateOnly.substring(0, 7);
      const currentMonth = todayStr.substring(0, 7);
      if (oMonth !== currentMonth) return false;
    }

    // Order type filter
    if (orderTypeFilter !== 'all' && order.orderType !== orderTypeFilter) return false;

    // Payment method filter
    if (paymentMethodFilter !== 'all' && order.paymentMethod !== paymentMethodFilter) return false;

    // Status filter
    if (statusFilter !== 'all' && order.paymentStatus !== statusFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = order.id.toLowerCase().includes(q);
      const matchCustomer = order.customerName ? order.customerName.toLowerCase().includes(q) : false;
      const matchTable = order.tableOrRoom.toLowerCase().includes(q);
      const matchCashier = order.cashierName.toLowerCase().includes(q);
      const matchItems = order.items.some(i => i.menuItem.name.toLowerCase().includes(q));

      if (!matchId && !matchCustomer && !matchTable && !matchCashier && !matchItems) {
        return false;
      }
    }

    return true;
  });

  // KPI Metrics
  const totalCompletedOrders = filteredOrders.filter(o => o.paymentStatus === 'Paid').length;
  const totalRevenue = filteredOrders
    .filter(o => o.paymentStatus === 'Paid')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const averageTicket = totalCompletedOrders > 0 ? Math.round(totalRevenue / totalCompletedOrders) : 0;

  // Breakdown by channel
  const cashTotal = filteredOrders
    .filter(o => o.paymentStatus === 'Paid' && o.paymentMethod === 'Cash')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const transferTotal = filteredOrders
    .filter(o => o.paymentStatus === 'Paid' && (o.paymentMethod === 'Bank Transfer' || o.paymentMethod === 'Opay' || o.paymentMethod === 'Moniepoint'))
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const posTotal = filteredOrders
    .filter(o => o.paymentStatus === 'Paid' && o.paymentMethod === 'POS Machine')
    .reduce((sum, o) => sum + o.grandTotal, 0);

  // Voided / Cancelled tickets
  const voidedOrders = filteredOrders.filter(o => o.paymentStatus === 'Voided');
  const voidedCount = voidedOrders.length;
  const voidedValue = voidedOrders.reduce((sum, o) => sum + o.grandTotal, 0);

  // Export to CSV Function
  const handleExportCSV = () => {
    const headers = [
      'Order ID',
      'Date & Time',
      'Location / Table',
      'Order Type',
      'Customer',
      'Cashier',
      'Item Count',
      'Items Detail',
      'Subtotal (NGN)',
      'Tax (NGN)',
      'Service Charge (NGN)',
      'Grand Total (NGN)',
      'Payment Method',
      'Payment Status',
      'Kitchen Status'
    ];

    const rows = filteredOrders.map(o => [
      `"${o.id}"`,
      `"${o.createdAt}"`,
      `"${o.tableOrRoom}"`,
      `"${o.orderType}"`,
      `"${o.customerName || 'Walk-in'}"`,
      `"${o.cashierName}"`,
      o.items.reduce((acc, i) => acc + i.quantity, 0),
      `"${o.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join('; ')}"`,
      o.subtotal,
      o.tax,
      o.serviceCharge,
      o.grandTotal,
      `"${o.paymentMethod}"`,
      `"${o.paymentStatus}"`,
      `"${o.kitchenStatus}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Order_History_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 border border-[#E5E2DA] rounded-xl shadow-xs">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#1A1A1A] flex items-center gap-2.5">
            <History className="w-6 h-6 text-[#C8B282]" />
            <span>Order History & Audit Ledger</span>
          </h2>
          <p className="text-xs text-[#73706B] mt-1">
            Tamper-evident archive of all settled, served, and voided tickets with reprint and corporate invoice generation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Export to CSV Button */}
          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-[#FAF9F5] hover:bg-[#E5E2DA] border border-[#d1d5db] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg transition-all cursor-pointer shadow-2xs"
          >
            <Download className="w-4 h-4 text-[#024628]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Historical Revenue */}
        <div className="bg-white p-5 border border-[#E5E2DA] rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-wider block">Total Sales Value</span>
            <span className="text-2xl font-bold font-serif text-[#1A1A1A] block mt-0.5">{formatNaira(totalRevenue)}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">{totalCompletedOrders} closed tickets</span>
          </div>
        </div>

        {/* Average Ticket Size (AOV) */}
        <div className="bg-white p-5 border border-[#E5E2DA] rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-wider block">Average Ticket Size</span>
            <span className="text-2xl font-bold font-serif text-[#1A1A1A] block mt-0.5">{formatNaira(averageTicket)}</span>
            <span className="text-[11px] text-[#73706B]">Average spend per table</span>
          </div>
        </div>

        {/* Payment Channels Mix */}
        <div className="bg-white p-5 border border-[#E5E2DA] rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center shrink-0 border border-purple-100">
            <CreditCard className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-wider block">Payment Mix</span>
            <div className="text-[11px] font-mono mt-0.5 space-y-0.5 text-[#1A1A1A]">
              <div>💵 Cash: <strong>{formatNaira(cashTotal)}</strong></div>
              <div>🏦 Transfer: <strong>{formatNaira(transferTotal)}</strong></div>
              <div>💳 POS: <strong>{formatNaira(posTotal)}</strong></div>
            </div>
          </div>
        </div>

        {/* Voided / Cancelled Orders */}
        <div className={`p-5 border rounded-xl shadow-xs flex items-center gap-4 transition-all ${
          voidedCount > 0 ? 'bg-amber-50/50 border-amber-200' : 'bg-white border-[#E5E2DA]'
        }`}>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
            voidedCount > 0 ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}>
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-wider block">Voided Tickets</span>
            <span className="text-2xl font-bold font-serif text-[#1A1A1A] block mt-0.5">{voidedCount} Tickets</span>
            <span className="text-[11px] text-[#73706B]">{formatNaira(voidedValue)} loss prevented</span>
          </div>
        </div>
      </div>

      {/* Main View Container */}
      <div className="bg-white border border-[#E5E2DA] rounded-xl shadow-xs overflow-hidden">
        {/* Navigation Tabs and Search */}
        <div className="border-b border-[#E5E2DA] bg-[#FAF9F5] flex flex-col lg:flex-row justify-between items-stretch lg:items-center px-4 py-3 gap-3">
          {/* Period Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setPeriodFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                periodFilter === 'all' ? 'bg-[#0b1221] text-white' : 'bg-white text-[#73706B] hover:text-[#1A1A1A] border border-[#E5E2DA]'
              }`}
            >
              All History
            </button>
            <button
              onClick={() => setPeriodFilter('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                periodFilter === 'today' ? 'bg-[#0b1221] text-white' : 'bg-white text-[#73706B] hover:text-[#1A1A1A] border border-[#E5E2DA]'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriodFilter('yesterday')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                periodFilter === 'yesterday' ? 'bg-[#0b1221] text-white' : 'bg-white text-[#73706B] hover:text-[#1A1A1A] border border-[#E5E2DA]'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => setPeriodFilter('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                periodFilter === 'week' ? 'bg-[#0b1221] text-white' : 'bg-white text-[#73706B] hover:text-[#1A1A1A] border border-[#E5E2DA]'
              }`}
            >
              This Week
            </button>
            <button
              onClick={() => setPeriodFilter('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                periodFilter === 'month' ? 'bg-[#0b1221] text-white' : 'bg-white text-[#73706B] hover:text-[#1A1A1A] border border-[#E5E2DA]'
              }`}
            >
              This Month
            </button>
          </div>

          {/* Secondary Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Dining Type Dropdown */}
            <select
              value={orderTypeFilter}
              onChange={(e) => setOrderTypeFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[#E5E2DA] rounded-lg text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
            >
              <option value="all">All Dining Types</option>
              <option value="Dine-In">🍽️ Dine-In</option>
              <option value="Takeaway">🥡 Takeaway</option>
              <option value="Room Delivery">🛎️ Room Delivery</option>
              <option value="Home / Office Delivery">🛵 Office / Home Delivery</option>
            </select>

            {/* Payment Method Dropdown */}
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[#E5E2DA] rounded-lg text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
            >
              <option value="all">All Payment Methods</option>
              <option value="Cash">💵 Cash</option>
              <option value="Bank Transfer">🏦 Bank Transfer</option>
              <option value="POS Machine">💳 POS Machine</option>
            </select>

            {/* Status Dropdown */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[#E5E2DA] rounded-lg text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
            >
              <option value="all">All Statuses</option>
              <option value="Paid">🟢 Paid</option>
              <option value="Pending">🟡 Pending</option>
              <option value="Voided">🔴 Voided</option>
            </select>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8984]" />
              <input
                type="text"
                placeholder="Search Order #, table, customer..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E5E2DA] rounded-lg text-xs font-medium focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          </div>
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1A1A1A] text-[#FDFCF9] font-mono text-[10px] uppercase tracking-wider">
                <th className="p-3.5">Order ID & Date</th>
                <th className="p-3.5">Table / Dining Type</th>
                <th className="p-3.5">Customer & Server</th>
                <th className="p-3.5">Ordered Items</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5 text-right">Grand Total</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Audit Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DA]">
              {filteredOrders.map((order) => {
                const totalItemQty = order.items.reduce((sum, i) => sum + i.quantity, 0);
                const itemsSummary = order.items
                  .map(i => `${i.quantity}x ${i.menuItem.name}`)
                  .slice(0, 2)
                  .join(', ') + (order.items.length > 2 ? ` +${order.items.length - 2} more` : '');

                return (
                  <tr key={order.id} className="hover:bg-[#FAF9F5] transition-colors">
                    {/* Order ID & Date */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-bold font-mono text-[#1A1A1A] text-sm">
                        {order.id}
                      </div>
                      <div className="text-[11px] text-[#73706B] flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3 text-[#A3A09A]" />
                        <span>{order.createdAt}</span>
                      </div>
                    </td>

                    {/* Dining Location & Type */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-bold text-[#1A1A1A] text-xs">
                        {order.tableOrRoom}
                      </div>
                      <div className="text-[10px] text-[#8C8984] font-medium mt-0.5">
                        {order.orderType}
                      </div>
                    </td>

                    {/* Customer & Server */}
                    <td className="p-3.5 whitespace-nowrap">
                      <div className="font-bold text-[#1A1A1A] text-xs">
                        {order.customerName || 'Walk-in Guest'}
                      </div>
                      <div className="text-[10px] text-[#8C8984]">
                        Server: {order.cashierName}
                      </div>
                    </td>

                    {/* Items Ordered */}
                    <td className="p-3.5 max-w-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-[10px] bg-[#FAF9F5] border border-[#E5E2DA] px-1.5 py-0.2 rounded text-[#1A1A1A]">
                          {totalItemQty} items
                        </span>
                        <span className="text-[#555] text-xs truncate" title={order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}>
                          {itemsSummary}
                        </span>
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="p-3.5 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        order.paymentMethod === 'Cash'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : order.paymentMethod === 'Bank Transfer'
                          ? 'bg-blue-50 text-blue-800 border border-blue-200'
                          : 'bg-purple-50 text-purple-800 border border-purple-200'
                      }`}>
                        {order.paymentMethod === 'Cash' && <Banknote className="w-2.5 h-2.5" />}
                        {order.paymentMethod === 'Bank Transfer' && <Landmark className="w-2.5 h-2.5" />}
                        {order.paymentMethod === 'POS Machine' && <CreditCard className="w-2.5 h-2.5" />}
                        <span>{order.paymentMethod}</span>
                      </span>
                    </td>

                    {/* Grand Total */}
                    <td className="p-3.5 text-right font-mono font-bold text-[#024628] text-sm whitespace-nowrap">
                      {formatNaira(order.grandTotal)}
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        order.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : order.paymentStatus === 'Pending'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>

                    {/* Audit Actions */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* View Details Action */}
                        <button
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-[#0b1221] hover:bg-[#E5E2DA] rounded transition-colors cursor-pointer"
                          title="View Complete Order Audit Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Thermal Receipt Reprint Action */}
                        <button
                          type="button"
                          onClick={() => {
                            if (onReprintReceipt) {
                              onReprintReceipt(order);
                            } else {
                              printThermalReprint(order);
                            }
                          }}
                          className="p-1.5 text-[#024628] hover:bg-emerald-50 rounded transition-colors cursor-pointer"
                          title="Reprint Thermal Receipt (Slip)"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* A4 Tax Invoice Action */}
                        <button
                          type="button"
                          onClick={() => printA4CorporateInvoice(order)}
                          className="p-1.5 text-blue-700 hover:bg-blue-50 rounded transition-colors cursor-pointer"
                          title="Print Formal Corporate Tax Invoice (A4)"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#73706B]">
                    No historical orders match the selected filters or query.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Order Audit & Inspection */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white max-w-xl w-full p-6 border border-[#1A1A1A] rounded-xl shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A] flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#C8B282]" />
                  <span>Order Inspection & Audit • {selectedOrder.id}</span>
                </h3>
                <p className="text-xs text-[#73706B]">
                  Recorded on {selectedOrder.createdAt} • Cashier: {selectedOrder.cashierName}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="text-xs font-bold text-[#8C8984] hover:text-[#1A1A1A]"
              >
                ✕ Close
              </button>
            </div>

            {/* Meta Information Cards */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="bg-[#FAF9F5] p-3 rounded border border-[#E5E2DA] space-y-1">
                <div><span className="text-[#73706B]">Location:</span> <strong>{selectedOrder.tableOrRoom}</strong></div>
                <div><span className="text-[#73706B]">Order Type:</span> <strong>{selectedOrder.orderType}</strong></div>
                <div><span className="text-[#73706B]">Guest / Client:</span> <strong>{selectedOrder.customerName || 'Walk-in'}</strong></div>
              </div>

              <div className="bg-[#FAF9F5] p-3 rounded border border-[#E5E2DA] space-y-1">
                <div><span className="text-[#73706B]">Payment Method:</span> <strong>{selectedOrder.paymentMethod}</strong></div>
                <div><span className="text-[#73706B]">Payment Status:</span> <strong className="text-emerald-700">{selectedOrder.paymentStatus}</strong></div>
                <div><span className="text-[#73706B]">Kitchen Status:</span> <strong>{selectedOrder.kitchenStatus}</strong></div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="border border-[#E5E2DA] rounded overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF9F5] border-b border-[#E5E2DA] text-[#73706B] font-bold">
                    <th className="p-2.5">Item Description</th>
                    <th className="p-2.5 text-center">Qty</th>
                    <th className="p-2.5 text-right">Price</th>
                    <th className="p-2.5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DA]">
                  {selectedOrder.items.map((i, idx) => (
                    <tr key={idx}>
                      <td className="p-2.5">
                        <div className="font-semibold text-[#1A1A1A]">{i.menuItem.name}</div>
                        {i.notes && <div className="text-[10px] text-[#73706B] italic">* {i.notes}</div>}
                      </td>
                      <td className="p-2.5 text-center font-bold">{i.quantity}</td>
                      <td className="p-2.5 text-right font-mono">{formatNaira(i.menuItem.price)}</td>
                      <td className="p-2.5 text-right font-mono font-bold text-[#024628]">{formatNaira(i.menuItem.price * i.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Financial Breakdown */}
            <div className="bg-[#FAF9F5] p-3 rounded border border-[#E5E2DA] space-y-1.5 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#73706B]">Subtotal:</span>
                <span>{formatNaira(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#73706B]">VAT (5%):</span>
                <span>{formatNaira(selectedOrder.tax)}</span>
              </div>
              {selectedOrder.serviceCharge > 0 && (
                <div className="flex justify-between">
                  <span className="text-[#73706B]">Service Charge:</span>
                  <span>{formatNaira(selectedOrder.serviceCharge)}</span>
                </div>
              )}
              <div className="flex justify-between pt-1 border-t border-[#E5E2DA] font-bold text-sm text-[#024628]">
                <span>Grand Total Settled:</span>
                <span>{formatNaira(selectedOrder.grandTotal)}</span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-[#E5E2DA]">
              <button
                type="button"
                onClick={() => printThermalReprint(selectedOrder)}
                className="flex-1 py-2.5 bg-[#024628] hover:bg-[#03331d] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-[#C8B282]" />
                <span>Reprint Thermal Slip</span>
              </button>

              <button
                type="button"
                onClick={() => printA4CorporateInvoice(selectedOrder)}
                className="flex-1 py-2.5 bg-[#0b1221] hover:bg-[#1a2333] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
              >
                <FileText className="w-4 h-4 text-[#C8B282]" />
                <span>A4 Corporate Invoice</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedOrder(null)}
                className="px-4 py-2.5 bg-[#F5F2ED] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider rounded hover:bg-[#e8e4dc]"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
