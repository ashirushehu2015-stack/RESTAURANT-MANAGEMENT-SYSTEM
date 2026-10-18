import type { SystemSettings } from '../types';

export const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  profile: {
    name: 'RESTAURANT MANAGEMENT SYSTEM',
    tagline: 'Standalone Dining & Lounge Business • Table ordering, POS billing, receipt generation, and menu catalog management',
    phone: '+234 803 210 4455 / 0802 987 6543',
    email: 'info@restaurant-management.ng',
    website: 'https://restaurant-management.ng',
    address: 'Plot 414 Commercial Avenue, Maitama District, Abuja, FCT',
    rcNumber: 'RC-1849204',
    tinNumber: 'TIN-28491049-0001',
    vatRegNumber: 'VAT-FCT-094182',
    currency: '₦',
    defaultVatRate: 5,
    deliveryLogisticsFee: 500,
    serviceChargePercentage: 0
  },
  receipt: {
    printerType: '80mm',
    headerText: 'THANK YOU FOR DINING WITH US!\nPLEASE KEEP THIS OFFICIAL BILL',
    footerText: 'Fresh Quality Nigerian & Continental Cuisine\nFor Event Reservations Call: 0803 210 4455',
    showWifiPassword: true,
    wifiPassword: 'DineVIPGuest2026',
    showDuplicateWatermark: true,
    printCustomerCopyOnPayment: true,
    printKitchenTicketOnOrder: true,
    showVatBreakdown: true,
    showCashierName: true
  },
  pos: {
    defaultDiningType: 'Dine-In',
    autoReleaseTableOnPaid: true,
    requireManagerPinForVoid: true,
    requireManagerPinForDiscount: true,
    allowCustomNotesOnItems: true,
    enableStockDeductionOnSale: true,
    managerPin: '1234'
  },
  payment: {
    enabledMethods: ['Cash', 'POS Machine', 'Bank Transfer', 'Opay', 'Moniepoint'],
    requireBankTransferReference: true,
    bankAccounts: [
      {
        id: 'BANK-01',
        bankName: 'Zenith Bank Plc',
        accountName: 'Restaurant Management Operations Account',
        accountNumber: '1018492014',
        isPrimary: true,
        isActive: true
      },
      {
        id: 'BANK-02',
        bankName: 'Access Bank Plc',
        accountName: 'Restaurant Main Operating Account',
        accountNumber: '0049281903',
        isPrimary: false,
        isActive: true
      },
      {
        id: 'BANK-03',
        bankName: 'Moniepoint Microfinance Bank',
        accountName: 'Restaurant Daily Settlement Pos',
        accountNumber: '6019284192',
        isPrimary: false,
        isActive: true
      }
    ]
  },
  kds: {
    targetPrepTimeMinutes: 15,
    warningPrepTimeMinutes: 20,
    criticalPrepTimeMinutes: 25,
    playAudioChimeOnNewOrder: true,
    autoBumpServedOrdersAfterMinutes: 60
  },
  lastUpdated: '2026-10-18 11:45 AM'
};
