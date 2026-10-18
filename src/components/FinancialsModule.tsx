import React, { useState, useMemo } from 'react';
import type { RestaurantOrder, ExpenseRecord, PurchaseOrder, UserRole, ExpenseCategory } from '../types';
import { INITIAL_EXPENSES, INITIAL_PURCHASE_ORDERS, INITIAL_PETTY_CASH_BALANCE, INITIAL_RESTAURANT_ORDERS } from '../data/restaurantData';
import { formatNaira, formatDateFormatted } from '../utils/formatters';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  Receipt, 
  Calendar, 
  Printer, 
  Download, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  CreditCard, 
  Banknote, 
  Landmark, 
  RefreshCw, 
  Search, 
  ChevronRight, 
  Eye, 
  X, 
  FileSpreadsheet, 
  Building2, 
  Flame, 
  Fuel, 
  Layers, 
  HelpCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Percent
} from 'lucide-react';

interface FinancialsModuleProps {
  orders?: RestaurantOrder[];
  cashierName?: string;
  userRole?: UserRole;
}

type FinancialTab = 'pnl' | 'reconciliation' | 'cost_centers' | 'cash_flow';
type DatePreset = 'today' | 'yesterday' | 'this_week' | 'this_month' | 'last_month' | 'qtd' | 'all' | 'custom';

export const FinancialsModule: React.FC<FinancialsModuleProps> = ({
  orders: propOrders,
  cashierName = 'Duty Auditor',
  userRole = 'super_admin'
}) => {
  // Active internal subtab
  const [activeTab, setActiveTab] = useState<FinancialTab>('pnl');

  // Date Filter State
  const [datePreset, setDatePreset] = useState<DatePreset>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('2026-08-01');
  const [customEndDate, setCustomEndDate] = useState<string>('2026-08-31');

  // Drill-down Modal State
  const [drillDownModal, setDrillDownModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    items: Array<{
      id: string;
      date: string;
      title: string;
      category?: string;
      ref?: string;
      amount: number;
      type: 'credit' | 'debit';
      recordedBy?: string;
    }>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    items: []
  });

  // Print Statement Modal / View
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Cash Drawer Reconciliation State
  const [physicalCashCount, setPhysicalCashCount] = useState<string>('');
  const [cashVarianceNote, setCashVarianceNote] = useState<string>('');
  const [savedReconciliations, setSavedReconciliations] = useState<Array<{
    id: string;
    date: string;
    systemCash: number;
    countedCash: number;
    variance: number;
    auditor: string;
    note: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('fulbe_reconciliation_records');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'REC-2026-01',
        date: '2026-08-17',
        systemCash: 68500,
        countedCash: 68500,
        variance: 0,
        auditor: 'Internal Auditor Sanusi',
        note: 'Evening drawer audit balanced with zero discrepancy.'
      }
    ];
  });

  // Load persistent data
  const orders: RestaurantOrder[] = propOrders && propOrders.length > 0 
    ? propOrders 
    : (() => {
        try {
          const saved = localStorage.getItem('fulbe_restaurant_orders');
          if (saved) return JSON.parse(saved);
        } catch (e) {}
        return INITIAL_RESTAURANT_ORDERS;
      })();

  const expenses: ExpenseRecord[] = (() => {
    try {
      const saved = localStorage.getItem('fulbe_restaurant_expenses');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_EXPENSES;
  })();

  const purchases: PurchaseOrder[] = (() => {
    try {
      const saved = localStorage.getItem('fulbe_restaurant_purchase_orders');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return INITIAL_PURCHASE_ORDERS;
  })();

  const pettyCashBalance: number = (() => {
    try {
      const saved = localStorage.getItem('fulbe_restaurant_petty_cash');
      if (saved) return Number(saved);
    } catch (e) {}
    return INITIAL_PETTY_CASH_BALANCE;
  })();

  // Filter Helper: parse date into YYYY-MM-DD
  const normalizeDate = (dStr: string | Date | undefined): string => {
    if (!dStr) return '';
    try {
      const d = new Date(dStr);
      if (isNaN(d.getTime())) {
        // match YYYY-MM-DD pattern
        const match = String(dStr).match(/\d{4}-\d{2}-\d{2}/);
        return match ? match[0] : '';
      }
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  // Date Range Bounds based on Preset
  const { startDateStr, endDateStr, dateFilterLabel } = useMemo(() => {
    const today = new Date('2026-08-18'); // Reference prototype date or current date
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    if (datePreset === 'today') {
      return { startDateStr: todayStr, endDateStr: todayStr, dateFilterLabel: `Today (${todayStr})` };
    }
    if (datePreset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      const yStr = y.toISOString().split('T')[0];
      return { startDateStr: yStr, endDateStr: yStr, dateFilterLabel: `Yesterday (${yStr})` };
    }
    if (datePreset === 'this_week') {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      const sStr = start.toISOString().split('T')[0];
      return { startDateStr: sStr, endDateStr: todayStr, dateFilterLabel: `This Week (${sStr} to ${todayStr})` };
    }
    if (datePreset === 'this_month') {
      const sStr = `${yyyy}-${mm}-01`;
      return { startDateStr: sStr, endDateStr: todayStr, dateFilterLabel: `This Month (${yyyy}-${mm})` };
    }
    if (datePreset === 'last_month') {
      const prevM = new Date(yyyy, today.getMonth() - 1, 1);
      const prevMStr = `${prevM.getFullYear()}-${String(prevM.getMonth() + 1).padStart(2, '0')}-01`;
      const prevEnd = new Date(yyyy, today.getMonth(), 0).toISOString().split('T')[0];
      return { startDateStr: prevMStr, endDateStr: prevEnd, dateFilterLabel: `Last Month (${prevMStr.slice(0, 7)})` };
    }
    if (datePreset === 'qtd') {
      const qMonth = Math.floor(today.getMonth() / 3) * 3 + 1;
      const sStr = `${yyyy}-${String(qMonth).padStart(2, '0')}-01`;
      return { startDateStr: sStr, endDateStr: todayStr, dateFilterLabel: `Q-T-D (Since ${sStr})` };
    }
    if (datePreset === 'custom') {
      return { startDateStr: customStartDate, endDateStr: customEndDate, dateFilterLabel: `Custom (${customStartDate} to ${customEndDate})` };
    }
    return { startDateStr: '1970-01-01', endDateStr: '2099-12-31', dateFilterLabel: 'All Recorded Transactions' };
  }, [datePreset, customStartDate, customEndDate]);

  // Filtered Datasets
  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const d = normalizeDate(o.createdAt);
      if (!d) return true;
      return d >= startDateStr && d <= endDateStr;
    });
  }, [orders, startDateStr, endDateStr]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => {
      const d = normalizeDate(e.date);
      if (!d) return true;
      return d >= startDateStr && d <= endDateStr;
    });
  }, [expenses, startDateStr, endDateStr]);

  const filteredPurchases = useMemo(() => {
    return purchases.filter(p => {
      const d = normalizeDate(p.orderDate);
      if (!d) return true;
      return d >= startDateStr && d <= endDateStr;
    });
  }, [purchases, startDateStr, endDateStr]);

  // ==========================================
  // CHIEF ACCOUNTANT: P&L CALCULATIONS (USAR)
  // ==========================================

  // 1. REVENUE BREAKDOWN
  const paidOrders = filteredOrders.filter(o => o.paymentStatus === 'Paid');
  const voidedOrders = filteredOrders.filter(o => o.paymentStatus === 'Voided');

  let foodRevenue = 0;
  let beverageRevenue = 0;
  let snacksRevenue = 0;
  let centralKitchenRevenue = 0;
  let vatTaxCollected = 0;
  let totalServiceCharges = 0;

  paidOrders.forEach(order => {
    vatTaxCollected += order.tax || 0;
    totalServiceCharges += order.serviceCharge || 0;

    order.items.forEach(item => {
      const itemTotal = (item.menuItem.price || 0) * (item.quantity || 1);
      const cat = (item.menuItem.category || '').toUpperCase();
      const estab = item.menuItem.establishment;

      if (estab === 'central_kitchen' || cat.includes('CENTRAL') || cat.includes('GRILL & SUYA') || cat.includes('SOUPS & DELICACIES')) {
        centralKitchenRevenue += itemTotal;
      } else if (cat.includes('DRINK') || cat.includes('BEVERAGE')) {
        beverageRevenue += itemTotal;
      } else if (cat.includes('SNACK') || cat.includes('PASTRY') || cat.includes('BAKERY')) {
        snacksRevenue += itemTotal;
      } else {
        foodRevenue += itemTotal;
      }
    });
  });

  const grossSales = foodRevenue + beverageRevenue + snacksRevenue + centralKitchenRevenue;
  const voidedLosses = voidedOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const netRevenue = grossSales; // Net sales before tax

  // 2. COST OF GOODS SOLD (COGS)
  // Direct purchases received in the period (Meat, Fish, Veggies, Beverages, Rice)
  const receivedPurchases = filteredPurchases.filter(p => p.deliveryStatus === 'Received');
  
  let rawIngredientsCOGS = 0;
  let beveragePurchasesCOGS = 0;
  let packagingCOGS = 0;

  receivedPurchases.forEach(p => {
    const commodity = (p.commodity || '').toLowerCase();
    if (commodity.includes('drink') || commodity.includes('beverage') || commodity.includes('water')) {
      beveragePurchasesCOGS += p.totalAmount;
    } else if (commodity.includes('packaging') || commodity.includes('box') || commodity.includes('poly')) {
      packagingCOGS += p.totalAmount;
    } else {
      rawIngredientsCOGS += p.totalAmount;
    }
  });

  // Direct kitchen market petty items recorded in expenses
  const directKitchenMarketExpenses = filteredExpenses
    .filter(e => e.category === 'Kitchen Petty & Sundry' && e.status === 'Approved')
    .reduce((sum, e) => sum + e.amount, 0);

  const totalCOGS = rawIngredientsCOGS + beveragePurchasesCOGS + packagingCOGS + directKitchenMarketExpenses;
  const cogsPercentage = netRevenue > 0 ? (totalCOGS / netRevenue) * 100 : 0;
  const grossProfit = netRevenue - totalCOGS;
  const grossMarginPercentage = netRevenue > 0 ? (grossProfit / netRevenue) * 100 : 0;

  // 3. OPERATING EXPENSES (OPEX)
  const approvedExpenses = filteredExpenses.filter(e => e.status === 'Approved');

  // Group OPEX by Functional Ledger Buckets
  const opexEnergy = approvedExpenses
    .filter(e => e.category === 'Power & Generator Fuel' || e.category === 'Cooking Gas (LPG)' || e.category === 'Utilities & Electricity')
    .reduce((sum, e) => sum + e.amount, 0);

  const opexMaintenance = approvedExpenses
    .filter(e => e.category === 'Equipment Repairs & Maintenance')
    .reduce((sum, e) => sum + e.amount, 0);

  const opexPackagingAdmin = approvedExpenses
    .filter(e => e.category === 'Packaging & Consumables' || e.category === 'Administrative & POS Sundry')
    .reduce((sum, e) => sum + e.amount, 0);

  const opexStaffSanitation = approvedExpenses
    .filter(e => e.category === 'Staff Welfare & Casuals' || e.category === 'Cleaning & Sanitation')
    .reduce((sum, e) => sum + e.amount, 0);

  const opexOther = approvedExpenses
    .filter(e => e.category === 'Other Operational Expenses')
    .reduce((sum, e) => sum + e.amount, 0);

  // Total OPEX (excluding kitchen petty market run which was recognized above in direct COGS)
  const totalOPEX = opexEnergy + opexMaintenance + opexPackagingAdmin + opexStaffSanitation + opexOther;
  const opexPercentage = netRevenue > 0 ? (totalOPEX / netRevenue) * 100 : 0;

  // 4. OPERATING PROFIT (EBITDA) & NET PROFIT
  const operatingProfitEBITDA = grossProfit - totalOPEX;
  const netMarginPercentage = netRevenue > 0 ? (operatingProfitEBITDA / netRevenue) * 100 : 0;

  // Pending liabilities (expenses awaiting approval + unpaid purchases)
  const pendingExpenseApprovals = filteredExpenses
    .filter(e => e.status === 'Pending Approval')
    .reduce((sum, e) => sum + e.amount, 0);

  const unpaidSupplierBalances = filteredPurchases.reduce((sum, p) => sum + (p.balance || 0), 0);

  // ==========================================
  // FINANCIAL AUDITOR: CHANNEL RECONCILIATION
  // ==========================================
  const posCardSales = paidOrders
    .filter(o => o.paymentMethod === 'POS Machine')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const bankTransferSales = paidOrders
    .filter(o => o.paymentMethod === 'Bank Transfer' || o.paymentMethod === 'Opay' || o.paymentMethod === 'Moniepoint')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  const cashSales = paidOrders
    .filter(o => o.paymentMethod === 'Cash')
    .reduce((sum, o) => sum + (o.grandTotal || 0), 0);

  // Cash Discrepancy Calculation
  const countedNum = physicalCashCount !== '' ? Number(physicalCashCount) : null;
  const cashVariance = countedNum !== null ? countedNum - cashSales : 0;

  const handleSaveReconciliation = () => {
    if (countedNum === null) return;
    const newRecord = {
      id: `REC-${Date.now().toString().slice(-4)}`,
      date: normalizeDate(new Date()) || '2026-08-18',
      systemCash: cashSales,
      countedCash: countedNum,
      variance: cashVariance,
      auditor: cashierName,
      note: cashVarianceNote || (cashVariance === 0 ? 'Exact balance verified.' : 'Discrepancy logged.')
    };
    const updated = [newRecord, ...savedReconciliations];
    setSavedReconciliations(updated);
    try {
      localStorage.setItem('fulbe_reconciliation_records', JSON.stringify(updated));
    } catch (e) {}
    setPhysicalCashCount('');
    setCashVarianceNote('');
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    const rows = [
      ['FULBE RESTAURANT & LOUNGE - EXECUTIVE FINANCIAL STATEMENT (P&L)'],
      ['Reporting Period', dateFilterLabel],
      ['Generated On', new Date().toLocaleString()],
      ['Auditor / Sign-off', cashierName],
      [''],
      ['LINE ITEM / ACCOUNT', 'LEDGER CODE', 'AMOUNT (NGN)', '% OF REVENUE'],
      ['1. REVENUE'],
      ['Food Sales (Main Courses & Specialties)', 'REV-101', foodRevenue, `${((foodRevenue / (netRevenue || 1)) * 100).toFixed(1)}%`],
      ['Beverage & Bar Sales', 'REV-102', beverageRevenue, `${((beverageRevenue / (netRevenue || 1)) * 100).toFixed(1)}%`],
      ['Snacks, Pizza & Bakery', 'REV-103', snacksRevenue, `${((snacksRevenue / (netRevenue || 1)) * 100).toFixed(1)}%`],
      ['Central Kitchen & Off-Site Catering', 'REV-104', centralKitchenRevenue, `${((centralKitchenRevenue / (netRevenue || 1)) * 100).toFixed(1)}%`],
      ['TOTAL NET REVENUE', 'REV-TOTAL', netRevenue, '100.0%'],
      [''],
      ['2. COST OF GOODS SOLD (COGS)'],
      ['Direct Meat, Fish & Raw Ingredients', 'COGS-201', rawIngredientsCOGS, `${((rawIngredientsCOGS / (netRevenue || 1)) * 100).toFixed(1)}%`],
      ['Beverage Inventory Purchases', 'COGS-202', beveragePurchasesCOGS, `${((beveragePurchasesCOGS / (netRevenue || 1)) * 100).toFixed(1)}%`],
      ['Packaging & Consumables', 'COGS-203', packagingCOGS, `${((packagingCOGS / (netRevenue || 1)) * 100).toFixed(1)}%`],
      ['Emergency Kitchen Market Sundries', 'COGS-204', directKitchenMarketExpenses, `${((directKitchenMarketExpenses / (netRevenue || 1)) * 100).toFixed(1)}%`],
      ['TOTAL COGS', 'COGS-TOTAL', totalCOGS, `${cogsPercentage.toFixed(1)}%`],
      ['GROSS PROFIT', 'GP-300', grossProfit, `${grossMarginPercentage.toFixed(1)}%`],
      [''],
      ['3. OPERATING EXPENSES (OPEX)'],
      ['Energy & Fuel (Generator Diesel, LPG Gas)', 'OPEX-401', opexEnergy, `${((opexEnergy / (netRevenue || 1)) * 100).toFixed(1)}%`],
      ['Equipment Servicing & Maintenance', 'OPEX-402', opexMaintenance, `${((opexMaintenance / (netRevenue || 1)) * 100).toFixed(1)}%`],
      ['Takeaway Packaging & POS Thermal Paper', 'OPEX-403', opexPackagingAdmin, `${((opexPackagingAdmin / (netRevenue || 1)) * 100).toFixed(1)}%`],
      ['Staff Logistics, Shift Welfare & Cleaning', 'OPEX-404', opexStaffSanitation, `${((opexStaffSanitation / (netRevenue || 1)) * 100).toFixed(1)}%`],
      ['Other Operational Overhead', 'OPEX-405', opexOther, `${((opexOther / (netRevenue || 1)) * 100).toFixed(1)}%`],
      ['TOTAL OPEX', 'OPEX-TOTAL', totalOPEX, `${opexPercentage.toFixed(1)}%`],
      [''],
      ['4. OPERATING INCOME / NET PROFIT'],
      ['OPERATING PROFIT / EBITDA', 'EBITDA-500', operatingProfitEBITDA, `${netMarginPercentage.toFixed(1)}%`],
      ['7.5% VAT Collected (Fiscal Escrow)', 'TAX-901', vatTaxCollected, 'Segregated Liability']
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Fulbe_Financial_Statement_${startDateStr}_${endDateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 text-[#1A1A1A]">
      {/* TOP HEADER & ACTION RIBBON */}
      <div className="bg-[#1A1A1A] text-white p-6 rounded-xl shadow-lg border border-[#333333] flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-[#C8B282] text-[#1A1A1A]">
              Audit & Accounting Suite
            </span>
            <span className="text-xs text-[#A8A29E] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#C8B282]" /> IFRS / Hospitality USAR Standard
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Building2 className="w-7 h-7 text-[#C8B282]" />
            Financial Management & Profit / Loss (P&L)
          </h1>
          <p className="text-xs text-[#A8A29E] mt-1 max-w-2xl">
            Real-time multi-step Income Statement, Cost of Goods Sold (COGS), daily payment channel balancing, and anti-fraud audit logs.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#262626] border border-[#404040] hover:bg-[#333333] text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            <Printer className="w-4 h-4 text-[#C8B282]" />
            Print Statement
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-[#C8B282] hover:bg-[#B39D6D] text-[#1A1A1A] text-xs font-bold rounded-lg transition-colors shadow-md uppercase tracking-wider"
          >
            <Download className="w-4 h-4 text-[#1A1A1A]" />
            Export CSV
          </button>
        </div>
      </div>

      {/* DATE RANGE FILTER BAR */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E2DA] shadow-sm flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Preset Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-[#73706B] uppercase tracking-wider flex items-center gap-1.5 mr-2">
            <Calendar className="w-4 h-4 text-[#C8B282]" /> Period:
          </span>
          {[
            { id: 'today', label: 'Today' },
            { id: 'yesterday', label: 'Yesterday' },
            { id: 'this_week', label: 'This Week' },
            { id: 'this_month', label: 'This Month' },
            { id: 'last_month', label: 'Last Month' },
            { id: 'qtd', label: 'Q-T-D' },
            { id: 'all', label: 'All Time' },
            { id: 'custom', label: 'Custom Range' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setDatePreset(tab.id as DatePreset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                datePreset === tab.id
                  ? 'bg-[#1A1A1A] text-white shadow-sm'
                  : 'bg-[#F5F4F0] text-[#73706B] hover:bg-[#EAE8E2] hover:text-[#1A1A1A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Custom Date Pickers when active */}
        {datePreset === 'custom' && (
          <div className="flex items-center gap-2 text-xs bg-[#FAF9F5] p-2 rounded-lg border border-[#E5E2DA]">
            <span className="text-[#73706B] font-medium">From:</span>
            <input
              type="date"
              value={customStartDate}
              onChange={e => setCustomStartDate(e.target.value)}
              className="px-2 py-1 bg-white border border-[#D5D2C9] rounded text-xs focus:outline-none focus:border-[#C8B282]"
            />
            <span className="text-[#73706B] font-medium">To:</span>
            <input
              type="date"
              value={customEndDate}
              onChange={e => setCustomEndDate(e.target.value)}
              className="px-2 py-1 bg-white border border-[#D5D2C9] rounded text-xs focus:outline-none focus:border-[#C8B282]"
            />
          </div>
        )}

        {/* Current Active Label */}
        <div className="text-xs font-semibold text-[#73706B] bg-[#F5F4F0] px-3 py-1.5 rounded-md self-start xl:self-auto">
          Scope: <span className="text-[#1A1A1A]">{dateFilterLabel}</span>
        </div>
      </div>

      {/* EXECUTIVE KPI SUMMARY CARDS (5 GOLDEN RATIOS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Net Sales */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E2DA] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#73706B] uppercase tracking-wider">Net Sales Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF7F0] flex items-center justify-center text-[#C8B282]">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1A1A1A] tracking-tight">
            {formatNaira(netRevenue)}
          </div>
          <div className="mt-2 text-[11px] text-[#73706B] flex items-center justify-between">
            <span>{paidOrders.length} Paid Order{paidOrders.length !== 1 ? 's' : ''}</span>
            <span className="font-semibold text-emerald-700">100% Base</span>
          </div>
        </div>

        {/* Card 2: Cost of Goods Sold (COGS) */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E2DA] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#73706B] uppercase tracking-wider">F&B COGS (Food Cost)</span>
            <div className="w-8 h-8 rounded-lg bg-[#FFF5F5] flex items-center justify-center text-rose-600">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1A1A1A] tracking-tight">
            {formatNaira(totalCOGS)}
          </div>
          <div className="mt-2 text-[11px] flex items-center justify-between">
            <span className="text-[#73706B]">Ratio: <strong>{cogsPercentage.toFixed(1)}%</strong></span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
              cogsPercentage <= 34 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {cogsPercentage <= 34 ? 'Healthy Target' : 'Cost Alert'}
            </span>
          </div>
        </div>

        {/* Card 3: Total OPEX */}
        <div className="bg-white p-5 rounded-xl border border-[#E5E2DA] shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#73706B] uppercase tracking-wider">Operating Expenses (OPEX)</span>
            <div className="w-8 h-8 rounded-lg bg-[#FAF5FF] flex items-center justify-center text-purple-600">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-[#1A1A1A] tracking-tight">
            {formatNaira(totalOPEX)}
          </div>
          <div className="mt-2 text-[11px] text-[#73706B] flex items-center justify-between">
            <span>Diesel, Gas, Maint.</span>
            <span className="font-semibold text-purple-700">{opexPercentage.toFixed(1)}% of Sales</span>
          </div>
        </div>

        {/* Card 4: Operating Profit / EBITDA */}
        <div className={`p-5 rounded-xl border shadow-sm relative overflow-hidden ${
          operatingProfitEBITDA >= 0 ? 'bg-[#FAF8F2] border-[#C8B282]/50' : 'bg-rose-50 border-rose-200'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-[#1A1A1A] uppercase tracking-wider">Operating Profit (EBITDA)</span>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              operatingProfitEBITDA >= 0 ? 'bg-[#C8B282] text-[#1A1A1A]' : 'bg-rose-600 text-white'
            }`}>
              {operatingProfitEBITDA >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            </div>
          </div>
          <div className={`text-2xl font-black tracking-tight ${
            operatingProfitEBITDA >= 0 ? 'text-emerald-800' : 'text-rose-700'
          }`}>
            {formatNaira(operatingProfitEBITDA)}
          </div>
          <div className="mt-2 text-[11px] flex items-center justify-between">
            <span className="text-[#555]">Net Margin: <strong>{netMarginPercentage.toFixed(1)}%</strong></span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-white text-[#1A1A1A] shadow-xs">
              {operatingProfitEBITDA >= 0 ? 'Profitable' : 'Deficit'}
            </span>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS: P&L vs. RECONCILIATION vs. COST CENTERS vs. CASH FLOW */}
      <div className="flex border-b border-[#E5E2DA] gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('pnl')}
          className={`pb-3 flex items-center gap-2 transition-all relative ${
            activeTab === 'pnl' 
              ? 'text-[#1A1A1A] border-b-2 border-[#C8B282] font-bold' 
              : 'text-[#73706B] hover:text-[#1A1A1A]'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-[#C8B282]" />
          Income Statement (P&L Ledger)
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`pb-3 flex items-center gap-2 transition-all relative ${
            activeTab === 'reconciliation' 
              ? 'text-[#1A1A1A] border-b-2 border-[#C8B282] font-bold' 
              : 'text-[#73706B] hover:text-[#1A1A1A]'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-[#C8B282]" />
          Auditor & Channel Reconciliation
          {voidedOrders.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-rose-100 text-rose-700 text-[10px] font-bold">
              {voidedOrders.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cost_centers')}
          className={`pb-3 flex items-center gap-2 transition-all relative ${
            activeTab === 'cost_centers' 
              ? 'text-[#1A1A1A] border-b-2 border-[#C8B282] font-bold' 
              : 'text-[#73706B] hover:text-[#1A1A1A]'
          }`}
        >
          <PieChart className="w-4 h-4 text-[#C8B282]" />
          Cost Center & Margin Analytics
        </button>

        <button
          onClick={() => setActiveTab('cash_flow')}
          className={`pb-3 flex items-center gap-2 transition-all relative ${
            activeTab === 'cash_flow' 
              ? 'text-[#1A1A1A] border-b-2 border-[#C8B282] font-bold' 
              : 'text-[#73706B] hover:text-[#1A1A1A]'
          }`}
        >
          <Banknote className="w-4 h-4 text-[#C8B282]" />
          Cash Flow & Working Capital
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: FORMAL INCOME STATEMENT (MULTI-STEP P&L LEDGER)                   */}
      {/* ========================================================================= */}
      {activeTab === 'pnl' && (
        <div className="bg-white rounded-xl border border-[#E5E2DA] shadow-sm overflow-hidden">
          <div className="p-5 border-b border-[#E5E2DA] flex items-center justify-between bg-[#FAF9F5]">
            <div>
              <h2 className="text-base font-bold text-[#1A1A1A]">Official Statement of Profit or Loss</h2>
              <p className="text-xs text-[#73706B]">Standard Uniform System of Accounts for Restaurants (USAR)</p>
            </div>
            <div className="text-xs text-[#73706B]">
              All amounts in Nigerian Naira (<strong className="text-[#1A1A1A]">₦</strong>)
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1A1A1A] text-white uppercase text-[10px] tracking-wider">
                  <th className="py-3 px-4">Line Item / Ledger Account</th>
                  <th className="py-3 px-3">Code</th>
                  <th className="py-3 px-4 text-right">Period Amount</th>
                  <th className="py-3 px-3 text-right">% of Revenue</th>
                  <th className="py-3 px-3 text-center">Audit Drill-down</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DA]">
                {/* 1. REVENUE SECTION */}
                <tr className="bg-[#FAF7F0] font-bold text-[#1A1A1A]">
                  <td colSpan={5} className="py-2.5 px-4 uppercase tracking-wider text-[11px] text-[#8C7642]">
                    1. Revenue & Food Service Sales
                  </td>
                </tr>
                <tr className="hover:bg-[#FDFCF7]">
                  <td className="py-2.5 px-4 font-medium pl-8">Food Menu Sales (Main Courses, Stews & Swallows)</td>
                  <td className="py-2.5 px-3 text-[#73706B]">REV-101</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-[#1A1A1A]">{formatNaira(foodRevenue)}</td>
                  <td className="py-2.5 px-3 text-right text-[#73706B]">{((foodRevenue / (netRevenue || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => setDrillDownModal({
                        isOpen: true,
                        title: 'Food Menu Sales Ledger',
                        description: 'Detailed individual food sales orders in current period.',
                        items: paidOrders.flatMap(o => 
                          o.items
                            .filter(i => !(i.menuItem.category || '').toUpperCase().includes('DRINK') && !(i.menuItem.category || '').toUpperCase().includes('SNACK'))
                            .map((it, idx) => ({
                              id: `${o.id}-${idx}`,
                              date: normalizeDate(o.createdAt),
                              title: `${it.quantity}x ${it.menuItem.name} (${o.tableOrRoom})`,
                              ref: o.id,
                              amount: (it.menuItem.price || 0) * (it.quantity || 1),
                              type: 'credit',
                              recordedBy: o.cashierName
                            }))
                        )
                      })}
                      className="px-2 py-1 text-[10px] bg-[#FAF7F0] hover:bg-[#C8B282] hover:text-white rounded font-semibold text-[#8C7642] transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-[#FDFCF7]">
                  <td className="py-2.5 px-4 font-medium pl-8">Beverage, Cold Drinks & Bar Sales</td>
                  <td className="py-2.5 px-3 text-[#73706B]">REV-102</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-[#1A1A1A]">{formatNaira(beverageRevenue)}</td>
                  <td className="py-2.5 px-3 text-right text-[#73706B]">{((beverageRevenue / (netRevenue || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => setDrillDownModal({
                        isOpen: true,
                        title: 'Beverage & Bar Sales Ledger',
                        description: 'Recorded beverage sales and drinks orders.',
                        items: paidOrders.flatMap(o => 
                          o.items
                            .filter(i => (i.menuItem.category || '').toUpperCase().includes('DRINK'))
                            .map((it, idx) => ({
                              id: `${o.id}-drk-${idx}`,
                              date: normalizeDate(o.createdAt),
                              title: `${it.quantity}x ${it.menuItem.name}`,
                              ref: o.id,
                              amount: (it.menuItem.price || 0) * (it.quantity || 1),
                              type: 'credit',
                              recordedBy: o.cashierName
                            }))
                        )
                      })}
                      className="px-2 py-1 text-[10px] bg-[#FAF7F0] hover:bg-[#C8B282] hover:text-white rounded font-semibold text-[#8C7642] transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-[#FDFCF7]">
                  <td className="py-2.5 px-4 font-medium pl-8">Snacks, Shawarma, Pizza & Pastries</td>
                  <td className="py-2.5 px-3 text-[#73706B]">REV-103</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-[#1A1A1A]">{formatNaira(snacksRevenue)}</td>
                  <td className="py-2.5 px-3 text-right text-[#73706B]">{((snacksRevenue / (netRevenue || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-[10px] text-[#A8A29E]">—</span>
                  </td>
                </tr>
                <tr className="hover:bg-[#FDFCF7]">
                  <td className="py-2.5 px-4 font-medium pl-8">Central Kitchen Special Catering & Bulk Deliveries</td>
                  <td className="py-2.5 px-3 text-[#73706B]">REV-104</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-[#1A1A1A]">{formatNaira(centralKitchenRevenue)}</td>
                  <td className="py-2.5 px-3 text-right text-[#73706B]">{((centralKitchenRevenue / (netRevenue || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-[10px] text-[#A8A29E]">—</span>
                  </td>
                </tr>
                <tr className="bg-[#FAF5EA] font-bold text-[#1A1A1A] border-t border-b border-[#C8B282]/40">
                  <td className="py-3 px-4 pl-4 text-sm">TOTAL NET SALES REVENUE</td>
                  <td className="py-3 px-3 text-[#73706B]">REV-NET</td>
                  <td className="py-3 px-4 text-right text-sm text-[#1A1A1A]">{formatNaira(netRevenue)}</td>
                  <td className="py-3 px-3 text-right text-sm">100.0%</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-[#C8B282] text-white">Base</span>
                  </td>
                </tr>

                {/* 2. COST OF GOODS SOLD (COGS) */}
                <tr className="bg-[#FAF7F0] font-bold text-[#1A1A1A]">
                  <td colSpan={5} className="py-2.5 px-4 uppercase tracking-wider text-[11px] text-[#8C7642]">
                    2. Cost of Goods Sold (COGS / F&B Food Cost)
                  </td>
                </tr>
                <tr className="hover:bg-[#FDFCF7]">
                  <td className="py-2.5 px-4 font-medium pl-8">Fresh Beef, Poultry, Catfish & Produce (Received POs)</td>
                  <td className="py-2.5 px-3 text-[#73706B]">COGS-201</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-rose-700">({formatNaira(rawIngredientsCOGS)})</td>
                  <td className="py-2.5 px-3 text-right text-[#73706B]">{((rawIngredientsCOGS / (netRevenue || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => setDrillDownModal({
                        isOpen: true,
                        title: 'Received Supplier Commodity Purchases',
                        description: 'Itemized meat, fish, grain, and vegetables received from verified vendors.',
                        items: receivedPurchases.map(p => ({
                          id: p.id,
                          date: p.orderDate,
                          title: `${p.commodity} (${p.supplierName})`,
                          ref: p.id,
                          amount: p.totalAmount,
                          type: 'debit',
                          recordedBy: p.paymentMode
                        }))
                      })}
                      className="px-2 py-1 text-[10px] bg-[#FAF7F0] hover:bg-[#C8B282] hover:text-white rounded font-semibold text-[#8C7642] transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-[#FDFCF7]">
                  <td className="py-2.5 px-4 font-medium pl-8">Beverage Inventory Restock (Received POs)</td>
                  <td className="py-2.5 px-3 text-[#73706B]">COGS-202</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-rose-700">({formatNaira(beveragePurchasesCOGS)})</td>
                  <td className="py-2.5 px-3 text-right text-[#73706B]">{((beveragePurchasesCOGS / (netRevenue || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-[10px] text-[#A8A29E]">—</span>
                  </td>
                </tr>
                <tr className="hover:bg-[#FDFCF7]">
                  <td className="py-2.5 px-4 font-medium pl-8">Takeaway Packaging & Disposables tied to Sales</td>
                  <td className="py-2.5 px-3 text-[#73706B]">COGS-203</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-rose-700">({formatNaira(packagingCOGS)})</td>
                  <td className="py-2.5 px-3 text-right text-[#73706B]">{((packagingCOGS / (netRevenue || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-[10px] text-[#A8A29E]">—</span>
                  </td>
                </tr>
                <tr className="hover:bg-[#FDFCF7]">
                  <td className="py-2.5 px-4 font-medium pl-8">Emergency Kitchen Market Sundry (Fresh Garnish, Ice)</td>
                  <td className="py-2.5 px-3 text-[#73706B]">COGS-204</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-rose-700">({formatNaira(directKitchenMarketExpenses)})</td>
                  <td className="py-2.5 px-3 text-right text-[#73706B]">{((directKitchenMarketExpenses / (netRevenue || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-[10px] text-[#A8A29E]">—</span>
                  </td>
                </tr>
                <tr className="bg-rose-50/50 font-bold text-rose-900 border-t border-b border-rose-200">
                  <td className="py-2.5 px-4 pl-4">TOTAL COST OF GOODS SOLD (COGS)</td>
                  <td className="py-2.5 px-3 text-[#73706B]">COGS-TOT</td>
                  <td className="py-2.5 px-4 text-right">({formatNaira(totalCOGS)})</td>
                  <td className="py-2.5 px-3 text-right">{cogsPercentage.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-200 text-rose-800">Direct Cost</span>
                  </td>
                </tr>

                {/* GROSS PROFIT ROW */}
                <tr className="bg-[#FAF7F0] font-black text-[#1A1A1A] border-t-2 border-b-2 border-[#C8B282]">
                  <td className="py-3 px-4 text-sm">GROSS PROFIT (GROSS MARGIN)</td>
                  <td className="py-3 px-3 text-[#73706B]">GP-300</td>
                  <td className="py-3 px-4 text-right text-sm text-emerald-800">{formatNaira(grossProfit)}</td>
                  <td className="py-3 px-3 text-right text-sm font-bold text-emerald-800">{grossMarginPercentage.toFixed(1)}%</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">Target &gt;65%</span>
                  </td>
                </tr>

                {/* 3. OPERATING EXPENSES (OPEX) */}
                <tr className="bg-[#FAF7F0] font-bold text-[#1A1A1A]">
                  <td colSpan={5} className="py-2.5 px-4 uppercase tracking-wider text-[11px] text-[#8C7642]">
                    3. Operating Expenses (OPEX / Overhead)
                  </td>
                </tr>
                <tr className="hover:bg-[#FDFCF7]">
                  <td className="py-2.5 px-4 font-medium pl-8">Power, Generator Diesel & Cooking Gas (LPG)</td>
                  <td className="py-2.5 px-3 text-[#73706B]">OPEX-401</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-rose-700">({formatNaira(opexEnergy)})</td>
                  <td className="py-2.5 px-3 text-right text-[#73706B]">{((opexEnergy / (netRevenue || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => setDrillDownModal({
                        isOpen: true,
                        title: 'Energy, Diesel & Cooking Gas Ledger',
                        description: 'Disbursements for power generation, diesel fuel and LPG gas cylinders.',
                        items: approvedExpenses
                          .filter(e => e.category === 'Power & Generator Fuel' || e.category === 'Cooking Gas (LPG)' || e.category === 'Utilities & Electricity')
                          .map(e => ({
                            id: e.id,
                            date: e.date,
                            title: e.title,
                            ref: e.receiptRef || e.id,
                            amount: e.amount,
                            type: 'debit',
                            recordedBy: e.paidTo
                          }))
                      })}
                      className="px-2 py-1 text-[10px] bg-[#FAF7F0] hover:bg-[#C8B282] hover:text-white rounded font-semibold text-[#8C7642] transition-colors"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
                <tr className="hover:bg-[#FDFCF7]">
                  <td className="py-2.5 px-4 font-medium pl-8">Kitchen Equipment Servicing & Maintenance (Freezers, Burners)</td>
                  <td className="py-2.5 px-3 text-[#73706B]">OPEX-402</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-rose-700">({formatNaira(opexMaintenance)})</td>
                  <td className="py-2.5 px-3 text-right text-[#73706B]">{((opexMaintenance / (netRevenue || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-[10px] text-[#A8A29E]">—</span>
                  </td>
                </tr>
                <tr className="hover:bg-[#FDFCF7]">
                  <td className="py-2.5 px-4 font-medium pl-8">General Consumables, Printing & POS Thermal Paper</td>
                  <td className="py-2.5 px-3 text-[#73706B]">OPEX-403</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-rose-700">({formatNaira(opexPackagingAdmin)})</td>
                  <td className="py-2.5 px-3 text-right text-[#73706B]">{((opexPackagingAdmin / (netRevenue || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-[10px] text-[#A8A29E]">—</span>
                  </td>
                </tr>
                <tr className="hover:bg-[#FDFCF7]">
                  <td className="py-2.5 px-4 font-medium pl-8">Crew Shift Welfare, Transport & Sanitation Chemicals</td>
                  <td className="py-2.5 px-3 text-[#73706B]">OPEX-404</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-rose-700">({formatNaira(opexStaffSanitation)})</td>
                  <td className="py-2.5 px-3 text-right text-[#73706B]">{((opexStaffSanitation / (netRevenue || 1)) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-[10px] text-[#A8A29E]">—</span>
                  </td>
                </tr>
                <tr className="bg-purple-50/50 font-bold text-purple-900 border-t border-b border-purple-200">
                  <td className="py-2.5 px-4 pl-4">TOTAL OPERATING EXPENSES (OPEX)</td>
                  <td className="py-2.5 px-3 text-[#73706B]">OPEX-TOT</td>
                  <td className="py-2.5 px-4 text-right">({formatNaira(totalOPEX)})</td>
                  <td className="py-2.5 px-3 text-right">{opexPercentage.toFixed(1)}%</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-purple-200 text-purple-900">Overhead</span>
                  </td>
                </tr>

                {/* 4. OPERATING INCOME / EBITDA */}
                <tr className="bg-[#1A1A1A] text-white font-bold text-sm">
                  <td className="py-4 px-4 pl-4 text-white">OPERATING PROFIT / (LOSS) — EBITDA</td>
                  <td className="py-4 px-3 text-[#C8B282]">EBITDA</td>
                  <td className={`py-4 px-4 text-right text-base font-black ${
                    operatingProfitEBITDA >= 0 ? 'text-[#C8B282]' : 'text-rose-400'
                  }`}>
                    {formatNaira(operatingProfitEBITDA)}
                  </td>
                  <td className={`py-4 px-3 text-right text-sm font-black ${
                    operatingProfitEBITDA >= 0 ? 'text-[#C8B282]' : 'text-rose-400'
                  }`}>
                    {netMarginPercentage.toFixed(1)}%
                  </td>
                  <td className="py-4 px-3 text-center">
                    <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                      operatingProfitEBITDA >= 0 ? 'bg-[#C8B282] text-[#1A1A1A]' : 'bg-rose-500 text-white'
                    }`}>
                      {operatingProfitEBITDA >= 0 ? 'Net Surplus' : 'Net Deficit'}
                    </span>
                  </td>
                </tr>

                {/* 5. STATUTORY TAX / ESCROW NOTE */}
                <tr className="bg-[#FAF9F5] text-[11px] text-[#73706B]">
                  <td className="py-2.5 px-4 pl-8 italic">
                    Fiscal Note: 7.5% Value Added Tax (VAT) collected from customers is isolated in Tax Escrow Ledger.
                  </td>
                  <td className="py-2.5 px-3">TAX-901</td>
                  <td className="py-2.5 px-4 text-right font-semibold text-[#1A1A1A]">{formatNaira(vatTaxCollected)}</td>
                  <td colSpan={2} className="py-2.5 px-3 text-right italic text-[#8C7642]">
                    Held as Tax Liability (Not recognized as Restaurant Income)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: AUDITOR & CHANNEL RECONCILIATION                                  */}
      {/* ========================================================================= */}
      {activeTab === 'reconciliation' && (
        <div className="space-y-6">
          {/* Channel Balancing Grid */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E2DA] shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-[#C8B282]" />
                  Daily Payment Channel Balancing Matrix
                </h3>
                <p className="text-xs text-[#73706B]">
                  Compare system-recorded transactions against physical cash in drawer, POS machine receipts, and bank transfer alerts.
                </p>
              </div>
              <span className="px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider bg-[#F5F4F0] text-[#1A1A1A]">
                Audit Mode
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {/* POS Machine Channel */}
              <div className="p-4 rounded-xl border border-[#E5E2DA] bg-[#FAF9F5]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#73706B] uppercase flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-[#C8B282]" /> POS Machine (Card)
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700">Bank Auto-Credit</span>
                </div>
                <div className="text-xl font-black text-[#1A1A1A]">{formatNaira(posCardSales)}</div>
                <div className="text-[11px] text-[#73706B] mt-1">
                  Match with daily POS merchant end-of-day settlement slip.
                </div>
              </div>

              {/* Bank Transfer Channel */}
              <div className="p-4 rounded-xl border border-[#E5E2DA] bg-[#FAF9F5]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#73706B] uppercase flex items-center gap-1.5">
                    <Landmark className="w-4 h-4 text-[#C8B282]" /> Direct Bank Transfers
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700">Statement Match</span>
                </div>
                <div className="text-xl font-black text-[#1A1A1A]">{formatNaira(bankTransferSales)}</div>
                <div className="text-[11px] text-[#73706B] mt-1">
                  Match against authorized corporate bank account alert history.
                </div>
              </div>

              {/* Physical Cash Channel */}
              <div className="p-4 rounded-xl border border-[#E5E2DA] bg-[#FAF9F5]">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-[#73706B] uppercase flex items-center gap-1.5">
                    <Banknote className="w-4 h-4 text-emerald-600" /> Physical Cash in Drawer
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700">Physical Audit</span>
                </div>
                <div className="text-xl font-black text-emerald-800">{formatNaira(cashSales)}</div>
                <div className="text-[11px] text-[#73706B] mt-1">
                  Expected cash notes and currency in register till.
                </div>
              </div>
            </div>

            {/* Cash Drawer Variance Calculator */}
            <div className="p-5 rounded-xl border border-[#C8B282]/40 bg-[#FAF7F0]">
              <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-2 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#C8B282]" />
                Perform Physical Cash Count Verification
              </h4>
              <p className="text-xs text-[#73706B] mb-4">
                Enter the physical cash bills counted inside the cashier cash drawer at shift close.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
                <div>
                  <label className="block text-[11px] font-bold text-[#73706B] uppercase mb-1">
                    System Expected Cash
                  </label>
                  <div className="px-3 py-2 bg-white border border-[#D5D2C9] rounded-lg text-sm font-bold text-[#1A1A1A]">
                    {formatNaira(cashSales)}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#73706B] uppercase mb-1">
                    Actual Counted Cash (₦)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 68500"
                    value={physicalCashCount}
                    onChange={e => setPhysicalCashCount(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-[#D5D2C9] rounded-lg text-sm font-bold text-[#1A1A1A] focus:outline-none focus:border-[#C8B282]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-[#73706B] uppercase mb-1">
                    Calculated Variance / Status
                  </label>
                  <div className={`px-3 py-2 rounded-lg text-xs font-black flex items-center justify-between border ${
                    countedNum === null
                      ? 'bg-gray-100 text-[#73706B] border-gray-200'
                      : cashVariance === 0
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : cashVariance > 0
                      ? 'bg-blue-100 text-blue-800 border-blue-300'
                      : 'bg-rose-100 text-rose-800 border-rose-300'
                  }`}>
                    <span>
                      {countedNum === null 
                        ? 'Awaiting Cash Count' 
                        : cashVariance === 0 
                        ? 'Exact Match (Balanced)' 
                        : cashVariance > 0 
                        ? `Cash Surplus (+${formatNaira(cashVariance)})` 
                        : `Cash Shortage (${formatNaira(cashVariance)})`}
                    </span>
                    {countedNum !== null && (
                      cashVariance === 0 
                        ? <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        : <AlertTriangle className="w-4 h-4 text-rose-600" />
                    )}
                  </div>
                </div>
              </div>

              {countedNum !== null && (
                <div className="mt-4 pt-4 border-t border-[#C8B282]/30 flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <input
                    type="text"
                    placeholder="Enter reconciliation notes or shift handover remark..."
                    value={cashVarianceNote}
                    onChange={e => setCashVarianceNote(e.target.value)}
                    className="w-full sm:flex-1 px-3 py-1.5 bg-white border border-[#D5D2C9] rounded-lg text-xs focus:outline-none focus:border-[#C8B282]"
                  />
                  <button
                    onClick={handleSaveReconciliation}
                    className="px-4 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-xs font-bold rounded-lg transition-colors whitespace-nowrap shadow-sm uppercase tracking-wider"
                  >
                    Commit Daily Balancing Record
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Forensic Audit: Voided & Cancelled Orders Log */}
          <div className="bg-white rounded-xl border border-[#E5E2DA] shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#E5E2DA] flex items-center justify-between bg-[#FAF9F5]">
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  Forensic Void & Post-Kitchen Cancellation Log
                </h3>
                <p className="text-xs text-[#73706B]">
                  Audits all kitchen orders cancelled or voided. Critical internal control against unrecorded food theft.
                </p>
              </div>
              <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-rose-100 text-rose-800">
                {voidedOrders.length} Flagged Voids ({formatNaira(voidedLosses)})
              </span>
            </div>

            {voidedOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#73706B]">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                <p className="font-bold text-[#1A1A1A]">Zero Order Voids in Current Scope</p>
                <p className="text-[11px] text-[#A8A29E] mt-0.5">No revenue leakage or cancelled kitchen tickets detected.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs divide-y divide-[#E5E2DA]">
                  <thead className="bg-[#FAF7F0] text-[10px] font-bold uppercase text-[#73706B]">
                    <tr>
                      <th className="py-2.5 px-4">Order ID</th>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Table / Room</th>
                      <th className="py-2.5 px-4">Voided Items</th>
                      <th className="py-2.5 px-3 text-right">Potential Loss</th>
                      <th className="py-2.5 px-3">Cashier / Staff</th>
                      <th className="py-2.5 px-3 text-center">Audit Risk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E2DA]">
                    {voidedOrders.map(order => (
                      <tr key={order.id} className="hover:bg-rose-50/30">
                        <td className="py-2.5 px-4 font-mono font-bold text-[#1A1A1A]">{order.id}</td>
                        <td className="py-2.5 px-3 text-[#73706B]">{normalizeDate(order.createdAt)}</td>
                        <td className="py-2.5 px-3 font-semibold text-[#1A1A1A]">{order.tableOrRoom}</td>
                        <td className="py-2.5 px-4 text-[#555]">
                          {order.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-rose-700">{formatNaira(order.grandTotal)}</td>
                        <td className="py-2.5 px-3 text-[#73706B]">{order.cashierName}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-100 text-rose-800">
                            High Leakage Risk
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Historical Saved Reconciliation Logs */}
          <div className="bg-white rounded-xl border border-[#E5E2DA] shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[#E5E2DA] bg-[#FAF9F5] flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#1A1A1A] uppercase tracking-wider">
                Audited Daily Cash Drawer Shift Logs
              </h4>
              <span className="text-xs text-[#73706B]">{savedReconciliations.length} Recorded Shifts</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-[#E5E2DA]">
                <thead className="bg-[#FAF7F0] text-[10px] font-bold uppercase text-[#73706B]">
                  <tr>
                    <th className="py-2.5 px-4">Audit ID</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3 text-right">System Expected</th>
                    <th className="py-2.5 px-3 text-right">Physical Count</th>
                    <th className="py-2.5 px-3 text-right">Variance</th>
                    <th className="py-2.5 px-4">Auditor & Shift Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E2DA]">
                  {savedReconciliations.map(rec => (
                    <tr key={rec.id} className="hover:bg-[#FAF9F5]">
                      <td className="py-2.5 px-4 font-mono font-semibold text-[#1A1A1A]">{rec.id}</td>
                      <td className="py-2.5 px-3 text-[#73706B]">{rec.date}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#1A1A1A]">{formatNaira(rec.systemCash)}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-[#1A1A1A]">{formatNaira(rec.countedCash)}</td>
                      <td className={`py-2.5 px-3 text-right font-bold ${
                        rec.variance === 0 ? 'text-emerald-700' : 'text-rose-600'
                      }`}>
                        {rec.variance === 0 ? '₦0 (Balanced)' : formatNaira(rec.variance)}
                      </td>
                      <td className="py-2.5 px-4 text-[#555]">
                        <span className="font-semibold text-[#1A1A1A]">{rec.auditor}:</span> {rec.note}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: COST CENTER & MARGIN ANALYTICS                                    */}
      {/* ========================================================================= */}
      {activeTab === 'cost_centers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Distribution by Menu Category */}
            <div className="bg-white p-5 rounded-xl border border-[#E5E2DA] shadow-sm">
              <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider mb-1 flex items-center gap-2">
                <PieChart className="w-4 h-4 text-[#C8B282]" />
                Revenue Breakdown by Profit Center
              </h3>
              <p className="text-xs text-[#73706B] mb-5">
                Relative contribution of food menus, bar drinks, snacks, and catering to total sales.
              </p>

              <div className="space-y-4">
                {[
                  { name: 'Food Menu (Mains & Specialties)', amount: foodRevenue, color: 'bg-emerald-600' },
                  { name: 'Beverages & Cold Bar Drinks', amount: beverageRevenue, color: 'bg-blue-600' },
                  { name: 'Snacks, Pastries & Shawarma', amount: snacksRevenue, color: 'bg-amber-500' },
                  { name: 'Central Kitchen & Catering', amount: centralKitchenRevenue, color: 'bg-purple-600' }
                ].map(item => {
                  const pct = netRevenue > 0 ? (item.amount / netRevenue) * 100 : 0;
                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#1A1A1A]">{item.name}</span>
                        <span className="text-[#73706B]">{formatNaira(item.amount)} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#F0EDE6] rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* OPEX Distribution by Functional Cost Center */}
            <div className="bg-white p-5 rounded-xl border border-[#E5E2DA] shadow-sm">
              <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider mb-1 flex items-center gap-2">
                <Fuel className="w-4 h-4 text-purple-600" />
                Operational Overhead (OPEX) Cost Centers
              </h3>
              <p className="text-xs text-[#73706B] mb-5">
                Functional breakdown of major recurring business expense categories.
              </p>

              <div className="space-y-4">
                {[
                  { name: 'Energy & Power (Diesel & Gas Refill)', amount: opexEnergy, color: 'bg-rose-600' },
                  { name: 'Equipment Servicing & Maintenance', amount: opexMaintenance, color: 'bg-amber-600' },
                  { name: 'Takeaway Packaging & POS Paper', amount: opexPackagingAdmin, color: 'bg-blue-600' },
                  { name: 'Crew Shift Welfare & Sanitation', amount: opexStaffSanitation, color: 'bg-emerald-600' },
                  { name: 'Other Sundry & Admin Overhead', amount: opexOther, color: 'bg-gray-600' }
                ].map(item => {
                  const pct = totalOPEX > 0 ? (item.amount / totalOPEX) * 100 : 0;
                  return (
                    <div key={item.name} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-[#1A1A1A]">{item.name}</span>
                        <span className="text-[#73706B]">{formatNaira(item.amount)} ({pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-2.5 bg-[#F0EDE6] rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${item.color} rounded-full transition-all duration-500`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Industry KPI Benchmarks Comparison Table */}
          <div className="bg-white p-5 rounded-xl border border-[#E5E2DA] shadow-sm">
            <h3 className="text-sm font-bold text-[#1A1A1A] uppercase tracking-wider mb-2">
              Hospitality Industry Financial Benchmarks vs. Actuals
            </h3>
            <p className="text-xs text-[#73706B] mb-4">
              Real-time operational efficiency metrics measured against global hotel & restaurant standards.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-[#E5E2DA] bg-[#FAF9F5]">
                <div className="text-[11px] font-bold text-[#73706B] uppercase mb-1">Food Cost % (COGS / Sales)</div>
                <div className="text-2xl font-black text-[#1A1A1A]">{cogsPercentage.toFixed(1)}%</div>
                <div className="text-xs text-[#73706B] mt-2 flex items-center justify-between border-t border-[#E5E2DA] pt-2">
                  <span>Target Benchmark:</span>
                  <span className="font-bold text-[#1A1A1A]">28% – 34%</span>
                </div>
                <div className="mt-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    cogsPercentage <= 34 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {cogsPercentage <= 34 ? 'Optimal Cost Control' : 'Cost Leakage Alert'}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#E5E2DA] bg-[#FAF9F5]">
                <div className="text-[11px] font-bold text-[#73706B] uppercase mb-1">Gross Profit Margin</div>
                <div className="text-2xl font-black text-emerald-800">{grossMarginPercentage.toFixed(1)}%</div>
                <div className="text-xs text-[#73706B] mt-2 flex items-center justify-between border-t border-[#E5E2DA] pt-2">
                  <span>Target Benchmark:</span>
                  <span className="font-bold text-[#1A1A1A]">&gt; 65%</span>
                </div>
                <div className="mt-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800">
                    High Margin Velocity
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl border border-[#E5E2DA] bg-[#FAF9F5]">
                <div className="text-[11px] font-bold text-[#73706B] uppercase mb-1">Operating Margin (EBITDA)</div>
                <div className="text-2xl font-black text-[#C8B282]">{netMarginPercentage.toFixed(1)}%</div>
                <div className="text-xs text-[#73706B] mt-2 flex items-center justify-between border-t border-[#E5E2DA] pt-2">
                  <span>Target Benchmark:</span>
                  <span className="font-bold text-[#1A1A1A]">20% – 35%</span>
                </div>
                <div className="mt-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-[#FAF5EA] text-[#8C7642] border border-[#C8B282]/40">
                    Strong Bottom Line
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CASH FLOW & WORKING CAPITAL                                       */}
      {/* ========================================================================= */}
      {activeTab === 'cash_flow' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border border-[#E5E2DA] shadow-sm">
            <h3 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2 mb-1">
              <Banknote className="w-5 h-5 text-[#C8B282]" />
              Operating Cash Flow & Liquidity Statement
            </h3>
            <p className="text-xs text-[#73706B] mb-6">
              Inflows from point of sale settlements versus disbursements for generator diesel, market runs, and supplier settle notes.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Cash Inflows */}
              <div className="p-5 rounded-xl border border-emerald-200 bg-emerald-50/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-emerald-900 uppercase">Total Cash Inflows</span>
                  <ArrowDownRight className="w-4 h-4 text-emerald-700" />
                </div>
                <div className="text-2xl font-black text-emerald-800">{formatNaira(netRevenue)}</div>
                <div className="mt-3 space-y-1 text-xs text-emerald-900/80">
                  <div className="flex justify-between">
                    <span>Card POS Settlements:</span>
                    <span className="font-semibold">{formatNaira(posCardSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Direct Bank Transfers:</span>
                    <span className="font-semibold">{formatNaira(bankTransferSales)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Physical Cash Drawer:</span>
                    <span className="font-semibold">{formatNaira(cashSales)}</span>
                  </div>
                </div>
              </div>

              {/* Cash Outflows */}
              <div className="p-5 rounded-xl border border-rose-200 bg-rose-50/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-900 uppercase">Total Cash Outflows</span>
                  <ArrowUpRight className="w-4 h-4 text-rose-700" />
                </div>
                <div className="text-2xl font-black text-rose-800">{formatNaira(totalOPEX + totalCOGS)}</div>
                <div className="mt-3 space-y-1 text-xs text-rose-900/80">
                  <div className="flex justify-between">
                    <span>Supplier Commodity Orders:</span>
                    <span className="font-semibold">{formatNaira(totalCOGS)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Diesel, Gas & Maintenance:</span>
                    <span className="font-semibold">{formatNaira(totalOPEX)}</span>
                  </div>
                </div>
              </div>

              {/* Net Cash Surplus & Petty Cash Vault */}
              <div className="p-5 rounded-xl border border-[#C8B282]/50 bg-[#FAF7F0]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#8C7642] uppercase">Cash Vault & Working Float</span>
                  <Building2 className="w-4 h-4 text-[#C8B282]" />
                </div>
                <div className="text-2xl font-black text-[#1A1A1A]">{formatNaira(pettyCashBalance)}</div>
                <div className="mt-3 space-y-1 text-xs text-[#555]">
                  <div className="flex justify-between">
                    <span>Petty Cash Vault Balance:</span>
                    <span className="font-semibold text-[#1A1A1A]">{formatNaira(pettyCashBalance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Outstanding Supplier Payables:</span>
                    <span className="font-semibold text-rose-600">{formatNaira(unpaidSupplierBalances)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Pending Expense Approvals:</span>
                    <span className="font-semibold text-amber-600">{formatNaira(pendingExpenseApprovals)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRILL-DOWN AUDIT TRANSACTION MODAL                                       */}
      {/* ========================================================================= */}
      {drillDownModal.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-[#E5E2DA] max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E5E2DA] flex items-center justify-between bg-[#1A1A1A] text-white">
              <div>
                <h3 className="text-base font-bold text-[#C8B282]">{drillDownModal.title}</h3>
                <p className="text-xs text-[#A8A29E]">{drillDownModal.description}</p>
              </div>
              <button
                onClick={() => setDrillDownModal({ isOpen: false, title: '', description: '', items: [] })}
                className="w-8 h-8 rounded-lg bg-[#2A2A2A] hover:bg-[#333333] flex items-center justify-center text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal List */}
            <div className="p-5 overflow-y-auto divide-y divide-[#E5E2DA] flex-1">
              {drillDownModal.items.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#73706B]">
                  No matching transaction items found in current period.
                </div>
              ) : (
                drillDownModal.items.map((item, idx) => (
                  <div key={item.id || idx} className="py-3 flex items-center justify-between text-xs hover:bg-[#FAF9F5] px-2 rounded">
                    <div>
                      <div className="font-bold text-[#1A1A1A]">{item.title}</div>
                      <div className="text-[11px] text-[#73706B] flex items-center gap-3 mt-0.5">
                        <span>Date: <strong>{item.date}</strong></span>
                        {item.ref && <span>Ref: <strong className="font-mono">{item.ref}</strong></span>}
                        {item.recordedBy && <span>By/Mode: <strong>{item.recordedBy}</strong></span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-black ${
                        item.type === 'credit' ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        {item.type === 'credit' ? '+' : '-'}{formatNaira(item.amount)}
                      </div>
                      <span className="text-[10px] font-bold uppercase text-[#73706B]">
                        {item.type === 'credit' ? 'Inflow' : 'Disbursement'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E5E2DA] bg-[#FAF9F5] flex justify-between items-center text-xs">
              <span className="text-[#73706B]">
                Total Records: <strong>{drillDownModal.items.length}</strong>
              </span>
              <button
                onClick={() => setDrillDownModal({ isOpen: false, title: '', description: '', items: [] })}
                className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-semibold rounded-lg hover:bg-[#2A2A2A] transition-colors"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PRINT STATEMENT MODAL (EXECUTIVE HARDCOPY VIEW)                          */}
      {/* ========================================================================= */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full p-8 text-[#1A1A1A] space-y-6 my-8">
            {/* Top Bar for Modal */}
            <div className="flex justify-between items-center pb-4 border-b border-[#E5E2DA]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#73706B]">
                Executive Print Preview
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-1.5 bg-[#C8B282] hover:bg-[#B39D6D] text-[#1A1A1A] font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-4 h-4" />
                  Print Now
                </button>
                <button
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-3 py-1.5 bg-[#1A1A1A] text-white text-xs rounded-lg hover:bg-[#2A2A2A]"
                >
                  Close
                </button>
              </div>
            </div>

            {/* PRINTABLE DOCUMENT BODY */}
            <div className="print-area space-y-6">
              {/* Luxury Header */}
              <div className="text-center border-b-2 border-[#1A1A1A] pb-6">
                <div className="text-2xl font-black uppercase tracking-widest text-[#1A1A1A]">
                  FULBE RESTAURANT & LOUNGE
                </div>
                <div className="text-xs uppercase tracking-wider text-[#73706B] mt-1 font-semibold">
                  Hotel Business Services &bull; Fine Dining &bull; Central Kitchen
                </div>
                <div className="text-xs text-[#73706B] mt-1">
                  Tax Identification Number (TIN): 2408912-0001 &bull; Certified USAR Financial Statement
                </div>
                <div className="mt-4 inline-block px-4 py-1 rounded bg-[#FAF5EA] border border-[#C8B282] text-xs font-bold text-[#8C7642] uppercase">
                  Statement of Profit and Loss (P&L) &bull; Period: {dateFilterLabel}
                </div>
              </div>

              {/* High-level Figures Table */}
              <div className="border border-[#1A1A1A] rounded overflow-hidden">
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-[#E5E2DA]">
                    <tr className="bg-[#FAF9F5] font-bold text-sm">
                      <td className="py-2.5 px-4 text-[#1A1A1A]">TOTAL NET SALES REVENUE</td>
                      <td className="py-2.5 px-4 text-right font-black text-[#1A1A1A]">{formatNaira(netRevenue)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8 text-[#555]">Less: Cost of Goods Sold (COGS / Food Cost)</td>
                      <td className="py-2 px-4 text-right font-semibold text-rose-700">({formatNaira(totalCOGS)})</td>
                    </tr>
                    <tr className="bg-[#FAF5EA] font-bold">
                      <td className="py-2.5 px-4 text-emerald-900">GROSS PROFIT (Margin: {grossMarginPercentage.toFixed(1)}%)</td>
                      <td className="py-2.5 px-4 text-right font-black text-emerald-900">{formatNaira(grossProfit)}</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-4 pl-8 text-[#555]">Less: Operating Overhead & Energy (OPEX)</td>
                      <td className="py-2 px-4 text-right font-semibold text-rose-700">({formatNaira(totalOPEX)})</td>
                    </tr>
                    <tr className="bg-[#1A1A1A] text-white font-bold text-sm">
                      <td className="py-3 px-4">OPERATING PROFIT / EBITDA (Net Margin: {netMarginPercentage.toFixed(1)}%)</td>
                      <td className="py-3 px-4 text-right font-black text-[#C8B282] text-base">{formatNaira(operatingProfitEBITDA)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Channel Reconciliation Summary */}
              <div className="grid grid-cols-3 gap-4 text-xs border border-[#E5E2DA] p-4 rounded bg-[#FAF9F5]">
                <div>
                  <span className="text-[#73706B] font-medium block">Card POS Collections:</span>
                  <span className="font-bold text-sm text-[#1A1A1A]">{formatNaira(posCardSales)}</span>
                </div>
                <div>
                  <span className="text-[#73706B] font-medium block">Bank Transfer Receipts:</span>
                  <span className="font-bold text-sm text-[#1A1A1A]">{formatNaira(bankTransferSales)}</span>
                </div>
                <div>
                  <span className="text-[#73706B] font-medium block">Cash Drawer Shift Total:</span>
                  <span className="font-bold text-sm text-emerald-800">{formatNaira(cashSales)}</span>
                </div>
              </div>

              {/* Institutional Sign-off Blocks */}
              <div className="grid grid-cols-3 gap-8 pt-10 text-xs text-center border-t border-[#E5E2DA]">
                <div>
                  <div className="border-b border-[#1A1A1A] pb-8 mb-2"></div>
                  <div className="font-bold text-[#1A1A1A]">Prepared by: Chief Accountant</div>
                  <div className="text-[11px] text-[#73706B]">Financial Accounts Department</div>
                </div>
                <div>
                  <div className="border-b border-[#1A1A1A] pb-8 mb-2"></div>
                  <div className="font-bold text-[#1A1A1A]">Certified by: Internal Auditor</div>
                  <div className="text-[11px] text-[#73706B]">Internal Control & Risk Unit</div>
                </div>
                <div>
                  <div className="border-b border-[#1A1A1A] pb-8 mb-2"></div>
                  <div className="font-bold text-[#1A1A1A]">Approved by: General Manager</div>
                  <div className="text-[11px] text-[#73706B]">Executive Management</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
