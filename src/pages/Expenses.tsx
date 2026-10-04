import { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  CreditCard, 
  Edit, 
  Trash2, 
  RotateCcw, 
  Receipt, 
  Download, 
  Eye, 
  X, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  TrendingUp, 
  PieChart,
  Calendar
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { NepaliDatePicker } from '../components/NepaliDatePicker';
import { getTodayBsDate } from '../lib/nepaliDate';
import { supabase } from '../lib/supabase';

export interface ExpenseItem {
  id: string;
  db_id?: string;
  date: string; // BS date YYYY-MM-DD
  vendor: string;
  category: string;
  amount: number;
  method: string;
  receipt: string;
  description?: string;
  vendor_pan?: string;
  receipt_photo?: string;
  created_at?: string;
}

const STANDARD_CATEGORIES = [
  'Office Rent',
  'Utilities & Electricity',
  'Internet & Telecom',
  'Software & Cloud Services',
  'Marketing & Advertising',
  'Salaries & Allowances',
  'Office Supplies & Stationery',
  'Hardware & Equipment',
  'Travel & Conveyance',
  'Legal & Professional Fees',
  'Food & Refreshments',
  'Maintenance & Repairs',
  'Taxes & Government Fees',
  'Miscellaneous'
];

const PAYMENT_METHODS = [
  'Bank Transfer',
  'eSewa',
  'Khalti',
  'Cash',
  'Credit / Debit Card',
  'ConnectIPS',
  'Cheque',
  'Other'
];

const initialExpenseData: ExpenseItem[] = [
  { 
    id: 'EXP-001', 
    date: '2083-06-16', 
    vendor: 'Kathmandu Properties', 
    category: 'Office Rent', 
    amount: 45000, 
    method: 'Bank Transfer', 
    receipt: 'RENT-2083-06',
    description: 'Monthly head office rent for Ashwin 2083',
    vendor_pan: '601928374'
  },
  { 
    id: 'EXP-002', 
    date: '2083-06-15', 
    vendor: 'Vianet Communications', 
    category: 'Internet & Telecom', 
    amount: 3500, 
    method: 'eSewa', 
    receipt: 'REC-VIA-1029',
    description: 'Office high-speed fiber internet renewal (300 Mbps)',
    vendor_pan: '600123987'
  },
  { 
    id: 'EXP-003', 
    date: '2083-06-14', 
    vendor: 'Digital Ocean / AWS', 
    category: 'Software & Cloud Services', 
    amount: 6500, 
    method: 'Credit / Debit Card', 
    receipt: 'INV-DO-992',
    description: 'Cloud VPS servers and storage hosting infrastructure'
  },
  { 
    id: 'EXP-004', 
    date: '2083-06-11', 
    vendor: 'Facebook Meta Ads', 
    category: 'Marketing & Advertising', 
    amount: 15000, 
    method: 'Credit / Debit Card', 
    receipt: 'FB-ADS-8821',
    description: 'Digital marketing campaigns for corporate clients'
  },
  { 
    id: 'EXP-005', 
    date: '2083-06-08', 
    vendor: 'Nepal Electricity Authority', 
    category: 'Utilities & Electricity', 
    amount: 4800, 
    method: 'eSewa', 
    receipt: 'NEA-83719',
    description: 'Office electricity monthly billing'
  },
];

const formatNPR = (amount: number): string => {
  return `रु. ${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getMethodColor = (method: string) => {
  switch (method.toLowerCase()) {
    case 'esewa':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'khalti':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'bank transfer':
    case 'connectips':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'cash':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'credit / debit card':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const getCategoryColor = (category: string) => {
  if (category.includes('Rent')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  if (category.includes('Internet') || category.includes('Telecom')) return 'bg-cyan-50 text-cyan-700 border-cyan-200';
  if (category.includes('Software') || category.includes('Cloud')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (category.includes('Marketing')) return 'bg-purple-50 text-purple-700 border-purple-200';
  if (category.includes('Utilities') || category.includes('Electricity')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (category.includes('Salary') || category.includes('Salaries')) return 'bg-rose-50 text-rose-700 border-rose-200';
  if (category.includes('Food') || category.includes('Refreshments')) return 'bg-orange-50 text-orange-700 border-orange-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

const DELETED_EXPENSES_KEY = 'aslenix_deleted_expenses';

const getDeletedExpenseIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_EXPENSES_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const recordDeletedExpenseId = (id: string, extraId?: string) => {
  try {
    const set = getDeletedExpenseIds();
    if (id) set.add(id);
    if (extraId) set.add(extraId);
    localStorage.setItem(DELETED_EXPENSES_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Failed to record deleted expense id:', e);
  }
};

const Expenses = () => {
  // Expense Data State
  const [expenseData, setExpenseData] = useState<ExpenseItem[]>(() => {
    const saved = localStorage.getItem('aslenix_expenses');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const deletedIds = getDeletedExpenseIds();
          return parsed.filter(item => !deletedIds.has(item.id) && (!item.db_id || !deletedIds.has(item.db_id)));
        }
      } catch (e) {
        console.error('Failed to parse saved expenses:', e);
      }
    }
    const deletedIds = getDeletedExpenseIds();
    return initialExpenseData.filter(item => !deletedIds.has(item.id));
  });

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [periodFilter, setPeriodFilter] = useState<'All' | 'ThisMonth' | 'LastMonth'>('All');

  // Modal & Form States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Lightbox Photo State
  const [lightboxReceipt, setLightboxReceipt] = useState<{ isOpen: boolean; url: string; title: string }>({
    isOpen: false,
    url: '',
    title: ''
  });

  const [formData, setFormData] = useState({
    date: getTodayBsDate(),
    vendor: '',
    category: 'Office Rent',
    amount: '',
    method: 'Bank Transfer',
    receipt: '',
    description: '',
    vendor_pan: '',
    receipt_photo: ''
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // Persistence Helper with quota safety
  const saveExpenseData = (data: ExpenseItem[]) => {
    setExpenseData(data);
    try {
      localStorage.setItem('aslenix_expenses', JSON.stringify(data));
    } catch (e) {
      console.warn('localStorage write failed, saving without large attachments:', e);
      try {
        const stripped = data.map(item => ({
          ...item,
          receipt_photo: item.receipt_photo && item.receipt_photo.length > 1000 ? '' : item.receipt_photo
        }));
        localStorage.setItem('aslenix_expenses', JSON.stringify(stripped));
      } catch (err) {
        console.error('Failed to save expenses to localStorage:', err);
      }
    }
  };

  // Sync with Supabase on mount
  useEffect(() => {
    const syncFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('*')
          .order('date', { ascending: false });

        if (!error && data && data.length > 0) {
          const deletedIds = getDeletedExpenseIds();
          const mapped: ExpenseItem[] = data
            .filter((d: any) => {
              const refId = d.expense_ref || d.id;
              const dbId = d.id;
              return !deletedIds.has(refId) && !deletedIds.has(dbId);
            })
            .map((d: any) => ({
              id: d.expense_ref || d.id || `EXP-${d.id?.slice(0, 4)}`,
              db_id: d.id,
              date: d.date || getTodayBsDate(),
              vendor: d.vendor_name || 'Vendor',
              category: d.category || 'General',
              amount: Number(d.amount || d.total_amount || 0),
              method: d.method || 'Bank Transfer',
              receipt: d.receipt_no || '',
              description: d.description || '',
              vendor_pan: d.vendor_pan || '',
              receipt_photo: d.attachment_url || ''
            }));

          setExpenseData(prev => {
            const serverRefs = new Set(mapped.map(m => m.id));
            const serverDbIds = new Set(mapped.map(m => m.db_id).filter(Boolean));
            const localOnly = prev.filter(p => 
              !deletedIds.has(p.id) && 
              (!p.db_id || !deletedIds.has(p.db_id)) &&
              !serverRefs.has(p.id) && 
              (!p.db_id || !serverDbIds.has(p.db_id))
            );
            const combined = [...mapped, ...localOnly];
            try {
              localStorage.setItem('aslenix_expenses', JSON.stringify(combined));
            } catch {}
            return combined;
          });
        }
      } catch (err) {
        // Supabase offline / table absent fallback to localStorage
      }
    };
    syncFromSupabase();
  }, []);

  // Current BS Year & Month calculation
  const todayBs = useMemo(() => getTodayBsDate(), []);
  const currentBsYearMonth = useMemo(() => todayBs.slice(0, 7), [todayBs]);

  // Categories list for Filter dropdown
  const allCategories = useMemo(() => {
    const set = new Set([...STANDARD_CATEGORIES, ...expenseData.map(item => item.category).filter(Boolean)]);
    return ['All', ...Array.from(set)];
  }, [expenseData]);

  // Methods list for Filter dropdown
  const allMethods = useMemo(() => {
    const set = new Set([...PAYMENT_METHODS, ...expenseData.map(item => item.method).filter(Boolean)]);
    return ['All', ...Array.from(set)];
  }, [expenseData]);

  // ================= DYNAMIC STATISTICS ENGINE =================
  const dynamicStats = useMemo(() => {
    const totalCount = expenseData.length;
    const totalAmount = expenseData.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const avgExpense = totalCount > 0 ? totalAmount / totalCount : 0;

    // This Month records
    const thisMonthRecords = expenseData.filter(item => item.date && item.date.startsWith(currentBsYearMonth));
    const thisMonthTotal = thisMonthRecords.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const thisMonthCount = thisMonthRecords.length;

    // Highest Category Calculation
    const catMap: Record<string, number> = {};
    for (const item of expenseData) {
      const cat = item.category || 'Uncategorized';
      catMap[cat] = (catMap[cat] || 0) + (Number(item.amount) || 0);
    }
    const catEntries = Object.entries(catMap);
    let topCategory: { name: string; amount: number; percentage: number } | null = null;
    if (catEntries.length > 0) {
      catEntries.sort((a, b) => b[1] - a[1]);
      const topAmount = catEntries[0][1];
      const pct = totalAmount > 0 ? (topAmount / totalAmount) * 100 : 0;
      topCategory = {
        name: catEntries[0][0],
        amount: topAmount,
        percentage: Number(pct.toFixed(1))
      };
    }

    return {
      totalCount,
      totalAmount,
      avgExpense,
      thisMonthTotal,
      thisMonthCount,
      topCategory
    };
  }, [expenseData, currentBsYearMonth]);

  // ================= DYNAMIC FILTERED DATA =================
  const filteredExpenseData = useMemo(() => {
    return expenseData.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        item.vendor.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        item.receipt.toLowerCase().includes(q) ||
        item.method.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.vendor_pan && item.vendor_pan.includes(q)) ||
        item.date.includes(q);

      const matchesCat = categoryFilter === 'All' || item.category === categoryFilter;
      const matchesMethod = methodFilter === 'All' || item.method === methodFilter;

      let matchesPeriod = true;
      if (periodFilter === 'ThisMonth') {
        matchesPeriod = Boolean(item.date && item.date.startsWith(currentBsYearMonth));
      } else if (periodFilter === 'LastMonth') {
        // Simple previous month heuristic
        const [y, m] = currentBsYearMonth.split('-').map(Number);
        const prevM = m === 1 ? 12 : m - 1;
        const prevY = m === 1 ? y - 1 : y;
        const prevYearMonth = `${prevY}-${String(prevM).padStart(2, '0')}`;
        matchesPeriod = Boolean(item.date && item.date.startsWith(prevYearMonth));
      }

      return matchesSearch && matchesCat && matchesMethod && matchesPeriod;
    });
  }, [expenseData, searchTerm, categoryFilter, methodFilter, periodFilter, currentBsYearMonth]);

  // Form Reset
  const resetForm = () => {
    setFormData({
      date: getTodayBsDate(),
      vendor: '',
      category: 'Office Rent',
      amount: '',
      method: 'Bank Transfer',
      receipt: '',
      description: '',
      vendor_pan: '',
      receipt_photo: ''
    });
    setIsCustomCategory(false);
    setCustomCategoryInput('');
    setEditingId(null);
  };

  // Open Edit Modal
  const handleEditClick = (expense: ExpenseItem) => {
    setEditingId(expense.id);
    const isStandard = STANDARD_CATEGORIES.includes(expense.category);
    setIsCustomCategory(!isStandard);
    if (!isStandard) {
      setCustomCategoryInput(expense.category);
    }
    setFormData({
      date: expense.date,
      vendor: expense.vendor,
      category: isStandard ? expense.category : 'Custom',
      amount: expense.amount.toString(),
      method: expense.method || 'Bank Transfer',
      receipt: expense.receipt || '',
      description: expense.description || '',
      vendor_pan: expense.vendor_pan || '',
      receipt_photo: expense.receipt_photo || ''
    });
    setIsModalOpen(true);
  };

  // Duplicate an expense
  const handleDuplicate = (expense: ExpenseItem) => {
    const nextSeq = expenseData.length + 1;
    const duplicated: ExpenseItem = {
      ...expense,
      id: `EXP-${String(nextSeq).padStart(3, '0')}`,
      date: getTodayBsDate(),
      receipt: `REC-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString()
    };
    saveExpenseData([duplicated, ...expenseData]);
  };

  // Photo Attachment Handler with Canvas compression
  const handleReceiptPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxDim = 1200;
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressed = canvas.toDataURL('image/jpeg', 0.85);
          setFormData(prev => ({ ...prev, receipt_photo: compressed }));
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Delete Action
  const handleDeleteClick = (id: string) => {
    setExpenseToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (expenseToDelete) {
      const target = expenseData.find(item => item.id === expenseToDelete || item.db_id === expenseToDelete);
      const targetDbId = target?.db_id;
      const targetRef = target?.id || expenseToDelete;

      // 1. Immediately record in persistent deleted tombstone list
      recordDeletedExpenseId(targetRef, targetDbId);

      // 2. Immediately remove from local state & update localStorage
      const updated = expenseData.filter(item => item.id !== expenseToDelete && (!targetDbId || item.db_id !== targetDbId));
      saveExpenseData(updated);

      setDeleteModalOpen(false);
      setExpenseToDelete(null);

      // 3. Attempt database deletion by both id (UUID) and expense_ref
      try {
        if (targetDbId) {
          await supabase.from('expenses').delete().eq('id', targetDbId);
        }
        await supabase
          .from('expenses')
          .delete()
          .or(`expense_ref.eq.${targetRef},id.eq.${targetRef}`);
      } catch (err) {
        console.error('Supabase expense delete error:', err);
      }
    }
  };

  // Save Form (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isCustomCategory ? (customCategoryInput.trim() || 'General Expense') : formData.category;
    const finalAmount = Math.max(0, parseFloat(formData.amount) || 0);

    if (editingId) {
      const updated = expenseData.map(item => 
        item.id === editingId 
          ? { 
              ...item, 
              date: formData.date,
              vendor: formData.vendor.trim() || 'General Vendor',
              category: finalCategory,
              amount: finalAmount,
              method: formData.method,
              receipt: formData.receipt.trim() || item.receipt,
              description: formData.description.trim(),
              vendor_pan: formData.vendor_pan.trim(),
              receipt_photo: formData.receipt_photo
            } 
          : item
      );
      saveExpenseData(updated);

      try {
        await supabase.from('expenses').update({
          date: formData.date,
          vendor_name: formData.vendor.trim(),
          category: finalCategory,
          amount: finalAmount,
          total_amount: finalAmount,
          method: formData.method,
          receipt_no: formData.receipt.trim(),
          description: formData.description.trim(),
          vendor_pan: formData.vendor_pan.trim(),
          attachment_url: formData.receipt_photo
        }).eq('expense_ref', editingId);
      } catch (err) {}

    } else {
      const nextSeq = expenseData.length + 1;
      const nextId = `EXP-${String(nextSeq).padStart(3, '0')}`;
      const newExpense: ExpenseItem = {
        id: nextId,
        date: formData.date,
        vendor: formData.vendor.trim() || 'General Vendor',
        category: finalCategory,
        amount: finalAmount,
        method: formData.method,
        receipt: formData.receipt.trim() || `REC-${Date.now().toString().slice(-4)}`,
        description: formData.description.trim(),
        vendor_pan: formData.vendor_pan.trim(),
        receipt_photo: formData.receipt_photo,
        created_at: new Date().toISOString()
      };
      const updated = [newExpense, ...expenseData];
      saveExpenseData(updated);

      try {
        const { data: insertedData } = await supabase.from('expenses').insert([{
          expense_ref: nextId,
          date: formData.date,
          vendor_name: formData.vendor.trim(),
          category: finalCategory,
          amount: finalAmount,
          total_amount: finalAmount,
          method: formData.method,
          receipt_no: newExpense.receipt,
          description: formData.description.trim(),
          vendor_pan: formData.vendor_pan.trim(),
          attachment_url: formData.receipt_photo
        }]).select();

        if (insertedData?.[0]?.id) {
          setExpenseData(prev => prev.map(item => item.id === nextId ? { ...item, db_id: insertedData[0].id } : item));
        }
      } catch (err) {}
    }

    setIsModalOpen(false);
    resetForm();
  };

  // Copy ID feedback
  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredExpenseData.length === 0) return;
    const headers = ['Expense ID', 'Date (BS)', 'Vendor / Payee', 'Category', 'Payment Method', 'Amount (NPR)', 'Receipt Ref', 'Description', 'Vendor PAN'];
    const rows = filteredExpenseData.map(e => [
      e.id,
      e.date,
      `"${e.vendor.replace(/"/g, '""')}"`,
      `"${e.category.replace(/"/g, '""')}"`,
      `"${e.method}"`,
      e.amount,
      `"${e.receipt || ''}"`,
      `"${(e.description || '').replace(/"/g, '""')}"`,
      `"${e.vendor_pan || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aslenix-expenses-${getTodayBsDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-bold text-primary tracking-tight">Expenditure & Outgoings</h2>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time tracking of operational expenses, vendor bills, and business outlays.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={handleExportCSV}
            disabled={filteredExpenseData.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Export filtered records to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="btn-gradient flex items-center justify-center gap-2 px-5 py-2 rounded-xl font-bold transition-all cursor-pointer flex-1 md:flex-none text-xs"
          >
            <Plus size={18} className="text-black" />
            <span>Add Expense</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC SUMMARY METRIC CARDS (100% Calculated in Real Time) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Expenses (This Month) */}
        <div className="bg-[#FFF6F6] p-5 rounded-3xl shadow-xs border border-rose-100/90 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-rose-100/80 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-200/60 shrink-0">
              <CreditCard size={20} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              THIS MONTH
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              This Month's Spend
            </p>
            <h3 className="text-2xl font-black text-rose-600 mt-1 font-mono">
              {formatNPR(dynamicStats.thisMonthTotal)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              {dynamicStats.thisMonthCount > 0 ? (
                <span><strong className="text-slate-700">{dynamicStats.thisMonthCount}</strong> transactions in this month</span>
              ) : (
                <span>No expenses recorded this month</span>
              )}
            </p>
          </div>
        </div>

        {/* Card 2: All-Time Total Expenses */}
        <div className="bg-[#F8FAFF] p-5 rounded-3xl shadow-xs border border-blue-100/90 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100/80 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-200/60 shrink-0">
              <TrendingUp size={20} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              TOTAL SPEND
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              All-Time Outgoings
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {formatNPR(dynamicStats.totalAmount)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Across <strong className="text-slate-700">{dynamicStats.totalCount}</strong> total expense records
            </p>
          </div>
        </div>

        {/* Card 3: Highest Category (100% Dynamic) */}
        <div className="bg-[#FFF9F5] p-5 rounded-3xl shadow-xs border border-orange-100/90 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-100/80 rounded-2xl flex items-center justify-center text-orange-600 border border-orange-200/60 shrink-0">
              <PieChart size={20} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
              TOP OUTFLOW
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Highest Category
            </p>
            <h3 className="text-lg font-bold text-slate-900 mt-1 truncate" title={dynamicStats.topCategory?.name || 'None'}>
              {dynamicStats.topCategory?.name || 'No Records'}
            </h3>
            <p className="text-xs font-semibold text-rose-600 font-mono mt-0.5">
              {dynamicStats.topCategory ? formatNPR(dynamicStats.topCategory.amount) : 'रु. 0.00'}
              {dynamicStats.topCategory && (
                <span className="text-[10px] text-slate-400 font-normal ml-1.5 font-sans">
                  ({dynamicStats.topCategory.percentage}%)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Card 4: Average Expense Size */}
        <div className="bg-[#F6FAF7] p-5 rounded-3xl shadow-xs border border-emerald-100/90 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-100/80 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-200/60 shrink-0">
              <Receipt size={20} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              AVG TICKET
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Average / Entry
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {formatNPR(dynamicStats.avgExpense)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Avg transaction ticket size
            </p>
          </div>
        </div>
      </div>

      {/* 3. Table Controls & Filters Bar */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden mb-6">
        <div className="p-4 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-3 bg-slate-50/60">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by vendor, category, receipt, amount, notes..." 
              className="w-full pl-9 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all shadow-2xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
              <Calendar size={13} className="text-slate-400" />
              <select
                value={periodFilter}
                onChange={(e) => setPeriodFilter(e.target.value as any)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
              >
                <option value="All">All Periods</option>
                <option value="ThisMonth">This Month (BS)</option>
                <option value="LastMonth">Last Month (BS)</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
              <Filter size={13} className="text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs max-w-[140px] truncate"
              >
                {allCategories.map((c) => (
                  <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
                ))}
              </select>
            </div>

            {/* Method Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs shadow-2xs">
              <CreditCard size={13} className="text-slate-400" />
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
              >
                {allMethods.map((m) => (
                  <option key={m} value={m}>{m === 'All' ? 'All Methods' : m}</option>
                ))}
              </select>
            </div>

            {/* Reset Filters */}
            {(categoryFilter !== 'All' || methodFilter !== 'All' || periodFilter !== 'All' || searchTerm) && (
              <button
                onClick={() => {
                  setCategoryFilter('All');
                  setMethodFilter('All');
                  setPeriodFilter('All');
                  setSearchTerm('');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer border border-rose-200"
                title="Reset all filters"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}

            <div className="text-xs text-slate-400 font-medium pl-1 hidden sm:block">
              Showing <span className="font-bold text-slate-800">{filteredExpenseData.length}</span> of {expenseData.length}
            </div>
          </div>
        </div>

        {/* 4. EXPENSES TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Date (BS) / Ref ID</th>
                <th className="px-5 py-3.5">Vendor & Category</th>
                <th className="px-4 py-3.5">Payment Method</th>
                <th className="px-5 py-3.5 text-right">Amount (NPR)</th>
                <th className="px-4 py-3.5 text-center">Receipt & Bill</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredExpenseData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3 max-w-sm mx-auto">
                      <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center border border-rose-100 shadow-2xs">
                        <Receipt size={28} />
                      </div>
                      <h4 className="font-bold text-slate-800 text-sm">No Expense Records Found</h4>
                      <p className="text-xs text-slate-400 -mt-1 leading-relaxed">
                        {searchTerm || categoryFilter !== 'All' || methodFilter !== 'All' || periodFilter !== 'All'
                          ? 'No expenses matched your specific filter criteria. Try resetting filters.'
                          : 'You haven\'t recorded any expenses yet. Click the button below to add your first expense!'}
                      </p>
                      {searchTerm || categoryFilter !== 'All' || methodFilter !== 'All' || periodFilter !== 'All' ? (
                        <button
                          onClick={() => {
                            setCategoryFilter('All');
                            setMethodFilter('All');
                            setPeriodFilter('All');
                            setSearchTerm('');
                          }}
                          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Clear All Filters
                        </button>
                      ) : (
                        <button 
                          onClick={() => { resetForm(); setIsModalOpen(true); }}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          + Record First Expense
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredExpenseData.map((expense) => (
                  <tr key={expense.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* Date (BS) / ID */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 font-mono">
                          {expense.date}
                        </span>
                        <span className="text-[10px] text-slate-400">BS</span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <button
                          type="button"
                          onClick={(e) => handleCopyId(expense.id, e)}
                          title="Click to copy ID"
                          className="font-mono text-[11px] text-slate-400 hover:text-indigo-600 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <span>{expense.id}</span>
                          {copiedId === expense.id ? (
                            <Check size={11} className="text-emerald-600" />
                          ) : (
                            <Copy size={11} className="opacity-0 group-hover:opacity-100" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Vendor & Category */}
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0">
                          {expense.vendor.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 leading-tight truncate max-w-[200px]" title={expense.vendor}>
                            {expense.vendor}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold border ${getCategoryColor(expense.category)}`}>
                              {expense.category}
                            </span>
                            {expense.vendor_pan && (
                              <span className="text-[10px] font-mono text-slate-400" title="Vendor PAN">
                                PAN: {expense.vendor_pan}
                              </span>
                            )}
                          </div>
                          {expense.description && (
                            <p className="text-[11px] text-slate-400 truncate max-w-[280px] mt-0.5" title={expense.description}>
                              {expense.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Payment Method */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${getMethodColor(expense.method)}`}>
                        {expense.method}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="px-5 py-3.5 text-right font-black text-rose-600 font-mono text-sm whitespace-nowrap">
                      - {formatNPR(expense.amount)}
                    </td>

                    {/* Receipt & Bill */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {expense.receipt_photo ? (
                          <button
                            type="button"
                            onClick={() => setLightboxReceipt({ isOpen: true, url: expense.receipt_photo!, title: `${expense.vendor} - ${expense.receipt || expense.id}` })}
                            className="relative group/thumb cursor-pointer shrink-0"
                            title="Click to view attached bill"
                          >
                            <img
                              src={expense.receipt_photo}
                              alt="Receipt"
                              className="w-8 h-8 rounded-lg object-cover border border-slate-200 ring-1 ring-slate-100 group-hover/thumb:ring-rose-400 transition-all"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 rounded-lg opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition-opacity">
                              <Eye size={12} />
                            </div>
                          </button>
                        ) : null}
                        {expense.receipt ? (
                          <span className="font-mono text-xs font-medium text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200/80">
                            {expense.receipt}
                          </span>
                        ) : (
                          <span className="text-slate-300 text-xs">—</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleDuplicate(expense)}
                          title="Duplicate Expense Entry"
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Copy size={14} />
                        </button>
                        <button 
                          onClick={() => handleEditClick(expense)}
                          title="Edit Expense"
                          className="p-1.5 text-slate-400 hover:text-accent hover:bg-accent/10 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit size={14} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(expense.id)}
                          title="Delete Expense"
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Expense Record"
        message="Are you sure you want to delete this expense record? This will adjust your monthly outgoings and cannot be undone."
        confirmText="Delete Record"
        isDanger={true}
      />

      {/* Lightbox for Receipt / Bill Photo */}
      {lightboxReceipt.isOpen && (
        <div 
          onClick={() => setLightboxReceipt({ isOpen: false, url: '', title: '' })}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200 cursor-pointer"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-4 max-w-2xl w-full shadow-2xl relative animate-in zoom-in-95 duration-200"
          >
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-3">
              <h3 className="font-bold text-slate-900 text-sm">{lightboxReceipt.title}</h3>
              <button 
                onClick={() => setLightboxReceipt({ isOpen: false, url: '', title: '' })}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-slate-50 rounded-xl p-2">
              <img 
                src={lightboxReceipt.url} 
                alt="Receipt Full View" 
                className="max-h-[70vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* ================= ENHANCED DYNAMIC ADD / EDIT EXPENSE MODAL ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-sm shadow-rose-600/30">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingId ? 'Edit Expense Record' : 'Record New Expense'}
                  </h2>
                  <p className="text-xs text-slate-500">
                    Add business outgoing with vendor, payment mode & receipt
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Row 1: Date & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <NepaliDatePicker 
                    label="Date (BS मिति)*" 
                    value={formData.date} 
                    onChange={(val) => setFormData({ ...formData, date: val })} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Amount (रकम रु.)*
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      रु.
                    </span>
                    <input 
                      type="number" 
                      required
                      min="0"
                      step="0.01"
                      placeholder="0.00"
                      className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 font-mono transition-all"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                  {formData.amount && (
                    <p className="text-[11px] text-rose-600 font-medium mt-1 font-mono">
                      = {formatNPR(parseFloat(formData.amount) || 0)}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: Vendor Name & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Vendor / Payee Name*
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Kathmandu Properties, Vianet, NEA"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-medium"
                    value={formData.vendor}
                    onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Expense Category*
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer bg-white"
                    value={isCustomCategory ? 'Custom' : formData.category}
                    onChange={(e) => {
                      if (e.target.value === 'Custom') {
                        setIsCustomCategory(true);
                      } else {
                        setIsCustomCategory(false);
                        setFormData({ ...formData, category: e.target.value });
                      }
                    }}
                  >
                    {STANDARD_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="Custom">+ Custom Category...</option>
                  </select>
                </div>
              </div>

              {/* Custom Category Input if selected */}
              {isCustomCategory && (
                <div className="bg-indigo-50/70 p-3.5 rounded-xl border border-indigo-200 animate-in fade-in duration-200">
                  <label className="block text-xs font-semibold text-indigo-900 uppercase tracking-wider mb-1">
                    Enter Custom Category Name*
                  </label>
                  <input 
                    type="text" 
                    required={isCustomCategory}
                    placeholder="e.g. Printing & Publications, Security Deposit"
                    className="w-full px-3 py-2 bg-white border border-indigo-300 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    value={customCategoryInput}
                    onChange={(e) => setCustomCategoryInput(e.target.value)}
                  />
                </div>
              )}

              {/* Row 3: Payment Method & Receipt Reference */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Payment Method*
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all cursor-pointer bg-white"
                    value={formData.method}
                    onChange={(e) => setFormData({...formData, method: e.target.value})}
                  >
                    {PAYMENT_METHODS.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Receipt / Bill Ref No.
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. REC-1029, INV-4491, VOUCH-01"
                    className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    value={formData.receipt}
                    onChange={(e) => setFormData({...formData, receipt: e.target.value})}
                  />
                </div>
              </div>

              {/* Row 4: Description / Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Purpose (विवरण)
                </label>
                <textarea 
                  rows={2}
                  placeholder="Additional details regarding this business expenditure..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Row 5: Optional Vendor PAN & Receipt Bill Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Vendor PAN / VAT (Optional)
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 609123456"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    value={formData.vendor_pan}
                    onChange={(e) => setFormData({...formData, vendor_pan: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                    Attach Bill / Receipt Photo
                  </label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors border border-slate-200 flex-1 justify-center">
                      <ImageIcon size={15} />
                      <span>{formData.receipt_photo ? 'Change Bill Photo' : 'Upload Receipt Photo'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleReceiptPhotoUpload} 
                      />
                    </label>
                    {formData.receipt_photo && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, receipt_photo: '' })}
                        className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl border border-rose-200 transition-colors"
                        title="Remove attached photo"
                      >
                        <X size={15} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Receipt Preview Thumbnail if uploaded */}
              {formData.receipt_photo && (
                <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                  <img 
                    src={formData.receipt_photo} 
                    alt="Receipt Preview" 
                    className="w-12 h-12 rounded-lg object-cover border border-slate-200" 
                  />
                  <div className="text-xs">
                    <p className="font-semibold text-slate-800">Bill Photo Attached</p>
                    <p className="text-slate-400 text-[11px]">Ready to save with this expense record</p>
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-gradient px-6 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CreditCard size={15} className="text-black" />
                  <span>{editingId ? 'Save Changes' : 'Save Expense'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expenses;
