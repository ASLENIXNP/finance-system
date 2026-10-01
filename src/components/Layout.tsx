import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  FileText, 
  Wallet, 
  Receipt, 
  CreditCard,
  Settings,
  LogOut,
  Building2
} from 'lucide-react';

const Layout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Supabase logout will go here
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Customers', path: '/customers', icon: <Users size={20} /> },
    { name: 'Products & Services', path: '/products', icon: <Package size={20} /> },
    { name: 'Invoices', path: '/invoices', icon: <FileText size={20} /> },
    { name: 'Income', path: '/income', icon: <Wallet size={20} /> },
    { name: 'Expenditure', path: '/expenses', icon: <Receipt size={20} /> },
    { name: 'Payments', path: '/payments', icon: <CreditCard size={20} /> },
    { name: 'Company Settings', path: '/settings', icon: <Building2 size={20} /> },
    { name: 'User Management', path: '/users', icon: <Settings size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-sidebar border-r border-slate-200 flex flex-col shadow-sm z-10 relative">
        <div className="p-6 border-b border-slate-100">
          <div className="flex items-center gap-2 text-accent font-bold text-xl tracking-tight">
            <div className="bg-accent text-white p-2 rounded-lg">
              <FileText size={20} />
            </div>
            ASLENIX
          </div>
          <p className="text-xs text-slate-500 mt-1 uppercase font-medium tracking-wider">Finance System</p>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium ${
                  isActive 
                    ? 'bg-accent/10 text-accent shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-primary'
                }`
              }
            >
              {item.icon}
              {item.name}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-inner">
              SA
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-primary truncate">Super Admin</p>
              <p className="text-xs text-slate-500 truncate">admin@aslenix.com</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 z-0">
          <h2 className="text-xl font-semibold text-primary">Overview</h2>
          <div className="flex items-center gap-4">
             <span className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
               Fiscal Year: 2082/83
             </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="max-w-7xl mx-auto pb-12">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
