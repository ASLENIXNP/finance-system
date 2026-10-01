import { ArrowUpRight, ArrowDownRight, DollarSign, FileText, CreditCard, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const data = [
  { name: 'Jan', income: 4000, expense: 2400 },
  { name: 'Feb', income: 3000, expense: 1398 },
  { name: 'Mar', income: 2000, expense: 9800 },
  { name: 'Apr', income: 2780, expense: 3908 },
  { name: 'May', income: 1890, expense: 4800 },
  { name: 'Jun', income: 2390, expense: 3800 },
  { name: 'Jul', income: 3490, expense: 4300 },
];

const categoryData = [
  { name: 'Web Dev', value: 4000 },
  { name: 'Mobile App', value: 3000 },
  { name: 'UI/UX', value: 2000 },
  { name: 'Hosting', value: 2780 },
];

const StatCard = ({ title, value, change, isPositive, icon }: any) => (
  <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col hover:shadow-md transition-shadow">
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 bg-slate-50 text-accent rounded-xl">
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-sm font-medium px-2.5 py-1 rounded-full ${isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'}`}>
        {isPositive ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
        {change}
      </div>
    </div>
    <div>
      <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-primary">{value}</h3>
    </div>
  </div>
);

const Dashboard = () => {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Date Filter */}
      <div className="flex justify-end mb-2">
        <select className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg focus:ring-accent focus:border-accent block p-2.5 outline-none shadow-sm cursor-pointer">
          <option>Today</option>
          <option>This Week</option>
          <option selected>This Month</option>
          <option>This Fiscal Year</option>
          <option>Custom Range</option>
        </select>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Income" 
          value="Rs. 1,250,000" 
          change="+12.5%" 
          isPositive={true} 
          icon={<DollarSign size={24} />} 
        />
        <StatCard 
          title="Total Expenditure" 
          value="Rs. 450,000" 
          change="-2.4%" 
          isPositive={true} 
          icon={<CreditCard size={24} />} 
        />
        <StatCard 
          title="Net Profit" 
          value="Rs. 800,000" 
          change="+18.2%" 
          isPositive={true} 
          icon={<Activity size={24} />} 
        />
        <StatCard 
          title="Total Outstanding" 
          value="Rs. 120,000" 
          change="+5.1%" 
          isPositive={false} 
          icon={<FileText size={24} />} 
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-primary mb-6">Income vs Expenditure</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dx={-10} tickFormatter={(value) => `Rs.${value/1000}k`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`Rs. ${value}`, undefined]}
                />
                <Area type="monotone" dataKey="income" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-primary mb-6">Income by Category</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value) => [`Rs. ${value}`, 'Revenue']}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6 hover:shadow-md transition-shadow">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-primary">Recent Invoices</h3>
          <button className="text-sm font-medium text-accent hover:text-accent-hover transition-colors">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-400 uppercase bg-slate-50/50 rounded-lg">
              <tr>
                <th className="px-4 py-3 rounded-l-lg font-medium">Invoice No</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 rounded-r-lg font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                <td className="px-4 py-4 font-medium text-primary group-hover:text-accent transition-colors">ASL-2083-0012</td>
                <td className="px-4 py-4">Tech Innovations Pvt. Ltd.</td>
                <td className="px-4 py-4">Oct 01, 2026</td>
                <td className="px-4 py-4 font-medium text-primary">Rs. 45,000</td>
                <td className="px-4 py-4">
                  <span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-semibold border border-emerald-100">Paid</span>
                </td>
              </tr>
              <tr className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                <td className="px-4 py-4 font-medium text-primary group-hover:text-accent transition-colors">ASL-2083-0011</td>
                <td className="px-4 py-4">Himalayan Coffee House</td>
                <td className="px-4 py-4">Sep 28, 2026</td>
                <td className="px-4 py-4 font-medium text-primary">Rs. 15,500</td>
                <td className="px-4 py-4">
                  <span className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-xs font-semibold border border-amber-100">Partially Paid</span>
                </td>
              </tr>
              <tr className="hover:bg-slate-50/50 transition-colors group">
                <td className="px-4 py-4 font-medium text-primary group-hover:text-accent transition-colors">ASL-2083-0010</td>
                <td className="px-4 py-4">Everest Trading Company</td>
                <td className="px-4 py-4">Sep 25, 2026</td>
                <td className="px-4 py-4 font-medium text-primary">Rs. 120,000</td>
                <td className="px-4 py-4">
                  <span className="bg-red-50 text-red-600 px-2.5 py-1 rounded-full text-xs font-semibold border border-red-100">Unpaid</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
