import { useState, useMemo, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Banknote, 
  FileText, 
  CreditCard, 
  Activity, 
  Calendar, 
  Filter, 
  RotateCcw,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar 
} from 'recharts';
import { NepaliDatePicker } from '../components/NepaliDatePicker';
import { 
  NEPALI_MONTHS, 
  getTodayBsDate, 
  toBsDateString, 
  formatNepaliDate, 
  parseToNepaliDate, 
  getDaysInNepaliMonth, 
  getCurrentFiscalYear
} from '../lib/nepaliDate';

interface IncomeRecord {
  id: string;
  date: string;
  invoice: string;
  customer: string;
  category: string;
  amount: number;
  method: string;
  status: string;
}

interface ExpenseRecord {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  method: string;
  reference: string;
}

interface PaymentRecord {
  id: string;
  date: string;
  invoice: string;
  customer: string;
  amount: number;
  method: string;
  ref: string;
  status: string;
}

// Default initial datasets for initial state & fallback
const defaultIncomeRecords: IncomeRecord[] = [
  { id: 'INC-001', date: '2083-06-15', invoice: 'ASL-2083-0012', customer: 'Tech Innovations Pvt. Ltd.', category: 'Web Development', amount: 45000, method: 'Bank Transfer', status: 'Completed' },
  { id: 'INC-002', date: '2083-06-12', invoice: 'ASL-2083-0011', customer: 'Himalayan Coffee House', category: 'UI/UX Design', amount: 15500, method: 'eSewa', status: 'Completed' },
  { id: 'INC-003', date: '2083-06-09', invoice: 'ASL-2083-0009', customer: 'Retail Solutions', category: 'Software Development', amount: 85000, method: 'Cheque', status: 'Pending' },
  { id: 'INC-004', date: '2083-06-04', invoice: 'Manual Entry', customer: 'Freelance Client', category: 'Consulting', amount: 12000, method: 'Cash', status: 'Completed' },
  { id: 'INC-005', date: '2083-05-24', invoice: 'ASL-2083-0006', customer: 'Everest Trading', category: 'Web Development', amount: 65000, method: 'Bank Transfer', status: 'Completed' },
  { id: 'INC-006', date: '2083-04-18', invoice: 'ASL-2083-0003', customer: 'Apex Logistics', category: 'Software Development', amount: 95000, method: 'Bank Transfer', status: 'Completed' },
  { id: 'INC-007', date: '2083-03-20', invoice: 'ASL-2083-0001', customer: 'Kathmandu Media', category: 'Hosting', amount: 25000, method: 'Card', status: 'Completed' },
];

const defaultExpenseRecords: ExpenseRecord[] = [
  { id: 'EXP-001', date: '2083-06-18', category: 'Office Rent', description: 'Monthly Office Space Rent', amount: 35000, method: 'Bank Transfer', reference: 'RENT-ASW-01' },
  { id: 'EXP-002', date: '2083-06-14', category: 'Utilities & Internet', description: 'WorldLink Fiber Internet Bill', amount: 3200, method: 'eSewa', reference: 'WL-998822' },
  { id: 'EXP-003', date: '2083-06-10', category: 'Server & Cloud', description: 'AWS Cloud Infrastructure Hosting', amount: 18500, method: 'Card', reference: 'AWS-INV-7711' },
  { id: 'EXP-004', date: '2083-06-05', category: 'Refreshments & Tea', description: 'Weekly Office Snacks and Beverages', amount: 2400, method: 'Cash', reference: 'CASH-083-44' },
  { id: 'EXP-005', date: '2083-05-15', category: 'Office Rent', description: 'Bhadra Office Rent', amount: 35000, method: 'Bank Transfer', reference: 'RENT-BHA-01' },
  { id: 'EXP-006', date: '2083-04-15', category: 'Office Rent', description: 'Shrawan Office Rent', amount: 35000, method: 'Bank Transfer', reference: 'RENT-SHR-01' },
];

const defaultPaymentRecords: PaymentRecord[] = [
  { id: 'PAY-001', date: '2083-06-19', invoice: 'ASL-2083-0012', customer: 'Tech Innovations Pvt. Ltd.', amount: 45000, method: 'Bank Transfer', ref: 'NABIL123456789', status: 'Verified' },
  { id: 'PAY-002', date: '2083-06-18', invoice: 'ASL-2083-0014', customer: 'Everest Trading', amount: 15500, method: 'eSewa', ref: 'ESEWA987654', status: 'Verified' },
  { id: 'PAY-003', date: '2083-06-16', invoice: 'ASL-2083-0010', customer: 'Himalayan Coffee House', amount: 50000, method: 'Cheque', ref: 'CHQ-445566', status: 'Pending Clearance' },
  { id: 'PAY-004', date: '2083-06-13', invoice: 'ASL-2083-0008', customer: 'Individual Client', amount: 12000, method: 'Cash', ref: 'CASH-REC-11', status: 'Verified' },
];

type DateFilterOption = 'today' | 'this_week' | 'this_month' | 'fiscal_year' | 'custom';

const StatCard = ({ title, tag, value, change, isPositive, icon, theme = 'blue' }: any) => {
  const themeClasses: Record<string, { bg: string; border: string; iconBg: string; text: string; tag: string }> = {
    emerald: {
      bg: 'bg-[#F6FAF7]',
      border: 'border-emerald-100/90',
      iconBg: 'bg-emerald-100/80 text-emerald-600 border-emerald-200/60',
      text: 'text-emerald-600',
      tag: 'text-emerald-600'
    },
    rose: {
      bg: 'bg-[#FFF6F6]',
      border: 'border-rose-100/90',
      iconBg: 'bg-rose-100/80 text-rose-600 border-rose-200/60',
      text: 'text-rose-600',
      tag: 'text-rose-600'
    },
    blue: {
      bg: 'bg-[#F8FAFF]',
      border: 'border-blue-100/90',
      iconBg: 'bg-blue-100/80 text-blue-600 border-blue-200/60',
      text: 'text-blue-600',
      tag: 'text-blue-600'
    },
    orange: {
      bg: 'bg-[#FFF9F5]',
      border: 'border-orange-100/90',
      iconBg: 'bg-orange-100/80 text-orange-600 border-orange-200/60',
      text: 'text-orange-600',
      tag: 'text-orange-600'
    },
  };

  const t = themeClasses[theme] || themeClasses.blue;

  return (
    <div className={`${t.bg} p-5 rounded-3xl shadow-xs border ${t.border} flex flex-col justify-between hover:shadow-md transition-all`}>
      <div className="flex justify-between items-center mb-3">
        <div className={`w-10 h-10 ${t.iconBg} rounded-2xl flex items-center justify-center border shrink-0`}>
          {icon}
        </div>
        <span className={`text-[11px] font-bold uppercase tracking-wider ${t.tag}`}>
          {tag}
        </span>
      </div>
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className={`text-2xl font-black mt-1 font-mono ${theme === 'rose' ? 'text-rose-600' : 'text-slate-900'}`}>{value}</h3>
        <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
          {isPositive ? <ArrowUpRight size={14} className="text-emerald-600" /> : <ArrowDownRight size={14} className="text-rose-500" />}
          {change}
        </p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  // Current BS Date details
  const todayBs = useMemo(() => getTodayBsDate(), []);
  const currentNd = useMemo(() => parseToNepaliDate(todayBs), [todayBs]);
  const currentBs = useMemo(() => currentNd.getBS(), [currentNd]);
  const currentMonthInfo = NEPALI_MONTHS[currentBs.month] || NEPALI_MONTHS[5];
  const currentFiscalYearStr = useMemo(() => getCurrentFiscalYear(), []);

  // Filter state
  const [filterOption, setFilterOption] = useState<DateFilterOption>('this_month');
  
  // Custom range states
  const [customStart, setCustomStart] = useState<string>(() => {
    return `${currentBs.year}-${String(currentBs.month + 1).padStart(2, '0')}-01`;
  });
  const [customEnd, setCustomEnd] = useState<string>(() => todayBs);

  const getDeletedIds = (storageKey: string): Set<string> => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return new Set();
      const arr = JSON.parse(raw);
      return new Set(Array.isArray(arr) ? arr : []);
    } catch {
      return new Set();
    }
  };

  // Raw records from localStorage or fallbacks sanitized against deleted tombstones
  const [incomeList, setIncomeList] = useState<IncomeRecord[]>(() => {
    const deletedIds = getDeletedIds('aslenix_deleted_income');
    const stored = localStorage.getItem('aslenix_income');
    if (stored !== null) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.filter((item: any) => !deletedIds.has(item.id));
      } catch {}
    }
    return defaultIncomeRecords.filter(item => !deletedIds.has(item.id));
  });

  const [expenseList, setExpenseList] = useState<ExpenseRecord[]>(() => {
    const deletedIds = getDeletedIds('aslenix_deleted_expenses');
    const stored = localStorage.getItem('aslenix_expenses');
    if (stored !== null) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.filter((item: any) => !deletedIds.has(item.id));
      } catch {}
    }
    return defaultExpenseRecords.filter(item => !deletedIds.has(item.id));
  });

  const [paymentList, setPaymentList] = useState<PaymentRecord[]>(() => {
    const deletedIds = getDeletedIds('aslenix_deleted_payments');
    const stored = localStorage.getItem('aslenix_payments');
    if (stored !== null) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed.filter((item: any) => !deletedIds.has(item.id));
      } catch {}
    }
    return defaultPaymentRecords.filter(item => !deletedIds.has(item.id));
  });

  useEffect(() => {
    try {
      const deletedIncome = getDeletedIds('aslenix_deleted_income');
      const storedIncome = localStorage.getItem('aslenix_income');
      if (storedIncome !== null) {
        const parsed = JSON.parse(storedIncome);
        if (Array.isArray(parsed)) setIncomeList(parsed.filter((item: any) => !deletedIncome.has(item.id)));
      }

      const deletedExpenses = getDeletedIds('aslenix_deleted_expenses');
      const storedExpenses = localStorage.getItem('aslenix_expenses');
      if (storedExpenses !== null) {
        const parsed = JSON.parse(storedExpenses);
        if (Array.isArray(parsed)) setExpenseList(parsed.filter((item: any) => !deletedExpenses.has(item.id)));
      }

      const deletedPayments = getDeletedIds('aslenix_deleted_payments');
      const storedPayments = localStorage.getItem('aslenix_payments');
      if (storedPayments !== null) {
        const parsed = JSON.parse(storedPayments);
        if (Array.isArray(parsed)) setPaymentList(parsed.filter((item: any) => !deletedPayments.has(item.id)));
      }
    } catch (e) {
      console.error('Error loading dashboard data', e);
    }
  }, []);

  // Compute active date range [startDate, endDate]
  const dateRange = useMemo(() => {
    const y = currentBs.year;
    const m = currentBs.month; // 0-indexed

    if (filterOption === 'today') {
      return {
        start: todayBs,
        end: todayBs,
        label: `आज (${formatNepaliDate(todayBs, 'full')} BS • ${formatNepaliDate(todayBs, 'devanagari')})`
      };
    }

    if (filterOption === 'this_week') {
      const todayAd = new Date();
      const dayOfWeek = todayAd.getDay(); // 0 is Sun
      const sunAd = new Date(todayAd);
      sunAd.setDate(todayAd.getDate() - dayOfWeek);
      const satAd = new Date(todayAd);
      satAd.setDate(todayAd.getDate() + (6 - dayOfWeek));

      const startBs = toBsDateString(sunAd);
      const endBs = toBsDateString(satAd);

      return {
        start: startBs,
        end: endBs,
        label: `यो हप्ता (${formatNepaliDate(startBs, 'standard')} देखि ${formatNepaliDate(endBs, 'standard')})`
      };
    }

    if (filterOption === 'fiscal_year') {
      // Fiscal year in Nepal starts on Shrawan 1 (Month 04, index 3)
      const startYear = m >= 3 ? y : y - 1;
      const endYear = startYear + 1;
      const endMonthDays = getDaysInNepaliMonth(endYear, 2); // Ashadh (month index 2)
      const startBs = `${startYear}-04-01`;
      const endBs = `${endYear}-03-${String(endMonthDays).padStart(2, '0')}`;

      return {
        start: startBs,
        end: endBs,
        label: `चालु आ.व. ${currentFiscalYearStr} (${startYear} श्रावण - ${endYear} असार)`
      };
    }

    if (filterOption === 'custom') {
      return {
        start: customStart,
        end: customEnd,
        label: `कस्टम मिति (${customStart} देखि ${customEnd})`
      };
    }

    // Default: 'this_month'
    const daysInMonth = getDaysInNepaliMonth(y, m);
    const startBs = `${y}-${String(m + 1).padStart(2, '0')}-01`;
    const endBs = `${y}-${String(m + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    return {
      start: startBs,
      end: endBs,
      label: `यो महिना (${currentMonthInfo.name} / ${currentMonthInfo.nepaliName} ${y})`
    };
  }, [filterOption, todayBs, currentBs, currentMonthInfo, currentFiscalYearStr, customStart, customEnd]);

  // Filter helper: check if date is within range
  const isDateInRange = (dateStr: string, start: string, end: string) => {
    if (!dateStr) return false;
    const bs = toBsDateString(dateStr);
    return bs >= start && bs <= end;
  };

  // Filtered dataset for active range
  const filteredIncome = useMemo(() => {
    return incomeList.filter(item => isDateInRange(item.date, dateRange.start, dateRange.end));
  }, [incomeList, dateRange]);

  const filteredExpenses = useMemo(() => {
    return expenseList.filter(item => isDateInRange(item.date, dateRange.start, dateRange.end));
  }, [expenseList, dateRange]);

  const filteredPayments = useMemo(() => {
    return paymentList.filter(item => isDateInRange(item.date, dateRange.start, dateRange.end));
  }, [paymentList, dateRange]);

  // Aggregate stats
  const totalIncome = useMemo(() => {
    return filteredIncome.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  }, [filteredIncome]);

  const totalExpense = useMemo(() => {
    return filteredExpenses.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
  }, [filteredExpenses]);

  const netProfit = totalIncome - totalExpense;

  const totalOutstanding = useMemo(() => {
    // Pending income or pending payments in current period
    const pendingInc = filteredIncome
      .filter(i => i.status === 'Pending')
      .reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    
    const pendingPay = filteredPayments
      .filter(p => p.status === 'Pending Clearance')
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

    return pendingInc + pendingPay;
  }, [filteredIncome, filteredPayments]);

  // Chart 1: Monthly Income vs Expenditure breakdown across Nepali months
  const monthlyChartData = useMemo(() => {
    const nepaliMonthsList = NEPALI_MONTHS;
    const currentYear = currentBs.year;

    return nepaliMonthsList.map(mInfo => {
      const monthPrefix = `${currentYear}-${String(mInfo.monthNumber).padStart(2, '0')}`;
      
      const incForMonth = incomeList
        .filter(item => toBsDateString(item.date).startsWith(monthPrefix))
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

      const expForMonth = expenseList
        .filter(item => toBsDateString(item.date).startsWith(monthPrefix))
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

      // Provide baseline values for illustration if empty
      const isCurrentOrPast = mInfo.index <= currentBs.month;
      const baselineIncome = isCurrentOrPast ? [145000, 190000, 240000, 180000, 210000, 260000][mInfo.index] || 0 : 0;
      const baselineExpense = isCurrentOrPast ? [85000, 92000, 120000, 78000, 95000, 110000][mInfo.index] || 0 : 0;

      return {
        name: mInfo.name,
        nepaliName: mInfo.nepaliName,
        income: incForMonth > 0 ? incForMonth : baselineIncome,
        expense: expForMonth > 0 ? expForMonth : baselineExpense,
      };
    });
  }, [incomeList, expenseList, currentBs]);

  // Chart 2: Income by Category (dynamically aggregated)
  const categoryData = useMemo(() => {
    const categoriesMap: Record<string, number> = {};
    const dataset = filteredIncome.length > 0 ? filteredIncome : incomeList;

    dataset.forEach(item => {
      const cat = item.category || 'General';
      categoriesMap[cat] = (categoriesMap[cat] || 0) + (Number(item.amount) || 0);
    });

    const result = Object.entries(categoriesMap).map(([name, value]) => ({ name, value }));

    if (result.length === 0) {
      return [
        { name: 'Web Dev', value: 45000 },
        { name: 'UI/UX Design', value: 15500 },
        { name: 'Software Dev', value: 85000 },
        { name: 'Consulting', value: 12000 },
      ];
    }
    return result;
  }, [filteredIncome, incomeList]);

  // Recent invoices / transactions in range (fallback to recent overall if filtered empty)
  const recentTransactions = useMemo(() => {
    const combined = [
      ...filteredIncome.map(i => ({
        id: i.id,
        ref: i.invoice,
        customer: i.customer,
        date: i.date,
        amount: i.amount,
        status: i.status,
        type: 'Income'
      })),
      ...filteredPayments.map(p => ({
        id: p.id,
        ref: p.invoice,
        customer: p.customer,
        date: p.date,
        amount: p.amount,
        status: p.status,
        type: 'Payment'
      }))
    ];

    // Sort by date descending
    combined.sort((a, b) => b.date.localeCompare(a.date));
    return combined.slice(0, 5);
  }, [filteredIncome, filteredPayments]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Date Filter Bar */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-accent/10 text-accent flex items-center justify-center">
            <Calendar size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-primary">Financial Overview</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-slate-100 text-slate-700">
                {dateRange.label}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              मिति अवधि: <span className="font-mono text-slate-700 font-medium">{dateRange.start}</span> देखि <span className="font-mono text-slate-700 font-medium">{dateRange.end}</span>
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Filter size={15} className="text-slate-400" />
            <select 
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value as DateFilterOption)}
              className="bg-transparent text-slate-700 text-sm font-medium outline-none cursor-pointer pr-1"
            >
              <option value="today">आज (Today)</option>
              <option value="this_week">यो हप्ता (This Week)</option>
              <option value="this_month">यो महिना (This Month - {currentMonthInfo.name})</option>
              <option value="fiscal_year">चालु आ.व. (Fiscal Year {currentFiscalYearStr})</option>
              <option value="custom">Custom Range (कस्टम मिति)</option>
            </select>
          </div>

          {filterOption !== 'this_month' && (
            <button 
              onClick={() => setFilterOption('this_month')}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              title="Reset to this month"
            >
              <RotateCcw size={13} />
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Custom Range Picker Drawer */}
      {filterOption === 'custom' && (
        <div className="bg-gradient-to-r from-accent/5 via-white to-slate-50 p-4 rounded-2xl border border-accent/20 shadow-sm flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex-1 w-full">
            <NepaliDatePicker
              label="From Date (सुरु मिति BS)"
              value={customStart}
              onChange={(val) => setCustomStart(val)}
            />
          </div>
          <div className="flex-1 w-full">
            <NepaliDatePicker
              label="To Date (अन्तिम मिति BS)"
              value={customEnd}
              onChange={(val) => setCustomEnd(val)}
            />
          </div>
          <div className="flex gap-2 self-end pb-1 w-full md:w-auto">
            <button
              onClick={() => {
                setCustomStart(`${currentBs.year}-${String(currentBs.month + 1).padStart(2, '0')}-01`);
                setCustomEnd(todayBs);
              }}
              className="px-3 py-2 bg-white border border-slate-200 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-slate-700 w-full md:w-auto"
            >
              This Month
            </button>
            <button
              onClick={() => {
                setCustomStart(todayBs);
                setCustomEnd(todayBs);
              }}
              className="px-3 py-2 bg-white border border-slate-200 text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors shadow-sm text-slate-700 w-full md:w-auto"
            >
              Today
            </button>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Total Income" 
          tag="REVENUE"
          theme="emerald"
          value={`रु. ${totalIncome.toLocaleString('en-IN')}`} 
          change={`${filteredIncome.length} transactions recorded`} 
          isPositive={true} 
          icon={<Banknote size={20} />} 
        />
        <StatCard 
          title="Total Expenditure" 
          tag="OUTGOINGS"
          theme="rose"
          value={`रु. ${totalExpense.toLocaleString('en-IN')}`} 
          change={`${filteredExpenses.length} expense vouchers`} 
          isPositive={false} 
          icon={<CreditCard size={20} />} 
        />
        <StatCard 
          title="Net Profit" 
          tag="NET SURPLUS"
          theme="blue"
          value={`रु. ${netProfit.toLocaleString('en-IN')}`} 
          change={netProfit >= 0 ? "+ Surplus Profit" : "- Net Deficit"} 
          isPositive={netProfit >= 0} 
          icon={<Activity size={20} />} 
        />
        <StatCard 
          title="Total Outstanding" 
          tag="RECEIVABLES"
          theme="orange"
          value={`रु. ${totalOutstanding.toLocaleString('en-IN')}`} 
          change="Pending invoice settlement" 
          isPositive={totalOutstanding === 0} 
          icon={<FileText size={20} />} 
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:col-span-2 hover:shadow-md transition-shadow">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
            <div>
              <h3 className="text-lg font-semibold text-primary">Income vs Expenditure (आम्दानी र खर्च)</h3>
              <p className="text-xs text-slate-500 mt-0.5">मासिक आम्दानी र खर्चको तुलना (BS {currentBs.year})</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-blue-600">
                <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                Income
              </span>
              <span className="flex items-center gap-1.5 text-red-500">
                <span className="w-3 h-3 rounded-full bg-red-500"></span>
                Expenditure
              </span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  dx={-10} 
                  tickFormatter={(value) => `रु.${value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}`} 
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`रु. ${Number(value).toLocaleString('en-IN')}`, undefined]}
                />
                <Area type="monotone" dataKey="income" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" name="Income" />
                <Area type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" name="Expense" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-primary">Income by Category</h3>
            <p className="text-xs text-slate-500 mt-0.5">शीर्षक अनुसार आम्दानी वर्गीकरण</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 11}} 
                  dy={10} 
                />
                <YAxis hide />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: any) => [`रु. ${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                />
                <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Activity / Invoices in Selected Range */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mt-6 hover:shadow-md transition-shadow">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-primary">Recent Transactions ({dateRange.label})</h3>
            <p className="text-xs text-slate-500 mt-0.5">यस अवधिमा प्राप्त भएका बिल तथा भुक्तानीहरू</p>
          </div>
          <div className="text-xs text-slate-500 font-medium">
            कुल रेकर्ड: <span className="text-accent font-bold">{recentTransactions.length}</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-400 uppercase bg-slate-50/50 rounded-lg">
              <tr>
                <th className="px-4 py-3 rounded-l-lg font-medium">Invoice / Ref</th>
                <th className="px-4 py-3 font-medium">Customer / Client</th>
                <th className="px-4 py-3 font-medium">Nepali Date (BS मिति)</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
                <th className="px-4 py-3 rounded-r-lg font-medium text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Clock className="text-slate-300" size={32} />
                      <p className="text-sm font-medium text-slate-600">यस अवधिमा कुनै कारोबार भेटिएन।</p>
                      <p className="text-xs text-slate-400">माथिको मिति फिल्टर परिवर्तन गर्नुहोस् वा सबै हेर्न रिसेट गर्नुहोस्।</p>
                      <button 
                        onClick={() => setFilterOption('this_month')}
                        className="mt-2 text-xs font-semibold text-accent hover:underline"
                      >
                        यो महिनाको कारोबार हेर्नुहोस् (Reset to This Month)
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-semibold text-primary">
                      {tx.ref}
                      <span className="block text-[11px] font-normal text-slate-400">{tx.id}</span>
                    </td>
                    <td className="px-4 py-3.5 font-medium text-slate-700">
                      {tx.customer}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      <div className="font-medium">{formatNepaliDate(tx.date, 'full')} BS</div>
                      <div className="text-[11px] font-mono text-slate-400">{toBsDateString(tx.date)} • {formatNepaliDate(tx.date, 'devanagari')}</div>
                    </td>
                    <td className="px-4 py-3.5 text-right font-bold text-slate-900">
                      रु. {Number(tx.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        tx.status === 'Completed' || tx.status === 'Verified'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {tx.status === 'Completed' || tx.status === 'Verified' ? (
                          <CheckCircle2 size={12} />
                        ) : (
                          <Clock size={12} />
                        )}
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
