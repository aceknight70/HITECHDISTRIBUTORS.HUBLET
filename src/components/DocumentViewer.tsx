import React, { useRef } from 'react';
import { FileText, CheckCircle, Wrench, ShieldAlert, Award, Printer, Share2, Copy, Send, Calendar, Clock, Phone, AlertTriangle } from 'lucide-react';

interface DocumentLineItem {
  name: string;
  qty: number;
  price: string;
}

interface DocumentViewerProps {
  type: 'Invoice' | 'Receipt' | 'Repair Ticket' | 'Manager Request';
  data: {
    id: string; // INV-XXXX, RCP-XXXX, RPR-XXXX (transcribed from repair Ref), MGR-XXXX
    date: string;
    customerName: string;
    customerPhone: string;
    customerEmail?: string;
    customerAddress?: string;
    refCode?: string; // For MGR or generic refs
    customerRef?: string;
    
    // For Invoice / Receipt
    items?: DocumentLineItem[];
    totalAmount?: number;
    bankDetails?: {
      bank: string;
      accountNumber: string;
      accountName: string;
    };
    
    // For Repair Ticket
    deviceType?: string;
    brand?: string;
    problem?: string;
    stages?: string[];
    status?: string;

    // For Manager Request Ticket
    category?: string;
    urgency?: string;
    description?: string;
    previousAttempts?: string;
    saNotes?: string;
    gmNotes?: string;
    preferredMeeting?: string;
  };
  onClose?: () => void;
}

export function DocumentViewer({ type, data, onClose }: DocumentViewerProps) {
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Styling maps
  const colorSchemes = {
    'Invoice': {
      primary: '#1a73e8', // Blue
      borderClass: 'border-[#1a73e8]',
      textClass: 'text-[#1a73e8]',
      bgClass: 'bg-[#1a73e8]/10',
      badgeClass: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
      accentBg: 'bg-[#1a73e8]',
      icon: <FileText className="w-5 h-5 text-[#1a73e8]" />
    },
    'Receipt': {
      primary: '#34a853', // Green
      borderClass: 'border-[#34a853]',
      textClass: 'text-[#34a853]',
      bgClass: 'bg-[#34a853]/10',
      badgeClass: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
      accentBg: 'bg-[#34a853]',
      icon: <CheckCircle className="w-5 h-5 text-[#34a853]" />
    },
    'Repair Ticket': {
      primary: '#fa7b17', // Orange
      borderClass: 'border-[#fa7b17]',
      textClass: 'text-[#fa7b17]',
      bgClass: 'bg-[#fa7b17]/10',
      badgeClass: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
      accentBg: 'bg-[#fa7b17]',
      icon: <Wrench className="w-5 h-5 text-[#fa7b17]" />
    },
    'Manager Request': {
      primary: '#9c27b0', // Purple
      borderClass: 'border-[#9c27b0]',
      textClass: 'text-[#9c27b0]',
      bgClass: 'bg-[#9c27b0]/10',
      badgeClass: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
      accentBg: 'bg-[#9c27b0]',
      icon: <ShieldAlert className="w-5 h-5 text-[#9c27b0]" />
    }
  };

  const scheme = colorSchemes[type];

  const handlePrint = () => {
    const printContent = printAreaRef.current?.innerHTML;
    const originalContent = document.body.innerHTML;
    
    // Simple custom iframe or popup print to prevent blank page or total overlay issues in iframe environments
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>${type} #${data.id}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { background-color: white; color: black; font-family: sans-serif; padding: 20px; }
              @media print {
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            <div class="max-w-2xl mx-auto p-4 border border-zinc-200 rounded-xl">
              ${printContent}
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleCopyToClipboard = () => {
    const textDetails = `
=== HITECH DISTRIBUTORS - ${type.toUpperCase()} ===
Document ID: ${data.id}
Date: ${data.date}
Customer: ${data.customerName}
Phone: ${data.customerPhone}
${data.customerEmail ? `Email: ${data.customerEmail}\n` : ''}
${data.customerAddress ? `Address: ${data.customerAddress}\n` : ''}
${data.refCode ? `Reference Code: ${data.refCode}\n` : ''}

${type === 'Invoice' || type === 'Receipt' ? `
Items:
${data.items?.map(it => `- ${it.name} x${it.qty} (${it.price})`).join('\n')}
Total Amount: ₦${data.totalAmount?.toLocaleString()}
Bank Details:
Bank: ${data.bankDetails?.bank}
Acct No: ${data.bankDetails?.accountNumber}
Acct Name: ${data.bankDetails?.accountName}
` : ''}

${type === 'Repair Ticket' ? `
Device: ${data.brand} (${data.deviceType})
Fault Details: ${data.problem}
Current Status: ${data.status}
` : ''}

${type === 'Manager Request' ? `
Category: ${data.category}
Urgency Level: ${data.urgency}
Issue Description: ${data.description}
Previous Try/Attempts: ${data.previousAttempts}
Service Advisor (SA) Notes: ${data.saNotes}
${data.gmNotes ? `General Manager (GM) Notes: ${data.gmNotes}\n` : ''}
${data.preferredMeeting ? `Scheduled Meeting: ${data.preferredMeeting}\n` : ''}
` : ''}

==================================
Contact: hitechdistributors@gmail.com
    `;
    navigator.clipboard.writeText(textDetails.trim());
    alert("Copied document details to clipboard!");
  };

  return (
    <div className={`p-4 bg-[#0a0a0a] border ${scheme.borderClass} rounded-xl overflow-hidden shadow-2xl relative space-y-4`} id={`doc-${data.id}`}>
      {/* Top action bar */}
      <div className="flex justify-between items-center bg-zinc-900/60 p-2 rounded-lg gap-2 no-print">
        <div className="flex items-center gap-2">
          {scheme.icon}
          <span className="text-[10px] font-mono font-bold uppercase text-zinc-300 tracking-wider">
            {type} Mode
          </span>
        </div>
        <div className="flex gap-1.5">
          <button 
            type="button"
            onClick={handleCopyToClipboard}
            className="p-1.5 bg-zinc-850 hover:bg-zinc-800 rounded font-bold text-[10px] uppercase font-mono text-zinc-300 transition flex items-center gap-1 cursor-pointer"
            title="Copy Text Log"
          >
            <Copy className="w-3 h-3" />
            <span>Copy</span>
          </button>
          <button 
            type="button"
            onClick={handlePrint}
            className="p-1.5 bg-zinc-850 hover:bg-zinc-800 rounded font-bold text-[10px] uppercase font-mono text-zinc-300 transition flex items-center gap-1 cursor-pointer"
            title="Download PDF or Print"
          >
            <Printer className="w-3 h-3" />
            <span>Print / PDF</span>
          </button>
          {onClose && (
            <button 
              type="button"
              onClick={onClose}
              className="p-1.5 bg-zinc-850 hover:bg-red-950 hover:text-red-400 rounded font-bold text-[10px] uppercase font-mono text-red-500 transition cursor-pointer"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Main Printable Area Wrapper */}
      <div ref={printAreaRef} className="bg-white text-zinc-900 p-6 rounded-lg text-left shadow-lg font-sans border border-zinc-200">
        
        {/* Document Header */}
        <div className="flex justify-between items-start border-b border-zinc-300 pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              {/* Colored Indicator */}
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: scheme.primary }} />
              <h2 className="text-sm font-extrabold text-zinc-900 tracking-tight uppercase font-mono">
                HITECH DISTRIBUTORS
              </h2>
            </div>
            <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">
              Warri Delta State Showroom Hub
            </p>
            <p className="text-[9px] text-zinc-400">
              Email: hitechdistributors@gmail.com | Phone: +234 814 482 4531
            </p>
          </div>
          <div className="text-right space-y-1">
            <span 
              className="text-[10px] font-extrabold px-2.5 py-1 rounded inline-block text-white font-mono" 
              style={{ backgroundColor: scheme.primary }}
            >
              {type.toUpperCase()}
            </span>
            <p className="text-[11px] font-mono text-zinc-800 font-bold block mt-1">
              Ref #: {data.id}
            </p>
            <p className="text-[9px] text-zinc-500 font-mono">
              Date: {data.date}
            </p>
          </div>
        </div>

        {/* Customer Information Block */}
        <div className="my-4 bg-zinc-50 border border-zinc-200 p-3 rounded-lg grid grid-cols-2 gap-4">
          <div>
            <h4 className="text-[9px] uppercase font-extrabold tracking-wider text-zinc-400 block mb-1">
              Customer Details
            </h4>
            <p className="text-xs font-bold text-zinc-800">{data.customerName}</p>
            <p className="text-[10px] text-zinc-650 mt-0.5">{data.customerPhone}</p>
            {data.customerEmail && <p className="text-[10px] text-zinc-505 truncate">{data.customerEmail}</p>}
          </div>
          <div>
            <h4 className="text-[9px] uppercase font-extrabold tracking-wider text-zinc-400 block mb-1">
              Reference Information
            </h4>
            <p className="text-[10px] font-mono text-zinc-700">
              Reference Code: <span className="font-bold">{data.refCode || data.id}</span>
            </p>
            {data.customerAddress && (
              <p className="text-[10px] text-zinc-600 mt-1">
                Address: {data.customerAddress}
              </p>
            )}
            <p className="text-[10px] text-zinc-700 mt-1">
              Destination Authority: <span className="font-bold">{type === 'Manager Request' ? 'General Manager' : 'Service Desk / Store Warehouse'}</span>
            </p>
          </div>
        </div>

        {/* Type-Specific Contents */}
        
        {/* INVOICE & RECEIPT PRODUCTS LIST */}
        {(type === 'Invoice' || type === 'Receipt') && (
          <div className="space-y-4">
            <div className="border border-zinc-200 rounded-lg overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-zinc-100 uppercase tracking-wider text-[9px] text-zinc-500 border-b border-zinc-200">
                  <tr>
                    <th className="p-2">Item Description</th>
                    <th className="p-2 text-center w-16">Qty</th>
                    <th className="p-2 text-right w-32">Price per unit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200">
                  {data.items && data.items.length > 0 ? (
                    data.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50">
                        <td className="p-2 font-medium text-zinc-800">{item.name}</td>
                        <td className="p-2 text-center font-mono text-zinc-605">{item.qty}</td>
                        <td className="p-2 text-right font-mono font-bold text-zinc-800">{item.price}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="p-4 text-center text-[11px] text-zinc-400 italic">No checkout items logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-start bg-zinc-50 p-3 rounded-lg border border-zinc-200">
              {data.bankDetails ? (
                <div className="text-[10px] text-zinc-500 space-y-0.5">
                  <p className="font-bold uppercase text-zinc-700 text-[9px] tracking-wider mb-1">🏦 Payment Account Vouchers</p>
                  <p>Bank Name: <span className="font-bold font-mono text-zinc-800">{data.bankDetails.bank}</span></p>
                  <p>No: <span className="font-bold font-mono text-zinc-800">{data.bankDetails.accountNumber}</span></p>
                  <p>Acc Name: <span className="font-medium text-zinc-800">{data.bankDetails.accountName}</span></p>
                </div>
              ) : (
                <div className="text-[10px] text-zinc-400 italic">No direct bank voucher requested.</div>
              )}
              <div className="text-right space-y-1">
                <p className="text-[10px] text-zinc-400 uppercase font-extrabold tracking-wider">Grand Total</p>
                <p className="text-lg font-mono font-extrabold text-zinc-900">
                  ₦{(data.totalAmount || 0).toLocaleString()}
                </p>
                <p className="text-[9px] text-zinc-500 italic">
                  {type === 'Receipt' ? '🟢 Payment Received & Confirmed' : '🔵 Pending Payment Settlement'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* REPAIR TICKET DETAILS */}
        {type === 'Repair Ticket' && (
          <div className="space-y-4">
            <div className="border border-zinc-200 p-4 rounded-xl space-y-3 bg-zinc-50">
              <div className="grid grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <span className="text-[9px] text-zinc-400 uppercase font-extrabold tracking-wider block mb-0.5">Device Classification</span>
                  <span className="font-bold text-zinc-800">{data.deviceType}</span>
                </div>
                <div>
                  <span className="text-[9px] text-zinc-400 uppercase font-extrabold tracking-wider block mb-0.5">Diagnosis Brand / Model</span>
                  <span className="font-bold text-zinc-800">{data.brand}</span>
                </div>
              </div>
              <div className="border-t border-zinc-200 pt-2.5">
                <span className="text-[9px] text-zinc-400 uppercase font-extrabold tracking-wider block mb-1">Detailed Logged Fault Description</span>
                <p className="text-[11px] text-zinc-700 bg-white border border-zinc-200 p-2.5 rounded-lg whitespace-pre-wrap leading-relaxed">
                  "{data.problem}"
                </p>
              </div>
            </div>

            <div className="border border-zinc-200 p-4 rounded-xl space-y-2">
              <span className="text-[9px] text-zinc-400 uppercase font-extrabold tracking-wider block mb-1">Active Stage Tracking Progress</span>
              <div className="flex items-center justify-between gap-1 pl-1">
                {['Received', 'Diagnosed', 'In Repair', 'Ready for Pickup'].map((stage, idx) => {
                  const isCurrent = data.status === stage;
                  const isPassed = data.stages?.includes(stage) || isCurrent;
                  return (
                    <div key={idx} className="flex flex-col items-center flex-1 text-center relative">
                      {idx > 0 && (
                        <div className={`absolute right-[50%] left-[-50%] top-2 h-1 ${isPassed ? 'bg-orange-500' : 'bg-zinc-200'}`} style={{ zIndex: 1 }} />
                      )}
                      <div 
                        className={`w-4 h-4 rounded-full flex items-center justify-center font-mono text-[9px] font-bold relative z-10 ${
                          isCurrent ? 'bg-orange-500 text-white animate-pulse' :
                          isPassed ? 'bg-orange-600 text-white' : 'bg-zinc-200 text-zinc-500'
                        }`}
                      >
                        {idx + 1}
                      </div>
                      <span className={`text-[9px] font-bold font-mono mt-1 ${isPassed ? 'text-zinc-800' : 'text-zinc-400'}`}>{stage}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* MANAGER REQUEST TICKET DETAILS */}
        {type === 'Manager Request' && (
          <div className="space-y-4">
            <div className="bg-purple-50/50 border border-purple-200/50 p-4 rounded-xl space-y-3">
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-[9px] text-purple-600 uppercase font-extrabold tracking-widest block mb-0.5">Issue Category</span>
                  <span className="font-extrabold text-[#9c27b0]">{data.category}</span>
                </div>
                <div>
                  <span className="text-[9px] text-purple-600 uppercase font-extrabold tracking-widest block mb-0.5">Urgency Level</span>
                  <span className={`font-extrabold ${data.urgency === 'Urgent' || data.urgency === 'High' ? 'text-red-600 animate-pulse' : 'text-zinc-700'}`}>{data.urgency}</span>
                </div>
                <div>
                  <span className="text-[9px] text-purple-600 uppercase font-extrabold tracking-widest block mb-0.5">Workflow Status</span>
                  <span className="font-bold text-zinc-800">● {data.status}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-zinc-200 p-3 rounded-lg bg-zinc-50">
                  <span className="text-[9px] text-zinc-500 uppercase font-extrabold tracking-wider block mb-1">Customer Issue Description</span>
                  <p className="text-[11px] text-zinc-700 leading-relaxed min-h-[60px] whitespace-pre-wrap">
                    {data.description}
                  </p>
                </div>
                <div className="border border-zinc-200 p-3 rounded-lg bg-zinc-50">
                  <span className="text-[9px] text-zinc-500 uppercase font-extrabold tracking-wider block mb-1">Previous Attempts at Resolution</span>
                  <p className="text-[11px] text-zinc-700 leading-relaxed min-h-[60px] whitespace-pre-wrap">
                    {data.previousAttempts}
                  </p>
                </div>
              </div>

              <div className="border border-purple-200 p-3 rounded-lg bg-purple-50/30">
                <span className="text-[9px] text-purple-800 uppercase font-extrabold tracking-wider block mb-1">Service Advisor (SA) Assessment & Recommendation</span>
                <p className="text-[11px] text-purple-950 font-medium leading-relaxed whitespace-pre-wrap">
                  {data.saNotes}
                </p>
              </div>

              {data.gmNotes && (
                <div className="border border-emerald-350 p-3 rounded-lg bg-emerald-50/30">
                  <span className="text-[9px] text-emerald-800 uppercase font-extrabold tracking-wider block mb-1">General Manager (GM) Review Board Notes</span>
                  <p className="text-[11px] text-emerald-950 font-bold italic leading-relaxed whitespace-pre-wrap">
                    "{data.gmNotes}"
                  </p>
                </div>
              )}

              {data.status === 'Meeting Scheduled' && data.preferredMeeting && (
                <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-lg text-amber-950 space-y-1.5 animate-fade-in text-[11px] leading-relaxed">
                  <div className="flex items-center gap-1.5 font-bold uppercase text-amber-800 text-[10px] tracking-wider mb-0.5">
                    <Calendar className="w-4 h-4" />
                    <span>⚠️ Pre-meeting brief & instructions</span>
                  </div>
                  Dear <strong>{data.customerName}</strong>, your request to coordinate a session with the GM has been scheduled.
                  <p className="bg-white/80 p-2 rounded border border-amber-200 font-mono mt-1 font-bold text-center">
                     Date/Time: {data.preferredMeeting}
                  </p>
                  <p className="mt-1 font-serif text-[10.5px]">
                    "Please bring your invoice reference code (<span className="font-serif italic font-bold">{data.customerRef || data.refCode}</span>), receipt numbers, and any relevant troubleshooting material. The General Manager will be fully briefed on your previous attempts history. If you need to make reschedules or alterations, kindly ping the Service Advisor."
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Print Disclaimer block */}
        <div className="border-t border-zinc-200 pt-3 mt-6 flex justify-between items-center text-[8px] text-zinc-400 font-mono">
          <span>🔒 SECURED BY HITECH AUTHENTICATION SHIELD</span>
          <span>© 1999–2026 HITECH Ltd.</span>
        </div>
      </div>
    </div>
  );
}
