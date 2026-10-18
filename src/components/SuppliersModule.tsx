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
  AlertCircle
} from 'lucide-react';

const SUPPLIERS_STORAGE_KEY = 'fulbe_restaurant_suppliers';
const PURCHASE_ORDERS_STORAGE_KEY = 'fulbe_restaurant_purchase_orders';

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
        return parsed;
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
  const [activeTab, setActiveTab] = useState<'directory' | 'orders'>('directory');
  const [suppliers, setSuppliers] = useState<Supplier[]>(loadSuppliersFromStorage);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(loadOrdersFromStorage);
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);

  // Form State: Supplier
  const [supplierName, setSupplierName] = useState('');
  const [supplierCategory, setSupplierCategory] = useState('Vegetables & Fruits');
  const [supplierContact, setSupplierContact] = useState('');
  const [supplierPhone, setSupplierPhone] = useState('');
  const [supplierEmail, setSupplierEmail] = useState('');
  const [supplierStatus, setSupplierStatus] = useState<'Active' | 'Inactive'>('Active');

  // Form State: Purchase Order
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poDescription, setPoDescription] = useState('');
  const [poAmount, setPoAmount] = useState<number>(50000);
  const [poExpectedDate, setPoExpectedDate] = useState('');

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

  // Metrics
  const activeSuppliersCount = suppliers.filter(s => s.status === 'Active').length;
  const pendingDeliveriesCount = purchaseOrders.filter(po => po.status === 'Pending').length;
  const outstandingPayables = purchaseOrders.filter(po => po.status !== 'Paid').reduce((sum, po) => sum + po.totalAmount, 0);
  const totalProcurement = purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0);

  // Filtered Suppliers
  const filteredSuppliers = suppliers.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.contactPerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filtered Orders
  const filteredOrders = purchaseOrders.filter(po =>
    po.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    po.supplierName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    po.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    po.status.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  // Save Purchase Order
  const handleSaveOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!poSupplierId || poAmount <= 0) return;

    const matchedSupplier = suppliers.find(s => s.id === poSupplierId);
    const newOrder: PurchaseOrder = {
      id: `PO-26-${String(purchaseOrders.length + 1).padStart(3, '0')}`,
      supplierId: poSupplierId,
      supplierName: matchedSupplier ? matchedSupplier.name : 'Vendor Supply',
      description: poDescription.trim() || 'General Kitchen Supplies',
      totalAmount: Number(poAmount),
      orderDate: new Date().toISOString().split('T')[0],
      expectedDelivery: poExpectedDate || new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
      status: 'Pending'
    };

    setPurchaseOrders(prev => {
      const updated = [newOrder, ...prev];
      persistOrders(updated);
      return updated;
    });

    showToast(`Purchase order ${newOrder.id} generated!`);
    setIsOrderModalOpen(false);
    setPoSupplierId('');
    setPoDescription('');
    setPoAmount(50000);
    setPoExpectedDate('');
    setActiveTab('orders');
  };

  const handleUpdateOrderStatus = (id: string, newStatus: 'Received' | 'Paid') => {
    setPurchaseOrders(prev => {
      const updated = prev.map(po => {
        if (po.id === id) {
          return { ...po, status: newStatus };
        }
        return po;
      });
      persistOrders(updated);
      return updated;
    });
    showToast(`Order status updated to ${newStatus}!`);
  };

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
        <div className="bg-[#0b1221] text-white px-4 py-3 rounded-lg text-xs font-semibold flex items-center justify-between shadow-lg border border-[#f59e0b]/40">
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
          <h2 className="font-serif font-bold text-2xl text-[#1A1A1A] flex items-center gap-2">
            <Truck className="w-6 h-6 text-[#C8B282]" />
            <span>Suppliers & Purchases</span>
          </h2>
          <p className="text-xs text-[#73706B] mt-1">
            Manage certified vendor directories, track procurement orders, and monitor accounts payable.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (suppliers.length > 0) {
                setPoSupplierId(suppliers[0].id);
              }
              setIsOrderModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#f4f7f6] hover:bg-[#e9ecef] border border-[#d1d5db] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg transition-all cursor-pointer shadow-2xs"
          >
            <FileText className="w-4 h-4 text-[#024628]" />
            <span>+ Create P.O.</span>
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
        <div className="bg-white p-5 border border-[#E5E2DA] rounded-xl shadow-xs flex items-center gap-4">
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
          onClick={() => setActiveTab('orders')}
          className="bg-white p-5 border border-[#E5E2DA] rounded-xl shadow-xs flex items-center gap-4 cursor-pointer hover:border-amber-300 transition-colors"
        >
          <div className="w-12 h-12 bg-amber-50 text-[#b45309] rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-wider block">Pending Deliveries</span>
            <span className="text-2xl font-bold font-serif text-[#1A1A1A] block mt-0.5">{pendingDeliveriesCount} Orders</span>
            <span className="text-[11px] text-[#b45309] font-semibold">Awaiting arrival</span>
          </div>
        </div>

        {/* Outstanding Payables */}
        <div className="bg-white p-5 border border-[#E5E2DA] rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center shrink-0 border border-red-100">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Outstanding Payables</span>
            <span className="text-2xl font-bold font-serif text-red-700 block mt-0.5">{formatNaira(outstandingPayables)}</span>
            <span className="text-[11px] text-[#73706B]">Unsettled invoices</span>
          </div>
        </div>

        {/* Total Procurement */}
        <div className="bg-white p-5 border border-[#E5E2DA] rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-wider block">Total Procurement</span>
            <span className="text-2xl font-bold font-serif text-[#1A1A1A] block mt-0.5">{formatNaira(totalProcurement)}</span>
            <span className="text-[11px] text-emerald-600 font-semibold">All recorded P.O.s</span>
          </div>
        </div>
      </div>

      {/* Main View Container */}
      <div className="bg-white border border-[#E5E2DA] rounded-xl shadow-xs overflow-hidden">
        {/* Navigation Tabs and Search */}
        <div className="border-b border-[#E5E2DA] bg-[#FAF9F5] flex flex-col sm:flex-row justify-between items-center px-4 gap-3">
          <div className="flex w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('directory')}
              className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'directory'
                  ? 'border-[#0b1221] text-[#0b1221] bg-white'
                  : 'border-transparent text-[#73706B] hover:text-[#0b1221]'
              }`}
            >
              Supplier Directory ({suppliers.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`px-5 py-3.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === 'orders'
                  ? 'border-[#0b1221] text-[#0b1221] bg-white'
                  : 'border-transparent text-[#73706B] hover:text-[#0b1221]'
              }`}
            >
              Purchase Orders ({purchaseOrders.length})
            </button>
          </div>

          <div className="py-2.5 w-full sm:w-72">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8C8984]" />
              <input
                type="text"
                placeholder={activeTab === 'directory' ? 'Search suppliers or categories...' : 'Search P.O.s or vendors...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#E5E2DA] rounded-lg text-xs font-medium focus:outline-none focus:border-[#1A1A1A]"
              />
            </div>
          </div>
        </div>

        {/* VIEW 1: SUPPLIER DIRECTORY */}
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

        {/* VIEW 2: PURCHASE ORDERS */}
        {activeTab === 'orders' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1A1A1A] text-[#FDFCF9] font-mono text-[10px] uppercase tracking-wider">
                  <th className="p-3.5">P.O. Number</th>
                  <th className="p-3.5">Supplier Name</th>
                  <th className="p-3.5">Description</th>
                  <th className="p-3.5 text-right">Total Amount</th>
                  <th className="p-3.5">Order / Expected Date</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DA]">
                {filteredOrders.map((po) => (
                  <tr key={po.id} className="hover:bg-[#FAF9F5] transition-colors">
                    {/* PO Number */}
                    <td className="p-3.5 font-bold font-mono text-[#1A1A1A] whitespace-nowrap">
                      {po.id}
                    </td>

                    {/* Supplier */}
                    <td className="p-3.5 font-bold text-[#1A1A1A] whitespace-nowrap">
                      {po.supplierName}
                    </td>

                    {/* Description */}
                    <td className="p-3.5 text-[#555] max-w-xs truncate" title={po.description}>
                      {po.description}
                    </td>

                    {/* Total Amount */}
                    <td className="p-3.5 text-right font-mono font-bold text-[#1A1A1A] whitespace-nowrap">
                      {formatNaira(po.totalAmount)}
                    </td>

                    {/* Dates */}
                    <td className="p-3.5 text-[#555] whitespace-nowrap text-[11px]">
                      <div>
                        <span className="text-[#8C8984]">Ordered:</span> {po.orderDate}
                      </div>
                      <div>
                        <span className="text-[#8C8984]">Expected:</span> {po.expectedDelivery}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        po.status === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : po.status === 'Received'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {po.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {po.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(po.id, 'Received')}
                            className="px-2.5 py-1 bg-[#0b1221] hover:bg-[#1a2333] text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Mark Received
                          </button>
                        )}

                        {po.status === 'Received' && (
                          <button
                            type="button"
                            onClick={() => handleUpdateOrderStatus(po.id, 'Paid')}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
                          >
                            Mark Paid
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteOrder(po.id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#73706B]">
                      No purchase orders found matching your search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

      {/* MODAL: New Purchase Order */}
      {isOrderModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveOrder} className="bg-white max-w-lg w-full p-6 border border-[#1A1A1A] rounded-xl shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A] flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#C8B282]" />
                  <span>Create Purchase Order</span>
                </h3>
                <p className="text-xs text-[#73706B]">Authorize procurement from certified suppliers.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
                className="text-xs font-bold text-[#8C8984] hover:text-[#1A1A1A]"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
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

              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Order Description / Line Items *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. 5 bags of Long Grain Rice, 10 crates of Coca-Cola, 40kg Beef..."
                  value={poDescription}
                  onChange={(e) => setPoDescription(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Total Procurement Amount (₦) *</label>
                  <input
                    type="number"
                    min={100}
                    required
                    value={poAmount}
                    onChange={(e) => setPoAmount(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded font-mono font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Expected Delivery Date</label>
                  <input
                    type="date"
                    value={poExpectedDate}
                    onChange={(e) => setPoExpectedDate(e.target.value)}
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
                Issue Purchase Order
              </button>
              <button
                type="button"
                onClick={() => setIsOrderModalOpen(false)}
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
