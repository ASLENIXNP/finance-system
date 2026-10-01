import { useState } from 'react';
import { Search, Plus, Filter, CreditCard, ArrowUpRight, Edit, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const initialExpenseData = [
  { id: 'EXP-001', date: 'Oct 02, 2026', vendor: 'Vianet Communications', category: 'Office / Internet', amount: 3500, method: 'eSewa', receipt: 'REC-1029' },
  { id: 'EXP-002', date: 'Oct 01, 2026', vendor: 'Digital Ocean', category: 'Technology / Cloud Services', amount: 6500, method: 'Credit Card', receipt: 'INV-DO-992' },
  { id: 'EXP-003', date: 'Sep 28, 2026', vendor: 'Kathmandu Properties', category: 'Office / Rent', amount: 45000, method: 'Bank Transfer', receipt: 'RENT-Sep' },
  { id: 'EXP-004', date: 'Sep 25, 2026', vendor: 'Facebook Ads', category: 'Marketing / Social Media', amount: 15000, method: 'Credit Card', receipt: 'FB-8821' },
];

const Expenses = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expenseData, setExpenseData] = useState(initialExpenseData);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleDeleteClick = (id: string) => {
    setExpenseToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (expenseToDelete) {
      setExpenseData(expenseData.filter(item => item.id !== expenseToDelete));
      setExpenseToDelete(null);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Expenditure</h2>
          <p className="text-slate-500 text-sm mt-1">Track and manage company expenses and outgoings.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors shadow-sm flex-1 md:flex-none">
            <Plus size={18} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
            <CreditCard size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Total Expenses (This Month)</p>
            <h3 className="text-2xl font-bold text-primary">रु. 70,000</h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-600">
            <ArrowUpRight size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Highest Category</p>
            <h3 className="text-lg font-bold text-primary">Office Rent</h3>
            <p className="text-xs text-slate-400">रु. 45,000</p>
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
              placeholder="Search expenses by vendor or category..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all"
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
                <th className="px-6 py-4">Date / ID</th>
                <th className="px-6 py-4">Vendor & Category</th>
                <th className="px-6 py-4">Payment Info</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Receipt</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {expenseData.map((expense) => (
                <tr key={expense.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-primary">{expense.date}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{expense.id}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium">{expense.vendor}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{expense.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      {expense.method}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-red-600">
                    - रु. {expense.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-accent hover:underline cursor-pointer font-medium text-xs">
                      {expense.receipt}
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
                          setAlertMessage(`Edit feature for ${expense.id} is coming soon!`);
                          setAlertModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-accent hover:bg-white rounded-lg transition-colors shadow-sm"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(expense.id)}
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
        title="Delete Expense"
        message="Are you sure you want to delete this expense record? This action cannot be undone."
        confirmText="Delete Expense"
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

export default Expenses;
