import React, { useState, useEffect } from 'react';
import type { Invoice, PaymentRecord, PaymentMethod, PaymentStatus, AuditLog } from '../types';
import { formatNaira, generateReceiptNo, formatDateFormatted, formatTimeFormatted } from '../utils/formatters';
import confetti from 'canvas-confetti';
import { paymentConnector } from '../utils/paymentConnectorAdapter';
import { CreditCard, CheckCircle2, ShieldCheck, DollarSign, Building, Hash, AlertCircle, X, Sparkles, AlertTriangle } from 'lucide-react';

interface PaymentFormModalProps {
  invoices: Invoice[];
  selectedInvoiceId?: string;
  cashierName: string;
  onClose: () => void;
  onPaymentSuccess: (payment: PaymentRecord, updatedInvoice: Invoice, auditLog: AuditLog) => void;
}

export const PaymentFormModal: React.FC<PaymentFormModalProps> = ({
  invoices,
  selectedInvoiceId,
  cashierName,
  onClose,
  onPaymentSuccess
}) => {
  // Filter invoices that still have a balance > 0
  const pendingInvoices = invoices.filter((inv) => inv.balance > 0);

  const [activeInvoiceId, setActiveInvoiceId] = useState<string>(
    selectedInvoiceId || (pendingInvoices.length > 0 ? pendingInvoices[0].id : '')
  );

  const currentInvoice = invoices.find((inv) => inv.id === activeInvoiceId);

  const [receiptNo] = useState<string>(generateReceiptNo(Math.floor(Math.random() * 90) + 10));
  const [amountPaidNow, setAmountPaidNow] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('POS Machine');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [bankName, setBankName] = useState<string>('Zenith Bank');
  const [posTerminalId, setPosTerminalId] = useState<string>('POS-TERM-01');
  const [cashier, setCashier] = useState<string>(cashierName);
  const [authorizedBy, setAuthorizedBy] = useState<string>(cashierName);
  const [remarks, setRemarks] = useState<string>('');
  const [cashVerified, setCashVerified] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [virtualAccount, setVirtualAccount] = useState<{account: string, bank: string} | null>(null);
  const [isWaitingForPayment, setIsWaitingForPayment] = useState<boolean>(false);

  // Update defaults when currentInvoice changes
  useEffect(() => {
    if (currentInvoice) {
      setAmountPaidNow(currentInvoice.balance);
      // Auto-generate sample transaction refs to assist receptionist
      if (paymentMethod === 'POS Machine') {
        setTransactionRef(`TRX${Math.floor(10000000 + Math.random() * 90000000)}`);
      } else if (paymentMethod === 'Bank Transfer') {
        setTransactionRef(`FT${Math.floor(10000000000 + Math.random() * 90000000000)}`);
      } else {
        setTransactionRef('');
      }
    }
  }, [currentInvoice, paymentMethod]);

  const newBalance = currentInvoice ? Math.max(0, currentInvoice.balance - amountPaidNow) : 0;

  const handlePaymentMethodChange = async (method: PaymentMethod) => {
    setPaymentMethod(method);
    setVirtualAccount(null);
    setIsWaitingForPayment(false);

    if ((method === 'Moniepoint' || method === 'Opay') && currentInvoice) {
      setIsWaitingForPayment(true);
      // Generate dynamic account via our adapter
      try {
        const response = await paymentConnector.createPayment({
          invoiceId: currentInvoice.id,
          guestName: currentInvoice.guestName,
          guestEmail: 'guest@example.com',
          guestPhone: currentInvoice.guestPhone,
          amount: amountPaidNow,
          paymentMethod: method,
          description: `Hotel Bill for ${currentInvoice.guestName}`
        });
        if (response.gatewayResponse?.virtualAccount) {
          setVirtualAccount({
            accountNumber: response.gatewayResponse.virtualAccount,
            bankName: response.gatewayResponse.bank,
            amount: amountPaidNow,
            expiresIn: 30
          });
          setTransactionRef(response.reference);
        }
        // Simulate waiting for transfer
        setTimeout(() => setIsWaitingForPayment(false), 4000);
      } catch (e) {
        setErrorMsg('Failed to generate virtual account.');
        setIsWaitingForPayment(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentInvoice) {
      setErrorMsg('Please select a valid invoice.');
      return;
    }

    if (amountPaidNow <= 0) {
      setErrorMsg('Amount paid must be greater than ₦0.');
      return;
    }

    if (amountPaidNow > currentInvoice.balance) {
      setErrorMsg(`Amount paid cannot exceed current outstanding balance of ${formatNaira(currentInvoice.balance)}.`);
      return;
    }

    if (paymentMethod === 'Cash' && !cashVerified) {
      setErrorMsg('Please tick the checkbox to verify physical cash has been counted and acknowledged.');
      return;
    }

    let finalTransactionRef = '';

    setIsWaitingForPayment(true);
    try {
      const createRes = await paymentConnector.createPayment({
        invoiceId: currentInvoice.id,
        guestName: currentInvoice.guestName,
        guestEmail: 'guest@example.com',
        guestPhone: currentInvoice.guestPhone,
        amount: amountPaidNow,
        paymentMethod: paymentMethod,
        description: `${paymentMethod} Payment for ${currentInvoice.guestName}`,
        gateway: paymentMethod === 'Cash' ? 'Direct_Cash' : undefined
      });

      if (paymentMethod === 'Cash') {
        finalTransactionRef = createRes.reference;
      } else {
        const verifyRes = await paymentConnector.verifyPayment(createRes.reference);
        if (!verifyRes.success || verifyRes.status !== 'Paid') {
          setErrorMsg(`Payment Verification Failed. The ${paymentMethod} transaction could not be verified.`);
          setIsWaitingForPayment(false);
          return;
        }
        finalTransactionRef = verifyRes.reference;
      }
    } catch (err) {
      setErrorMsg(`Payment Verification Failed due to a network error. Please try again.`);
      setIsWaitingForPayment(false);
      return;
    }
    setIsWaitingForPayment(false);

    const todayDate = new Date().toISOString().split('T')[0];
    const todayTime = formatTimeFormatted();

    let newStatus: PaymentStatus = 'Paid';
    if (newBalance > 0 && amountPaidNow > 0) {
      newStatus = 'Partially Paid';
    }

    const newPaymentRecord: PaymentRecord = {
      id: `PY-${Date.now().toString().slice(-5)}`,
      receiptNo: receiptNo,
      invoiceNo: currentInvoice.id,
      reservationId: currentInvoice.reservationId,
      guestId: currentInvoice.guestId,
      guestName: currentInvoice.guestName,
      guestPhone: currentInvoice.guestPhone,
      roomNumber: currentInvoice.roomNumber,
      roomType: currentInvoice.roomCategory,
      checkInDate: currentInvoice.checkInDate,
      checkOutDate: currentInvoice.checkOutDate,
      nights: currentInvoice.nights,
      roomCharge: currentInvoice.totalRoomCharge,
      additionalServicesTotal: currentInvoice.additionalServices.reduce((sum, s) => sum + s.amount, 0),
      tax: currentInvoice.tax,
      discount: currentInvoice.discount,
      amountDue: currentInvoice.grandTotal,
      amountPaid: amountPaidNow,
      balance: newBalance,
      paymentDate: todayDate,
      paymentTime: todayTime,
      paymentMethod: paymentMethod,
      transactionReference: finalTransactionRef,
      bankName: paymentMethod === 'Bank Transfer' ? bankName : undefined,
      posTerminalId: paymentMethod === 'POS Machine' ? posTerminalId : undefined,
      receivedBy: cashier || 'Receptionist',
      paymentStatus: newStatus,
      remarks: remarks || `Confirmed ${paymentMethod} payment verified securely via payment connector.`,
      authorizedBy: authorizedBy || cashier || 'Cashier',
      createdAt: new Date().toISOString(),
      reprintCount: 0
    };

    const updatedInvoice: Invoice = {
      ...currentInvoice,
      amountPaid: currentInvoice.amountPaid + amountPaidNow,
      balance: newBalance,
      status: newBalance === 0 ? 'Fully Paid' : 'Partially Paid'
    };

    const newAuditLog: AuditLog = {
      id: `LOG-${Date.now().toString().slice(-5)}`,
      timestamp: `${formatDateFormatted(todayDate)} ${todayTime}`,
      user: cashier,
      role: 'Cashier',
      action: 'PAYMENT_RECORDED',
      details: `Acknowledged ${paymentMethod} payment of ${formatNaira(amountPaidNow)} for Guest ${currentInvoice.guestName} (${currentInvoice.roomNumber}). Ref: ${transactionRef || receiptNo}. New Balance: ${formatNaira(newBalance)}`,
      reference: receiptNo
    };

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (e) {
      // safe fallback
    }

    onPaymentSuccess(newPaymentRecord, updatedInvoice, newAuditLog);
  };

  const NigerianBanks = [
    'First Bank Nigeria',
    'GTBank (Guaranty Trust)',
    'Access Bank',
    'Zenith Bank',
    'United Bank for Africa (UBA)',
    'Fidelity Bank',
    'Moniepoint MFB',
    'OPay / Palmpay',
    'Kuda Microfinance Bank',
    'Stanbic IBTC',
    'Sterling Bank',
    'Union Bank'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-[#1A1A1A]/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-[#FDFCF9] rounded-none shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-[#E5E2DA]">
        
        {/* Header */}
        <div className="bg-[#1A1A1A] text-[#FDFCF9] p-5 flex items-center justify-between border-b border-[#E5E2DA]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-[#C8B282] flex items-center justify-center text-[#FDFCF9] font-serif italic text-lg bg-[#2A2A2A]">
              <CreditCard className="w-5 h-5 text-[#C8B282]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-serif text-[#FDFCF9]">Payment Acknowledgment Form</h2>
              <p className="text-[10px] text-[#A3A09A] font-light">
                Confirm external payment received via Cash, POS, or Bank Transfer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#A3A09A] hover:text-[#FDFCF9] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5 text-[#1A1A1A] bg-[#FDFCF9]">
          
          {errorMsg && (
            <div className="bg-[#FAF0F0] border border-[#E8C8C8] p-3.5 flex items-start gap-2 text-[#8B2626] text-xs font-semibold">
              <AlertCircle className="w-4 h-4 text-[#8B2626] shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Invoice Selection & Auto Receipt Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white p-4 border border-[#E5E2DA] shadow-xs">
            <div>
              <label className="block text-[10px] font-bold text-[#A3A09A] uppercase tracking-[0.15em] mb-1">
                Select Invoice / Guest Bill *
              </label>
              <select
                value={activeInvoiceId}
                onChange={(e) => setActiveInvoiceId(e.target.value)}
                className="w-full bg-[#FDFCF9] border border-[#E5E2DA] rounded-none px-3 py-2 text-xs sm:text-sm font-semibold text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
              >
                {invoices.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.id} — {inv.guestName} (Room {inv.roomNumber}) — Bal: {formatNaira(inv.balance)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#A3A09A] uppercase tracking-[0.15em] mb-1">
                Receipt Number (Auto Generated)
              </label>
              <input
                type="text"
                value={receiptNo}
                readOnly
                className="w-full bg-[#F5F2ED] border border-[#E5E2DA] rounded-none px-3 py-2 text-xs sm:text-sm font-mono font-bold text-[#1A1A1A]"
              />
            </div>
          </div>

          {currentInvoice ? (
            <>
              {/* Bill Details Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-white p-3 border border-[#E5E2DA]">
                  <span className="text-[#8C8984] block text-[9px] uppercase tracking-wider font-bold">Guest & Room</span>
                  <p className="font-bold text-[#1A1A1A] truncate">{currentInvoice.guestName}</p>
                  <p className="text-[#243B6B] font-semibold text-[11px]">Room {currentInvoice.roomNumber}</p>
                </div>

                <div className="bg-white p-3 border border-[#E5E2DA]">
                  <span className="text-[#8C8984] block text-[9px] uppercase tracking-wider font-bold">Grand Total Bill</span>
                  <p className="font-serif font-bold text-[#1A1A1A]">{formatNaira(currentInvoice.grandTotal)}</p>
                  <p className="text-[#8C8984] text-[10px]">{currentInvoice.nights} Nights Stay</p>
                </div>

                <div className="bg-white p-3 border border-[#E5E2DA]">
                  <span className="text-[#8C8984] block text-[9px] uppercase tracking-wider font-bold">Previously Paid</span>
                  <p className="font-serif font-bold text-[#2D5A44]">{formatNaira(currentInvoice.amountPaid)}</p>
                  <p className="text-[#8C8984] text-[10px]">Status: {currentInvoice.status}</p>
                </div>

                <div className="bg-[#FAF6F2] p-3 border border-[#EAD3C6]">
                  <span className="text-[#8C4A27] block text-[9px] uppercase tracking-wider font-bold">Current Due</span>
                  <p className="font-serif font-bold text-[#8C4A27] text-sm">{formatNaira(currentInvoice.balance)}</p>
                  <p className="text-[#8C4A27] text-[10px]">Outstanding</p>
                </div>
              </div>

              {/* Payment Method Selector Buttons */}
              <div>
                <label className="block text-[10px] font-bold text-[#A3A09A] uppercase tracking-[0.15em] mb-2">
                  Select Payment Method (Received Outside System) *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(['POS Machine', 'Bank Transfer', 'Cash', 'Moniepoint', 'Opay'] as PaymentMethod[]).map((method) => {
                    const isSelected = paymentMethod === method;
                    return (
                      <button
                        type="button"
                        key={method}
                        onClick={() => handlePaymentMethodChange(method)}
                        className={`p-3.5 border text-xs font-bold uppercase tracking-wider flex flex-col items-center gap-2 transition-all ${
                          isSelected
                            ? 'bg-[#1A1A1A] text-[#FDFCF9] border-[#1A1A1A]'
                            : 'bg-white text-[#73706B] border-[#E5E2DA] hover:bg-[#F5F2ED] hover:text-[#1A1A1A]'
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                        <span>{method}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Dynamic Inputs based on Payment Method */}
              {paymentMethod === 'POS Machine' && (
                <div className="bg-white border border-[#E5E2DA] p-4 space-y-3">
                  <div className="flex items-center gap-2 text-[#1A1A1A] font-bold text-xs uppercase tracking-wider">
                    <Sparkles className="w-4 h-4 text-[#C8B282]" />
                    <span>POS Terminal Payment Verification</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-[#A3A09A] uppercase tracking-[0.15em] mb-1">
                        POS Reference / Approval Code *
                      </label>
                      <input
                        type="text"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        placeholder="e.g. TRX98263418"
                        className="w-full bg-[#FDFCF9] border border-[#E5E2DA] rounded-none px-3 py-2 text-xs font-mono font-bold text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
                      />
                      <span className="text-[10px] text-[#8C8984]">Must match POS customer receipt slip</span>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-[#A3A09A] uppercase tracking-[0.15em] mb-1">
                        POS Terminal ID (Optional)
                      </label>
                      <input
                        type="text"
                        value={posTerminalId}
                        onChange={(e) => setPosTerminalId(e.target.value)}
                        placeholder="e.g. POS-TERM-01"
                        className="w-full bg-[#FDFCF9] border border-[#E5E2DA] rounded-none px-3 py-2 text-xs font-medium focus:border-[#1A1A1A] focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'Bank Transfer' && (
                <div className="bg-white border border-[#E5E2DA] p-4 space-y-4">
                  <div className="bg-[#FAF6F2] border border-[#EAD3C6] p-4 text-center font-sans">
                    <span className="block text-[#8C4A27] font-bold text-xs uppercase tracking-wider mb-2">BANK TRANSFER SELECTED</span>
                    <p className="text-[10px] text-[#A3A09A] font-bold mb-1 uppercase tracking-widest">OFFICIAL ACCOUNT</p>
                    <p className="text-lg font-mono font-bold text-[#1A1A1A] tracking-wider mb-1">1968121044</p>
                    <p className="text-xs text-[#1A1A1A] font-bold">Zenith Bank — Official Account</p>
                    <p className="text-xs text-[#73706B] mt-3">The system will automatically verify the transfer once completed.</p>
                  </div>
                </div>
              )}

              {paymentMethod === 'Cash' && (
                <div className="bg-[#FAF6F2] border border-[#EAD3C6] p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[#8C4A27] font-bold text-xs uppercase tracking-wider">
                    <AlertTriangle className="w-4 h-4 text-[#8C4A27]" />
                    <span>Physical Cash Handover Checklist</span>
                  </div>
                  <label className="flex items-start gap-2 cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={cashVerified}
                      onChange={(e) => setCashVerified(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-[#1A1A1A] accent-[#1A1A1A]"
                    />
                    <span className="text-xs text-[#1A1A1A] font-medium">
                      I confirm that physical cash currency of <strong className="text-[#1A1A1A] font-serif font-bold">{formatNaira(amountPaidNow)}</strong> has been physically received, counted, and placed into the reception safe drawer.
                    </span>
                  </label>
                </div>
              )}

              {(paymentMethod === 'Moniepoint' || paymentMethod === 'Opay') && isWaitingForPayment && (
                <div className="bg-[#F0F7F3] border border-[#C4E2D2] p-5 space-y-4 text-center">
                  <div className="flex justify-center mb-2">
                    <ShieldCheck className="w-8 h-8 text-[#2D5A44] animate-pulse" />
                  </div>
                  <h3 className="font-bold text-[#2D5A44] text-sm uppercase tracking-wider">
                    Awaiting {paymentMethod} Transfer
                  </h3>
                  
                  {virtualAccount ? (
                    <div className="bg-white p-4 border border-[#C4E2D2] inline-block text-left">
                      <p className="text-[10px] font-bold text-[#A3A09A] uppercase tracking-wider mb-1">Transfer Exactly</p>
                      <p className="font-serif font-bold text-xl text-[#1A1A1A] mb-3">{formatNaira(amountPaidNow)}</p>
                      
                      <p className="text-[10px] font-bold text-[#A3A09A] uppercase tracking-wider mb-1">Account Number</p>
                      <p className="font-mono font-bold text-2xl tracking-widest text-[#2D5A44] mb-3">{virtualAccount.account}</p>
                      
                      <p className="text-[10px] font-bold text-[#A3A09A] uppercase tracking-wider mb-1">Bank Name</p>
                      <p className="font-bold text-[#1A1A1A]">{virtualAccount.bank}</p>
                    </div>
                  ) : (
                    <p className="text-[#2D5A44] text-xs">Generating virtual account...</p>
                  )}
                  
                  <p className="text-xs text-[#8C8984] animate-pulse">
                    The system will automatically issue the receipt once the customer makes the transfer. Do not close this window.
                  </p>
                  
                  {/* Development Only Mock Webhook Trigger */}
                  <div className="pt-4 border-t border-[#C4E2D2] mt-4">
                    <button 
                      type="button" 
                      onClick={(e) => handleSubmit(e)}
                      className="text-[10px] bg-[#E8F0EC] text-[#2D5A44] px-3 py-1.5 font-bold uppercase tracking-wider border border-[#C4E2D2] hover:bg-[#2D5A44] hover:text-white transition-colors"
                    >
                      [DEV] Simulate Incoming Webhook Success
                    </button>
                  </div>
                </div>
              )}

              {/* Amount Paid Now & New Balance Calculator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-[#F0F7F3] p-4 border border-[#C4E2D2]">
                <div>
                  <label className="block text-[10px] font-bold text-[#2D5A44] uppercase tracking-[0.15em] mb-1">
                    Amount Paid Now (₦) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-[#2D5A44] font-bold">₦</span>
                    <input
                      type="number"
                      value={amountPaidNow}
                      onChange={(e) => setAmountPaidNow(Number(e.target.value))}
                      min={0}
                      max={currentInvoice.balance}
                      className="w-full bg-white border border-[#C4E2D2] rounded-none pl-8 pr-3 py-2 text-base font-serif font-bold text-[#2D5A44] focus:outline-none"
                    />
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setAmountPaidNow(currentInvoice.balance)}
                      className="text-[9px] bg-[#2D5A44] text-[#FDFCF9] px-2.5 py-1 uppercase tracking-wider font-bold"
                    >
                      Full Payment ({formatNaira(currentInvoice.balance)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmountPaidNow(Math.round(currentInvoice.balance / 2))}
                      className="text-[9px] bg-[#E8F0EC] text-[#2D5A44] px-2.5 py-1 uppercase tracking-wider font-bold border border-[#C4E2D2]"
                    >
                      50% Deposit ({formatNaira(Math.round(currentInvoice.balance / 2))})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#1A1A1A] uppercase tracking-[0.15em] mb-1">
                    New Outstanding Balance
                  </label>
                  <div className={`p-3 border font-serif font-bold text-base ${
                    newBalance === 0 ? 'bg-white text-[#2D5A44] border-[#C4E2D2]' : 'bg-[#FAF0F0] text-[#8B2626] border-[#E8C8C8]'
                  }`}>
                    {formatNaira(newBalance)}
                    <span className="text-xs font-sans font-normal ml-2 block sm:inline">
                      ({newBalance === 0 ? 'Cleared Fully Paid' : 'Partial Balance Remains'})
                    </span>
                  </div>
                </div>
              </div>

              {/* Cashier & Remarks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#A3A09A] uppercase tracking-[0.15em] mb-1">
                    Cashier Name (Received By) *
                  </label>
                  <input
                    type="text"
                    value={cashier}
                    onChange={(e) => setCashier(e.target.value)}
                    required
                    className="w-full bg-[#FDFCF9] border border-[#E5E2DA] rounded-none px-3 py-2 text-xs font-semibold focus:border-[#1A1A1A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-[#A3A09A] uppercase tracking-[0.15em] mb-1">
                    Authorized By *
                  </label>
                  <input
                    type="text"
                    value={authorizedBy}
                    onChange={(e) => setAuthorizedBy(e.target.value)}
                    required
                    className="w-full bg-[#FDFCF9] border border-[#E5E2DA] rounded-none px-3 py-2 text-xs font-semibold focus:border-[#1A1A1A] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-[#A3A09A] uppercase tracking-[0.15em] mb-1">
                  Payment Verification Remarks / Notes
                </label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="e.g. Verified via POS terminal slip #0192 or Bank SMS alert from First Bank"
                  rows={2}
                  className="w-full bg-[#FDFCF9] border border-[#E5E2DA] rounded-none p-2 text-xs text-[#1A1A1A] focus:border-[#1A1A1A] focus:outline-none"
                />
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-[#8C8984] text-xs">
              No unpaid invoices found in the system.
            </div>
          )}

          {/* Form Actions */}
          <div className="pt-3 border-t border-[#E5E2DA] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 font-bold uppercase tracking-[0.18em] text-[10px] text-[#73706B] hover:text-[#1A1A1A] transition-colors"
            >
              Cancel
            </button>
            
            {currentInvoice && (
              <button
                type="submit"
                disabled={isWaitingForPayment}
                className={`px-6 py-2.5 text-xs font-bold uppercase tracking-[0.18em] flex items-center gap-2 transition-all ${
                  isWaitingForPayment
                    ? 'bg-[#E5E2DA] text-[#A3A09A] cursor-not-allowed'
                    : 'bg-[#2D5A44] hover:bg-[#234836] text-[#FDFCF9]'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isWaitingForPayment
                    ? 'Processing...'
                    : 'Record Payment & Issue Receipt'
                  }
                </span>
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
};
