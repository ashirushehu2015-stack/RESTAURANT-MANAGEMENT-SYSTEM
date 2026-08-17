import { RestaurantModule } from './components/RestaurantModule';
import { LoginPage } from './components/LoginPage';
import { INITIAL_MENU_ITEMS, INITIAL_RESTAURANT_ORDERS } from './data/restaurantData';
import { useState } from 'react';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [orders, setOrders] = useState(INITIAL_RESTAURANT_ORDERS);

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <div className='h-screen bg-[#FDFCF9]'>
      <RestaurantModule
        menuItems={INITIAL_MENU_ITEMS}
        onAddMenuItem={() => {}}
        onUpdateMenuItem={() => {}}
        onDeleteMenuItem={() => {}}
        orders={orders}
        onPlaceOrder={(o) => setOrders([o, ...orders])}
        onUpdateOrderStatus={(id, status) => setOrders(orders.map(o => o.id === id ? {...o, status} : o))}
        cashierName="Prototype Cashier"
        userRole="super_admin"
      />
    </div>
  );
}

export default App;
