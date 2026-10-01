import { useState } from 'react';
import { Search, Plus, Filter, Package, Edit, Trash2 } from 'lucide-react';

const productsData = [
  { id: 'PROD-001', code: 'WEB-01', name: 'Corporate Website Development', type: 'Service', rate: 150000, tax: 13, status: 'Active' },
  { id: 'PROD-002', code: 'APP-01', name: 'Mobile App Development (iOS/Android)', type: 'Service', rate: 250000, tax: 13, status: 'Active' },
  { id: 'PROD-003', code: 'HOST-01', name: 'Premium Cloud Hosting (Annual)', type: 'Product', rate: 15000, tax: 13, status: 'Active' },
  { id: 'PROD-004', code: 'MAINT-01', name: 'Monthly System Maintenance', type: 'Service', rate: 12000, tax: 13, status: 'Active' },
  { id: 'PROD-005', code: 'SEO-01', name: 'SEO Optimization Package', type: 'Service', rate: 35000, tax: 13, status: 'Inactive' },
];

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Products & Services</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your service offerings, products, and standard rates.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors shadow-sm flex-1 md:flex-none">
            <Plus size={18} />
            Add Item
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
              placeholder="Search items by name or code..." 
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
                <th className="px-6 py-4">Item Name / Code</th>
                <th className="px-6 py-4">Type</th>
                <th className="px-6 py-4 text-right">Default Rate</th>
                <th className="px-6 py-4 text-right">Tax (%)</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {productsData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                        <Package size={20} />
                      </div>
                      <div>
                        <div className="font-semibold text-primary">{item.name}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{item.code}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right font-medium text-primary">
                    Rs. {item.rate.toLocaleString('en-IN')}
                  </td>
                  <td className="px-6 py-4 text-right text-slate-500">
                    {item.tax}%
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      item.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${item.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-2 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors">
                        <Edit size={16} />
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
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
    </div>
  );
};

export default Products;
