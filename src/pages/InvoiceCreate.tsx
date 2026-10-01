import { useState } from 'react';
import { Plus, Trash2, Save, Printer } from 'lucide-react';

const InvoiceCreate = () => {
  const [items, setItems] = useState([
    { id: 1, name: 'Website Development', desc: 'Corporate website with CMS', qty: 1, unit: 'Project', rate: 150000, discount: 0, tax: 13 }
  ]);

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

      <div id="printable-invoice" className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden print:shadow-none print:border-none print:rounded-none">
        {/* Print Header - Only visible when printing or in normal view to show structure */}
        <div className="p-8 md:p-12 border-b border-slate-100 print:border-b-2 print:border-slate-800">
          <div className="flex justify-between items-start flex-col md:flex-row gap-8">
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
            <div className="md:text-right w-full md:w-auto">
              <h2 className="text-4xl font-black text-slate-200 uppercase tracking-widest print:text-slate-400 mb-6">INVOICE</h2>
              <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-left md:text-right">
                <div className="font-semibold text-slate-500">Invoice No:</div>
                <div className="font-bold text-primary print:text-black">ASL-2083-0013</div>
                
                <div className="font-semibold text-slate-500">Date:</div>
                <div className="font-medium text-primary">Oct 01, 2026</div>
                
                <div className="font-semibold text-slate-500">Due Date:</div>
                <div className="font-medium text-primary">Oct 15, 2026</div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 border-b border-slate-100 bg-slate-50/50 print:bg-transparent">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Billed To</h3>
              <div className="space-y-4 print:space-y-2">
                <input 
                  type="text" 
                  placeholder="Customer / Company Name" 
                  className="w-full text-xl font-bold text-primary bg-transparent border-none p-0 focus:ring-0 placeholder-slate-300 print:text-black"
                  defaultValue="Tech Innovations Pvt. Ltd."
                />
                <textarea 
                  placeholder="Customer Address"
                  className="w-full text-slate-600 bg-transparent border-none p-0 focus:ring-0 resize-none h-16 print:h-auto"
                  defaultValue={"Lazimpat, Kathmandu\nBagmati Province, Nepal"}
                />
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">PAN/VAT No.</label>
                    <input type="text" className="w-full text-sm text-primary bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-accent outline-none print:border-none print:p-0 print:bg-transparent" defaultValue="304123456" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1">Phone</label>
                    <input type="text" className="w-full text-sm text-primary bg-white border border-slate-200 rounded-lg px-3 py-2 focus:ring-1 focus:ring-accent outline-none print:border-none print:p-0 print:bg-transparent" defaultValue="+977 9801234567" />
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
                  <span className="font-bold text-primary">रु. 1,69,500.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Amount Paid:</span>
                  <span className="font-bold text-primary">रु. 0.00</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-700 font-bold">Balance Due:</span>
                  <span className="font-bold text-red-600 text-base">रु. 1,69,500.00</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 md:p-12 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-200 print:border-black text-sm uppercase tracking-wider text-slate-400 font-bold">
                <th className="pb-4 w-12 text-center">S.N.</th>
                <th className="pb-4 w-1/3">Item Details</th>
                <th className="pb-4 text-center">Qty</th>
                <th className="pb-4 text-center">Unit</th>
                <th className="pb-4 text-right">Rate (Rs)</th>
                <th className="pb-4 text-right">Disc (Rs)</th>
                <th className="pb-4 text-right">Tax (%)</th>
                <th className="pb-4 text-right">Amount (Rs)</th>
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
                    <select className="w-full text-right bg-white border border-slate-200 rounded p-1 outline-none focus:border-accent print:appearance-none print:border-none print:bg-transparent print:p-0">
                      <option value="0">0%</option>
                      <option value="13" selected>13% (VAT)</option>
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

        <div className="p-8 md:p-12 flex flex-col md:flex-row justify-between items-start gap-12 bg-slate-50/30 print:bg-transparent border-t border-slate-100 print:border-black">
          <div className="w-full md:w-1/2 space-y-6">
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
          
          <div className="w-full md:w-80 space-y-3">
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
        
        <div className="p-8 md:p-12 pt-0 mt-8 md:mt-16 flex justify-between items-end">
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
        
        <div className="bg-slate-800 text-slate-400 text-center py-4 text-xs mt-8 print:bg-transparent print:text-black print:border-t print:border-slate-300">
          Thank you for your business!
        </div>
      </div>
    </div>
  );
};

export default InvoiceCreate;
