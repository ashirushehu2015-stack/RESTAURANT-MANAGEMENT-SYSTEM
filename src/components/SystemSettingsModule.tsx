import React, { useState, useEffect } from 'react';
import type { 
  SystemSettings, 
  RestaurantBusinessProfile, 
  ReceiptSettings, 
  POSSettings, 
  PaymentGatewaySettings, 
  KDSSettings,
  BankAccountConfig
} from '../types';
import { DEFAULT_SYSTEM_SETTINGS } from '../data/settingsData';
import { formatNaira } from '../utils/formatters';
import { 
  Settings, 
  Building2, 
  Receipt, 
  Monitor, 
  CreditCard, 
  Clock, 
  Database, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  Printer, 
  Sparkles, 
  ShieldCheck, 
  Key, 
  Wifi, 
  DollarSign, 
  AlertTriangle, 
  HelpCircle,
  Plus,
  Trash2,
  ExternalLink,
  Lock,
  Layers
} from 'lucide-react';

interface SystemSettingsModuleProps {
  onSettingsChange?: (settings: SystemSettings) => void;
  cashierName?: string;
}

const SETTINGS_STORAGE_KEY = 'restaurant_management_system_settings';
const LEGACY_SETTINGS_STORAGE_KEY = 'fulbe_restaurant_system_settings';

export const SystemSettingsModule: React.FC<SystemSettingsModuleProps> = ({
  onSettingsChange,
  cashierName = 'Prototype Cashier'
}) => {
  // Load settings from persistence
  const [settings, setSettings] = useState<SystemSettings>(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_STORAGE_KEY) || localStorage.getItem(LEGACY_SETTINGS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
      const session = sessionStorage.getItem(SETTINGS_STORAGE_KEY);
      if (session) return JSON.parse(session);
    } catch (e) {
      console.warn('Failed to parse settings:', e);
    }
    return DEFAULT_SYSTEM_SETTINGS;
  });

  // Active Sub-Tab
  const [activeTab, setActiveTab] = useState<'profile' | 'receipt' | 'pos' | 'payment' | 'kds' | 'backup'>('profile');

  // Feedback Toasts & States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [newBankFormOpen, setNewBankFormOpen] = useState(false);
  const [newBank, setNewBank] = useState({
    bankName: '',
    accountName: '',
    accountNumber: ''
  });

  // Sync to persistence
  const saveSettings = (newSettings: SystemSettings) => {
    const updated = {
      ...newSettings,
      lastUpdated: new Date().toLocaleDateString('en-GB') + ' at ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setSettings(updated);
    try {
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      sessionStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updated));
      if (onSettingsChange) onSettingsChange(updated);
    } catch (e) {
      console.error('Failed to save settings:', e);
    }
    setToastMessage('System settings saved successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Helper updaters
  const updateProfile = (fields: Partial<RestaurantBusinessProfile>) => {
    setSettings(prev => ({
      ...prev,
      profile: { ...prev.profile, ...fields }
    }));
  };

  const updateReceipt = (fields: Partial<ReceiptSettings>) => {
    setSettings(prev => ({
      ...prev,
      receipt: { ...prev.receipt, ...fields }
    }));
  };

  const updatePOS = (fields: Partial<POSSettings>) => {
    setSettings(prev => ({
      ...prev,
      pos: { ...prev.pos, ...fields }
    }));
  };

  const updatePayment = (fields: Partial<PaymentGatewaySettings>) => {
    setSettings(prev => ({
      ...prev,
      payment: { ...prev.payment, ...fields }
    }));
  };

  const updateKDS = (fields: Partial<KDSSettings>) => {
    setSettings(prev => ({
      ...prev,
      kds: { ...prev.kds, ...fields }
    }));
  };

  // Toggle Payment Method
  const handleTogglePaymentMethod = (method: 'Cash' | 'POS Machine' | 'Bank Transfer' | 'Opay' | 'Moniepoint') => {
    const current = settings.payment.enabledMethods;
    let updated: ('Cash' | 'POS Machine' | 'Bank Transfer' | 'Opay' | 'Moniepoint')[];
    if (current.includes(method)) {
      if (current.length === 1) {
        alert('At least one payment method must remain active.');
        return;
      }
      updated = current.filter(m => m !== method);
    } else {
      updated = [...current, method];
    }
    updatePayment({ enabledMethods: updated });
  };

  // Add Bank Account
  const handleAddBankAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBank.bankName || !newBank.accountNumber || !newBank.accountName) {
      alert('Please fill out all bank fields.');
      return;
    }
    const newAcc: BankAccountConfig = {
      id: `BANK-${Date.now()}`,
      bankName: newBank.bankName,
      accountName: newBank.accountName,
      accountNumber: newBank.accountNumber,
      isPrimary: settings.payment.bankAccounts.length === 0,
      isActive: true
    };
    updatePayment({
      bankAccounts: [...settings.payment.bankAccounts, newAcc]
    });
    setNewBank({ bankName: '', accountName: '', accountNumber: '' });
    setNewBankFormOpen(false);
  };

  // Delete Bank Account
  const handleDeleteBankAccount = (id: string) => {
    const filtered = settings.payment.bankAccounts.filter(b => b.id !== id);
    if (filtered.length > 0 && !filtered.some(b => b.isPrimary)) {
      filtered[0].isPrimary = true;
    }
    updatePayment({ bankAccounts: filtered });
  };

  // Set Primary Bank Account
  const handleSetPrimaryBank = (id: string) => {
    const updated = settings.payment.bankAccounts.map(b => ({
      ...b,
      isPrimary: b.id === id
    }));
    updatePayment({ bankAccounts: updated });
  };

  // Reset to Defaults
  const handleResetDefaults = () => {
    saveSettings(DEFAULT_SYSTEM_SETTINGS);
    setIsResetConfirmOpen(false);
    setToastMessage('Settings successfully reset to factory defaults.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1-Click JSON Full System Backup
  const handleExportFullBackup = () => {
    try {
      const backupData: Record<string, any> = {
        meta: {
          app: 'RESTAURANT MANAGEMENT SYSTEM',
          exportedAt: new Date().toISOString(),
          version: '2.5.0-standalone'
        },
        settings: settings
      };

      // Gather all local storage keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('restaurant_management_') || key.startsWith('fulbe_restaurant_'))) {
          try {
            backupData[key] = JSON.parse(localStorage.getItem(key) || '{}');
          } catch (e) {
            backupData[key] = localStorage.getItem(key);
          }
        }
      }

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RMS_Full_System_Backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);

      setToastMessage('Complete system database backup file downloaded successfully!');
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Backup export error:', err);
      alert('Failed to generate backup file.');
    }
  };

  // Restore JSON Backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);

        if (!parsed.meta || !parsed.meta.app) {
          alert('Invalid backup file. Ensure this is an authentic RMS backup JSON file.');
          return;
        }

        // Restore keys to localStorage
        Object.keys(parsed).forEach(k => {
          if (k !== 'meta') {
            if (k === 'settings') {
              localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(parsed[k]));
              setSettings(parsed[k]);
            } else {
              localStorage.setItem(k, typeof parsed[k] === 'string' ? parsed[k] : JSON.stringify(parsed[k]));
            }
          }
        });

        setToastMessage('System restored successfully! Please refresh to reload all restored records.');
        setTimeout(() => setToastMessage(null), 5000);
      } catch (err) {
        console.error('Restore error:', err);
        alert('Failed to parse and restore backup file. Ensure file is not corrupted.');
      }
    };
    reader.readAsText(file);
  };

  // Test Print Thermal Sample
  const handleTestPrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to test print.');
      return;
    }

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Thermal Slip</title>
          <meta charset="utf-8" />
          <style>
            @page { size: ${settings.receipt.printerType === '58mm' ? '58mm' : '80mm'} auto; margin: 3mm; }
            * { box-sizing: border-box; }
            body {
              font-family: monospace;
              font-size: 11px;
              color: #000;
              margin: 0;
              padding: 6px;
              line-height: 1.3;
              text-align: center;
              background: #fff;
            }
            .dashed { border-bottom: 1px dashed #000; margin: 6px 0; }
            .row { display: flex; justify-content: space-between; font-size: 10px; text-align: left; }
          </style>
        </head>
        <body>
          <h3 style="margin: 0; font-size: 14px; text-transform: uppercase;">${settings.profile.name}</h3>
          <div style="font-size: 9px; margin-top: 2px;">${settings.profile.address}</div>
          <div style="font-size: 9px;">Tel: ${settings.profile.phone}</div>
          <div class="dashed"></div>
          <div style="font-weight: bold; font-size: 10px;">*** TEST RECEIPT PRINT ***</div>
          <div class="row"><span>Date: ${new Date().toLocaleDateString('en-GB')}</span><span>Time: ${new Date().toLocaleTimeString()}</span></div>
          <div class="row"><span>Terminal: POS-01</span><span>Cashier: ${cashierName}</span></div>
          <div class="dashed"></div>
          <div class="row"><span>1x Fried Rice Special</span><span>₦3,500</span></div>
          <div class="row"><span>1x Grilled Catfish</span><span>₦5,500</span></div>
          <div class="row"><span>1x Fresh Chapman</span><span>₦2,000</span></div>
          <div class="dashed"></div>
          <div class="row" style="font-weight: bold; font-size: 12px;"><span>TOTAL DUE:</span><span>₦11,000</span></div>
          <div class="row"><span>VAT (${settings.profile.defaultVatRate}% Included):</span><span>₦550</span></div>
          <div class="dashed"></div>
          <div style="white-space: pre-wrap; font-size: 9px; margin-top: 4px;">${settings.receipt.headerText}</div>
          ${settings.receipt.showWifiPassword ? `<div style="font-weight: bold; font-size: 9px; margin: 4px 0;">Guest Wi-Fi: ${settings.receipt.wifiPassword}</div>` : ''}
          <div style="white-space: pre-wrap; font-size: 9px;">${settings.receipt.footerText}</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
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

      {/* Top Banner & Command Strip */}
      <div className="bg-[#0b1221] text-white p-6 rounded-xl border border-[#1e293b] shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-[#b45309] text-white font-black text-[9px] uppercase tracking-widest rounded">
              ADMINISTRATION & CONFIGURATION
            </span>
            <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">
              Business Profile • Tax Rules • Thermal Slips • Bank Gateways
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif italic text-white flex items-center gap-2">
            <Settings className="w-7 h-7 text-[#C8B282]" />
            <span>System Settings & Business Rules</span>
          </h1>
          <p className="text-xs text-[#cbd5e1] font-light max-w-2xl mt-1">
            Configure restaurant trading identity, tax rates, printer layout, payment gateways, KDS timers, and disaster recovery backups.
          </p>
        </div>

        {/* Global Save & Reset Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => saveSettings(settings)}
            className="px-4 py-2 bg-[#C8B282] hover:bg-[#b59e6d] text-[#0b1221] text-xs font-black uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Settings</span>
          </button>
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-3.5 py-2 bg-[#1e293b] hover:bg-[#334155] text-white border border-[#334155] text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#C8B282]" />
            <span>Reset Defaults</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation Strip */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#E5E2DA]">
        {[
          { id: 'profile', label: '1. Business Profile & Tax', icon: Building2 },
          { id: 'receipt', label: '2. Receipt & Printing', icon: Receipt },
          { id: 'pos', label: '3. POS & Floor Operations', icon: Monitor },
          { id: 'payment', label: '4. Payment Channels & Banks', icon: CreditCard },
          { id: 'kds', label: '5. KDS & Timers', icon: Clock },
          { id: 'backup', label: '6. Backup & Disaster Recovery', icon: Database }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#1A1A1A] text-white shadow-sm'
                  : 'bg-white text-[#73706B] hover:text-[#1A1A1A] border border-[#E5E2DA]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#C8B282]' : 'text-[#73706B]'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ============================================================== */}
      {/* TAB 1: BUSINESS PROFILE & TAX COMPLIANCE */}
      {/* ============================================================== */}
      {activeTab === 'profile' && (
        <div className="bg-white p-6 rounded-xl border border-[#E5E2DA] shadow-sm space-y-6">
          <div className="border-b border-[#E5E2DA] pb-3">
            <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#b45309]" />
              <span>Restaurant Legal Entity & Tax Compliance</span>
            </h2>
            <p className="text-xs text-[#73706B] mt-0.5">
              These details appear on official customer receipts, formal A4 Tax Invoices, Purchase Orders, and corporate reports.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Business Name */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                Official Trading Name *
              </label>
              <input
                type="text"
                value={settings.profile.name}
                onChange={(e) => updateProfile({ name: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
              />
            </div>

            {/* Tagline */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                Tagline / Subtitle
              </label>
              <input
                type="text"
                value={settings.profile.tagline}
                onChange={(e) => updateProfile({ tagline: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                Primary Phone Lines *
              </label>
              <input
                type="text"
                value={settings.profile.phone}
                onChange={(e) => updateProfile({ phone: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                Official Inquiries Email *
              </label>
              <input
                type="email"
                value={settings.profile.email}
                onChange={(e) => updateProfile({ email: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
              />
            </div>

            {/* Physical Address */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                Physical Restaurant Address
              </label>
              <input
                type="text"
                value={settings.profile.address}
                onChange={(e) => updateProfile({ address: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
              />
            </div>

            {/* RC / CAC Number */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                Corporate Affairs Commission (RC No.)
              </label>
              <input
                type="text"
                value={settings.profile.rcNumber}
                onChange={(e) => updateProfile({ rcNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg font-mono focus:outline-none focus:border-[#C8B282]"
              />
            </div>

            {/* TIN Number */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                Tax Identification Number (TIN)
              </label>
              <input
                type="text"
                value={settings.profile.tinNumber}
                onChange={(e) => updateProfile({ tinNumber: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg font-mono focus:outline-none focus:border-[#C8B282]"
              />
            </div>

            {/* VAT Rate (%) */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                Default Value Added Tax (VAT Rate %)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={settings.profile.defaultVatRate}
                  onChange={(e) => updateProfile({ defaultVatRate: parseFloat(e.target.value) || 0 })}
                  className="w-32 px-3 py-2 text-xs font-bold font-mono bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg"
                />
                <span className="text-xs text-[#73706B]">% (Currently set to {settings.profile.defaultVatRate}%)</span>
              </div>
            </div>

            {/* Delivery Logistics Fee */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                Default Dispatch Fee (₦)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={settings.profile.deliveryLogisticsFee}
                  onChange={(e) => updateProfile({ deliveryLogisticsFee: parseInt(e.target.value) || 0 })}
                  className="w-32 px-3 py-2 text-xs font-bold font-mono bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg"
                />
                <span className="text-xs text-[#73706B]">Applied to Home / Office Delivery orders</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: RECEIPT & PRINTING WITH LIVE PREVIEW */}
      {/* ============================================================== */}
      {activeTab === 'receipt' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Controls Column (7 Cols) */}
          <div className="lg:col-span-7 bg-white p-6 rounded-xl border border-[#E5E2DA] shadow-sm space-y-5">
            <div className="border-b border-[#E5E2DA] pb-3 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-[#b45309]" />
                  <span>Thermal Receipt & Printing Engine</span>
                </h2>
                <p className="text-xs text-[#73706B] mt-0.5">
                  Customizes text, Wi-Fi passwords, and layout for point-of-sale thermal printers.
                </p>
              </div>
              <button
                type="button"
                onClick={handleTestPrint}
                className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#333] text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Test Print</span>
              </button>
            </div>

            <div className="space-y-4">
              {/* Paper Width */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                  Thermal Paper Width Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => updateReceipt({ printerType: '80mm' })}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      settings.receipt.printerType === '80mm'
                        ? 'border-[#0b1221] bg-[#0b1221] text-white'
                        : 'border-[#E5E2DA] bg-[#FDFCF9] text-[#1A1A1A]'
                    }`}
                  >
                    <div className="font-bold text-xs">80mm Standard Roll</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Commercial restaurant thermal printers</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => updateReceipt({ printerType: '58mm' })}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      settings.receipt.printerType === '58mm'
                        ? 'border-[#0b1221] bg-[#0b1221] text-white'
                        : 'border-[#E5E2DA] bg-[#FDFCF9] text-[#1A1A1A]'
                    }`}
                  >
                    <div className="font-bold text-xs">58mm Compact Roll</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Portable Bluetooth / Handheld POS terminals</div>
                  </button>
                </div>
              </div>

              {/* Header Text */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                  Receipt Header Notice (Top of Bill)
                </label>
                <textarea
                  rows={2}
                  value={settings.receipt.headerText}
                  onChange={(e) => updateReceipt({ headerText: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282] font-mono"
                />
              </div>

              {/* Footer Text */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                  Receipt Footer Notice (Bottom of Bill)
                </label>
                <textarea
                  rows={2}
                  value={settings.receipt.footerText}
                  onChange={(e) => updateReceipt({ footerText: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282] font-mono"
                />
              </div>

              {/* Wi-Fi Password */}
              <div className="bg-[#FDFCF9] p-3.5 rounded-lg border border-[#E5E2DA] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#1A1A1A] flex items-center gap-1.5">
                    <Wifi className="w-4 h-4 text-[#2563eb]" />
                    <span>Print Guest Wi-Fi Password on Bill</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={settings.receipt.showWifiPassword}
                    onChange={(e) => updateReceipt({ showWifiPassword: e.target.checked })}
                    className="w-4 h-4 text-[#0b1221] rounded"
                  />
                </div>
                {settings.receipt.showWifiPassword && (
                  <div>
                    <input
                      type="text"
                      placeholder="e.g. DineVIPGuest2026"
                      value={settings.receipt.wifiPassword || ''}
                      onChange={(e) => updateReceipt({ wifiPassword: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E2DA] rounded-md font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Toggles */}
              <div className="space-y-2 pt-2 border-t border-[#E5E2DA]">
                {[
                  {
                    key: 'showDuplicateWatermark',
                    label: 'Mandatory *** DUPLICATE REPRINT *** Watermark',
                    desc: 'Protects kitchen and floor from double-serving previously closed tickets.'
                  },
                  {
                    key: 'showVatBreakdown',
                    label: 'Itemize VAT Amount on Slip',
                    desc: 'Displays the exact computed tax component under the subtotal.'
                  },
                  {
                    key: 'showCashierName',
                    label: 'Print Cashier & Attendant Name',
                    desc: 'Enhances till accountability and tip allocation.'
                  }
                ].map(item => (
                  <label key={item.key} className="flex items-start gap-2.5 cursor-pointer py-1">
                    <input
                      type="checkbox"
                      checked={(settings.receipt as any)[item.key]}
                      onChange={(e) => updateReceipt({ [item.key]: e.target.checked })}
                      className="w-4 h-4 mt-0.5 text-[#0b1221] rounded"
                    />
                    <div>
                      <div className="text-xs font-bold text-[#1A1A1A]">{item.label}</div>
                      <div className="text-[10px] text-[#73706B]">{item.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Live Receipt Preview Column (5 Cols) */}
          <div className="lg:col-span-5 bg-[#F5F4EF] p-6 rounded-xl border border-[#E5E2DA] flex flex-col items-center">
            <span className="text-[10px] font-bold uppercase text-[#73706B] tracking-wider mb-2">
              Live Simulated Thermal Slip Preview
            </span>

            {/* Paper Slip Mockup */}
            <div className="w-full max-w-[320px] bg-white border-2 border-dashed border-[#ccc] p-5 shadow-md font-mono text-[11px] text-[#1A1A1A] rounded-xs select-none">
              <div className="text-center">
                <div className="font-black text-sm uppercase tracking-tight">{settings.profile.name}</div>
                <div className="text-[9px] text-[#555] mt-1">{settings.profile.address}</div>
                <div className="text-[9px] text-[#555]">Tel: {settings.profile.phone}</div>
                <div className="border-b border-dashed border-black my-2"></div>

                <div className="font-bold text-[10px]">OFFICIAL RECEIPT</div>
                <div className="flex justify-between text-[9px] text-[#444] mt-1">
                  <span>Ticket: ORD-2026-0102</span>
                  <span>Table 08</span>
                </div>
                <div className="flex justify-between text-[9px] text-[#444]">
                  <span>Date: 18-Oct-2026</span>
                  <span>12:45 PM</span>
                </div>
                {settings.receipt.showCashierName && (
                  <div className="text-left text-[9px] text-[#444]">
                    Attendant: {cashierName}
                  </div>
                )}
                <div className="border-b border-dashed border-black my-2"></div>
              </div>

              {/* Items */}
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span>3x Fried Rice Special</span>
                  <span>₦10,500</span>
                </div>
                <div className="flex justify-between">
                  <span>3x Grilled Catfish</span>
                  <span>₦16,500</span>
                </div>
                <div className="flex justify-between">
                  <span>3x Fresh Chapman</span>
                  <span>₦1,500</span>
                </div>
              </div>

              <div className="border-b border-dashed border-black my-2"></div>

              {/* Totals */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span>Subtotal:</span>
                  <span>₦28,500</span>
                </div>
                {settings.receipt.showVatBreakdown && (
                  <div className="flex justify-between text-[10px]">
                    <span>VAT ({settings.profile.defaultVatRate}%):</span>
                    <span>₦1,425</span>
                  </div>
                )}
                <div className="flex justify-between text-xs font-black pt-1 border-t border-black">
                  <span>TOTAL PAID:</span>
                  <span>₦29,925</span>
                </div>
                <div className="flex justify-between text-[9px] text-[#555]">
                  <span>Payment Mode:</span>
                  <span>Bank Transfer</span>
                </div>
              </div>

              <div className="border-b border-dashed border-black my-2"></div>

              {/* Header / Footer Text */}
              {settings.receipt.headerText && (
                <div className="text-center text-[9px] whitespace-pre-wrap leading-tight text-[#444] mb-2">
                  {settings.receipt.headerText}
                </div>
              )}

              {settings.receipt.showWifiPassword && settings.receipt.wifiPassword && (
                <div className="text-center text-[9px] font-bold p-1 bg-gray-50 border border-gray-300 rounded mb-2">
                  📶 Guest Wi-Fi: {settings.receipt.wifiPassword}
                </div>
              )}

              {settings.receipt.footerText && (
                <div className="text-center text-[9px] whitespace-pre-wrap leading-tight text-[#444]">
                  {settings.receipt.footerText}
                </div>
              )}

              <div className="text-center text-[8px] text-[#888] mt-2">
                Powered by Restaurant Management System
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: POS & FLOOR OPERATIONS */}
      {/* ============================================================== */}
      {activeTab === 'pos' && (
        <div className="bg-white p-6 rounded-xl border border-[#E5E2DA] shadow-sm space-y-6">
          <div className="border-b border-[#E5E2DA] pb-3">
            <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
              <Monitor className="w-5 h-5 text-[#b45309]" />
              <span>Point of Sale (POS) & Floor Service Rules</span>
            </h2>
            <p className="text-xs text-[#73706B] mt-0.5">
              Control order dispatch, table auto-release workflows, and fraud-prevention supervisor PINs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Default Dining Type */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                Default Order Type on POS Launch
              </label>
              <select
                value={settings.pos.defaultDiningType}
                onChange={(e) => updatePOS({ defaultDiningType: e.target.value as any })}
                className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
              >
                <option value="Dine-In">🍽️ Dine-In (Table Seating)</option>
                <option value="Takeaway">🛍️ Takeaway (Counter Pickup)</option>
                <option value="Home / Office Delivery">🚚 Home / Office Delivery (Dispatch)</option>
              </select>
            </div>

            {/* Manager PIN Code */}
            <div>
              <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                Supervisor Override Security PIN
              </label>
              <input
                type="password"
                maxLength={6}
                value={settings.pos.managerPin}
                onChange={(e) => updatePOS({ managerPin: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono font-bold bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
              />
              <span className="text-[10px] text-[#73706B] mt-0.5 block">
                Required for cashiers to void placed tickets or apply manual bill discounts.
              </span>
            </div>

            {/* Toggles */}
            <div className="md:col-span-2 space-y-3 pt-2">
              {[
                {
                  key: 'autoReleaseTableOnPaid',
                  label: 'Auto-Release Table on Payment Settlement',
                  desc: 'When an order is paid in full, automatically set the corresponding table status from "Occupied" to "Available".'
                },
                {
                  key: 'requireManagerPinForVoid',
                  label: 'Require Manager PIN to Void Placed Orders',
                  desc: 'Prevents staff theft by requiring authorization before cancelling orders already routed to the kitchen.'
                },
                {
                  key: 'requireManagerPinForDiscount',
                  label: 'Require Manager PIN to Apply Bill Discounts',
                  desc: 'Guarantees that price deductions or promotional discounts are vetted by the duty manager.'
                },
                {
                  key: 'allowCustomNotesOnItems',
                  label: 'Enable Custom Cooking Notes & Allergens on Items',
                  desc: 'Lets waiters append specific guest instructions (e.g., "Extra spicy", "No salt") on tickets.'
                },
                {
                  key: 'enableStockDeductionOnSale',
                  label: 'Real-Time Inventory Stock Deduction',
                  desc: 'Deducts recipe ingredients and beverage inventory units automatically whenever an order is served.'
                }
              ].map(item => (
                <div key={item.key} className="flex items-start gap-3 p-3 bg-[#FDFCF9] rounded-lg border border-[#E5E2DA]">
                  <input
                    type="checkbox"
                    checked={(settings.pos as any)[item.key]}
                    onChange={(e) => updatePOS({ [item.key]: e.target.checked })}
                    className="w-4 h-4 mt-0.5 text-[#0b1221] rounded"
                  />
                  <div>
                    <div className="text-xs font-bold text-[#1A1A1A]">{item.label}</div>
                    <div className="text-[11px] text-[#73706B] leading-tight">{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 4: PAYMENT CHANNELS & DESIGNATED BANK ACCOUNTS */}
      {/* ============================================================== */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          {/* Payment Channels Grid */}
          <div className="bg-white p-6 rounded-xl border border-[#E5E2DA] shadow-sm space-y-4">
            <div className="border-b border-[#E5E2DA] pb-3">
              <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-[#b45309]" />
                <span>Active Payment Methods in Restaurant POS</span>
              </h2>
              <p className="text-xs text-[#73706B] mt-0.5">
                Enable or disable payment channels presented to cashiers at checkout.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {(['Cash', 'POS Machine', 'Bank Transfer', 'Opay', 'Moniepoint'] as const).map(method => {
                const isEnabled = settings.payment.enabledMethods.includes(method);
                return (
                  <button
                    key={method}
                    type="button"
                    onClick={() => handleTogglePaymentMethod(method)}
                    className={`p-3.5 rounded-xl border text-center transition-all cursor-pointer ${
                      isEnabled
                        ? 'border-[#024628] bg-emerald-50 text-[#024628] shadow-xs'
                        : 'border-[#E5E2DA] bg-gray-50 text-gray-400 opacity-60'
                    }`}
                  >
                    <div className="text-xs font-black">{method}</div>
                    <div className="text-[10px] font-bold mt-1">
                      {isEnabled ? '✓ Enabled' : '✕ Disabled'}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 text-xs font-bold text-[#1A1A1A] cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.payment.requireBankTransferReference}
                  onChange={(e) => updatePayment({ requireBankTransferReference: e.target.checked })}
                  className="w-4 h-4 text-[#0b1221] rounded"
                />
                <span>Mandatory Bank Transaction Reference (Require cashier to enter TRX number on transfer settlement)</span>
              </label>
            </div>
          </div>

          {/* Designated Bank Accounts Manager */}
          <div className="bg-white p-6 rounded-xl border border-[#E5E2DA] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#1A1A1A] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#2563eb]" />
                  <span>Designated Restaurant Bank Accounts for Customer Transfers</span>
                </h3>
                <p className="text-xs text-[#73706B]">
                  Accounts displayed on customer bill slips and cashier settlement screens for direct transfers.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNewBankFormOpen(true)}
                className="px-3 py-1.5 bg-[#0b1221] hover:bg-[#1e293b] text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Bank Account</span>
              </button>
            </div>

            {/* Bank Accounts List */}
            <div className="space-y-3">
              {settings.payment.bankAccounts.map(b => (
                <div
                  key={b.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 transition-all ${
                    b.isPrimary
                      ? 'border-[#C8B282] bg-[#FDFCF9]'
                      : 'border-[#E5E2DA] bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <strong className="text-sm text-[#1A1A1A]">{b.bankName}</strong>
                      {b.isPrimary && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-[#0b1221] text-[#C8B282]">
                          ★ Primary Account
                        </span>
                      )}
                    </div>
                    <div className="font-mono text-base font-black text-[#024628] mt-1 tracking-wider">
                      {b.accountNumber}
                    </div>
                    <div className="text-xs text-[#73706B] mt-0.5">
                      Account Name: <strong>{b.accountName}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    {!b.isPrimary && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimaryBank(b.id)}
                        className="px-2.5 py-1 text-xs font-bold text-[#2563eb] hover:bg-blue-50 rounded"
                      >
                        Set as Primary
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteBankAccount(b.id)}
                      className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                      title="Delete Bank Account"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Bank Form Modal/Drawer */}
            {newBankFormOpen && (
              <div className="bg-[#FDFCF9] p-4 rounded-xl border border-[#C8B282] space-y-3 mt-4 animate-fadeIn">
                <h4 className="text-xs font-black uppercase text-[#1A1A1A] tracking-wider">
                  Add New Restaurant Bank Account
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#73706B] mb-1">Bank Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Zenith Bank Plc"
                      value={newBank.bankName}
                      onChange={(e) => setNewBank({ ...newBank, bankName: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E2DA] rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#73706B] mb-1">Account Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Restaurant Ops Account"
                      value={newBank.accountName}
                      onChange={(e) => setNewBank({ ...newBank, accountName: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E2DA] rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-[#73706B] mb-1">Account Number *</label>
                    <input
                      type="text"
                      placeholder="10-digit NUBAN"
                      value={newBank.accountNumber}
                      onChange={(e) => setNewBank({ ...newBank, accountNumber: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white border border-[#E5E2DA] rounded font-mono"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setNewBankFormOpen(false)}
                    className="px-3 py-1 text-xs text-[#73706B] font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddBankAccount}
                    className="px-3.5 py-1 bg-[#0b1221] text-white text-xs font-bold rounded"
                  >
                    Save Account
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 5: KITCHEN DISPLAY (KDS) & PREP TIMERS */}
      {/* ============================================================== */}
      {activeTab === 'kds' && (
        <div className="bg-white p-6 rounded-xl border border-[#E5E2DA] shadow-sm space-y-6">
          <div className="border-b border-[#E5E2DA] pb-3">
            <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#b45309]" />
              <span>Kitchen Display Screen (KDS) & Cooking Benchmarks</span>
            </h2>
            <p className="text-xs text-[#73706B] mt-0.5">
              Set target preparation time thresholds and kitchen display audio alerts.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Target Prep Time */}
            <div className="p-4 bg-[#f0fdf4] rounded-xl border border-[#bbf7d0]">
              <span className="text-[10px] font-bold uppercase text-emerald-800 tracking-wider block mb-1">
                Target Meal Preparation
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="5"
                  max="60"
                  value={settings.kds.targetPrepTimeMinutes}
                  onChange={(e) => updateKDS({ targetPrepTimeMinutes: parseInt(e.target.value) || 15 })}
                  className="w-24 px-3 py-2 text-base font-mono font-bold bg-white border border-emerald-300 rounded-lg"
                />
                <span className="text-xs font-bold text-emerald-900">Minutes</span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-2">
                Standard cooking time window before tickets are flagged as delayed.
              </p>
            </div>

            {/* Warning Prep Time */}
            <div className="p-4 bg-[#fffbeb] rounded-xl border border-[#fef3c7]">
              <span className="text-[10px] font-bold uppercase text-amber-800 tracking-wider block mb-1">
                Warning Threshold (Amber Alert)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="10"
                  max="90"
                  value={settings.kds.warningPrepTimeMinutes}
                  onChange={(e) => updateKDS({ warningPrepTimeMinutes: parseInt(e.target.value) || 20 })}
                  className="w-24 px-3 py-2 text-base font-mono font-bold bg-white border border-amber-300 rounded-lg"
                />
                <span className="text-xs font-bold text-amber-900">Minutes</span>
              </div>
              <p className="text-[11px] text-amber-700 mt-2">
                Tickets turn amber on kitchen display screens to alert head chef.
              </p>
            </div>

            {/* Critical Prep Time */}
            <div className="p-4 bg-[#fef2f2] rounded-xl border border-[#fecaca]">
              <span className="text-[10px] font-bold uppercase text-red-800 tracking-wider block mb-1">
                Critical Threshold (Flashing Red)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="15"
                  max="120"
                  value={settings.kds.criticalPrepTimeMinutes}
                  onChange={(e) => updateKDS({ criticalPrepTimeMinutes: parseInt(e.target.value) || 25 })}
                  className="w-24 px-3 py-2 text-base font-mono font-bold bg-white border border-red-300 rounded-lg"
                />
                <span className="text-xs font-bold text-red-900">Minutes</span>
              </div>
              <p className="text-[11px] text-red-700 mt-2">
                Severe kitchen delay. Triggers supervisor notification on POS.
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-[#E5E2DA]">
            <label className="flex items-center gap-2.5 text-xs font-bold text-[#1A1A1A] cursor-pointer">
              <input
                type="checkbox"
                checked={settings.kds.playAudioChimeOnNewOrder}
                onChange={(e) => updateKDS({ playAudioChimeOnNewOrder: e.target.checked })}
                className="w-4 h-4 text-[#0b1221] rounded"
              />
              <span>Kitchen Display Audio Chime (Plays sound on kitchen screen when POS cashier sends order to kitchen)</span>
            </label>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 6: BACKUP & DATA DISASTER RECOVERY */}
      {/* ============================================================== */}
      {activeTab === 'backup' && (
        <div className="bg-white p-6 rounded-xl border border-[#E5E2DA] shadow-sm space-y-6">
          <div className="border-b border-[#E5E2DA] pb-3">
            <h2 className="text-base font-bold text-[#1A1A1A] flex items-center gap-2">
              <Database className="w-5 h-5 text-[#b45309]" />
              <span>Database Backup, Disaster Recovery & Factory Reset</span>
            </h2>
            <p className="text-xs text-[#73706B] mt-0.5">
              Download your complete operational database (menu, orders, CRM, suppliers, audit ledger) or restore to a new PC.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Backup Card */}
            <div className="p-5 bg-[#FDFCF9] rounded-xl border border-[#E5E2DA] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-[#0b1221] text-[#C8B282] flex items-center justify-center mb-3">
                  <Download className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#1A1A1A]">1-Click Complete System Backup</h3>
                <p className="text-xs text-[#73706B] mt-1.5 leading-relaxed">
                  Generates an encrypted single-file snapshot containing all orders, recipes, inventory records, supplier balances, expense vouchers, customer profiles, and the audit ledger.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportFullBackup}
                className="mt-5 w-full py-2.5 bg-[#0b1221] hover:bg-[#1e293b] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <Download className="w-4 h-4 text-[#C8B282]" />
                <span>Download Full Database Backup (.JSON)</span>
              </button>
            </div>

            {/* Restore Card */}
            <div className="p-5 bg-[#FDFCF9] rounded-xl border border-[#E5E2DA] flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-lg bg-emerald-900 text-emerald-300 flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm text-[#1A1A1A]">Restore System from Backup File</h3>
                <p className="text-xs text-[#73706B] mt-1.5 leading-relaxed">
                  Migrate this restaurant instance to a new cashier computer, tablet, or restore historical data after clearing browser caches.
                </p>
              </div>

              <label className="mt-5 w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm">
                <Upload className="w-4 h-4" />
                <span>Select .JSON Backup File to Restore</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Reset Defaults Confirmation Modal */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-red-200">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-full bg-red-100 text-red-700">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1A1A]">Reset Settings to Defaults?</h3>
                <p className="text-xs text-[#73706B] mt-0.5">This will restore original parameters.</p>
              </div>
            </div>

            <p className="text-xs text-[#555] leading-relaxed">
              Your business profile, receipt headers, default VAT rate, and bank accounts will revert to initial factory defaults. Your menu items, orders, and customer records will not be deleted.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E5E2DA]">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-3.5 py-1.5 text-xs text-[#73706B] font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetDefaults}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
