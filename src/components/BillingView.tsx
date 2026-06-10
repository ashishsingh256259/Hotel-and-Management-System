import React, { useState, useRef } from 'react';
import axios from 'axios';
import { Search, Printer, DollarSign, Eye, X, CheckSquare, Building, Mail, Phone, Calendar, ArrowUpRight, Download } from 'lucide-react';
import { Bill, Customer, Booking } from '../types';

interface BillingViewProps {
  bills: Bill[];
  customers: Customer[];
  bookings: Booking[];
  isAdmin: boolean;
  onPayBill: (id: string) => Promise<void>;
  currentUser?: any;
  onRefresh?: () => void;
}

export default function BillingView({ bills, customers, bookings, isAdmin, onPayBill, currentUser, onRefresh }: BillingViewProps) {
  const [search, setSearch] = useState('');
  const [selectedBill, setSelectedBill] = useState<any | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Loyalty redemption state
  const [redeemPoints, setRedeemPoints] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMessage, setRedeemMessage] = useState({ text: '', type: '' as 'success' | 'error' | '' });

  // Payment Gateway states
  const [checkoutBill, setCheckoutBill] = useState<Bill | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [upiId, setUpiId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [processingStep, setProcessingStep] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [paymentTxId, setPaymentTxId] = useState('');
  const [paymentHistory, setPaymentHistory] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('invoice_payment_transactions');
      return saved ? JSON.parse(saved) : [
        {
          id: 'TXN_' + Math.floor(Math.random() * 1000000000),
          billId: 'b_1',
          invoiceNumber: 'INV-2026-0001',
          amount: 14500,
          method: 'Credit Card (**** 4242)',
          date: new Date(Date.now() - 3600000 * 24).toISOString(),
          status: 'SUCCESS'
        }
      ];
    } catch {
      return [];
    }
  });

  const startPaymentCheckout = (bill: Bill) => {
    setCheckoutBill(bill);
    setCardNumber('');
    setCardName('');
    setCardExpiry('');
    setCardCvv('');
    setUpiId('');
    setPaymentStatus('idle');
    setPaymentError('');
    setProcessingStep('');
  };

  const handleProcessPayment = async (simulateSuccess: boolean) => {
    if (!checkoutBill) return;

    setPaymentStatus('processing');
    setPaymentError('');

    const steps = [
      'Contacting bank gateway servers...',
      'Verifying routing credentials...',
      'Securing payment token authorizations...',
      'Completing transaction registers...'
    ];

    for (let i = 0; i < steps.length; i++) {
      setProcessingStep(steps[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    if (!simulateSuccess) {
      setPaymentStatus('failed');
      setPaymentError('Bank authorization declined. Insufficient credit or incorrect security credentials.');
      return;
    }

    const txId = 'TXN_ROYALE_' + Math.floor(100000 + Math.random() * 900000);
    setPaymentTxId(txId);
    setPaymentStatus('success');

    try {
      await onPayBill(checkoutBill.id);
    } catch (err) {
      console.error("Payment API settle failed:", err);
    }

    const methodDesc = paymentMethod === 'card' 
      ? `Credit Card (**** ${cardNumber.slice(-4) || '4242'})` 
      : `UPI (${upiId || 'cust@upi'})`;

    const newTx = {
      id: txId,
      billId: checkoutBill.id,
      invoiceNumber: checkoutBill.invoiceNumber,
      amount: checkoutBill.grandTotal,
      method: methodDesc,
      date: new Date().toISOString(),
      status: 'SUCCESS'
    };

    setPaymentHistory(prev => {
      const updated = [newTx, ...prev];
      localStorage.setItem('invoice_payment_transactions', JSON.stringify(updated));
      return updated;
    });

    if (onRefresh) onRefresh();
  };

  const triggerAutoInvoiceDownload = (bill: Bill) => {
    const cust = customers.find(c => c.id === bill.customerId);
    const book = bookings.find(b => b.id === bill.bookingId);
    const invoiceContent = `
========================================
     AMBER ROYALE RESORT & SPA
          INVOICE RECEIPT
========================================
Invoice Number: ${bill.invoiceNumber}
Date: ${new Date(bill.invoiceDate).toLocaleDateString()}
Guest Name: ${cust?.name || 'Valued Companion'}
Email: ${cust?.email || 'N/A'}
========================================
Charges Breakdown:
----------------------------------------
Nightly Room Charges: ₹${bill.roomCharges.toFixed(2)}
In-Suite Dining/Food:  ₹${bill.foodCharges.toFixed(2)}
GST / Taxes (18%):     ₹${bill.gstAmount.toFixed(2)}
----------------------------------------
GRAND TOTAL:     ₹${bill.grandTotal.toFixed(2)}
STATUS:          PAID (GATEWAY SIMULATED)
========================================
Thank you for your stay at Amber Royale!
    `;
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Invoice_${bill.invoiceNumber}.txt`;
    link.click();
  };

  const handleOpenInvoice = (bill: Bill) => {
    const cust = customers.find(c => c.id === bill.customerId);
    const book = bookings.find(b => b.id === bill.bookingId);
    setSelectedBill({
      ...bill,
      customer: cust,
      booking: book
    });
  };

  const handlePrint = () => {
    if (!printRef.current || !selectedBill) return;
    try {
      // Create a hidden printer iframe instead of overwriting the document body
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document || iframe.contentDocument;
      if (doc) {
        doc.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Invoice - ${selectedBill.invoiceNumber}</title>
              <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
              <style>
                body {
                  font-family: 'Inter', system-ui, sans-serif;
                  background-color: white;
                  color: #1e293b;
                  padding: 40px;
                  margin: 0;
                }
                .font-mono {
                  font-family: 'JetBrains Mono', monospace;
                }
                .text-amber-700 { color: #b45309; }
                .text-slate-400 { color: #94a3b8; }
                .text-slate-500 { color: #64748b; }
                .text-slate-600 { color: #475569; }
                .text-slate-800 { color: #1e293b; }
                .text-slate-900 { color: #0f172a; }
                .text-slate-950 { color: #020617; }
                .text-rose-500 { color: #f43f5e; }
                .border-b { border-bottom: 1px solid #e2e8f0; }
                .border-dashed { border-style: dashed; }
                .border-slate-200 { border-color: #e2e8f0; }
                .pb-6 { padding-bottom: 24px; }
                .pt-6 { padding-top: 24px; }
                .mt-1 { margin-top: 4px; }
                .mt-2 { margin-top: 8px; }
                .mt-3 { margin-top: 12px; }
                .mb-2 { margin-bottom: 8px; }
                .w-64 { width: 256px; }
                .space-y-2 > * + * { margin-top: 8px; }
                .space-y-1 > * + * { margin-top: 4px; }
                .flex { display: flex; }
                .justify-between { justify-content: space-between; }
                .items-start { align-items: flex-start; }
                .items-center { align-items: center; }
                .grid { display: grid; }
                .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
                .gap-8 { gap: 32px; }
                .font-black { font-weight: 900; }
                .font-extrabold { font-weight: 800; }
                .font-bold { font-weight: 700; }
                .font-semibold { font-weight: 600; }
                .font-medium { font-weight: 500; }
                .uppercase { text-transform: uppercase; }
                .tracking-widest { letter-spacing: 0.1em; }
                .text-xs { font-size: 12px; }
                .text-sm { font-size: 14px; }
                .text-base { font-size: 16px; }
                .text-lg { font-size: 18px; }
                .text-xl { font-size: 20px; }
                .text-2xl { font-size: 24px; }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .w-full { width: 100%; }
                table { border-collapse: collapse; width: 100%; }
                th, td { padding: 12px 16px; }
                thead { background-color: #f8fafc; border-bottom: 2px solid #e2e8f0; }
                tbody tr { border-bottom: 1px solid #f1f5f9; }
                .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
                @media print {
                  body { padding: 20px; }
                  @page { margin: 1cm; }
                }
              </style>
            </head>
            <body>
              ${printRef.current.innerHTML}
            </body>
          </html>
        `);
        doc.close();
      }

      setTimeout(() => {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        document.body.removeChild(iframe);
      }, 350);
    } catch (err) {
      console.error("Standard print operation blocked inside sandbox iframes:", err);
      alert("In-App printing is restricted by browser sandbox security. Please use the 'Download HTML Statement' button instead!");
    }
  };

  const handleDownloadInvoice = () => {
    if (!selectedBill) return;
    try {
      const cust = selectedBill.customer;
      const b = selectedBill;
      const roomValue = b.roomCharges.toFixed(2);
      const foodValue = b.foodCharges.toFixed(2);
      const totalSub = (b.roomCharges + b.foodCharges).toFixed(2);
      const taxValue = b.gstAmount.toFixed(2);
      const absoluteTotal = b.grandTotal.toFixed(2);
      const invoiceDateStr = new Date(b.invoiceDate).toLocaleDateString();

      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Amber Royale - Invoice ${b.invoiceNumber}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background-color: #f8fafc;
      color: #1e293b;
      margin: 0;
      padding: 40px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05);
      border: 1px solid #e2e8f0;
      overflow: hidden;
    }
    .header {
      padding: 40px;
      border-bottom: 2px dashed #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }
    .brand-section h1 {
      margin: 0;
      font-size: 24px;
      font-weight: 900;
      letter-spacing: -0.025em;
      color: #b45309;
    }
    .brand-section p {
      margin: 4px 0 0 0;
      font-size: 12px;
      color: #94a3b8;
    }
    .invoice-title-section {
      text-align: right;
    }
    .invoice-title-section h2 {
      margin: 0;
      font-size: 28px;
      font-weight: 900;
      color: #0f172a;
    }
    .invoice-digits {
      font-family: 'JetBrains Mono', monospace;
      font-size: 14px;
      font-weight: 700;
      color: #475569;
      margin-top: 4px;
    }
    .meta-details {
      grid-template-columns: 1fr 1fr;
      display: grid;
      gap: 32px;
      padding: 40px;
      border-bottom: 1px solid #f1f5f9;
      font-size: 13px;
    }
    .meta-column h3 {
      margin: 0 0 12px 0;
      font-size: 11px;
      font-weight: 850;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #94a3b8;
    }
    .meta-column p {
      margin: 4px 0;
      color: #475569;
    }
    .meta-column strong {
      color: #0f172a;
      font-size: 15px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th {
      background: #f8fafc;
      padding: 12px 16px;
      text-align: left;
      font-weight: 700;
      color: #475569;
      border-bottom: 2px solid #e2e8f0;
      text-transform: uppercase;
      font-size: 11px;
      letter-spacing: 0.05em;
    }
    td {
      padding: 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #334155;
    }
    .td-num {
      text-align: right;
      font-family: 'JetBrains Mono', monospace;
    }
    .subtotal-section {
      padding: 20px 40px 40px 40px;
      display: flex;
      justify-content: flex-end;
    }
    .subtotal-box {
      width: 280px;
      font-size: 13px;
      font-family: 'JetBrains Mono', monospace;
    }
    .subtotal-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      color: #64748b;
    }
    .grand-total-row {
      display: flex;
      justify-content: space-between;
      padding: 12px 0;
      border-top: 1px dashed #cbd5e1;
      margin-top: 8px;
      font-size: 16px;
      font-weight: 900;
      color: #b45309;
    }
    .footer {
      background-color: #f8fafc;
      padding: 30px 40px;
      text-align: center;
      font-size: 11px;
      color: #94a3b8;
      border-top: 1px solid #e2e8f0;
      line-height: 1.6;
    }
    .btn-print {
      display: inline-block;
      margin-top: 20px;
      background: #b45309;
      color: white;
      text-decoration: none;
      padding: 10px 20px;
      font-size: 12px;
      font-weight: 700;
      border-radius: 8px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border: none;
      cursor: pointer;
      box-shadow: 0 4px 6px -1px rgba(180, 83, 9, 0.15);
    }
    .btn-print:hover {
      background: #92400e;
    }
    @media print {
      body {
        background-color: white;
        padding: 0;
      }
      .container {
        border: none;
        box-shadow: none;
      }
      .btn-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand-section">
        <h1>THE AMBER ROYALE</h1>
        <p>789 Hospitality Boulevard, Elite Heights, California WA-98210</p>
        <p style="font-family: 'JetBrains Mono', monospace; color: #94a3b8; font-size: 10px; margin-top: 4px;">
          support@amberroyale.com | +1 (888) 123-4567
        </p>
      </div>
      <div class="invoice-title-section">
        <h2>INVOICE</h2>
        <div class="invoice-digits">${b.invoiceNumber}</div>
        <p style="font-size: 12px; color: #64748b; margin: 8px 0 0 0;">Date: ${invoiceDateStr}</p>
        <p style="font-size: 12px; margin: 4px 0 0 0;">Status: <strong style="color: #b45309;">${b.status}</strong></p>
      </div>
    </div>

    <div class="meta-details">
      <div class="meta-column">
        <h3>BILLED TO</h3>
        <strong>${cust ? cust.name : 'Unknown Guest'}</strong>
        <p style="font-family: 'JetBrains Mono', monospace; margin-top: 8px;">📧 ${cust?.email || 'N/A'}</p>
        <p style="font-family: 'JetBrains Mono', monospace;">📞 ${cust?.phone || 'N/A'}</p>
        <p style="margin-top: 6px;">📍 ${cust?.address || 'No registered address on file'}</p>
      </div>
      <div class="meta-column">
        <h3>RESERVATION RECORDS</h3>
        ${b.booking ? `
        <p>Booking ID: <span style="font-family: 'JetBrains Mono', monospace;">${b.booking.id}</span></p>
        <p>Room Occupied: <strong>Suite #${b.booking.roomNumber}</strong></p>
        <p>Stay Dates: ${b.booking.checkInDate} to ${b.booking.checkOutDate}</p>
        <p>Stay Duration: ${b.booking.numberOfDays} Nights</p>
        ` : `
        <p style="color: #94a3b8; font-style: italic;">Direct Restaurant billing statement (No Reservation linked)</p>
        `}
      </div>
    </div>

    <table style="width: 100%;">
      <thead>
        <tr>
          <th style="padding-left: 40px;">Description of Services</th>
          <th>Rate Multiplier</th>
          <th style="text-align: right; padding-right: 40px;">Subtotal Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="padding-left: 40px; font-weight: 600;">
            Luxury Suite Accommodation Charges
            <div style="font-size: 10px; color: #94a3b8; font-weight: normal; margin-top: 4px;">Suite Number: ${b.booking?.roomNumber || 'N/A'}</div>
          </td>
          <td style="font-family: 'JetBrains Mono', monospace;">${b.booking?.numberOfDays || 0} Nights</td>
          <td class="td-num" style="padding-right: 40px; font-weight: 700; color: #0f172a;">₹${roomValue}</td>
        </tr>
        <tr>
          <td style="padding-left: 40px; font-weight: 600;">
            Gourmet Culinary & Kitchen Ordering Services
            <div style="font-size: 10px; color: #94a3b8; font-weight: normal; margin-top: 4px;">In-room Dining and Kitchen orders</div>
          </td>
          <td style="font-family: 'JetBrains Mono', monospace;">Itemized Logs</td>
          <td class="td-num" style="padding-right: 40px; font-weight: 700; color: #0f172a;">₹${foodValue}</td>
        </tr>
      </tbody>
    </table>

    <div class="subtotal-section">
      <div class="subtotal-box">
        <div class="subtotal-row">
          <span>Hotel Room Tariff:</span>
          <span>₹${roomValue}</span>
        </div>
        <div class="subtotal-row">
          <span>Dining Cuisine Tariff:</span>
          <span>₹${foodValue}</span>
        </div>
        <div class="subtotal-row">
          <span>Subtotal:</span>
          <span>₹${totalSub}</span>
        </div>
        <div class="subtotal-row" style="color: #f43f5e;">
          <span>GST Flat Tax (18%):</span>
          <span>₹${taxValue}</span>
        </div>
        <div class="grand-total-row">
          <span>Grand Total:</span>
          <span>₹${absoluteTotal}</span>
        </div>
        <button class="btn-print" onclick="window.print()">Print In-Browser Receipt</button>
      </div>
    </div>

    <div class="footer">
      <p>Thank you for choosing The Amber Royale. We are dedicated to making every stay exquisite.</p>
      <p style="margin-top: 4px; font-size: 10px; font-family: 'JetBrains Mono', monospace; color: #cbd5e1;">
        Computer-generated digital statement. Authenticated under transaction key ${b.id}.
      </p>
    </div>
  </div>
</body>
</html>
      `;

      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Amber_Royale_Invoice_${b.invoiceNumber}.html`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Direct HTML download failed:", err);
    }
  };

  const filteredBills = bills.filter(b => {
    // Safety privacy check for guest profiles
    if (!isAdmin && b.customerId !== currentUser?.customerId) {
      return false;
    }
    const cust = customers.find(c => c.id === b.customerId);
    const guestName = cust ? cust.name.toLowerCase() : '';
    return guestName.includes(search.toLowerCase()) || b.invoiceNumber.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-6" id="billing-view-container">
      {/* Banner Controllers */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="billing-controls">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoice number or guest..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 w-full border border-slate-200 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Invoice Grid Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs overflow-hidden" id="billing-grid-panel">
        <div className="overflow-x-auto">
          <table className="styled-table font-sans animate-fade-in">
            <thead className="text-[10px] text-amber-800 uppercase tracking-widest bg-amber-500/5 border-b border-amber-500/10">
              <tr>
                <th scope="col" className="px-6 py-3.5 font-bold">Invoice No</th>
                <th scope="col" className="px-6 py-3.5 font-bold">Guest Information</th>
                <th scope="col" className="px-6 py-3.5 font-bold">Invoice Date</th>
                <th scope="col" className="px-6 py-3.5 text-right font-bold text-slate-500">Room Tariff</th>
                <th scope="col" className="px-6 py-3.5 text-right font-bold text-slate-500">Food Tariff</th>
                <th scope="col" className="px-6 py-3.5 text-right font-bold text-rose-600">GST (18%)</th>
                <th scope="col" className="px-6 py-3.5 text-right font-bold text-amber-950">Grand Total</th>
                <th scope="col" className="px-6 py-3.5 text-center font-bold">Payment Status</th>
                <th scope="col" className="px-6 py-3.5 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredBills.length === 0 ? (
                <tr>
                   <td colSpan={9} className="px-6 py-12 text-center text-slate-400">No invoice statements created yet.</td>
                </tr>
              ) : (
                filteredBills.map((b) => {
                  const cust = customers.find(c => c.id === b.customerId);
                  return (
                    <tr key={b.id} className="hover:bg-amber-500/5 text-slate-600 text-xs sm:text-sm transition-all duration-200 group/row">
                      <td className="px-6 py-3.5 font-mono font-bold text-slate-900 border-none">
                        {b.invoiceNumber}
                      </td>
                      <td className="px-6 py-3.5">
                        <div className="font-bold text-slate-900 group-hover/row:text-slate-950">{cust ? cust.name : 'Unknown Guest'}</div>
                        <div className="text-xs text-slate-400">{cust ? cust.phone : ''}</div>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-medium">
                        {new Date(b.invoiceDate).toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' })}
                      </td>
                      <td className="px-6 py-3.5 text-right text-slate-705 font-mono font-medium">₹{b.roomCharges.toFixed(2)}</td>
                      <td className="px-6 py-3.5 text-right text-slate-705 font-mono font-medium">₹{b.foodCharges.toFixed(2)}</td>
                      <td className="px-6 py-3.5 text-right text-rose-600 font-mono font-medium">₹{b.gstAmount.toFixed(2)}</td>
                      <td className="px-6 py-3.5 text-right font-black text-slate-950 font-mono text-sm leading-none bg-amber-500/2">
                        ₹{b.grandTotal.toFixed(2)}
                      </td>
                      <td className="px-6 py-3.5 text-center">
                        <span className={`inline-flex px-2.5 py-1 text-[10px] font-black tracking-wider uppercase rounded-md border ${
                          b.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-900 border-emerald-500/30' : 'bg-rose-500/10 text-rose-900 border-rose-500/30'
                        }`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex justify-end gap-2 text-xs font-semibold">
                          <button
                            onClick={() => handleOpenInvoice(b)}
                            className="bg-amber-500/10 hover:bg-amber-600 hover:text-white text-amber-905 p-1.5 px-3 rounded-md inline-flex items-center gap-1 border border-amber-500/25 transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] cursor-pointer shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" /> View Receipt
                          </button>
                          {b.status === 'Unpaid' && (
                            <button
                              onClick={() => {
                                if (isAdmin) {
                                  if (confirm(`Mark Invoice ${b.invoiceNumber} as Paid?`)) {
                                    onPayBill(b.id);
                                  }
                                } else {
                                  startPaymentCheckout(b);
                                }
                              }}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 px-3 rounded-md inline-flex items-center gap-1 transition-all duration-150 hover:scale-[1.03] active:scale-[0.97] cursor-pointer shadow-md text-nowrap"
                            >
                              <DollarSign className="w-3.5 h-3.5" />
                              {isAdmin ? 'Collect Payment' : 'Pay Online Now'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Invoice Modal Dialog Box */}
      {selectedBill && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-100 w-full max-w-2xl overflow-hidden animate-zoom-in">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <span className="text-sm font-bold text-slate-500 uppercase flex items-center gap-1.5">
                Statement Review Mode: {selectedBill.invoiceNumber}
              </span>
              <button 
                onClick={() => setSelectedBill(null)} 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Actual receipt sheet */}
            <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto" ref={printRef}>
              {/* Branding / Header details */}
              <div className="flex justify-between items-start border-b border-dashed border-slate-200 pb-6">
                <div>
                  <div className="flex items-center gap-2 text-amber-700">
                    <Building className="w-6 h-6 shrink-0" />
                    <span className="text-xl font-extrabold tracking-tight">THE AMBER ROYALE</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs leading-relaxed">
                    789 Hospitality Boulevard, Elite Heights, California WA-98210
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    support@amberroyale.com | +1 (888) 123-4567
                  </p>
                </div>
                <div className="text-right">
                  <h2 className="text-2xl font-black text-slate-900 uppercase">INVOICE</h2>
                  <p className="text-sm font-mono font-bold text-slate-600 mt-1">{selectedBill.invoiceNumber}</p>
                  <div className="mt-3 text-xs text-slate-500 space-y-0.5">
                    <p>Date: {new Date(selectedBill.invoiceDate).toLocaleDateString()}</p>
                    <p>Status: <span className="font-extrabold text-amber-700">{selectedBill.status}</span></p>
                  </div>
                </div>
              </div>

              {/* Guest Profile Section details */}
              <div className="grid grid-cols-2 gap-8 text-xs border-b border-slate-100 pb-6">
                <div>
                  <span className="block font-black text-slate-400 uppercase tracking-widest mb-2">BILLED TO</span>
                  <p className="font-extrabold text-slate-800 text-sm">{selectedBill.customer ? selectedBill.customer.name : 'Unknown Guest'}</p>
                  <div className="mt-2 space-y-1 text-slate-500 leading-relaxed font-mono">
                    <p className="flex items-center gap-1"><Mail className="w-3.5 h-3.5 shrink-0" /> {selectedBill.customer?.email}</p>
                    <p className="flex items-center gap-1"><Phone className="w-3.5 h-3.5 shrink-0" /> {selectedBill.customer?.phone}</p>
                    <p className="flex items-start gap-1"><Building className="w-3.5 h-3.5 shrink-0 text-slate-300 mt-0.5" /> <span className="line-clamp-2">{selectedBill.customer?.address || 'No registered address'}</span></p>
                  </div>
                </div>
                <div>
                  <span className="block font-black text-slate-400 uppercase tracking-widest mb-2">RESERVATION LOGS</span>
                  {selectedBill.booking ? (
                    <div className="space-y-1 text-slate-500 leading-relaxed font-mono">
                      <p>Booking ID: {selectedBill.booking.id}</p>
                      <p>Room Assigned: #{selectedBill.booking.roomNumber}</p>
                      <p>Stay: {selectedBill.booking.checkInDate} to {selectedBill.booking.checkOutDate}</p>
                      <p>Nights Reserved: {selectedBill.booking.numberOfDays} Nights</p>
                    </div>
                  ) : (
                    <p className="text-slate-400">Direct Restaraunt Billing Client (No Reservation linked)</p>
                  )}
                </div>
              </div>

              {/* Itemized pricing breakdown sheets */}
              <div className="space-y-4">
                <span className="block font-black text-slate-400 uppercase tracking-widest text-xs">ITEMIZED BILLING STATEMENT</span>
                <table className="styled-table font-sans">
                  <thead className="bg-amber-500/5 font-bold uppercase text-amber-800 border-b border-amber-500/10 text-[10px] tracking-widest">
                    <tr>
                      <th className="px-4 py-3.5">Description of Services</th>
                      <th className="px-4 py-3.5 text-right w-[150px]">Quantity / Unit</th>
                      <th className="px-4 py-3.5 text-right w-[150px]">Line Charges</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-150">
                    <tr className="hover:bg-amber-500/2 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        Room Booking Rental Charges 
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">#{selectedBill.booking?.roomNumber || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono">{selectedBill.booking?.numberOfDays || 0} Nights</td>
                      <td className="px-4 py-3.5 text-right font-black text-slate-900 font-mono">₹{selectedBill.roomCharges.toFixed(2)}</td>
                    </tr>
                    <tr className="hover:bg-amber-500/2 transition-colors">
                      <td className="px-4 py-3.5 font-bold text-slate-900">
                        Restaurant Food Service Charges
                        <span className="block text-[10px] text-slate-400 font-mono mt-0.5">Kitchen order item summaries</span>
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono">Itemized Summary</td>
                      <td className="px-4 py-3.5 text-right font-black text-slate-900 font-mono">₹{selectedBill.foodCharges.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Summary block total */}
              <div className="flex justify-end border-t border-slate-100 pt-6">
                <div className="w-64 space-y-2 text-xs text-slate-500 font-mono">
                  <div className="flex justify-between">
                    <span>Hotel Subtotal:</span>
                    <span className="font-extrabold text-slate-800">₹{(selectedBill.roomCharges + selectedBill.foodCharges).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>GST (18% Flat):</span>
                    <span className="font-extrabold text-rose-500">₹{selectedBill.gstAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-dashed border-slate-200 pt-2 text-sm text-slate-900 font-extrabold">
                    <span>Grand Total:</span>
                    <span className="text-amber-700 text-base">₹{selectedBill.grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Thank you note footer for prints */}
              <div className="text-center pt-8 border-t border-dashed border-slate-200 text-xs text-slate-400 leading-relaxed font-mono">
                <p>Thank you for choosing The Amber Royale. We appreciate your stay!</p>
                <p className="mt-1">Computer-generated statement. No physical signature required.</p>
              </div>
            </div>

            {/* Loyalty points discount redeemer (Non-printable section) */}
            {!isAdmin && selectedBill.status === 'Unpaid' && (
              <div className="px-8 py-4 bg-amber-500/5 border-t border-b border-amber-500/10 space-y-3 font-sans" id="loyalty-redeemer-invoice-block">
                <div className="flex justify-between items-center">
                  <div>
                    <h5 className="text-xs font-black uppercase text-amber-800 tracking-wider">Unpaid Loyalty Rewards Discount</h5>
                    <p className="text-[10px] text-slate-400">Convert your royalty points to immediate cash deductions (10 points = ₹1 discount)</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Your Balance</span>
                    <span className="text-xs font-black text-amber-700 font-mono">
                      {customers.find(c => c.id === currentUser?.customerId || c.id === selectedBill.customerId)?.loyaltyPoints || 0} Points
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="e.g., 200"
                    disabled={redeemLoading}
                    value={redeemPoints}
                    onChange={(e) => {
                      setRedeemPoints(e.target.value);
                      setRedeemMessage({ text: '', type: '' });
                    }}
                    className="w-32 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-hidden"
                  />
                  <button
                    onClick={async () => {
                      const pts = Number(redeemPoints);
                      if (isNaN(pts) || pts <= 0) {
                        setRedeemMessage({ text: 'Specify positive points to redeem.', type: 'error' });
                        return;
                      }
                      setRedeemLoading(true);
                      try {
                        const token = localStorage.getItem('jwt_token');
                        const res = await axios.post(`${window.location.origin}/api/bills/${selectedBill.id}/redeem`, { pointsToRedeem: pts }, {
                          headers: { Authorization: `Bearer ${token}` }
                        });
                        setRedeemMessage({ text: res.data.message, type: 'success' });
                        setRedeemPoints('');
                        
                        // Update local bill grandTotal
                        if (res.data.updatedBill) {
                          setSelectedBill((prev: any) => prev ? { ...prev, grandTotal: res.data.updatedBill.grandTotal } : null);
                        }

                        if (onRefresh) onRefresh();
                      } catch (err: any) {
                        setRedeemMessage({ text: err.response?.data?.error || 'Redemption process collapsed.', type: 'error' });
                      } finally {
                        setRedeemLoading(false);
                      }
                    }}
                    disabled={redeemLoading || !redeemPoints}
                    className="px-4 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-50 text-[10px] font-black uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
                  >
                    {redeemLoading ? 'Applying..' : 'Apply Discount'}
                  </button>
                </div>

                {redeemMessage.text && (
                  <p className={`text-[10px] font-bold ${
                    redeemMessage.type === 'success' ? 'text-emerald-700' : 'text-rose-600'
                  }`} id="redeem-response-notes">
                    {redeemMessage.text}
                  </p>
                )}
              </div>
            )}

            {/* Print toolbar footer */}
            <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex justify-between gap-3">
              <button
                onClick={() => setSelectedBill(null)}
                className="py-1.5 px-4 border border-slate-200 bg-white hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 transition-colors"
              >
                Close View
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleDownloadInvoice}
                  className="py-1.5 px-4 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  id="btn-invoice-download-html"
                >
                  <Download className="w-4 h-4" /> Download HTML Invoice
                </button>
                <button
                  onClick={handlePrint}
                  className="py-1.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" /> Print / PDF Receipt
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ONLINE GATEWAY TRANSACTIONS HISTORY */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-xs p-6" id="payment-transaction-history">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Online Gateway Transactions History</h3>
            <p className="text-xs text-slate-400">Audit logs for simulated credit card and UPI charges.</p>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold font-mono uppercase tracking-wider">
            {paymentHistory.length} Record(s) Loaded
          </span>
        </div>
        
        {paymentHistory.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-4 text-center">No payment transactions recorded yet.</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {paymentHistory.map(tx => (
              <div key={tx.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-3.5 rounded-lg gap-2 text-xs transition-colors">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold font-mono text-slate-800">{tx.id}</span>
                    <span className="text-[9px] bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold uppercase rounded px-1">{tx.status}</span>
                  </div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    Settled for <strong className="text-slate-700">{tx.invoiceNumber}</strong> &bull; {tx.method}
                  </div>
                </div>
                <div className="sm:text-right">
                  <div className="font-extrabold text-slate-900 text-sm font-mono">₹{tx.amount.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-400">{new Date(tx.date).toLocaleString()}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* REALISTIC ONLINE PAYMENT CHECKOUT GATEWAY DIALOG */}
      {checkoutBill && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 text-slate-100 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-zoom-in font-sans">
            {/* Header */}
            <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-black uppercase text-amber-500 tracking-widest font-mono">SECURE TRANSIT GATEWAY</span>
                <h3 className="font-bold text-sm text-white">Amber Royale Settle Engine</h3>
              </div>
              <button 
                onClick={() => setCheckoutBill(null)}
                disabled={paymentStatus === 'processing'}
                className="text-slate-400 hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-800 cursor-pointer disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Total value panel */}
            <div className="bg-slate-950 p-6 text-center border-b border-slate-800">
              <span className="text-xs text-slate-400 uppercase font-semibold">Outstanding Total for {checkoutBill.invoiceNumber}</span>
              <h2 className="text-3xl font-black font-mono text-amber-400 mt-1">₹{checkoutBill.grandTotal.toFixed(2)}</h2>
              <p className="text-[10px] text-slate-500 mt-0.5">Charges include 18% Flat GST of ₹{checkoutBill.gstAmount.toFixed(2)}</p>
            </div>

            {/* Content Switcher */}
            {paymentStatus === 'idle' && (
              <div className="p-6 space-y-6 text-slate-300">
                {/* Method selector tab row */}
                <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button 
                    onClick={() => setPaymentMethod('card')}
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${paymentMethod === 'card' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  >
                    Credit / Debit Card
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('upi')}
                    className={`flex-1 py-2 text-xs font-bold rounded-md transition-all cursor-pointer ${paymentMethod === 'upi' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                  >
                    UPI Payment
                  </button>
                </div>

                {/* Card Fields Form */}
                {paymentMethod === 'card' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Card Number *</label>
                      <input 
                        type="text"
                        maxLength={19}
                        value={cardNumber}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim();
                          setCardNumber(v);
                        }}
                        placeholder="4111 2222 3333 4444"
                        className="w-full px-4 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Card Holder Name *</label>
                      <input 
                        type="text"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="Sanjay Kumar"
                        className="w-full px-4 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Expiration *</label>
                        <input 
                          type="text"
                          maxLength={5}
                          value={cardExpiry}
                          onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, '');
                            if (v.length > 2) v = v.substring(0, 2) + '/' + v.substring(2, 4);
                            setCardExpiry(v);
                          }}
                          placeholder="MM/YY"
                          className="w-full px-4 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">CVC / CVV *</label>
                        <input 
                          type="password"
                          maxLength={3}
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                          placeholder="***"
                          className="w-full px-4 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Enter UPI VPA ID *</label>
                      <input 
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="e.g. guest@okaxis"
                        className="w-full px-4 py-2 border border-slate-800 rounded-lg text-sm bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                    <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 flex flex-col items-center text-center">
                      <p className="text-[10px] text-slate-400 mb-3 font-medium">Or scan instant static UPI simulation code:</p>
                      <div className="w-32 h-32 bg-white p-2 rounded-lg relative flex items-center justify-center">
                        <svg className="w-full h-full text-slate-950" viewBox="0 0 100 100">
                          <rect x="0" y="0" width="20" height="20" fill="currentColor"/>
                          <rect x="5" y="5" width="10" height="10" fill="white"/>
                          <rect x="80" y="0" width="20" height="20" fill="currentColor"/>
                          <rect x="85" y="5" width="10" height="10" fill="white"/>
                          <rect x="0" y="80" width="20" height="20" fill="currentColor"/>
                          <rect x="5" y="85" width="10" height="10" fill="white"/>
                          <rect x="30" y="30" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="3"/>
                          <rect x="42" y="42" width="16" height="16" fill="currentColor"/>
                          <path d="M 10,35 H 25 M 35,10 V 25 M 70,50 H 85 M 50,70 V 85" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-500 text-slate-900 border border-white font-extrabold text-[9px] px-1 rounded">
                          UPI
                        </div>
                      </div>
                      <p className="text-[9px] text-amber-500/80 font-mono mt-2 tracking-wider">MEMBER SETTLEMENT QR GATEWAY</p>
                    </div>
                  </div>
                )}

                {/* Validation actions */}
                <div className="space-y-3 pt-2">
                  <p className="text-[10px] text-slate-500 leading-relaxed text-center">
                    This is a secure offline sandbox environment. Settle payment records with customized simulated states.
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleProcessPayment(false)}
                      disabled={paymentMethod === 'card' ? (!cardNumber || !cardExpiry || !cardCvv) : !upiId}
                      className="py-2.5 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 text-rose-400 text-xs font-bold transition-all disabled:opacity-45 cursor-pointer"
                    >
                      Simulate Bank Decline
                    </button>
                    <button
                      onClick={() => handleProcessPayment(true)}
                      disabled={paymentMethod === 'card' ? (!cardNumber || !cardExpiry || !cardCvv) : !upiId}
                      className="py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-950/20 transition-all disabled:opacity-45 cursor-pointer"
                    >
                      Authorize Payment (Pass)
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* PROCESSING MODULE SCREEN */}
            {paymentStatus === 'processing' && (
              <div className="p-8 text-center space-y-4">
                <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
                <div className="space-y-1">
                  <h4 className="font-bold text-sm tracking-tight text-white animate-pulse">Authorization Pending...</h4>
                  <p className="text-xs text-slate-400 font-mono italic">{processingStep}</p>
                </div>
                <p className="text-[10px] text-slate-600">Please do not refresh nor exit this gateway statement frame.</p>
              </div>
            )}

            {/* SUCCESS FRAME */}
            {paymentStatus === 'success' && (
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-full flex items-center justify-center mx-auto text-3xl font-black">
                  ✓
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-lg text-white">Payment Approved & Settled!</h4>
                  <p className="text-xs text-slate-400">The invoice status has been successfully updated on the server database.</p>
                  <div className="bg-slate-950 border border-slate-850 p-2.5 rounded-lg max-w-fit mx-auto font-mono text-[10px] text-slate-400">
                    TX Ref ID: <strong className="text-slate-100">{paymentTxId}</strong>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => triggerAutoInvoiceDownload(checkoutBill)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg flex items-center justify-center gap-1 transition-all shadow-md cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Invoice Receipt
                  </button>
                  <button
                    onClick={() => {
                      setCheckoutBill(null);
                      if (onRefresh) onRefresh();
                    }}
                    className="w-full py-2 border border-slate-800 hover:bg-slate-800 text-slate-400 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Close Checkout
                  </button>
                </div>
              </div>
            )}

            {/* FAILURE FRAME */}
            {paymentStatus === 'failed' && (
              <div className="p-8 text-center space-y-6">
                <div className="w-16 h-16 bg-rose-500/10 text-rose-400 border border-rose-500/25 rounded-full flex items-center justify-center mx-auto text-2xl font-black font-mono">
                  ✕
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-lg text-white">Transaction Declined</h4>
                  <p className="text-xs text-rose-400 font-medium px-4">{paymentError}</p>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => setPaymentStatus('idle')}
                    className="flex-1 py-1.5 bg-slate-800 hover:bg-slate-705 text-white text-xs font-bold rounded-lg transition-all cursor-pointer"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={() => setCheckoutBill(null)}
                    className="flex-1 py-1.5 border border-slate-800 hover:bg-slate-800 text-slate-400 text-xs font-semibold rounded-lg transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
