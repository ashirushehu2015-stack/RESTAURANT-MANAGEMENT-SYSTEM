import { RestaurantModule } from './components/RestaurantModule';
import { LoginPage } from './components/LoginPage';
import { INITIAL_MENU_ITEMS, INITIAL_RESTAURANT_ORDERS } from './data/restaurantData';
import type { RestaurantMenuItem, RestaurantOrder, AuditLog } from './types';
import { useState, useEffect } from 'react';

const MENU_STORAGE_KEY = 'fulbe_restaurant_menu_items';
const ORDERS_STORAGE_KEY = 'fulbe_restaurant_orders';
const AUTH_STORAGE_KEY = 'fulbe_restaurant_logged_in';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    } catch (e) {
      console.error('Failed to load auth status from localStorage', e);
      return false;
    }
  });

  const [menuItems, setMenuItems] = useState<RestaurantMenuItem[]>(() => {
    try {
      const saved = localStorage.getItem(MENU_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load menu from localStorage', e);
    }
    return INITIAL_MENU_ITEMS;
  });

  const [orders, setOrders] = useState<RestaurantOrder[]>(() => {
    try {
      const saved = localStorage.getItem(ORDERS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load orders from localStorage', e);
    }
    return INITIAL_RESTAURANT_ORDERS;
  });

  // Persist changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menuItems));
    } catch (e) {
      console.error('Failed to save menu items', e);
    }
  }, [menuItems]);

  useEffect(() => {
    try {
      localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
    } catch (e) {
      console.error('Failed to save orders', e);
    }
  }, [orders]);

  const handleAddMenuItem = (item: RestaurantMenuItem) => {
    setMenuItems((prev) => [item, ...prev]);
  };

  const handleUpdateMenuItem = (updatedItem: RestaurantMenuItem) => {
    setMenuItems((prev) => prev.map((item) => (item.id === updatedItem.id ? updatedItem : item)));
  };

  const handleDeleteMenuItem = (id: string) => {
    setMenuItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePlaceOrder = (newOrder: RestaurantOrder, _log?: AuditLog) => {
    setOrders((prev) => [newOrder, ...prev]);
  };

  const handleUpdateOrderStatus = (
    id: string,
    status: 'Pending' | 'Preparing' | 'Ready' | 'Served',
    _log?: AuditLog
  ) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status, kitchenStatus: status } : o))
    );
  };

  const handleLogin = () => {
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, 'true');
    } catch (e) {
      console.error('Failed to save auth status to localStorage', e);
    }
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    } catch (e) {
      console.error('Failed to clear auth status from localStorage', e);
    }
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
