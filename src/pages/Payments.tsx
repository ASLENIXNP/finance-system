import { useState } from 'react';
import { Search, Filter, CheckCircle2, AlertCircle, Edit, Trash2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const initialPaymentsData = [
  { id: 'PAY-001', date: 'Oct 05, 2026', invoice: 'ASL-2083-0012', customer: 'Tech Innovations Pvt. Ltd.', amount: 45000, method: 'Bank Transfer', ref: 'NABIL123456789', status: 'Verified' },
  { id: 'PAY-002', date: 'Oct 04, 2026', invoice: 'ASL-2083-0014', customer: 'Everest Trading', amount: 15500, method: 'eSewa', ref: 'ESEWA987654', status: 'Verified' },
  { id: 'PAY-003', date: 'Oct 02, 2026', invoice: 'ASL-2083-0010', customer: 'Himalayan Coffee House', amount: 50000, method: 'Cheque', ref: 'CHQ-445566', status: 'Pending Clearance' },
  { id: 'PAY-004', date: 'Sep 29, 2026', invoice: 'ASL-2083-0008', customer: 'Individual Client', amount: 12000, method: 'Cash', ref: 'CASH-REC-11', status: 'Verified' },
];

const Payments = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentsData, setPaymentsData] = useState(initialPaymentsData);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [paymentToDelete, setPaymentToDelete] = useState<string | null>(null);
  
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleDeleteClick = (id: string) => {
    setPaymentToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (paymentToDelete) {
      setPaymentsData(paymentsData.filter(item => item.id !== paymentToDelete));
      setPaymentToDelete(null);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Payment Tracking</h2>
          <p className="text-slate-500 text-sm mt-1">Monitor all invoice payments, receipts, and bank clearances.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Table Header/Controls */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search payments by invoice or reference..." 
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
                <th className="px-6 py-4">Receipt ID / Date</th>
                <th className="px-6 py-4">Customer & Invoice</th>
                <th className="px-6 py-4">Method & Ref</th>
                <th className="px-6 py-4 font-bold text-right">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {paymentsData.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-primary">{payment.id}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{payment.date}</div>
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
                        onClick={() => {
                          setAlertMessage(`Edit feature for ${payment.id} is coming soon!`);
                          setAlertModalOpen(true);
                        }}
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
              ))}
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

export default Payments;
