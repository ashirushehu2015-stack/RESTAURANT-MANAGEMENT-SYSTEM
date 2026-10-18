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

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Raw Ingredients' | 'Beverages' | 'Packaging' | 'Spices & Seasoning' | 'Dairy & Poultry' | string;
  unit: string;
  quantityInStock: number;
  minimumThreshold: number;
  costPerUnit: number;
  supplier?: string;
  lastRestocked?: string;
}

export interface Supplier {
  id: string;
  name: string;
  category: string;
  contactPerson: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
}

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  commodity: string;          // e.g. "Long Grain Rice", "Boneless Beef", "Fresh Tomatoes"
  quantity: number;           // e.g. 10
  unit: string;               // e.g. "kg", "bags", "crates", "liters", "cartons", "packs", "pieces"
  unitCost: number;           // unit cost in Naira (₦)
  totalAmount: number;        // auto-calculated: quantity * unitCost
  paymentMode: 'Cash' | 'Bank Transfer' | 'POS Machine';
  paymentStatus: 'Fully Paid' | 'Partially Paid' | 'Unpaid';
  amountPaid: number;         // amount paid so far
  balance: number;            // outstanding balance: totalAmount - amountPaid
  orderDate: string;
  expectedDelivery: string;
  deliveryStatus: 'Pending' | 'Received';
  description?: string;       // optional / backward compatibility
  status?: string;            // optional / backward compatibility
}

export type ExpenseCategory = 
  | 'Power & Generator Fuel'
  | 'Cooking Gas (LPG)'
  | 'Kitchen Petty & Sundry'
  | 'Equipment Repairs & Maintenance'
  | 'Packaging & Consumables'
  | 'Staff Welfare & Casuals'
  | 'Cleaning & Sanitation'
  | 'Utilities & Electricity'
  | 'Administrative & POS Sundry'
  | 'Other Operational Expenses';

export type ExpensePaymentMethod = 'Cash (Petty Cash)' | 'Bank Transfer' | 'POS Machine';

export interface ExpenseRecord {
  id: string; // e.g. EXP-2026-001
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  category: ExpenseCategory;
  title: string;
  amount: number;
  paymentMethod: ExpensePaymentMethod;
  paidTo: string; // Beneficiary
  recordedBy: string; // Cashier / Manager
  receiptRef?: string; // Receipt / Ref No.
  status: 'Approved' | 'Pending Approval' | 'Rejected';
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
  paymentStatus: 'Paid' | 'Pending' | 'Voided';
  kitchenStatus: 'Pending' | 'Preparing' | 'Ready' | 'Served';
  status?: 'Pending' | 'Preparing' | 'Ready' | 'Served';
  transactionRef?: string;
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
  dueDate?: string;
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
  | 'super_admin'
  | 'Super Admin'
  | 'General Manager'
  | 'Supervisor'
  | 'Front Desk Officer'
  | 'Receptionist'
  | 'Restaurant Manager'
  | 'Restaurant Waiter 1'
  | 'Restaurant Waiter 2'
  | 'Kitchen Manager'
  | 'Head Chef'
  | 'Kitchen Waiter 1'
  | 'Kitchen Waiter 2'
  | 'Hotel Manager'
  | 'Cashier' 
  | 'Duty Manager'
  | 'Internal Auditor'
  | 'Accountant'
  | 'Storekeeper'
  | 'Waitstaff';

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
  pin?: string;
  status?: 'Active' | 'On Leave' | 'Suspended';
  shift?: 'Morning (07:00 - 15:00)' | 'Evening (15:00 - 23:00)' | 'Night (23:00 - 07:00)' | 'Flexible';
  isOnDuty?: boolean;
  dateJoined?: string;
}

export interface HotelInfo {
  name: string;
  tagline: string;
  address: string;
  email: string;
  phone: string;
  registrationBox: string;
}


export type TableFloor = 'Ground Floor' | 'First Floor';
export type TableStatus = 'Available' | 'Occupied' | 'Reserved' | 'Cleaning';
export type TableShape = 'round' | 'rectangular' | 'booth';

export interface RestaurantTable {
  id: string;
  tableNumber: string;
  floor: TableFloor;
  seats: number;
  shape: TableShape;
  status: TableStatus;
  currentGuestName?: string;
  guestCount?: number;
  assignedServer?: string;
  activeOrderId?: string;
  orderTotal?: number;
  seatedAt?: string;
  reservationTime?: string;
  notes?: string;
}


export type ReservationStatus = 'Confirmed' | 'Seated' | 'Completed' | 'Cancelled' | 'No-Show';

export interface Reservation {
  id: string;
  customerName: string;
  phoneNumber: string;
  email?: string;
  guestCount: number;
  tableId: string;
  tableNumber: string;
  floor: TableFloor;
  reservationDate: string;
  reservationTime: string;
  durationMinutes?: number;
  status: ReservationStatus;
  specialRequests?: string;
  createdAt: string;
}

export type CustomerTier = 'Bronze' | 'Silver' | 'Gold' | 'Platinum VIP';
export type CustomerSegment = 'VIP / Elite' | 'Regular / Loyal' | 'Corporate Account' | 'New Diner' | 'At-Risk / Inactive';

export interface CustomerProfile {
  id: string; // e.g. "CUST-001"
  name: string;
  phone: string;
  email: string;
  company?: string;
  segment: CustomerSegment;
  tier: CustomerTier;
  loyaltyPoints: number;
  totalSpent: number;
  totalOrders: number;
  lastVisitDate: string; // YYYY-MM-DD or formatted
  averageOrderValue: number;
  favoriteDish?: string;
  preferredSeating?: string;
  dietaryRestrictions?: string[];
  birthday?: string;
  anniversary?: string;
  notes?: string;
  rating?: number; // 1 - 5 stars
  createdAt: string;
  address?: string;
  status: 'Active' | 'Inactive';
}

export interface MarketingCampaign {
  id: string;
  name: string;
  targetSegment: CustomerSegment | 'All';
  channel: 'WhatsApp' | 'SMS' | 'Email';
  title: string;
  messageTemplate: string;
  discountOffer?: string;
  status: 'Active' | 'Scheduled' | 'Draft' | 'Completed';
  reachCount?: number;
  conversionRate?: string;
}

export type AuditCategory = 
  | 'Financial & POS' 
  | 'Exceptions & Voids' 
  | 'Inventory & Procurement' 
  | 'Expenses & Floats' 
  | 'Kitchen & Operations' 
  | 'Security & Access';

export type AuditSeverity = 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AuditRecord {
  id: string; // e.g. "AUD-2026-0045"
  timestamp: string; // e.g. "2026-10-18 11:30:15 AM"
  date: string; // "2026-10-18"
  time: string; // "11:30 AM"
  user: string; // "Prototype Cashier"
  role: string; // "Cashier", "Head Chef", "Restaurant Manager", "Super Admin"
  action: string; // "PAYMENT_RECORDED", "ORDER_VOIDED", etc.
  category: AuditCategory;
  severity: AuditSeverity;
  details: string;
  reference: string; // "ORD-2026-0102", "PO-2026-004", etc.
  terminal: string; // "Terminal POS-01 (Main Hall)"
  ipAddress?: string; // "192.168.1.104"
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
  integrityHash?: string;
}

