import { useState, useMemo } from 'react';
import { Search, Plus, Filter, ArrowDownRight, Wallet, Edit, Trash2, RotateCcw } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { NepaliDatePicker } from '../components/NepaliDatePicker';
import { formatNepaliDate, toBsDateString, getTodayBsDate } from '../lib/nepaliDate';

export interface IncomeItem {
  id: string;
  date: string;
  invoice: string;
  customer: string;
  category: string;
  amount: number;
  method: string;
  status: string;
}

const initialIncomeData: IncomeItem[] = [
  { id: 'INC-001', date: '2083-06-15', invoice: 'ASL-2083-0012', customer: 'Tech Innovations Pvt. Ltd.', category: 'Web Development', amount: 45000, method: 'Bank Transfer', status: 'Completed' },
  { id: 'INC-002', date: '2083-06-12', invoice: 'ASL-2083-0011', customer: 'Himalayan Coffee House', category: 'UI/UX Design', amount: 15500, method: 'eSewa', status: 'Completed' },
  { id: 'INC-003', date: '2083-06-09', invoice: 'ASL-2083-0009', customer: 'Retail Solutions', category: 'Software Development', amount: 85000, method: 'Cheque', status: 'Pending' },
  { id: 'INC-004', date: '2083-06-04', invoice: 'Manual Entry', customer: 'Freelance Client', category: 'Consulting', amount: 12000, method: 'Cash', status: 'Completed' },
];

const Income = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [incomeData, setIncomeData] = useState<IncomeItem[]>(() => {
    const saved = localStorage.getItem('aslenix_income');
    return saved ? JSON.parse(saved) : initialIncomeData;
  });

  const saveIncomeData = (data: IncomeItem[]) => {
    setIncomeData(data);
    localStorage.setItem('aslenix_income', JSON.stringify(data));
  };

  const categories = useMemo(() => {
    const set = new Set(incomeData.map(item => item.category));
    return ['All', ...Array.from(set)];
  }, [incomeData]);

  const methods = useMemo(() => {
    const set = new Set(incomeData.map(item => item.method));
    return ['All', ...Array.from(set)];
  }, [incomeData]);

  const filteredIncomeData = useMemo(() => {
    return incomeData.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        item.customer.toLowerCase().includes(q) ||
        item.invoice.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.method.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q);

      const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesMethod = methodFilter === 'All' || item.method === methodFilter;
      const matchesStatus = statusFilter === 'All' || item.status === statusFilter;

      return matchesSearch && matchesCat && matchesMethod && matchesStatus;
    });
  }, [incomeData, searchTerm, categoryFilter, methodFilter, statusFilter]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: getTodayBsDate(),
    source: 'Software Development',
    amount: '',
    reference: ''
  });

  const resetForm = () => {
    setFormData({ date: getTodayBsDate(), source: 'Software Development', amount: '', reference: '' });
    setEditingId(null);
  };

  const handleDeleteClick = (id: string) => {
    setIncomeToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (incomeToDelete) {
      const updated = incomeData.filter(item => item.id !== incomeToDelete);
      saveIncomeData(updated);
      setDeleteModalOpen(false);
      setIncomeToDelete(null);
    }
  };

  const handleEditClick = (income: any) => {
    setEditingId(income.id);
    setFormData({
      date: income.date,
      source: income.customer || income.source || '',
      amount: income.amount.toString(),
      reference: income.invoice || income.reference || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = incomeData.map(item => 
        item.id === editingId 
          ? { 
              ...item, 
              date: formData.date,
              customer: formData.source || item.customer,
              amount: Number(formData.amount),
              invoice: formData.reference || item.invoice
            } 
          : item
      );
      saveIncomeData(updated);
    } else {
      const newIncome = {
        id: `INC-00${incomeData.length + 1}`,
        date: formData.date,
        customer: formData.source || 'General Client',
        invoice: formData.reference || `INV-${Date.now().toString().slice(-4)}`,
        category: 'Consulting / Tech',
        amount: Number(formData.amount),
        method: 'Bank Transfer',
        status: 'Completed'
      };
      saveIncomeData([newIncome, ...incomeData]);
    }
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Income</h2>
          <p className="text-slate-500 text-sm mt-1">Track all revenue, invoice payments, and other income sources.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors shadow-sm flex-1 md:flex-none"
          >
            <Plus size={18} />
            Record Income
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
            <Wallet size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Income (This Month)</p>
            <h3 className="text-2xl font-bold text-primary">रु. 1,45,000</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <ArrowDownRight size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Pending Payments</p>
            <h3 className="text-2xl font-bold text-primary">रु. 85,000</h3>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Table Header/Controls */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by customer, invoice, category, or ref..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-sm">
              <Filter size={14} className="text-slate-400" />
              <span className="font-semibold text-slate-500">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Method Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-sm">
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
                <option value="Completed">Completed</option>
                <option value="Pending">Pending</option>
              </select>
            </div>

            {(categoryFilter !== 'All' || methodFilter !== 'All' || statusFilter !== 'All' || searchTerm) && (
              <button
                onClick={() => {
                  setCategoryFilter('All');
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
              Showing <span className="font-semibold text-slate-700">{filteredIncomeData.length}</span> of {incomeData.length}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Date (BS मिति) / Ref</th>
                <th className="px-6 py-4">Customer & Category</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredIncomeData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p className="font-medium text-slate-700">No income records match your filter criteria.</p>
                      <button 
                        onClick={() => {
                          setCategoryFilter('All');
                          setMethodFilter('All');
                          setStatusFilter('All');
                          setSearchTerm('');
                        }}
                        className="text-accent text-xs font-semibold hover:underline mt-1"
                      >
                        Reset filters to view all records
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredIncomeData.map((income) => (
                <tr key={income.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-primary">{formatNepaliDate(income.date, 'full')} BS</div>
                    <div className="text-slate-400 text-xs font-mono">{toBsDateString(income.date)} • {income.invoice}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{income.customer}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{income.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      {income.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-emerald-600">
                    + रु. {income.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      income.status === 'Completed' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-amber-50 text-amber-700 border-amber-200'
                    }`}>
                      {income.status}
                    </span>
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
                        onClick={() => handleEditClick(income)}
                        className="p-2 text-slate-400 hover:text-accent hover:bg-white rounded-lg transition-colors shadow-sm"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(income.id)}
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
        title="Delete Income"
        message="Are you sure you want to delete this income record? This action cannot be undone."
        confirmText="Delete Income"
        isDanger={true}
      />

      {/* Add / Edit Income Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-slate-100">
              <h2 className="text-xl font-bold text-slate-800">
                {editingId ? 'Edit Income' : 'Record Income'}
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
                <label className="block text-sm font-medium text-slate-700 mb-1">Source / Category</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  value={formData.source}
                  onChange={(e) => setFormData({...formData, source: e.target.value})}
                >
                  <option value="Software Development">Software Development</option>
                  <option value="Web Design">Web Design</option>
                  <option value="Consulting">Consulting</option>
                  <option value="Maintenance Retainer">Maintenance Retainer</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reference (Optional)</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  value={formData.reference}
                  onChange={(e) => setFormData({...formData, reference: e.target.value})}
                  placeholder="e.g. INV-2023-001"
                />
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
                  {editingId ? 'Save Changes' : 'Save Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Income;
