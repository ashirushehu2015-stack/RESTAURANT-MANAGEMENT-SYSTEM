import React, { useState, useEffect } from 'react';
import type { ExpenseRecord, ExpenseCategory, ExpensePaymentMethod } from '../types';
import { INITIAL_EXPENSES, INITIAL_PETTY_CASH_BALANCE } from '../data/restaurantData';
import { formatNaira } from '../utils/formatters';
import { 
  DollarSign, 
  Receipt, 
  Fuel, 
  Flame, 
  Wallet, 
  Plus, 
  Search, 
  Printer, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Calendar, 
  Check, 
  X, 
  Filter, 
  Building2, 
  ArrowUpRight,
  TrendingDown,
  FileText,
  BadgeCheck,
  RefreshCw,
  Coins
} from 'lucide-react';

const EXPENSES_STORAGE_KEY = 'restaurant_management_expenses';
const PETTY_CASH_STORAGE_KEY = 'restaurant_management_petty_cash';

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
  'Power & Generator Fuel',
  'Cooking Gas (LPG)',
  'Kitchen Petty & Sundry',
  'Equipment Repairs & Maintenance',
  'Packaging & Consumables',
  'Staff Welfare & Casuals',
  'Cleaning & Sanitation',
  'Utilities & Electricity',
  'Administrative & POS Sundry',
  'Other Operational Expenses'
];

const PRESETS_BY_CATEGORY: Record<ExpenseCategory, string[]> = {
  'Power & Generator Fuel': [
    '100 Litres Diesel for Standby Generator',
    '50 Litres Diesel Top-up for Generator',
    'Generator Routine Engine Oil (15W-40) & Filter Service',
    '25 Litres Petrol for Auxiliary Supply'
  ],
  'Cooking Gas (LPG)': [
    'Refill 2x 50kg LPG Cooking Gas Cylinders',
    'Refill 1x 25kg Auxiliary Cooking Gas Cylinder',
    'Commercial Gas Hose & High-Pressure Regulator Valve'
  ],
  'Kitchen Petty & Sundry': [
    'Emergency Fresh Mint, Ginger, Lemons & Lime Restock',
    '5 Blocks of Ice for Cold Beverage Bar',
    'Emergency Seasoning, Curry, Thyme & Stock Cubes',
    'Fresh Scotch Bonnet Peppers & Onions Runners Market'
  ],
  'Equipment Repairs & Maintenance': [
    'Deep Freezer Compressor Servicing & R134a Gas Top-up',
    'Under-counter Chiller Thermostat & Door Seal Repair',
    'Commercial 4-Burner Gas Cooker Descaling & Servicing',
    'Exhaust Canopy Extractor Motor Servicing & Filter Wash'
  ],
  'Packaging & Consumables': [
    '5 Packs Biodegradable Takeaway Containers & Lids',
    '10 Packs Branded Kraft Paper Carrier Bags',
    'Serviettes, Paper Towels, Toothpicks & Straws Restock',
    'Foil Paper, Cling Wrap & Greaseproof Lining Sheets'
  ],
  'Staff Welfare & Casuals': [
    'Night Shift Crew Closing Taxi / Transport Allowance',
    'Offloader Porters Daily Wage (Lorry Offloading)',
    'Casual Kitchen Dishwasher Daily Wage',
    'First Aid Box Restock (Bandages, Paracetamol, Burn Ointment)'
  ],
  'Cleaning & Sanitation': [
    'Heavy-Duty Kitchen Floor Degreaser & Drain Cleaner',
    'Commercial Dishwashing Detergent & Sanichlor Bleach',
    'Heavy-Duty Scrubbing Pads, Wire Sponges & Mops',
    'Monthly Pest Control & Fumigation Service'
  ],
  'Utilities & Electricity': [
    'Prepaid Commercial Electricity Token (PHCN / NEPA)',
    '10,000 Litres Clean Water Tanker Delivery',
    'Municipal Refuse & Waste Evacuation Monthly Fee'
  ],
  'Administrative & POS Sundry': [
    '10 Rolls 80mm Thermal Receipt Paper for POS',
    'Monthly Wi-Fi Router Data Subscription (Unlimited)',
    'Kitchen Order Pads, Ballpoint Pens & Accounting Ledger'
  ],
  'Other Operational Expenses': [
    'POS Terminal Monthly Bank Maintenance Fee',
    'Government Sanitation / Environmental Compliance Levy',
    'Emergency Incident Miscellaneous Sundry'
  ]
};

// Convert number to words for official Payment Voucher
function numberToWords(num: number): string {
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

function loadExpensesFromStorage(): ExpenseRecord[] {
  try {
    const saved = 
      localStorage.getItem(EXPENSES_STORAGE_KEY) || 
      sessionStorage.getItem(EXPENSES_STORAGE_KEY) ||
      localStorage.getItem('fulbe_restaurant_expenses') || 
      sessionStorage.getItem('fulbe_restaurant_expenses');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load expenses from storage', e);
  }
  return INITIAL_EXPENSES;
}

function loadPettyCashFromStorage(): number {
  try {
    const saved = 
      localStorage.getItem(PETTY_CASH_STORAGE_KEY) || 
      sessionStorage.getItem(PETTY_CASH_STORAGE_KEY) ||
      localStorage.getItem('fulbe_restaurant_petty_cash') || 
      sessionStorage.getItem('fulbe_restaurant_petty_cash');
    if (saved !== null) {
      const parsed = parseFloat(saved);
      if (!isNaN(parsed)) return parsed;
    }
  } catch (e) {
    console.error('Failed to load petty cash from storage', e);
  }
  return INITIAL_PETTY_CASH_BALANCE;
}

function persistExpenses(expenses: ExpenseRecord[]) {
  try {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  } catch (e) {}
  try {
    sessionStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  } catch (e) {}
}

function persistPettyCash(balance: number) {
  try {
    localStorage.setItem(PETTY_CASH_STORAGE_KEY, balance.toString());
  } catch (e) {}
  try {
    sessionStorage.setItem(PETTY_CASH_STORAGE_KEY, balance.toString());
  } catch (e) {}
}

// Print Official Expense Payment Voucher (PV)
function printExpenseVoucher(expense: ExpenseRecord) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to print the official Expense Payment Voucher.');
    return;
  }

  const amountInWords = numberToWords(expense.amount);

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Payment Voucher - ${expense.id}</title>
        <meta charset="utf-8" />
        <style>
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
            color: #1a1a1a;
            line-height: 1.4;
            margin: 0;
            padding: 24px;
            background: #fff;
          }
          .voucher-box {
            max-width: 800px;
            margin: 0 auto;
            border: 2px solid #0b1221;
            padding: 28px;
            border-radius: 6px;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2px solid #0b1221;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .brand h1 {
            font-size: 20px;
            font-weight: 900;
            color: #0b1221;
            margin: 0;
            text-transform: uppercase;
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
          .pv-badge-area {
            text-align: right;
          }
          .pv-badge {
            background: #0b1221;
            color: #fff;
            padding: 4px 12px;
            font-size: 11px;
            font-weight: 800;
            border-radius: 4px;
            text-transform: uppercase;
            letter-spacing: 1px;
            display: inline-block;
          }
          .pv-id {
            font-size: 24px;
            font-weight: 900;
            font-family: monospace;
            color: #991b1b;
            margin-top: 6px;
          }
          .pv-date {
            font-size: 11px;
            color: #555;
            margin-top: 4px;
          }
          .meta-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 20px;
          }
          .meta-card {
            background: #faf9f5;
            border: 1px solid #e5e2da;
            padding: 12px 14px;
            border-radius: 6px;
            font-size: 12px;
          }
          .meta-title {
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            color: #8c8984;
            border-bottom: 1px solid #e5e2da;
            padding-bottom: 4px;
            margin-bottom: 8px;
          }
          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          .table th {
            background: #0b1221;
            color: #fff;
            font-size: 11px;
            text-transform: uppercase;
            padding: 9px 12px;
            text-align: left;
          }
          .table th.right, .table td.right { text-align: right; }
          .table td {
            padding: 12px;
            border-bottom: 1px solid #e5e2da;
            font-size: 12px;
          }
          .amount-highlight {
            background: #faf9f5;
            border: 1px solid #e5e2da;
            padding: 16px;
            border-radius: 6px;
            margin-bottom: 24px;
          }
          .amount-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
          }
          .words {
            font-size: 12px;
            font-style: italic;
            color: #1a1a1a;
            margin-top: 6px;
            border-top: 1px dashed #d1d5db;
            padding-top: 6px;
          }
          .signatures {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr 1fr;
            gap: 14px;
            margin-top: 40px;
            padding-top: 16px;
            border-top: 1px dashed #d1d5db;
          }
          .sig-box {
            text-align: center;
          }
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
          .no-print {
            text-align: center;
            margin-bottom: 20px;
          }
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
            .voucher-box { border: 1px solid #1a1a1a !important; padding: 18px !important; }
          }
        </style>
      </head>
      <body>
        <div class="no-print">
          <button class="btn-print" onclick="window.print()">🖨️ Print Official Payment Voucher</button>
        </div>

        <div class="voucher-box">
          <div class="header">
            <div class="brand">
              <h1>Restaurant Management System</h1>
              <div class="sub">Official Expense Payment Voucher (PV)</div>
              <div class="address">
                Opp. Mareri Juma'at Mosque Lalan Zaria Road, S/fulani Park Box 767, Gusau, Zamfara State.<br/>
                TEL: +234 803 000 0000 • Email: accounts@restaurant-management.ng
              </div>
            </div>
            <div class="pv-badge-area">
              <div class="pv-badge">Payment Voucher</div>
              <div class="pv-id">${expense.id}</div>
              <div class="pv-date">
                <strong>Date:</strong> ${expense.date} (${expense.time})<br/>
                <strong>Status:</strong> ${expense.status.toUpperCase()}
              </div>
            </div>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <div class="meta-title">Beneficiary & Category</div>
              <div><strong>Paid To (Payee):</strong> ${expense.paidTo}</div>
              <div><strong>Classification:</strong> ${expense.category}</div>
              <div><strong>Receipt / Ref:</strong> ${expense.receiptRef || 'Internal Voucher'}</div>
            </div>
            <div class="meta-card">
              <div class="meta-title">Disbursement & Authorization</div>
              <div><strong>Payment Mode:</strong> ${expense.paymentMethod}</div>
              <div><strong>Recorded By:</strong> ${expense.recordedBy}</div>
              <div><strong>Approval:</strong> General Manager Authorized</div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th style="width: 40px;">#</th>
                <th>Particulars / Purpose of Expenditure</th>
                <th>Category</th>
                <th class="right" style="width: 140px;">Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>1</td>
                <td>
                  <strong>${expense.title}</strong>
                  ${expense.notes ? `<div style="font-size: 11px; color: #555; margin-top: 2px;">Note: ${expense.notes}</div>` : ''}
                </td>
                <td>${expense.category}</td>
                <td class="right" style="font-family: monospace; font-weight: 800; font-size: 14px; color: #991b1b;">
                  ${formatNaira(expense.amount)}
                </td>
              </tr>
            </tbody>
          </table>

          <div class="amount-highlight">
            <div class="amount-row">
              <span style="font-weight: 700; text-transform: uppercase; font-size: 12px;">Total Sum Paid:</span>
              <span style="font-family: monospace; font-size: 18px; font-weight: 900; color: #024628;">${formatNaira(expense.amount)}</span>
            </div>
            <div class="words">
              <strong>Amount in Words:</strong> ${amountInWords}
            </div>
          </div>

          <div class="signatures">
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-label">Prepared By (Staff)</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-label">Verified By (Auditor)</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-label">Approved By (GM)</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <div class="sig-label">Received By (Payee)</div>
            </div>
          </div>

          <div class="footer-note">
            Original voucher filed in restaurant accounting audit records; duplicate retained by cashier.
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

export const ExpensesModule: React.FC = () => {
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(loadExpensesFromStorage);
  const [pettyCashBalance, setPettyCashBalance] = useState<number>(loadPettyCashFromStorage);
  const [periodFilter, setPeriodFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [isFloatModalOpen, setIsFloatModalOpen] = useState(false);

  // Form State: New Expense
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Power & Generator Fuel');
  const [amount, setAmount] = useState<number>(10000);
  const [paymentMethod, setPaymentMethod] = useState<ExpensePaymentMethod>('Cash (Petty Cash)');
  const [paidTo, setPaidTo] = useState('');
  const [receiptRef, setReceiptRef] = useState('');
  const [notes, setNotes] = useState('');

  // Form State: Top Up Float
  const [topUpAmount, setTopUpAmount] = useState<number>(50000);
  const [topUpNotes, setTopUpNotes] = useState('Petty cash float replenishment');

  useEffect(() => {
    persistExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    persistPettyCash(pettyCashBalance);
  }, [pettyCashBalance]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Helper date checking
  const todayStr = new Date().toISOString().split('T')[0];

  // Filtering
  const filteredExpenses = expenses.filter(exp => {
    // Period filter
    if (periodFilter === 'today' && exp.date !== todayStr) return false;
    if (periodFilter === 'week') {
      const expDate = new Date(exp.date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      if (expDate < weekAgo) return false;
    }
    if (periodFilter === 'month') {
      const expMonth = exp.date.substring(0, 7);
      const currentMonth = todayStr.substring(0, 7);
      if (expMonth !== currentMonth) return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && exp.category !== categoryFilter) return false;

    // Payment method filter
    if (paymentMethodFilter !== 'all' && exp.paymentMethod !== paymentMethodFilter) return false;

    // Status filter
    if (statusFilter !== 'all' && exp.status !== statusFilter) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = 
        exp.id.toLowerCase().includes(q) ||
        exp.title.toLowerCase().includes(q) ||
        exp.paidTo.toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q) ||
        (exp.receiptRef && exp.receiptRef.toLowerCase().includes(q)) ||
        (exp.notes && exp.notes.toLowerCase().includes(q));
      if (!match) return false;
    }

    return true;
  });

  // KPI Calculations
  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);

  // Generator Diesel & Gas spend
  const fuelAndGasTotal = filteredExpenses
    .filter(e => e.category === 'Power & Generator Fuel' || e.category === 'Cooking Gas (LPG)')
    .reduce((sum, e) => sum + e.amount, 0);

  // Pending approval items
  const pendingApprovals = expenses.filter(e => e.status === 'Pending Approval');
  const pendingCount = pendingApprovals.length;
  const pendingTotal = pendingApprovals.reduce((sum, e) => sum + e.amount, 0);

  // Open Record Expense Modal with preset
  const handleOpenRecordModal = (cat?: ExpenseCategory) => {
    const selectedCat = cat || 'Power & Generator Fuel';
    setCategory(selectedCat);
    const presets = PRESETS_BY_CATEGORY[selectedCat];
    setTitle(presets && presets.length > 0 ? presets[0] : '');
    setAmount(selectedCat === 'Power & Generator Fuel' ? 135000 : 15000);
    setPaymentMethod(selectedCat === 'Power & Generator Fuel' ? 'Bank Transfer' : 'Cash (Petty Cash)');
    setPaidTo(selectedCat === 'Power & Generator Fuel' ? 'TotalEnergies Station' : 'Market Vendor');
    setReceiptRef('');
    setNotes('');
    setIsRecordModalOpen(true);
  };

  // Save Expense
  const handleSaveExpense = (e?: React.FormEvent, andPrint = false) => {
    if (e) e.preventDefault();
    if (!title.trim() || amount <= 0 || !paidTo.trim()) {
      alert('Please fill in title, beneficiary, and a valid amount.');
      return;
    }

    // Check Petty Cash
    if (paymentMethod === 'Cash (Petty Cash)' && amount > pettyCashBalance) {
      const proceed = confirm(`Warning: Expense amount (${formatNaira(amount)}) exceeds current Petty Cash float (${formatNaira(pettyCashBalance)}). Do you want to record it anyway and take the float negative?`);
      if (!proceed) return;
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().substring(0, 5);
    const newId = `EXP-2026-${String(expenses.length + 1).padStart(3, '0')}`;

    const newExpense: ExpenseRecord = {
      id: newId,
      date: dateStr,
      time: timeStr,
      category: category,
      title: title.trim(),
      amount: Number(amount),
      paymentMethod: paymentMethod,
      paidTo: paidTo.trim(),
      recordedBy: 'Prototype Cashier',
      receiptRef: receiptRef.trim() || undefined,
      status: amount > 25000 && paymentMethod === 'Cash (Petty Cash)' ? 'Pending Approval' : 'Approved',
      notes: notes.trim() || undefined
    };

    setExpenses(prev => [newExpense, ...prev]);

    // If paid via Petty Cash, deduct
    if (paymentMethod === 'Cash (Petty Cash)') {
      setPettyCashBalance(prev => Math.max(-50000, prev - Number(amount)));
    }

    showToast(`Expense ${newId} recorded (${formatNaira(amount)})!`);
    setIsRecordModalOpen(false);

    if (andPrint) {
      setTimeout(() => {
        printExpenseVoucher(newExpense);
      }, 200);
    }
  };

  // Top Up Petty Cash Float
  const handleTopUpFloat = (e: React.FormEvent) => {
    e.preventDefault();
    if (topUpAmount <= 0) return;

    setPettyCashBalance(prev => prev + Number(topUpAmount));
    showToast(`Petty cash float topped up by ${formatNaira(topUpAmount)}! Current balance: ${formatNaira(pettyCashBalance + Number(topUpAmount))}`);
    setIsFloatModalOpen(false);
    setTopUpAmount(50000);
  };

  // Approve / Reject
  const handleUpdateStatus = (id: string, newStatus: 'Approved' | 'Rejected') => {
    setExpenses(prev => prev.map(exp => exp.id === id ? { ...exp, status: newStatus } : exp));
    showToast(`Expense ${id} marked as ${newStatus}!`);
  };

  // Batch Approve All
  const handleApproveAllPending = () => {
    if (pendingCount === 0) return;
    setExpenses(prev => prev.map(exp => exp.status === 'Pending Approval' ? { ...exp, status: 'Approved' } : exp));
    showToast(`Approved all ${pendingCount} pending expenses!`);
  };

  // Delete Expense
  const handleDeleteExpense = (id: string) => {
    if (confirm(`Are you sure you want to delete expense record ${id}?`)) {
      setExpenses(prev => prev.filter(e => e.id !== id));
      showToast(`Expense record ${id} removed.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-[#0b1221] text-white px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-lg border border-[#f59e0b]/40 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#f59e0b]" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-white/70 hover:text-white ml-4 text-sm font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 border border-[#E5E2DA] rounded-xl shadow-xs">
        <div>
          <h2 className="font-serif font-bold text-2xl text-[#1A1A1A] flex items-center gap-2.5">
            <Receipt className="w-6 h-6 text-[#C8B282]" />
            <span>Expenses & Petty Cash</span>
          </h2>
          <p className="text-xs text-[#73706B] mt-1">
            Track daily operational overheads, diesel and cooking gas expenditure, petty cash drawer float, and official payment vouchers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Top-up Petty Cash Button */}
          <button
            onClick={() => setIsFloatModalOpen(true)}
            className="px-4 py-2.5 bg-[#FAF9F5] hover:bg-[#E5E2DA] border border-[#d1d5db] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg transition-all cursor-pointer shadow-2xs"
          >
            <Coins className="w-4 h-4 text-[#024628]" />
            <span>+ Top-Up Petty Cash</span>
          </button>

          {/* Record New Expense Button */}
          <button
            onClick={() => handleOpenRecordModal()}
            className="px-4 py-2.5 bg-[#024628] hover:bg-[#03331d] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#C8B282]" />
            <span>+ Record Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expenses */}
        <div className="bg-white p-5 border border-[#E5E2DA] rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center shrink-0 border border-rose-100">
            <TrendingDown className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-wider block">Total Expenses</span>
            <span className="text-2xl font-bold font-serif text-[#1A1A1A] block mt-0.5">{formatNaira(totalExpenses)}</span>
            <span className="text-[11px] text-[#73706B]">{filteredExpenses.length} disbursements logged</span>
          </div>
        </div>

        {/* Generator & Cooking Gas */}
        <div 
          onClick={() => setCategoryFilter('Power & Generator Fuel')}
          className="bg-white p-5 border border-[#E5E2DA] rounded-xl shadow-xs flex items-center gap-4 cursor-pointer hover:border-amber-300 transition-all"
        >
          <div className="w-12 h-12 bg-amber-50 text-[#b45309] rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <Fuel className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-wider block">Power & Gas Fuel</span>
            <span className="text-2xl font-bold font-serif text-[#b45309] block mt-0.5">{formatNaira(fuelAndGasTotal)}</span>
            <span className="text-[11px] text-[#73706B]">Diesel + LPG cylinder refilling</span>
          </div>
        </div>

        {/* Petty Cash Float Balance */}
        <div 
          onClick={() => setIsFloatModalOpen(true)}
          className={`p-5 border rounded-xl shadow-xs flex items-center gap-4 cursor-pointer transition-all ${
            pettyCashBalance < 15000 ? 'bg-amber-50/50 border-amber-200 hover:border-amber-400' : 'bg-white border-[#E5E2DA] hover:border-emerald-300'
          }`}
        >
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
            <Wallet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Petty Cash Float</span>
              <span className="bg-emerald-100 text-emerald-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded">In Drawer</span>
            </div>
            <span className="text-2xl font-bold font-serif text-emerald-700 block mt-0.5">{formatNaira(pettyCashBalance)}</span>
            <span className="text-[11px] text-[#73706B]">Click to top-up float</span>
          </div>
        </div>

        {/* Approvals Queue */}
        <div 
          onClick={() => setStatusFilter(pendingCount > 0 ? 'Pending Approval' : 'all')}
          className={`p-5 border rounded-xl shadow-xs flex items-center gap-4 cursor-pointer transition-all ${
            pendingCount > 0 ? 'bg-amber-50/70 border-amber-300 hover:border-amber-400' : 'bg-white border-[#E5E2DA]'
          }`}
        >
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
            pendingCount > 0 ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-blue-50 text-blue-600 border-blue-100'
          }`}>
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-wider block">Pending Approvals</span>
              {pendingCount > 0 && (
                <span className="bg-amber-200 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {pendingCount} new
                </span>
              )}
            </div>
            <span className="text-2xl font-bold font-serif text-[#1A1A1A] block mt-0.5">
              {pendingCount > 0 ? formatNaira(pendingTotal) : 'All Approved'}
            </span>
            <span className="text-[11px] text-[#73706B]">
              {pendingCount > 0 ? `${pendingCount} claims await sign-off` : 'Zero unapproved claims'}
            </span>
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
              All Time
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

            {pendingCount > 0 && (
              <button
                onClick={handleApproveAllPending}
                className="ml-2 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-2xs"
                title="Approve all pending expense claims at once"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Approve All ({pendingCount})</span>
              </button>
            )}
          </div>

          {/* Secondary Filters & Search */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[#E5E2DA] rounded-lg text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
            >
              <option value="all">All Categories</option>
              {EXPENSE_CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Payment Method Dropdown */}
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[#E5E2DA] rounded-lg text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
            >
              <option value="all">All Payment Channels</option>
              <option value="Cash (Petty Cash)">💵 Cash (Petty Cash)</option>
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
              <option value="Approved">🟢 Approved</option>
              <option value="Pending Approval">🟡 Pending Approval</option>
              <option value="Rejected">🔴 Rejected</option>
            </select>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8984]" />
              <input
                type="text"
                placeholder="Search EXP, title, vendor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E5E2DA] rounded-lg text-xs font-medium focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1A1A1A] text-[#FDFCF9] font-mono text-[10px] uppercase tracking-wider">
                <th className="p-3.5">Voucher / ID & Date</th>
                <th className="p-3.5">Title & Category</th>
                <th className="p-3.5">Beneficiary / Paid To</th>
                <th className="p-3.5">Payment Method</th>
                <th className="p-3.5 text-right">Amount</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DA]">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-[#FAF9F5] transition-colors">
                  {/* Voucher ID & Date */}
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="font-bold font-mono text-[#1A1A1A] text-sm">
                      {exp.id}
                    </div>
                    <div className="text-[11px] text-[#73706B] flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3 text-[#A3A09A]" />
                      <span>{exp.date}</span>
                      <span className="text-[#A3A09A]">({exp.time})</span>
                    </div>
                  </td>

                  {/* Title & Category */}
                  <td className="p-3.5">
                    <div className="font-bold text-[#1A1A1A] text-xs">
                      {exp.title}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold tracking-wider ${
                        exp.category === 'Power & Generator Fuel'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : exp.category === 'Cooking Gas (LPG)'
                          ? 'bg-orange-100 text-orange-900 border border-orange-200'
                          : exp.category === 'Equipment Repairs & Maintenance'
                          ? 'bg-blue-100 text-blue-900 border border-blue-200'
                          : exp.category === 'Staff Welfare & Casuals'
                          ? 'bg-purple-100 text-purple-900 border border-purple-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {exp.category}
                      </span>
                      {exp.notes && (
                        <span className="text-[10px] text-[#73706B] italic max-w-xs truncate" title={exp.notes}>
                          • {exp.notes}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Beneficiary */}
                  <td className="p-3.5 whitespace-nowrap">
                    <div className="font-bold text-[#1A1A1A] text-xs">
                      {exp.paidTo}
                    </div>
                    <div className="text-[10px] text-[#8C8984]">
                      By: {exp.recordedBy}
                    </div>
                  </td>

                  {/* Payment Method & Ref */}
                  <td className="p-3.5 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      exp.paymentMethod === 'Cash (Petty Cash)'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : exp.paymentMethod === 'Bank Transfer'
                        ? 'bg-blue-50 text-blue-800 border border-blue-200'
                        : 'bg-purple-50 text-purple-800 border border-purple-200'
                    }`}>
                      {exp.paymentMethod === 'Cash (Petty Cash)' ? '💵 Cash Float' : exp.paymentMethod === 'Bank Transfer' ? '🏦 Transfer' : '💳 POS Card'}
                    </span>
                    {exp.receiptRef && (
                      <div className="text-[10px] font-mono text-[#8C8984] mt-0.5">
                        Ref: {exp.receiptRef}
                      </div>
                    )}
                  </td>

                  {/* Amount */}
                  <td className="p-3.5 text-right font-mono font-bold text-[#991b1b] text-sm whitespace-nowrap">
                    {formatNaira(exp.amount)}
                  </td>

                  {/* Status Badge */}
                  <td className="p-3.5 text-center whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      exp.status === 'Approved'
                        ? 'bg-emerald-100 text-emerald-800'
                        : exp.status === 'Pending Approval'
                        ? 'bg-amber-100 text-amber-900'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {exp.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Print Voucher Action */}
                      <button
                        type="button"
                        onClick={() => printExpenseVoucher(exp)}
                        className="p-1.5 text-[#0b1221] hover:bg-[#E5E2DA] hover:text-[#024628] rounded transition-colors cursor-pointer"
                        title="Print Official Payment Voucher (PV)"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {/* Approval toggle if pending */}
                      {exp.status === 'Pending Approval' && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(exp.id, 'Approved')}
                          className="px-2 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          title="Approve this expense"
                        >
                          Approve
                        </button>
                      )}

                      {/* Delete Action */}
                      <button
                        type="button"
                        onClick={() => handleDeleteExpense(exp.id)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                        title="Delete Expense Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredExpenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-[#73706B]">
                    No expense records found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Record Expense */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={(e) => handleSaveExpense(e, false)} className="bg-white max-w-lg w-full p-6 border border-[#1A1A1A] rounded-xl shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A] flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#C8B282]" />
                  <span>Record Operational Expense</span>
                </h3>
                <p className="text-xs text-[#73706B]">Disburse cash or transfer for kitchen and facility operations.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="text-xs font-bold text-[#8C8984] hover:text-[#1A1A1A]"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              {/* Category */}
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Expense Category *</label>
                <select
                  value={category}
                  onChange={(e) => {
                    const newCat = e.target.value as ExpenseCategory;
                    setCategory(newCat);
                    const presets = PRESETS_BY_CATEGORY[newCat];
                    if (presets && presets.length > 0) {
                      setTitle(presets[0]);
                    }
                  }}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded font-semibold text-xs"
                >
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Title / Description */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-[#1A1A1A]">Expense Title / Purpose *</label>
                  <span className="text-[10px] text-[#8C8984]">Pick suggestion or type custom</span>
                </div>
                <input
                  type="text"
                  required
                  list="expense-presets"
                  placeholder="e.g. 100 Litres Diesel for Standby Generator"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-white border border-[#E5E2DA] rounded font-semibold text-xs"
                />
                <datalist id="expense-presets">
                  {(PRESETS_BY_CATEGORY[category] || []).map((preset, idx) => (
                    <option key={idx} value={preset} />
                  ))}
                </datalist>
              </div>

              {/* Amount & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Amount (₦) *</label>
                  <input
                    type="number"
                    min={100}
                    required
                    value={amount || ''}
                    onChange={(e) => setAmount(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-2.5 bg-white border border-[#E5E2DA] rounded font-mono font-bold text-sm text-[#991b1b]"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Payment Method *</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as ExpensePaymentMethod)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded font-semibold text-xs"
                  >
                    <option value="Cash (Petty Cash)">💵 Cash (Petty Cash Float)</option>
                    <option value="Bank Transfer">🏦 Bank Transfer</option>
                    <option value="POS Machine">💳 POS Machine</option>
                  </select>
                </div>
              </div>

              {/* Petty Cash Float Warning / Info */}
              {paymentMethod === 'Cash (Petty Cash)' && (
                <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded text-xs flex justify-between items-center">
                  <span className="text-emerald-900 font-medium">Petty Cash Float Available:</span>
                  <span className="font-mono font-bold text-emerald-800">{formatNaira(pettyCashBalance)}</span>
                </div>
              )}

              {/* Beneficiary & Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Paid To / Beneficiary *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TotalEnergies Station, Danladi Tech..."
                    value={paidTo}
                    onChange={(e) => setPaidTo(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Receipt / Ref No. (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. TE-DSL-9041 or Slip #08"
                    value={receiptRef}
                    onChange={(e) => setReceiptRef(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded text-xs font-mono"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Remarks / Justification (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Weekly restaurant main cold room support"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-[#E5E2DA]">
              {/* Option 1: Record & Print Voucher */}
              <button
                type="button"
                onClick={() => handleSaveExpense(undefined, true)}
                className="flex-1 py-2.5 bg-[#0b1221] hover:bg-[#1a2333] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-xs"
              >
                <Printer className="w-4 h-4 text-[#C8B282]" />
                <span>Record & Print PV</span>
              </button>

              {/* Option 2: Save Only */}
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#024628] hover:bg-[#03331d] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer text-center"
              >
                Record Expense
              </button>

              {/* Option 3: Cancel */}
              <button
                type="button"
                onClick={() => setIsRecordModalOpen(false)}
                className="px-4 py-2.5 bg-[#F5F2ED] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider rounded hover:bg-[#e8e4dc]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Top Up Petty Cash Float */}
      {isFloatModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleTopUpFloat} className="bg-white max-w-md w-full p-6 border border-[#1A1A1A] rounded-xl shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A] flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-[#024628]" />
                  <span>Top-Up Petty Cash Float</span>
                </h3>
                <p className="text-xs text-[#73706B]">Replenish the cashier's physical drawer cash float.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFloatModalOpen(false)}
                className="text-xs font-bold text-[#8C8984] hover:text-[#1A1A1A]"
              >
                ✕ Close
              </button>
            </div>

            <div className="bg-[#FAF9F5] p-3 rounded border border-[#E5E2DA] space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-[#73706B]">Current Drawer Balance:</span>
                <span className="font-mono font-bold text-emerald-800">{formatNaira(pettyCashBalance)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#73706B]">Disbursing Source:</span>
                <span className="font-bold text-[#1A1A1A]">Main Restaurant Operational Account</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Top-Up Amount (₦) *</label>
                <input
                  type="number"
                  min={1000}
                  required
                  value={topUpAmount || ''}
                  onChange={(e) => setTopUpAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2.5 bg-white border border-[#E5E2DA] rounded font-mono font-bold text-sm text-[#024628]"
                />
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex gap-2">
                {[20000, 50000, 100000].map(val => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTopUpAmount(val)}
                    className="flex-1 py-1 bg-[#FAF9F5] border border-[#E5E2DA] hover:border-[#1A1A1A] rounded text-[11px] font-mono font-semibold"
                  >
                    +{formatNaira(val)}
                  </button>
                ))}
              </div>

              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Authorization Note</label>
                <input
                  type="text"
                  value={topUpNotes}
                  onChange={(e) => setTopUpNotes(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded text-xs"
                />
              </div>

              <div className="bg-blue-50 p-2.5 rounded text-[11px] text-blue-900">
                New drawer float balance after top-up: <strong>{formatNaira(pettyCashBalance + (topUpAmount || 0))}</strong>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[#E5E2DA]">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#024628] hover:bg-[#03331d] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Confirm Float Top-Up
              </button>
              <button
                type="button"
                onClick={() => setIsFloatModalOpen(false)}
                className="px-4 py-2.5 bg-[#F5F2ED] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
