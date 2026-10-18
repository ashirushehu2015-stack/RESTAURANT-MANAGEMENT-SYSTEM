import type { RestaurantTable } from '../types';

export const INITIAL_TABLES: RestaurantTable[] = [
  // ================= GROUND FLOOR (20 SEATS TOTAL) =================
  {
    id: 'table-g-01',
    tableNumber: 'Table G-01',
    floor: 'Ground Floor',
    seats: 4,
    shape: 'booth',
    status: 'Occupied',
    currentGuestName: 'Alhaji Sanusi Gusau',
    guestCount: 4,
    assignedServer: 'Prototype Cashier',
    orderTotal: 12500,
    seatedAt: '12:30 PM',
    notes: 'Window booth, guest requested chilled drinks'
  },
  {
    id: 'table-g-02',
    tableNumber: 'Table G-02',
    floor: 'Ground Floor',
    seats: 4,
    shape: 'rectangular',
    status: 'Available',
    guestCount: 0,
    notes: 'Main dining hall center'
  },
  {
    id: 'table-g-03',
    tableNumber: 'Table G-03',
    floor: 'Ground Floor',
    seats: 4,
    shape: 'rectangular',
    status: 'Reserved',
    currentGuestName: 'Engr. Kabir Lawal',
    guestCount: 4,
    reservationTime: '02:00 PM',
    notes: 'Pre-booked family anniversary lunch'
  },
  {
    id: 'table-g-04',
    tableNumber: 'Table G-04',
    floor: 'Ground Floor',
    seats: 2,
    shape: 'round',
    status: 'Available',
    guestCount: 0,
    notes: 'Garden patio view'
  },
  {
    id: 'table-g-05',
    tableNumber: 'Table G-05',
    floor: 'Ground Floor',
    seats: 2,
    shape: 'round',
    status: 'Cleaning',
    guestCount: 0,
    notes: 'Bussing and sanitizing table'
  },
  {
    id: 'table-g-06',
    tableNumber: 'Table G-06',
    floor: 'Ground Floor',
    seats: 4,
    shape: 'booth',
    status: 'Available',
    guestCount: 0,
    notes: 'Cozy corner booth'
  },

  // ================= FIRST FLOOR (10 SEATS TOTAL) =================
  {
    id: 'table-f-01',
    tableNumber: 'Table F-01',
    floor: 'First Floor',
    seats: 4,
    shape: 'booth',
    status: 'Occupied',
    currentGuestName: 'Barrister Faruk Bello',
    guestCount: 3,
    assignedServer: 'Head Chef Emeka',
    orderTotal: 18500,
    seatedAt: '01:15 PM',
    notes: 'VIP Executive Lounge'
  },
  {
    id: 'table-f-02',
    tableNumber: 'Table F-02',
    floor: 'First Floor',
    seats: 2,
    shape: 'round',
    status: 'Available',
    guestCount: 0,
    notes: 'Terrace Balcony - Scenic Overlook'
  },
  {
    id: 'table-f-03',
    tableNumber: 'Table F-03',
    floor: 'First Floor',
    seats: 4,
    shape: 'rectangular',
    status: 'Available',
    guestCount: 0,
    notes: 'Mezzanine Private Dining'
  }
];

export const GROUND_FLOOR_SEATS_TARGET = 20;
export const FIRST_FLOOR_SEATS_TARGET = 10;
