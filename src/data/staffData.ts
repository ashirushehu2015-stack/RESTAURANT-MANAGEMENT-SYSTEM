import type { UserProfile, UserRole } from '../types';

export interface PermissionDefinition {
  id: string;
  category: 'POS & Billing' | 'Kitchen & Menu' | 'Tables & Reservations' | 'Inventory & Stock' | 'Finance & Expenses' | 'Administration';
  name: string;
  description: string;
}

export const AVAILABLE_PERMISSIONS: PermissionDefinition[] = [
  // POS & Billing
  { id: 'pos_ring_orders', category: 'POS & Billing', name: 'Ring & Submit Orders', description: 'Can add items to cart and place new restaurant orders.' },
  { id: 'pos_accept_payments', category: 'POS & Billing', name: 'Process Payments', description: 'Can complete cash, card POS, and bank transfer checkouts.' },
  { id: 'pos_void_orders', category: 'POS & Billing', name: 'Void / Cancel Orders', description: 'Can cancel active orders or void items after transmission.' },
  { id: 'pos_discounts', category: 'POS & Billing', name: 'Apply Discounts & Comps', description: 'Can authorize custom discounts or VIP complimentary tickets.' },
  { id: 'pos_drawer_balance', category: 'POS & Billing', name: 'Cash Drawer Balancing', description: 'Can perform end-of-shift cash till counts and reconciliations.' },

  // Kitchen & Menu
  { id: 'kds_manage_queue', category: 'Kitchen & Menu', name: 'Manage KDS Queue', description: 'Can advance orders from Pending to Preparing and Ready in KDS.' },
  { id: 'menu_edit_pricing', category: 'Kitchen & Menu', name: 'Edit Menu & Pricing', description: 'Can add, edit, or adjust prices and descriptions in menu catalog.' },
  { id: 'menu_toggle_availability', category: 'Kitchen & Menu', name: 'Toggle Dish Availability', description: 'Can mark dishes as sold out or available.' },

  // Tables & Reservations
  { id: 'tables_manage_floor', category: 'Tables & Reservations', name: 'Manage Table Seating', description: 'Can seat walk-in guests, assign servers, and clear tables.' },
  { id: 'reservations_manage', category: 'Tables & Reservations', name: 'Create & Cancel Bookings', description: 'Can book tables in advance, seat reserved guests, or cancel.' },

  // Inventory & Stock
  { id: 'inventory_view', category: 'Inventory & Stock', name: 'View Stock Quantities', description: 'Can view raw ingredients, beverage stock, and alerts.' },
  { id: 'inventory_adjust', category: 'Inventory & Stock', name: 'Stock Adjustments & Restock', description: 'Can record restocks, wastage, and inventory audits.' },
  { id: 'suppliers_manage', category: 'Inventory & Stock', name: 'Suppliers & Purchase Orders', description: 'Can generate purchase orders and record supplier delivery.' },

  // Finance & Expenses
  { id: 'expenses_record', category: 'Finance & Expenses', name: 'Record Petty Cash & Expenses', description: 'Can record operational expenses and diesel purchases.' },
  { id: 'expenses_approve', category: 'Finance & Expenses', name: 'Authorize & Approve Expenses', description: 'Can sign off on pending payment vouchers.' },
  { id: 'financials_view_pnl', category: 'Finance & Expenses', name: 'View Financials & P&L', description: 'Full access to management income statement and net profit.' },

  // Administration
  { id: 'staff_manage', category: 'Administration', name: 'Manage Staff & Roles', description: 'Can add staff, change user roles, and reset PINs.' },
  { id: 'audit_view_logs', category: 'Administration', name: 'Access Audit Trail', description: 'Can view immutable chronological security and activity logs.' }
];

export interface RoleDetail {
  role: UserRole;
  displayName: string;
  department: string;
  badgeColor: string;
  badgeBg: string;
  summary: string;
  defaultPermissions: string[];
}

export const ROLE_DETAILS: RoleDetail[] = [
  {
    role: 'super_admin',
    displayName: 'Super Admin / General Manager',
    department: 'Executive Management',
    badgeColor: 'text-[#C8B282]',
    badgeBg: 'bg-[#1A1A1A]',
    summary: 'Complete unrestricted authority across financials, inventory, staff, POS, and settings.',
    defaultPermissions: AVAILABLE_PERMISSIONS.map(p => p.id)
  },
  {
    role: 'Restaurant Manager',
    displayName: 'Restaurant Manager',
    department: 'Food & Beverage Operations',
    badgeColor: 'text-amber-800',
    badgeBg: 'bg-amber-100',
    summary: 'Supervises dining floor, menu updates, void overrides, and staff shift allocations.',
    defaultPermissions: [
      'pos_ring_orders', 'pos_accept_payments', 'pos_void_orders', 'pos_discounts', 'pos_drawer_balance',
      'kds_manage_queue', 'menu_edit_pricing', 'menu_toggle_availability',
      'tables_manage_floor', 'reservations_manage',
      'inventory_view', 'suppliers_manage',
      'expenses_record', 'expenses_approve', 'financials_view_pnl',
      'staff_manage', 'audit_view_logs'
    ]
  },
  {
    role: 'Cashier',
    displayName: 'Head Cashier / Cashier',
    department: 'Front Till & Billing',
    badgeColor: 'text-emerald-800',
    badgeBg: 'bg-emerald-100',
    summary: 'Rings up bills, processes customer cash/card/transfer payments, and balances cash register till.',
    defaultPermissions: [
      'pos_ring_orders', 'pos_accept_payments', 'pos_drawer_balance',
      'menu_toggle_availability', 'tables_manage_floor', 'reservations_manage',
      'expenses_record'
    ]
  },
  {
    role: 'Head Chef',
    displayName: 'Head Chef / Kitchen Manager',
    department: 'Culinary & Production',
    badgeColor: 'text-rose-800',
    badgeBg: 'bg-rose-100',
    summary: 'Manages KDS order queues, recipe prep stages, dish availability, and ingredient requisitions.',
    defaultPermissions: [
      'kds_manage_queue', 'menu_toggle_availability',
      'inventory_view', 'inventory_adjust', 'suppliers_manage',
      'expenses_record'
    ]
  },
  {
    role: 'Waitstaff',
    displayName: 'Waitstaff / Server',
    department: 'Floor Dining Service',
    badgeColor: 'text-blue-800',
    badgeBg: 'bg-blue-100',
    summary: 'Captures guest food orders at tables, handles floor seating, and tracks order fulfillment.',
    defaultPermissions: [
      'pos_ring_orders', 'tables_manage_floor', 'reservations_manage'
    ]
  },
  {
    role: 'Internal Auditor',
    displayName: 'Internal Auditor',
    department: 'Internal Control & Audit',
    badgeColor: 'text-purple-800',
    badgeBg: 'bg-purple-100',
    summary: 'Inspects financial statements, reviews voided tickets, verifies channel balancing, and approves disbursements.',
    defaultPermissions: [
      'pos_drawer_balance', 'inventory_view', 'suppliers_manage',
      'expenses_record', 'expenses_approve', 'financials_view_pnl',
      'audit_view_logs'
    ]
  },
  {
    role: 'Storekeeper',
    displayName: 'Storekeeper / Inventory Officer',
    department: 'Stores & Logistics',
    badgeColor: 'text-teal-800',
    badgeBg: 'bg-teal-100',
    summary: 'Receives raw commodity deliveries, records stock counts, and flags inventory reorder levels.',
    defaultPermissions: [
      'inventory_view', 'inventory_adjust', 'suppliers_manage'
    ]
  }
];

export const INITIAL_STAFF: UserProfile[] = [
  {
    id: 'usr-001',
    staffId: 'STF-2026-001',
    name: 'Alhaji Garba Shehu',
    role: 'super_admin',
    email: 'gm@fulberestaurant.com',
    phoneNumber: '+234 803 111 2233',
    department: 'Executive Management',
    avatarColor: '#1A1A1A',
    description: 'General Manager overseeing operations, fiscal compliance, and enterprise growth.',
    pin: '1111',
    status: 'Active',
    shift: 'Flexible',
    isOnDuty: true,
    dateJoined: '2025-01-10',
    permissions: AVAILABLE_PERMISSIONS.map(p => p.id)
  },
  {
    id: 'usr-002',
    staffId: 'STF-2026-002',
    name: 'Bilkisu Mohammed',
    role: 'Restaurant Manager',
    email: 'bilkisu.m@fulberestaurant.com',
    phoneNumber: '+234 802 222 3344',
    department: 'Food & Beverage Operations',
    avatarColor: '#8C4A27',
    description: 'Restaurant Operations Manager overseeing dining floor service and floor supervisor staff.',
    pin: '2222',
    status: 'Active',
    shift: 'Morning (07:00 - 15:00)',
    isOnDuty: true,
    dateJoined: '2025-03-15',
    permissions: ROLE_DETAILS[1].defaultPermissions
  },
  {
    id: 'usr-003',
    staffId: 'STF-2026-003',
    name: 'Aisha Garba',
    role: 'Cashier',
    email: 'aisha.cashier@fulberestaurant.com',
    phoneNumber: '+234 805 333 4455',
    department: 'Front Till & Billing',
    avatarColor: '#059669',
    description: 'Senior POS Cashier responsible for guest billing, cash register till, and terminal reconciliations.',
    pin: '3333',
    status: 'Active',
    shift: 'Morning (07:00 - 15:00)',
    isOnDuty: true,
    dateJoined: '2025-04-01',
    permissions: ROLE_DETAILS[2].defaultPermissions
  },
  {
    id: 'usr-004',
    staffId: 'STF-2026-004',
    name: 'Chef Kunle Adebayo',
    role: 'Head Chef',
    email: 'chef.kunle@fulberestaurant.com',
    phoneNumber: '+234 809 444 5566',
    department: 'Culinary & Production',
    avatarColor: '#DC2626',
    description: 'Executive Head Chef leading culinary production, recipe quality, and central kitchen orders.',
    pin: '4444',
    status: 'Active',
    shift: 'Morning (07:00 - 15:00)',
    isOnDuty: true,
    dateJoined: '2025-02-20',
    permissions: ROLE_DETAILS[3].defaultPermissions
  },
  {
    id: 'usr-005',
    staffId: 'STF-2026-005',
    name: 'Ibrahim Danladi',
    role: 'Waitstaff',
    email: 'ibrahim.d@fulberestaurant.com',
    phoneNumber: '+234 807 555 6677',
    department: 'Floor Dining Service',
    avatarColor: '#2563EB',
    description: 'Lead Dining Hall Server handling Ground Floor tables G-01 to G-06.',
    pin: '5555',
    status: 'Active',
    shift: 'Morning (07:00 - 15:00)',
    isOnDuty: true,
    dateJoined: '2025-06-12',
    permissions: ROLE_DETAILS[4].defaultPermissions
  },
  {
    id: 'usr-006',
    staffId: 'STF-2026-006',
    name: 'Fatima Bello',
    role: 'Waitstaff',
    email: 'fatima.b@fulberestaurant.com',
    phoneNumber: '+234 808 666 7788',
    department: 'Floor Dining Service',
    avatarColor: '#7C3AED',
    description: 'First Floor Lounge Server managing tables F-01 to F-03 and VIP service.',
    pin: '6666',
    status: 'Active',
    shift: 'Evening (15:00 - 23:00)',
    isOnDuty: false,
    dateJoined: '2025-07-01',
    permissions: ROLE_DETAILS[4].defaultPermissions
  },
  {
    id: 'usr-007',
    staffId: 'STF-2026-007',
    name: 'Umar Farouq Sanusi',
    role: 'Internal Auditor',
    email: 'auditor.sanusi@fulberestaurant.com',
    phoneNumber: '+234 802 777 8899',
    department: 'Internal Control & Audit',
    avatarColor: '#4F46E5',
    description: 'Internal Control Officer conducting void checks, cash balancing, and supplier payables audit.',
    pin: '7777',
    status: 'Active',
    shift: 'Morning (07:00 - 15:00)',
    isOnDuty: true,
    dateJoined: '2025-05-18',
    permissions: ROLE_DETAILS[5].defaultPermissions
  },
  {
    id: 'usr-008',
    staffId: 'STF-2026-008',
    name: 'Chidi Nnamdi',
    role: 'Storekeeper',
    email: 'chidi.store@fulberestaurant.com',
    phoneNumber: '+234 803 888 9900',
    department: 'Stores & Logistics',
    avatarColor: '#0D9488',
    description: 'Inventory and storekeeper managing incoming commodities and store requisitions.',
    pin: '8888',
    status: 'Active',
    shift: 'Morning (07:00 - 15:00)',
    isOnDuty: true,
    dateJoined: '2025-08-01',
    permissions: ROLE_DETAILS[6].defaultPermissions
  }
];
