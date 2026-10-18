import React, { useState } from 'react';
import type { RestaurantOrder, RestaurantMenuItem } from '../types';
import { formatNaira } from '../utils/formatters';
import { 
  Calendar, 
  ShoppingBag, 
  ChefHat, 
  DollarSign, 
  Clock, 
  Utensils, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Flame, 
  Award,
  TrendingUp,
  Package
} from 'lucide-react';

interface DashboardProps {
  orders: RestaurantOrder[];
  menuItems: RestaurantMenuItem[];
  cashierName: string;
  onNavigate: (tab: string) => void;
}

type Period = 'today' | 'week' | 'month' | 'all';

export const Dashboard: React.FC<DashboardProps> = ({
  orders,
  menuItems,
  cashierName,
  onNavigate
}) => {
  const [period, setPeriod] = useState<Period>('today');
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';

  const getStartDate = (p: Period): Date => {
    const d = new Date();
    if (p === 'today') {
      d.setHours(0, 0, 0, 0);
    } else if (p === 'week') {
      const day = d.getDay();
      d.setDate(d.getDate() - day);
      d.setHours(0, 0, 0, 0);
    } else if (p === 'month') {
      d.setDate(1);
      d.setHours(0, 0, 0, 0);
    } else {
      d.setFullYear(2000);
    }
    return d;
  };

  const periodLabels: Record<Period, string> = {
    today: "Today's",
    week: "This Week's",
    month: "This Month's",
    all: "All-Time"
  };

  const startDate = getStartDate(period);
  const periodOrders = orders.filter((o) => {
    if (o.paymentStatus === 'Voided') return false;
    const createdDate = new Date(o.createdAt);
    return isNaN(createdDate.getTime()) || createdDate >= startDate;
  });

  const paidOrders = periodOrders.filter((o) => o.paymentStatus === 'Paid');
  const totalRevenue = paidOrders.reduce((acc, o) => acc + o.grandTotal, 0);
  const orderCount = periodOrders.length;
  const avgOrderValue = orderCount > 0 ? totalRevenue / orderCount : 0;

  const activeKitchenOrders = orders.filter(
    (o) => o.kitchenStatus === 'Preparing' || o.kitchenStatus === 'Pending'
  );
  const readyKitchenOrders = orders.filter((o) => o.kitchenStatus === 'Ready');

  const dineInCount = periodOrders.filter((o) => o.orderType === 'Dine-In').length;
  const takeawayCount = periodOrders.filter((o) => o.orderType === 'Takeaway').length;
  const deliveryCount = periodOrders.filter((o) => o.orderType === 'Home / Office Delivery' || o.orderType === 'Room Delivery').length;

  // Top Sellers
  const itemSalesMap: Record<string, { name: string; qty: number; revenue: number }> = {};
  periodOrders.forEach((o) => {
    o.items.forEach((item) => {
      const id = item.menuItem.id;
      if (!itemSalesMap[id]) {
        itemSalesMap[id] = { name: item.menuItem.name, qty: 0, revenue: 0 };
      }
      itemSalesMap[id].qty += item.quantity;
      itemSalesMap[id].revenue += item.menuItem.price * item.quantity;
    });
  });

  const topSellers = Object.values(itemSalesMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  const unavailableCount = menuItems.filter((i) => i.available === false).length;
  const totalMenuItems = menuItems.length;

  const paymentBreakdown: Record<string, number> = {};
  paidOrders.forEach((o) => {
    paymentBreakdown[o.paymentMethod] = (paymentBreakdown[o.paymentMethod] || 0) + o.grandTotal;
  });

  const periods: { key: Period; label: string }[] = [
    { key: 'today', label: 'Daily' },
    { key: 'week', label: 'Weekly' },
    { key: 'month', label: 'Monthly' },
    { key: 'all', label: 'All Time' }
  ];

  return (
    <div className="space-y-6">
      {/* Good Morning Executive Banner */}
      <div className="bg-gradient-to-r from-[#0b1221] to-[#1a2d45] p-6 rounded-xl text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm border border-[#1a2333]">
        <div>
          <p className="text-[#C8B282] text-xs font-bold uppercase tracking-widest mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {now.toLocaleDateString('en-NG', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </span>
          </p>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold">
            {greeting}, {cashierName}!
          </h1>
          <p className="text-[#8A9BB5] text-sm mt-1">
            Here's your restaurant performance snapshot.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onNavigate('pos')}
            className="px-5 py-2.5 bg-[#C8B282] hover:bg-[#b89f6e] text-[#0b1221] text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2 shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Open POS</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('kds')}
            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold uppercase tracking-wider rounded transition-colors flex items-center gap-2 border border-white/20"
          >
            <ChefHat className="w-4 h-4" />
            <span>Kitchen</span>
          </button>
        </div>
      </div>

      {/* Period Filter Selector */}
      <div className="flex items-center gap-1 bg-white border border-[#E5E2DA] rounded-lg p-1.5 w-fit shadow-xs">
        {periods.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={`px-5 py-2 text-xs font-bold uppercase tracking-wider rounded-md transition-all duration-200 ${
              period === p.key
                ? 'bg-[#0b1221] text-white shadow-md'
                : 'text-[#6c757d] hover:text-[#1A1A1A] hover:bg-[#f8f9fa]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* 4 Top KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue Card */}
        <div className="bg-white p-5 border border-[#E5E2DA] rounded-lg shadow-xs hover:border-[#C8B282] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-[#73706B] uppercase tracking-widest">
              {periodLabels[period]} Revenue
            </p>
            <div className="w-9 h-9 bg-[#dcfce7] text-[#166534] rounded-lg flex items-center justify-center font-bold">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-[#1A1A1A]">
            {formatNaira(totalRevenue)}
          </p>
          <p className="text-[11px] text-[#2D5A44] font-semibold mt-1 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>From {paidOrders.length} paid orders</span>
          </p>
        </div>

        {/* Orders Card */}
        <div className="bg-white p-5 border border-[#E5E2DA] rounded-lg shadow-xs hover:border-[#C8B282] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-[#73706B] uppercase tracking-widest">
              {periodLabels[period]} Orders
            </p>
            <div className="w-9 h-9 bg-[#e0f2fe] text-[#0369a1] rounded-lg flex items-center justify-center font-bold">
              <ShoppingBag className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-[#1A1A1A]">
            {orderCount}
          </p>
          <p className="text-[11px] text-[#495057] mt-1 font-medium">
            Avg value: <span className="font-mono font-bold">{formatNaira(avgOrderValue)}</span>
          </p>
        </div>

        {/* Kitchen Queue Card */}
        <div className="bg-white p-5 border border-[#E5E2DA] rounded-lg shadow-xs hover:border-[#C8B282] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-[#73706B] uppercase tracking-widest">
              Kitchen Queue
            </p>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold ${
              activeKitchenOrders.length > 0 ? 'bg-[#fef3c7] text-[#b45309]' : 'bg-[#f1f5f9] text-[#64748b]'
            }`}>
              <Flame className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-[#1A1A1A]">
            {activeKitchenOrders.length}
          </p>
          <p className="text-[11px] text-[#495057] mt-1 font-medium">
            {readyKitchenOrders.length} ready for pickup
          </p>
        </div>

        {/* Menu Items Card */}
        <div className="bg-white p-5 border border-[#E5E2DA] rounded-lg shadow-xs hover:border-[#C8B282] transition-colors">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-[#73706B] uppercase tracking-widest">
              Menu Items
            </p>
            <div className="w-9 h-9 bg-[#f3e8ff] text-[#7c3aed] rounded-lg flex items-center justify-center font-bold">
              <Utensils className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-mono font-bold text-[#1A1A1A]">
            {totalMenuItems}
          </p>
          {unavailableCount > 0 ? (
            <p className="text-[11px] text-[#b45309] font-semibold mt-1 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{unavailableCount} unavailable</span>
            </p>
          ) : (
            <p className="text-[11px] text-[#2D5A44] font-semibold mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>All items available</span>
            </p>
          )}
        </div>
      </div>

      {/* Main Grid: Recent Orders (2 Cols) + Order Breakdown & Top Sellers (1 Col) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders List (2 Columns) */}
        <div className="lg:col-span-2 bg-white border border-[#E5E2DA] rounded-lg shadow-xs overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-[#E5E2DA] bg-[#f8f9fa]">
            <h3 className="font-bold text-[#1A1A1A] text-sm uppercase tracking-wider">
              Recent Orders
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('order_history')}
              className="text-[11px] font-bold text-[#0b1221] uppercase tracking-wider flex items-center gap-1 hover:text-[#C8B282] transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-[#E5E2DA]">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 hover:bg-[#f8f9fa] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      order.kitchenStatus === 'Served'
                        ? 'bg-[#22c55e]'
                        : order.kitchenStatus === 'Ready'
                        ? 'bg-[#3b82f6]'
                        : order.kitchenStatus === 'Preparing'
                        ? 'bg-[#f59e0b]'
                        : 'bg-[#94a3b8]'
                    }`}
                  />
                  <div>
                    <span className="font-mono font-bold text-[#1A1A1A] text-sm">
                      {order.id}
                    </span>
                    <span className="block text-[11px] text-[#6c757d]">
                      {order.customerName || 'Walk-in'} • {order.orderType} • {order.tableOrRoom}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-mono font-bold text-[#1A1A1A] text-sm block">
                    {formatNaira(order.grandTotal)}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider ${
                      order.paymentStatus === 'Paid'
                        ? 'text-[#166534]'
                        : order.paymentStatus === 'Voided'
                        ? 'text-[#991b1b]'
                        : 'text-[#b45309]'
                    }`}
                  >
                    {order.paymentStatus}
                  </span>
                </div>
              </div>
            ))}

            {recentOrders.length === 0 && (
              <div className="p-8 text-center text-[#6c757d] text-sm">
                No orders yet. Open the POS to start!
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Widgets (1 Column): Order Breakdown, Top Sellers, Payment Methods */}
        <div className="space-y-6">
          {/* Order Breakdown */}
          <div className="bg-white border border-[#E5E2DA] rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E5E2DA] bg-[#f8f9fa]">
              <h3 className="font-bold text-[#1A1A1A] text-sm uppercase tracking-wider">
                Order Breakdown
              </h3>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: 'Dine-In', count: dineInCount, color: 'bg-[#0b1221]' },
                { label: 'Takeaway', count: takeawayCount, color: 'bg-[#C8B282]' },
                { label: 'Delivery', count: deliveryCount, color: 'bg-[#2D5A44]' }
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#495057]">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} rounded-full transition-all duration-500`}
                        style={{
                          width: `${orderCount > 0 ? (item.count / orderCount) * 100 : 0}%`
                        }}
                      />
                    </div>
                    <span className="font-mono font-bold text-[#1A1A1A] text-xs w-6 text-right">
                      {item.count}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Sellers */}
          <div className="bg-white border border-[#E5E2DA] rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E5E2DA] bg-[#f8f9fa]">
              <h3 className="font-bold text-[#1A1A1A] text-sm uppercase tracking-wider">
                Top Sellers ({periodLabels[period]})
              </h3>
            </div>
            <div className="divide-y divide-[#E5E2DA]">
              {topSellers.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 px-4">
                  <div className="flex items-center gap-2.5">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                        idx === 0
                          ? 'bg-[#fef3c7] text-[#b45309]'
                          : idx === 1
                          ? 'bg-[#f1f5f9] text-[#64748b]'
                          : 'bg-[#f8f9fa] text-[#adb5bd]'
                      }`}
                    >
                      {idx === 0 ? <Award className="w-3.5 h-3.5" /> : idx + 1}
                    </span>
                    <span className="text-xs font-semibold text-[#1A1A1A]">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-xs font-bold text-[#1A1A1A] block">
                      {item.qty} sold
                    </span>
                    <span className="block text-[10px] text-[#6c757d]">
                      {formatNaira(item.revenue)}
                    </span>
                  </div>
                </div>
              ))}
              {topSellers.length === 0 && (
                <div className="p-6 text-center text-[#6c757d] text-xs">
                  No sales data yet.
                </div>
              )}
            </div>
          </div>

          {/* Payment Methods Breakdown */}
          <div className="bg-white border border-[#E5E2DA] rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 border-b border-[#E5E2DA] bg-[#f8f9fa]">
              <h3 className="font-bold text-[#1A1A1A] text-sm uppercase tracking-wider">
                Payment Methods
              </h3>
            </div>
            <div className="p-4 space-y-2">
              {Object.entries(paymentBreakdown).length > 0 ? (
                Object.entries(paymentBreakdown)
                  .sort((a, b) => b[1] - a[1])
                  .map(([method, amount]) => (
                    <div key={method} className="flex items-center justify-between py-1.5 text-xs">
                      <span className="text-[#495057] font-medium">{method}</span>
                      <span className="font-mono font-bold text-[#1A1A1A]">
                        {formatNaira(amount)}
                      </span>
                    </div>
                  ))
              ) : (
                <p className="text-center text-[#6c757d] text-xs py-2">
                  No payments recorded yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Launch Cards (4 Columns) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Point of Sale', tab: 'pos', icon: ShoppingBag, color: 'bg-[#0b1221]', text: 'text-white' },
          { label: 'Kitchen Display', tab: 'kds', icon: ChefHat, color: 'bg-[#fef3c7]', text: 'text-[#b45309]' },
          { label: 'Inventory', tab: 'inventory', icon: Package, color: 'bg-[#dcfce7]', text: 'text-[#166534]' },
          { label: 'Order History', tab: 'order_history', icon: Clock, color: 'bg-[#e0f2fe]', text: 'text-[#0369a1]' }
        ].map((btn) => (
          <button
            key={btn.tab}
            type="button"
            onClick={() => onNavigate(btn.tab)}
            className={`${btn.color} ${btn.text} p-4 rounded-lg flex flex-col items-center gap-2 hover:opacity-90 transition-opacity shadow-xs cursor-pointer`}
          >
            <btn.icon className="w-6 h-6" />
            <span className="text-xs font-bold uppercase tracking-wider">{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
