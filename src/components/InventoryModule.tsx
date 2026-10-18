import React, { useState, useEffect } from 'react';
import type { InventoryItem } from '../types';
import { INITIAL_INVENTORY_ITEMS } from '../data/restaurantData';
import { formatNaira } from '../utils/formatters';
import { 
  Package, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Plus, 
  Truck, 
  DollarSign, 
  Edit2, 
  Trash2, 
  ArrowDownToLine
} from 'lucide-react';

const INVENTORY_STORAGE_KEY = 'restaurant_management_inventory';

function loadInventoryFromStorage(): InventoryItem[] {
  try {
    const saved = 
      localStorage.getItem(INVENTORY_STORAGE_KEY) || 
      sessionStorage.getItem(INVENTORY_STORAGE_KEY) ||
      localStorage.getItem('fulbe_restaurant_inventory') || 
      sessionStorage.getItem('fulbe_restaurant_inventory');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load inventory from storage', e);
  }
  return INITIAL_INVENTORY_ITEMS;
}

function persistInventory(items: InventoryItem[]) {
  try {
    localStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {}
  try {
    sessionStorage.setItem(INVENTORY_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {}
}

export const InventoryModule: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>(loadInventoryFromStorage);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [onlyLowStock, setOnlyLowStock] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modals
  const [isNewItemModalOpen, setIsNewItemModalOpen] = useState(false);
  const [isRestockModalOpen, setIsRestockModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  // Form State: New Item
  const [newItemName, setNewItemName] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Raw Ingredients');
  const [newItemUnit, setNewItemUnit] = useState('kg');
  const [newItemStock, setNewItemStock] = useState<number>(10);
  const [newItemThreshold, setNewItemThreshold] = useState<number>(5);
  const [newItemCost, setNewItemCost] = useState<number>(2000);
  const [newItemSupplier, setNewItemSupplier] = useState('');

  // Form State: Restock
  const [restockItemId, setRestockItemId] = useState<string>('');
  const [restockQty, setRestockQty] = useState<number>(10);
  const [restockNote, setRestockNote] = useState<string>('');

  useEffect(() => {
    persistInventory(items);
  }, [items]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Metrics
  const totalValue = items.reduce((sum, item) => sum + (item.quantityInStock * item.costPerUnit), 0);
  const lowStockItems = items.filter(item => item.quantityInStock <= item.minimumThreshold);
  const healthyStockCount = items.length - lowStockItems.length;

  // Categories list
  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];

  // Filtered Items
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesLowStock = !onlyLowStock || item.quantityInStock <= item.minimumThreshold;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Direct quick stepper inline
  const handleQuickStep = (id: string, delta: number) => {
    setItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantityInStock + delta);
          return { ...item, quantityInStock: newQty };
        }
        return item;
      });
      persistInventory(updated);
      return updated;
    });
  };

  // Create or Update Item
  const handleSaveItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    if (editingItem) {
      setItems(prev => {
        const updated = prev.map(item => {
          if (item.id === editingItem.id) {
            return {
              ...item,
              name: newItemName.trim(),
              category: newItemCategory,
              unit: newItemUnit,
              quantityInStock: Number(newItemStock) || 0,
              minimumThreshold: Number(newItemThreshold) || 1,
              costPerUnit: Number(newItemCost) || 0,
              supplier: newItemSupplier.trim() || undefined
            };
          }
          return item;
        });
        persistInventory(updated);
        return updated;
      });
      showToast(`Updated "${newItemName}" stock details!`);
    } else {
      const newItem: InventoryItem = {
        id: `INV-${String(items.length + 1).padStart(3, '0')}`,
        name: newItemName.trim(),
        category: newItemCategory,
        unit: newItemUnit,
        quantityInStock: Number(newItemStock) || 0,
        minimumThreshold: Number(newItemThreshold) || 1,
        costPerUnit: Number(newItemCost) || 0,
        supplier: newItemSupplier.trim() || 'General Supplier',
        lastRestocked: new Date().toISOString().split('T')[0]
      };
      setItems(prev => {
        const updated = [newItem, ...prev];
        persistInventory(updated);
        return updated;
      });
      showToast(`Added "${newItem.name}" to inventory!`);
    }

    // Reset & Close
    setIsNewItemModalOpen(false);
    setEditingItem(null);
    setNewItemName('');
    setNewItemCategory('Raw Ingredients');
    setNewItemUnit('kg');
    setNewItemStock(10);
    setNewItemThreshold(5);
    setNewItemCost(2000);
    setNewItemSupplier('');
  };

  // Inbound Stock / Receive Delivery
  const handleReceiveStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItemId || restockQty <= 0) return;

    setItems(prev => {
      const updated = prev.map(item => {
        if (item.id === restockItemId) {
          return {
            ...item,
            quantityInStock: item.quantityInStock + restockQty,
            lastRestocked: new Date().toISOString().split('T')[0]
          };
        }
        return item;
      });
      persistInventory(updated);
      return updated;
    });

    const targetItem = items.find(i => i.id === restockItemId);
    showToast(`Restocked +${restockQty} ${targetItem?.unit || 'units'} of "${targetItem?.name}"!`);
    setIsRestockModalOpen(false);
    setRestockItemId('');
    setRestockQty(10);
    setRestockNote('');
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}" from inventory tracking?`)) {
      setItems(prev => {
        const updated = prev.filter(i => i.id !== id);
        persistInventory(updated);
        return updated;
      });
      showToast(`Deleted "${name}" from inventory.`);
    }
  };

  const openEditModal = (item: InventoryItem) => {
    setEditingItem(item);
    setNewItemName(item.name);
    setNewItemCategory(item.category);
    setNewItemUnit(item.unit);
    setNewItemStock(item.quantityInStock);
    setNewItemThreshold(item.minimumThreshold);
    setNewItemCost(item.costPerUnit);
    setNewItemSupplier(item.supplier || '');
    setIsNewItemModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
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
            <Package className="w-6 h-6 text-[#C8B282]" />
            <span>Inventory & Stock Management</span>
          </h2>
          <p className="text-xs text-[#73706B] mt-1">
            Track raw ingredients, monitor low-stock thresholds, and record inbound supplier deliveries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => {
              if (items.length > 0) {
                setRestockItemId(items[0].id);
              }
              setIsRestockModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#f4f7f6] hover:bg-[#e9ecef] border border-[#d1d5db] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg transition-all cursor-pointer shadow-2xs"
          >
            <ArrowDownToLine className="w-4 h-4 text-[#024628]" />
            <span>Receive Stock</span>
          </button>

          <button
            onClick={() => {
              setEditingItem(null);
              setNewItemName('');
              setNewItemCategory('Raw Ingredients');
              setNewItemUnit('kg');
              setNewItemStock(10);
              setNewItemThreshold(5);
              setNewItemCost(2000);
              setNewItemSupplier('');
              setIsNewItemModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#0b1221] hover:bg-[#1a2333] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 rounded-lg transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-4 h-4 text-[#f59e0b]" />
            <span>+ Add New Item</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Items */}
        <div className="bg-white p-5 border border-[#E5E2DA] rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-wider block">Total Items Tracked</span>
            <span className="text-2xl font-bold font-serif text-[#1A1A1A] block mt-0.5">{items.length} Items</span>
            <span className="text-[11px] text-[#73706B]">In active stock inventory</span>
          </div>
        </div>

        {/* Total Inventory Value */}
        <div className="bg-white p-5 border border-[#E5E2DA] rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-[#b45309] rounded-xl flex items-center justify-center shrink-0 border border-amber-100">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-wider block">Total Stock Value</span>
            <span className="text-2xl font-bold font-serif text-[#1A1A1A] block mt-0.5">{formatNaira(totalValue)}</span>
            <span className="text-[11px] text-[#2D5A44] font-semibold">Current valuation</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div 
          onClick={() => setOnlyLowStock(prev => !prev)}
          className={`p-5 border rounded-xl shadow-xs flex items-center gap-4 cursor-pointer transition-all ${
            onlyLowStock 
              ? 'bg-red-50 border-red-300 ring-2 ring-red-400' 
              : 'bg-white border-[#E5E2DA] hover:border-red-300'
          }`}
        >
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-xl flex items-center justify-center shrink-0 border border-red-200">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block">Low Stock Alerts</span>
            <span className="text-2xl font-bold font-serif text-red-700 block mt-0.5">{lowStockItems.length} Items</span>
            <span className="text-[11px] text-red-600 underline font-semibold">
              {onlyLowStock ? 'Showing low stock only ✕' : 'Click to filter'}
            </span>
          </div>
        </div>

        {/* Healthy Stock */}
        <div className="bg-white p-5 border border-[#E5E2DA] rounded-xl shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-[#8C8984] uppercase tracking-wider block">Healthy Stock</span>
            <span className="text-2xl font-bold font-serif text-[#1A1A1A] block mt-0.5">{healthyStockCount} Items</span>
            <span className="text-[11px] text-emerald-600 font-semibold">Above reorder threshold</span>
          </div>
        </div>
      </div>

      {/* Main Stock Table Card */}
      <div className="bg-white border border-[#E5E2DA] rounded-xl shadow-xs overflow-hidden">
        {/* Table Filters & Search Bar */}
        <div className="p-4 border-b border-[#E5E2DA] bg-[#FAF9F5] flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-[#8C8984] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by item name, ID, or supplier..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-[#E5E2DA] rounded-lg text-xs font-medium focus:outline-none focus:border-[#1A1A1A]"
            />
          </div>

          {/* Category Filter Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all border ${
                  selectedCategory === cat
                    ? 'bg-[#0b1221] text-white border-[#0b1221]'
                    : 'bg-white text-[#73706B] border-[#E5E2DA] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Stock Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#1A1A1A] text-[#FDFCF9] font-mono text-[10px] uppercase tracking-wider">
                <th className="p-3.5">Item Name & ID</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5 text-center">Quick Adjust</th>
                <th className="p-3.5 text-right">In Stock</th>
                <th className="p-3.5 text-right">Cost / Unit</th>
                <th className="p-3.5 text-right">Total Value</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E2DA]">
              {filteredItems.map((item) => {
                const isLow = item.quantityInStock <= item.minimumThreshold;
                const totalRowValue = item.quantityInStock * item.costPerUnit;

                return (
                  <tr key={item.id} className="hover:bg-[#FAF9F5] transition-colors">
                    {/* Item Name */}
                    <td className="p-3.5 font-bold text-[#1A1A1A] whitespace-nowrap">
                      <div>
                        <span>{item.name}</span>
                        <div className="text-[10px] font-normal text-[#8C8984] mt-0.5 flex items-center gap-2">
                          <span className="font-mono">{item.id}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3 text-[#A3A09A]" />
                            {item.supplier || 'Standard Supplier'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="p-3.5 text-[#555]">
                      <span className="px-2 py-0.5 bg-[#f0f4f8] rounded text-[10px] font-semibold text-[#334155]">
                        {item.category}
                      </span>
                    </td>

                    {/* Quick Adjust Stepper */}
                    <td className="p-3.5 text-center">
                      <div className="inline-flex items-center border border-[#ced4da] rounded-lg bg-white overflow-hidden shadow-2xs">
                        <button
                          type="button"
                          onClick={() => handleQuickStep(item.id, -1)}
                          title="Decrease by 1"
                          className="px-2.5 py-1 text-xs font-bold text-[#1A1A1A] hover:bg-red-50 hover:text-red-700 transition-colors"
                        >
                          -
                        </button>
                        <span className="px-2 text-[11px] font-mono font-bold text-[#1A1A1A] bg-[#f8f9fa] border-x border-[#ced4da] min-w-[32px] text-center">
                          {item.quantityInStock}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleQuickStep(item.id, 1)}
                          title="Increase by 1"
                          className="px-2.5 py-1 text-xs font-bold text-[#1A1A1A] hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                        >
                          +
                        </button>
                      </div>
                    </td>

                    {/* In Stock */}
                    <td className="p-3.5 text-right font-mono font-bold text-[#1A1A1A] whitespace-nowrap">
                      <span>{item.quantityInStock}</span>
                      <span className="text-[10px] text-[#8C8984] font-normal ml-1">
                        {item.unit}
                      </span>
                      <span className="block text-[9px] text-[#A3A09A] font-normal">
                        Min: {item.minimumThreshold} {item.unit}
                      </span>
                    </td>

                    {/* Cost Per Unit */}
                    <td className="p-3.5 text-right font-mono font-medium text-[#555]">
                      {formatNaira(item.costPerUnit)}
                    </td>

                    {/* Total Value */}
                    <td className="p-3.5 text-right font-mono font-bold text-[#1A1A1A]">
                      {formatNaira(totalRowValue)}
                    </td>

                    {/* Status */}
                    <td className="p-3.5 text-center whitespace-nowrap">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700 uppercase tracking-wider">
                          <AlertTriangle className="w-3 h-3 text-red-600" />
                          Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Healthy
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-[#0b1221] hover:bg-[#E5E2DA] rounded transition-colors"
                          title="Edit Item"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteItem(item.id, item.name)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-[#73706B]">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <Package className="w-8 h-8 text-[#A3A09A]" />
                      <p className="font-semibold text-sm text-[#1A1A1A]">No inventory items match your criteria.</p>
                      <p className="text-xs text-[#8C8984]">Try clearing your search or category filter.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Receive Stock / Delivery Inbound */}
      {isRestockModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleReceiveStock} className="bg-white max-w-md w-full p-6 border border-[#1A1A1A] rounded-xl shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A] flex items-center gap-2">
                  <ArrowDownToLine className="w-5 h-5 text-[#024628]" />
                  <span>Receive Stock Delivery</span>
                </h3>
                <p className="text-xs text-[#73706B]">Record incoming supplies and restock inventory.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                className="text-xs font-bold text-[#8C8984] hover:text-[#1A1A1A]"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Select Item *</label>
                <select
                  required
                  value={restockItemId}
                  onChange={(e) => setRestockItemId(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded font-semibold text-xs"
                >
                  {items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Current: {i.quantityInStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Quantity Received *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={restockQty}
                    onChange={(e) => setRestockQty(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded font-mono font-bold text-sm"
                  />
                </div>
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Delivery Date</label>
                  <input
                    type="date"
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Delivery Note / Invoice Ref (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. PO-84920 or Supplier receipt"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[#E5E2DA]">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#024628] hover:bg-[#03331d] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                Confirm Delivery
              </button>
              <button
                type="button"
                onClick={() => setIsRestockModalOpen(false)}
                className="px-4 py-2.5 bg-[#F5F2ED] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider rounded"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Add / Edit Inventory Item */}
      {isNewItemModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSaveItem} className="bg-white max-w-lg w-full p-6 border border-[#1A1A1A] rounded-xl shadow-2xl space-y-4">
            <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  {editingItem ? 'Edit Inventory Item' : 'Add New Inventory Item'}
                </h3>
                <p className="text-xs text-[#73706B]">
                  {editingItem ? 'Update tracking metrics and costs' : 'Create new ingredient or supply to track'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsNewItemModalOpen(false);
                  setEditingItem(null);
                }}
                className="text-xs font-bold text-[#8C8984] hover:text-[#1A1A1A]"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Basmati Rice, Boneless Chicken, Takeaway Box..."
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded font-semibold text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Category</label>
                  <select
                    value={newItemCategory}
                    onChange={(e) => setNewItemCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded text-xs"
                  >
                    <option value="Raw Ingredients">Raw Ingredients</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Spices & Seasoning">Spices & Seasoning</option>
                    <option value="Dairy & Poultry">Dairy & Poultry</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Unit of Measure</label>
                  <select
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded text-xs font-mono"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="bags">bags</option>
                    <option value="liters">liters</option>
                    <option value="crates">crates</option>
                    <option value="packs">packs</option>
                    <option value="cartons">cartons</option>
                    <option value="pieces">pieces</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Quantity in Stock *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newItemStock}
                    onChange={(e) => setNewItemStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Min. Alert Level *</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={newItemThreshold}
                    onChange={(e) => setNewItemThreshold(parseInt(e.target.value) || 1)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded font-mono font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Cost / Unit (₦) *</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={newItemCost}
                    onChange={(e) => setNewItemCost(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded font-mono font-bold text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Supplier / Vendor Name</label>
                <input
                  type="text"
                  placeholder="e.g. Olam Agro, Local Abattoir, Golden Plastics..."
                  value={newItemSupplier}
                  onChange={(e) => setNewItemSupplier(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF9F5] border border-[#E5E2DA] rounded text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[#E5E2DA]">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#0b1221] hover:bg-[#1a2333] text-white text-xs font-bold uppercase tracking-wider rounded transition-colors cursor-pointer"
              >
                {editingItem ? 'Save Item Changes' : 'Save to Inventory'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsNewItemModalOpen(false);
                  setEditingItem(null);
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
