export type AppServiceModule = 'hotel' | 'restaurant' | 'kitchen';

export type RestaurantCategory = 
  | 'FOOD MENU'
  | 'SNACKS'
  | 'PROTEIN'
  | 'DRINKS'
  | 'Appetizers & Starters' 
  | 'Main Course & Swallows' 
  | 'Grill & Suya Special' 
  | 'Soups & Delicacies' 
  | 'Beverages & Drinks' 
  | 'Desserts'
  | (string & {});

export interface RestaurantMenuItem {
  id: string;
  name: string;
  category: RestaurantCategory;
  price: number;
  description: string;
  imageUrl?: string;
  available: boolean;
  prepTimeMinutes: number;
  isSpicy?: boolean;
  isChefSpecial?: boolean;
  establishment?: 'hotel_restaurant' | 'central_kitchen';
}

export interface OrderItem {
  menuItem: RestaurantMenuItem;
  quantity: number;
  notes?: string;
}

export interface RestaurantOrder {
  id: string; // e.g. ORD-2026-0041
  tableOrRoom: string; // e.g. "Table 04" or "Room 108"
  orderType: 'Dine-In' | 'Takeaway' | 'Room Delivery' | 'Home / Office Delivery';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  serviceCharge: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'Paid' | 'Pending';
  kitchenStatus: 'Pending' | 'Preparing' | 'Ready' | 'Served';
  createdAt: string;
  cashierName: string;
  customerName?: string;
  establishment?: 'hotel_restaurant' | 'central_kitchen';
}

export type RoomCategory = 
  | 'Standard'
  | 'Luxury'
  | 'Super Luxury'
  | 'Royal Suite'
  | 'Executive Suite'
  | 'VIP Suite'
  | 'Charlet Apartment';

export type RoomStatus = 'Available' | 'Occupied' | 'Reserved' | 'Cleaning' | 'Maintenance';

export interface Room {
  id: string;
  roomNumber: string;
  category: RoomCategory;
  rate: number; // Nightly rate in Naira ₦
  floor: string;
  status: RoomStatus;
  features: string[];
}

export interface Guest {
  id: string;
  registrationNo: string; // e.g. "02578"
  firstName: string;
  lastName: string;
  nationality: string;
  meansOfId: 'National ID' | 'Passport' | 'Driver License' | 'Voter Card' | 'Other';
  idNumber: string;
  comingFrom: string;
  nextDestination: string;
  phoneNo: string;
  email: string;
  nextOfKinPhone: string;
  roomNo: string;
  signatureDate: string;
  authorizedBy: string;
  paidByMethod: 'POS' | 'CASH' | 'TRANSFER';
  createdAt: string;
}

export interface AdditionalService {
  id: string;
  description: string;
  category: 'Laundry' | 'Restaurant & Room Service' | 'Bar & Drinks' | 'Airport Pickup / Transport' | 'Other';
  amount: number;
  date: string;
}

export interface Invoice {
  id: string; // e.g. INV-202600020
  reservationId: string;
  guestId: string;
  guestName: string;
  guestPhone: string;
  roomNumber: string;
  roomCategory: RoomCategory;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  roomChargePerNight: number;
  totalRoomCharge: number;
  additionalServices: AdditionalService[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  amountPaid: number;
  balance: number;
  status: 'Unpaid' | 'Partially Paid' | 'Fully Paid';
  createdAt: string;
}

export type PaymentMethod = 'Cash' | 'POS Machine' | 'Bank Transfer' | 'Opay' | 'Moniepoint';
export type PaymentStatus = 'Paid' | 'Partially Paid' | 'Pending';
export type PaymentGateway = 'Paystack' | 'Flutterwave' | 'Moniepoint' | 'Opay' | 'Manual_POS' | 'Direct_Cash';

export interface PaymentRecord {
  id: string;
  receiptNo: string; // RCT-202600023 or 0663
  invoiceNo: string; // INV-202600020
  reservationId: string;
  guestId: string;
  guestName: string;
  guestPhone: string;
  roomNumber: string;
  roomType: RoomCategory;
  checkInDate: string;
  checkOutDate: string;
  nights: number;
  roomCharge: number;
  additionalServicesTotal: number;
  tax: number;
  discount: number;
  amountDue: number;
  amountPaid: number;
  balance: number;
  paymentDate: string;
  paymentTime: string;
  paymentMethod: PaymentMethod;
  transactionReference: string; // e.g. TRX98263418 or FT23004838191
  bankName?: string;
  posTerminalId?: string;
  receivedBy: string; // Cashier Name
  paymentStatus: PaymentStatus;
  remarks: string;
  authorizedBy: string;
  createdAt: string;
  reprintCount?: number;
  lastReprintedAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: string;
  action: 'PAYMENT_RECORDED' | 'RECEIPT_REPRINTED' | 'CHECK_IN' | 'CHECK_OUT' | 'ROOM_STATUS_CHANGED' | 'SERVICE_ADDED' | 'GUEST_REGISTERED';
  details: string;
  reference: string;
}

export type UserRole = 
  | 'General Manager'
  | 'Supervisor'
  | 'Front Desk Officer'
  | 'Receptionist'
  | 'Restaurant Manager'
  | 'Restaurant Waiter 1'
  | 'Restaurant Waiter 2'
  | 'Kitchen Manager'
  | 'Kitchen Waiter 1'
  | 'Kitchen Waiter 2'
  | 'Hotel Manager'
  | 'Cashier' 
  | 'Duty Manager' 
  | 'Supervisor';

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  phoneNumber?: string;
  staffId: string;
  department: string;
  avatarColor: string;
  permissions: string[];
  description: string;
  twoFactorEnabled?: boolean;
  twoFactorSecret?: string;
}

export interface HotelInfo {
  name: string;
  tagline: string;
  address: string;
  email: string;
  phone: string;
  registrationBox: string;
}
