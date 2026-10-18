import type { Reservation } from '../types';

export const INITIAL_RESERVATIONS: Reservation[] = [
  {
    id: 'RES-2026-001',
    customerName: 'Engr. Kabir Lawal',
    phoneNumber: '0803 123 4567',
    email: 'kabir.lawal@example.com',
    guestCount: 4,
    tableId: 'table-g-03',
    tableNumber: 'Table G-03',
    floor: 'Ground Floor',
    reservationDate: 'Today',
    reservationTime: '02:00 PM',
    durationMinutes: 90,
    status: 'Confirmed',
    specialRequests: 'Pre-booked family anniversary lunch. Center table preferred.',
    createdAt: '10:00 AM'
  },
  {
    id: 'RES-2026-002',
    customerName: 'Barrister Faruk Bello',
    phoneNumber: '0802 987 6543',
    email: 'faruk.bello@lawfirm.ng',
    guestCount: 3,
    tableId: 'table-f-01',
    tableNumber: 'Table F-01',
    floor: 'First Floor',
    reservationDate: 'Today',
    reservationTime: '01:15 PM',
    durationMinutes: 120,
    status: 'Seated',
    specialRequests: 'VIP Executive Lounge table, confidential business discussion.',
    createdAt: '09:30 AM'
  },
  {
    id: 'RES-2026-003',
    customerName: 'Dr. Aisha Yusuf',
    phoneNumber: '0809 555 4321',
    email: 'aisha.yusuf@fmc.gov.ng',
    guestCount: 4,
    tableId: 'table-f-03',
    tableNumber: 'Table F-03',
    floor: 'First Floor',
    reservationDate: 'Today',
    reservationTime: '07:30 PM',
    durationMinutes: 120,
    status: 'Confirmed',
    specialRequests: 'Private dining for hospital board delegation.',
    createdAt: '11:15 AM'
  },
  {
    id: 'RES-2026-004',
    customerName: 'Hajiya Maryam Aliyu',
    phoneNumber: '0806 777 8899',
    email: 'maryam.aliyu@gmail.com',
    guestCount: 2,
    tableId: 'table-g-04',
    tableNumber: 'Table G-04',
    floor: 'Ground Floor',
    reservationDate: 'Today',
    reservationTime: '06:00 PM',
    durationMinutes: 60,
    status: 'Confirmed',
    specialRequests: 'Garden patio seating, requested fresh watermelon juice.',
    createdAt: '08:45 AM'
  }
];
