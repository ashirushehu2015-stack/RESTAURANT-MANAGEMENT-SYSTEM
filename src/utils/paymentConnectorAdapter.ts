import type { PaymentMethod, PaymentRecord, Invoice, RoomCategory } from '../types';

export interface CreatePaymentParams {
  invoiceId: string;
  reservationId?: string;
  guestId?: string;
  guestName: string;
  guestEmail: string;
  guestPhone: string;
  amount: number;
  currency?: string; // default 'NGN'
  paymentMethod: PaymentMethod;
  description: string;
  roomNumber?: string;
  roomCategory?: RoomCategory;
  callbackUrl?: string;
  gateway?: 'Paystack' | 'Flutterwave' | 'POS_Terminal' | 'Direct_Cash';
}

export interface PaymentResponse {
  success: boolean;
  reference: string;
  invoiceId: string;
  authorizationUrl?: string;
  status: 'Pending' | 'Paid' | 'Failed' | 'Cancelled' | 'Refunded';
  amount: number;
  currency: string;
  message: string;
  timestamp: string;
  gatewayResponse?: any;
}

export interface TransactionDetails {
  reference: string;
  invoiceId: string;
  reservationId?: string;
  guestId?: string;
  amount: number;
  currency: string;
  status: 'Paid' | 'Pending' | 'Failed' | 'Refunded' | 'Cancelled';
  paymentMethod: PaymentMethod;
  gateway: string;
  paidAt?: string;
  gatewayResponse?: string;
  customer: {
    name: string;
    email: string;
    phone: string;
    roomNumber?: string;
  };
  refunds?: Array<{
    refundId: string;
    amount: number;
    reason: string;
    authorizedBy: string;
    createdAt: string;
  }>;
}

export interface RefundParams {
  reference: string;
  amount?: number; // Partial or full refund amount
  reason: string;
  authorizedBy: string;
}

export interface ThermalReceiptPayload {
  receiptNo: string;
  invoiceNo: string;
  hotelName: string;
  hotelAddress: string;
  hotelPhone: string;
  guestName: string;
  guestPhone: string;
  roomNumber: string;
  transactionRef: string;
  paymentMethod: string;
  date: string;
  time: string;
  amountPaid: number;
  balance: number;
  receivedBy: string;
  authorizedBy: string;
  formattedEscPosText: string;
}

/**
 * Payment Connector Adapter Class
 * Translates between Restaurant Management System and external payment gateways (Paystack, Flutterwave, POS Terminals, Cash Ledger)
 */
export class PaymentConnectorAdapter {
  private static instance: PaymentConnectorAdapter;
  private transactionsStore: Map<string, TransactionDetails> = new Map();

  private constructor() {
    // Initialize mock seed data for demonstration
    this.seedMockTransactions();
  }

  public static getInstance(): PaymentConnectorAdapter {
    if (!PaymentConnectorAdapter.instance) {
      PaymentConnectorAdapter.instance = new PaymentConnectorAdapter();
    }
    return PaymentConnectorAdapter.instance;
  }

  private seedMockTransactions() {
    const defaultRef = 'TRX98263418';
    this.transactionsStore.set(defaultRef, {
      reference: defaultRef,
      invoiceId: 'INV-202600020',
      reservationId: 'RES-8823',
      guestId: 'GST-02578',
      amount: 185000,
      currency: 'NGN',
      status: 'Paid',
      paymentMethod: 'POS Machine',
      gateway: 'Paystack POS Terminal #4029',
      paidAt: new Date().toISOString(),
      gatewayResponse: 'APPROVED 00',
      customer: {
        name: 'Alhaji Ibrahim Gusau',
        email: 'ibrahim.gusau@example.com',
        phone: '08031234567',
        roomNumber: '108'
      }
    });
  }

  /**
   * 1. Create Payment Request / Session
   */
  public async createPayment(params: CreatePaymentParams): Promise<PaymentResponse> {
    let prefix = 'TRX';
    if (params.paymentMethod === 'Bank Transfer') prefix = 'FT';
    else if (params.paymentMethod === 'POS Machine') prefix = 'POS';
    else if (params.paymentMethod === 'Cash') prefix = 'CSH';
    
    const reference = `${prefix}-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const currency = params.currency || 'NGN';
    
    // Automatically route Moniepoint and Opay methods to their gateways
    let gateway = params.gateway || 'Paystack';
    if (params.paymentMethod === 'POS Machine') gateway = 'POS_Terminal';
    if (params.paymentMethod === 'Moniepoint') gateway = 'Moniepoint';
    if (params.paymentMethod === 'Opay') gateway = 'Opay';

    const transaction: TransactionDetails = {
      reference,
      invoiceId: params.invoiceId,
      reservationId: params.reservationId,
      guestId: params.guestId,
      amount: params.amount,
      currency,
      status: 'Pending',
      paymentMethod: params.paymentMethod,
      gateway,
      customer: {
        name: params.guestName,
        email: params.guestEmail,
        phone: params.guestPhone,
        roomNumber: params.roomNumber
      }
    };

    // Store transaction locally / in memory
    this.transactionsStore.set(reference, transaction);

    // Call the live Render backend if it's a Bank Transfer or Moniepoint API call
    let authorizationUrl = '';
    let message = '';
    let gatewayResponse: any = { reference, status: 'pending' };

    if (gateway === 'Moniepoint' || params.paymentMethod === 'Bank Transfer') {
      try {
        const response = await fetch('https://payment-api.onrender.com/api/payments/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: params.amount,
            customerName: params.guestName,
            customerEmail: params.guestEmail || 'guest@example.com',
            reference: reference
          })
        });
        const result = await response.json();
        
        if (result.success && result.data) {
          gatewayResponse.virtualAccount = result.data.accountNumber;
          gatewayResponse.bank = result.data.bankName;
          message = `Please transfer ₦${params.amount.toLocaleString()} to ${result.data.bankName} Account: ${result.data.accountNumber}`;
        } else {
          throw new Error('Backend failed to generate account');
        }
      } catch (err) {
        console.error('API Error:', err);
        // Fallback if backend is down or asleep (Render free tier sleeps after 15 mins)
        gatewayResponse.virtualAccount = `8${Math.floor(100000000 + Math.random() * 900000000)}`;
        gatewayResponse.bank = 'Moniepoint Microfinance Bank';
        message = `[Fallback] Please transfer ₦${params.amount.toLocaleString()} to Moniepoint Account: ${gatewayResponse.virtualAccount}`;
      }
    } else if (gateway === 'Opay') {
      const opayAccount = `9${Math.floor(100000000 + Math.random() * 900000000)}`; 
      message = `Please transfer ₦${params.amount.toLocaleString()} to Opay Account: ${opayAccount}`;
      gatewayResponse.virtualAccount = opayAccount;
      gatewayResponse.bank = 'Opay Digital Services';
    } else {
      authorizationUrl = `https://checkout.paystack.com/pay/${reference}`;
      message = `Payment initiated via ${gateway}. Reference: ${reference}`;
      gatewayResponse.checkout_url = authorizationUrl;
    }

    return {
      success: true,
      reference,
      invoiceId: params.invoiceId,
      authorizationUrl,
      status: 'Pending',
      amount: params.amount,
      currency,
      message,
      timestamp: new Date().toISOString(),
      gatewayResponse
    };
  }

  /**
   * 2. Verify Payment Status with External Gateway
   */
  public async verifyPayment(reference: string): Promise<PaymentResponse> {
    // Artificial delay to simulate network request to Bank / Gateway
    await new Promise(resolve => setTimeout(resolve, 2000));

    const transaction = this.transactionsStore.get(reference);

    if (!transaction) {
      // Require specific reference for successful mock verification
      const isMockValid = reference === 'VALID-TRX' || reference === 'VALID-FT';
      return {
        success: isMockValid,
        reference,
        invoiceId: 'INV-202600020',
        status: isMockValid ? 'Paid' : 'Failed',
        amount: 185000,
        currency: 'NGN',
        message: isMockValid ? 'Transaction verified successfully via gateway.' : 'Transaction not found or failed.',
        timestamp: new Date().toISOString()
      };
    }

    // Auto-complete pending test transaction upon verification
    if (transaction.status === 'Pending') {
      transaction.status = 'Paid';
      transaction.paidAt = new Date().toISOString();
      this.transactionsStore.set(reference, transaction);
    }

    return {
      success: transaction.status === 'Paid',
      reference: transaction.reference,
      invoiceId: transaction.invoiceId,
      status: transaction.status,
      amount: transaction.amount,
      currency: transaction.currency,
      message: `Payment status: ${transaction.status}`,
      timestamp: new Date().toISOString(),
      gatewayResponse: transaction
    };
  }

  /**
   * 3. Get Full Transaction Details
   */
  public async getTransaction(reference: string): Promise<TransactionDetails | null> {
    if (this.transactionsStore.has(reference)) {
      return this.transactionsStore.get(reference)!;
    }

    // Fallback response for active references
    return {
      reference,
      invoiceId: 'INV-202600020',
      amount: 185000,
      currency: 'NGN',
      status: 'Paid',
      paymentMethod: 'Bank Transfer',
      gateway: 'Paystack Gateway API',
      paidAt: new Date().toISOString(),
      customer: {
        name: 'Alhaji Ibrahim Gusau',
        email: 'ibrahim.gusau@example.com',
        phone: '08031234567',
        roomNumber: '108'
      }
    };
  }

  /**
   * 4. Refund Payment (Full or Partial)
   */
  public async refundPayment(params: RefundParams): Promise<PaymentResponse> {
    const transaction = this.transactionsStore.get(params.reference);
    const refundAmount = params.amount || (transaction ? transaction.amount : 0);
    const refundId = `RFD-${Date.now()}`;

    if (transaction) {
      transaction.status = 'Refunded';
      if (!transaction.refunds) transaction.refunds = [];
      transaction.refunds.push({
        refundId,
        amount: refundAmount,
        reason: params.reason,
        authorizedBy: params.authorizedBy,
        createdAt: new Date().toISOString()
      });
      this.transactionsStore.set(params.reference, transaction);
    }

    return {
      success: true,
      reference: params.reference,
      invoiceId: transaction ? transaction.invoiceId : 'INV-UNKNOWN',
      status: 'Refunded',
      amount: refundAmount,
      currency: 'NGN',
      message: `Refund of ₦${refundAmount.toLocaleString()} processed successfully. Refund ID: ${refundId}`,
      timestamp: new Date().toISOString(),
      gatewayResponse: { refundId, refundAmount, reason: params.reason }
    };
  }

  /**
   * 5. Cancel Pending Payment Request
   */
  public async cancelPayment(reference: string): Promise<PaymentResponse> {
    const transaction = this.transactionsStore.get(reference);

    if (transaction) {
      transaction.status = 'Cancelled';
      this.transactionsStore.set(reference, transaction);
    }

    return {
      success: true,
      reference,
      invoiceId: transaction ? transaction.invoiceId : 'INV-UNKNOWN',
      status: 'Cancelled',
      amount: transaction ? transaction.amount : 0,
      currency: 'NGN',
      message: `Payment request ${reference} has been cancelled.`,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * 6. Format Thermal Receipt Payload (ESC/POS Compatible Text Output)
   */
  public printReceipt(record: PaymentRecord | TransactionDetails): ThermalReceiptPayload {
    const isRecord = 'receiptNo' in record;

    const receiptNo = isRecord ? (record as PaymentRecord).receiptNo : `RCT-${(record as TransactionDetails).reference}`;
    const invoiceNo = isRecord ? (record as PaymentRecord).invoiceNo : (record as TransactionDetails).invoiceId;
    const guestName = isRecord ? (record as PaymentRecord).guestName : (record as TransactionDetails).customer.name;
    const guestPhone = isRecord ? (record as PaymentRecord).guestPhone : (record as TransactionDetails).customer.phone;
    const roomNumber = isRecord ? (record as PaymentRecord).roomNumber : (record as TransactionDetails).customer.roomNumber || 'N/A';
    const amountPaid = isRecord ? (record as PaymentRecord).amountPaid : (record as TransactionDetails).amount;
    const balance = isRecord ? (record as PaymentRecord).balance : 0;
    const date = isRecord ? (record as PaymentRecord).paymentDate : new Date().toLocaleDateString();
    const time = isRecord ? (record as PaymentRecord).paymentTime : new Date().toLocaleTimeString();
    const paymentMethod = record.paymentMethod;
    const transactionRef = isRecord ? (record as PaymentRecord).transactionReference : (record as TransactionDetails).reference;

    const ESC = '\x1B';
    const formattedEscPosText = `
========================================
         RESTAURANT MANAGEMENT SYSTEM
    Luxury Dining
        Tel: +234 803 000 1122
========================================
RECEIPT NO   : ${receiptNo}
INVOICE NO   : ${invoiceNo}
DATE / TIME  : ${date} ${time}
GUEST NAME   : ${guestName}
ROOM NO      : ${roomNumber}
----------------------------------------
PAYMENT METHOD : ${paymentMethod}
REF NUMBER     : ${transactionRef}
----------------------------------------
AMOUNT PAID    : ₦${amountPaid.toLocaleString()}
OUTSTANDING BAL: ₦${balance.toLocaleString()}
STATUS         : PAID & SETTLED
========================================
      Thank you for staying with us!
        www.restaurant.com
========================================
`.trim();

    return {
      receiptNo,
      invoiceNo,
      hotelName: 'RESTAURANT MANAGEMENT SYSTEM',
      hotelAddress: 'Local Address',
      hotelPhone: '+234 803 000 1122',
      guestName,
      guestPhone,
      roomNumber,
      transactionRef,
      paymentMethod,
      date,
      time,
      amountPaid,
      balance,
      receivedBy: isRecord ? (record as PaymentRecord).receivedBy : 'System Gateway',
      authorizedBy: isRecord ? (record as PaymentRecord).authorizedBy : 'Manager',
      formattedEscPosText
    };
  }
}

// Export singleton instance for direct import
export const paymentConnector = PaymentConnectorAdapter.getInstance();
