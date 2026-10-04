import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Printer, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  RefreshCw,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { NepaliDatePicker } from '../components/NepaliDatePicker';
import { toBsDateString, getTodayBsDate } from '../lib/nepaliDate';
import { getStoredCompanySettings, type CompanySettingsData } from './CompanySettings';

interface Customer {
  id: string;
  customer_id: string;
  name: string;
  company_name: string;
  pan_number: string;
  phone: string;
  email: string;
  type: string;
  is_active: boolean;
}

interface InvoiceItem {
  id: number;
  name: string;
  desc: string;
  qty: number;
  unit: string;
  rate: number;
  discount: number;
  tax: number;
}

const formatCurrency = (amount: number): string => {
  return `Rs. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const generateInvoiceNumber = (prefix = 'ASL-') => {
  const currentYear = 2026;
  const serial = Math.floor(100 + Math.random() * 900);
  return `${prefix}${currentYear}-${serial}`;
};

const InvoiceCreate = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const customerIdFromUrl = searchParams.get('customerId');

  const [companySettings, setCompanySettings] = useState<CompanySettingsData>(getStoredCompanySettings);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerIdFromUrl || '');
  
  // Official Letterhead Fields (Fully customizable & editable)
  const [invoiceNumber, setInvoiceNumber] = useState('ASL-2026-167');
  const [registrationNo, setRegistrationNo] = useState(() => companySettings.registration_no || '391840/82/83');
  const [panNo, setPanNo] = useState(() => companySettings.pan_vat_no || '623611557');
  const [invoiceDate, setInvoiceDate] = useState('2083-06-12');
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return toBsDateString(d);
  });

  useEffect(() => {
    const handleSettingsUpdate = () => {
      const updated = getStoredCompanySettings();
      setCompanySettings(updated);
      if (updated.registration_no) setRegistrationNo(updated.registration_no);
      if (updated.pan_vat_no) setPanNo(updated.pan_vat_no);
    };
    window.addEventListener('company_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);
    return () => {
      window.removeEventListener('company_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  const [customerInfo, setCustomerInfo] = useState({
    name: 'Tech Innovations Pvt. Ltd.',
    address: 'Putalisadak, Kathmandu, Nepal',
    pan: '609123456',
    phone: '+977 1-4412345',
    email: 'accounts@techinnovations.com.np',
    customerRef: 'CUST-1001',
  });

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 1,
      name: 'Website Development & Corporate Branding',
      desc: 'Corporate dynamic portal design, CMS integration & cloud deployment',
      qty: 1,
      unit: 'Project',
      rate: 150000,
      discount: 0,
      tax: 13,
    },
  ]);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('company_name', { ascending: true });

      if (error || !data || data.length === 0) {
        return;
      }

      setCustomers(data);

      const nextCustomerId = customerIdFromUrl
        ? data.find((c) => c.id === customerIdFromUrl)?.id
        : data[0]?.id ?? '';

      setSelectedCustomerId((current) => {
        if (customerIdFromUrl && data.some((c) => c.id === customerIdFromUrl)) {
          return customerIdFromUrl;
        }
        if (current && data.some((c) => c.id === current)) {
          return current;
        }
        return nextCustomerId;
      });
    };

    fetchCustomers();
  }, [customerIdFromUrl]);

  useEffect(() => {
    const activeCustomer = customers.find((c) => c.id === selectedCustomerId);
    if (!activeCustomer) return;

    setCustomerInfo({
      name: activeCustomer.company_name || activeCustomer.name || 'Customer / Company Name',
      address: activeCustomer.company_name
        ? `${activeCustomer.company_name}, Kathmandu, Nepal`
        : activeCustomer.name,
      pan: activeCustomer.pan_number || 'N/A',
      phone: activeCustomer.phone || 'N/A',
      email: activeCustomer.email || 'N/A',
      customerRef: activeCustomer.customer_id || 'CUST-1001',
    });
  }, [customers, selectedCustomerId]);

  const subtotal = items.reduce((acc, item) => acc + item.qty * item.rate, 0);
  const totalDiscount = items.reduce((acc, item) => acc + item.discount, 0);
  const taxableAmount = subtotal - totalDiscount;
  const totalTax = items.reduce((acc, item) => {
    const itemSub = item.qty * item.rate - item.discount;
    return acc + itemSub * (item.tax / 100);
  }, 0);
  const grandTotal = taxableAmount + totalTax;

  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        name: '',
        desc: '',
        qty: 1,
        unit: 'Pcs',
        rate: 0,
        discount: 0,
        tax: 13,
      },
    ]);
  };

  const removeItem = (id: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: number, field: keyof InvoiceItem, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const handlePrint = () => {
    window.scrollTo(0, 0);
    document.querySelectorAll('.overflow-y-auto').forEach((el) => {
      (el as HTMLElement).scrollTop = 0;
    });
    window.print();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 print:p-0 print:m-0 print:pb-0 print:overflow-visible print:transform-none">
      {/* Top Action Bar (hidden when printing) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 no-print">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold text-primary">Invoice Generator</h2>
            <span className="px-2.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200">
              Official Letterhead Mode
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            Fits the official ASLENIX letterhead with customizable Date, Ref No, Reg No, and background watermark.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setInvoiceNumber(generateInvoiceNumber(companySettings.invoice_prefix || 'ASL-'))}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            title="Generate new Ref No"
          >
            <RefreshCw size={14} />
            <span>New Ref No</span>
          </button>
          <button
            onClick={handlePrint}
            className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold transition-all cursor-pointer"
          >
            <Printer size={18} className="text-black" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Invoice Meta Controls Bar (Customer, Date Customization, and Presets) */}
      <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm mb-6 no-print">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
              Select Customer
            </label>
            <select
              value={selectedCustomerId}
              onChange={(event) => setSelectedCustomerId(event.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
            >
              {customers.length === 0 ? (
                <option value="">Tech Innovations Pvt. Ltd. (CUST-1001)</option>
              ) : (
                customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name || c.name} ({c.customer_id})
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                Invoice Date (बिल मिति)
              </label>
              <div className="flex items-center gap-1 text-[11px]">
                <button
                  type="button"
                  onClick={() => setInvoiceDate('2083-06-12')}
                  className={`px-1.5 py-0.5 rounded border transition-colors cursor-pointer ${
                    invoiceDate === '2083-06-12'
                      ? 'bg-indigo-600 text-white border-indigo-600 font-bold'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                  title="Use Sample Date from template"
                >
                  Sample 2083-06-12
                </button>
                <button
                  type="button"
                  onClick={() => setInvoiceDate(getTodayBsDate())}
                  className="px-1.5 py-0.5 rounded bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Use Today's Nepali Date"
                >
                  Today
                </button>
              </div>
            </div>
            <NepaliDatePicker
              value={invoiceDate}
              onChange={setInvoiceDate}
              required
            />
          </div>

          <div>
            <NepaliDatePicker
              label="Due Date (भुक्तानी म्याद)"
              value={dueDate}
              onChange={setDueDate}
              required
            />
          </div>
        </div>

        {/* Pro Tip on Canvas Customization */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-amber-500" />
            <span>
              <strong>100% Customizable:</strong> You can directly click and type on the letterhead canvas to edit <strong>DATE</strong>, <strong>Ref No</strong>, <strong>Reg No</strong>, <strong>PAN No</strong>, or item descriptions!
            </span>
          </div>
          <span className="font-mono text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200 text-slate-600">
            Current Date: {invoiceDate}
          </span>
        </div>
      </div>

      {/* Printable Corporate A4 Letterhead Canvas */}
      <div
        id="printable-invoice"
        className="max-w-[840px] mx-auto bg-[#f1f0ee] rounded-2xl shadow-xl border border-slate-300/80 overflow-hidden print:shadow-none print:border-none print:rounded-none print:m-0 print:w-full print:max-w-full relative"
      >
        {/* Subtle Official Watermark Layer (Zero In-Flow Height) */}
        <div className="invoice-watermark-layer absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
          <img
            src={companySettings.logo_url || '/logo.png'}
            alt="Aslenix Watermark"
            className="w-[380px] max-w-[62%] object-contain opacity-[0.038] select-none filter blur-[0.2px]"
          />
        </div>

        {/* Content Container (Layered on top of watermark) */}
        <div className="invoice-content-wrapper relative z-10 p-8 sm:p-10 print:p-0 text-slate-800 flex flex-col">
          {/* 1. OFFICIAL ASLENIX LETTERHEAD HEADER (Exact match to sample & user layout) */}
            <div className="print-header pb-1 mb-3">
              <div className="header-row relative grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-end gap-4 w-full">
                {/* Left: Registration details */}
                <div className="header-left flex flex-col text-left">
                  <div className="text-[13px] font-bold text-slate-950 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold">Reg No:</span>
                      <input
                        type="text"
                        value={registrationNo}
                        onChange={(e) => setRegistrationNo(e.target.value)}
                        className="font-bold text-slate-950 bg-transparent border-none p-0 focus:ring-0 outline-none w-36 hover:bg-slate-200/50 focus:bg-white rounded px-1 -mx-1"
                        placeholder="391840/82/83"
                        title="Registration Number (click to edit)"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">PAN No:</span>
                      <input
                        type="text"
                        value={panNo}
                        onChange={(e) => setPanNo(e.target.value)}
                        className="font-bold text-slate-950 bg-transparent border-none p-0 focus:ring-0 outline-none w-36 hover:bg-slate-200/50 focus:bg-white rounded px-1 -mx-1 font-mono"
                        placeholder="623611557"
                        title="PAN Number (click to edit)"
                      />
                    </div>
                  </div>
                </div>

                {/* Center: Company name and invoice title */}
                <div className="header-center flex flex-col items-center justify-center text-center py-1">
                  <h1 className="text-3xl sm:text-4xl font-black tracking-[0.28em] text-slate-950 font-sans uppercase leading-none">
                    A S L E N I X
                  </h1>
                  <p className="text-[11px] sm:text-xs font-black tracking-[0.36em] text-slate-950 uppercase mt-2 leading-none">
                    T E C H & S O L U T I O N
                  </p>
                  <span className="mt-3 text-xs sm:text-sm font-black tracking-[0.25em] text-slate-950 uppercase text-center inline-block">
                    TAX INVOICE
                  </span>
                </div>

                {/* Right: Official logo and reference number */}
                <div className="header-right flex flex-col items-start sm:items-end justify-center shrink-0 pr-1">
                  <img
                    src={companySettings.logo_url || '/logo.png'}
                    alt="ASLENIX Logo"
                    className="h-16 sm:h-20 w-auto object-contain print:h-16 drop-shadow-xs"
                  />
                  <div className="mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-950">
                    <span className="text-slate-500 font-semibold uppercase text-[11px]">Ref No:</span>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="font-bold text-slate-950 bg-transparent border-none p-0 focus:ring-0 outline-none w-32 font-mono sm:text-right hover:bg-slate-200/50 focus:bg-white rounded px-1"
                      placeholder="ASL-2026-167"
                      title="Invoice / Reference Number (click to edit)"
                    />
                  </div>
                </div>
              </div>

              {/* Solid Horizontal Dividing Line matching template */}
              <div className="w-full h-[2px] bg-slate-900 mt-4 mb-3"></div>
            </div>

            {/* 2. SUB-HEADER METADATA BAR (Payment Due / Fiscal Year on Left, DATE on Right per diagram Box 2) */}
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pt-0.5 text-xs font-medium">
              <div className="flex items-center gap-3 text-slate-600">
                <span>
                  Payment Due: <span className="font-semibold text-slate-900">{dueDate}</span>
                </span>
                <span className="text-slate-300">|</span>
                <span className="text-slate-500">
                  Fiscal Year: <span className="font-bold text-slate-900 font-mono">{companySettings.fiscal_year || '2082/83'}</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-slate-950 font-bold ml-auto">
                <span className="text-slate-500 font-semibold uppercase text-[11px]">DATE:</span>
                <input
                  type="text"
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                  className="font-bold text-slate-950 bg-transparent border-b border-transparent hover:border-slate-400 focus:border-slate-950 p-0 focus:ring-0 outline-none text-right font-mono w-28 hover:bg-slate-200/50 focus:bg-white rounded px-1 transition-all"
                  placeholder="2083-06-12"
                  title="Invoice Date (BS)"
                />
              </div>
            </div>

            {/* 3. BILLED TO & PAYMENT STATUS CARDS */}
            <div className="print-billing grid grid-cols-1 md:grid-cols-3 gap-5 mb-5 print:gap-3 print:mb-2">
              {/* Billed To (2 Cols) */}
              <div className="md:col-span-2 space-y-1.5 p-3.5 rounded-xl border border-slate-300/80 bg-white/60">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  BILLED TO
                </span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Customer / Company Name"
                    className="font-bold text-base text-slate-900 bg-transparent border-none p-0 focus:ring-0 w-full outline-none"
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                  />
                  <span className="shrink-0 bg-slate-100 text-slate-600 text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-slate-200">
                    {customerInfo.customerRef}
                  </span>
                </div>
                <textarea
                  placeholder="Customer Address"
                  className={`w-full text-xs text-slate-600 bg-transparent border-none p-0 focus:ring-0 resize-none h-8 outline-none leading-relaxed print:h-auto print:min-h-0 ${!customerInfo.address ? 'print:hidden' : ''}`}
                  value={customerInfo.address}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs pt-1 border-t border-slate-100">
                  <div className="flex gap-2">
                    <span className="text-slate-400 font-medium w-16">PAN/VAT:</span>
                    <input
                      type="text"
                      value={customerInfo.pan}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, pan: e.target.value })}
                      className="font-semibold text-slate-800 bg-transparent border-none p-0 focus:ring-0 outline-none font-mono"
                    />
                  </div>
                  <div className="flex gap-2">
                    <span className="text-slate-400 font-medium w-14">Phone:</span>
                    <input
                      type="text"
                      value={customerInfo.phone}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                      className="text-slate-800 bg-transparent border-none p-0 focus:ring-0 outline-none"
                    />
                  </div>
                  <div className="flex gap-2 sm:col-span-2">
                    <span className="text-slate-400 font-medium w-16">Email:</span>
                    <input
                      type="text"
                      value={customerInfo.email}
                      onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                      className="text-slate-800 bg-transparent border-none p-0 focus:ring-0 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Status (1 Col) */}
              <div className="bg-white/60 p-3.5 rounded-xl border border-slate-300/80 flex flex-col justify-between print:p-2.5 print:rounded-lg">
                <div>
                  <div className="flex justify-between items-center mb-2.5 print:mb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Payment Status
                    </span>
                    <span className="px-2.5 py-0.5 bg-rose-50 text-rose-700 text-[10px] font-bold rounded-full border border-rose-200 uppercase tracking-wider">
                      UNPAID
                    </span>
                  </div>
                  <div className="space-y-1 text-xs print:space-y-0.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Total Amount:</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(grandTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 font-medium">Amount Paid:</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(0)}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-2 mt-2 border-t border-slate-200/80 flex justify-between items-baseline print:pt-1 print:mt-1">
                  <span className="text-xs font-bold text-slate-900">Balance Due:</span>
                  <span className="text-base font-extrabold text-rose-700 font-mono">
                    {formatCurrency(grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. ITEMS TABLE */}
            <div className="print-items mb-5 overflow-x-auto print:overflow-visible print:mb-2">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-y border-slate-300/80 bg-slate-200/50 text-[11px] uppercase tracking-wider text-slate-700 font-bold">
                    <th className="py-2.5 px-3 text-center w-10">S.N.</th>
                    <th className="py-2.5 px-3">Item Details</th>
                    <th className="py-2.5 px-2 text-center w-14">Qty</th>
                    <th className="py-2.5 px-2 text-center w-16">Unit</th>
                    <th className="py-2.5 px-3 text-right w-24 whitespace-nowrap">Rate (Rs)</th>
                    <th className="py-2.5 px-3 text-right w-20 whitespace-nowrap">Disc (Rs)</th>
                    <th className="py-2.5 px-2 text-center w-16 whitespace-nowrap">Tax (%)</th>
                    <th className="py-2.5 px-3 text-right w-28 whitespace-nowrap">Amount (Rs)</th>
                    <th className="py-2.5 px-1 w-8 print:hidden"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {items.map((item, index) => {
                    const lineAmount = item.qty * item.rate - item.discount;
                    return (
                      <tr key={item.id} className="group hover:bg-slate-50/40">
                        <td className="py-3 px-3 text-center text-slate-400 font-medium align-top">
                          {index + 1}
                        </td>
                        <td className="py-3 px-3 align-top">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                            placeholder="Item name / Service"
                            className="w-full font-semibold text-slate-900 bg-transparent outline-none p-0 text-xs"
                          />
                          <textarea
                            value={item.desc}
                            onChange={(e) => updateItem(item.id, 'desc', e.target.value)}
                            placeholder="Item description or deliverables"
                            className={`w-full text-slate-500 text-[11px] mt-0.5 bg-transparent outline-none p-0 resize-none h-6 print:h-auto leading-normal ${!item.desc ? 'print:hidden' : ''}`}
                          />
                        </td>
                        <td className="py-3 px-2 text-center align-top">
                          <input
                            type="number"
                            min="1"
                            value={item.qty}
                            onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
                            className="w-full text-center bg-transparent border border-slate-200 rounded px-1 py-0.5 outline-none focus:border-accent text-xs print:border-none print:p-0"
                          />
                        </td>
                        <td className="py-3 px-2 text-center align-top">
                          <input
                            type="text"
                            value={item.unit}
                            onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                            className="w-full text-center bg-transparent border border-slate-200 rounded px-1 py-0.5 outline-none focus:border-accent text-xs text-slate-600 print:border-none print:p-0"
                          />
                        </td>
                        <td className="py-3 px-3 text-right align-top">
                          <input
                            type="number"
                            min="0"
                            value={item.rate}
                            onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))}
                            className="w-full text-right bg-transparent border border-slate-200 rounded px-1 py-0.5 outline-none focus:border-accent text-xs font-mono print:border-none print:p-0"
                          />
                        </td>
                        <td className="py-3 px-3 text-right align-top">
                          <input
                            type="number"
                            min="0"
                            value={item.discount}
                            onChange={(e) => updateItem(item.id, 'discount', Number(e.target.value))}
                            className="w-full text-right bg-transparent border border-slate-200 rounded px-1 py-0.5 outline-none focus:border-accent text-xs font-mono text-slate-600 print:border-none print:p-0"
                          />
                        </td>
                        <td className="py-3 px-2 text-center align-top">
                          <select
                            value={item.tax}
                            onChange={(e) => updateItem(item.id, 'tax', Number(e.target.value))}
                            className="bg-transparent border border-slate-200 rounded px-1 py-0.5 outline-none focus:border-accent text-xs text-slate-700 print:border-none print:p-0 print:appearance-none text-center"
                          >
                            <option value="13">13%</option>
                            <option value="0">0%</option>
                          </select>
                        </td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono text-xs align-top">
                          {lineAmount.toLocaleString('en-IN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </td>
                        <td className="py-3 px-1 text-center align-top print:hidden">
                          {items.length > 1 && (
                            <button
                              onClick={() => removeItem(item.id)}
                              className="p-1 text-slate-300 hover:text-red-600 transition-colors cursor-pointer"
                              title="Delete row"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Add Item Row Button (non-print only) */}
              <div className="mt-2.5 no-print">
                <button
                  onClick={addItem}
                  className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-accent-hover px-3 py-1.5 bg-accent/5 hover:bg-accent/10 rounded-lg transition-colors cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Item</span>
                </button>
              </div>
            </div>

            {/* 5. TOTALS SECTION, 6. BANK DETAILS, & 7. TERMS */}
            <div className="print-summary grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-200 mb-6 print:gap-3 print:pt-2 print:mb-2">
              {/* Left: Bank Details & Terms */}
              <div className="space-y-3 print:space-y-1.5">
                {/* 6. Bank Details */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    BANK DETAILS
                  </span>
                  <div className="bg-white/60 p-3 rounded-lg border border-slate-300/80 text-xs space-y-1 print:p-2 print:space-y-0.5">
                    <div className="grid grid-cols-[100px_1fr]">
                      <span className="text-slate-500 font-normal">Bank Name:</span>
                      <span className="font-semibold text-slate-800">{companySettings.bank_name || 'Global IME Bank'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr]">
                      <span className="text-slate-500 font-normal">Account Name:</span>
                      <span className="font-semibold text-slate-800">{companySettings.bank_account_name || companySettings.company_name}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr]">
                      <span className="text-slate-500 font-normal">Account No:</span>
                      <span className="font-mono font-semibold text-slate-900">{companySettings.bank_account_no || '01234567890123'}</span>
                    </div>
                    <div className="grid grid-cols-[100px_1fr]">
                      <span className="text-slate-500 font-normal">Branch:</span>
                      <span className="font-semibold text-slate-800">{companySettings.bank_branch || 'Baneshwor Branch'}</span>
                    </div>
                  </div>
                </div>

                {/* 7. Terms & Conditions */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    TERMS & CONDITIONS
                  </span>
                  <p className="text-[10.5px] text-slate-500 leading-relaxed whitespace-pre-line">
                    {companySettings.terms_conditions || 'Payment is required within 15 days of invoice date. All payments can be made via bank transfer to the account listed above.'}
                  </p>
                </div>
              </div>

              {/* Right: 5. Totals Section */}
              <div className="flex flex-col justify-start items-end">
                <div className="w-full max-w-[280px] space-y-1.5 text-xs print:space-y-1">
                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium">Subtotal:</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>

                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span className="font-medium">Discount:</span>
                      <span className="font-semibold text-emerald-600 font-mono">
                        -{formatCurrency(totalDiscount)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium">Taxable Amount:</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {formatCurrency(taxableAmount)}
                    </span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span className="font-medium">VAT ({companySettings.default_tax_rate ?? 13}%):</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {formatCurrency(totalTax)}
                    </span>
                  </div>

                  <div className="border-t-2 border-slate-900 pt-2 mt-1.5 flex justify-between items-baseline print:pt-1 print:mt-1">
                    <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">
                      Grand Total:
                    </span>
                    <span className="text-lg font-black text-slate-900 font-mono">
                      {formatCurrency(grandTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 8. SIGNATURE AREA - with ample vertical gap for signing and stamping */}
            <div className="print-signatures mt-6 pt-16 sm:pt-20 border-t border-slate-200 flex justify-between items-end print:mt-4 print:pt-14">
              <div className="text-left w-52">
                <div className="border-t border-slate-400 w-44 mb-2"></div>
                <p className="text-xs font-bold text-slate-900">Authorized Signature</p>
                <p className="text-[10px] text-slate-500">For {companySettings.company_name || 'ASLENIX TECH & SOLUTION'}</p>
              </div>

              <div className="text-right w-52">
                <div className="border-t border-slate-400 w-44 ml-auto mb-2"></div>
                <p className="text-xs font-bold text-slate-900">Customer Signature</p>
                <p className="text-[10px] text-slate-500">Received in good condition</p>
              </div>
            </div>

            {/* 9. OFFICIAL ASLENIX LETTERHEAD FOOTER (Lowered with generous spacing) */}
            <div className="print-footer mt-12 sm:mt-16 pt-3.5 border-t border-slate-900 print:mt-12 print:pt-2.5">
            <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-800 font-medium px-1">
              <div className="flex items-center gap-1.5">
                <Phone size={12} className="text-slate-950 shrink-0" />
                <span>{companySettings.phone || '+977 9709043147'}</span>
              </div>
              <span className="text-slate-300 font-light">|</span>
              <div className="flex items-center gap-1.5">
                <Mail size={12} className="text-blue-600 shrink-0" />
                <span>{companySettings.email || 'aslenixtech@gmail.com'}</span>
              </div>
              <span className="text-slate-300 font-light">|</span>
              <div className="flex items-center gap-1.5">
                <MapPin size={12} className="text-rose-600 shrink-0" />
                <span>{companySettings.address || 'Buddhanagar, Kathmandu'}</span>
              </div>
              <span className="text-slate-300 font-light">|</span>
              <div className="flex items-center gap-1.5">
                <Globe size={12} className="text-slate-700 shrink-0" />
                <span>{companySettings.website || 'www.aslenix.tech'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCreate;
