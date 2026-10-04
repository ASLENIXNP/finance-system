import { useState, useMemo } from 'react';
import { Search, Filter, CheckCircle2, AlertCircle, Edit, Trash2, Plus, RotateCcw } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { NepaliDatePicker } from '../components/NepaliDatePicker';
import { formatNepaliDate, toBsDateString, getTodayBsDate } from '../lib/nepaliDate';

export interface PaymentItem {
  id: string;
  date: string;
  invoice: string;
  customer: string;
  amount: number;
  method: string;
  ref: string;
  status: string;
}

const initialPaymentsData: PaymentItem[] = [
  { id: 'PAY-001', date: '2083-06-19', invoice: 'ASL-2083-0012', customer: 'Tech Innovations Pvt. Ltd.', amount: 45000, method: 'Bank Transfer', ref: 'NABIL123456789', status: 'Verified' },
  { id: 'PAY-002', date: '2083-06-18', invoice: 'ASL-2083-0014', customer: 'Everest Trading', amount: 15500, method: 'eSewa', ref: 'ESEWA987654', status: 'Verified' },
  { id: 'PAY-003', date: '2083-06-16', invoice: 'ASL-2083-0010', customer: 'Himalayan Coffee House', amount: 50000, method: 'Cheque', ref: 'CHQ-445566', status: 'Pending Clearance' },
  { id: 'PAY-004', date: '2083-06-13', invoice: 'ASL-2083-0008', customer: 'Individual Client', amount: 12000, method: 'Cash', ref: 'CASH-REC-11', status: 'Verified' },
];

const DELETED_PAYMENTS_KEY = 'aslenix_deleted_payments';

const getDeletedPaymentIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_PAYMENTS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const recordDeletedPaymentId = (id: string) => {
  try {
    const set = getDeletedPaymentIds();
    if (id) set.add(id);
    localStorage.setItem(DELETED_PAYMENTS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Failed to record deleted payment id:', e);
  }
};

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [methodFilter, setMethodFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [paymentsData, setPaymentsData] = useState<PaymentItem[]>(() => {
    const saved = localStorage.getItem('aslenix_payments');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const deletedIds = getDeletedPaymentIds();
          return parsed.filter(item => !deletedIds.has(item.id));
        }
      } catch (e) {}
    }
    const deletedIds = getDeletedPaymentIds();
    return initialPaymentsData.filter(item => !deletedIds.has(item.id));
  });

  const savePaymentsData = (data: PaymentItem[]) => {
    setPaymentsData(data);
    localStorage.setItem('aslenix_payments', JSON.stringify(data));
  };

  const methods = useMemo(() => {
    const set = new Set(paymentsData.map(item => item.method));
    return ['All', ...Array.from(set)];
  }, [paymentsData]);

  const filteredPaymentsData = useMemo(() => {
    return paymentsData.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        item.customer.toLowerCase().includes(q) ||
        item.invoice.toLowerCase().includes(q) ||
        item.ref.toLowerCase().includes(q) ||
        item.method.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);

      const matchesMethod = methodFilter === 'All' || item.method === methodFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesMethod && matchesStatus;
    });
  }, [paymentsData, searchTerm, methodFilter, statusFilter]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: getTodayBsDate(),
    to: '',
    amount: '',
    method: 'Bank Transfer',
    status: 'Cleared'
  });

  const resetForm = () => {
    setFormData({ date: getTodayBsDate(), to: '', amount: '', method: 'Bank Transfer', status: 'Cleared' });
    setEditingId(null);
  };

  const handleDeleteClick = (id: string) => {
    setPaymentToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (paymentToDelete) {
      recordDeletedPaymentId(paymentToDelete);
      const updated = paymentsData.filter(item => item.id !== paymentToDelete);
      savePaymentsData(updated);
      setDeleteModalOpen(false);
      setPaymentToDelete(null);
    }
  };

  const handleEditClick = (payment: any) => {
    setEditingId(payment.id);
    setFormData({
      date: payment.date,
      to: payment.customer || payment.to || '',
      amount: payment.amount.toString(),
      method: payment.method,
      status: payment.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = paymentsData.map(item => 
        item.id === editingId 
          ? { ...item, ...formData, customer: formData.to, amount: Number(formData.amount) } 
          : item
      );
      savePaymentsData(updated);
    } else {
      const newPayment = {
        id: `PAY-00${paymentsData.length + 1}`,
        date: formData.date,
        invoice: formData.to,
        customer: formData.to,
        amount: Number(formData.amount),
        method: formData.method,
        ref: `TXN-${Date.now().toString().slice(-5)}`,
        status: formData.status
      };
      savePaymentsData([newPayment, ...paymentsData]);
    }
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Payment Tracking</h2>
          <p className="text-slate-500 text-sm mt-1">Monitor all invoice payments, receipts, and bank clearances.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors shadow-sm flex-1 md:flex-none"
          >
            <Plus size={18} />
            Record Payment
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Table Header/Controls */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search payments by invoice, customer, or reference..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Method Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-sm">
              <Filter size={14} className="text-slate-400" />
              <span className="font-semibold text-slate-500">Method:</span>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
              >
                {methods.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-sm">
              <span className="font-semibold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
              >
                <option value="All">All Status</option>
                <option value="Verified">Verified</option>
                <option value="Pending Clearance">Pending Clearance</option>
              </select>
            </div>

            {(methodFilter !== 'All' || statusFilter !== 'All' || searchTerm) && (
              <button
                onClick={() => {
                  setMethodFilter('All');
                  setStatusFilter('All');
                  setSearchTerm('');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shadow-sm"
                title="Clear all filters"
              >
                <RotateCcw size={13} />
                Clear
              </button>
            )}

            <div className="text-xs text-slate-400 font-medium pl-1">
              Showing <span className="font-semibold text-slate-700">{filteredPaymentsData.length}</span> of {paymentsData.length}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Receipt ID / Date (BS मिति)</th>
                <th className="px-6 py-4">Customer & Invoice</th>
                <th className="px-6 py-4">Method & Ref</th>
                <th className="px-6 py-4 font-bold text-right">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPaymentsData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="font-medium text-slate-700">No payments match your filter criteria.</p>
                      <button 
                        onClick={() => {
                          setMethodFilter('All');
                          setStatusFilter('All');
                          setSearchTerm('');
                        }}
                        className="text-accent text-xs font-semibold hover:underline mt-1"
                      >
                        Reset filters to view all payments
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPaymentsData.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-primary">{payment.id}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{formatNepaliDate(payment.date, 'full')} BS</div>
                    <div className="text-slate-400 text-[10px] font-mono">{toBsDateString(payment.date)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-primary">{payment.customer}</div>
                    <div className="text-accent hover:underline cursor-pointer text-xs mt-0.5">{payment.invoice}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      {payment.method}
                    </span>
                    <div className="text-slate-500 text-xs mt-1.5 uppercase font-medium">{payment.ref}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="font-bold text-primary">रु. {payment.amount.toLocaleString('en-IN')}</span>
                  </td>
                  <td className="px-6 py-4">
                    {payment.status === 'Verified' ? (
                      <span className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-100">
                        <CheckCircle2 size={14} />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-100">
                        <AlertCircle size={14} />
                        Pending Clearance
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right relative overflow-hidden">
                    <div className="flex items-center justify-end transition-transform duration-300 group-hover:-translate-x-20 text-slate-400">
                      <span className="text-xs mr-2 opacity-0 group-hover:opacity-100 transition-opacity">Actions</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                    </div>
                    
                    <div className="absolute top-0 bottom-0 -right-24 group-hover:right-0 px-4 flex items-center justify-center gap-2 bg-slate-50 transition-all duration-300">
                      <button 
                        onClick={() => handleEditClick(payment)}
                        className="p-2 text-slate-400 hover:text-accent hover:bg-white rounded-lg transition-colors shadow-sm"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(payment.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Payment"
        message="Are you sure you want to delete this payment record? This action cannot be undone."
        confirmText="Delete Payment"
        isDanger={true}
      />

      {/* Add / Edit Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Payment' : 'Record Payment'}
              </h2>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <NepaliDatePicker 
                    label="Date (मिति)" 
                    value={formData.date} 
                    onChange={(val) => setFormData({ ...formData, date: val })} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Amount (रु.)</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">To (Recipient / Invoice)</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  value={formData.to}
                  onChange={(e) => setFormData({...formData, to: e.target.value})}
                  placeholder="e.g. INV-2023-001 or Client Name"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Payment Method</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    value={formData.method}
                    onChange={(e) => setFormData({...formData, method: e.target.value})}
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Cash">Cash</option>
                    <option value="Check">Check</option>
                    <option value="Credit Card">Credit Card</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                  <select
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Cleared">Cleared</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover font-medium transition-colors shadow-sm"
                >
                  {editingId ? 'Save Changes' : 'Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
