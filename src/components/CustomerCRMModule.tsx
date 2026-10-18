import React, { useState, useEffect, useMemo } from 'react';
import type { 
  CustomerProfile, 
  CustomerTier, 
  CustomerSegment, 
  MarketingCampaign, 
  RestaurantOrder 
} from '../types';
import { 
  INITIAL_CUSTOMERS, 
  INITIAL_MARKETING_CAMPAIGNS, 
  LOYALTY_REWARDS, 
  type LoyaltyReward 
} from '../data/customerData';
import { formatNaira } from '../utils/formatters';
import { 
  Users, 
  UserCheck, 
  Star, 
  Award, 
  Heart, 
  MessageSquare, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  Search, 
  Filter, 
  Plus, 
  Download, 
  Printer, 
  ShieldAlert, 
  Sparkles, 
  Building2, 
  UtensilsCrossed, 
  Check, 
  X, 
  Send, 
  Gift, 
  Eye, 
  Edit3, 
  Cake,
  Receipt,
  Share2,
  SlidersHorizontal,
  ChevronDown,
  LayoutGrid,
  Table as TableIcon
} from 'lucide-react';

interface CustomerCRMModuleProps {
  orders?: RestaurantOrder[];
  onOpenInPos?: (tableOrRoom: string, customerName: string) => void;
  onOpenReservations?: (customerName: string) => void;
  onReprintReceipt?: (order: RestaurantOrder) => void;
  cashierName?: string;
}

const STORAGE_KEY = 'restaurant_management_customers';
const LEGACY_STORAGE_KEY = 'fulbe_restaurant_customers';

// Dietary options chips for tagging
const DIETARY_OPTIONS = [
  'Halal Only',
  'Nut Allergy (Strict)',
  'No Shellfish',
  'Gluten-Free',
  'Low Sodium',
  'Mild Pepper Only',
  'Extra Pepper / Spicy',
  'Vegetarian',
  'Dairy-Free'
];

export const CustomerCRMModule: React.FC<CustomerCRMModuleProps> = ({
  orders = [],
  onOpenInPos,
  onOpenReservations,
  onReprintReceipt
}) => {
  // Multi-tier storage initialization
  const [customers, setCustomers] = useState<CustomerProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
      const session = sessionStorage.getItem(STORAGE_KEY);
      if (session) return JSON.parse(session);
    } catch (e) {
      console.warn('Failed to parse saved customers:', e);
    }
    return INITIAL_CUSTOMERS;
  });

  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(INITIAL_MARKETING_CAMPAIGNS);

  // Sync to persistence
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(customers));
    } catch (e) {
      console.error('Failed to persist customers:', e);
    }
  }, [customers]);

  // Main navigation tabs inside CRM
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'campaigns' | 'loyalty'>('directory');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSegment, setSelectedSegment] = useState<string>('All');
  const [selectedTier, setSelectedTier] = useState<string>('All');
  const [selectedDietary, setSelectedDietary] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'spend' | 'visits' | 'points' | 'name' | 'recent'>('spend');
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards');

  // Active Selected Customer for 360° Profile Drawer / Modal
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerProfile | null>(null);

  // WhatsApp & Outreach Modal State
  const [isOutreachModalOpen, setIsOutreachModalOpen] = useState(false);
  const [outreachCustomer, setOutreachCustomer] = useState<CustomerProfile | null>(null);
  const [outreachTemplate, setOutreachTemplate] = useState<string>('vip_invite');
  const [customOutreachMsg, setCustomOutreachMsg] = useState<string>('');
  const [copySuccessToast, setCopySuccessToast] = useState(false);

  // Add / Edit Customer Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<CustomerProfile | null>(null);
  const [customerForm, setCustomerForm] = useState({
    name: '',
    phone: '',
    email: '',
    company: '',
    segment: 'Regular / Loyal' as CustomerSegment,
    tier: 'Bronze' as CustomerTier,
    favoriteDish: '',
    preferredSeating: '',
    dietaryRestrictions: [] as string[],
    birthday: '',
    anniversary: '',
    notes: '',
    address: ''
  });

  // Loyalty Points Adjustment Modal
  const [isPointsModalOpen, setIsPointsModalOpen] = useState(false);
  const [pointsDelta, setPointsDelta] = useState<number>(100);
  const [pointsReason, setPointsReason] = useState<string>('Dining Spend Bonus');

  // Campaign Simulator Modal State
  const [simulatedCampaign, setSimulatedCampaign] = useState<MarketingCampaign | null>(null);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [campaignSuccessToast, setCampaignSuccessToast] = useState<string | null>(null);

  // Computed KPI Metrics
  const metrics = useMemo(() => {
    const totalCustomers = customers.length;
    const totalLTV = customers.reduce((sum, c) => sum + c.totalSpent, 0);
    const totalVisits = customers.reduce((sum, c) => sum + c.totalOrders, 0);
    const aov = totalVisits > 0 ? Math.round(totalLTV / totalVisits) : 0;
    const vipAndCorporate = customers.filter(
      c => c.segment === 'VIP / Elite' || c.segment === 'Corporate Account'
    ).length;
    const totalPoints = customers.reduce((sum, c) => sum + c.loyaltyPoints, 0);
    const atRiskCount = customers.filter(c => c.segment === 'At-Risk / Inactive').length;

    return {
      totalCustomers,
      totalLTV,
      aov,
      vipAndCorporate,
      totalPoints,
      atRiskCount
    };
  }, [customers]);

  // Filtered & Sorted Customers
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company && c.company.toLowerCase().includes(q)) ||
        (c.favoriteDish && c.favoriteDish.toLowerCase().includes(q));

      const matchesSegment = selectedSegment === 'All' || c.segment === selectedSegment;
      const matchesTier = selectedTier === 'All' || c.tier === selectedTier;
      const matchesDietary = selectedDietary === 'All' || (c.dietaryRestrictions && c.dietaryRestrictions.includes(selectedDietary));

      return matchesSearch && matchesSegment && matchesTier && matchesDietary;
    }).sort((a, b) => {
      if (sortBy === 'spend') return b.totalSpent - a.totalSpent;
      if (sortBy === 'visits') return b.totalOrders - a.totalOrders;
      if (sortBy === 'points') return b.loyaltyPoints - a.loyaltyPoints;
      if (sortBy === 'recent') return new Date(b.lastVisitDate).getTime() - new Date(a.lastVisitDate).getTime();
      return a.name.localeCompare(b.name);
    });
  }, [customers, searchQuery, selectedSegment, selectedTier, selectedDietary, sortBy]);

  // Orders linked to the selected customer
  const customerOrders = useMemo(() => {
    if (!selectedCustomer) return [];
    return orders.filter(o => 
      o.customerName && 
      (o.customerName.toLowerCase().includes(selectedCustomer.name.toLowerCase()) ||
       selectedCustomer.name.toLowerCase().includes(o.customerName.toLowerCase()))
    );
  }, [selectedCustomer, orders]);

  // Handlers for Add/Edit Customer
  const handleOpenAddCustomer = () => {
    setEditingCustomer(null);
    setCustomerForm({
      name: '',
      phone: '',
      email: '',
      company: '',
      segment: 'New Diner',
      tier: 'Bronze',
      favoriteDish: '',
      preferredSeating: 'Main Dining Hall',
      dietaryRestrictions: [],
      birthday: '',
      anniversary: '',
      notes: '',
      address: ''
    });
    setIsEditModalOpen(true);
  };

  const handleOpenEditCustomer = (c: CustomerProfile) => {
    setEditingCustomer(c);
    setCustomerForm({
      name: c.name,
      phone: c.phone,
      email: c.email,
      company: c.company || '',
      segment: c.segment,
      tier: c.tier,
      favoriteDish: c.favoriteDish || '',
      preferredSeating: c.preferredSeating || '',
      dietaryRestrictions: c.dietaryRestrictions || [],
      birthday: c.birthday || '',
      anniversary: c.anniversary || '',
      notes: c.notes || '',
      address: c.address || ''
    });
    setIsEditModalOpen(true);
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      alert('Please provide customer name and phone number.');
      return;
    }

    if (editingCustomer) {
      // Update existing
      setCustomers(prev => prev.map(c => {
        if (c.id === editingCustomer.id) {
          const updated: CustomerProfile = {
            ...c,
            ...customerForm
          };
          if (selectedCustomer && selectedCustomer.id === c.id) {
            setSelectedCustomer(updated);
          }
          return updated;
        }
        return c;
      }));
    } else {
      // Add new
      const newId = `CUST-2026-${String(customers.length + 1).padStart(3, '0')}`;
      const newCust: CustomerProfile = {
        id: newId,
        ...customerForm,
        loyaltyPoints: 100, // Welcome signup bonus
        totalSpent: 0,
        totalOrders: 0,
        lastVisitDate: new Date().toISOString().split('T')[0],
        averageOrderValue: 0,
        rating: 5,
        createdAt: new Date().toISOString().split('T')[0],
        status: 'Active'
      };
      setCustomers(prev => [newCust, ...prev]);
      setSelectedCustomer(newCust);
    }

    setIsEditModalOpen(false);
  };

  // Toggle dietary tag in form
  const handleToggleDietary = (item: string) => {
    setCustomerForm(prev => {
      const exists = prev.dietaryRestrictions.includes(item);
      if (exists) {
        return { ...prev, dietaryRestrictions: prev.dietaryRestrictions.filter(d => d !== item) };
      }
      return { ...prev, dietaryRestrictions: [...prev.dietaryRestrictions, item] };
    });
  };

  // Points adjustments
  const handleApplyPoints = () => {
    if (!selectedCustomer) return;
    const newPoints = Math.max(0, selectedCustomer.loyaltyPoints + pointsDelta);
    
    // Auto tier calibration
    let newTier: CustomerTier = selectedCustomer.tier;
    if (newPoints >= 3000 || selectedCustomer.totalSpent >= 400000) newTier = 'Platinum VIP';
    else if (newPoints >= 1500 || selectedCustomer.totalSpent >= 200000) newTier = 'Gold';
    else if (newPoints >= 600 || selectedCustomer.totalSpent >= 100000) newTier = 'Silver';

    setCustomers(prev => prev.map(c => {
      if (c.id === selectedCustomer.id) {
        const updated = {
          ...c,
          loyaltyPoints: newPoints,
          tier: newTier
        };
        setSelectedCustomer(updated);
        return updated;
      }
      return c;
    }));

    setIsPointsModalOpen(false);
  };

  // Direct WhatsApp & Outreach launcher
  const handleOpenOutreach = (c: CustomerProfile, defaultTemplate = 'vip_invite') => {
    setOutreachCustomer(c);
    setOutreachTemplate(defaultTemplate);
    let initialText = '';
    if (defaultTemplate === 'vip_invite') {
      initialText = `Dear ${c.name}, as our esteemed ${c.tier} guest at Restaurant Management System, Chef cordially invites you for an exclusive tasting of our new flame-grilled weekend specials with priority table allocation. Reply to reserve your preferred table!`;
    } else if (defaultTemplate === 'miss_you') {
      initialText = `Hello ${c.name}, we miss having you at Restaurant Management System! Enjoy 15% off your next dining experience this week with promo code WELCOMEBACK15. Reserve directly by replying to this message!`;
    } else if (defaultTemplate === 'anniversary') {
      initialText = `Happy Celebration Season ${c.name}! 🎉 Book your table with us this week and receive a complimentary Celebration Sparkling Toast and Chef’s Dessert Platter for your table!`;
    } else if (defaultTemplate === 'corporate') {
      initialText = `Dear ${c.name} (${c.company || 'Corporate Team'}), elevate your team lunch meetings with our bespoke executive catering. Priority dispatch, zero delivery charges, and itemized A4 Corporate Tax Invoices with TIN breakdown.`;
    } else {
      initialText = `Hello ${c.name}, greeting from Restaurant Management System! We look forward to hosting you again soon.`;
    }
    setCustomOutreachMsg(initialText);
    setIsOutreachModalOpen(true);
  };

  const handleLaunchWhatsApp = () => {
    if (!outreachCustomer) return;
    const cleanPhone = outreachCustomer.phone.replace(/[^0-9]/g, '');
    const intlPhone = cleanPhone.startsWith('0') ? '234' + cleanPhone.slice(1) : cleanPhone;
    const url = `https://wa.me/${intlPhone}?text=${encodeURIComponent(customOutreachMsg)}`;
    window.open(url, '_blank');
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(customOutreachMsg);
    setCopySuccessToast(true);
    setTimeout(() => setCopySuccessToast(false), 2500);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = [
      'Customer ID',
      'Name',
      'Phone',
      'Email',
      'Company',
      'Segment',
      'Tier',
      'Loyalty Points',
      'Total Spent (NGN)',
      'Total Orders',
      'Average Order Value (NGN)',
      'Last Visit Date',
      'Favorite Dish',
      'Dietary Restrictions',
      'Notes'
    ];

    const rows = filteredCustomers.map(c => [
      `"${c.id}"`,
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      `"${c.email}"`,
      `"${(c.company || '').replace(/"/g, '""')}"`,
      `"${c.segment}"`,
      `"${c.tier}"`,
      c.loyaltyPoints,
      c.totalSpent,
      c.totalOrders,
      c.averageOrderValue,
      `"${c.lastVisitDate}"`,
      `"${(c.favoriteDish || '').replace(/"/g, '""')}"`,
      `"${(c.dietaryRestrictions || []).join('; ')}"`,
      `"${(c.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Customers_CRM_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Print VIP Register (A4 Maître d' guest sheet)
  const handlePrintVIPRegister = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the VIP Register.');
      return;
    }

    const rowsHtml = filteredCustomers.map((c, idx) => `
      <tr>
        <td style="padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 11px;">${idx + 1}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 11px;">
          <strong>${c.name}</strong>
          ${c.company ? `<div style="color: #666; font-size: 10px;">${c.company}</div>` : ''}
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 11px;">
          <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 9px; ${
            c.tier === 'Platinum VIP' ? 'background: #0f172a; color: #f59e0b;' :
            c.tier === 'Gold' ? 'background: #fef3c7; color: #b45309;' :
            c.tier === 'Silver' ? 'background: #e2e8f0; color: #334155;' : 'background: #f1f5f9; color: #64748b;'
          }">${c.tier}</span>
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 11px; font-family: monospace;">${c.phone}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 11px;">
          ${(c.dietaryRestrictions || []).length > 0 ? 
            `<strong style="color: #b91c1c;">⚠️ ${(c.dietaryRestrictions || []).join(', ')}</strong>` : 
            `<span style="color: #888;">Standard</span>`
          }
        </td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 11px;">${c.preferredSeating || 'Standard'}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 11px; text-align: right; font-family: monospace; font-weight: bold;">${formatNaira(c.totalSpent)}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #ddd; font-size: 10px; color: #555; max-width: 180px;">${c.notes || '-'}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>VIP & Guest Registry - Restaurant Management System</title>
          <meta charset="utf-8" />
          <style>
            @page { size: A4 landscape; margin: 12mm; }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
              color: #1a1a1a;
              margin: 0;
              padding: 20px;
            }
            .header {
              border-bottom: 2px solid #0b1221;
              padding-bottom: 14px;
              margin-bottom: 16px;
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
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            th {
              background: #0b1221;
              color: #fff;
              text-align: left;
              padding: 8px 10px;
              font-size: 10px;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="sub">Front-of-House Intelligence & Maître d' Register</div>
              <div class="title">RESTAURANT MANAGEMENT SYSTEM — VIP GUEST REGISTRY</div>
              <div style="font-size: 11px; color: #666; margin-top: 4px;">Audited Customer CRM Directory • Allergy & Preference Alerts</div>
            </div>
            <div style="text-align: right; font-size: 11px; color: #555;">
              <div>Printed: ${new Date().toLocaleDateString('en-GB')} at ${new Date().toLocaleTimeString()}</div>
              <div>Active Guests in Scope: <strong>${filteredCustomers.length}</strong></div>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th style="width: 30px;">#</th>
                <th>Guest Name & Company</th>
                <th style="width: 90px;">Tier</th>
                <th style="width: 110px;">Phone</th>
                <th>Dietary / Allergy Alerts</th>
                <th>Preferred Seating</th>
                <th style="text-align: right; width: 110px;">Lifetime Spend</th>
                <th>Service Notes</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // Helper for tier badges
  const renderTierBadge = (tier: CustomerTier) => {
    switch (tier) {
      case 'Platinum VIP':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#0f172a] text-[#fbbf24] border border-[#f59e0b]/40 shadow-sm">
            <Sparkles className="w-3 h-3 text-[#f59e0b]" />
            Platinum VIP
          </span>
        );
      case 'Gold':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#fef3c7] text-[#92400e] border border-[#fcd34d]">
            <Award className="w-3 h-3 text-[#b45309]" />
            Gold Tier
          </span>
        );
      case 'Silver':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f1f5f9] text-[#334155] border border-[#cbd5e1]">
            <Award className="w-3 h-3 text-[#64748b]" />
            Silver Tier
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#fafaf9] text-[#78716c] border border-[#e7e5e4]">
            Bronze
          </span>
        );
    }
  };

  // Helper for segment pill
  const renderSegmentPill = (segment: CustomerSegment) => {
    switch (segment) {
      case 'VIP / Elite':
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-[#ede9fe] text-[#6d28d9]">VIP / Elite</span>;
      case 'Corporate Account':
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-[#dbeafe] text-[#1d4ed8]">Corporate Account</span>;
      case 'Regular / Loyal':
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-[#dcfce7] text-[#15803d]">Regular Diner</span>;
      case 'New Diner':
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-[#ffedd5] text-[#c2410c]">New Diner</span>;
      case 'At-Risk / Inactive':
        return <span className="px-2 py-0.5 text-[9px] font-bold rounded bg-[#fee2e2] text-[#b91c1c]">At-Risk (Inactive)</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {campaignSuccessToast && (
        <div className="bg-[#024628] text-white px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-lg border border-[#166c43] animate-fadeIn">
          <div className="flex items-center gap-2">
            <Check className="w-4 h-4 text-[#8cd6b0]" />
            <span>{campaignSuccessToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setCampaignSuccessToast(null)}
            className="text-white/80 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Banner & Module Persona Intro */}
      <div className="bg-[#0b1221] text-white p-6 rounded-xl border border-[#1e293b] shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 bg-[#b45309] text-white font-black text-[9px] uppercase tracking-widest rounded">
              CHIEF MARKETING & CRM HUB
            </span>
            <span className="text-[10px] text-[#94a3b8] uppercase tracking-wider font-semibold">
              Guest Retention • Lifetime Value (LTV) • Direct WhatsApp Marketing
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif italic text-white flex items-center gap-2">
            <Users className="w-7 h-7 text-[#C8B282]" />
            <span>Customer CRM & Guest Intelligence</span>
          </h1>
          <p className="text-xs text-[#cbd5e1] font-light max-w-2xl mt-1">
            360-degree guest profiles, allergy & dietary safeguards, RFM segmentation, automated WhatsApp marketing broadcasts, and customer loyalty reward tiers.
          </p>
        </div>

        {/* Top Action Bar */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleOpenAddCustomer}
            className="px-3.5 py-2 bg-[#C8B282] hover:bg-[#b59e6d] text-[#0b1221] text-xs font-black uppercase tracking-wider rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Guest Profile</span>
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
            onClick={handlePrintVIPRegister}
            className="px-3.5 py-2 bg-[#1e293b] hover:bg-[#334155] text-white border border-[#334155] text-xs font-bold uppercase tracking-wider rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-[#C8B282]" />
            <span>Print VIP Register</span>
          </button>
        </div>
      </div>

      {/* Top 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Customers */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E2DA] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#73706B] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Registered Diners</span>
            <div className="p-2 bg-[#f8fafc] text-[#0f172a] rounded-lg">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#1A1A1A]">{metrics.totalCustomers}</div>
            <div className="flex items-center gap-1 text-[11px] text-[#024628] font-semibold mt-1">
              <TrendingUp className="w-3 h-3" />
              <span>100% active diners</span>
            </div>
          </div>
        </div>

        {/* Customer Lifetime Value */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E2DA] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#73706B] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Guest Spend (LTV)</span>
            <div className="p-2 bg-[#ecfdf5] text-[#024628] rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#024628] font-mono">
              {formatNaira(metrics.totalLTV)}
            </div>
            <div className="text-[11px] text-[#73706B] mt-1">
              Cumulative lifetime billing
            </div>
          </div>
        </div>

        {/* Average Order Value (AOV) */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E2DA] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#73706B] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Spend / Visit (AOV)</span>
            <div className="p-2 bg-[#fffbeb] text-[#b45309] rounded-lg">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#b45309] font-mono">
              {formatNaira(metrics.aov)}
            </div>
            <div className="text-[11px] text-[#73706B] mt-1">
              Per dining table ticket
            </div>
          </div>
        </div>

        {/* VIP & Corporate Accounts */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E2DA] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#73706B] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">VIP & Corporate</span>
            <div className="p-2 bg-[#faf5ff] text-[#7e22ce] rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#7e22ce]">{metrics.vipAndCorporate}</div>
            <div className="text-[11px] text-[#73706B] mt-1">
              High-value client tier
            </div>
          </div>
        </div>

        {/* Loyalty Points Pool */}
        <div className="bg-white p-4 rounded-xl border border-[#E5E2DA] shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#73706B] mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Loyalty Points Pool</span>
            <div className="p-2 bg-[#eff6ff] text-[#2563eb] rounded-lg">
              <Gift className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black text-[#2563eb] font-mono">
              {metrics.totalPoints.toLocaleString()} <span className="text-xs font-normal">pts</span>
            </div>
            <div className="text-[11px] text-[#73706B] mt-1">
              Pending guest redemption
            </div>
          </div>
        </div>
      </div>

      {/* CRM Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-[#E5E2DA] pb-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('directory')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'directory'
                ? 'bg-[#1A1A1A] text-white shadow-sm'
                : 'bg-white text-[#73706B] hover:text-[#1A1A1A] border border-[#E5E2DA]'
            }`}
          >
            <Users className="w-4 h-4 text-[#C8B282]" />
            <span>Guest Directory ({filteredCustomers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('campaigns')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'campaigns'
                ? 'bg-[#1A1A1A] text-white shadow-sm'
                : 'bg-white text-[#73706B] hover:text-[#1A1A1A] border border-[#E5E2DA]'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-[#C8B282]" />
            <span>Marketing Campaigns & Broadcasts</span>
            <span className="px-1.5 py-0.2 bg-[#024628] text-white text-[10px] font-bold rounded-full">
              {campaigns.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('loyalty')}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
              activeSubTab === 'loyalty'
                ? 'bg-[#1A1A1A] text-white shadow-sm'
                : 'bg-white text-[#73706B] hover:text-[#1A1A1A] border border-[#E5E2DA]'
            }`}
          >
            <Gift className="w-4 h-4 text-[#C8B282]" />
            <span>Loyalty & Rewards Program</span>
          </button>
        </div>

        {/* View Layout Toggle (Only in Directory) */}
        {activeSubTab === 'directory' && (
          <div className="hidden sm:flex items-center gap-1 bg-[#F5F4EF] p-1 rounded-lg border border-[#E5E2DA]">
            <button
              type="button"
              onClick={() => setViewLayout('cards')}
              className={`p-1.5 rounded text-xs font-semibold transition-all ${
                viewLayout === 'cards' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#73706B]'
              }`}
              title="Grid Cards View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewLayout('table')}
              className={`p-1.5 rounded text-xs font-semibold transition-all ${
                viewLayout === 'table' ? 'bg-white text-[#1A1A1A] shadow-xs' : 'text-[#73706B]'
              }`}
              title="Compact Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: GUEST DIRECTORY */}
      {/* ============================================================== */}
      {activeSubTab === 'directory' && (
        <div className="space-y-4">
          {/* Filter & Search Bar */}
          <div className="bg-white p-4 rounded-xl border border-[#E5E2DA] shadow-sm space-y-3">
            <div className="flex flex-col md:flex-row gap-3">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-[#A3A09A] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by diner name, phone, email, corporate client, favorite dish..."
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

              {/* Segment Filter */}
              <div className="w-full md:w-48">
                <select
                  value={selectedSegment}
                  onChange={(e) => setSelectedSegment(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                >
                  <option value="All">All Customer Segments</option>
                  <option value="VIP / Elite">VIP / Elite</option>
                  <option value="Corporate Account">Corporate Account</option>
                  <option value="Regular / Loyal">Regular / Loyal</option>
                  <option value="New Diner">New Diner</option>
                  <option value="At-Risk / Inactive">At-Risk / Inactive</option>
                </select>
              </div>

              {/* Tier Filter */}
              <div className="w-full md:w-40">
                <select
                  value={selectedTier}
                  onChange={(e) => setSelectedTier(e.target.value)}
                  className="w-full px-3 py-2.5 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                >
                  <option value="All">All Tiers</option>
                  <option value="Platinum VIP">Platinum VIP</option>
                  <option value="Gold">Gold</option>
                  <option value="Silver">Silver</option>
                  <option value="Bronze">Bronze</option>
                </select>
              </div>

              {/* Sort By */}
              <div className="w-full md:w-48">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2.5 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                >
                  <option value="spend">Sort: Highest Total Spend</option>
                  <option value="visits">Sort: Most Visits</option>
                  <option value="points">Sort: Loyalty Points</option>
                  <option value="recent">Sort: Most Recent Visit</option>
                  <option value="name">Sort: Alphabetical (A-Z)</option>
                </select>
              </div>
            </div>

            {/* Quick Segment Filter Badges */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#F5F4EF]">
              <span className="text-[11px] font-bold text-[#73706B] uppercase tracking-wider mr-1">
                Quick Segments:
              </span>
              {[
                { label: 'All Diners', value: 'All' },
                { label: '🌟 VIP / Elite', value: 'VIP / Elite' },
                { label: '🏢 Corporate', value: 'Corporate Account' },
                { label: '🔁 Regulars', value: 'Regular / Loyal' },
                { label: '🌱 New Diners', value: 'New Diner' },
                { label: '⚠️ At-Risk (>30 days)', value: 'At-Risk / Inactive' }
              ].map(pill => (
                <button
                  key={pill.value}
                  type="button"
                  onClick={() => setSelectedSegment(pill.value)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer ${
                    selectedSegment === pill.value
                      ? 'bg-[#0b1221] text-white shadow-xs'
                      : 'bg-[#F5F4EF] text-[#555] hover:bg-[#E5E2DA]'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          {/* Directory Content: Grid Cards View vs Table View */}
          {filteredCustomers.length === 0 ? (
            <div className="bg-white p-12 rounded-xl border border-dashed border-[#E5E2DA] text-center">
              <Users className="w-12 h-12 text-[#A3A09A] mx-auto mb-3" />
              <h3 className="text-base font-bold text-[#1A1A1A]">No customer records match your filter</h3>
              <p className="text-xs text-[#73706B] mt-1 max-w-sm mx-auto">
                Try clearing your search query or switching segment filters to view all guest profiles.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSegment('All');
                  setSelectedTier('All');
                }}
                className="mt-4 px-4 py-2 bg-[#1A1A1A] text-white text-xs font-bold rounded-lg hover:bg-[#2A2A2A]"
              >
                Reset All Filters
              </button>
            </div>
          ) : viewLayout === 'cards' ? (
            /* Cards Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map(c => {
                const hasAllergies = (c.dietaryRestrictions || []).some(d => 
                  d.toLowerCase().includes('allergy') || 
                  d.toLowerCase().includes('strict') || 
                  d.toLowerCase().includes('no ')
                );

                return (
                  <div
                    key={c.id}
                    className="bg-white rounded-xl border border-[#E5E2DA] hover:border-[#C8B282] transition-all shadow-sm hover:shadow-md p-5 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Header: Avatar + Tier + Segment */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-[#0b1221] text-[#C8B282] font-black text-sm flex items-center justify-center border-2 border-[#C8B282]/40 shadow-xs">
                            {c.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                          </div>
                          <div>
                            <h3 className="font-bold text-sm text-[#1A1A1A] group-hover:text-[#b45309] transition-colors leading-tight">
                              {c.name}
                            </h3>
                            {c.company && (
                              <p className="text-[11px] text-[#555] font-medium flex items-center gap-1 mt-0.5">
                                <Building2 className="w-3 h-3 text-[#73706B]" />
                                <span className="truncate max-w-[150px]">{c.company}</span>
                              </p>
                            )}
                            <div className="flex items-center gap-1.5 mt-1">
                              {renderTierBadge(c.tier)}
                              {renderSegmentPill(c.segment)}
                            </div>
                          </div>
                        </div>

                        {/* VIP Star Rating */}
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: c.rating || 5 }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-current" />
                          ))}
                        </div>
                      </div>

                      {/* Contact Info Snippet */}
                      <div className="space-y-1 text-[11px] text-[#73706B] py-2 border-y border-[#F5F4EF]">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-[#A3A09A]" />
                            <span className="font-mono text-[#1A1A1A]">{c.phone}</span>
                          </span>
                          <span className="text-[10px] text-[#A3A09A]">
                            Last: {c.lastVisitDate}
                          </span>
                        </div>
                        {c.favoriteDish && (
                          <div className="flex items-center gap-1.5 text-[#1A1A1A] font-medium pt-1">
                            <UtensilsCrossed className="w-3 h-3 text-[#b45309] shrink-0" />
                            <span className="truncate text-[11px]" title={c.favoriteDish}>
                              Fav: {c.favoriteDish}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Allergy & Dietary Safeguards Warning */}
                      {(c.dietaryRestrictions || []).length > 0 && (
                        <div className={`mt-2.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1.5 ${
                          hasAllergies 
                            ? 'bg-red-50 text-red-800 border border-red-200' 
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}>
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">
                            {c.dietaryRestrictions?.join(' • ')}
                          </span>
                        </div>
                      )}

                      {/* Financial Metrics Row */}
                      <div className="grid grid-cols-3 gap-2 mt-3 pt-2 text-center bg-[#FDFCF9] p-2 rounded-lg border border-[#F5F4EF]">
                        <div>
                          <div className="text-[10px] text-[#73706B] uppercase font-bold">Total Spend</div>
                          <div className="text-xs font-black text-[#024628] font-mono mt-0.5">
                            {formatNaira(c.totalSpent)}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#73706B] uppercase font-bold">Visits</div>
                          <div className="text-xs font-black text-[#1A1A1A] mt-0.5">
                            {c.totalOrders} orders
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[#73706B] uppercase font-bold">Points</div>
                          <div className="text-xs font-black text-[#2563eb] font-mono mt-0.5">
                            {c.loyaltyPoints} pts
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Footer Actions */}
                    <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-[#F5F4EF]">
                      <div className="flex items-center gap-1">
                        {/* WhatsApp Trigger */}
                        <button
                          type="button"
                          onClick={() => handleOpenOutreach(c, 'vip_invite')}
                          title="Send Direct WhatsApp Message"
                          className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        {/* Direct Call */}
                        <a
                          href={`tel:${c.phone}`}
                          title={`Call ${c.name}`}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                        {/* Edit */}
                        <button
                          type="button"
                          onClick={() => handleOpenEditCustomer(c)}
                          title="Edit Profile"
                          className="p-1.5 rounded-lg bg-gray-50 text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* View 360° Profile Button */}
                      <button
                        type="button"
                        onClick={() => setSelectedCustomer(c)}
                        className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-[#C8B282]" />
                        <span>View 360° Profile</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Compact Table View */
            <div className="bg-white rounded-xl border border-[#E5E2DA] shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#0b1221] text-white uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Guest Name & Company</th>
                      <th className="py-3 px-3">Segment / Tier</th>
                      <th className="py-3 px-3">Phone & Email</th>
                      <th className="py-3 px-3">Dietary Alerts</th>
                      <th className="py-3 px-3 text-right">Lifetime Spend</th>
                      <th className="py-3 px-3 text-center">Visits</th>
                      <th className="py-3 px-3 text-right">Points</th>
                      <th className="py-3 px-4 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E2DA]">
                    {filteredCustomers.map(c => (
                      <tr key={c.id} className="hover:bg-[#FDFCF9] transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-[#1A1A1A]">{c.name}</div>
                          {c.company && (
                            <div className="text-[10px] text-[#73706B]">{c.company}</div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-col gap-1 items-start">
                            {renderTierBadge(c.tier)}
                            {renderSegmentPill(c.segment)}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono text-[#1A1A1A]">{c.phone}</div>
                          <div className="text-[10px] text-[#73706B] truncate max-w-[140px]">{c.email}</div>
                        </td>
                        <td className="py-3 px-3">
                          {(c.dietaryRestrictions || []).length > 0 ? (
                            <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                              {c.dietaryRestrictions?.join(', ')}
                            </span>
                          ) : (
                            <span className="text-[10px] text-gray-400">None</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#024628]">
                          {formatNaira(c.totalSpent)}
                        </td>
                        <td className="py-3 px-3 text-center font-bold">
                          {c.totalOrders}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-[#2563eb]">
                          {c.loyaltyPoints}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenOutreach(c, 'vip_invite')}
                              title="WhatsApp Message"
                              className="p-1.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedCustomer(c)}
                              className="px-2 py-1 bg-[#1A1A1A] text-white text-[10px] font-bold rounded hover:bg-[#2A2A2A]"
                            >
                              Profile
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: MARKETING CAMPAIGNS & BROADCASTS */}
      {/* ============================================================== */}
      {activeSubTab === 'campaigns' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-[#E5E2DA] shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#b45309]" />
                  <span>Automated Direct Marketing & WhatsApp Broadcasts</span>
                </h2>
                <p className="text-xs text-[#73706B] mt-0.5">
                  Pre-configured high-converting restaurant marketing workflows to re-engage past guests, fill tables on slow days, and pamper VIPs.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#73706B] font-semibold">Active Campaigns:</span>
                <span className="px-2.5 py-1 bg-[#024628] text-white text-xs font-bold rounded-full">
                  {campaigns.length} Ready
                </span>
              </div>
            </div>

            {/* Campaign Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {campaigns.map(camp => {
                const targetCount = camp.targetSegment === 'All'
                  ? customers.length
                  : customers.filter(c => c.segment === camp.targetSegment).length;

                return (
                  <div
                    key={camp.id}
                    className="bg-[#FDFCF9] border border-[#E5E2DA] rounded-xl p-5 flex flex-col justify-between hover:border-[#C8B282] transition-all shadow-xs"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div>
                          <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 bg-[#0b1221] text-[#C8B282] rounded">
                            {camp.channel} Campaign
                          </span>
                          <h3 className="font-bold text-sm text-[#1A1A1A] mt-1.5">
                            {camp.name}
                          </h3>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          {camp.status}
                        </span>
                      </div>

                      {/* Offer Badge */}
                      {camp.discountOffer && (
                        <div className="my-2.5 px-3 py-1.5 bg-[#fffbeb] border border-[#fef3c7] rounded-lg text-xs font-bold text-[#b45309] flex items-center gap-2">
                          <Gift className="w-4 h-4 text-[#b45309]" />
                          <span>{camp.discountOffer}</span>
                        </div>
                      )}

                      {/* Message Preview Box */}
                      <div className="bg-white p-3 rounded-lg border border-[#E5E2DA] text-xs text-[#444] font-serif italic mb-3">
                        "{camp.messageTemplate}"
                      </div>

                      {/* Metrics bar */}
                      <div className="grid grid-cols-2 gap-2 text-xs py-2 border-t border-[#E5E2DA]">
                        <div>
                          <span className="text-[10px] text-[#73706B] uppercase font-bold">Audience Reach:</span>
                          <div className="font-bold text-[#1A1A1A] mt-0.5">
                            {targetCount} Diners ({camp.targetSegment})
                          </div>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#73706B] uppercase font-bold">Estimated Conversion:</span>
                          <div className="font-bold text-[#024628] mt-0.5">
                            {camp.conversionRate || '35%'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Launch Action */}
                    <div className="mt-4 pt-3 border-t border-[#E5E2DA] flex items-center justify-between">
                      <span className="text-[11px] text-[#73706B]">
                        Broadcast Channel: <strong>WhatsApp Direct</strong>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSimulatedCampaign(camp);
                          setIsCampaignModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 bg-[#024628] hover:bg-[#035933] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Preview & Launch Campaign</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 3: LOYALTY & REWARDS PROGRAM */}
      {/* ============================================================== */}
      {activeSubTab === 'loyalty' && (
        <div className="space-y-6">
          {/* Loyalty Program Overview */}
          <div className="bg-white p-6 rounded-xl border border-[#E5E2DA] shadow-sm">
            <h2 className="text-lg font-bold text-[#1A1A1A] flex items-center gap-2 mb-1">
              <Gift className="w-5 h-5 text-[#2563eb]" />
              <span>Customer Loyalty & Points Earning Rules</span>
            </h2>
            <p className="text-xs text-[#73706B] max-w-2xl">
              Guests automatically earn <strong>1 Point for every ₦100 spent</strong> across Dine-In, Takeaway, and Corporate Catering. Points are redeemable for instant dining discounts, complimentary drinks, or VIP table upgrades.
            </p>

            {/* Tier Thresholds Breakdown */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              {[
                {
                  tier: 'Bronze',
                  req: 'Entry Level (0 - 599 pts)',
                  perks: 'Standard menu ordering, digital receipt record',
                  color: 'border-gray-200 bg-gray-50'
                },
                {
                  tier: 'Silver',
                  req: '600 - 1,499 pts (or ₦100k+ spend)',
                  perks: '5% birthday discount voucher, free welcome soft drink',
                  color: 'border-slate-300 bg-slate-50'
                },
                {
                  tier: 'Gold',
                  req: '1,500 - 2,999 pts (or ₦200k+ spend)',
                  perks: 'Priority table reservation, 10% anniversary perk, free coffee/tea',
                  color: 'border-amber-300 bg-amber-50'
                },
                {
                  tier: 'Platinum VIP',
                  req: '3,000+ pts (or ₦400k+ spend)',
                  perks: 'Executive lounge table access, complimentary chef starter, dedicated server',
                  color: 'border-purple-300 bg-purple-50'
                }
              ].map(t => (
                <div key={t.tier} className={`p-4 rounded-xl border ${t.color}`}>
                  <div className="text-xs font-black uppercase text-[#1A1A1A] mb-1">{t.tier}</div>
                  <div className="text-[11px] font-bold text-[#b45309]">{t.req}</div>
                  <p className="text-[11px] text-[#555] mt-2 leading-relaxed">{t.perks}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Redeemable Rewards Catalog */}
          <div className="bg-white p-6 rounded-xl border border-[#E5E2DA] shadow-sm">
            <h3 className="text-base font-bold text-[#1A1A1A] mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-[#b45309]" />
              <span>Redeemable Rewards Catalog</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LOYALTY_REWARDS.map(r => (
                <div
                  key={r.id}
                  className="bg-[#FDFCF9] border border-[#E5E2DA] p-4 rounded-xl flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
                        {r.category}
                      </span>
                      <span className="text-xs font-black text-[#2563eb] font-mono">
                        {r.pointsCost} Points
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-[#1A1A1A]">{r.name}</h4>
                    <p className="text-xs text-[#73706B] mt-1 leading-relaxed">{r.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-[#E5E2DA] flex items-center justify-between text-xs font-semibold text-[#024628]">
                    <span>Value: {r.rewardValue}</span>
                    <span className="text-[11px] text-[#73706B]">Instant POS Voucher</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: CUSTOMER 360° PROFILE MODAL */}
      {/* ============================================================== */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E5E2DA] flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-[#0b1221] text-white flex items-start justify-between border-b border-[#1e293b] sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-[#1e293b] text-[#C8B282] font-black text-xl flex items-center justify-center border-2 border-[#C8B282]">
                  {selectedCustomer.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white">{selectedCustomer.name}</h2>
                    {renderTierBadge(selectedCustomer.tier)}
                  </div>
                  {selectedCustomer.company && (
                    <p className="text-xs text-[#cbd5e1] flex items-center gap-1 mt-0.5">
                      <Building2 className="w-3.5 h-3.5 text-[#C8B282]" />
                      <span>{selectedCustomer.company}</span>
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-xs text-[#94a3b8] mt-1">
                    <span>ID: {selectedCustomer.id}</span>
                    <span>•</span>
                    <span>Customer since {selectedCustomer.createdAt}</span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-white/60 hover:text-white p-1 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 bg-[#FDFCF9]">
              {/* Top Stats Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-3 rounded-xl border border-[#E5E2DA] text-center">
                  <div className="text-[10px] text-[#73706B] uppercase font-bold">Lifetime Billing</div>
                  <div className="text-base font-black text-[#024628] font-mono mt-0.5">
                    {formatNaira(selectedCustomer.totalSpent)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#E5E2DA] text-center">
                  <div className="text-[10px] text-[#73706B] uppercase font-bold">Total Orders</div>
                  <div className="text-base font-black text-[#1A1A1A] mt-0.5">
                    {selectedCustomer.totalOrders} visits
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#E5E2DA] text-center">
                  <div className="text-[10px] text-[#73706B] uppercase font-bold">Avg Order Value</div>
                  <div className="text-base font-black text-[#b45309] font-mono mt-0.5">
                    {formatNaira(selectedCustomer.averageOrderValue || 0)}
                  </div>
                </div>
                <div className="bg-white p-3 rounded-xl border border-[#E5E2DA] text-center flex flex-col justify-between">
                  <div className="text-[10px] text-[#73706B] uppercase font-bold">Loyalty Points</div>
                  <div className="text-base font-black text-[#2563eb] font-mono mt-0.5">
                    {selectedCustomer.loyaltyPoints} pts
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPointsModalOpen(true)}
                    className="text-[10px] text-[#2563eb] hover:underline font-bold mt-1"
                  >
                    + Adjust Points
                  </button>
                </div>
              </div>

              {/* Allergy & Dietary Alert Box */}
              {(selectedCustomer.dietaryRestrictions || []).length > 0 && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-black uppercase text-red-900 tracking-wider">
                      Critical Food Allergy & Dietary Instructions
                    </h4>
                    <p className="text-xs text-red-800 font-medium mt-1">
                      {selectedCustomer.dietaryRestrictions?.join(', ')}
                    </p>
                    <p className="text-[11px] text-red-600 mt-1 italic">
                      Waiters and Kitchen team must verify this ticket before preparation to avoid allergen cross-contamination.
                    </p>
                  </div>
                </div>
              )}

              {/* Guest Preferences & Contact Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Contact Card */}
                <div className="bg-white p-4 rounded-xl border border-[#E5E2DA] space-y-2.5">
                  <h4 className="text-xs font-bold uppercase text-[#1A1A1A] tracking-wider mb-2">
                    Contact & Logistics
                  </h4>
                  <div className="flex items-center gap-2 text-xs">
                    <Phone className="w-3.5 h-3.5 text-[#A3A09A]" />
                    <span className="font-mono text-[#1A1A1A]">{selectedCustomer.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <Mail className="w-3.5 h-3.5 text-[#A3A09A]" />
                    <span className="text-[#1A1A1A]">{selectedCustomer.email}</span>
                  </div>
                  {selectedCustomer.address && (
                    <div className="flex items-center gap-2 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-[#A3A09A]" />
                      <span className="text-[#1A1A1A]">{selectedCustomer.address}</span>
                    </div>
                  )}
                  {selectedCustomer.birthday && (
                    <div className="flex items-center gap-2 text-xs text-[#b45309] font-medium pt-1">
                      <Cake className="w-3.5 h-3.5 text-[#b45309]" />
                      <span>Birthday: {selectedCustomer.birthday}</span>
                    </div>
                  )}
                </div>

                {/* Dining Preferences Card */}
                <div className="bg-white p-4 rounded-xl border border-[#E5E2DA] space-y-2.5">
                  <h4 className="text-xs font-bold uppercase text-[#1A1A1A] tracking-wider mb-2">
                    Dining Preferences
                  </h4>
                  <div className="text-xs">
                    <span className="text-[#73706B]">Favorite Dish: </span>
                    <strong className="text-[#1A1A1A]">{selectedCustomer.favoriteDish || 'Chef Special'}</strong>
                  </div>
                  <div className="text-xs">
                    <span className="text-[#73706B]">Preferred Seating: </span>
                    <strong className="text-[#1A1A1A]">{selectedCustomer.preferredSeating || 'Main Hall'}</strong>
                  </div>
                  {selectedCustomer.notes && (
                    <div className="text-xs bg-[#F5F4EF] p-2.5 rounded-lg border border-[#E5E2DA] text-[#444] mt-2">
                      <span className="font-bold text-[#1A1A1A] block mb-0.5">Maître d' Notes:</span>
                      {selectedCustomer.notes}
                    </div>
                  )}
                </div>
              </div>

              {/* Linked Past Orders Section */}
              <div className="bg-white p-4 rounded-xl border border-[#E5E2DA]">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase text-[#1A1A1A] tracking-wider flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#C8B282]" />
                    <span>Recent Order History ({customerOrders.length} orders recorded)</span>
                  </h4>
                  {onOpenInPos && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenInPos(selectedCustomer.preferredSeating || 'Table 01', selectedCustomer.name);
                        setSelectedCustomer(null);
                      }}
                      className="text-xs font-bold text-[#b45309] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create POS Order for Guest</span>
                    </button>
                  )}
                </div>

                {customerOrders.length === 0 ? (
                  <p className="text-xs text-[#73706B] py-3 text-center">
                    No active live session orders currently matched to {selectedCustomer.name}. New orders placed in POS with this guest name will automatically link here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {customerOrders.map(ord => (
                      <div
                        key={ord.id}
                        className="p-3 bg-[#FDFCF9] rounded-lg border border-[#E5E2DA] flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <strong className="font-mono text-[#1A1A1A]">{ord.id}</strong>
                            <span className="text-[#73706B]">• {ord.tableOrRoom}</span>
                            <span className="text-[#73706B]">• {ord.createdAt}</span>
                          </div>
                          <div className="text-[11px] text-[#555] mt-1">
                            {ord.items.map(i => `${i.quantity}x ${i.menuItem.name}`).join(', ')}
                          </div>
                        </div>

                        <div className="text-right flex items-center gap-3">
                          <div>
                            <div className="font-mono font-black text-[#024628] text-sm">
                              {formatNaira(ord.grandTotal)}
                            </div>
                            <span className="text-[10px] text-[#73706B]">{ord.paymentMethod}</span>
                          </div>
                          {onReprintReceipt && (
                            <button
                              type="button"
                              onClick={() => onReprintReceipt(ord)}
                              className="p-1.5 bg-[#1A1A1A] text-white rounded hover:bg-[#333]"
                              title="Reprint Receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-white border-t border-[#E5E2DA] flex flex-wrap items-center justify-between gap-3 sticky bottom-0">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenOutreach(selectedCustomer, 'vip_invite')}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Send WhatsApp Message</span>
                </button>
                {onOpenReservations && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenReservations(selectedCustomer.name);
                      setSelectedCustomer(null);
                    }}
                    className="px-3.5 py-2 bg-[#1e293b] hover:bg-[#334155] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4 text-[#C8B282]" />
                    <span>Book Table</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleOpenEditCustomer(selectedCustomer);
                  }}
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-[#1A1A1A] text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="px-4 py-2 bg-[#1A1A1A] text-white text-xs font-bold rounded-lg hover:bg-[#2A2A2A]"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: WHATSAPP DIRECT OUTREACH LAUNCHER */}
      {/* ============================================================== */}
      {isOutreachModalOpen && outreachCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E5E2DA] p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-[#E5E2DA] pb-3">
              <div>
                <span className="text-[10px] font-black uppercase text-emerald-700 tracking-wider">
                  Direct Marketing Dispatch
                </span>
                <h3 className="text-lg font-bold text-[#1A1A1A] mt-0.5">
                  Send WhatsApp to {outreachCustomer.name}
                </h3>
                <p className="text-xs text-[#73706B] font-mono">{outreachCustomer.phone}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOutreachModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector */}
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                Select Message Template
              </label>
              <select
                value={outreachTemplate}
                onChange={(e) => {
                  const t = e.target.value;
                  setOutreachTemplate(t);
                  if (t === 'vip_invite') {
                    setCustomOutreachMsg(`Dear ${outreachCustomer.name}, as our esteemed ${outreachCustomer.tier} guest at Restaurant Management System, Chef cordially invites you for an exclusive tasting of our new flame-grilled weekend specials with priority table allocation. Reply to reserve your preferred table!`);
                  } else if (t === 'miss_you') {
                    setCustomOutreachMsg(`Hello ${outreachCustomer.name}, we miss having you at Restaurant Management System! Enjoy 15% off your next dining experience this week with promo code WELCOMEBACK15. Reserve directly by replying to this message!`);
                  } else if (t === 'anniversary') {
                    setCustomOutreachMsg(`Happy Celebration Season ${outreachCustomer.name}! 🎉 Book your table with us this week and receive a complimentary Celebration Sparkling Toast and Chef’s Dessert Platter for your table!`);
                  } else if (t === 'corporate') {
                    setCustomOutreachMsg(`Dear ${outreachCustomer.name} (${outreachCustomer.company || 'Corporate Team'}), elevate your team lunch meetings with our bespoke executive catering. Priority dispatch, zero delivery charges, and itemized A4 Corporate Tax Invoices with TIN breakdown.`);
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
              >
                <option value="vip_invite">🌟 VIP Chef Tasting & Priority Table Invitation</option>
                <option value="miss_you">⚠️ "We Miss You" 15% Re-engagement Voucher</option>
                <option value="anniversary">🎂 Birthday & Anniversary Celebration Treat</option>
                <option value="corporate">🏢 Corporate Business Lunch & Catering Privileges</option>
                <option value="custom">✏️ Custom Direct Message</option>
              </select>
            </div>

            {/* Message Text Editor */}
            <div>
              <label className="block text-xs font-bold text-[#1A1A1A] uppercase tracking-wider mb-1.5">
                Message Body (WhatsApp Preview)
              </label>
              <textarea
                rows={5}
                value={customOutreachMsg}
                onChange={(e) => setCustomOutreachMsg(e.target.value)}
                className="w-full p-3 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282] leading-relaxed"
              />
            </div>

            {/* Copy Toast */}
            {copySuccessToast && (
              <div className="text-[11px] font-bold text-[#024628] flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                <span>Message copied to clipboard!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E5E2DA]">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-[#1A1A1A] text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Copy Text
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOutreachModalOpen(false)}
                  className="px-3 py-2 text-xs text-[#73706B] font-bold hover:text-[#1A1A1A]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleLaunchWhatsApp}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Open WhatsApp</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 3: ADD / EDIT CUSTOMER PROFILE */}
      {/* ============================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#E5E2DA] p-6 space-y-4">
            <div className="flex items-start justify-between border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="text-lg font-bold text-[#1A1A1A]">
                  {editingCustomer ? `Edit Profile: ${editingCustomer.name}` : 'Register New Dining Guest Profile'}
                </h3>
                <p className="text-xs text-[#73706B]">
                  Record contact information, dietary sensitivities, and VIP preferences.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Full Name */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                    Customer Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alhaji Umar Sanusi"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                    Phone Number (WhatsApp) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0803 210 4455"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. client@company.ng"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                  />
                </div>

                {/* Company */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                    Company / Organization (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Access Bank Commercial Banking"
                    value={customerForm.company}
                    onChange={(e) => setCustomerForm({ ...customerForm, company: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                  />
                </div>

                {/* Customer Segment */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                    Customer Segment
                  </label>
                  <select
                    value={customerForm.segment}
                    onChange={(e) => setCustomerForm({ ...customerForm, segment: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                  >
                    <option value="VIP / Elite">VIP / Elite</option>
                    <option value="Corporate Account">Corporate Account</option>
                    <option value="Regular / Loyal">Regular / Loyal</option>
                    <option value="New Diner">New Diner</option>
                    <option value="At-Risk / Inactive">At-Risk / Inactive</option>
                  </select>
                </div>

                {/* Customer Tier */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                    Loyalty Tier
                  </label>
                  <select
                    value={customerForm.tier}
                    onChange={(e) => setCustomerForm({ ...customerForm, tier: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                  >
                    <option value="Bronze">Bronze (Standard)</option>
                    <option value="Silver">Silver</option>
                    <option value="Gold">Gold</option>
                    <option value="Platinum VIP">Platinum VIP</option>
                  </select>
                </div>

                {/* Favorite Dish */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                    Favorite Dish / Order
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Seafood Paella & Ram Ribs"
                    value={customerForm.favoriteDish}
                    onChange={(e) => setCustomerForm({ ...customerForm, favoriteDish: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                  />
                </div>

                {/* Preferred Seating */}
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                    Preferred Table / Seating
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. VIP Lounge 01, Table 08 (Garden)"
                    value={customerForm.preferredSeating}
                    onChange={(e) => setCustomerForm({ ...customerForm, preferredSeating: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                  />
                </div>
              </div>

              {/* Dietary Sensitivity Chips */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1.5">
                  Dietary Restrictions & Allergies (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DIETARY_OPTIONS.map(d => {
                    const isSelected = customerForm.dietaryRestrictions.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleToggleDietary(d)}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-red-800 text-white border-red-800 shadow-xs'
                            : 'bg-[#FDFCF9] text-[#555] border-[#E5E2DA] hover:border-gray-400'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {d}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Special Dates & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                    Birthday (MM-DD)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10-18"
                    value={customerForm.birthday}
                    onChange={(e) => setCustomerForm({ ...customerForm, birthday: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                    Anniversary (MM-DD)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 04-25"
                    value={customerForm.anniversary}
                    onChange={(e) => setCustomerForm({ ...customerForm, anniversary: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                  />
                </div>
              </div>

              {/* Service Notes */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-[#1A1A1A] mb-1">
                  Private Service & Maître d' Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Prefers tea served piping hot with peppermint before meal..."
                  value={customerForm.notes}
                  onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg focus:outline-none focus:border-[#C8B282]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E2DA]">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-[#73706B] hover:text-[#1A1A1A]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                >
                  Save Customer Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 4: POINTS ADJUSTMENT MODAL */}
      {/* ============================================================== */}
      {isPointsModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-[#E5E2DA]">
            <div>
              <h3 className="text-base font-bold text-[#1A1A1A]">
                Adjust Loyalty Points: {selectedCustomer.name}
              </h3>
              <p className="text-xs text-[#73706B] mt-0.5">
                Current Balance: <strong>{selectedCustomer.loyaltyPoints} pts</strong>
              </p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase mb-1">
                  Points Adjustment (+ or -)
                </label>
                <input
                  type="number"
                  value={pointsDelta}
                  onChange={(e) => setPointsDelta(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 text-sm font-bold bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg font-mono"
                />
                <div className="flex items-center gap-1.5 mt-2">
                  {[50, 100, 250, 500].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPointsDelta(val)}
                      className="px-2 py-1 text-[10px] font-bold bg-gray-100 hover:bg-gray-200 rounded"
                    >
                      +{val}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setPointsDelta(-200)}
                    className="px-2 py-1 text-[10px] font-bold bg-red-50 text-red-700 hover:bg-red-100 rounded"
                  >
                    -200
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-[#1A1A1A] uppercase mb-1">
                  Reason for Adjustment
                </label>
                <input
                  type="text"
                  value={pointsReason}
                  onChange={(e) => setPointsReason(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E5E2DA]">
              <button
                type="button"
                onClick={() => setIsPointsModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[#73706B] font-bold hover:text-[#1A1A1A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyPoints}
                className="px-4 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Apply Points
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 5: CAMPAIGN SIMULATOR & BROADCAST PREVIEW */}
      {/* ============================================================== */}
      {isCampaignModalOpen && simulatedCampaign && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-[#E5E2DA]">
            <div className="flex items-start justify-between border-b border-[#E5E2DA] pb-3">
              <div>
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                  Targeted Marketing Campaign
                </span>
                <h3 className="text-lg font-bold text-[#1A1A1A] mt-0.5">
                  {simulatedCampaign.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCampaignModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-900 font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Audience Segment: <strong>{simulatedCampaign.targetSegment}</strong> ({
                  simulatedCampaign.targetSegment === 'All'
                    ? customers.length
                    : customers.filter(c => c.segment === simulatedCampaign.targetSegment).length
                } qualified diners matched)</span>
              </div>

              <div className="bg-[#FDFCF9] p-3 rounded-lg border border-[#E5E2DA]">
                <span className="text-[10px] font-bold uppercase text-[#73706B] block mb-1">
                  Broadcast Message Copy (WhatsApp)
                </span>
                <p className="text-xs text-[#222] font-serif italic leading-relaxed">
                  "{simulatedCampaign.messageTemplate}"
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200">
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block">Estimated Conversion:</span>
                  <strong className="text-emerald-700">{simulatedCampaign.conversionRate}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 font-bold block">Projected Revenue Lift:</span>
                  <strong className="text-[#024628] font-mono">
                    {formatNaira(
                      (simulatedCampaign.targetSegment === 'All'
                        ? customers.length
                        : customers.filter(c => c.segment === simulatedCampaign.targetSegment).length) * (metrics.aov || 25000) * 0.35
                    )}
                  </strong>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#E5E2DA]">
              <span className="text-[11px] text-[#73706B]">
                Ready for multi-channel dispatch
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCampaignModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-[#73706B]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCampaignSuccessToast(`Campaign "${simulatedCampaign.name}" broadcast simulation queued successfully! Direct WhatsApp outreach enabled.`);
                    setIsCampaignModalOpen(false);
                  }}
                  className="px-4 py-2 bg-[#024628] hover:bg-[#035933] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Execute Broadcast</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
