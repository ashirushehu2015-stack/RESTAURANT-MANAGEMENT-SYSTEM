import React, { useState, useMemo } from 'react';
import type { 
  RestaurantMenuItem, 
  RestaurantOrder, 
  OrderItem, 
  PaymentMethod 
} from '../types';
import { formatNaira } from '../utils/formatters';
import { 
  UtensilsCrossed, 
  ShoppingBag, 
  Search, 
  Flame, 
  Sparkles, 
  Clock, 
  Plus, 
  Minus, 
  Trash2, 
  Check, 
  X, 
  ArrowLeft, 
  CreditCard, 
  Banknote, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  ShieldCheck, 
  ChefHat, 
  Receipt,
  Phone,
  User,
  ExternalLink,
  Bell,
  Printer,
  Copy
} from 'lucide-react';

interface CustomerMenuPortalProps {
  menuItems: RestaurantMenuItem[];
  onPlaceOrder: (order: RestaurantOrder) => void;
  onUpdateOrderPayment?: (orderId: string, paymentMethod: PaymentMethod, transactionRef: string) => void;
  initialTable?: string;
  onExitGuestMode?: () => void;
}

export const CustomerMenuPortal: React.FC<CustomerMenuPortalProps> = ({
  menuItems = [],
  onPlaceOrder,
  onUpdateOrderPayment,
  initialTable = 'Table 08 (Garden)',
  onExitGuestMode
}) => {
  const [selectedTable, setSelectedTable] = useState(initialTable);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [dietaryFilter, setDietaryFilter] = useState<'All' | 'Halal' | 'Spicy' | 'Chef Special'>('All');

  // Cart State
  const [cart, setCart] = useState<{ menuItem: RestaurantMenuItem; quantity: number; notes: string }[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Guest Details & Checkout
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [paymentChoice, setPaymentChoice] = useState<'online' | 'at_table'>('online');
  const [onlineChannel, setOnlineChannel] = useState<'transfer' | 'card'>('transfer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Order Confirmed Tracker State
  const [confirmedOrder, setConfirmedOrder] = useState<RestaurantOrder | null>(null);

  // Digital Receipt & In-Portal Payment Modals
  const [showCustomerReceipt, setShowCustomerReceipt] = useState(false);
  const [isPayOnlineModalOpen, setIsPayOnlineModalOpen] = useState(false);
  const [postOrderChannel, setPostOrderChannel] = useState<'transfer' | 'card'>('transfer');
  const [isPayingPostOrder, setIsPayingPostOrder] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedAcct, setCopiedAcct] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const handleCallWaiter = () => {
    triggerToast(`🔔 Waiter service requested for ${selectedTable}. A staff member will attend to you shortly!`);
  };

  const handleCopyBankAcct = (acctNum: string) => {
    navigator.clipboard.writeText(acctNum);
    setCopiedAcct(true);
    triggerToast('Copied bank account number to clipboard!');
    setTimeout(() => setCopiedAcct(false), 2500);
  };

  const handleSettlePostOrderPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedOrder) return;
    setIsPayingPostOrder(true);
    const method: PaymentMethod = postOrderChannel === 'transfer' ? 'Bank Transfer' : 'POS Machine';
    const ref = `QR-PAY-${Date.now().toString().slice(-6)}`;

    setTimeout(() => {
      const updated: RestaurantOrder = {
        ...confirmedOrder,
        paymentStatus: 'Paid',
        paymentMethod: method,
        transactionRef: ref
      };
      setConfirmedOrder(updated);
      if (onUpdateOrderPayment) {
        onUpdateOrderPayment(confirmedOrder.id, method, ref);
      }
      setIsPayingPostOrder(false);
      setIsPayOnlineModalOpen(false);
      triggerToast('✅ Payment verified! Your table order is settled in full.');
    }, 800);
  };

  // Dynamic Categories
  const categories = useMemo(() => {
    const list = Array.from(new Set(menuItems.map(i => i.category).filter(Boolean)));
    return ['All', ...list];
  }, [menuItems]);

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      // Must be available
      if (item.available === false) return false;

      // Category
      if (selectedCategory !== 'All' && item.category !== selectedCategory) return false;

      // Dietary filter
      if (dietaryFilter === 'Spicy' && !item.isSpicy) return false;
      if (dietaryFilter === 'Chef Special' && !item.isChefSpecial) return false;

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = 
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q);
        if (!matches) return false;
      }

      return true;
    });
  }, [menuItems, selectedCategory, dietaryFilter, searchQuery]);

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
  const cartVat = Math.round(cartSubtotal * 0.05); // 5% VAT
  const cartGrandTotal = cartSubtotal + cartVat;
  const totalCartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // Cart actions
  const handleAddToCart = (item: RestaurantMenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItem.id === item.id);
      if (existing) {
        return prev.map(i => i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }];
    });
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(i => {
        if (i.menuItem.id === itemId) {
          const newQ = i.quantity + delta;
          return newQ > 0 ? { ...i, quantity: newQ } : null;
        }
        return i;
      }).filter(Boolean) as { menuItem: RestaurantMenuItem; quantity: number; notes: string }[];
    });
  };

  const handleUpdateItemNotes = (itemId: string, notes: string) => {
    setCart(prev => prev.map(i => i.menuItem.id === itemId ? { ...i, notes } : i));
  };

  // Submit Order
  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setIsSubmitting(true);

    const orderId = `ORD-2026-${String(Math.floor(1000 + Math.random() * 9000))}`;
    const now = new Date();
    const dateStr = '2026-10-18';
    const hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    const timeStr = `${hour12}:${minutes} ${ampm}`;
    const createdAtStr = `${dateStr} ${timeStr}`;

    const paymentMethod: PaymentMethod = paymentChoice === 'online'
      ? (onlineChannel === 'transfer' ? 'Bank Transfer' : 'POS Machine')
      : 'Cash';

    const newOrder: RestaurantOrder = {
      id: orderId,
      tableOrRoom: selectedTable,
      orderType: 'Dine-In',
      items: cart.map(i => ({
        menuItem: i.menuItem,
        quantity: i.quantity,
        notes: i.notes
      })),
      subtotal: cartSubtotal,
      tax: cartVat,
      serviceCharge: 0,
      grandTotal: cartGrandTotal,
      paymentMethod: paymentMethod,
      paymentStatus: paymentChoice === 'online' ? 'Paid' : 'Pending',
      kitchenStatus: 'Pending',
      status: 'Pending',
      createdAt: createdAtStr,
      cashierName: 'Self-Service QR',
      customerName: guestName.trim() || 'Table Guest',
      transactionRef: paymentChoice === 'online' ? `QR-TRX-${Date.now().toString().slice(-6)}` : undefined
    };

    setTimeout(() => {
      onPlaceOrder(newOrder);
      setConfirmedOrder(newOrder);
      setCart([]);
      setIsCartOpen(false);
      setIsSubmitting(false);
    }, 800);
  };

  // =========================================================================
  // VIEW 1: LIVE ORDER STATUS TRACKER (IF ORDER JUST PLACED)
  // =========================================================================
  if (confirmedOrder) {
    const isPaid = confirmedOrder.paymentStatus === 'Paid';

    return (
      <div className="min-h-screen bg-[#FDFCF9] flex flex-col items-center justify-center p-4 relative">
        {/* Toast Notification */}
        {toastMsg && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0b1221] text-[#C8B282] border border-[#C8B282] px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
            <span>{toastMsg}</span>
          </div>
        )}

        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-[#E5E2DA] p-6 space-y-5 text-center animate-fadeIn">
          {/* Success Check */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border-2 ${
            isPaid 
              ? 'bg-[#ecfdf5] text-[#024628] border-[#166c43]' 
              : 'bg-[#fffbeb] text-[#b45309] border-[#d97706]'
          }`}>
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
              isPaid
                ? 'bg-[#ecfdf5] text-[#024628] border border-emerald-300'
                : 'bg-[#fef3c7] text-[#b45309] border border-amber-300'
            }`}>
              {isPaid ? '✓ ORDER RECEIVED & PAID IN FULL' : '⏳ ORDER CONFIRMED • PENDING PAYMENT'}
            </span>
            <h2 className="text-xl font-bold text-[#1A1A1A] mt-2">
              Order {confirmedOrder.id}
            </h2>
            <p className="text-xs text-[#73706B] mt-0.5">
              Assigned Table: <strong className="text-[#1A1A1A]">{confirmedOrder.tableOrRoom}</strong>
            </p>
          </div>

          {/* Animated Cooking Tracker Steps */}
          <div className="bg-[#FDFCF9] p-4 rounded-xl border border-[#E5E2DA] space-y-3 text-left">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#024628] text-white flex items-center justify-center text-xs font-bold">
                ✓
              </div>
              <div>
                <strong className="text-xs text-[#1A1A1A] block">1. Order Received</strong>
                <span className="text-[10px] text-[#73706B]">Sent straight to kitchen controller</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-[#b45309] text-white flex items-center justify-center text-xs font-bold animate-pulse">
                👨‍🍳
              </div>
              <div>
                <strong className="text-xs text-[#b45309] block">2. Chef Preparing Meal</strong>
                <span className="text-[10px] text-[#73706B]">Estimated prep: ~15-20 mins</span>
              </div>
            </div>

            <div className="flex items-center gap-3 opacity-50">
              <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center text-xs font-bold">
                🍽️
              </div>
              <div>
                <strong className="text-xs text-gray-700 block">3. Served to Table</strong>
                <span className="text-[10px] text-[#73706B]">Waiter will deliver hot to {confirmedOrder.tableOrRoom}</span>
              </div>
            </div>
          </div>

          {/* Itemized Recap */}
          <div className="border-t border-b border-[#E5E2DA] py-3 text-left text-xs space-y-1">
            <span className="text-[10px] uppercase font-bold text-[#73706B] block mb-1">Items Ordered:</span>
            {confirmedOrder.items.map((i, idx) => (
              <div key={idx} className="flex justify-between text-[#1A1A1A]">
                <span>{i.quantity}x {i.menuItem.name}</span>
                <span className="font-mono">{formatNaira(i.menuItem.price * i.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-sm text-[#024628] pt-2 border-t border-[#E5E2DA]">
              <span>Grand Total (incl. 5% VAT):</span>
              <span className="font-mono">{formatNaira(confirmedOrder.grandTotal)}</span>
            </div>
          </div>

          {/* Payment Status Box */}
          {isPaid ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-left text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Bill Settled in Full ({confirmedOrder.paymentMethod})</span>
              </div>
              <p className="text-[11px] text-emerald-800">
                Ref: <span className="font-mono font-bold">{confirmedOrder.transactionRef || 'VERIFIED'}</span> • Electronic receipt is ready.
              </p>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-left text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <Clock className="w-4 h-4 text-amber-700" />
                  <span>Due: {formatNaira(confirmedOrder.grandTotal)}</span>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-amber-200 text-amber-900 rounded">
                  Pay at Table
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                You can pay cash or POS card machine at your table, or settle online now from your phone:
              </p>
              <button
                type="button"
                onClick={() => setIsPayOnlineModalOpen(true)}
                className="w-full py-2.5 bg-[#024628] hover:bg-[#035933] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
              >
                <CreditCard className="w-4 h-4 text-[#C8B282]" />
                <span>Pay Online Now ({formatNaira(confirmedOrder.grandTotal)})</span>
              </button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => setShowCustomerReceipt(true)}
              className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-[#1A1A1A] text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-gray-200"
            >
              <Receipt className="w-4 h-4 text-[#C8B282]" />
              <span>View Electronic Bill / Receipt</span>
            </button>

            <button
              type="button"
              onClick={() => setConfirmedOrder(null)}
              className="w-full py-2.5 bg-[#1A1A1A] hover:bg-[#333] text-white text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
            >
              Order Additional Items or Drinks
            </button>

            <button
              type="button"
              onClick={handleCallWaiter}
              className="w-full py-2 bg-transparent text-xs text-[#b45309] hover:underline font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Call Waiter to {confirmedOrder.tableOrRoom}</span>
            </button>
          </div>
        </div>

        {/* MODAL 1: CUSTOMER DIGITAL RECEIPT */}
        {showCustomerReceipt && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white max-w-sm w-full p-6 border border-[#1A1A1A] rounded-2xl shadow-2xl space-y-4 text-xs font-mono">
              <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#1A1A1A]">
                    RESTAURANT MANAGEMENT
                  </h3>
                  <p className="text-[10px] text-[#73706B]">Official Customer Digital Receipt</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCustomerReceipt(false)}
                  className="text-xs font-bold text-gray-500 hover:text-black p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-1.5 text-left text-[11px]">
                <div className="flex justify-between">
                  <span className="text-gray-500">Order ID:</span>
                  <span className="font-bold">{confirmedOrder.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Table:</span>
                  <span className="font-bold">{confirmedOrder.tableOrRoom}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Guest:</span>
                  <span>{confirmedOrder.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Date/Time:</span>
                  <span>{confirmedOrder.createdAt}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Payment:</span>
                  <span className={`font-bold ${isPaid ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {confirmedOrder.paymentStatus.toUpperCase()} ({confirmedOrder.paymentMethod})
                  </span>
                </div>
                {confirmedOrder.transactionRef && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Ref:</span>
                    <span className="font-bold">{confirmedOrder.transactionRef}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-b border-[#E5E2DA] py-2 space-y-1 text-left text-[11px]">
                {confirmedOrder.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{i.quantity}x {i.menuItem.name}</span>
                    <span>{formatNaira(i.menuItem.price * i.quantity)}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-left text-[11px]">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal:</span>
                  <span>{formatNaira(confirmedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>VAT (5%):</span>
                  <span>{formatNaira(confirmedOrder.tax)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm pt-1 border-t border-black">
                  <span>Total Amount:</span>
                  <span>{formatNaira(confirmedOrder.grandTotal)}</span>
                </div>
              </div>

              <div className="text-center text-[10px] text-gray-500 pt-1">
                *** THANK YOU FOR DINING WITH US ***
              </div>

              <div className="flex gap-2 pt-2 border-t border-[#E5E2DA]">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="flex-1 py-2 bg-[#0b1221] text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-[#C8B282]" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowCustomerReceipt(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-lg cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL 2: IN-PORTAL POST-ORDER ONLINE PAYMENT */}
        {isPayOnlineModalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <form onSubmit={handleSettlePostOrderPayment} className="bg-white max-w-sm w-full p-6 rounded-2xl shadow-2xl border border-[#1A1A1A] space-y-4 text-xs">
              <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
                <div>
                  <h3 className="font-bold text-sm text-[#1A1A1A]">
                    Settle Table Bill Online
                  </h3>
                  <p className="text-[11px] text-[#73706B] mt-0.5">
                    Order {confirmedOrder.id} • {confirmedOrder.tableOrRoom}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPayOnlineModalOpen(false)}
                  className="text-xs font-bold text-gray-500 hover:text-black p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="p-3 bg-[#FDFCF9] border border-[#E5E2DA] rounded-xl flex justify-between items-center">
                <span className="text-xs text-gray-600 font-medium">Total Bill to Settle:</span>
                <span className="text-base font-bold text-[#024628] font-mono">
                  {formatNaira(confirmedOrder.grandTotal)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPostOrderChannel('transfer')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                    postOrderChannel === 'transfer'
                      ? 'border-[#024628] bg-emerald-50 text-[#024628]'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  Instant Transfer
                </button>
                <button
                  type="button"
                  onClick={() => setPostOrderChannel('card')}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs cursor-pointer transition-all ${
                    postOrderChannel === 'card'
                      ? 'border-[#024628] bg-emerald-50 text-[#024628]'
                      : 'border-gray-200 bg-white text-gray-600'
                  }`}
                >
                  Debit Card
                </button>
              </div>

              {postOrderChannel === 'transfer' ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-left">
                  <span className="text-[10px] font-bold uppercase text-blue-900 block">
                    Designated Restaurant Account
                  </span>
                  <div className="text-xs font-semibold text-blue-900">
                    <div>Bank: <strong>Guaranty Trust Bank (GTBank)</strong></div>
                    <div className="flex items-center justify-between mt-1">
                      <span>Acct: <strong className="font-mono text-sm tracking-wider">0123456789</strong></span>
                      <button
                        type="button"
                        onClick={() => handleCopyBankAcct('0123456789')}
                        className="px-2 py-0.5 bg-blue-600 text-white text-[10px] rounded hover:bg-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedAcct ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                    <div className="text-[10px] text-blue-800 mt-1">Name: <strong>Hamstore Dining Ltd</strong></div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2 text-left">
                  <input
                    type="text"
                    required
                    placeholder="Card Number (0000 0000 0000 0000)"
                    defaultValue="5399 8320 1289 4432"
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      defaultValue="08/28"
                      className="px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono"
                    />
                    <input
                      type="password"
                      required
                      placeholder="CVV"
                      defaultValue="123"
                      className="px-3 py-2 text-xs border border-gray-300 rounded-lg font-mono"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isPayingPostOrder}
                className="w-full py-2.5 bg-[#024628] hover:bg-[#035933] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow flex items-center justify-center gap-2 cursor-pointer"
              >
                {isPayingPostOrder ? (
                  <span>Verifying Payment...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#C8B282]" />
                    <span>Confirm & Settle {formatNaira(confirmedOrder.grandTotal)}</span>
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: MAIN CUSTOMER DIGITAL MENU
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#1A1A1A] pb-24">
      {/* Top Mobile Header */}
      <header className="sticky top-0 z-30 bg-[#0b1221] text-white px-4 py-3 shadow-md border-b border-[#1e293b]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#C8B282] text-[#0b1221] flex items-center justify-center font-black">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-sm font-serif italic text-white font-bold leading-tight">
                Restaurant Management System
              </h1>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="px-2 py-0.2 bg-[#b45309] text-white text-[9px] font-bold rounded">
                  {selectedTable}
                </span>
                <span className="text-[10px] text-[#94a3b8]">Digital Table Menu</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1e293b] text-[10px] text-emerald-400 font-bold rounded-full border border-emerald-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Self-Service</span>
            </span>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#0b1221] text-[#C8B282] border border-[#C8B282] px-4 py-2.5 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-fadeIn">
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Container */}
      <main className="max-w-2xl mx-auto px-4 pt-4 space-y-4">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2A2A2A] text-white p-4 rounded-xl shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#C8B282]">
              Table Self-Ordering & Instant Payment
            </span>
            <h2 className="text-base font-bold text-white mt-0.5">
              Welcome to {selectedTable}
            </h2>
            <p className="text-[11px] text-[#cbd5e1] mt-0.5 font-light">
              Browse dishes, customize your meal, and send orders straight to the kitchen.
            </p>
          </div>
          <div className="hidden sm:block p-3 rounded-full bg-white/10 text-[#C8B282]">
            <ChefHat className="w-7 h-7" />
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#A3A09A] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search our delicious dishes, soups, grills, drinks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-2.5 text-xs bg-white border border-[#E5E2DA] rounded-xl focus:outline-none focus:border-[#C8B282] shadow-xs"
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

        {/* Category Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {categories.map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-[#0b1221] text-white shadow-xs'
                  : 'bg-white text-[#73706B] hover:bg-[#F5F4EF] border border-[#E5E2DA]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Dietary Quick Filter Chips */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-[10px] uppercase font-bold text-[#73706B]">Filter:</span>
          {[
            { id: 'All', label: 'All Dishes' },
            { id: 'Chef Special', label: '⭐ Chef Specials' },
            { id: 'Spicy', label: '🌶️ Spicy Options' }
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setDietaryFilter(f.id as any)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all ${
                dietaryFilter === f.id
                  ? 'bg-[#C8B282] text-[#0b1221]'
                  : 'bg-[#F5F4EF] text-[#555]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Dish Items Grid */}
        <div className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="bg-white p-8 rounded-xl border border-dashed border-[#E5E2DA] text-center">
              <UtensilsCrossed className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-[#73706B]">No menu items found matching "{searchQuery}"</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                  setDietaryFilter('All');
                }}
                className="mt-3 px-3 py-1 bg-[#1A1A1A] text-white text-xs font-bold rounded"
              >
                Show All Dishes
              </button>
            </div>
          ) : (
            filteredItems.map(item => {
              const inCart = cart.find(c => c.menuItem.id === item.id);
              const qty = inCart ? inCart.quantity : 0;

              return (
                <div
                  key={item.id}
                  className="bg-white p-3.5 rounded-xl border border-[#E5E2DA] shadow-xs hover:border-[#C8B282] transition-all flex gap-3.5 items-start"
                >
                  {/* Dish Image / Placeholder */}
                  <div className="w-20 h-20 rounded-lg bg-[#F5F4EF] overflow-hidden shrink-0 flex items-center justify-center border border-[#E5E2DA]">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback to placeholder icon
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <UtensilsCrossed className="w-8 h-8 text-[#C8B282]" />
                    )}
                  </div>

                  {/* Dish Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h3 className="font-bold text-xs sm:text-sm text-[#1A1A1A] leading-tight truncate">
                        {item.name}
                      </h3>
                      {item.isSpicy && (
                        <span className="text-red-500 shrink-0" title="Spicy">
                          <Flame className="w-3.5 h-3.5 fill-current" />
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-[#73706B] line-clamp-2 mt-1 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center justify-between gap-2 mt-2 pt-1 border-t border-[#F5F4EF]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-black text-xs sm:text-sm text-[#024628]">
                          {formatNaira(item.price)}
                        </span>
                        <span className="text-[10px] text-[#A3A09A] flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          <span>{item.prepTimeMinutes}m</span>
                        </span>
                      </div>

                      {/* Add Button or Stepper */}
                      {qty === 0 ? (
                        <button
                          type="button"
                          onClick={() => handleAddToCart(item)}
                          className="px-3 py-1.5 bg-[#0b1221] hover:bg-[#1A1A1A] text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      ) : (
                        <div className="flex items-center gap-1 bg-[#F5F4EF] p-1 rounded-lg border border-[#E5E2DA]">
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, -1)}
                            className="w-6 h-6 rounded bg-white text-[#1A1A1A] flex items-center justify-center hover:bg-gray-200 text-xs font-bold"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-mono font-bold text-xs px-2">{qty}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateQty(item.id, 1)}
                            className="w-6 h-6 rounded bg-[#0b1221] text-white flex items-center justify-center hover:bg-[#222] text-xs font-bold"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Discrete Footer Info */}
        <div className="pt-8 pb-12 text-center text-[11px] text-gray-400 space-y-1">
          <p className="font-semibold text-gray-500">RESTAURANT MANAGEMENT SYSTEM • TABLE SELF-ORDERING</p>
          <p className="text-[10px] text-gray-400">All prices inclusive of 5% consumption VAT</p>
          {onExitGuestMode && (
            <div className="pt-4">
              <button
                type="button"
                onClick={onExitGuestMode}
                className="text-[9px] text-gray-300 hover:text-gray-500 underline cursor-pointer"
              >
                Staff Terminal Exit
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md p-3 border-t border-[#E5E2DA] shadow-xl">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-[#0b1221] text-[#C8B282] flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#b45309] text-white text-[10px] font-black flex items-center justify-center">
                  {totalCartCount}
                </span>
              </div>
              <div>
                <div className="text-[10px] text-[#73706B] uppercase font-bold">Your Order Total:</div>
                <div className="font-mono font-black text-sm text-[#024628]">
                  {formatNaira(cartGrandTotal)}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="px-5 py-2.5 bg-[#024628] hover:bg-[#035933] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <span>View Cart & Checkout</span>
              <span>→</span>
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CHECKOUT MODAL / DRAWER */}
      {/* ========================================================================= */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E5E2DA] flex flex-col">
            {/* Modal Header */}
            <div className="p-4 bg-[#0b1221] text-white flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#C8B282]" />
                <h3 className="font-bold text-sm text-white">Your Table Order ({selectedTable})</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="text-white/60 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleCheckout} className="p-5 space-y-4">
              {/* Itemized List */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.menuItem.id} className="p-2.5 bg-[#FDFCF9] rounded-lg border border-[#E5E2DA] space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <strong className="text-xs text-[#1A1A1A] block">{item.menuItem.name}</strong>
                        <span className="text-[11px] font-mono text-[#024628]">
                          {formatNaira(item.menuItem.price * item.quantity)}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.menuItem.id, -1)}
                          className="w-5 h-5 rounded bg-gray-200 text-[#1A1A1A] flex items-center justify-center text-xs font-bold"
                        >
                          -
                        </button>
                        <span className="font-mono text-xs font-bold px-1.5">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQty(item.menuItem.id, 1)}
                          className="w-5 h-5 rounded bg-[#0b1221] text-white flex items-center justify-center text-xs font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Custom Notes on Item */}
                    <input
                      type="text"
                      placeholder="Special instructions (e.g. extra pepper, no onions)..."
                      value={item.notes}
                      onChange={(e) => handleUpdateItemNotes(item.menuItem.id, e.target.value)}
                      className="w-full px-2 py-1 text-[11px] bg-white border border-[#E5E2DA] rounded"
                    />
                  </div>
                ))}
              </div>

              {/* Bill Summary */}
              <div className="bg-[#F5F4EF] p-3 rounded-xl border border-[#E5E2DA] space-y-1.5 text-xs">
                <div className="flex justify-between text-[#73706B]">
                  <span>Items Subtotal:</span>
                  <span className="font-mono">{formatNaira(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-[#73706B]">
                  <span>VAT (5% Government Tax):</span>
                  <span className="font-mono">{formatNaira(cartVat)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-[#024628] pt-1.5 border-t border-[#E5E2DA]">
                  <span>Total Due:</span>
                  <span className="font-mono">{formatNaira(cartGrandTotal)}</span>
                </div>
              </div>

              {/* Guest Information */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase text-[#73706B] block">
                  Guest Information (Optional):
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Your Name (e.g. Barrister Emeka)"
                    value={guestName}
                    onChange={(e) => setGuestName(e.target.value)}
                    className="px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg"
                  />
                  <input
                    type="tel"
                    placeholder="WhatsApp Phone Number"
                    value={guestPhone}
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="px-3 py-2 text-xs bg-[#FDFCF9] border border-[#E5E2DA] rounded-lg"
                  />
                </div>
              </div>

              {/* Payment Mode Selection */}
              <div className="space-y-2 pt-2 border-t border-[#E5E2DA]">
                <span className="text-[10px] font-bold uppercase text-[#73706B] block">
                  Select Payment Method:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentChoice('online')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      paymentChoice === 'online'
                        ? 'border-[#024628] bg-emerald-50 text-[#024628]'
                        : 'border-[#E5E2DA] bg-white text-[#555]'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      <span>Pay Online Now</span>
                    </div>
                    <div className="text-[10px] mt-0.5 opacity-80">Instant Bank Transfer / Card</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentChoice('at_table')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                      paymentChoice === 'at_table'
                        ? 'border-[#0b1221] bg-[#0b1221] text-white'
                        : 'border-[#E5E2DA] bg-white text-[#555]'
                    }`}
                  >
                    <div className="font-bold text-xs flex items-center gap-1.5">
                      <Banknote className="w-4 h-4" />
                      <span>Pay at Table</span>
                    </div>
                    <div className="text-[10px] mt-0.5 opacity-80">Cash or POS terminal</div>
                  </button>
                </div>

                {/* Online Virtual Account Demo Info */}
                {paymentChoice === 'online' && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs space-y-1">
                    <div className="font-bold text-blue-900 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Instant Dynamic Transfer / Card Checkout</span>
                    </div>
                    <p className="text-[11px] text-blue-800">
                      Tapping "Pay & Send to Kitchen" will simulate instant payment verification and print kitchen order ticket immediately.
                    </p>
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-[#024628] hover:bg-[#035933] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Processing Order...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {paymentChoice === 'online' ? `Pay ${formatNaira(cartGrandTotal)} & Order` : 'Send Order to Kitchen'}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
