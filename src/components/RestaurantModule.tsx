import React, { useState } from 'react';
import type { RestaurantMenuItem, RestaurantOrder, OrderItem, RestaurantCategory, PaymentMethod, AuditLog, UserRole, Invoice, PaymentRecord } from '../types';
import { PaymentFormModal } from './PaymentFormModal';
import { formatNaira, formatDateFormatted } from '../utils/formatters';
import { 
  Utensils, 
  UtensilsCrossed, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  Printer, 
  Clock, 
  CheckCircle2, 
  Flame, 
  ChefHat, 
  Sparkles, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  CreditCard, 
  DollarSign, 
  Building2, 
  Check, 
  AlertCircle,
  FileText,
  Upload,
  Edit2
} from 'lucide-react';

interface RestaurantModuleProps {
  menuItems: RestaurantMenuItem[];
  onAddMenuItem: (item: RestaurantMenuItem) => void;
  onUpdateMenuItem: (item: RestaurantMenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
  orders: RestaurantOrder[];
  onPlaceOrder: (order: RestaurantOrder, log: AuditLog) => void;
  onUpdateOrderStatus: (orderId: string, status: 'Pending' | 'Preparing' | 'Ready' | 'Served', log: AuditLog) => void;
  cashierName: string;
  userRole: UserRole;
  initialTab?: 'dashboard' | 'pos' | 'kds' | 'menu_manager' | 'analytics';
}

export const RestaurantModule: React.FC<RestaurantModuleProps> = ({
  menuItems,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  orders,
  onPlaceOrder,
  onUpdateOrderStatus,
  cashierName,
  userRole,
  initialTab
}) => {
  // Navigation tabs inside Restaurant
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pos' | 'kds' | 'menu_manager' | 'analytics'>(initialTab || 'dashboard');
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [pendingCheckoutOrder, setPendingCheckoutOrder] = useState<RestaurantOrder | null>(null);

  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // POS Cart State
  const [cart, setCart] = useState<{ menuItem: RestaurantMenuItem; quantity: number; notes: string }[]>([]);
  const [tableOrRoom, setTableOrRoom] = useState<string>('Table 01');
  const [orderType, setOrderType] = useState<'Dine-In' | 'Takeaway' | 'Home / Office Delivery'>('Dine-In');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('POS Machine');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [isWaitingForPayment, setIsWaitingForPayment] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState<string>('');

  // Modal States
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState<RestaurantOrder | null>(null);
  const [isNewMenuModalOpen, setIsNewMenuModalOpen] = useState<boolean>(false);
  const [isImportMenuModalOpen, setIsImportMenuModalOpen] = useState<boolean>(false);
  const [rawMenuText, setRawMenuText] = useState<string>('');

  // New Menu Item Form State
  const [newDishName, setNewDishName] = useState('');
  const [newDishCategory, setNewDishCategory] = useState<RestaurantCategory>('FOOD MENU');
  const [newDishPrice, setNewDishPrice] = useState<number>(3500);
  const [newDishDesc, setNewDishDesc] = useState('');
  const [newDishPrepTime, setNewDishPrepTime] = useState<number>(15);
  const [newDishSpicy, setNewDishSpicy] = useState<boolean>(false);
  const [newDishChefSpecial, setNewDishChefSpecial] = useState<boolean>(false);

  // Filtered Menu Items
  const filteredMenu = menuItems.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Cart Calculations
  const cartSubtotal = cart.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0);
  const cartTax = Math.round(cartSubtotal * 0.05); // 5% VAT
  const cartServiceCharge = orderType === 'Home / Office Delivery' ? 500 : 0;
  const cartGrandTotal = cartSubtotal + cartTax + cartServiceCharge;

  // Handlers
  const handleAddToCart = (item: RestaurantMenuItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.menuItem.id === item.id);
      if (existing) {
        return prev.map((i) =>
          i.menuItem.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { menuItem: item, quantity: 1, notes: '' }];
    });
  };

  const handleUpdateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.menuItem.id === id) {
            const newQty = i.quantity + delta;
            return newQty > 0 ? { ...i, quantity: newQty } : null;
          }
          return i;
        })
        .filter(Boolean) as { menuItem: RestaurantMenuItem; quantity: number; notes: string }[]
    );
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    setCart((prev) =>
      prev.map((i) => (i.menuItem.id === id ? { ...i, notes } : i))
    );
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setErrorMsg(null);

    const newOrder: RestaurantOrder = {
      id: `ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      tableOrRoom: tableOrRoom || 'Counter',
      orderType,
      items: cart.map((c) => ({
        menuItem: c.menuItem,
        quantity: c.quantity,
        notes: c.notes
      })),
      subtotal: cartSubtotal,
      tax: cartTax,
      serviceCharge: cartServiceCharge,
      grandTotal: cartGrandTotal,
      paymentMethod,
      paymentStatus: 'Pending',
      kitchenStatus: 'Pending',
      createdAt: `${formatDateFormatted(new Date().toISOString().split('T')[0])} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
      cashierName,
      customerName: customerName.trim() || 'Walk-in Guest'
    };

    setPendingCheckoutOrder(newOrder);
    setIsPaymentModalOpen(true);
  };

  const handlePaymentSuccess = (payment: PaymentRecord, updatedInvoice: Invoice, auditLog: AuditLog) => {
    if (!pendingCheckoutOrder) return;
    
    const finalOrder: RestaurantOrder = {
      ...pendingCheckoutOrder,
      paymentStatus: 'Paid',
      paymentMethod: payment.paymentMethod,
      transactionRef: payment.transactionReference
    };

    const finalLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      timestamp: finalOrder.createdAt,
      user: cashierName,
      role: userRole,
      action: 'SERVICE_ADDED',
      details: `Placed Restaurant Order ${finalOrder.id} (${finalOrder.orderType} - ${finalOrder.tableOrRoom}) Total: ${formatNaira(finalOrder.grandTotal)} via ${payment.paymentMethod}`,
      reference: finalOrder.id
    };

    onPlaceOrder(finalOrder, finalLog);
    setSelectedOrderForReceipt(finalOrder);
    setCart([]);
    setTableOrRoom('');
    setCustomerName('');
    setIsPaymentModalOpen(false);
    setPendingCheckoutOrder(null);
  };

  const handleCreateMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDishName.trim()) return;

    const item: RestaurantMenuItem = {
      id: `menu-custom-${Date.now().toString().slice(-6)}`,
      name: newDishName.trim(),
      category: newDishCategory,
      price: Number(newDishPrice) || 1000,
      description: newDishDesc.trim() || 'Delicious house delicacy prepared fresh on order.',
      available: true,
      prepTimeMinutes: Number(newDishPrepTime) || 15,
      isSpicy: newDishSpicy,
      isChefSpecial: newDishChefSpecial
    };

    onAddMenuItem(item);
    setIsNewMenuModalOpen(false);

    // Reset Form
    setNewDishName('');
    setNewDishDesc('');
    setNewDishPrice(3500);
  };

  const handleImportMenu = () => {
    if (!rawMenuText.trim()) return;

    // Parse line by line: Name, Category, Price
    const lines = rawMenuText.split('\n');
    let addedCount = 0;

    lines.forEach((line) => {
      const parts = line.split(',').map((s) => s.trim());
      if (parts.length >= 2) {
        const name = parts[0];
        const price = parseInt(parts[1].replace(/[^0-9]/g, ''), 10) || 2500;
        const category = (parts[2] as RestaurantCategory) || 'Main Course & Swallows';

        if (name) {
          const item: RestaurantMenuItem = {
            id: `menu-imp-${Date.now().toString().slice(-5)}-${Math.random().toString(36).substring(2, 5)}`,
            name,
            category,
            price,
            description: 'Custom added menu item for Restaurant.',
            available: true,
            prepTimeMinutes: 15
          };
          onAddMenuItem(item);
          addedCount++;
        }
      }
    });

    alert(`Successfully imported ${addedCount} menu items!`);
    setRawMenuText('');
    setIsImportMenuModalOpen(false);
  };

  // Thermal Receipt Generator
  const printThermalReceipt = (order: RestaurantOrder) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const itemsRows = order.items.map((i) => `
      <div style="display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px;">
        <div style="flex: 1;">
          <div style="font-weight: bold;">${i.quantity}x ${i.menuItem.name}</div>
          ${i.notes ? `<div style="font-size: 9px; color: #555; font-style: italic;">* ${i.notes}</div>` : ''}
        </div>
        <div style="font-weight: bold; width: 60px; text-align: right;">${formatNaira(i.menuItem.price * i.quantity)}</div>
      </div>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>RESTAURANT MANAGEMENT SYSTEM Receipt - ${order.id}</title>
          <style>
            @page { size: 80mm auto; margin: 4mm; }
            body { font-family: monospace; width: 72mm; margin: 0 auto; color: #000; font-size: 11px; line-height: 1.3; }
            .header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 8px; margin-bottom: 8px; }
            .title { font-size: 16px; font-weight: bold; text-transform: uppercase; }
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
            <div class="sub">Opp. Mareri Juma'at Mosque Lalan Zaria Road, S/fulani Park Box 767, Gusau, Zamfara State.</div>
            <div class="sub">TEL: +234 803 000 0000 • BILL RECEIPT</div>
          </div>

          <div class="meta">
            <div><strong>ORDER NO:</strong> ${order.id}</div>
            <div><strong>LOCATION:</strong> ${order.tableOrRoom} (${order.orderType})</div>
            <div><strong>CUSTOMER:</strong> ${order.customerName}</div>
            <div><strong>DATE & TIME:</strong> ${order.createdAt}</div>
            <div><strong>SERVER / CASHIER:</strong> ${order.cashierName}</div>
            <div><strong>PAYMENT METHOD:</strong> ${order.paymentMethod} [PAID]</div>
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
            <div class="tot-row">
              <span>Service Charge:</span>
              <span>${formatNaira(order.serviceCharge)}</span>
            </div>
            <div class="tot-row grand">
              <span>GRAND TOTAL:</span>
              <span>${formatNaira(order.grandTotal)}</span>
            </div>
          </div>

          <div class="footer">
            <p>*** THANK YOU FOR DINING WITH US ***</p>
            <p>Please keep this receipt for verification.</p>
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
  };

  const totalRevenue = orders.reduce((s, o) => s + o.grandTotal, 0);
  const activeKitchenCount = orders.filter((o) => o.kitchenStatus === 'Pending' || o.kitchenStatus === 'Preparing').length;

  return (
    <div className="flex flex-row h-screen w-full bg-[#FDFCF9] overflow-hidden font-sans">
      
      {/* Left Sidebar */}
      <div className="w-64 bg-[#024628] text-white flex-shrink-0 flex flex-col h-full border-r border-[#01351e] overflow-y-auto">
        <div className="p-6 pb-8">
          <h2 className="text-2xl font-bold font-serif tracking-tight leading-tight mb-1">
            RMS Portal
          </h2>
          <p className="text-[#a5ccb8] text-[10px] uppercase tracking-wider font-semibold">
            Restaurant Management System
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${
              activeTab === 'dashboard' ? 'bg-[#03331d] text-white border border-[#166c43]' : 'text-[#a5ccb8] hover:bg-[#03331d] hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" /> Dashboard
          </button>
          <button
            onClick={() => setActiveTab('pos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${
              activeTab === 'pos' ? 'bg-[#03331d] text-white border border-[#166c43]' : 'text-[#a5ccb8] hover:bg-[#03331d] hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" /> Point of Sale (POS)
          </button>
          <button
            onClick={() => setActiveTab('kds')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${
              activeTab === 'kds' ? 'bg-[#03331d] text-white border border-[#166c43]' : 'text-[#a5ccb8] hover:bg-[#03331d] hover:text-white'
            }`}
          >
            <div className="relative">
              <ChefHat className="w-4 h-4" />
              {activeKitchenCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 absolute -right-1 -top-1" />
              )}
            </div>
            Kitchen Display
          </button>
          <button
            onClick={() => setActiveTab('menu_manager')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${
              activeTab === 'menu_manager' ? 'bg-[#03331d] text-white border border-[#166c43]' : 'text-[#a5ccb8] hover:bg-[#03331d] hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" /> Menu Manager
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded text-sm font-medium transition-colors ${
              activeTab === 'analytics' ? 'bg-[#03331d] text-white border border-[#166c43]' : 'text-[#a5ccb8] hover:bg-[#03331d] hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" /> Analytics & Reports
          </button>
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-[#03331d] p-3 rounded border border-[#166c43]">
            <p className="text-xs text-white font-semibold truncate">{cashierName}</p>
            <p className="text-[10px] text-[#a5ccb8] mt-0.5">{userRole}</p>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[#FDFCF9] p-6 space-y-6 pb-12">
      {/* Role Domain Access Badge */}
      <div className={`p-2.5 px-4 text-xs font-semibold flex items-center justify-between border ${
        userRole === 'General Manager'
          ? 'bg-[#1A1A1A]/10 border-[#1A1A1A]/30 text-[#1A1A1A]'
          : userRole === 'Kitchen Manager' || userRole === 'Head Chef'
            ? 'bg-[#8C4A27]/15 border-[#8C4A27]/40 text-[#8C4A27]'
            : userRole === 'Restaurant Manager' || userRole === 'Cashier'
              ? 'bg-[#8B2626]/15 border-[#8B2626]/40 text-[#8B2626]'
              : 'bg-[#243B6B]/15 border-[#243B6B]/40 text-[#1E2E50]'
      }`}>
        <div className="flex items-center gap-2">
          <span className="font-bold uppercase tracking-wider text-[10px] px-2 py-0.5 bg-[#1A1A1A] text-white">
            Role: {userRole}
          </span>
          <span>
            {userRole === 'General Manager'
              ? 'Global General Manager Scope: Full Administrative Access to Hotel PMS, Restaurant POS, and Kitchen KDS.'
              : userRole === 'Kitchen Manager' || userRole === 'Head Chef'
                ? 'Kitchen Business Scope: Kitchen Display System (KDS), Order Prep Queue & Chef Workflow Only.'
                : userRole === 'Restaurant Manager' || userRole === 'Cashier'
                  ? 'Restaurant Business Scope: Food & Beverage POS, Table Ordering & Menu Catalog Management Only.'
                  : 'Hotel Business Scope Notice: Hotel Manager manages Hotel Services. Restaurant & Kitchen businesses belong to F&B and Culinary managers.'}
          </span>
        </div>
      </div>

      {/* Top Header Banner */}
      <div className="bg-[#1A1A1A] text-[#FDFCF9] p-6 border border-[#333333] shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-[#8B2626] text-white font-bold text-[9px] uppercase tracking-widest">
              RESTAURANT POS
            </span>
            <span className="text-[10px] text-[#A3A09A] uppercase tracking-wider font-semibold">
              Location: Main Dining Hall & Executive Lounge
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif italic text-[#FDFCF9] mt-1 flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-[#C8B282]" />
            <span>RESTAURANT MANAGEMENT SYSTEM</span>
          </h1>
          <p className="text-xs text-[#D4D0C7] font-light mt-1">
            Standalone Dining & Lounge Business • Table ordering, POS billing, receipt generation, and menu catalog management.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsImportMenuModalOpen(true)}
            className="px-3.5 py-2 bg-[#262626] hover:bg-[#333333] text-[#C8B282] border border-[#C8B282]/40 text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import / Provide Menu</span>
          </button>

          <button
            onClick={() => setIsNewMenuModalOpen(true)}
            className="px-3.5 py-2 bg-[#C8B282] hover:bg-[#B8A272] text-[#1A1A1A] font-bold text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Add Dish / Drink</span>
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white p-4 border border-[#E5E2DA] shadow-xs">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C8984] block">Today's Restaurant Sales</span>
          <span className="font-serif font-bold text-xl text-[#1A1A1A] block mt-1">{formatNaira(totalRevenue)}</span>
          <span className="text-[10px] text-[#2D5A44] font-semibold mt-0.5 block">Recorded Digital & Cash Orders</span>
        </div>

        <div className="bg-white p-4 border border-[#E5E2DA] shadow-xs">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C8984] block">Active Kitchen Orders</span>
          <span className="font-serif font-bold text-xl text-[#8B2626] block mt-1">{activeKitchenCount} Orders</span>
          <span className="text-[10px] text-[#8B2626] font-semibold mt-0.5 block flex items-center gap-1">
            <Clock className="w-3 h-3 animate-spin" />
            <span>Pending or Cooking</span>
          </span>
        </div>

        <div className="bg-white p-4 border border-[#E5E2DA] shadow-xs">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C8984] block">Total Items in Catalog</span>
          <span className="font-serif font-bold text-xl text-[#1A1A1A] block mt-1">{menuItems.length} Items</span>
          <span className="text-[10px] text-[#73706B] mt-0.5 block">Ready for Custom Menu Update</span>
        </div>

        <div className="bg-white p-4 border border-[#E5E2DA] shadow-xs">
          <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C8984] block">Duty Cashier / Waiter</span>
          <span className="font-serif font-bold text-sm text-[#1A1A1A] truncate block mt-1">{cashierName}</span>
          <span className="text-[10px] text-[#A3A09A] font-semibold mt-0.5 block">{userRole}</span>
        </div>
      </div>



      {/* TAB 1: POS TERMINAL */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Menu Items Grid (8 Cols) */}
          <div className="lg:col-span-7 xl:col-span-8 space-y-4">
            {/* Search and Category Filter Bar */}
            <div className="bg-white p-4 border border-[#E5E2DA] space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-[#8C8984] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search dishes, drinks, delicacies, suya..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-[#FDFCF9] border border-[#E5E2DA] text-xs focus:outline-none focus:border-[#1A1A1A]"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {['All', 'FOOD MENU', 'SNACKS', 'PROTEIN', 'DRINKS'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all border ${
                      selectedCategory === cat
                        ? 'bg-[#1A1A1A] text-[#FDFCF9] border-[#1A1A1A]'
                        : 'bg-[#FDFCF9] text-[#73706B] border-[#E5E2DA] hover:border-[#1A1A1A] hover:text-[#1A1A1A]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Dishes Catalog Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredMenu.map((item) => (
                <div
                  key={item.id}
                  className="bg-white border border-[#E5E2DA] p-4 flex flex-col justify-between hover:border-[#1A1A1A] transition-all space-y-3 shadow-2xs"
                >
                  <div>
                    {/* Menu Item Image */}
                    {item.imageUrl && (
                      <div className="w-full h-32 overflow-hidden mb-3 -mx-0 rounded-sm">
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    )}
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#8C8984] block">
                        {item.category}
                      </span>
                      {item.isChefSpecial && (
                        <span className="px-1.5 py-0.5 bg-[#C8B282] text-[#1A1A1A] text-[8px] font-bold uppercase tracking-wider">
                          Chef's Pick
                        </span>
                      )}
                    </div>

                    <h3 className="font-serif font-bold text-sm text-[#1A1A1A] mt-1 leading-tight">
                      {item.name}
                    </h3>

                    <p className="text-[11px] text-[#73706B] font-light mt-1.5 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[#F0ECE1] flex items-center justify-between">
                    <div>
                      <span className="font-serif font-bold text-base text-[#1A1A1A]">
                        {formatNaira(item.price)}
                      </span>
                      <span className="text-[9px] text-[#8C8984] block">
                        ~{item.prepTimeMinutes} mins prep
                      </span>
                    </div>

                    <button
                      onClick={() => handleAddToCart(item)}
                      className="px-3 py-1.5 bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#FDFCF9] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#C8B282]" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredMenu.length === 0 && (
              <div className="bg-white p-8 text-center border border-[#E5E2DA] space-y-2">
                <Utensils className="w-8 h-8 text-[#A3A09A] mx-auto" />
                <p className="text-sm font-serif text-[#1A1A1A]">No dishes found matching search.</p>
                <button
                  onClick={() => setIsNewMenuModalOpen(true)}
                  className="px-4 py-2 bg-[#1A1A1A] text-[#FDFCF9] text-xs font-bold uppercase tracking-wider"
                >
                  Add Custom Dish
                </button>
              </div>
            )}
          </div>

          {/* POS Cart Sidebar (4 Cols) */}
          <div className="lg:col-span-5 xl:col-span-4 bg-white border border-[#E5E2DA] p-5 space-y-5 shadow-sm sticky top-20 h-fit">
            <div className="border-b border-[#E5E2DA] pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#C8B282]" />
                <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  Active Order Cart ({cart.reduce((a, b) => a + b.quantity, 0)})
                </h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => setCart([])}
                  className="text-[10px] text-[#8B2626] font-bold uppercase tracking-wider hover:underline"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Order Parameters */}
            <div className="space-y-3 bg-[#FDFCF9] p-3 border border-[#E5E2DA]">
              <div>
                <label className="text-[10px] uppercase font-bold text-[#8C8984] block mb-1">
                  Order Type & Location
                </label>
                <div className="grid grid-cols-3 gap-1 mb-2">
                  {(['Dine-In', 'Takeaway', 'Home / Office Delivery'] as const).map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setOrderType(t)}
                      className={`py-1.5 px-1 text-[9px] font-bold uppercase tracking-wider border text-center ${
                        orderType === t
                          ? 'bg-[#1A1A1A] text-[#FDFCF9] border-[#1A1A1A]'
                          : 'bg-white text-[#73706B] border-[#E5E2DA]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] uppercase font-bold text-[#A3A09A] block mb-0.5">
                      Table / Room
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Table 04 or Room 108"
                      value={tableOrRoom}
                      onChange={(e) => setTableOrRoom(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5E2DA] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
                    />
                  </div>

                  <div>
                    <label className="text-[9px] uppercase font-bold text-[#A3A09A] block mb-0.5">
                      Guest Name
                    </label>
                    <input
                      type="text"
                      placeholder="Customer name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-[#E5E2DA] text-xs font-semibold focus:outline-none focus:border-[#1A1A1A]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-[#8C8984] block mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['POS Machine', 'Cash', 'Bank Transfer'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-1 px-1 text-[9px] font-bold uppercase tracking-wider border text-center ${
                        paymentMethod === m
                          ? 'bg-[#2D5A44] text-[#FDFCF9] border-[#2D5A44]'
                          : 'bg-white text-[#73706B] border-[#E5E2DA]'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              
              {paymentMethod === 'Bank Transfer' && (
                <div className="mt-2 bg-[#FAF6F2] border border-[#EAD3C6] p-2 text-center">
                  <span className="block text-[9px] font-bold text-[#8C4A27] uppercase tracking-wider mb-1">Official Account</span>
                  <p className="font-mono font-bold text-[#1A1A1A] text-xs tracking-wider">5287638868</p>
                  <p className="text-[9px] text-[#73706B] font-semibold">Moniepoint</p>
                  <p className="text-[9px] text-[#A3A09A] mt-2 italic">The system will automatically verify the transfer.</p>
                </div>
              )}

              {paymentMethod === 'POS Machine' && (
                <div className="mt-2 bg-[#FAF6F2] border border-[#EAD3C6] p-2 text-center">
                  <span className="block text-[9px] font-bold text-[#8C4A27] uppercase tracking-wider mb-1">POS Terminal</span>
                  <p className="text-[9px] text-[#A3A09A] italic">The system will automatically initialize the terminal.</p>
                </div>
              )}
            </div>

            {errorMsg && (
              <div className="text-[10px] text-red-600 bg-red-50 p-2 border border-red-200 mt-2 font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Cart Items List */}
            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div
                  key={item.menuItem.id}
                  className="bg-[#FDFCF9] p-2.5 border border-[#E5E2DA] space-y-2 text-xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-[#1A1A1A] leading-tight">
                        {item.menuItem.name}
                      </h4>
                      <span className="text-[10px] text-[#73706B] font-mono">
                        {formatNaira(item.menuItem.price)} each
                      </span>
                    </div>
                    <span className="font-serif font-bold text-xs text-[#1A1A1A]">
                      {formatNaira(item.menuItem.price * item.quantity)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <input
                      type="text"
                      placeholder="Add note (e.g. extra pepper)"
                      value={item.notes}
                      onChange={(e) => handleUpdateNotes(item.menuItem.id, e.target.value)}
                      className="text-[10px] bg-white border border-[#E5E2DA] px-2 py-0.5 w-36 focus:outline-none"
                    />

                    <div className="flex items-center border border-[#E5E2DA] bg-white">
                      <button
                        onClick={() => handleUpdateQuantity(item.menuItem.id, -1)}
                        className="px-2 py-0.5 text-xs text-[#1A1A1A] hover:bg-[#F5F2ED]"
                      >
                        -
                      </button>
                      <span className="px-2 text-xs font-bold font-mono">{item.quantity}</span>
                      <button
                        onClick={() => handleUpdateQuantity(item.menuItem.id, 1)}
                        className="px-2 py-0.5 text-xs text-[#1A1A1A] hover:bg-[#F5F2ED]"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {cart.length === 0 && (
                <div className="py-8 text-center text-[#A3A09A] space-y-1">
                  <UtensilsCrossed className="w-8 h-8 mx-auto text-[#D4D0C7]" />
                  <p className="text-xs font-serif">Cart is empty.</p>
                  <p className="text-[10px]">Select items from the catalog on the left to build order.</p>
                </div>
              )}
            </div>

            {/* Bill Calculations */}
            {cart.length > 0 && (
              <div className="border-t border-[#E5E2DA] pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-[#73706B]">
                  <span>Subtotal:</span>
                  <span className="font-mono">{formatNaira(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-[#73706B]">
                  <span>VAT (5%):</span>
                  <span className="font-mono">{formatNaira(cartTax)}</span>
                </div>
                <div className="flex justify-between text-[#73706B]">
                  <span>Service & Delivery:</span>
                  <span className="font-mono">{formatNaira(cartServiceCharge)}</span>
                </div>
                <div className="flex justify-between text-[#1A1A1A] font-serif font-bold text-base border-t border-[#1A1A1A] pt-2 mt-1">
                  <span>Grand Total:</span>
                  <span>{formatNaira(cartGrandTotal)}</span>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={isWaitingForPayment}
                  className={`w-full mt-3 font-bold py-3 text-xs uppercase tracking-[0.18em] transition-all flex items-center justify-center gap-2 shadow-xs ${
                    isWaitingForPayment ? 'bg-[#E5E2DA] text-[#A3A09A] cursor-not-allowed' : 'bg-[#1A1A1A] hover:bg-[#2A2A2A] text-[#FDFCF9]'
                  }`}
                >
                  <Printer className="w-4 h-4 text-[#C8B282]" />
                  <span>{isWaitingForPayment ? 'Verifying...' : 'Print Receipt & Send to Kitchen'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: KITCHEN DISPLAY & ORDERS */}
      {activeTab === 'kds' && (
        <div className="space-y-4">
          <div className="bg-white p-4 border border-[#E5E2DA] flex justify-between items-center">
            <div>
              <h2 className="font-serif font-bold text-lg text-[#1A1A1A]">
                Kitchen Display System (KDS) & Active Orders
              </h2>
              <p className="text-xs text-[#73706B]">
                Track order preparation status, room service deliveries, and customer bill history.
              </p>
            </div>
            <span className="text-xs font-bold uppercase tracking-wider px-3 py-1 bg-[#1A1A1A] text-[#FDFCF9]">
              {orders.length} Total Orders
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.map((order) => {
              let statusBg = 'bg-[#FAF0F0] text-[#8B2626] border-[#E8C8C8]';
              if (order.kitchenStatus === 'Preparing') statusBg = 'bg-[#FAF6F2] text-[#8C4A27] border-[#EAD3C6]';
              if (order.kitchenStatus === 'Ready' || order.kitchenStatus === 'Served') statusBg = 'bg-[#F0F7F3] text-[#2D5A44] border-[#C4E2D2]';

              return (
                <div
                  key={order.id}
                  className="bg-white border border-[#E5E2DA] p-5 space-y-4 shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-[#E5E2DA]">
                      <div>
                        <span className="font-mono font-bold text-sm text-[#1A1A1A] block">
                          {order.id}
                        </span>
                        <span className="text-[10px] text-[#73706B] block">
                          {order.createdAt}
                        </span>
                      </div>

                      <span className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider border ${statusBg}`}>
                        {order.kitchenStatus}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#8C8984] block">Location</span>
                        <span className="font-bold text-[#1A1A1A]">{order.tableOrRoom}</span>
                        <span className="text-[10px] text-[#73706B] block">({order.orderType})</span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-[#8C8984] block">Customer</span>
                        <span className="font-semibold text-[#1A1A1A]">{order.customerName}</span>
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="bg-[#FDFCF9] p-3 border border-[#E5E2DA] space-y-1.5 text-xs">
                      {order.items.map((i, idx) => (
                        <div key={idx} className="flex justify-between text-[#1A1A1A]">
                          <span><strong>{i.quantity}x</strong> {i.menuItem.name}</span>
                          <span className="font-mono">{formatNaira(i.menuItem.price * i.quantity)}</span>
                        </div>
                      ))}
                      <div className="border-t border-[#E5E2DA] pt-1.5 flex justify-between font-serif font-bold text-sm">
                        <span>Total Paid ({order.paymentMethod}):</span>
                        <span>{formatNaira(order.grandTotal)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#E5E2DA] space-y-2">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase text-[#8C8984]">
                      <span>Update Kitchen Status:</span>
                    </div>
                    <div className="grid grid-cols-4 gap-1">
                      {(['Pending', 'Preparing', 'Ready', 'Served'] as const).map((st) => (
                        <button
                          key={st}
                          onClick={() => {
                            const log: AuditLog = {
                              id: `LOG-${Date.now().toString().slice(-5)}`,
                              timestamp: `${formatDateFormatted(new Date().toISOString().split('T')[0])} ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                              user: cashierName,
                              role: userRole,
                              action: 'SERVICE_ADDED',
                              details: `Updated Restaurant Order ${order.id} status to ${st}`,
                              reference: order.id
                            };
                            onUpdateOrderStatus(order.id, st, log);
                          }}
                          className={`py-1 text-[8px] font-bold uppercase tracking-wider border text-center ${
                            order.kitchenStatus === st
                              ? 'bg-[#1A1A1A] text-[#FDFCF9] border-[#1A1A1A]'
                              : 'bg-white text-[#73706B] border-[#E5E2DA] hover:bg-[#F5F2ED]'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => printThermalReceipt(order)}
                      className="w-full py-2 bg-[#F5F2ED] hover:bg-[#EAE6DE] text-[#1A1A1A] text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border border-[#E5E2DA]"
                    >
                      <Printer className="w-3.5 h-3.5 text-[#1A1A1A]" />
                      <span>Print Thermal Bill Receipt</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MENU CATALOG MANAGER */}
      {activeTab === 'menu_manager' && (
        <div className="bg-white border border-[#E5E2DA] p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#E5E2DA] pb-4">
            <div>
              <h2 className="font-serif font-bold text-xl text-[#1A1A1A]">
                Restaurant Menu Catalog Management
              </h2>
              <p className="text-xs text-[#73706B]">
                Manage dishes, pricing, preparation times, and custom menu imports.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsImportMenuModalOpen(true)}
                className="px-4 py-2 bg-[#262626] text-[#C8B282] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import Text/CSV Menu</span>
              </button>
              <button
                onClick={() => setIsNewMenuModalOpen(true)}
                className="px-4 py-2 bg-[#1A1A1A] text-[#FDFCF9] text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Single Item</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#1A1A1A] text-[#FDFCF9] font-mono text-[10px] uppercase tracking-wider">
                  <th className="p-3">Dish / Drink Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Price (₦)</th>
                  <th className="p-3">Prep Time</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2DA]">
                {menuItems.map((item) => (
                  <tr key={item.id} className="hover:bg-[#FDFCF9]">
                    <td className="p-3 font-bold text-[#1A1A1A]">
                      {item.name}
                      {item.isChefSpecial && (
                        <span className="ml-2 px-1.5 py-0.5 bg-[#C8B282] text-[#1A1A1A] text-[8px] uppercase font-bold">
                          Chef Special
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-[#73706B]">{item.category}</td>
                    <td className="p-3 font-serif font-bold text-[#1A1A1A]">{formatNaira(item.price)}</td>
                    <td className="p-3 text-[#73706B]">{item.prepTimeMinutes} mins</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-[#F0F7F3] text-[#2D5A44] border border-[#C4E2D2] text-[9px] font-bold uppercase">
                        Available
                      </span>
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button
                        onClick={() => onDeleteMenuItem(item.id)}
                        className="text-[#8B2626] font-bold text-[10px] uppercase hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: Thermal Receipt Preview */}
      {selectedOrderForReceipt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full p-6 border border-[#1A1A1A] shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  Restaurant Order Processed
                </h3>
                <p className="text-xs text-[#73706B]">Order #{selectedOrderForReceipt.id}</p>
              </div>
              <button
                onClick={() => setSelectedOrderForReceipt(null)}
                className="text-xs font-bold text-[#8C8984] hover:text-[#1A1A1A]"
              >
                ✕ Close
              </button>
            </div>

            <div className="bg-[#FDFCF9] p-4 border border-[#E5E2DA] space-y-2 text-xs font-mono">
              <p className="font-bold">RESTAURANT MANAGEMENT SYSTEM</p>
              <p>Table/Room: {selectedOrderForReceipt.tableOrRoom}</p>
              <p>Customer: {selectedOrderForReceipt.customerName}</p>
              <p>Payment: {selectedOrderForReceipt.paymentMethod} (PAID)</p>
              <div className="border-t border-[#E5E2DA] my-2 pt-2">
                {selectedOrderForReceipt.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{i.quantity}x {i.menuItem.name}</span>
                    <span>{formatNaira(i.menuItem.price * i.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-black pt-1 font-bold text-sm flex justify-between">
                <span>Grand Total:</span>
                <span>{formatNaira(selectedOrderForReceipt.grandTotal)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => printThermalReceipt(selectedOrderForReceipt)}
                className="flex-1 py-2.5 bg-[#1A1A1A] text-[#FDFCF9] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <Printer className="w-4 h-4 text-[#C8B282]" />
                <span>Print Thermal Receipt</span>
              </button>
              <button
                onClick={() => setSelectedOrderForReceipt(null)}
                className="px-4 py-2.5 bg-[#F5F2ED] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Add New Dish */}
      {isNewMenuModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateMenuItem} className="bg-white max-w-lg w-full p-6 border border-[#1A1A1A] shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  Add New Dish or Drink to Menu
                </h3>
                <p className="text-xs text-[#73706B]">Create item for immediate POS ordering</p>
              </div>
              <button
                type="button"
                onClick={() => setIsNewMenuModalOpen(false)}
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
                  placeholder="e.g. Special Suya Wrap or Fresh Zobo"
                  value={newDishName}
                  onChange={(e) => setNewDishName(e.target.value)}
                  className="w-full p-2 bg-[#FDFCF9] border border-[#E5E2DA] font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Category</label>
                  <select
                    value={newDishCategory}
                    onChange={(e) => setNewDishCategory(e.target.value as RestaurantCategory)}
                    className="w-full p-2 bg-[#FDFCF9] border border-[#E5E2DA]"
                  >
                    <option value="FOOD MENU">FOOD MENU</option>
                    <option value="SNACKS">SNACKS</option>
                    <option value="PROTEIN">PROTEIN</option>
                    <option value="DRINKS">DRINKS</option>
                    <option value="Main Course & Swallows">Main Course & Swallows</option>
                    <option value="Grill & Suya Special">Grill & Suya Special</option>
                    <option value="Beverages & Drinks">Beverages & Drinks</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#1A1A1A] block mb-1">Price (₦) *</label>
                  <input
                    type="number"
                    required
                    min={100}
                    value={newDishPrice}
                    onChange={(e) => setNewDishPrice(parseInt(e.target.value) || 0)}
                    className="w-full p-2 bg-[#FDFCF9] border border-[#E5E2DA] font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-[#1A1A1A] block mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Ingredients, preparation style or flavor notes..."
                  value={newDishDesc}
                  onChange={(e) => setNewDishDesc(e.target.value)}
                  className="w-full p-2 bg-[#FDFCF9] border border-[#E5E2DA]"
                />
              </div>

              <div className="flex gap-4 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDishChefSpecial}
                    onChange={(e) => setNewDishChefSpecial(e.target.checked)}
                  />
                  <span className="font-bold text-[#1A1A1A]">Chef's Special</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newDishSpicy}
                    onChange={(e) => setNewDishSpicy(e.target.checked)}
                  />
                  <span className="font-bold text-[#8B2626]">Spicy Dish</span>
                </label>
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-[#E5E2DA]">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#1A1A1A] text-[#FDFCF9] text-xs font-bold uppercase tracking-wider"
              >
                Save Item to Menu
              </button>
              <button
                type="button"
                onClick={() => setIsNewMenuModalOpen(false)}
                className="px-4 py-2.5 bg-[#F5F2ED] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Import Custom Menu Text */}
      {isImportMenuModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-lg w-full p-6 border border-[#1A1A1A] shadow-xl space-y-4">
            <div className="flex justify-between items-start border-b border-[#E5E2DA] pb-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-[#1A1A1A]">
                  Bulk Import Custom Restaurant Menu
                </h3>
                <p className="text-xs text-[#73706B]">Paste your menu list line by line</p>
              </div>
              <button
                onClick={() => setIsImportMenuModalOpen(false)}
                className="text-xs font-bold text-[#8C8984] hover:text-[#1A1A1A]"
              >
                ✕ Close
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p className="text-[#73706B]">
                Format each line as: <strong>Dish Name, Price, Category</strong>
              </p>
              <div className="bg-[#FDFCF9] p-2 border border-[#E5E2DA] font-mono text-[10px] text-[#555]">
                Example:<br/>
                Fried Chicken Suya, 4500, Grill & Suya Special<br/>
                Peppered Goat Meat, 3800, Soups & Delicacies<br/>
                Cold Zobo Bottle, 1200, Beverages & Drinks
              </div>

              <textarea
                rows={6}
                placeholder="Paste your menu list here..."
                value={rawMenuText}
                onChange={(e) => setRawMenuText(e.target.value)}
                className="w-full p-3 bg-[#FDFCF9] border border-[#E5E2DA] font-mono"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-[#E5E2DA]">
              <button
                onClick={handleImportMenu}
                className="flex-1 py-2.5 bg-[#1A1A1A] text-[#FDFCF9] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
              >
                <Upload className="w-4 h-4 text-[#C8B282]" />
                <span>Process & Import Items</span>
              </button>
              <button
                onClick={() => setIsImportMenuModalOpen(false)}
                className="px-4 py-2.5 bg-[#F5F2ED] text-[#1A1A1A] text-xs font-bold uppercase tracking-wider"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Render the Payment Modal */}
      {isPaymentModalOpen && pendingCheckoutOrder && (
        <PaymentFormModal
          invoices={[
            {
              id: pendingCheckoutOrder.id,
              reservationId: '',
              guestId: '',
              guestName: pendingCheckoutOrder.customerName,
              guestPhone: '',
              roomNumber: pendingCheckoutOrder.tableOrRoom,
              roomCategory: 'Standard',
              checkInDate: new Date().toISOString().split('T')[0],
              checkOutDate: new Date().toISOString().split('T')[0],
              nights: 0,
              roomChargePerNight: 0,
              totalRoomCharge: 0,
              additionalServices: pendingCheckoutOrder.items.map(i => ({ description: i.menuItem.name, amount: i.menuItem.price * i.quantity })),
              subtotal: pendingCheckoutOrder.subtotal,
              tax: pendingCheckoutOrder.tax,
              discount: 0,
              grandTotal: pendingCheckoutOrder.grandTotal,
              amountPaid: 0,
              balance: pendingCheckoutOrder.grandTotal,
              status: 'Unpaid',
              createdAt: new Date().toISOString(),
              dueDate: new Date().toISOString()
            }
          ]}
          cashierName={cashierName}
          onClose={() => {
            setIsPaymentModalOpen(false);
            setPendingCheckoutOrder(null);
          }}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}

      {/* TAB 4: DASHBOARD */}
      {activeTab === 'dashboard' && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center border-2 border-dashed border-[#E5E2DA] rounded-lg p-10 bg-white">
          <Building2 className="w-16 h-16 text-[#C8B282] mb-4" />
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Dashboard</h2>
          <p className="text-[#73706B] max-w-md mx-auto">
            Welcome to the Restaurant Management System. This dashboard view is currently a placeholder and will be populated with key metrics and live activity feeds in a future update.
          </p>
          <button onClick={() => setActiveTab('pos')} className="mt-6 px-6 py-2 bg-[#024628] text-white text-sm font-semibold rounded hover:bg-[#03331d] transition-colors">
            Go to Point of Sale
          </button>
        </div>
      )}

      {/* TAB 5: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center border-2 border-dashed border-[#E5E2DA] rounded-lg p-10 bg-white">
          <FileSpreadsheet className="w-16 h-16 text-[#C8B282] mb-4" />
          <h2 className="text-2xl font-bold text-[#1A1A1A] mb-2">Analytics & Reports</h2>
          <p className="text-[#73706B] max-w-md mx-auto">
            This module will feature comprehensive sales reports, menu performance analytics, and cashier end-of-day summaries. It is currently under construction.
          </p>
        </div>
      )}
      
      </div> {/* End Main Content Area */}
    </div>
  );
};
