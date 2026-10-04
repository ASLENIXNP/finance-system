import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Edit, 
  Trash2, 
  Plus, 
  RotateCcw,
  CreditCard,
  CheckCircle,
  Clock,
  Landmark,
  Download,
  X,
  Copy,
  Check,
  Building2
} from 'lucide-react';
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
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [paymentsData, setPaymentsData] = useState<PaymentItem[]>(() => {
    const deletedIds = getDeletedPaymentIds();
    const saved = localStorage.getItem('aslenix_payments');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => !deletedIds.has(item.id));
        }
      } catch (e) {}
    }
    return initialPaymentsData.filter(item => !deletedIds.has(item.id));
  });

  const savePaymentsData = (data: PaymentItem[]) => {
    setPaymentsData(data);
    localStorage.setItem('aslenix_payments', JSON.stringify(data));
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Dynamic statistics
  const stats = useMemo(() => {
    const totalAmount = paymentsData.reduce((acc, p) => acc + (p.amount || 0), 0);
    const verifiedPayments = paymentsData.filter(p => p.status === 'Verified');
    const verifiedAmount = verifiedPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
    
    const pendingPayments = paymentsData.filter(p => p.status === 'Pending Clearance');
    const pendingAmount = pendingPayments.reduce((acc, p) => acc + (p.amount || 0), 0);

    // Method counts
    const methodCounts: Record<string, number> = {};
    paymentsData.forEach(p => {
      methodCounts[p.method] = (methodCounts[p.method] || 0) + p.amount;
    });
    let topMethod = 'None';
    let topAmount = 0;
    Object.entries(methodCounts).forEach(([m, amt]) => {
      if (amt > topAmount) {
        topAmount = amt;
        topMethod = m;
      }
    });

    return {
      totalAmount,
      verifiedCount: verifiedPayments.length,
      verifiedAmount,
      pendingCount: pendingPayments.length,
      pendingAmount,
      topMethod,
      topAmount
    };
  }, [paymentsData]);

  // Export CSV
  const handleExportCSV = () => {
    if (paymentsData.length === 0) return;
    const headers = ['Receipt ID', 'Date (BS)', 'Customer', 'Invoice Ref', 'Method', 'Reference Code', 'Amount (NPR)', 'Status'];
    const rows = filteredPaymentsData.map(p => [
      `"${p.id}"`,
      `"${p.date}"`,
      `"${p.customer.replace(/"/g, '""')}"`,
      `"${p.invoice}"`,
      `"${p.method}"`,
      `"${p.ref}"`,
      p.amount,
      `"${p.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aslenix_payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
    invoice: '',
    amount: '',
    method: 'Bank Transfer',
    ref: '',
    status: 'Verified'
  });

  const resetForm = () => {
    setFormData({ 
      date: getTodayBsDate(), 
      to: '', 
      invoice: '',
      amount: '', 
      method: 'Bank Transfer', 
      ref: '',
      status: 'Verified' 
    });
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

  const handleEditClick = (payment: PaymentItem) => {
    setEditingId(payment.id);
    setFormData({
      date: payment.date,
      to: payment.customer || '',
      invoice: payment.invoice || '',
      amount: payment.amount.toString(),
      method: payment.method,
      ref: payment.ref || '',
      status: payment.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = paymentsData.map(item => 
        item.id === editingId 
          ? { 
              ...item, 
              customer: formData.to, 
              invoice: formData.invoice || item.invoice,
              amount: Number(formData.amount),
              method: formData.method,
              ref: formData.ref || item.ref,
              date: formData.date,
              status: formData.status
            } 
          : item
      );
      savePaymentsData(updated);
    } else {
      const newPayment: PaymentItem = {
        id: `PAY-00${paymentsData.length + 1}`,
        date: formData.date,
        invoice: formData.invoice || `INV-${Date.now().toString().slice(-4)}`,
        customer: formData.to,
        amount: Number(formData.amount),
        method: formData.method,
        ref: formData.ref || `TXN-${Date.now().toString().slice(-5)}`,
        status: formData.status
      };
      savePaymentsData([newPayment, ...paymentsData]);
    }
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">Payment Tracking</h1>
          <p className="text-slate-500 text-sm mt-1">Monitor all invoice payments, client receipts, and bank settlements.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={handleExportCSV}
            disabled={paymentsData.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex-1 sm:flex-none"
          >
            <Download size={16} className="text-slate-500" />
            Export
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent-hover transition-all shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 cursor-pointer flex-1 sm:flex-none"
          >
            <Plus size={18} />
            Record Payment
          </button>
        </div>
      </div>

      {/* 4 Dynamic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle size={20} />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Verified
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Settled Receipts</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900">रु. {stats.verifiedAmount.toLocaleString('en-IN')}</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{stats.verifiedCount} verified transactions</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={20} />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Pending
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Clearance</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-amber-600">रु. {stats.pendingAmount.toLocaleString('en-IN')}</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{stats.pendingCount} cheques / in review</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Landmark size={20} />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              Top Method
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Primary Channel</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-xl font-bold text-slate-900 truncate">{stats.topMethod}</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">रु. {stats.topAmount.toLocaleString('en-IN')} processed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <CreditCard size={20} />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Total Volume
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gross Collections</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-purple-700">रु. {stats.totalAmount.toLocaleString('en-IN')}</h3>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{paymentsData.length} total recorded vouchers</p>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Table Header/Controls */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input 
              type="text" 
              placeholder="Search payments by invoice, customer, or reference..." 
              className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Method Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-sm">
              <Filter size={13} className="text-slate-400" />
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
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shadow-sm cursor-pointer"
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
            <thead className="bg-slate-50/80 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Receipt ID & Date (BS मिति)</th>
                <th className="px-6 py-3.5">Customer & Invoice</th>
                <th className="px-6 py-3.5">Method & Reference</th>
                <th className="px-6 py-3.5 font-bold text-right">Amount (रु.)</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredPaymentsData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-14 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <CreditCard size={24} />
                      </div>
                      <p className="font-semibold text-slate-700 mt-1">No payments match your criteria</p>
                      <p className="text-xs text-slate-400 max-w-sm">Try broadening your search keyword or clearing the filters.</p>
                      <button 
                        onClick={() => {
                          setMethodFilter('All');
                          setStatusFilter('All');
                          setSearchTerm('');
                        }}
                        className="text-accent text-xs font-semibold hover:underline mt-2 cursor-pointer"
                      >
                        Reset filters to view all payments
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredPaymentsData.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-primary">{payment.id}</span>
                        <button
                          onClick={(e) => handleCopyId(payment.id, e)}
                          className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 hover:text-accent bg-slate-100 hover:bg-accent/10 px-1.5 py-0.5 rounded transition-colors"
                          title="Click to copy Receipt ID"
                        >
                          {copiedId === payment.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                          Copy
                        </button>
                      </div>
                      <div className="text-slate-600 text-xs mt-0.5 font-medium">{formatNepaliDate(payment.date, 'full')} BS</div>
                      <div className="text-slate-400 text-[10px] font-mono">{toBsDateString(payment.date)}</div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-slate-400" />
                        <span className="font-semibold text-slate-900">{payment.customer}</span>
                      </div>
                      <div className="text-accent text-xs mt-0.5 font-mono">{payment.invoice}</div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold">
                        {payment.method}
                      </span>
                      <div className="text-slate-400 text-xs mt-1 uppercase font-mono">{payment.ref}</div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <span className="font-bold text-slate-900 text-base">रु. {payment.amount.toLocaleString('en-IN')}</span>
                    </td>

                    <td className="px-6 py-4">
                      {payment.status === 'Verified' ? (
                        <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-200">
                          <CheckCircle2 size={13} />
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-200">
                          <AlertCircle size={13} />
                          Pending Clearance
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleEditClick(payment)}
                          className="p-1.5 text-slate-400 hover:text-accent hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit payment"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(payment.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete payment"
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
        message="Are you sure you want to delete this payment record? This action is permanent."
        confirmText="Delete Record"
        isDanger={true}
      />

      {/* Record / Edit Payment Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingId ? 'Edit Payment Receipt' : 'Record Received Payment'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingId ? 'Modify payment receipt details' : 'Log a settled or pending payment against an invoice'}
                </p>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Payment Date (BS)</label>
                  <NepaliDatePicker 
                    value={formData.date}
                    onChange={(bsDate) => setFormData({ ...formData, date: bsDate })}
                    placeholder="YYYY-MM-DD"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Amount (रु. NPR)</label>
                  <input 
                    type="number" 
                    required
                    min="1"
                    step="any"
                    placeholder="e.g. 25000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all font-semibold"
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Customer Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Tech Innovations Pvt. Ltd."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all"
                    value={formData.to}
                    onChange={(e) => setFormData({...formData, to: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Invoice Number</label>
                  <input 
                    type="text" 
                    placeholder="e.g. ASL-2083-0012"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all font-mono"
                    value={formData.invoice}
                    onChange={(e) => setFormData({...formData, invoice: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Payment Method</label>
                  <select
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all cursor-pointer"
                    value={formData.method}
                    onChange={(e) => setFormData({...formData, method: e.target.value})}
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="eSewa">eSewa</option>
                    <option value="Khalti">Khalti</option>
                    <option value="ConnectIPS">ConnectIPS</option>
                    <option value="Cheque">Cheque</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Transaction Reference</label>
                  <input 
                    type="text" 
                    placeholder="e.g. NABIL987654 or CHQ-002"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all font-mono uppercase"
                    value={formData.ref}
                    onChange={(e) => setFormData({...formData, ref: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Verification Status</label>
                <select
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all cursor-pointer"
                  value={formData.status}
                  onChange={(e) => setFormData({...formData, status: e.target.value})}
                >
                  <option value="Verified">Verified & Settled</option>
                  <option value="Pending Clearance">Pending Clearance (Cheque/Hold)</option>
                </select>
              </div>
              
              <div className="pt-5 mt-5 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover font-semibold text-sm transition-all shadow-md shadow-accent/20 cursor-pointer"
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
