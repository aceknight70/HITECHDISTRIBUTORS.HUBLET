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
    transactionRef?: string;
    purpose?: string;
    paymentMethod?: string;
    balanceRemaining?: number;
    
    // For Invoice / Receipt
    items?: DocumentLineItem[];
    totalAmount?: number;
    bankDetails?: {
      bank: string;
      accountNumber: string;
      accountName: string;
      payingBank?: string;
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
  const [downloading, setDownloading] = React.useState<boolean>(false);

  const ensureScriptsLoaded = async (): Promise<boolean> => {
    const checkCanvas = () => typeof (window as any).html2canvas !== 'undefined';
    const checkPdf = () => typeof (window as any).html2pdf !== 'undefined';
    
    if (checkCanvas() && checkPdf()) return true;

    const loadScript = (src: string): Promise<boolean> => {
      return new Promise((resolve) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      });
    };

    let canvasLoaded = checkCanvas();
    if (!canvasLoaded) {
      canvasLoaded = await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js');
    }

    let pdfLoaded = checkPdf();
    if (!pdfLoaded) {
      pdfLoaded = await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
    }

    return checkCanvas() && checkPdf();
  };

  const getDownloadFilename = () => {
    let prefix = 'HiTech_Document';
    if (type === 'Invoice') prefix = 'HiTech_Invoice';
    else if (type === 'Receipt') prefix = 'HiTech_Receipt';
    else if (type === 'Repair Ticket') prefix = 'HiTech_Repair';
    else if (type === 'Manager Request') prefix = 'HiTech_Request';
    return `${prefix}_${data.id}`;
  };

  const downloadPNG = async () => {
    setDownloading(true);
    const scriptsOK = await ensureScriptsLoaded();
    if (!scriptsOK) {
      alert("Unable to download. Please try again or contact support.");
      setDownloading(false);
      return;
    }

    const elementId = `doc-content-${data.id}`;
    const element = document.getElementById(elementId);
    if (!element) {
      alert("Unable to locate element to download.");
      setDownloading(false);
      return;
    }

    const canvasLib = (window as any).html2canvas;
    canvasLib(element, {
      scale: 2, // High quality
      backgroundColor: '#ffffff',
      useCORS: true,
      logging: false
    }).then((canvas: any) => {
      const link = document.createElement('a');
      link.download = getDownloadFilename() + '.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
      setDownloading(false);
    }).catch((error: any) => {
      console.error('PNG download failed:', error);
      alert('Unable to download. Please try again or contact support.');
      setDownloading(false);
    });
  };

  const downloadPDF = async () => {
    setDownloading(true);
    const scriptsOK = await ensureScriptsLoaded();
    if (!scriptsOK) {
      alert("Unable to download. Please try again or contact support.");
      setDownloading(false);
      return;
    }

    const elementId = `doc-content-${data.id}`;
    const element = document.getElementById(elementId);
    if (!element) {
      alert("Unable to locate element to download.");
      setDownloading(false);
      return;
    }

    const pdfLib = (window as any).html2pdf;
    const opt = {
      margin: 0.5,
      filename: getDownloadFilename() + '.pdf',
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    pdfLib().set(opt).from(element).save().then(() => {
      setDownloading(false);
    }).catch((error: any) => {
      console.error('PDF download failed:', error);
      alert('Unable to download. Please try again or contact support.');
      setDownloading(false);
    });
  };

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
Document Link: ${window.location.origin}/?view=${data.id}
Note: Tap to view and download your invoice/receipt as PNG or PDF.

Date: ${data.date}
Customer: ${data.customerName}
Phone: ${data.customerPhone}
${data.customerEmail ? `Email: ${data.customerEmail}\n` : ''}${data.customerAddress ? `Address: ${data.customerAddress}\n` : ''}${data.refCode ? `Reference Code: ${data.refCode}\n` : ''}

${type === 'Invoice' || type === 'Receipt' ? `
Items:
${data.items?.map(it => `- ${it.name} x${it.qty} (${it.price})`).join('\n')}
Total Amount: ₦${data.totalAmount?.toLocaleString()}
Bank Details:
Bank: ${data.bankDetails?.bank || 'GTBank'}
Acct No: ${data.bankDetails?.accountNumber || '9006163631'}
Acct Name: ${data.bankDetails?.accountName || 'HiTech Distributors'}
Paying Bank: ${data.bankDetails?.payingBank || 'UBA'}
Transaction Ref: ${data.transactionRef || 'ABR_123456_7890'}
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
${data.gmNotes ? `General Manager (GM) Notes: ${data.gmNotes}\n` : ''}${data.preferredMeeting ? `Scheduled Meeting: ${data.preferredMeeting}\n` : ''}
` : ''}

==================================
📞 CONTACT US:
🏢 Front Desk: +234 703 272 4432
💰 Sales & Orders: 09166241953
🛒 Sales Rep: +234 814 482 4531
🔧 Repairs & Tracking: +234 803 483 2773
⭐ General Manager: +234 803 217 5552
✉️ Email 1: hitechdistributors@gmail.com
✉️ Email 2: hitechd@hitechd.com
    `;
    navigator.clipboard.writeText(textDetails.trim());
    alert("Copied document details to clipboard!");
  };  const isReceipt = type === 'Receipt' || type === 'Invoice';
  const paperBg = isReceipt ? 'bg-[#0a0e1a]' : 'bg-white';
  const paperText = isReceipt ? 'text-white' : 'text-zinc-900';
  const paperTextSec = isReceipt ? 'text-zinc-300' : 'text-zinc-500';
  const paperBorder = isReceipt ? 'border-zinc-800' : 'border-zinc-200';
  const paperDivider = isReceipt ? 'border-zinc-800' : 'border-zinc-300';
  const paperCardBg = isReceipt ? 'bg-white/5' : 'bg-zinc-50/50';
  const paperLabelColor = isReceipt ? 'text-[#34a853]' : 'text-zinc-400';

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
      <div ref={printAreaRef} id={`doc-content-${data.id}`} className={`${paperBg} ${paperText} p-6 rounded-lg text-left shadow-lg font-sans border ${paperBorder}`}>
        
        {/* Document Header */}
        <div className={`flex justify-between items-start border-b pb-4 ${paperDivider}`}>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              {/* Colored Indicator */}
              <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: scheme.primary }} />
              <h2 className={`text-sm font-extrabold tracking-tight uppercase font-mono ${paperText}`}>
                {type === 'Receipt' ? '🟢 HITECH DISTRIBUTORS' : 'HITECH DISTRIBUTORS'}
              </h2>
            </div>
            <p className={`text-[10px] font-bold ${isReceipt ? 'text-[#34a853]' : 'text-zinc-500'} tracking-wider`}>
              Computers · Office Equipment · Solar Sizing Hub
            </p>
            <p className={`text-[9px] ${paperTextSec}`}>
              6 Airport Road, Warri · Delta State, Nigeria
            </p>
            <p className={`text-[9px] font-mono flex flex-wrap gap-x-3 gap-y-0.5 ${paperTextSec}`}>
              <span>📞 +234 803 217 5552</span>
              <span>📞 09166241953</span>
            </p>
            <p className={`text-[9px] font-mono flex flex-wrap gap-x-2 gap-y-1 ${paperTextSec}`}>
              <span>✉️ hitechdistributors@gmail.com</span>
              <span className={isReceipt ? 'text-zinc-700' : 'text-zinc-300'}>│</span>
              <span>hitechd@hitechd.com</span>
            </p>
          </div>
          <div className="text-right space-y-1">
            <span 
              className="text-[10px] font-extrabold px-2.5 py-1 rounded inline-block text-white font-mono" 
              style={{ backgroundColor: scheme.primary }}
            >
              {type.toUpperCase()}
            </span>
            <p className={`text-[11px] font-mono font-bold block mt-1 ${paperText}`}>
              Ref #: {data.id}
            </p>
            <p className={`text-[9px] font-mono ${paperTextSec}`}>
              Date: {data.date}
            </p>
          </div>
        </div>

        {/* Customer Information Block */}
        <div className={`my-4 p-3 rounded-lg grid grid-cols-1 sm:grid-cols-2 gap-4 border ${paperCardBg} ${paperBorder}`}>
          <div>
            <h4 className={`text-[9px] uppercase font-extrabold tracking-wider ${paperLabelColor} block mb-1`}>
              👤 Customer Information
            </h4>
            <p className={`text-xs font-bold ${paperText}`}>{data.customerName}</p>
            <p className={`text-[10px] ${paperTextSec} mt-0.5`}>Phone: {data.customerPhone}</p>
            {data.customerEmail && <p className={`text-[10px] ${paperTextSec} truncate`}>Email: {data.customerEmail}</p>}
          </div>
          <div>
            <h4 className={`text-[9px] uppercase font-extrabold tracking-wider ${paperLabelColor} block mb-1`}>
              📄 Reference Details
            </h4>
            <p className={`text-[10px] font-mono ${paperTextSec}`}>
              Ref Code: <span className="font-bold">{data.refCode || `HT-${data.id.substring(4)}`}</span>
            </p>
            {data.customerAddress && (
              <p className={`text-[10px] ${paperTextSec} mt-1`}>
                Address: {data.customerAddress}
              </p>
            )}
            <p className={`text-[10px] ${paperTextSec} mt-1`}>
              Authority: <span className="font-bold">{type === 'Manager Request' ? 'General Manager' : 'Service Desk / Warehouse'}</span>
            </p>
          </div>
        </div>

        {/* Type-Specific Contents */}
        
        {/* INVOICE & RECEIPT PRODUCTS LIST */}
        {(type === 'Invoice' || type === 'Receipt') && (
          <div className="space-y-4">
            <div className={`border rounded-lg overflow-hidden ${paperBorder}`}>
              <table className="w-full text-left text-xs">
                <thead className={`uppercase tracking-wider text-[9px] border-b ${isReceipt ? 'bg-white/5 text-[#34a853] border-zinc-900' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                  <tr>
                    <th className="p-2">🛒 What was paid for / Item description</th>
                    <th className="p-2 text-center w-16">Qty</th>
                    <th className="p-2 text-right w-32">Price per unit</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isReceipt ? 'divide-zinc-850' : 'divide-zinc-200'}`}>
                  {data.items && data.items.length > 0 ? (
                    data.items.map((item, idx) => (
                      <tr key={idx} className={isReceipt ? 'hover:bg-white/5' : 'hover:bg-zinc-50'}>
                        <td className={`p-2 font-medium ${paperText}`}>{item.name}</td>
                        <td className={`p-2 text-center font-mono ${paperTextSec}`}>{item.qty}</td>
                        <td className={`p-2 text-right font-mono font-bold ${paperText}`}>{item.price}</td>
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

            {/* Payment Details Section */}
            <div className={`p-3 rounded-lg border ${paperCardBg} ${paperBorder} text-[10px] space-y-1.5`}>
              <h4 className={`text-[9px] uppercase font-bold tracking-wider ${paperLabelColor}`}>💰 Payment details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className={`space-y-0.5 ${paperTextSec}`}>
                  <p>Purpose: <span className={`font-bold ${paperText}`}>{type === 'Receipt' ? (data.purpose || 'Sales Order') : 'Sales Order Invoice'}</span></p>
                  <p>Method: <span className={`font-bold ${paperText}`}>{data.paymentMethod || 'Bank Transfer'}</span></p>
                  <p>Status: <span className="font-extrabold text-[#34a853]">✅ CONFIRMED</span></p>
                  <p>Date: <span className={`font-medium ${paperText}`}>{data.date}</span></p>
                </div>
                <div className={`space-y-0.5 ${paperTextSec} text-right border-l pl-4 ${isReceipt ? 'border-zinc-800' : 'border-zinc-200'}`}>
                  <p className="text-[9px] text-zinc-400 uppercase font-extrabold tracking-wider">Amount Paid</p>
                  <p className="text-base font-mono font-extrabold text-[#34a853]">
                    ₦{(data.totalAmount || 0).toLocaleString()}
                  </p>
                  {data.balanceRemaining !== undefined ? (
                    <p className={`text-[9px] font-mono font-bold ${data.balanceRemaining > 0 ? 'text-amber-500 animate-pulse' : 'text-[#34a853]'}`}>
                      Balance: ₦{(data.balanceRemaining || 0).toLocaleString()} {data.balanceRemaining > 0 ? '⚠️ OWING' : '✅ PAID IN FULL'}
                    </p>
                  ) : (
                    <p className="text-[9px] font-mono font-bold text-[#34a853]">
                      Balance: ₦0.00 ✅ PAID IN FULL
                    </p>
                  )}
                </div>
              </div>
              
              <div className={`border-t pt-2 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 text-[9.5px]/relaxed ${paperTextSec} ${isReceipt ? 'border-zinc-850' : 'border-zinc-250'}`}>
                <div>
                  <span className="block uppercase text-[8px] font-bold text-zinc-400">Merchant Bank Instructions:</span>
                  <span>Bank Name: <strong className={paperText}>{data.bankDetails?.bank || 'GTBank'}</strong></span><br />
                  <span>Account Name: <strong className={paperText}>{data.bankDetails?.accountName || 'HiTech Distributors'}</strong></span><br />
                  <span>Account Number: <strong className={paperText}>{data.bankDetails?.accountNumber || '9006163631'}</strong></span>
                  <br /><span>Paying Bank: <strong className={paperText}>{data.bankDetails?.payingBank || 'UBA'}</strong></span>
                </div>
                <div className="sm:text-right">
                  <span className="block uppercase text-[8px] font-bold text-zinc-400">Reconciliation:</span>
                  <span>Transaction Ref: <strong className="font-mono text-xs text-[#34a853]">{data.transactionRef || `ABR_${Math.floor(100000 + Math.random() * 899999)}_${Math.floor(1000 + Math.random() * 8999)}`}</strong></span>
                </div>
              </div>
            </div>

            {/* Structured CONTACT US Section */}
            <div className={`mt-4 p-3 rounded-lg border ${isReceipt ? 'bg-white/5 border-zinc-850' : 'bg-zinc-50 border-zinc-200'} text-[10.5px]`}>
              <div className="flex items-center gap-1.5 font-bold uppercase text-[9px] tracking-wider mb-2" style={{ color: scheme.primary }}>
                <Phone className="w-4 h-4" />
                <span>📞 CONTACT US</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 font-mono">
                <div className="flex justify-between border-b pb-0.5 border-dashed" style={{ borderColor: isReceipt ? '#262626' : '#e5e7eb' }}>
                  <span className={`${isReceipt ? 'text-zinc-400' : 'text-zinc-500'}`}>🏢 Front Desk:</span>
                  <span className="font-bold">+234 703 272 4432</span>
                </div>
                <div className="flex justify-between border-b pb-0.5 border-dashed" style={{ borderColor: isReceipt ? '#262626' : '#e5e7eb' }}>
                  <span className={`${isReceipt ? 'text-zinc-400' : 'text-zinc-500'}`}>💰 Sales & Orders:</span>
                  <span className="font-bold">09166241953</span>
                </div>
                <div className="flex justify-between border-b pb-0.5 border-dashed" style={{ borderColor: isReceipt ? '#262626' : '#e5e7eb' }}>
                  <span className={`${isReceipt ? 'text-zinc-400' : 'text-zinc-500'}`}>🛒 Sales Rep:</span>
                  <span className="font-bold">+234 814 482 4531</span>
                </div>
                <div className="flex justify-between border-b pb-0.5 border-dashed" style={{ borderColor: isReceipt ? '#262626' : '#e5e7eb' }}>
                  <span className={`${isReceipt ? 'text-zinc-400' : 'text-zinc-500'}`}>🔧 Repairs:</span>
                  <span className="font-bold">+234 803 483 2773</span>
                </div>
                <div className="flex justify-between border-b pb-0.5 border-dashed col-span-1 sm:col-span-2" style={{ borderColor: isReceipt ? '#262626' : '#e5e7eb' }}>
                  <span className={`${isReceipt ? 'text-zinc-400' : 'text-zinc-500'}`}>⭐ General Manager:</span>
                  <span className="font-bold">+234 803 217 5552</span>
                </div>
                <div className="flex justify-between border-b pb-0.5 border-dashed col-span-1 sm:col-span-2" style={{ borderColor: isReceipt ? '#262626' : '#e5e7eb' }}>
                  <span className={`${isReceipt ? 'text-zinc-400' : 'text-zinc-500'}`}>✉️ Email 1:</span>
                  <span className="font-bold select-all">hitechdistributors@gmail.com</span>
                </div>
                <div className="flex justify-between border-b pb-0.5 border-dashed col-span-1 sm:col-span-2" style={{ borderColor: isReceipt ? '#262626' : '#e5e7eb' }}>
                  <span className={`${isReceipt ? 'text-zinc-400' : 'text-zinc-500'}`}>✉️ Email 2:</span>
                  <span className="font-bold select-all">hitechd@hitechd.com</span>
                </div>
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
                  <span className="font-bold text-zinc-805">{data.brand}</span>
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

      {/* Document Link Display Section */}
      {(type === 'Invoice' || type === 'Receipt') && (
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-3 no-print max-w-2xl mx-auto text-xs w-full">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400 font-mono text-[10px] uppercase font-bold tracking-wider">Access Link:</span>
            <span className="text-[#34a853] font-mono font-bold select-all">{window.location.hostname || 'hitech.distributors'}/?view={data.id}</span>
          </div>
          <button
            type="button"
            onClick={() => {
              const fullUrl = `${window.location.origin}/?view=${data.id}`;
              navigator.clipboard.writeText(fullUrl);
              alert(`Copied link to clipboard: ${fullUrl}`);
            }}
            className="px-3 py-1.5 bg-zinc-850 hover:bg-zinc-800 text-white rounded font-bold font-mono text-[9px] uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border border-zinc-700"
          >
            <Copy className="w-3" style={{ height: '12px' }} />
            <span>Copy Access Link</span>
          </button>
        </div>
      )}

      {/* Download Action Buttons */}
      <div className="download-buttons flex gap-3 justify-center mt-5 flex-wrap w-full md:flex-row flex-col no-print">
        <button
          type="button"
          onClick={downloadPNG}
          disabled={downloading}
          className="btn-png bg-[#1a73e8] hover:opacity-90 active:scale-95 transition-all text-white px-6 py-3 border-0 rounded-lg text-base cursor-pointer flex items-center justify-center gap-2 font-bold w-full md:w-auto h-12 shadow-lg hover:shadow-blue-600/20 disabled:opacity-50"
        >
          <span>📷 Download as PNG</span>
        </button>
        <button
          type="button"
          onClick={downloadPDF}
          disabled={downloading}
          className="btn-pdf bg-[#dc3545] hover:opacity-90 active:scale-95 transition-all text-white px-6 py-3 border-0 rounded-lg text-base cursor-pointer flex items-center justify-center gap-2 font-bold w-full md:w-auto h-12 shadow-lg hover:shadow-red-600/20 disabled:opacity-50"
        >
          <span>📄 Download as PDF</span>
        </button>
      </div>

      {/* Processing Loader Overlay */}
      {downloading && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-50 rounded-xl space-y-3 no-print animate-fade-in">
          <div className="w-10 h-10 border-4 border-t-[#F5C518] border-zinc-800 rounded-full animate-spin"></div>
          <p className="text-xs font-bold font-mono tracking-widest text-zinc-300 uppercase animate-pulse">
            Compiling High-Quality Copy...
          </p>
          <p className="text-[10px] text-zinc-500 font-mono text-center max-w-[250px] px-4">
            Building with 300 DPI layout scaling for optimal print definition.
          </p>
        </div>
      )}
    </div>
  );
}
