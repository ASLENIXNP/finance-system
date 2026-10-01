import { useState } from 'react';
import { Search, Plus, Filter, ArrowDownRight, Wallet, Edit, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const initialIncomeData = [
  { id: 'INC-001', date: 'Oct 01, 2026', invoice: 'ASL-2083-0012', customer: 'Tech Innovations Pvt. Ltd.', category: 'Web Development', amount: 45000, method: 'Bank Transfer', status: 'Completed' },
  { id: 'INC-002', date: 'Sep 28, 2026', invoice: 'ASL-2083-0011', customer: 'Himalayan Coffee House', category: 'UI/UX Design', amount: 15500, method: 'eSewa', status: 'Completed' },
  { id: 'INC-003', date: 'Sep 25, 2026', invoice: 'ASL-2083-0009', customer: 'Retail Solutions', category: 'Software Development', amount: 85000, method: 'Cheque', status: 'Pending' },
  { id: 'INC-004', date: 'Sep 20, 2026', invoice: 'Manual Entry', customer: 'Freelance Client', category: 'Consulting', amount: 12000, method: 'Cash', status: 'Completed' },
];

const Income = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [incomeData, setIncomeData] = useState(initialIncomeData);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<string | null>(null);
  
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleDeleteClick = (id: string) => {
    setIncomeToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (incomeToDelete) {
      setIncomeData(incomeData.filter(item => item.id !== incomeToDelete));
      setIncomeToDelete(null);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Income</h2>
          <p className="text-slate-500 text-sm mt-1">Track all revenue, invoice payments, and other income sources.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors shadow-sm flex-1 md:flex-none">
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
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search income records..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors w-full md:w-auto justify-center">
              <Filter size={16} />
              Filters
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">Date / Ref</th>
                <th className="px-6 py-4">Customer & Category</th>
                <th className="px-6 py-4">Payment Method</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {incomeData.map((income) => (
                <tr key={income.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-primary">{income.date}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{income.invoice}</div>
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
                        onClick={() => {
                          setAlertMessage(`Edit feature for ${income.id} is coming soon!`);
                          setAlertModalOpen(true);
                        }}
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
              ))}
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

      <ConfirmModal 
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        onConfirm={() => {}}
        title="Coming Soon"
        message={alertMessage}
        confirmText="Got it"
        hideCancel={true}
      />
    </div>
  );
};

export default Income;
