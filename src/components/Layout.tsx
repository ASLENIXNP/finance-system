import { useEffect, useState } from 'react';
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
  Building2,
  Banknote,
  Calendar
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { formatNepaliDate, getCurrentFiscalYear } from '../lib/nepaliDate';

const Layout = () => {
  const navigate = useNavigate();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    // Get current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUserEmail(session.user.email || null);
      } else {
        const demo = localStorage.getItem('demo_user');
        if (demo) {
          setUserEmail(demo);
        } else {
          navigate('/login');
        }
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email || null);
      } else {
        const demo = localStorage.getItem('demo_user');
        if (demo) {
          setUserEmail(demo);
        } else {
          navigate('/login');
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    localStorage.removeItem('demo_user');
    await supabase.auth.signOut();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={19} /> },
    { name: 'Customers', path: '/customers', icon: <Users size={19} /> },
    { name: 'Products & Services', path: '/products', icon: <Package size={19} /> },
    { name: 'Invoices', path: '/invoices', icon: <FileText size={19} /> },
    { name: 'Income', path: '/income', icon: <Wallet size={19} /> },
    { name: 'Expenditure', path: '/expenses', icon: <Receipt size={19} /> },
    { name: 'Payments', path: '/payments', icon: <CreditCard size={19} /> },
    { name: 'Payroll & Salaries', path: '/payroll', icon: <Banknote size={19} /> },
    { name: 'Company Settings', path: '/settings', icon: <Building2 size={19} /> },
    { name: 'User Management', path: '/users', icon: <Settings size={19} /> },
  ];

  return (
    <div className="flex h-screen bg-background font-sans overflow-hidden print:h-auto print:block print:overflow-visible print:bg-white">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 bg-white border-r border-slate-200/80 flex flex-col z-10 relative print:hidden">
        
        <nav aria-label="Main navigation" className="flex-1 overflow-y-auto py-4 px-3 space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors duration-150 text-[15px] font-medium ${
                  isActive 
                    ? 'bg-slate-900 text-white shadow-sm font-semibold' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950'
                }`
              }
            >
              <span className="flex w-5 shrink-0 items-center justify-center [&>svg]:stroke-[2]">{item.icon}</span>
              <span className="truncate">{item.name}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-3 pb-4 border-t border-slate-200/80 bg-white">
          <div className="flex items-center gap-3 mb-3 px-1.5 py-1">
            <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {userEmail ? userEmail[0].toUpperCase() : 'U'}
            </div>
            <div className="overflow-hidden min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">System User</p>
              <p className="text-[11px] text-slate-500 truncate">{userEmail || 'Loading...'}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-2 justify-center px-3 py-2.5 text-sm font-medium text-rose-600 bg-rose-50/80 border border-rose-100 rounded-2xl hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-[#f1f0ee] print:h-auto print:block print:overflow-visible print:w-full">
        {/* Top Header */}
        <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-center px-8 z-10 relative print:hidden shadow-xs">
          <div className="flex items-center gap-2 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/90 shadow-2xs">
            {/* Date Badge */}
            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/70 shadow-2xs text-xs font-semibold text-slate-800">
              <div className="w-5 h-5 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100/70">
                <Calendar size={12} />
              </div>
              <span className="font-bold tracking-tight text-slate-900">{formatNepaliDate(new Date(), 'withDay')} BS</span>
              <span className="text-slate-400 font-medium text-[11px] border-l border-slate-200 pl-2">
                {formatNepaliDate(new Date(), 'devanagari')}
              </span>
            </div>

            {/* Fiscal Year Badge */}
            <div className="flex items-center gap-2 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200/70 shadow-2xs text-xs font-semibold text-slate-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              <span className="text-slate-400 uppercase text-[10px] font-bold tracking-wider">Fiscal Year:</span>
              <span className="font-mono font-bold text-slate-900">{getCurrentFiscalYear()}</span>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-[#f1f0ee] print:p-0 print:overflow-visible print:h-auto print:block print:w-full">
          <div className="max-w-7xl mx-auto pb-12 print:max-w-none print:m-0 print:p-0 print:w-full print:pb-0">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
