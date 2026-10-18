import { RestaurantModule } from './components/RestaurantModule';
import { LoginPage } from './components/LoginPage';
import { INITIAL_MENU_ITEMS, INITIAL_RESTAURANT_ORDERS } from './data/restaurantData';
import type { RestaurantMenuItem, RestaurantOrder, AuditLog } from './types';
import { useState, useEffect } from 'react';

const MENU_STORAGE_KEY = 'fulbe_restaurant_menu_items';
const ORDERS_STORAGE_KEY = 'fulbe_restaurant_orders';
const AUTH_STORAGE_KEY = 'fulbe_restaurant_logged_in';

function checkIsLoggedIn(): boolean {
  try {
    return (
      localStorage.getItem(AUTH_STORAGE_KEY) === 'true' ||
      sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true'
    );
  } catch (e) {
    console.error('Failed to load auth status from storage', e);
    return false;
  }
}

function loadInitialMenuItems(): RestaurantMenuItem[] {
  try {
    const saved = localStorage.getItem(MENU_STORAGE_KEY) || sessionStorage.getItem(MENU_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load menu from storage', e);
  }
  return INITIAL_MENU_ITEMS;
}

function loadInitialOrders(): RestaurantOrder[] {
  try {
    const saved = localStorage.getItem(ORDERS_STORAGE_KEY) || sessionStorage.getItem(ORDERS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load orders from storage', e);
  }
  return INITIAL_RESTAURANT_ORDERS;
}

function persistMenuItems(items: RestaurantMenuItem[]) {
  try {
    localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('localStorage menu save failed', e);
  }
  try {
    sessionStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('sessionStorage menu save failed', e);
  }
}

function persistOrders(orders: RestaurantOrder[]) {
  try {
    localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn('localStorage orders save failed', e);
  }
  try {
    sessionStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  } catch (e) {
    console.warn('sessionStorage orders save failed', e);
  }
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(checkIsLoggedIn);
  const [menuItems, setMenuItems] = useState<RestaurantMenuItem[]>(loadInitialMenuItems);
  const [orders, setOrders] = useState<RestaurantOrder[]>(loadInitialOrders);

  // Synchronize on state change as secondary guarantee
  useEffect(() => {
    persistMenuItems(menuItems);
  }, [menuItems]);

  useEffect(() => {
    persistOrders(orders);
  }, [orders]);

  const handleAddMenuItem = (item: RestaurantMenuItem) => {
    setMenuItems((prev) => {
      const updated = [item, ...prev.filter((i) => i.id !== item.id)];
      persistMenuItems(updated);
      return updated;
    });
  };

  const handleUpdateMenuItem = (updatedItem: RestaurantMenuItem) => {
    setMenuItems((prev) => {
      const updated = prev.map((item) => (item.id === updatedItem.id ? updatedItem : item));
      persistMenuItems(updated);
      return updated;
    });
  };

  const handleDeleteMenuItem = (id: string) => {
    setMenuItems((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      persistMenuItems(updated);
      return updated;
    });
  };

  const handlePlaceOrder = (newOrder: RestaurantOrder, _log?: AuditLog) => {
    setOrders((prev) => {
      const updated = [newOrder, ...prev];
      persistOrders(updated);
      return updated;
    });
  };

  const handleUpdateOrderStatus = (
    id: string,
    status: 'Pending' | 'Preparing' | 'Ready' | 'Served',
    _log?: AuditLog
  ) => {
    setOrders((prev) => {
      const updated = prev.map((o) =>
        o.id === id ? { ...o, status, kitchenStatus: status } : o
      );
      persistOrders(updated);
      return updated;
    });
  };

  const handleLogin = () => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    } catch (e) {}
    try {
      sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
    } catch (e) {}
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {}
    try {
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {}
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className='h-screen bg-[#FDFCF9]'>
      <RestaurantModule
        menuItems={menuItems}
        onAddMenuItem={handleAddMenuItem}
        onUpdateMenuItem={handleUpdateMenuItem}
        onDeleteMenuItem={handleDeleteMenuItem}
        orders={orders}
        onPlaceOrder={handlePlaceOrder}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        cashierName="Prototype Cashier"
        userRole="super_admin"
        onLogout={handleLogout}
      />
    </div>
  );
}

export default App;
