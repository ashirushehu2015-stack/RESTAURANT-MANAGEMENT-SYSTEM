import React, { useState, useEffect } from 'react';
import type { Supplier, PurchaseOrder } from '../types';
import { INITIAL_SUPPLIERS, INITIAL_PURCHASE_ORDERS } from '../data/restaurantData';
import { formatNaira } from '../utils/formatters';
import { 
  Truck, 
  Users, 
  Clock, 
  DollarSign, 
  CheckCircle2, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Check, 
  Calendar, 
  FileText, 
  CreditCard,
  Phone,
  Mail,
  UserCheck,
  AlertCircle,
  Banknote,
  Landmark,
  ArrowRight,
  Filter,
  Package
} from 'lucide-react';

const SUPPLIERS_STORAGE_KEY = 'fulbe_restaurant_suppliers';
const PURCHASE_ORDERS_STORAGE_KEY = 'fulbe_restaurant_purchase_orders';

const COMMODITY_PRESETS = [
  'Boneless Beef (Grade A)',
  'Fresh Plum Tomatoes & Peppers',
  'Long Grain Rice (50kg Bag)',
  'Fresh Catfish & Croaker',
  'Soft Drinks & Bottled Water',
  'Vegetable Cooking Oil (25L)',
  'Whole Dressed Chicken',
  'Eggs (Crates of 30)',
  'Yam Tubers (Medium/Large)',
  'Plantain Bunches',
  'Onions (Red Bell / White)',
  'Seasoning Cubes & Cooking Spices',
  'Takeaway Food Packaging & Boxes'
];

const UNIT_OPTIONS = [
  { value: 'kg', label: 'kg (Kilograms)' },
  { value: 'bags', label: 'bags (Bags / Sacks)' },
  { value: 'crates', label: 'crates (Crates)' },
  { value: 'liters', label: 'liters (Litres)' },
  { value: 'cartons', label: 'cartons (Cartons / Boxes)' },
  { value: 'packs', label: 'packs (Packs)' },
  { value: 'pieces', label: 'pieces (Pieces / Units)' },
  { value: 'tubers', label: 'tubers (Tubers)' },
  { value: 'bunches', label: 'bunches (Bunches)' }
];

function loadSuppliersFromStorage(): Supplier[] {
  try {
    const saved = localStorage.getItem(SUPPLIERS_STORAGE_KEY) || sessionStorage.getItem(SUPPLIERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load suppliers from storage', e);
  }
  return INITIAL_SUPPLIERS;
}

function loadOrdersFromStorage(): PurchaseOrder[] {
  try {
    const saved = localStorage.getItem(PURCHASE_ORDERS_STORAGE_KEY) || sessionStorage.getItem(PURCHASE_ORDERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Sanitize & migrate to ensure all new fields exist
        return parsed.map((po: any) => {
          const qty = typeof po.quantity === 'number' && po.quantity > 0 ? po.quantity : 1;
          const total = typeof po.totalAmount === 'number' ? po.totalAmount : 0;
          const unitCost = typeof po.unitCost === 'number' ? po.unitCost : (total > 0 ? Math.round(total / qty) : 0);
          const paymentStatus = po.paymentStatus || (po.status === 'Paid' ? 'Fully Paid' : 'Unpaid');
          const amountPaid = typeof po.amountPaid === 'number' 
            ? po.amountPaid 
            : (paymentStatus === 'Fully Paid' ? total : 0);
          const balance = typeof po.balance === 'number' 
            ? po.balance 
            : Math.max(0, total - amountPaid);

          return {
            id: po.id || `PO-26-${String(Math.floor(Math.random() * 900) + 100)}`,
            supplierId: po.supplierId || '',
            supplierName: po.supplierName || 'General Supplier',
            commodity: po.commodity || po.description || 'Assorted Kitchen Goods',
            quantity: qty,
            unit: po.unit || 'kg',
            unitCost: unitCost,
            totalAmount: total || (qty * unitCost),
            paymentMode: po.paymentMode || 'Bank Transfer',
            paymentStatus: paymentStatus,
            amountPaid: amountPaid,
            balance: balance,
            orderDate: po.orderDate || new Date().toISOString().split('T')[0],
            expectedDelivery: po.expectedDelivery || new Date().toISOString().split('T')[0],
            deliveryStatus: po.deliveryStatus || (po.status === 'Received' || po.status === 'Paid' ? 'Received' : 'Pending'),
            description: po.description || '',
            status: po.status || 'Pending'
          } as PurchaseOrder;
        });
      }
    }
  } catch (e) {
    console.error('Failed to load purchase orders from storage', e);
  }
  return INITIAL_PURCHASE_ORDERS;
}

function persistSuppliers(suppliers: Supplier[]) {
  try {
    localStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(suppliers));
  } catch (e) {}
  try {
    sessionStorage.setItem(SUPPLIERS_STORAGE_KEY, JSON.stringify(suppliers));
  } catch (e) {}
}

function persistOrders(orders: PurchaseOrder[]) {
  try {
    localStorage.setItem(PURCHASE_ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {}
  try {
    sessionStorage.setItem(PURCHASE_ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {}
}

export const SuppliersModule: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'directory' | 'orders'>('orders');
  const [suppliers, setSuppliers] = useState<Supplier[]>(loadSuppliersFromStorage);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(loadOrdersFromStorage);
  const [searchQuery, setSearchQuery] = useState('');
  const [orderPaymentFilter, setOrderPaymentFilter] = useState<'all' | 'Fully Paid' | 'Partially Paid' | 'Unpaid'>('all');
  const [orderPaymentModeFilter, setOrderPaymentModeFilter] = useState<'all' | 'Bank Transfer' | 'Cash' | 'POS Machine'>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [paymentModalOrder, setPaymentModalOrder] = useState<PurchaseOrder | null>(null);

  // Form State: Supplier
  const [supplierName, setSupplierName] = useState('');
  const [supplierCategory, setSupplierCategory] = useState('Vegetables & Fruits');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierStatus, setSupplierStatus] = useState<'Active' | 'Inactive'>('Active');

  // Form State: Purchase Order
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poCommodity, setPoCommodity] = useState('Boneless Beef (Grade A)');
  const [poUnit, setPoUnit] = useState('kg');
  const [poQuantity, setPoQuantity] = useState<number>(50);
  const [poUnitCost, setPoUnitCost] = useState<number>(4500);
  const [poPaymentMode, setPoPaymentMode] = useState<'Cash' | 'Bank Transfer' | 'POS Machine'>('Bank Transfer');
  const [poPaymentStatus, setPoPaymentStatus] = useState<'Fully Paid' | 'Partially Paid' | 'Unpaid'>('Fully Paid');
  const [poAmountPaidCustom, setPoAmountPaidCustom] = useState<number>(0);
  const [poExpectedDate, setPoExpectedDate] = useState('');
  const [poNotes, setPoNotes] = useState('');

  // Form State: Record Balance Payment Modal
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMode, setPayMode] = useState<'Bank Transfer' | 'Cash' | 'POS Machine'>('Bank Transfer');

  useEffect(() => {
    persistSuppliers(suppliers);
  }, [suppliers]);

  useEffect(() => {
    persistOrders(purchaseOrders);
  }, [purchaseOrders]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Live order calculations for the modal
  const calculatedPoTotal = Math.max(0, (poQuantity || 0) * (poUnitCost || 0));
  const effectiveAmountPaid = 
    poPaymentStatus === 'Fully Paid' 
      ? calculatedPoTotal 
      : poPaymentStatus === 'Unpaid' 
      ? 0 
      : Math.min(calculatedPoTotal, Math.max(0, poAmountPaidCustom || 0));
  const calculatedBalance = Math.max(0, calculatedPoTotal - effectiveAmountPaid);

  // Key Metrics
  const activeSuppliersCount = suppliers.filter(s => s.status === 'Active').length;
  const pendingDeliveriesCount = purchaseOrders.filter(po => po.deliveryStatus === 'Pending').length;
  const totalProcurement = purchaseOrders.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
  const totalAmountPaid = purchaseOrders.reduce((sum, po) => sum + (po.amountPaid || 0), 0);
  const outstandingPayables = purchaseOrders.reduce((sum, po) => sum + (po.balance || 0), 0);
  const ordersWithBalanceCount = purchaseOrders.filter(po => (po.balance || 0) > 0).length;

  // Filtered Suppliers
  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered Orders
  const filteredOrders = purchaseOrders.filter(po => {
    const query = searchQuery.toLowerCase();
    const matchesSearch = 
      po.id.toLowerCase().includes(query) ||
      po.supplierName.toLowerCase().includes(query) ||
      po.commodity.toLowerCase().includes(query) ||
      po.paymentMode.toLowerCase().includes(query) ||
      (po.description && po.description.toLowerCase().includes(query));

    const matchesStatus = 
      orderPaymentFilter === 'all' ? true : po.paymentStatus === orderPaymentFilter;

    const matchesMode = 
      orderPaymentModeFilter === 'all' ? true : po.paymentMode === orderPaymentModeFilter;

    return matchesSearch && matchesStatus && matchesMode;
  });

  // Save Supplier
  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) return;

    if (editingSupplier) {
      setSuppliers(prev => {
        const updated = prev.map(s => {
          if (s.id === editingSupplier.id) {
            return {
              ...s,
              name: supplierName.trim(),
              category: supplierCategory,
              contactPerson: supplierContact.trim(),
              phone: supplierPhone.trim(),
              email: supplierEmail.trim(),
              status: supplierStatus
            };
          }
          return s;
        });
        persistSuppliers(updated);
        return updated;
      });
      showToast(`Supplier "${supplierName}" updated!`);
    } else {
      const newSupplier: Supplier = {
        id: `SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
        name: supplierName.trim(),
        category: supplierCategory,
        contactPerson: supplierContact.trim() || 'General Rep',
        phone: supplierPhone.trim() || '+234 800 000 0000',
        email: supplierEmail.trim() || 'orders@supplier.ng',
        status: supplierStatus
      };
      setSuppliers(prev => {
        const updated = [newSupplier, ...prev];
        persistSuppliers(updated);
        return updated;
      });
      showToast(`Added new supplier "${newSupplier.name}"!`);
    }

    setIsSupplierModalOpen(false);
    setEditingSupplier(null);
  };

  // Open Create Order Modal
  const handleOpenCreateOrder = () => {
    if (suppliers.length > 0) {
      setPoSupplierId(suppliers[0].id);
    }
    setPoCommodity('Boneless Beef (Grade A)');
    setPoUnit('kg');
    setPoQuantity(50);
    setPoUnitCost(4500);
    setPoPaymentMode('Bank Transfer');
    setPoPaymentStatus('Fully Paid');
    setPoAmountPaidCustom(50 * 4500);
    setPoExpectedDate(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]);
    setPoNotes('');
    setIsOrderModalOpen(true);
  };

  // Save Purchase Order
  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId || !poCommodity.trim() || poQuantity <= 0 || poUnitCost <= 0) {
      alert('Please fill in valid commodity name, quantity, and unit cost.');
      return;
    }

    const matchedSupplier = suppliers.find(s => s.id === poSupplierId);
    const totalAmount = poQuantity * poUnitCost;
    let amountPaid = 0;

    if (poPaymentStatus === 'Fully Paid') {
      amountPaid = totalAmount;
    } else if (poPaymentStatus === 'Partially Paid') {
      amountPaid = Math.min(totalAmount, Math.max(0, poAmountPaidCustom));
    } else {
      amountPaid = 0;
    }

    const balance = Math.max(0, totalAmount - amountPaid);
    const newId = `PO-26-${String(purchaseOrders.length + 1).padStart(3, '0')}`;

    const newOrder: PurchaseOrder = {
      id: newId,
      supplierId: poSupplierId,
      supplierName: matchedSupplier ? matchedSupplier.name : 'Vendor Supply',
      commodity: poCommodity.trim(),
      quantity: Number(poQuantity),
      unit: poUnit,
      unitCost: Number(poUnitCost),
      totalAmount: totalAmount,
      paymentMode: poPaymentMode,
      paymentStatus: poPaymentStatus,
      amountPaid: amountPaid,
      balance: balance,
      orderDate: new Date().toISOString().split('T')[0],
      expectedDelivery: poExpectedDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      deliveryStatus: 'Pending',
      description: poNotes.trim() || `${poQuantity} ${poUnit} of ${poCommodity.trim()} @ ${formatNaira(poUnitCost)}/${poUnit}`,
      status: poPaymentStatus === 'Fully Paid' ? 'Paid' : 'Pending'
    };

    setPurchaseOrders(prev => {
      const updated = [newOrder, ...prev];
      persistOrders(updated);
      return updated;
    });

    showToast(`Purchase order ${newOrder.id} generated! Mode: ${poPaymentMode}, Balance: ${formatNaira(balance)}`);
    setIsOrderModalOpen(false);
    setActiveTab('orders');
  };

  // Toggle delivery status
  const handleToggleDelivery = (id: string) => {
    setPurchaseOrders(prev => {
      const updated = prev.map(po => {
        if (po.id === id) {
          const nextDelivery: 'Pending' | 'Received' = po.deliveryStatus === 'Received' ? 'Pending' : 'Received';
          return { 
            ...po, 
            deliveryStatus: nextDelivery,
            status: nextDelivery === 'Received' && po.paymentStatus === 'Fully Paid' ? 'Paid' : nextDelivery
          };
        }
        return po;
      });
      persistOrders(updated);
      return updated;
    });
    showToast(`Delivery status updated for order ${id}!`);
  };

  // Open Payment Settle Modal
  const handleOpenPaymentModal = (po: PurchaseOrder) => {
    setPaymentModalOrder(po);
    setPayAmount(po.balance);
    setPayMode(po.paymentMode);
  };

  // Record Payment towards balance
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentModalOrder || payAmount <= 0) return;

    if (payAmount > paymentModalOrder.balance) {
      alert(`Payment amount cannot exceed the outstanding balance of ${formatNaira(paymentModalOrder.balance)}`);
      return;
    }

    setPurchaseOrders(prev => {
      const updated = prev.map(po => {
        if (po.id === paymentModalOrder.id) {
          const newAmountPaid = (po.amountPaid || 0) + payAmount;
          const newBalance = Math.max(0, po.totalAmount - newAmountPaid);
          const newPaymentStatus: 'Fully Paid' | 'Partially Paid' = newBalance === 0 ? 'Fully Paid' : 'Partially Paid';
          return {
            ...po,
            amountPaid: newAmountPaid,
            balance: newBalance,
            paymentStatus: newPaymentStatus,
            paymentMode: payMode, // track latest mode of payment
            status: newPaymentStatus === 'Fully Paid' && po.deliveryStatus === 'Received' ? 'Paid' : po.status
          };
        }
        return po;
      });
      persistOrders(updated);
      return updated;
    });

    showToast(`Recorded payment of ${formatNaira(payAmount)} for order ${paymentModalOrder.id} via ${payMode}!`);
    setPaymentModalOrder(null);
  };

  // Delete Purchase Order
  const handleDeleteOrder = (id: string) => {
    if (confirm(`Are you sure you want to delete purchase order ${id}?`)) {
      setPurchaseOrders(prev => {
        const updated = prev.filter(po => po.id !== id);
        persistOrders(updated);
        return updated;
      });
      showToast(`Deleted purchase order ${id}.`);
    }
  };

  // Delete Supplier
  const handleDeleteSupplier = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete supplier "${name}"?`)) {
      setSuppliers(prev => {
        const updated = prev.filter(s => s.id !== id);
        persistSuppliers(updated);
        return updated;
      });
      showToast(`Deleted supplier "${name}".`);
    }
  };

  const openEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setSupplierName(supplier.name);
    setSupplierCategory(supplier.category);
    setSupplierContact(supplier.contactPerson);
    setSupplierPhone(supplier.phone);
    setSupplierEmail(supplier.email);
    setSupplierStatus(supplier.status);
    setIsSupplierModalOpen(true);
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
            <Truck className="w-6 h-6 text-[#C8B282]" />
            <span>Suppliers & Purchases</span>
          </h2>
          <p className="text-xs text-[#73706B] mt-1">
            Procurement workflow with item unit costs, payment modes (Cash / Transfer / POS), and live outstanding balance tracking.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenCreateOrder}
            className="px-4 py-2.5 bg-[#024628] hover:bg-[#03331d] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#C8B282]" />
            <span>+ Create Purchase Order</span>
          </button>

          <button
            onClick={() => {
              setEditingSupplier(null);
              setSupplierName('');
              setSupplierCategory('Vegetables & Fruits');
              setSupplierContact('');
              setSupplierPhone('');
              setSupplierEmail('');
              setSupplierStatus('Active');
              setIsSupplierModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#0b1221] hover:bg-[#1a2333] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#f59e0b]" />
            <span>+ Add Supplier</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Active Suppliers */}
        <div 
          onClick={() => setActiveTab('directory')}
          className="bg-white p-5 border border-[#E5E2DA] rounded-xl shadow-xs flex items-center gap-4 cursor-pointer hover:border-[#0b1221] transition-all"
        >
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-wider block">Active Suppliers</span>
            <span className="text-2xl font-bold font-serif text-[#1A1A1A] block mt-0.5">{activeSuppliersCount} Vendors</span>
            <span className="text-[11px] text-[#73706B]">Approved directory partners</span>
          </div>
        </div>

        {/* Pending Deliveries */}
        <div 
          onClick={() => {
            setActiveTab('orders');
            setOrderPaymentFilter('all');
          }}
          className="bg-white p-5 border border-[#E5E2DA] rounded-xl shadow-xs flex items-center gap-4 cursor-pointer hover:border-amber-300 transition-all"
        >
          <div className="w-12 h-12 bg-amber-50 text-[#b45309] rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-wider block">Pending Deliveries</span>
            <span className="text-2xl font-bold font-serif text-[#1A1A1A] block mt-0.5">{pendingDeliveriesCount} Orders</span>
            <span className="text-[11px] text-[#b45309] font-semibold">Awaiting stock arrival</span>
          </div>
        </div>

        {/* Outstanding Payables */}
        <div 
          onClick={() => {
            setActiveTab('orders');
            setOrderPaymentFilter('Unpaid');
          }}
          className={`p-5 border rounded-xl shadow-xs flex items-center gap-4 cursor-pointer transition-all ${
            outstandingPayables > 0 ? 'bg-red-50/40 border-red-200 hover:border-red-400' : 'bg-white border-[#E5E2DA]'
          }`}
        >
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0 border border-red-200">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Outstanding Payables</span>
              {ordersWithBalanceCount > 0 && (
                <span className="bg-red-200 text-red-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                  {ordersWithBalanceCount} unpaid
                </span>
              )}
            </div>
            <span className="text-2xl font-bold font-serif text-red-700 block mt-0.5">{formatNaira(outstandingPayables)}</span>
            <span className="text-[11px] text-[#73706B]">Remaining supplier balances</span>
          </div>
        </div>

        {/* Total Procurement & Settled */}
        <div 
          onClick={() => {
            setActiveTab('orders');
            setOrderPaymentFilter('all');
          }}
          className="bg-white p-5 border border-[#E5E2DA] rounded-xl shadow-xs flex items-center gap-4 cursor-pointer hover:border-emerald-300 transition-all"
        >
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-wider block">Total Procurement</span>
            <span className="text-2xl font-bold font-serif text-[#1A1A1A] block mt-0.5">{formatNaira(totalProcurement)}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">{formatNaira(totalAmountPaid)} settled</span>
          </div>
        </div>
      </div>

      {/* Main View Container */}
      <div className="bg-white border border-[#E5E2DA] rounded-xl shadow-xs overflow-hidden">
        {/* Navigation Tabs and Search */}
        <div className="border-b border-[#E5E2DA] bg-[#FAF9F5] flex flex-col md:flex-row justify-between items-stretch md:items-center px-4 py-2 gap-3">
          <div className="flex">
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'orders'
                  ? 'border-[#0b1221] text-[#0b1221] bg-white font-extrabold'
                  : 'border-transparent text-[#73706B] hover:text-[#0b1221]'
              }`}
            >
              <FileText className="w-4 h-4 text-[#024628]" />
              <span>Purchase Orders ({purchaseOrders.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-5 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'directory'
                  ? 'border-[#0b1221] text-[#0b1221] bg-white font-extrabold'
                  : 'border-transparent text-[#73706B] hover:text-[#0b1221]'
              }`}
            >
              <Users className="w-4 h-4 text-[#C8B282]" />
              <span>Supplier Directory ({suppliers.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {activeTab === 'orders' && (
              <>
                {/* Filter by Payment Status */}
                <select
                  value={orderPaymentFilter}
                  onChange={(e) => setOrderPaymentFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white border border-[#E5E2DA] rounded-lg text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                >
                  <option value="all">All Payment Statuses</option>
                  <option value="Fully Paid">🟢 Fully Paid</option>
                  <option value="Partially Paid">🟡 Partially Paid</option>
                  <option value="Unpaid">🔴 Unpaid / Outstanding</option>
                </select>

                {/* Filter by Payment Mode */}
                <select
                  value={orderPaymentModeFilter}
                  onChange={(e) => setOrderPaymentModeFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 bg-white border border-[#E5E2DA] rounded-lg text-xs font-semibold text-[#1A1A1A] focus:outline-none focus:border-[#1A1A1A]"
                >
                  <option value="all">All Modes</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                  <option value="POS Machine">POS Machine</option>
                </select>
              </>
            )}

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8984]" />
              <input
                type="text"
                placeholder={activeTab === 'directory' ? 'Search suppliers or categories...' : 'Search PO, item, or vendor...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E5E2DA] rounded-lg text-xs font-medium focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          </div>
        </div>

        {/* VIEW 1: PURCHASE ORDERS (Primary) */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1A1A1A] text-[#FDFCF9] font-mono text-[10px] uppercase tracking-wider">
                  <th className="p-3.5">P.O. Number & Date</th>
                  <th className="p-3.5">Supplier Name</th>
                  <th className="p-3.5">Commodity & Unit Cost</th>
                  <th className="p-3.5 text-right">Total Cost</th>
                  <th className="p-3.5">Payment Details</th>
                  <th className="p-3.5 text-center">Delivery</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DA]">
                {filteredOrders.map((po) => {
                  const hasBalance = (po.balance || 0) > 0;
                  return (
                    <tr key={po.id} className="hover:bg-[#FAF9F5] transition-colors">
                      {/* PO Number & Date */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold font-mono text-[#1A1A1A] text-sm">
                          {po.id}
                        </div>
                        <div className="text-[11px] text-[#73706B] flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3 h-3 text-[#A3A09A]" />
                          <span>{po.orderDate}</span>
                        </div>
                      </td>

                      {/* Supplier */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="font-bold text-[#1A1A1A] text-xs">
                          {po.supplierName}
                        </div>
                        <div className="text-[10px] text-[#8C8984] font-mono">
                          ID: {po.supplierId || 'N/A'}
                        </div>
                      </td>

                      {/* Commodity & Unit Cost */}
                      <td className="p-3.5">
                        <div className="font-bold text-[#1A1A1A] text-xs flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-[#C8B282]" />
                          <span>{po.commodity}</span>
                        </div>
                        <div className="text-[11px] text-[#555] font-mono mt-0.5">
                          <span className="font-semibold text-[#1A1A1A]">{po.quantity} {po.unit}</span>
                          <span className="text-[#8C8984]"> @ </span>
                          <span className="text-[#024628] font-semibold">{formatNaira(po.unitCost)}</span>
                          <span className="text-[#8C8984]">/{po.unit}</span>
                        </div>
                      </td>

                      {/* Total Cost */}
                      <td className="p-3.5 text-right font-mono font-bold text-[#1A1A1A] text-sm whitespace-nowrap">
                        {formatNaira(po.totalAmount)}
                      </td>

                      {/* Payment Details (Mode, Status, Amount Paid & Balance) */}
                      <td className="p-3.5 whitespace-nowrap">
                        <div className="space-y-1">
                          {/* Payment Mode & Status Badges */}
                          <div className="flex items-center gap-1.5">
                            {/* Mode Badge */}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              po.paymentMode === 'Bank Transfer'
                                ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                : po.paymentMode === 'Cash'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-purple-50 text-purple-700 border border-purple-200'
                            }`}>
                              {po.paymentMode === 'Bank Transfer' && <Landmark className="w-2.5 h-2.5" />}
                              {po.paymentMode === 'Cash' && <Banknote className="w-2.5 h-2.5" />}
                              {po.paymentMode === 'POS Machine' && <CreditCard className="w-2.5 h-2.5" />}
                              <span>{po.paymentMode}</span>
                            </span>

                            {/* Status Badge */}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              po.paymentStatus === 'Fully Paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : po.paymentStatus === 'Partially Paid'
                                ? 'bg-amber-100 text-amber-900'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {po.paymentStatus}
                            </span>
                          </div>

                          {/* Paid vs Balance Breakdown */}
                          <div className="text-[11px] font-mono">
                            {po.paymentStatus === 'Fully Paid' ? (
                              <span className="text-emerald-700 font-semibold">100% Settled</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <span className="text-[#555]">Paid: {formatNaira(po.amountPaid || 0)}</span>
                                <span className="text-red-600 font-bold bg-red-50 px-1 rounded">
                                  Bal: {formatNaira(po.balance || 0)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Delivery Status */}
                      <td className="p-3.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleDelivery(po.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                            po.deliveryStatus === 'Received'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                          title="Click to toggle delivery status"
                        >
                          {po.deliveryStatus === 'Received' ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-700" />
                              <span>Received</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-700" />
                              <span>Pending</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {hasBalance && (
                            <button
                              type="button"
                              onClick={() => handleOpenPaymentModal(po)}
                              className="px-2.5 py-1 bg-[#024628] hover:bg-[#03331d] text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                              title="Record payment towards balance"
                            >
                              <CreditCard className="w-3 h-3 text-[#C8B282]" />
                              <span>Pay Bal.</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteOrder(po.id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                            title="Delete Purchase Order"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#73706B]">
                      No purchase orders found matching your search or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 2: SUPPLIER DIRECTORY */}
        {activeTab === 'directory' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1A1A1A] text-[#FDFCF9] font-mono text-[10px] uppercase tracking-wider">
                  <th className="p-3.5">Supplier Name & ID</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Contact Person</th>
                  <th className="p-3.5">Phone & Email</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DA]">
                {filteredSuppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-[#FAF9F5] transition-colors">
                    {/* Supplier Name */}
                    <td className="p-3.5 font-bold text-[#1A1A1A] whitespace-nowrap">
                      <div>
                        <span>{s.name}</span>
                        <span className="block text-[10px] font-mono font-normal text-[#8C8984] mt-0.5">
                          ID: {s.id}
                        </span>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3.5 text-[#555]">
                      <span className="px-2 py-0.5 bg-[#f0f4f8] rounded text-[10px] font-semibold text-[#334155]">
                        {s.category}
                      </span>
                    </td>

                    {/* Contact Person */}
                    <td className="p-3.5 text-[#1A1A1A] font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-[#8C8984]" />
                        <span>{s.contactPerson}</span>
                      </div>
                    </td>

                    {/* Phone & Email */}
                    <td className="p-3.5 text-[#555] whitespace-nowrap">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 text-[#1A1A1A] font-mono">
                          <Phone className="w-3 h-3 text-[#A3A09A]" />
                          <span>{s.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-[#73706B]">
                          <Mail className="w-3 h-3 text-[#A3A09A]" />
                          <span>{s.email}</span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.status === 'Active' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {s.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditSupplier(s)}
                          className="p-1.5 text-[#0b1221] hover:bg-[#E5E2DA] rounded transition-colors cursor-pointer"
                          title="Edit Supplier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSupplier(s.id, s.name)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Delete Supplier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#73706B]">
                      No suppliers found matching your query.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Create Purchase Order */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <form onSubmit={handleSaveOrder} className="bg-white max-w-xl w-full p-6 border border-[#1A1A1A] rounded-xl shadow-2xl space-y-4 my-8">
            <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#C8B282]" />
                  <span>Issue Purchase Order</span>
                </h3>
                <p className="text-xs text-[#73706B]">
                  Record commodity unit cost, payment mode, and track full or partial settlement.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="text-xs font-bold text-[#8C8984] hover:text-[#1A1A1A] p-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Supplier Selection */}
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Select Supplier *</label>
                <select
                  required
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded font-semibold text-xs"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category})
                    </option>
                  ))}
                </select>
              </div>

              {/* Commodity Details */}
              <div className="p-3 bg-[#FAF9F5] rounded-lg border border-[#E5E2DA] space-y-3">
                <div className="font-bold text-[#1A1A1A] text-xs flex items-center gap-1.5 text-[#024628]">
                  <Package className="w-4 h-4 text-[#C8B282]" />
                  <span>Commodity & Pricing</span>
                </div>

                {/* Commodity Name */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-[#1A1A1A]">Commodity / Item Name *</label>
                    <span className="text-[10px] text-[#8C8984]">Select preset or type custom</span>
                  </div>
                  <input
                    type="text"
                    required
                    list="commodity-presets"
                    placeholder="e.g. Boneless Beef (Grade A)"
                    value={poCommodity}
                    onChange={(e) => setPoCommodity(e.target.value)}
                    className="w-full p-2.5 bg-white border border-[#E5E2DA] rounded font-semibold text-xs"
                  />
                  <datalist id="commodity-presets">
                    {COMMODITY_PRESETS.map((item, idx) => (
                      <option key={idx} value={item} />
                    ))}
                  </datalist>
                </div>

                {/* Unit, Quantity, Unit Cost Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-[#1A1A1A] block mb-1">Unit of Measure *</label>
                    <select
                      value={poUnit}
                      onChange={(e) => setPoUnit(e.target.value)}
                      className="w-full p-2 bg-white border border-[#E5E2DA] rounded text-xs font-semibold"
                    >
                      {UNIT_OPTIONS.map((u) => (
                        <option key={u.value} value={u.value}>{u.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="font-bold text-[#1A1A1A] block mb-1">Quantity *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={poQuantity || ''}
                      onChange={(e) => setPoQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                      className="w-full p-2 bg-white border border-[#E5E2DA] rounded font-mono font-bold text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[#1A1A1A] block mb-1">Unit Cost (₦) *</label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={poUnitCost || ''}
                      onChange={(e) => setPoUnitCost(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full p-2 bg-white border border-[#E5E2DA] rounded font-mono font-bold text-xs text-[#024628]"
                    />
                  </div>
                </div>

                {/* Auto Calculated Total Banner */}
                <div className="flex justify-between items-center bg-[#0b1221] text-white p-2.5 rounded">
                  <span className="text-[11px] text-white/80 uppercase font-semibold tracking-wider">
                    Total Amount ({poQuantity} {poUnit} × {formatNaira(poUnitCost)}):
                  </span>
                  <span className="text-base font-serif font-bold text-[#C8B282]">
                    {formatNaira(calculatedPoTotal)}
                  </span>
                </div>
              </div>

              {/* Payment Details */}
              <div className="p-3 bg-[#FAF9F5] rounded-lg border border-[#E5E2DA] space-y-3">
                <div className="font-bold text-[#1A1A1A] text-xs flex items-center gap-1.5 text-[#024628]">
                  <CreditCard className="w-4 h-4 text-[#C8B282]" />
                  <span>Payment Terms & Settlement</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Mode of Payment */}
                  <div>
                    <label className="font-bold text-[#1A1A1A] block mb-1">Mode of Payment *</label>
                    <select
                      value={poPaymentMode}
                      onChange={(e) => setPoPaymentMode(e.target.value as any)}
                      className="w-full p-2.5 bg-white border border-[#E5E2DA] rounded font-semibold text-xs"
                    >
                      <option value="Bank Transfer">🏦 Bank Transfer</option>
                      <option value="Cash">💵 Cash</option>
                      <option value="POS Machine">💳 POS Machine</option>
                    </select>
                  </div>

                  {/* Payment Status */}
                  <div>
                    <label className="font-bold text-[#1A1A1A] block mb-1">Payment Status *</label>
                    <select
                      value={poPaymentStatus}
                      onChange={(e) => {
                        const next = e.target.value as 'Fully Paid' | 'Partially Paid' | 'Unpaid';
                        setPoPaymentStatus(next);
                        if (next === 'Partially Paid' && poAmountPaidCustom === 0) {
                          setPoAmountPaidCustom(Math.round(calculatedPoTotal / 2));
                        }
                      }}
                      className="w-full p-2.5 bg-white border border-[#E5E2DA] rounded font-semibold text-xs"
                    >
                      <option value="Fully Paid">🟢 Fully Paid (No Balance)</option>
                      <option value="Partially Paid">🟡 Partially Paid (Deposit / Part Payment)</option>
                      <option value="Unpaid">🔴 Unpaid / Full Outstanding Balance</option>
                    </select>
                  </div>
                </div>

                {/* If Partially Paid, show Amount Paid field */}
                {poPaymentStatus === 'Partially Paid' && (
                  <div className="bg-amber-50 p-2.5 rounded border border-amber-200 space-y-2">
                    <label className="font-bold text-amber-900 block text-xs">
                      Amount Paid Now (₦) *
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={calculatedPoTotal}
                      value={poAmountPaidCustom || ''}
                      onChange={(e) => setPoAmountPaidCustom(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-full p-2 bg-white border border-amber-300 rounded font-mono font-bold text-xs"
                      placeholder="Enter amount paid today"
                    />
                    <div className="flex justify-between items-center text-[11px] font-mono">
                      <span className="text-amber-800">Paid: {formatNaira(effectiveAmountPaid)}</span>
                      <span className="text-red-700 font-bold">Outstanding Balance: {formatNaira(calculatedBalance)}</span>
                    </div>
                  </div>
                )}

                {/* Unpaid Badge */}
                {poPaymentStatus === 'Unpaid' && (
                  <div className="bg-red-50 p-2 rounded border border-red-200 text-xs flex justify-between items-center text-red-800 font-semibold">
                    <span>Full Amount Due on Delivery / Credit:</span>
                    <span className="font-mono font-bold">{formatNaira(calculatedPoTotal)}</span>
                  </div>
                )}

                {/* Fully Paid Badge */}
                {poPaymentStatus === 'Fully Paid' && (
                  <div className="bg-emerald-50 p-2 rounded border border-emerald-200 text-xs flex justify-between items-center text-emerald-800 font-semibold">
                    <span>Paid in Full via {poPaymentMode}:</span>
                    <span className="font-mono font-bold">{formatNaira(calculatedPoTotal)} (₦0 Balance)</span>
                  </div>
                )}
              </div>

              {/* Delivery Date & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={poExpectedDate}
                    onChange={(e) => setPoExpectedDate(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Notes / Batch Spec (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Morning delivery, invoice attached"
                    value={poNotes}
                    onChange={(e) => setPoNotes(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded text-xs"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[#E5E2DA]">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#024628] hover:bg-[#03331d] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Confirm & Issue Order
              </button>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="px-4 py-2.5 bg-[#F5F2ED] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider rounded hover:bg-[#e8e4dc] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Record Balance Payment */}
      {paymentModalOrder && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleRecordPayment} className="bg-white max-w-md w-full p-6 border border-[#1A1A1A] rounded-xl shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A] flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-[#C8B282]" />
                  <span>Settle Outstanding Balance</span>
                </h3>
                <p className="text-xs text-[#73706B]">Order {paymentModalOrder.id} • {paymentModalOrder.supplierName}</p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOrder(null)}
                className="text-xs font-bold text-[#8C8984] hover:text-[#1A1A1A]"
              >
                ✕ Close
              </button>
            </div>

            <div className="bg-[#FAF9F5] p-3 rounded border border-[#E5E2DA] space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#73706B]">Commodity:</span>
                <span className="font-bold text-[#1A1A1A]">{paymentModalOrder.commodity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#73706B]">Total Order Value:</span>
                <span className="font-mono font-bold">{formatNaira(paymentModalOrder.totalAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#73706B]">Previously Paid:</span>
                <span className="font-mono text-emerald-700">{formatNaira(paymentModalOrder.amountPaid || 0)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#E5E2DA] font-bold text-sm">
                <span className="text-red-700">Current Balance:</span>
                <span className="font-mono text-red-700">{formatNaira(paymentModalOrder.balance)}</span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Mode of Payment *</label>
                <select
                  value={payMode}
                  onChange={(e) => setPayMode(e.target.value as any)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded font-semibold text-xs"
                >
                  <option value="Bank Transfer">🏦 Bank Transfer</option>
                  <option value="Cash">💵 Cash</option>
                  <option value="POS Machine">💳 POS Machine</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-bold text-[#1A1A1A]">Payment Amount (₦) *</label>
                  <button
                    type="button"
                    onClick={() => setPayAmount(paymentModalOrder.balance)}
                    className="text-[10px] text-blue-700 font-bold hover:underline"
                  >
                    Pay Full Balance
                  </button>
                </div>
                <input
                  type="number"
                  min={1}
                  max={paymentModalOrder.balance}
                  required
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded font-mono font-bold text-sm text-[#024628]"
                />
              </div>

              <div className="bg-blue-50 p-2.5 rounded text-[11px] text-blue-900">
                New remaining balance after this payment: <strong>{formatNaira(Math.max(0, paymentModalOrder.balance - (payAmount || 0)))}</strong>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[#E5E2DA]">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#024628] hover:bg-[#03331d] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Record Payment
              </button>
              <button
                type="button"
                onClick={() => setPaymentModalOrder(null)}
                className="px-4 py-2.5 bg-[#F5F2ED] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: New / Edit Supplier */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveSupplier} className="bg-white max-w-md w-full p-6 border border-[#1A1A1A] rounded-xl shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  {editingSupplier ? 'Edit Vendor Details' : 'Register New Supplier'}
                </h3>
                <p className="text-xs text-[#73706B]">Vendor contact information and product specialization.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsSupplierModalOpen(false);
                  setEditingSupplier(null);
                }}
                className="text-xs font-bold text-[#8C8984] hover:text-[#1A1A1A]"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Company / Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. GreenValley Fresh Produce"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded font-semibold text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Product Category *</label>
                <select
                  value={supplierCategory}
                  onChange={(e) => setSupplierCategory(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded text-xs"
                >
                  <option value="Vegetables & Fruits">Vegetables & Fruits</option>
                  <option value="Meat & Poultry">Meat & Poultry</option>
                  <option value="Seafood">Seafood</option>
                  <option value="Beverages">Beverages</option>
                  <option value="Packaging">Packaging</option>
                  <option value="Dry Goods & Grains">Dry Goods & Grains</option>
                  <option value="General Equipment">General Equipment</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Contact Person</label>
                <input
                  type="text"
                  placeholder="e.g. Alhaji Musa"
                  value={supplierContact}
                  onChange={(e) => setSupplierContact(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="+234 800 000 0000"
                    value={supplierPhone}
                    onChange={(e) => setSupplierPhone(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Status</label>
                  <select
                    value={supplierStatus}
                    onChange={(e) => setSupplierStatus(e.target.value as 'Active' | 'Inactive')}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded text-xs"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Email Address</label>
                <input
                  type="email"
                  placeholder="orders@supplier.com"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[#E5E2DA]">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#0b1221] hover:bg-[#1a2333] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                {editingSupplier ? 'Save Supplier Details' : 'Register Supplier'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSupplierModalOpen(false);
                  setEditingSupplier(null);
                }}
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
