import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Plus, Trash2, Save, Printer } from 'lucide-react';
import { supabase } from '../lib/supabase';

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

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);

const addDays = (date: Date, days: number) => {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
};

const generateInvoiceNumber = (customerId?: string) => {
  const currentYear = new Date().getFullYear();
  const serial = Math.floor(1000 + Math.random() * 9000);
  const customerTag = customerId ? customerId.replace(/[^0-9]/g, '').slice(-3).padStart(3, '0') : '001';
  return `ASL-${String(currentYear).slice(-2)}-${customerTag}-${serial}`;
};

const InvoiceCreate = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const customerIdFromUrl = searchParams.get('customerId');

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerIdFromUrl || '');
  const [invoiceNumber, setInvoiceNumber] = useState(() => generateInvoiceNumber(customerIdFromUrl || undefined));
  const [invoiceDate, setInvoiceDate] = useState(() => new Date());
  const [dueDate, setDueDate] = useState(() => addDays(new Date(), 15));
  const [customerInfo, setCustomerInfo] = useState({
    name: 'Customer / Company Name',
    address: 'Customer address',
    pan: '',
    phone: '',
    email: '',
    customerRef: '',
  });

  const [items, setItems] = useState([
    { id: 1, name: 'Website Development', desc: 'Corporate website with CMS', qty: 1, unit: 'Project', rate: 150000, discount: 0, tax: 13 }
  ]);

  useEffect(() => {
    const fetchCustomers = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('company_name', { ascending: true });

      if (error) {
        return;
      }

      const customerList = data || [];
      setCustomers(customerList);

      const nextCustomerId = customerIdFromUrl
        ? customerList.find((customer) => customer.id === customerIdFromUrl)?.id
        : customerList[0]?.id ?? '';

      setSelectedCustomerId((current) => {
        if (customerIdFromUrl && customerList.some((customer) => customer.id === customerIdFromUrl)) {
          return customerIdFromUrl;
        }

        if (current && customerList.some((customer) => customer.id === current)) {
          return current;
        }

        return nextCustomerId;
      });
    };

    fetchCustomers();
  }, [customerIdFromUrl]);

  useEffect(() => {
    const activeCustomer = customers.find((customer) => customer.id === selectedCustomerId);

    if (!activeCustomer) {
      return;
    }

    setCustomerInfo({
      name: activeCustomer.company_name || activeCustomer.name || 'Customer / Company Name',
      address: activeCustomer.company_name ? `${activeCustomer.company_name}, Kathmandu, Nepal` : activeCustomer.name,
      pan: activeCustomer.pan_number || 'N/A',
      phone: activeCustomer.phone || 'N/A',
      email: activeCustomer.email || 'N/A',
      customerRef: activeCustomer.customer_id || 'CUST-0000',
    });

    const nextInvoiceDate = new Date();
    setInvoiceDate(nextInvoiceDate);
    setDueDate(addDays(nextInvoiceDate, 15));
    setInvoiceNumber(generateInvoiceNumber(activeCustomer.customer_id));
  }, [customers, selectedCustomerId]);

  const subtotal = items.reduce((acc, item) => acc + (item.qty * item.rate), 0);
  const totalDiscount = items.reduce((acc, item) => acc + item.discount, 0);
  const taxableAmount = subtotal - totalDiscount;
  const totalTax = items.reduce((acc, item) => {
    const itemSub = (item.qty * item.rate) - item.discount;
    return acc + (itemSub * (item.tax / 100));
  }, 0);
  const grandTotal = taxableAmount + totalTax;

  const addItem = () => {
    setItems([...items, {
      id: Date.now(),
      name: '',
      desc: '',
      qty: 1,
      unit: 'Pcs',
      rate: 0,
      discount: 0,
      tax: 13
    }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-center mb-6 no-print">
        <div>
          <h2 className="text-2xl font-bold text-primary">Create Invoice</h2>
          <p className="text-slate-500 text-sm mt-1">Generate a new professional invoice for your customers.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm">
            <Save size={18} />
            Save Draft
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors shadow-sm"
          >
            <Printer size={18} />
            Print Invoice
          </button>
        </div>
      </div>

      <div className="mb-6 no-print">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select customer</label>
        <select
          value={selectedCustomerId}
          onChange={(event) => setSelectedCustomerId(event.target.value)}
          className="w-full max-w-xl rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-accent"
        >
          {customers.length === 0 ? (
            <option value="">No customers available</option>
          ) : (
            customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.company_name || customer.name} ({customer.customer_id})
              </option>
            ))
          )}
        </select>
      </div>

      <div id="printable-invoice" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-none print:rounded-none print:p-0 print:m-0 print:w-full">
        <div className="print-header p-8 md:p-12 border-b border-slate-100 print:border-b-2 print:border-slate-800 print:p-0 print:pb-4">
          <div className="flex justify-between items-start flex-col md:flex-row print:flex-row gap-8 print:gap-4">
            <div className="flex items-center gap-6">
              <img src="/logo.png" alt="Aslenix Logo" className="h-20 w-auto object-contain" />
              <div>
                <h1 className="text-2xl md:text-3xl font-black tracking-tight text-primary uppercase print:text-black">
                  ASLENIX TECH AND SOLUTION
                </h1>
                <p className="text-slate-500 font-medium print:text-slate-700">Budhanagar, Kathmandu, Nepal</p>
                <div className="text-sm text-slate-500 mt-2 space-y-1 print:text-slate-600">
                  <p><span className="font-medium">PAN:</span> 123456789 (Placeholder)</p>
                  <p><span className="font-medium">Phone:</span> +977 1-4000000</p>
                  <p><span className="font-medium">Email:</span> contact@aslenix.com</p>
                  <p><span className="font-medium">Web:</span> www.aslenix.com</p>
                </div>
              </div>
            </div>
            <div className="md:text-right print:text-right w-full md:w-auto print:w-auto">
              <h2 className="text-4xl font-black text-slate-200 uppercase tracking-widest print:text-slate-400 mb-6 print:mb-3">INVOICE</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-left md:text-right print:text-right">
                <div className="font-semibold text-slate-500">Invoice No:</div>
                <div className="font-bold text-primary print:text-black">{invoiceNumber}</div>

                <div className="font-semibold text-slate-500">Date:</div>
                <div className="font-medium text-primary">{formatDate(invoiceDate)}</div>

                <div className="font-semibold text-slate-500">Due Date:</div>
                <div className="font-medium text-primary">{formatDate(dueDate)}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="print-billing p-8 md:p-12 border-b border-slate-100 bg-slate-50/50 print:bg-transparent print:p-0 print:py-4">
          <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-12 print:gap-8">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Billed To</h3>
              <div className="space-y-4 print:space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <input
                    type="text"
                    placeholder="Customer / Company Name"
                    className="w-full text-xl font-bold text-primary bg-transparent border-none p-0 focus:ring-0 placeholder-slate-300 print:text-black"
                    value={customerInfo.name}
                    onChange={(event) => setCustomerInfo((current) => ({ ...current, name: event.target.value }))}
                  />
                  <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    {customerInfo.customerRef}
                  </span>
                </div>
                <textarea
                  placeholder="Customer Address"
                  className="w-full text-slate-600 bg-transparent border-none p-0 focus:ring-0 resize-none h-16 print:h-auto"
                  value={customerInfo.address}
                  onChange={(event) => setCustomerInfo((current) => ({ ...current, address: event.target.value }))}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">PAN/VAT No.</label>
                    <input
                      type="text"
                      className="w-full text-sm text-primary bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-accent outline-none print:border-none print:p-0 print:bg-transparent"
                      value={customerInfo.pan}
                      onChange={(event) => setCustomerInfo((current) => ({ ...current, pan: event.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Phone</label>
                    <input
                      type="text"
                      className="w-full text-sm text-primary bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-accent outline-none print:border-none print:p-0 print:bg-transparent"
                      value={customerInfo.phone}
                      onChange={(event) => setCustomerInfo((current) => ({ ...current, phone: event.target.value }))}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full text-sm text-primary bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-accent outline-none print:border-none print:p-0 print:bg-transparent"
                      value={customerInfo.email}
                      onChange={(event) => setCustomerInfo((current) => ({ ...current, email: event.target.value }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm print:border-slate-300 print:shadow-none">
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Payment Status</h3>
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-sm font-bold border border-red-100 uppercase tracking-wider print:border-red-600">Unpaid</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Total Amount:</span>
                  <span className="font-bold text-primary">रु. {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Amount Paid:</span>
                  <span className="font-bold text-primary">रु. 0.00</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-700 font-bold">Balance Due:</span>
                  <span className="font-bold text-red-600 text-base">रु. {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="print-items p-8 md:p-12 overflow-x-auto print:p-0 print:py-3 print:overflow-visible">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 print:border-black text-sm uppercase tracking-wider text-slate-400 font-bold">
                <th className="pb-4 w-10 text-center print:pb-2 print:text-black">S.N.</th>
                <th className="pb-4 w-auto print:pb-2 print:text-black">Item Details</th>
                <th className="pb-4 text-center w-16 print:pb-2 print:text-black">Qty</th>
                <th className="pb-4 text-center w-16 print:pb-2 print:text-black">Unit</th>
                <th className="pb-4 text-right w-24 print:pb-2 print:text-black whitespace-nowrap">Rate (Rs)</th>
                <th className="pb-4 text-right w-20 print:pb-2 print:text-black whitespace-nowrap">Disc (Rs)</th>
                <th className="pb-4 text-right w-16 print:pb-2 print:text-black whitespace-nowrap">Tax (%)</th>
                <th className="pb-4 text-right w-28 print:pb-2 print:text-black whitespace-nowrap">Amount (Rs)</th>
                <th className="pb-4 w-12 print:hidden"></th>
              </tr>
            </thead>
            <tbody className="text-slate-700 text-sm align-top">
              {items.map((item, index) => (
                <tr key={item.id} className="border-b border-slate-100 group">
                  <td className="py-4 text-center font-medium text-slate-400">{index + 1}</td>
                  <td className="py-4 pr-4">
                    <input type="text" className="w-full font-bold text-primary bg-transparent outline-none print:p-0" defaultValue={item.name} placeholder="Item Name" />
                    <textarea className="w-full text-slate-500 text-xs mt-1 bg-transparent outline-none resize-none h-10 print:h-auto print:p-0" defaultValue={item.desc} placeholder="Item Description" />
                  </td>
                  <td className="py-4 px-2">
                    <input type="number" className="w-full text-center bg-white border border-slate-200 rounded p-1 outline-none focus:border-accent print:border-none print:bg-transparent print:p-0" defaultValue={item.qty} />
                  </td>
                  <td className="py-4 px-2">
                    <input type="text" className="w-full text-center bg-white border border-slate-200 rounded p-1 outline-none focus:border-accent print:border-none print:bg-transparent print:p-0" defaultValue={item.unit} />
                  </td>
                  <td className="py-4 px-2">
                    <input type="number" className="w-full text-right bg-white border border-slate-200 rounded p-1 outline-none focus:border-accent print:border-none print:bg-transparent print:p-0" defaultValue={item.rate} />
                  </td>
                  <td className="py-4 px-2">
                    <input type="number" className="w-full text-right bg-white border border-slate-200 rounded p-1 outline-none focus:border-accent print:border-none print:bg-transparent print:p-0" defaultValue={item.discount} />
                  </td>
                  <td className="py-4 px-2">
                    <select className="w-full text-right bg-white border border-slate-200 rounded p-1 outline-none focus:border-accent print:appearance-none print:border-none print:bg-transparent print:p-0" defaultValue="13">
                      <option value="0">0%</option>
                      <option value="13">13% (VAT)</option>
                    </select>
                  </td>
                  <td className="py-4 text-right font-bold text-primary">
                    {((item.qty * item.rate) - item.discount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-4 text-center print:hidden">
                    <button onClick={() => removeItem(item.id)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-4 print:hidden">
            <button onClick={addItem} className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent-hover px-4 py-2 bg-accent/5 rounded-lg transition-colors">
              <Plus size={16} /> Add Item
            </button>
          </div>
        </div>

        <div className="print-summary p-8 md:p-12 flex flex-col md:flex-row print:flex-row justify-between items-start gap-12 print:gap-8 bg-slate-50/30 print:bg-transparent border-t border-slate-100 print:border-black print:p-0 print:py-4">
          <div className="w-full md:w-1/2 print:w-1/2 space-y-6 print:space-y-3">
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-2">Bank Details</h4>
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-sm print:border-none print:p-0 print:bg-transparent">
                <p><span className="font-semibold text-slate-500 w-32 inline-block">Bank Name:</span> <span className="font-medium text-primary">Global IME Bank</span></p>
                <p><span className="font-semibold text-slate-500 w-32 inline-block">Account Name:</span> <span className="font-medium text-primary">Aslenix Tech and Solution</span></p>
                <p><span className="font-semibold text-slate-500 w-32 inline-block">Account No:</span> <span className="font-medium text-primary">01234567890123</span></p>
                <p><span className="font-semibold text-slate-500 w-32 inline-block">Branch:</span> <span className="font-medium text-primary">Baneshwor Branch</span></p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-700 mb-2">Terms & Conditions</h4>
              <textarea
                className="w-full text-xs text-slate-500 bg-transparent outline-none resize-none h-24 print:h-auto"
                defaultValue={"1. Payment is required within 15 days of invoice date.\n2. Late payments may be subject to a 2% monthly fee.\n3. All disputes are subject to Kathmandu jurisdiction."}
              />
            </div>
          </div>

          <div className="w-full md:w-80 print:w-72 space-y-3 print:space-y-1.5">
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-slate-500">Subtotal:</span>
              <span className="font-medium text-primary">रु. {subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            {totalDiscount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="font-semibold text-slate-500">Discount:</span>
                <span className="font-medium text-emerald-600">- रु. {totalDiscount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="flex justify-between text-sm pb-3 border-b border-slate-200">
              <span className="font-semibold text-slate-500">Taxable Amount:</span>
              <span className="font-medium text-primary">रु. {taxableAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-semibold text-slate-500">VAT (13%):</span>
              <span className="font-medium text-primary">रु. {totalTax.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center pt-4 border-t-2 border-slate-800 print:border-black mt-2">
              <span className="font-bold text-lg text-primary">Grand Total:</span>
              <span className="font-black text-2xl text-accent print:text-black">रु. {grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        <div className="print-signatures p-8 md:p-12 pt-0 mt-8 md:mt-16 print:mt-6 flex justify-between items-end print:p-0 print:pt-4">
          <div className="text-center w-48">
            <div className="border-b border-slate-300 h-10 mb-2"></div>
            <p className="text-sm font-bold text-primary">Authorized Signature</p>
            <p className="text-xs text-slate-500">For Aslenix Tech and Solution</p>
          </div>
          <div className="text-center w-48">
            <div className="border-b border-slate-300 h-10 mb-2"></div>
            <p className="text-sm font-bold text-primary">Customer Signature</p>
            <p className="text-xs text-slate-500">Received in good condition</p>
          </div>
        </div>

        <div className="print-footer bg-slate-800 text-slate-400 text-center py-4 text-xs mt-8 print:bg-transparent print:text-black print:border-t print:border-slate-300">
          Thank you for your business!
        </div>
      </div>
    </div>
  );
};

export default InvoiceCreate;
