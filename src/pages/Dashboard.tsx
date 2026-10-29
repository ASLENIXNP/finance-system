import { useState, useMemo, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  Clock,
  ShieldCheck
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

// Initial empty datasets - no static/fake mock numbers
const defaultIncomeRecords: IncomeRecord[] = [];
const defaultExpenseRecords: ExpenseRecord[] = [];
const defaultPaymentRecords: PaymentRecord[] = [];

type DateFilterOption = 'today' | 'this_week' | 'this_month' | 'fiscal_year' | 'custom';

const StatCard = ({ title, tag, value, change, isPositive, icon, theme = 'blue' }: any) => {
  const themeClasses: Record<string, { toneClass: string; iconBg: string; text: string; tag: string }> = {
    emerald: {
      toneClass: 'card-tone-mint',
      iconBg: 'bg-emerald-100/90 text-emerald-700 border-emerald-200/80',
      text: 'text-emerald-700',
      tag: 'text-emerald-700 bg-emerald-50/90 border border-emerald-200/80'
    },
    rose: {
      toneClass: 'card-tone-rose',
      iconBg: 'bg-rose-100/90 text-rose-700 border-rose-200/80',
      text: 'text-rose-700',
      tag: 'text-rose-700 bg-rose-50/90 border border-rose-200/80'
    },
    blue: {
      toneClass: 'card-tone-blue',
      iconBg: 'bg-blue-100/90 text-blue-700 border-blue-200/80',
      text: 'text-blue-700',
      tag: 'text-blue-700 bg-blue-50/90 border border-blue-200/80'
    },
    orange: {
      toneClass: 'card-tone-amber',
      iconBg: 'bg-amber-100/90 text-amber-700 border-amber-200/80',
      text: 'text-amber-700',
      tag: 'text-amber-700 bg-amber-50/90 border border-amber-200/80'
    },
  };

  const t = themeClasses[theme] || themeClasses.blue;

  return (
    <div className={`glass ${t.toneClass} p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between hover:shadow-md transition-all`}>
      <div className="flex justify-between items-center mb-3">
        <div className={`w-10 h-10 ${t.iconBg} rounded-xl flex items-center justify-center border shrink-0`}>
          {icon}
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${t.tag}`}>
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
    const loadDashboardData = async () => {
      try {
        const deletedIncome = getDeletedIds('aslenix_deleted_income');
        const deletedExpenses = getDeletedIds('aslenix_deleted_expenses');
        const deletedPayments = getDeletedIds('aslenix_deleted_payments');

        // Check local invoices snapshot first
        const storedInvoices = localStorage.getItem('aslenix_invoices_v2');
        if (storedInvoices) {
          try {
            const parsed = JSON.parse(storedInvoices);
            if (Array.isArray(parsed) && parsed.length > 0) {
              const mappedIncome = parsed.map((inv: any) => ({
                id: inv.id,
                date: inv.invoice_date_bs || toBsDateString(inv.invoice_date),
                invoice: inv.invoice_no,
                customer: inv.customer_name,
                category: 'Software & IT Services',
                amount: Number(inv.grand_total) || 0,
                method: 'Bank Transfer',
                status: inv.status === 'Paid' ? 'Completed' : 'Pending',
              }));
              setIncomeList(mappedIncome.filter((i: any) => !deletedIncome.has(i.id)));
            }
          } catch {}
        }

        // Live Supabase Payments
        try {
          const { data: payData } = await supabase
            .from('payments')
            .select('*, customers(name), invoices(invoice_no)')
            .order('payment_date', { ascending: false });

          if (payData && payData.length > 0) {
            const mappedPay: PaymentRecord[] = payData.map((p: any) => ({
              id: p.payment_ref || p.id,
              date: toBsDateString(p.payment_date),
              invoice: p.invoices?.invoice_no || 'Direct',
              customer: p.customers?.name || 'Customer',
              amount: Number(p.amount) || 0,
              method: p.method || 'Bank Transfer',
              ref: p.bank_transaction_id || p.payment_ref || 'TXN',
              status: 'Verified',
            }));
            setPaymentList(mappedPay.filter((p: any) => !deletedPayments.has(p.id)));
          }
        } catch {}

        // Live Supabase Expenses
        try {
          const { data: expData } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });

          if (expData && expData.length > 0) {
            const mappedExp: ExpenseRecord[] = expData.map((e: any) => ({
              id: e.expense_ref || e.id,
              date: e.date_bs || toBsDateString(e.date),
              category: e.category,
              description: e.description,
              amount: Number(e.total_amount || e.amount) || 0,
              method: e.method || 'Bank Transfer',
              reference: e.receipt_no || e.expense_ref || 'EXP',
            }));
            setExpenseList(mappedExp.filter((e: any) => !deletedExpenses.has(e.id)));
          }
        } catch {}
      } catch (e) {
        console.error('Error loading dashboard data', e);
      }
    };

    loadDashboardData();
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

  // Chart 1: Dynamic monthly income vs expenditure based on selected BS date range
  const monthlyChartData = useMemo(() => {
    const rangeStart = dateRange.start;
    const rangeEnd = dateRange.end;

    const monthKeys: string[] = [];
    const [startYear, startMonth] = rangeStart.split('-').map(Number);
    const [endYear, endMonth] = rangeEnd.split('-').map(Number);

    let cursorYear = startYear;
    let cursorMonth = startMonth;

    while (cursorYear < endYear || (cursorYear === endYear && cursorMonth <= endMonth)) {
      monthKeys.push(`${cursorYear}-${String(cursorMonth).padStart(2, '0')}`);
      cursorMonth += 1;
      if (cursorMonth > 12) {
        cursorMonth = 1;
        cursorYear += 1;
      }
    }

    return monthKeys.map((monthKey) => {
      const monthInfo = NEPALI_MONTHS.find((m) => m.monthNumber === Number(monthKey.split('-')[1])) || NEPALI_MONTHS[5];
      const income = incomeList
        .filter((item) => toBsDateString(item.date).startsWith(monthKey))
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

      const expense = expenseList
        .filter((item) => toBsDateString(item.date).startsWith(monthKey))
        .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

      return {
        name: monthInfo.name,
        short: monthInfo.short,
        income,
        expense,
      };
    });
  }, [dateRange, incomeList, expenseList]);

  // Chart 2: Income by category, aggregated from the selected date window or current records
  const categoryData = useMemo(() => {
    const categoriesMap: Record<string, number> = {};
    const dataset = filteredIncome.length > 0 ? filteredIncome : incomeList;

    dataset.forEach((item) => {
      const cat = item.category || 'General';
      categoriesMap[cat] = (categoriesMap[cat] || 0) + (Number(item.amount) || 0);
    });

    const result = Object.entries(categoriesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);

    return result.length > 0 ? result : [
      { name: 'Web Dev', value: 0 },
      { name: 'UI/UX Design', value: 0 },
      { name: 'Software Dev', value: 0 },
      { name: 'Consulting', value: 0 },
    ];
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
      {/* Financial Overview and date-range controls */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm px-5 py-4 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#c4daff] to-[#e5ccff] text-[#0f172a] shadow-xs">
            <Calendar size={19} />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight text-slate-800">Financial Overview</h2>
              <span className="text-base font-semibold text-slate-600">{dateRange.label}</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              मिति अवधि: <span className="font-mono text-slate-700 font-semibold">{dateRange.start}</span> देखि <span className="font-mono text-slate-700 font-semibold">{dateRange.end}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:ml-auto">
          <div className="flex items-center gap-2 bg-white/80 border border-slate-200/80 rounded-2xl px-3 py-2 shadow-sm">
            <Filter size={15} className="text-slate-500" />
            <select 
              value={filterOption}
              onChange={(e) => setFilterOption(e.target.value as DateFilterOption)}
              className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer pr-1"
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
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200"
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

      {/* Nepal Tax & Compliance Quick Status Card */}
      <div className="glass card-tone-lavender p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-r from-[#c4daff] to-[#e5ccff] text-[#0f172a] rounded-xl shadow-xs border border-[#c4daff]/80">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-slate-900 text-sm">Nepal IRD Tax & VAT Position (१३% मू.अ.कर)</h4>
              <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/60">
                FY {currentFiscalYearStr}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Accrual Revenue: <strong className="text-slate-800">रु. {totalIncome.toLocaleString('en-IN')}</strong> | Verified Cash Inflow: <strong className="text-emerald-700">रु. {paymentList.reduce((a, b) => a + (Number(b.amount) || 0), 0).toLocaleString('en-IN')}</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
          <div className="bg-white/90 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">13% Output VAT</span>
            <span className="font-bold text-indigo-700">रु. {(totalIncome * 0.13).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>

          <div className="bg-white/90 px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-slate-500 block text-[10px] uppercase font-sans font-bold">13% Input VAT Credit</span>
            <span className="font-bold text-emerald-700">रु. {(totalExpense * 0.08).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          </div>

          <a
            href="/reports"
            className="px-4 py-2 bg-gradient-to-r from-[#c4daff] to-[#e5ccff] text-[#0f172a] rounded-xl font-bold text-xs hover:opacity-90 transition-all shadow-xs border border-[#c4daff]/80 cursor-pointer"
          >
            View Tax Returns &rarr;
          </a>
        </div>
      </div>

      {/* Clean Slate Onboarding State when system is ready for user data */}
      {incomeList.length === 0 && expenseList.length === 0 && (
        <div className="glass card-tone-blue p-7 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="text-base font-bold text-slate-900">System Ready for Your Company Data</h3>
            <p className="text-xs text-slate-600 max-w-xl">
              All demo records have been cleared. You can start by issuing your first tax invoice, recording an expense, or uploading an existing data backup file in Company Settings.
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5 shrink-0">
            <a 
              href="/invoices" 
              className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-xs"
            >
              Issue Tax Invoice
            </a>
            <a 
              href="/settings" 
              className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              Upload Data Backup
            </a>
          </div>
        </div>
      )}

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
              <AreaChart data={monthlyChartData} margin={{ top: 10, right: 12, left: 4, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={0.38} />
                    <stop offset="100%" stopColor="#c4daff" stopOpacity={0.04} />
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="short" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  dy={10} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 12}} 
                  dx={-6} 
                  tickFormatter={(value) => (value >= 1000 ? `रु.${(value/1000).toFixed(0)}k` : `रु.${value}`)} 
                />
                <Tooltip
                  cursor={{ stroke: '#94a3b8', strokeDasharray: '4 4' }}
                  contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 14px 30px rgba(15, 23, 42, 0.12)' }}
                  formatter={(value: any, name: string | number | undefined) => [`रु. ${Number(value).toLocaleString('en-IN')}`, String(name || 'Value')]}
                  labelFormatter={(label) => `Month: ${String(label)}`}
                />
                <Area type="monotone" dataKey="income" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" name="Income" activeDot={{ r: 6, fill: '#4f46e5', stroke: '#fff', strokeWidth: 2 }} />
                <Area type="monotone" dataKey="expense" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" name="Expense" activeDot={{ r: 6, fill: '#f43f5e', stroke: '#fff', strokeWidth: 2 }} />
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
              <BarChart data={categoryData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                <defs>
                  <linearGradient id="barIncomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#c4daff" stopOpacity={0.95} />
                    <stop offset="100%" stopColor="#a5b4fc" stopOpacity={0.86} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#64748b', fontSize: 11}} 
                  dy={10} 
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11 }} hide={false} />
                <Tooltip
                  cursor={{ fill: '#eff6ff' }}
                  contentStyle={{ borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 14px 30px rgba(15, 23, 42, 0.12)' }}
                  formatter={(value: any) => [`रु. ${Number(value).toLocaleString('en-IN')}`, 'Revenue']}
                  labelFormatter={(label) => `Category: ${String(label)}`}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="url(#barIncomeGradient)" maxBarSize={58} />
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
