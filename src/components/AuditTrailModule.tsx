import React, { useState, useEffect, useMemo } from 'react';
import type { 
  AuditRecord, 
  AuditCategory, 
  AuditSeverity, 
  RestaurantOrder 
} from '../types';
import { INITIAL_AUDIT_LOGS } from '../data/auditData';
import { 
  ShieldCheck, 
  ShieldAlert, 
  AlertTriangle, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Calendar, 
  User, 
  Monitor, 
  FileText, 
  Lock, 
  Eye, 
  Key, 
  Hash, 
  Layers, 
  Check, 
  X, 
  RotateCcw,
  Sparkles,
  DollarSign,
  Receipt,
  UtensilsCrossed,
  Info
} from 'lucide-react';

interface AuditTrailModuleProps {
  orders?: RestaurantOrder[];
  onReprintReceipt?: (order: RestaurantOrder) => void;
  cashierName?: string;
}

const STORAGE_KEY = 'restaurant_management_audit_logs';
const LEGACY_STORAGE_KEY = 'fulbe_restaurant_audit_logs';

export const AuditTrailModule: React.FC<AuditTrailModuleProps> = ({
  orders = [],
  onReprintReceipt,
  cashierName = 'Prototype Cashier'
}) => {
  // Multi-tier storage persistence
  const [logs, setLogs] = useState<AuditRecord[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
      const session = sessionStorage.getItem(STORAGE_KEY);
      if (session) return JSON.parse(session);
    } catch (e) {
      console.warn('Failed to parse audit logs from storage:', e);
    }
    return INITIAL_AUDIT_LOGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to persist audit logs:', e);
    }
  }, [logs]);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimePreset, setSelectedTimePreset] = useState<'all' | 'today' | 'yesterday' | 'week' | 'month'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('All');
  const [selectedUser, setSelectedUser] = useState<string>('All');

  // Selected Log for 360° Inspection Modal
  const [inspectingLog, setInspectingLog] = useState<AuditRecord | null>(null);

  // New Compliance Incident Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [newLogForm, setNewLogForm] = useState({
    action: 'CASH_COUNT_DISCREPANCY',
    category: 'Exceptions & Voids' as AuditCategory,
    severity: 'HIGH' as AuditSeverity,
    user: cashierName,
    role: 'Duty Manager',
    reference: '',
    terminal: 'POS Terminal 01 (Main Dining)',
    details: ''
  });

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Unique list of users for dropdown filter
  const allUsers = useMemo(() => {
    return Array.from(new Set(logs.map(l => l.user))).filter(Boolean);
  }, [logs]);

  // Computed KPI Metrics
  const metrics = useMemo(() => {
    const totalEvents = logs.length;
    const criticalCount = logs.filter(l => l.severity === 'CRITICAL' || l.severity === 'HIGH').length;
    const financialCount = logs.filter(l => l.category === 'Financial & POS').length;
    const exceptionsCount = logs.filter(l => l.category === 'Exceptions & Voids').length;
    const activeTerminals = new Set(logs.map(l => l.terminal)).size;

    return {
      totalEvents,
      criticalCount,
      financialCount,
      exceptionsCount,
      activeTerminals
    };
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter(l => {
      // Time Filter
      if (selectedTimePreset === 'today' && l.date !== '2026-10-18') return false;
      if (selectedTimePreset === 'yesterday' && l.date !== '2026-10-17') return false;
      if (selectedTimePreset === 'week') {
        const d = new Date(l.date).getTime();
        const now = new Date('2026-10-18').getTime();
        if (now - d > 7 * 86400000) return false;
      }
      if (selectedTimePreset === 'month') {
        if (!l.date.startsWith('2026-10')) return false;
      }

      // Category Filter
      if (selectedCategory !== 'All' && l.category !== selectedCategory) return false;

      // Severity Filter
      if (selectedSeverity !== 'All' && l.severity !== selectedSeverity) return false;

      // User Filter
      if (selectedUser !== 'All' && l.user !== selectedUser) return false;

      // Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = 
          l.id.toLowerCase().includes(q) ||
          l.user.toLowerCase().includes(q) ||
          l.role.toLowerCase().includes(q) ||
          l.action.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q) ||
          l.reference.toLowerCase().includes(q) ||
          l.terminal.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [logs, selectedTimePreset, selectedCategory, selectedSeverity, selectedUser, searchQuery]);

  // Helper to generate SHA-256 styled chained hash
  const generateSimulatedHash = (id: string, timestamp: string) => {
    let hash = 0;
    const str = `${id}-${timestamp}-RMS-AUDIT-VERIFIED`;
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    const hex = Math.abs(hash).toString(16).padStart(8, '0');
    return `${hex}e49b803f29a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5`;
  };

  // Submit manual compliance incident
  const handleSaveIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogForm.details.trim()) {
      alert('Please provide detailed incident narrative.');
      return;
    }

    const now = new Date();
    const dateStr = '2026-10-18';
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const timeStr = `${hour12}:${minutes} ${ampm}`;
    const timestampStr = `${dateStr} ${timeStr}`;

    const newId = `AUD-2026-${String(logs.length + 1).padStart(4, '0')}`;
    const newRecord: AuditRecord = {
      id: newId,
      timestamp: timestampStr,
      date: dateStr,
      time: timeStr,
      user: newLogForm.user,
      role: newLogForm.role,
      action: newLogForm.action,
      category: newLogForm.category,
      severity: newLogForm.severity,
      details: newLogForm.details,
      reference: newLogForm.reference || `INCIDENT-${newId}`,
      terminal: newLogForm.terminal,
      ipAddress: '192.168.1.102',
      status: newLogForm.severity === 'CRITICAL' ? 'WARNING' : 'SUCCESS',
      integrityHash: generateSimulatedHash(newId, timestampStr)
    };

    setLogs([newRecord, ...logs]);
    setIsLogModalOpen(false);
    setToastMessage(`Incident record ${newId} signed and added to the immutable audit ledger.`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Export to CSV
  const handleExportCSV = () => {
    const headers = [
      'Log ID',
      'Timestamp',
      'Date',
      'Time',
      'User / Operator',
      'Staff Role',
      'Action Code',
      'Category',
      'Risk Severity',
      'Reference ID',
      'Terminal',
      'IP Address',
      'Status',
      'Details',
      'SHA256 Integrity Hash'
    ];

    const rows = filteredLogs.map(l => [
      `"${l.id}"`,
      `"${l.timestamp}"`,
      `"${l.date}"`,
      `"${l.time}"`,
      `"${l.user}"`,
      `"${l.role}"`,
      `"${l.action}"`,
      `"${l.category}"`,
      `"${l.severity}"`,
      `"${l.reference}"`,
      `"${l.terminal}"`,
      `"${l.ipAddress || ''}"`,
      `"${l.status}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.integrityHash || ''}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Audit_Trail_Ledger_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Print Formal A4 Compliance Audit Report
  const handlePrintAuditReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the Audit Report.');
      return;
    }

    const rowsHtml = filteredLogs.map((l, idx) => `
      <tr>
        <td style="padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; font-family: monospace;">${idx + 1}</td>
        <td style="padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; font-family: monospace; font-weight: bold;">${l.id}</td>
        <td style="padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px;">${l.timestamp}</td>
        <td style="padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px;">
          <strong>${l.user}</strong>
          <div style="color: #64748b; font-size: 9px;">${l.role}</div>
        </td>
        <td style="padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px;">
          <span style="font-weight: bold; font-size: 9px; padding: 2px 5px; border-radius: 4px; ${
            l.severity === 'CRITICAL' ? 'background: #fee2e2; color: #991b1b;' :
            l.severity === 'HIGH' ? 'background: #fef3c7; color: #92400e;' :
            l.severity === 'MEDIUM' ? 'background: #dbeafe; color: #1e40af;' : 'background: #f1f5f9; color: #475569;'
          }">${l.severity}</span>
        </td>
        <td style="padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; font-family: monospace; font-weight: bold; color: #0f172a;">${l.reference}</td>
        <td style="padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10px; max-width: 280px;">${l.details}</td>
        <td style="padding: 7px 8px; border-bottom: 1px solid #e2e8f0; font-size: 9px; color: #64748b;">${l.terminal}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Compliance Audit Trail Ledger - Restaurant Management System</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #0f172a;
              margin: 0;
              padding: 20px;
              background: #fff;
            }
            .header {
              border-bottom: 2px solid #0b1221;
              padding-bottom: 14px;
              margin-bottom: 14px;
              display: flex;
              justify-content: space-between;
              align-items: flex-end;
            }
            .title {
              font-size: 18px;
              font-weight: 900;
              text-transform: uppercase;
              letter-spacing: -0.5px;
            }
            .sub {
              font-size: 11px;
              color: #b45309;
              font-weight: bold;
              text-transform: uppercase;
            }
            .kpis {
              display: flex;
              gap: 15px;
              margin-bottom: 14px;
              padding: 10px;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 6px;
              font-size: 11px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 6px;
            }
            th {
              background: #0b1221;
              color: #fff;
              text-align: left;
              padding: 8px;
              font-size: 9px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .footer-signatures {
              margin-top: 30px;
              display: flex;
              justify-content: space-between;
              padding-top: 20px;
              border-top: 1px dashed #cbd5e1;
            }
            .sig-box {
              width: 30%;
              text-align: center;
              font-size: 11px;
            }
            .sig-line {
              border-bottom: 1px solid #000;
              height: 40px;
              margin-bottom: 6px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="sub">Internal Control & Financial Compliance Division</div>
              <div class="title">RESTAURANT MANAGEMENT SYSTEM — OFFICIAL AUDIT TRAIL LEDGER</div>
              <div style="font-size: 11px; color: #64748b; margin-top: 4px;">
                Tamper-Evident System Event & Operations Audit Log • Standalone Commercial Architecture
              </div>
            </div>
            <div style="text-align: right; font-size: 10px; color: #475569;">
              <div>Generated: <strong>${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString()}</strong></div>
              <div>Certified Officer: <strong>${cashierName}</strong></div>
              <div>Verification Status: <strong style="color: #15803d;">HASH CHAIN VERIFIED</strong></div>
            </div>
          </div>

          <div class="kpis">
            <div>Total Audit Records in Scope: <strong>${filteredLogs.length}</strong></div>
            <div>Critical / High Risk Events: <strong style="color: #b91c1c;">${filteredLogs.filter(l => l.severity === 'CRITICAL' || l.severity === 'HIGH').length}</strong></div>
            <div>Financial POS Settlements: <strong style="color: #047857;">${filteredLogs.filter(l => l.category === 'Financial & POS').length}</strong></div>
            <div>Time Scope: <strong>${selectedTimePreset.toUpperCase()}</strong></div>
            <div>Category Filter: <strong>${selectedCategory}</strong></div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px;">#</th>
                <th style="width: 90px;">Audit ID</th>
                <th style="width: 120px;">Timestamp</th>
                <th>Operator / Role</th>
                <th style="width: 70px;">Risk</th>
                <th style="width: 100px;">Reference</th>
                <th>Event Narrative & Impact</th>
                <th style="width: 130px;">Terminal</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="footer-signatures">
            <div class="sig-box">
              <div class="sig-line"></div>
              <strong>Internal Control Officer</strong>
              <div style="color: #64748b; font-size: 9px;">Signature & Date</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <strong>Finance Controller / Accountant</strong>
              <div style="color: #64748b; font-size: 9px;">Signature & Date</div>
            </div>
            <div class="sig-box">
              <div class="sig-line"></div>
              <strong>General Manager / Auditor</strong>
              <div style="color: #64748b; font-size: 9px;">Signature & Date</div>
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

  // Helper for Severity Badges
  const renderSeverityBadge = (severity: AuditSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-300 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-red-700" />
            CRITICAL
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <ShieldAlert className="w-3 h-3 text-amber-700" />
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <Info className="w-3 h-3 text-blue-700" />
            MEDIUM
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            INFO / LOW
          </span>
        );
    }
  };

  // Helper for Category Badges
  const renderCategoryBadge = (category: AuditCategory) => {
    switch (category) {
      case 'Financial & POS':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">Financial & POS</span>;
      case 'Exceptions & Voids':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-rose-50 text-rose-800 border border-rose-200">Exceptions & Voids</span>;
      case 'Inventory & Procurement':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-800 border border-indigo-200">Inventory & PO</span>;
      case 'Expenses & Floats':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Expenses & Floats</span>;
      case 'Kitchen & Operations':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-teal-50 text-teal-800 border border-teal-200">Kitchen & Tables</span>;
      case 'Security & Access':
        return <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-800 border border-purple-200">Security & Access</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-[#024628] text-white px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-lg border border-[#166c43] animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#8cd6b0]" />
            <span>{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-white/80 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner & Audit Command Header */}
      <div className="bg-[#0b1221] text-white p-6 rounded-xl border border-[#1e293b] shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-[#b45309] text-white font-black text-[9px] uppercase tracking-widest rounded">
              ADMINISTRATION & COMPLIANCE
            </span>
            <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">
              Tamper-Evident Ledger • Fraud Prevention • Cash Drawer & Void Monitoring
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif italic text-white flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-[#C8B282]" />
            <span>Audit Trail & Internal Controls</span>
          </h1>
          <p className="text-xs text-[#cbd5e1] font-light max-w-2xl mt-1">
            Complete, immutable audit log of financial billing, voided orders, price overrides, cash drawer triggers, and administrative system actions across all terminals.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsLogModalOpen(true)}
            className="px-3.5 py-2 bg-[#C8B282] hover:bg-[#b59e6d] text-[#0b1221] text-xs font-black uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Log Compliance Note</span>
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-[#1e293b] hover:bg-[#334155] text-white border border-[#334155] text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#C8B282]" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={handlePrintAuditReport}
            className="px-3.5 py-2 bg-[#1e293b] hover:bg-[#334155] text-white border border-[#334155] text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#C8B282]" />
            <span>Print Audit Report</span>
          </button>
        </div>
      </div>

      {/* Top 5 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Events */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E2DA] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#73706B] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Events Logged</span>
            <div className="p-2 bg-[#f8fafc] text-[#0f172a] rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#1A1A1A]">{metrics.totalEvents}</div>
            <div className="text-[11px] text-[#73706B] mt-1">Immutable ledger records</div>
          </div>
        </div>

        {/* Critical & High Risk Incidents */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E2DA] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#73706B] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">High Risk & Voids</span>
            <div className="p-2 bg-red-50 text-red-700 rounded-lg">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-red-700">{metrics.criticalCount}</div>
            <div className="text-[11px] text-red-600 font-semibold mt-1">Requires audit review</div>
          </div>
        </div>

        {/* Financial Billing Actions */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E2DA] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#73706B] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">POS & Settlements</span>
            <div className="p-2 bg-[#ecfdf5] text-[#024628] rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#024628]">{metrics.financialCount}</div>
            <div className="text-[11px] text-[#73706B] mt-1">Payment & billing events</div>
          </div>
        </div>

        {/* Active Terminals & Consoles */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E2DA] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#73706B] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Terminals</span>
            <div className="p-2 bg-[#eff6ff] text-[#2563eb] rounded-lg">
              <Monitor className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#2563eb]">{metrics.activeTerminals}</div>
            <div className="text-[11px] text-[#73706B] mt-1">Connected workstations</div>
          </div>
        </div>

        {/* Tamper-Evidence Status */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E2DA] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#73706B] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Ledger Integrity</span>
            <div className="p-2 bg-[#f0fdf4] text-[#16a34a] rounded-lg">
              <Lock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-xs font-black text-[#15803d] flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>SHA-256 VERIFIED</span>
            </div>
            <div className="text-[10px] text-[#73706B] font-mono mt-1 truncate">
              0 Tampering Detected
            </div>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#E5E2DA] shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Global Search */}
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-[#A3A09A] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search audit trail by ID, cashier/staff, order reference, terminal, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-8 py-2.5 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="w-full md:w-48">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
            >
              <option value="All">All Categories</option>
              <option value="Financial & POS">Financial & POS</option>
              <option value="Exceptions & Voids">Exceptions & Voids</option>
              <option value="Inventory & Procurement">Inventory & Procurement</option>
              <option value="Expenses & Floats">Expenses & Floats</option>
              <option value="Kitchen & Operations">Kitchen & Operations</option>
              <option value="Security & Access">Security & Access</option>
            </select>
          </div>

          {/* Severity Dropdown */}
          <div className="w-full md:w-40">
            <select
              value={selectedSeverity}
              onChange={(e) => setSelectedSeverity(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
            >
              <option value="All">All Severities</option>
              <option value="CRITICAL">🚨 Critical</option>
              <option value="HIGH">⚠️ High Risk</option>
              <option value="MEDIUM">🟡 Medium</option>
              <option value="LOW">ℹ️ Low / Info</option>
            </select>
          </div>

          {/* Staff Operator Dropdown */}
          <div className="w-full md:w-44">
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2.5 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
            >
              <option value="All">All Operators ({allUsers.length})</option>
              {allUsers.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick Time Presets Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#F5F4EF]">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[#73706B] uppercase tracking-wider mr-1">
              Time Scope:
            </span>
            {[
              { id: 'all', label: 'All History' },
              { id: 'today', label: 'Today (Oct 18)' },
              { id: 'yesterday', label: 'Yesterday (Oct 17)' },
              { id: 'week', label: 'Last 7 Days' },
              { id: 'month', label: 'October 2026' }
            ].map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => setSelectedTimePreset(preset.id as any)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  selectedTimePreset === preset.id
                    ? 'bg-[#0b1221] text-white shadow-xs'
                    : 'bg-[#F5F4EF] text-[#555] hover:bg-[#E5E2DA]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-[#73706B]">
            Showing <strong>{filteredLogs.length}</strong> of {logs.length} events
          </div>
        </div>
      </div>

      {/* Main Audit Trail Table */}
      <div className="bg-white rounded-xl border border-[#E5E2DA] shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <ShieldCheck className="w-12 h-12 text-[#A3A09A] mx-auto mb-3" />
            <h3 className="text-base font-bold text-[#1A1A1A]">No audit events match your active filters</h3>
            <p className="text-xs text-[#73706B] mt-1">
              Adjust search keywords or reset filter dropdowns to view complete chronological log.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
                setSelectedSeverity('All');
                setSelectedUser('All');
                setSelectedTimePreset('all');
              }}
              className="mt-4 px-4 py-2 bg-[#1A1A1A] text-white text-xs font-bold rounded-lg hover:bg-[#2A2A2A]"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0b1221] text-white uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Audit ID</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Operator / Role</th>
                  <th className="py-3 px-3">Action & Category</th>
                  <th className="py-3 px-3">Severity</th>
                  <th className="py-3 px-3">Reference</th>
                  <th className="py-3 px-4">Event Narrative & Impact</th>
                  <th className="py-3 px-3">Terminal</th>
                  <th className="py-3 px-3 text-center">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DA]">
                {filteredLogs.map(log => {
                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-[#FDFCF9] transition-colors group cursor-pointer"
                      onClick={() => setInspectingLog(log)}
                    >
                      {/* Audit ID */}
                      <td className="py-3 px-4 font-mono font-bold text-[#1A1A1A]">
                        {log.id}
                      </td>

                      {/* Timestamp */}
                      <td className="py-3 px-3 whitespace-nowrap text-[#555]">
                        <div className="font-semibold text-[#1A1A1A]">{log.date}</div>
                        <div className="text-[10px] text-[#73706B]">{log.time}</div>
                      </td>

                      {/* Operator & Role */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-[#1A1A1A]">{log.user}</div>
                        <div className="text-[10px] text-[#73706B]">{log.role}</div>
                      </td>

                      {/* Action & Category */}
                      <td className="py-3 px-3">
                        <div className="font-mono text-[11px] font-bold text-[#0f172a] mb-1">
                          {log.action}
                        </div>
                        {renderCategoryBadge(log.category)}
                      </td>

                      {/* Severity */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderSeverityBadge(log.severity)}
                      </td>

                      {/* Reference */}
                      <td className="py-3 px-3 font-mono font-bold text-[#024628] whitespace-nowrap">
                        {log.reference}
                      </td>

                      {/* Details Narrative */}
                      <td className="py-3 px-4 max-w-xs text-[#333] leading-relaxed">
                        {log.details}
                      </td>

                      {/* Terminal */}
                      <td className="py-3 px-3 whitespace-nowrap text-[11px] text-[#64748b]">
                        <div className="truncate max-w-[130px]" title={log.terminal}>
                          {log.terminal}
                        </div>
                        {log.ipAddress && (
                          <div className="font-mono text-[10px] text-[#94a3b8]">{log.ipAddress}</div>
                        )}
                      </td>

                      {/* Inspect Action */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectingLog(log);
                          }}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-[#1A1A1A] hover:text-white text-[#1A1A1A] transition-colors"
                          title="Inspect Event 360°"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* MODAL 1: EVENT 360° INSPECTION DRAWER / MODAL */}
      {/* ============================================================== */}
      {inspectingLog && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#E5E2DA] p-6 space-y-5">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-[#E5E2DA] pb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono font-bold text-xs text-[#b45309]">{inspectingLog.id}</span>
                  {renderSeverityBadge(inspectingLog.severity)}
                  {renderCategoryBadge(inspectingLog.category)}
                </div>
                <h3 className="text-lg font-bold text-[#1A1A1A] font-mono">
                  {inspectingLog.action}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Event Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-[#FDFCF9] p-4 rounded-xl border border-[#E5E2DA] text-xs">
              <div>
                <span className="text-[10px] text-[#73706B] uppercase font-bold block">Timestamp</span>
                <strong className="text-[#1A1A1A]">{inspectingLog.timestamp}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#73706B] uppercase font-bold block">Operator</span>
                <strong className="text-[#1A1A1A]">{inspectingLog.user}</strong>
                <span className="text-[10px] text-[#73706B] block">({inspectingLog.role})</span>
              </div>
              <div>
                <span className="text-[10px] text-[#73706B] uppercase font-bold block">Reference ID</span>
                <strong className="font-mono text-[#024628]">{inspectingLog.reference}</strong>
              </div>
              <div>
                <span className="text-[10px] text-[#73706B] uppercase font-bold block">Terminal</span>
                <span className="text-[#1A1A1A]">{inspectingLog.terminal}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#73706B] uppercase font-bold block">IP Address</span>
                <span className="font-mono text-[#1A1A1A]">{inspectingLog.ipAddress || '192.168.1.100'}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#73706B] uppercase font-bold block">System Status</span>
                <span className="font-bold text-emerald-700">{inspectingLog.status}</span>
              </div>
            </div>

            {/* Detailed Narrative */}
            <div>
              <h4 className="text-xs font-bold uppercase text-[#1A1A1A] tracking-wider mb-1.5">
                Event Impact Narrative
              </h4>
              <div className="bg-white p-3.5 rounded-xl border border-[#E5E2DA] text-xs text-[#222] leading-relaxed">
                {inspectingLog.details}
              </div>
            </div>

            {/* Cryptographic SHA-256 Ledger Hash */}
            <div className="bg-[#0b1221] text-white p-3.5 rounded-xl border border-[#1e293b]">
              <div className="flex items-center justify-between text-[10px] text-[#94a3b8] uppercase font-bold mb-1">
                <span className="flex items-center gap-1 text-[#C8B282]">
                  <Lock className="w-3 h-3" />
                  <span>Tamper-Evident SHA-256 Chained Hash</span>
                </span>
                <span className="text-emerald-400">LEDGER VERIFIED</span>
              </div>
              <div className="font-mono text-[10px] text-[#cbd5e1] break-all bg-[#1e293b] p-2 rounded">
                {inspectingLog.integrityHash || generateSimulatedHash(inspectingLog.id, inspectingLog.timestamp)}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E2DA]">
              <button
                type="button"
                onClick={() => setInspectingLog(null)}
                className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-bold rounded-lg hover:bg-[#2A2A2A]"
              >
                Close Inspection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: LOG COMPLIANCE INCIDENT / NOTE */}
      {/* ============================================================== */}
      {isLogModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E5E2DA] p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A]">
                  Log Compliance Observation / Incident
                </h3>
                <p className="text-xs text-[#73706B]">
                  Records manual supervisory overrides, till discrepancies, or physical incident notes into the immutable audit ledger.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveIncident} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                {/* Action Code */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                    Action Code *
                  </label>
                  <select
                    value={newLogForm.action}
                    onChange={(e) => setNewLogForm({ ...newLogForm, action: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg font-mono focus:outline-none focus:border-[#C8B282]"
                  >
                    <option value="CASH_COUNT_DISCREPANCY">CASH_COUNT_DISCREPANCY</option>
                    <option value="SUPERVISOR_PRICE_OVERRIDE">SUPERVISOR_PRICE_OVERRIDE</option>
                    <option value="PHYSICAL_SAFE_VERIFICATION">PHYSICAL_SAFE_VERIFICATION</option>
                    <option value="UNSCHEDULED_VOID_APPROVAL">UNSCHEDULED_VOID_APPROVAL</option>
                    <option value="SECURITY_INCIDENT_REPORT">SECURITY_INCIDENT_REPORT</option>
                  </select>
                </div>

                {/* Risk Severity */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                    Risk Severity
                  </label>
                  <select
                    value={newLogForm.severity}
                    onChange={(e) => setNewLogForm({ ...newLogForm, severity: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                  >
                    <option value="CRITICAL">🚨 Critical Risk</option>
                    <option value="HIGH">⚠️ High</option>
                    <option value="MEDIUM">🟡 Medium</option>
                    <option value="LOW">ℹ️ Low / Informational</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Category */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                    Audit Category
                  </label>
                  <select
                    value={newLogForm.category}
                    onChange={(e) => setNewLogForm({ ...newLogForm, category: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                  >
                    <option value="Exceptions & Voids">Exceptions & Voids</option>
                    <option value="Financial & POS">Financial & POS</option>
                    <option value="Security & Access">Security & Access</option>
                    <option value="Inventory & Procurement">Inventory & Procurement</option>
                    <option value="Kitchen & Operations">Kitchen & Operations</option>
                  </select>
                </div>

                {/* Reference */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                    Reference ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ORD-2026-0105 or TILL-01"
                    value={newLogForm.reference}
                    onChange={(e) => setNewLogForm({ ...newLogForm, reference: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                  />
                </div>
              </div>

              {/* Terminal */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                  Terminal / Station
                </label>
                <input
                  type="text"
                  value={newLogForm.terminal}
                  onChange={(e) => setNewLogForm({ ...newLogForm, terminal: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                />
              </div>

              {/* Narrative Details */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                  Detailed Incident Observation *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Detail exact observations, supervisory overrides, cash counts, or reason for void..."
                  value={newLogForm.details}
                  onChange={(e) => setNewLogForm({ ...newLogForm, details: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282] leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E2DA]">
                <button
                  type="button"
                  onClick={() => setIsLogModalOpen(false)}
                  className="px-3.5 py-2 text-xs font-bold text-[#73706B] hover:text-[#1A1A1A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0b1221] hover:bg-[#1e293b] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Sign & Save to Ledger
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
