import { useState } from 'react';
import { Search, Plus, MoreVertical, Filter, Download } from 'lucide-react';

const customersData = [
  { id: 'CUST-001', name: 'Ramesh Sharma', company: 'Tech Innovations Pvt. Ltd.', pan: '304123456', phone: '+977 9801234567', type: 'Company', status: 'Active', totalBilled: 450000 },
  { id: 'CUST-002', name: 'Sita Gurung', company: 'Himalayan Coffee House', pan: '604987654', phone: '+977 9841234567', type: 'Organization', status: 'Active', totalBilled: 125000 },
  { id: 'CUST-003', name: 'Hari Bahadur', company: 'Everest Trading', pan: '301234567', phone: '+977 9851123456', type: 'Company', status: 'Inactive', totalBilled: 850000 },
  { id: 'CUST-004', name: 'Anita Thapa', company: 'Individual', pan: 'N/A', phone: '+977 9849876543', type: 'Individual', status: 'Active', totalBilled: 45000 },
];

const Customers = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Customers</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your clients, companies, and organizations.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm flex-1 md:flex-none">
            <Download size={18} />
            Export
          </button>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors shadow-sm flex-1 md:flex-none">
            <Plus size={18} />
            Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Table Header/Controls */}
        <div className="p-4 md:p-6 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search customers by name, company, or PAN..." 
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
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Type / PAN</th>
                <th className="px-6 py-4">Total Billed</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {customersData.map((customer) => (
                <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="font-semibold text-primary">{customer.company !== 'Individual' ? customer.company : customer.name}</div>
                    <div className="text-slate-500 text-xs mt-0.5">{customer.id} {customer.company !== 'Individual' ? `• ${customer.name}` : ''}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div>{customer.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium mb-1">
                      {customer.type}
                    </span>
                    <div className="text-xs text-slate-500">PAN: {customer.pan}</div>
                  </td>
                  <td className="px-6 py-4 font-medium text-primary">
                    Rs. {customer.totalBilled.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      customer.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${customer.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {customer.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/30">
          <div>Showing 1 to 4 of 4 entries</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-200 rounded text-slate-400 cursor-not-allowed">Prev</button>
            <button className="px-3 py-1 bg-accent text-white rounded font-medium">1</button>
            <button className="px-3 py-1 border border-slate-200 rounded text-slate-400 cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Customers;
