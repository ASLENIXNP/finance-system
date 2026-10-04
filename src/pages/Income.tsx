import { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Wallet, 
  Edit, 
  Trash2, 
  RotateCcw, 
  Download, 
  Eye, 
  X, 
  Image as ImageIcon, 
  Copy, 
  Check, 
  TrendingUp, 
  PieChart, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  CreditCard
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { NepaliDatePicker } from '../components/NepaliDatePicker';
import { formatNepaliDate, toBsDateString, getTodayBsDate } from '../lib/nepaliDate';
import { supabase } from '../lib/supabase';

export interface IncomeItem {
  id: string;
  db_id?: string;
  date: string; // BS date YYYY-MM-DD
  invoice: string;
  customer: string;
  category: string;
  amount: number;
  method: string;
  status: 'Completed' | 'Pending';
  description?: string;
  customer_pan?: string;
  receipt_photo?: string;
  created_at?: string;
}

const STANDARD_CATEGORIES = [
  'Custom Web Application Development',
  'Mobile App Development (iOS/Android)',
  'UI/UX Design & Prototyping',
  'Software Licensing & SaaS',
  'Cloud Server VPS & Hosting',
  'Annual Software Maintenance (AMC)',
  'IT Consulting & Advisory',
  'Digital Marketing & Meta Ads',
  'Hardware & Network Solutions',
  'Support & Retainer Services',
  'Miscellaneous Revenue'
];

const PAYMENT_METHODS = [
  'Bank Transfer',
  'eSewa',
  'Khalti',
  'ConnectIPS',
  'Cheque',
  'Cash',
  'Credit / Debit Card',
  'Other'
];

const initialIncomeData: IncomeItem[] = [
  { 
    id: 'INC-001', 
    date: '2083-06-15', 
    invoice: 'ASL-2083-0012', 
    customer: 'Tech Innovations Pvt. Ltd.', 
    category: 'Custom Web Application Development', 
    amount: 45000, 
    method: 'Bank Transfer', 
    status: 'Completed',
    description: 'Web application milestone 2 delivery payment via Nabil Bank',
    customer_pan: '601234567'
  },
  { 
    id: 'INC-002', 
    date: '2083-06-12', 
    invoice: 'ASL-2083-0011', 
    customer: 'Himalayan Coffee House', 
    category: 'UI/UX Design & Prototyping', 
    amount: 15500, 
    method: 'eSewa', 
    status: 'Completed',
    description: 'Brand identity, mobile ordering UI prototype design',
    customer_pan: '602345678'
  },
  { 
    id: 'INC-003', 
    date: '2083-06-09', 
    invoice: 'ASL-2083-0009', 
    customer: 'Retail Solutions', 
    category: 'Software Licensing & SaaS', 
    amount: 85000, 
    method: 'Cheque', 
    status: 'Pending',
    description: 'Enterprise ERP inventory module annual license (CHQ-445566)',
    customer_pan: '603456789'
  },
  { 
    id: 'INC-004', 
    date: '2083-06-04', 
    invoice: 'REC-2083-004', 
    customer: 'Global Tech Nepal', 
    category: 'IT Consulting & Advisory', 
    amount: 12000, 
    method: 'Cash', 
    status: 'Completed',
    description: 'Technical cloud architecture review and advisory',
    customer_pan: '601234567'
  },
];

const formatNPR = (amount: number): string => {
  return `रु. ${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getMethodColor = (method: string) => {
  switch (method?.toLowerCase()) {
    case 'esewa':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    case 'khalti':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'bank transfer':
    case 'connectips':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'cash':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'cheque':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'credit / debit card':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const getCategoryColor = (category: string) => {
  if (category.includes('Web') || category.includes('App') || category.includes('Software')) {
    return 'bg-indigo-50 text-indigo-700 border-indigo-200';
  }
  if (category.includes('UI/UX') || category.includes('Design')) {
    return 'bg-purple-50 text-purple-700 border-purple-200';
  }
  if (category.includes('Cloud') || category.includes('Hosting')) {
    return 'bg-cyan-50 text-cyan-700 border-cyan-200';
  }
  if (category.includes('Consulting') || category.includes('Advisory')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  }
  if (category.includes('Maintenance') || category.includes('AMC') || category.includes('Support')) {
    return 'bg-blue-50 text-blue-700 border-blue-200';
  }
  if (category.includes('Marketing') || category.includes('Ads')) {
    return 'bg-rose-50 text-rose-700 border-rose-200';
  }
  if (category.includes('Hardware')) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  return 'bg-slate-100 text-slate-700 border-slate-200';
};

const DELETED_INCOME_KEY = 'aslenix_deleted_income';

const getDeletedIncomeIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_INCOME_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const recordDeletedIncomeId = (id: string, extraId?: string) => {
  try {
    const set = getDeletedIncomeIds();
    if (id) set.add(id);
    if (extraId) set.add(extraId);
    localStorage.setItem(DELETED_INCOME_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Failed to record deleted income id:', e);
  }
};

const clearDeletedIncomeIds = () => {
  try {
    localStorage.removeItem(DELETED_INCOME_KEY);
  } catch {}
};

const Income = () => {
  // Income Data State
  const [incomeData, setIncomeData] = useState<IncomeItem[]>(() => {
    const saved = localStorage.getItem('aslenix_income');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const deletedIds = getDeletedIncomeIds();
          return parsed.filter(item => !deletedIds.has(item.id) && (!item.db_id || !deletedIds.has(item.db_id)));
        }
      } catch (e) {
        console.error('Failed to parse saved income:', e);
      }
    }
    const deletedIds = getDeletedIncomeIds();
    return initialIncomeData.filter(item => !deletedIds.has(item.id));
  });

  // Saved customer suggestions
  const [savedCustomers, setSavedCustomers] = useState<{ name: string; pan?: string }[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('aslenix_customers');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setSavedCustomers(parsed.map(c => ({ name: c.name || c.company_name, pan: c.pan_number })));
        }
      }
    } catch {}
  }, []);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [methodFilter, setMethodFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Completed' | 'Pending'>('All');
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
    customer: '',
    customer_pan: '',
    category: 'Custom Web Application Development',
    amount: '',
    method: 'Bank Transfer',
    status: 'Completed' as 'Completed' | 'Pending',
    invoice: '',
    description: '',
    receipt_photo: ''
  });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [incomeToDelete, setIncomeToDelete] = useState<string | null>(null);

  // Persistence Helper with quota safety
  const saveIncomeData = (data: IncomeItem[]) => {
    setIncomeData(data);
    try {
      localStorage.setItem('aslenix_income', JSON.stringify(data));
    } catch (e) {
      console.warn('localStorage write failed, saving without large attachments:', e);
      try {
        const stripped = data.map(item => ({
          ...item,
          receipt_photo: item.receipt_photo && item.receipt_photo.length > 1000 ? '' : item.receipt_photo
        }));
        localStorage.setItem('aslenix_income', JSON.stringify(stripped));
      } catch (err) {
        console.error('Failed to save income to localStorage:', err);
      }
    }
  };

  // Sync with Supabase on mount
  useEffect(() => {
    const syncFromSupabase = async () => {
      try {
        const { data, error } = await supabase
          .from('payments')
          .select('*, customers(name, pan_number), invoices(invoice_number)')
          .order('payment_date', { ascending: false });

        if (!error && data && data.length > 0) {
          const deletedIds = getDeletedIncomeIds();
          const mapped: IncomeItem[] = data
            .filter((d: any) => {
              const refId = d.payment_ref || d.id;
              const dbId = d.id;
              return !deletedIds.has(refId) && !deletedIds.has(dbId);
            })
            .map((d: any) => ({
              id: d.payment_ref || d.id || `INC-${d.id?.slice(0, 4)}`,
              db_id: d.id,
              date: d.payment_date || getTodayBsDate(),
              invoice: d.invoices?.invoice_number || d.bank_transaction_id || `INV-${d.id?.slice(0, 4)}`,
              customer: d.customers?.name || 'Customer',
              category: d.category || 'Custom Web Application Development',
              amount: Number(d.amount || 0),
              method: d.method || 'Bank Transfer',
              status: 'Completed',
              description: d.notes || '',
              customer_pan: d.customers?.pan_number || '',
              receipt_photo: ''
            }));

          setIncomeData(prev => {
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
              localStorage.setItem('aslenix_income', JSON.stringify(combined));
            } catch {}
            return combined;
          });
        }
      } catch (err) {
        // Fallback to localStorage
      }
    };
    syncFromSupabase();
  }, []);

  // Current BS Year & Month calculation
  const todayBs = useMemo(() => getTodayBsDate(), []);
  const currentBsYearMonth = useMemo(() => todayBs.slice(0, 7), [todayBs]);

  // Categories list for Filter dropdown
  const allCategories = useMemo(() => {
    const set = new Set([...STANDARD_CATEGORIES, ...incomeData.map(item => item.category).filter(Boolean)]);
    return ['All', ...Array.from(set)];
  }, [incomeData]);

  // Methods list for Filter dropdown
  const allMethods = useMemo(() => {
    const set = new Set([...PAYMENT_METHODS, ...incomeData.map(item => item.method).filter(Boolean)]);
    return ['All', ...Array.from(set)];
  }, [incomeData]);

  // ================= DYNAMIC STATISTICS ENGINE =================
  const dynamicStats = useMemo(() => {
    const totalCount = incomeData.length;
    const completedRecords = incomeData.filter(item => item.status === 'Completed');
    const pendingRecords = incomeData.filter(item => item.status === 'Pending');

    const allTimeReceived = completedRecords.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const pendingTotal = pendingRecords.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const pendingCount = pendingRecords.length;

    // This Month records
    const thisMonthCompleted = completedRecords.filter(item => item.date && item.date.startsWith(currentBsYearMonth));
    const thisMonthReceived = thisMonthCompleted.reduce((acc, item) => acc + (Number(item.amount) || 0), 0);
    const thisMonthCount = thisMonthCompleted.length;

    // Highest Revenue Category Calculation (among completed)
    const catMap: Record<string, number> = {};
    for (const item of completedRecords) {
      const cat = item.category || 'Uncategorized';
      catMap[cat] = (catMap[cat] || 0) + (Number(item.amount) || 0);
    }
    const catEntries = Object.entries(catMap);
    let topCategory: { name: string; amount: number; percentage: number } | null = null;
    if (catEntries.length > 0) {
      catEntries.sort((a, b) => b[1] - a[1]);
      const topAmount = catEntries[0][1];
      const percentage = allTimeReceived > 0 ? Math.round((topAmount / allTimeReceived) * 100) : 0;
      topCategory = {
        name: catEntries[0][0],
        amount: topAmount,
        percentage
      };
    }

    // Average Received payment
    const avgIncome = completedRecords.length > 0 ? allTimeReceived / completedRecords.length : 0;

    return {
      totalCount,
      completedCount: completedRecords.length,
      allTimeReceived,
      pendingTotal,
      pendingCount,
      thisMonthReceived,
      thisMonthCount,
      topCategory,
      avgIncome
    };
  }, [incomeData, currentBsYearMonth]);

  // Filtered Income records
  const filteredIncomeData = useMemo(() => {
    return incomeData.filter(item => {
      // 1. Text Search (Customer, Invoice, Category, PAN, Description, ID)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matches = 
          (item.customer && item.customer.toLowerCase().includes(query)) ||
          (item.invoice && item.invoice.toLowerCase().includes(query)) ||
          (item.category && item.category.toLowerCase().includes(query)) ||
          (item.description && item.description.toLowerCase().includes(query)) ||
          (item.customer_pan && item.customer_pan.includes(query)) ||
          (item.method && item.method.toLowerCase().includes(query)) ||
          item.id.toLowerCase().includes(query);

        if (!matches) return false;
      }

      // 2. Category Filter
      if (categoryFilter !== 'All' && item.category !== categoryFilter) {
        return false;
      }

      // 3. Payment Method Filter
      if (methodFilter !== 'All' && item.method !== methodFilter) {
        return false;
      }

      // 4. Status Filter
      if (statusFilter !== 'All' && item.status !== statusFilter) {
        return false;
      }

      // 5. Period Filter (Nepali BS date filtering)
      if (periodFilter === 'ThisMonth') {
        if (!item.date || !item.date.startsWith(currentBsYearMonth)) return false;
      } else if (periodFilter === 'LastMonth') {
        const [yearStr, monthStr] = currentBsYearMonth.split('-');
        let year = parseInt(yearStr, 10);
        let month = parseInt(monthStr, 10) - 1;
        if (month === 0) {
          month = 12;
          year -= 1;
        }
        const lastMonthPrefix = `${year}-${String(month).padStart(2, '0')}`;
        if (!item.date || !item.date.startsWith(lastMonthPrefix)) return false;
      }

      return true;
    });
  }, [incomeData, searchTerm, categoryFilter, methodFilter, statusFilter, periodFilter, currentBsYearMonth]);

  // Form Reset
  const resetForm = () => {
    setFormData({
      date: getTodayBsDate(),
      customer: '',
      customer_pan: '',
      category: 'Custom Web Application Development',
      amount: '',
      method: 'Bank Transfer',
      status: 'Completed',
      invoice: '',
      description: '',
      receipt_photo: ''
    });
    setEditingId(null);
    setIsCustomCategory(false);
    setCustomCategoryInput('');
  };

  // Open Edit Modal
  const handleEditClick = (income: IncomeItem) => {
    setEditingId(income.id);
    const isStandard = STANDARD_CATEGORIES.includes(income.category);
    setIsCustomCategory(!isStandard);
    if (!isStandard) {
      setCustomCategoryInput(income.category);
    }
    setFormData({
      date: income.date,
      customer: income.customer,
      customer_pan: income.customer_pan || '',
      category: isStandard ? income.category : 'Custom',
      amount: income.amount.toString(),
      method: income.method || 'Bank Transfer',
      status: income.status || 'Completed',
      invoice: income.invoice || '',
      description: income.description || '',
      receipt_photo: income.receipt_photo || ''
    });
    setIsModalOpen(true);
  };

  // Duplicate an income record
  const handleDuplicate = (income: IncomeItem) => {
    const nextSeq = incomeData.length + 1;
    const duplicated: IncomeItem = {
      ...income,
      id: `INC-${String(nextSeq).padStart(3, '0')}`,
      date: getTodayBsDate(),
      invoice: `INV-${Date.now().toString().slice(-4)}`,
      created_at: new Date().toISOString()
    };
    saveIncomeData([duplicated, ...incomeData]);
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
    setIncomeToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (incomeToDelete) {
      const target = incomeData.find(item => item.id === incomeToDelete || item.db_id === incomeToDelete);
      const targetDbId = target?.db_id;
      const targetRef = target?.id || incomeToDelete;

      // 1. Immediately record in persistent deleted tombstone list
      recordDeletedIncomeId(targetRef, targetDbId);

      // 2. Immediately remove from local state & update localStorage
      const updated = incomeData.filter(item => item.id !== incomeToDelete && (!targetDbId || item.db_id !== targetDbId));
      saveIncomeData(updated);

      setDeleteModalOpen(false);
      setIncomeToDelete(null);

      // 3. Attempt database deletion
      try {
        if (targetDbId) {
          await supabase.from('payments').delete().eq('id', targetDbId);
        }
        await supabase
          .from('payments')
          .delete()
          .or(`payment_ref.eq.${targetRef},id.eq.${targetRef}`);
      } catch (err) {
        console.error('Supabase income delete error:', err);
      }
    }
  };

  // Toggle status directly from table (Completed <-> Pending)
  const handleToggleStatus = (income: IncomeItem) => {
    const newStatus = income.status === 'Completed' ? 'Pending' : 'Completed';
    const updated = incomeData.map(item => item.id === income.id ? { ...item, status: newStatus as 'Completed' | 'Pending' } : item);
    saveIncomeData(updated);
  };

  // Save Form (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalCategory = isCustomCategory ? (customCategoryInput.trim() || 'General Revenue') : formData.category;
    const finalAmount = Math.max(0, parseFloat(formData.amount) || 0);

    if (editingId) {
      const updated = incomeData.map(item => 
        item.id === editingId 
          ? { 
              ...item, 
              date: formData.date,
              customer: formData.customer.trim() || 'General Client',
              customer_pan: formData.customer_pan.trim(),
              category: finalCategory,
              amount: finalAmount,
              method: formData.method,
              status: formData.status,
              invoice: formData.invoice.trim() || item.invoice,
              description: formData.description.trim(),
              receipt_photo: formData.receipt_photo
            } 
          : item
      );
      saveIncomeData(updated);

      try {
        await supabase.from('payments').update({
          payment_date: formData.date,
          amount: finalAmount,
          method: formData.method,
          category: finalCategory,
          bank_transaction_id: formData.invoice.trim(),
          notes: formData.description.trim()
        }).eq('payment_ref', editingId);
      } catch (err) {}

    } else {
      const nextSeq = incomeData.length + 1;
      const nextId = `INC-${String(nextSeq).padStart(3, '0')}`;
      const newIncome: IncomeItem = {
        id: nextId,
        date: formData.date,
        customer: formData.customer.trim() || 'General Client',
        customer_pan: formData.customer_pan.trim(),
        category: finalCategory,
        amount: finalAmount,
        method: formData.method,
        status: formData.status,
        invoice: formData.invoice.trim() || `INV-${Date.now().toString().slice(-4)}`,
        description: formData.description.trim(),
        receipt_photo: formData.receipt_photo,
        created_at: new Date().toISOString()
      };
      const updated = [newIncome, ...incomeData];
      saveIncomeData(updated);

      try {
        const { data: insertedData } = await supabase.from('payments').insert([{
          payment_ref: nextId,
          payment_date: formData.date,
          amount: finalAmount,
          method: formData.method,
          category: finalCategory,
          bank_transaction_id: newIncome.invoice,
          notes: formData.description.trim()
        }]).select();

        if (insertedData?.[0]?.id) {
          setIncomeData(prev => prev.map(item => item.id === nextId ? { ...item, db_id: insertedData[0].id } : item));
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
    if (filteredIncomeData.length === 0) return;
    const headers = ['Income ID', 'Date (BS)', 'Customer / Client', 'PAN Number', 'Category', 'Payment Method', 'Amount (NPR)', 'Status', 'Invoice / Ref', 'Notes'];
    const rows = filteredIncomeData.map(item => [
      item.id,
      item.date,
      `"${item.customer.replace(/"/g, '""')}"`,
      `"${item.customer_pan || ''}"`,
      `"${item.category.replace(/"/g, '""')}"`,
      `"${item.method}"`,
      item.amount,
      `"${item.status}"`,
      `"${item.invoice || ''}"`,
      `"${(item.description || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aslenix-income-${getTodayBsDate()}.csv`);
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
            <h2 className="text-2xl font-bold text-primary tracking-tight">Income & Revenue</h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              Live Real-Time Accounting
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            Real-time tracking of received revenue, client payments, invoices, and sales outlays.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {incomeData.length === 0 && (
            <button
              onClick={() => {
                clearDeletedIncomeIds();
                saveIncomeData(initialIncomeData);
              }}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Populate sample income records"
            >
              Load Demo Income
            </button>
          )}
          <button
            onClick={handleExportCSV}
            disabled={filteredIncomeData.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Export filtered records to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-all shadow-sm shadow-accent/20 cursor-pointer flex-1 md:flex-none"
          >
            <Plus size={18} />
            <span>Record Income</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC SUMMARY METRIC CARDS (100% Calculated in Real Time) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Income (This Month) */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                This Month's Realized Income
              </p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                {formatNPR(dynamicStats.thisMonthReceived)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                {dynamicStats.thisMonthCount > 0 ? (
                  <span><strong>{dynamicStats.thisMonthCount}</strong> received payments this month</span>
                ) : (
                  <span>No completed revenue recorded this month</span>
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
              <Wallet size={22} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        </div>

        {/* Card 2: All-Time Realized Revenue */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                All-Time Realized Revenue
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">
                {formatNPR(dynamicStats.allTimeReceived)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Across <strong>{dynamicStats.completedCount}</strong> cleared receipts (Avg. {formatNPR(dynamicStats.avgIncome)})
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
              <TrendingUp size={22} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-blue-500" />
        </div>

        {/* Card 3: Pending / Uncollected Payments */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Pending / Receivables
              </p>
              <h3 className="text-2xl font-black text-amber-600 mt-1 font-mono">
                {formatNPR(dynamicStats.pendingTotal)}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                {dynamicStats.pendingCount > 0 ? (
                  <span><strong>{dynamicStats.pendingCount}</strong> pending payments awaiting clearance</span>
                ) : (
                  <span>All issued client invoices are fully cleared</span>
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100 shrink-0">
              <Clock size={22} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
        </div>

        {/* Card 4: Top Revenue Category */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Leading Revenue Stream
              </p>
              <h3 className="text-lg font-bold text-slate-900 mt-1 truncate" title={dynamicStats.topCategory?.name || 'None'}>
                {dynamicStats.topCategory?.name || 'No Cleared Records'}
              </h3>
              <p className="text-xs font-semibold text-emerald-600 font-mono mt-0.5">
                {dynamicStats.topCategory ? formatNPR(dynamicStats.topCategory.amount) : 'रु. 0.00'}
                {dynamicStats.topCategory && (
                  <span className="text-[10px] text-slate-400 font-normal ml-1.5 font-sans">
                    ({dynamicStats.topCategory.percentage}% of revenue)
                  </span>
                )}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 border border-purple-100 shrink-0">
              <PieChart size={22} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
        </div>
      </div>

      {/* 3. SEARCH & DYNAMIC FILTER BAR */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/90 mb-6 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search by customer, invoice no, category, PAN, or payment method..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50/70 hover:bg-slate-50 border border-slate-200/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all shadow-2xs"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-200 transition-colors"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Quick Period Filters */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-start lg:self-auto text-xs font-semibold">
            <button
              onClick={() => setPeriodFilter('All')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                periodFilter === 'All' 
                  ? 'bg-white text-primary shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => setPeriodFilter('ThisMonth')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 ${
                periodFilter === 'ThisMonth' 
                  ? 'bg-white text-emerald-700 shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar size={13} />
              <span>This Month</span>
            </button>
            <button
              onClick={() => setPeriodFilter('LastMonth')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                periodFilter === 'LastMonth' 
                  ? 'bg-white text-primary shadow-xs' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Last Month
            </button>
          </div>
        </div>

        {/* Dropdown Filters & Counter */}
        <div className="flex flex-wrap items-center justify-between pt-2 border-t border-slate-100 gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {/* Category Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
              <Filter size={13} className="text-slate-400" />
              <span className="font-semibold text-slate-500">Category:</span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs max-w-[180px] truncate"
              >
                {allCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Method Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
              <CreditCard size={13} className="text-slate-400" />
              <span className="font-semibold text-slate-500">Method:</span>
              <select
                value={methodFilter}
                onChange={(e) => setMethodFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
              >
                {allMethods.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Status Dropdown */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
              <CheckCircle2 size={13} className="text-slate-400" />
              <span className="font-semibold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
              >
                <option value="All">All Status</option>
                <option value="Completed">Completed (Cleared)</option>
                <option value="Pending">Pending (Unpaid)</option>
              </select>
            </div>

            {/* Clear All Filters Button */}
            {(categoryFilter !== 'All' || methodFilter !== 'All' || statusFilter !== 'All' || periodFilter !== 'All' || searchTerm) && (
              <button
                onClick={() => {
                  setCategoryFilter('All');
                  setMethodFilter('All');
                  setStatusFilter('All');
                  setPeriodFilter('All');
                  setSearchTerm('');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer border border-rose-200"
                title="Reset all active filters"
              >
                <RotateCcw size={12} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800 font-bold">{filteredIncomeData.length}</strong> of {incomeData.length} records
          </div>
        </div>
      </div>

      {/* 4. INCOME TABLE */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Date (BS मिति) / Ref</th>
                <th className="px-5 py-3.5">Client & Revenue Stream</th>
                <th className="px-5 py-3.5">Payment Method</th>
                <th className="px-5 py-3.5">Amount</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-center">Voucher / Slip</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredIncomeData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-3 border border-emerald-100">
                        <Wallet size={26} />
                      </div>
                      <h4 className="font-bold text-slate-800 text-base">No Income Records Found</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {incomeData.length > 0 
                          ? 'No income records match your specific filter criteria. Try resetting filters.'
                          : 'You haven\'t recorded any income yet. Click the button below to add your first revenue entry!'}
                      </p>
                      {incomeData.length > 0 ? (
                        <button
                          onClick={() => {
                            setCategoryFilter('All');
                            setMethodFilter('All');
                            setStatusFilter('All');
                            setPeriodFilter('All');
                            setSearchTerm('');
                          }}
                          className="mt-3.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 mt-4">
                          <button
                            onClick={() => {
                              clearDeletedIncomeIds();
                              saveIncomeData(initialIncomeData);
                            }}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                          >
                            Load Demo Income
                          </button>
                          <button
                            onClick={() => { resetForm(); setIsModalOpen(true); }}
                            className="px-4 py-2 bg-accent text-white rounded-xl text-xs font-semibold hover:bg-accent-hover transition-colors shadow-sm cursor-pointer"
                          >
                            + Record Income
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredIncomeData.map((income) => (
                  <tr key={income.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* 1. Date & Ref */}
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-900">{formatNepaliDate(income.date, 'full')} BS</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                        <span>{toBsDateString(income.date)}</span>
                        <span>•</span>
                        <span 
                          onClick={(e) => handleCopyId(income.id, e)}
                          className="text-slate-600 hover:text-accent font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                          title="Click to copy ID"
                        >
                          {income.id}
                          {copiedId === income.id ? (
                            <Check size={11} className="text-emerald-600" />
                          ) : (
                            <Copy size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </span>
                      </div>
                    </td>

                    {/* 2. Client & Category */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-800 flex items-center gap-1.5">
                        <span>{income.customer}</span>
                        {income.customer_pan && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200" title="Client PAN">
                            PAN: {income.customer_pan}
                          </span>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getCategoryColor(income.category)}`}>
                          {income.category}
                        </span>
                        {income.invoice && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            Ref: {income.invoice}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* 3. Payment Method */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${getMethodColor(income.method)}`}>
                        {income.method}
                      </span>
                    </td>

                    {/* 4. Amount */}
                    <td className="px-5 py-4 font-black text-emerald-600 text-base font-mono">
                      + {formatNPR(income.amount)}
                    </td>

                    {/* 5. Status */}
                    <td className="px-5 py-4">
                      <button
                        onClick={() => handleToggleStatus(income)}
                        title="Click to toggle status"
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border transition-transform hover:scale-105 cursor-pointer ${
                          income.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {income.status === 'Completed' ? (
                          <>
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>Completed</span>
                          </>
                        ) : (
                          <>
                            <Clock size={12} className="text-amber-600" />
                            <span>Pending</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* 6. Voucher / Slip Photo */}
                    <td className="px-5 py-4 text-center">
                      {income.receipt_photo ? (
                        <button
                          onClick={() => setLightboxReceipt({
                            isOpen: true,
                            url: income.receipt_photo!,
                            title: `Voucher - ${income.customer} (${income.id})`
                          })}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer border border-emerald-200"
                          title="View attached bank voucher / receipt slip"
                        >
                          <Eye size={12} />
                          <span>View Proof</span>
                        </button>
                      ) : (
                        <span className="text-slate-300 text-xs italic">None</span>
                      )}
                    </td>

                    {/* 7. Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleDuplicate(income)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Duplicate this entry"
                        >
                          <Copy size={15} />
                        </button>
                        <button 
                          onClick={() => handleEditClick(income)}
                          className="p-1.5 text-slate-400 hover:text-accent hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Income Record"
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(income.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Income Record"
                        >
                          <Trash2 size={15} />
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

      {/* 5. CONFIRM DELETE MODAL */}
      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Income Record"
        message="Are you sure you want to permanently delete this income entry? This will be removed from your revenue ledger."
        confirmText="Delete Record"
        isDanger={true}
      />

      {/* 6. LIGHTBOX MODAL FOR VOUCHER / DEPOSIT SLIP */}
      {lightboxReceipt.isOpen && (
        <div 
          onClick={() => setLightboxReceipt({ isOpen: false, url: '', title: '' })}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100"
          >
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ImageIcon size={18} className="text-accent" />
                <h3 className="font-bold text-slate-800 text-sm">{lightboxReceipt.title}</h3>
              </div>
              <button 
                onClick={() => setLightboxReceipt({ isOpen: false, url: '', title: '' })}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            <div className="p-6 bg-slate-950 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img 
                src={lightboxReceipt.url} 
                alt="Payment Voucher" 
                className="max-h-[65vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <a 
                href={lightboxReceipt.url} 
                download="aslenix-income-voucher.jpg"
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Download size={14} />
                <span>Download Attachment</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* 7. ADD / EDIT RECORD INCOME MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center">
                  <Wallet size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {editingId ? 'Edit Income Record' : 'Record New Income'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {editingId ? `Updating record ref #${editingId}` : 'Log client revenue, invoice settlement, or cash intake'}
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
            
            {/* Modal Form Body */}
            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 text-sm">
              {/* Date & Amount */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <NepaliDatePicker 
                    label="Transaction Date (मिति BS)" 
                    value={formData.date} 
                    onChange={(val) => setFormData({ ...formData, date: val })} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Amount Received (रु. NPR) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      रु.
                    </span>
                    <input 
                      type="number" 
                      required
                      min="0"
                      step="any"
                      placeholder="e.g. 50000"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm font-semibold font-mono"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Customer / Client & PAN */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Customer / Client Name <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    list="saved-customers-list"
                    placeholder="e.g. Global Tech Nepal Pvt. Ltd."
                    className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm font-medium"
                    value={formData.customer}
                    onChange={(e) => {
                      const val = e.target.value;
                      const matched = savedCustomers.find(c => c.name.toLowerCase() === val.toLowerCase());
                      setFormData(prev => ({
                        ...prev,
                        customer: val,
                        customer_pan: matched?.pan || prev.customer_pan
                      }));
                    }}
                  />
                  <datalist id="saved-customers-list">
                    {savedCustomers.map((c, idx) => (
                      <option key={idx} value={c.name}>{c.pan ? `PAN: ${c.pan}` : ''}</option>
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Client PAN Number (Optional)
                  </label>
                  <input 
                    type="text" 
                    placeholder="9-digit PAN e.g. 601234567"
                    maxLength={9}
                    className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm font-mono"
                    value={formData.customer_pan}
                    onChange={(e) => setFormData({...formData, customer_pan: e.target.value})}
                  />
                </div>
              </div>

              {/* Category & Custom Category */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Revenue Stream / Category <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm font-medium cursor-pointer"
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
                  {STANDARD_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Custom">+ Custom Revenue Category...</option>
                </select>

                {isCustomCategory && (
                  <div className="mt-2.5 animate-in fade-in duration-200">
                    <input 
                      type="text" 
                      required
                      placeholder="Enter custom revenue category name..."
                      className="w-full px-3 py-2 bg-purple-50/50 border border-purple-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400/20 focus:border-purple-500 text-sm font-semibold text-purple-900"
                      value={customCategoryInput}
                      onChange={(e) => setCustomCategoryInput(e.target.value)}
                    />
                  </div>
                )}
              </div>

              {/* Payment Method & Status */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm font-medium cursor-pointer"
                    value={formData.method}
                    onChange={(e) => setFormData({...formData, method: e.target.value})}
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>{method}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Settlement Status <span className="text-rose-500">*</span>
                  </label>
                  <select
                    required
                    className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm font-medium cursor-pointer"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value as 'Completed' | 'Pending'})}
                  >
                    <option value="Completed">Completed (Cleared & In Bank)</option>
                    <option value="Pending">Pending (Unpaid / Cheque in Transit)</option>
                  </select>
                </div>
              </div>

              {/* Invoice / Reference Number */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Invoice / Tax Invoice / Cheque Ref No.
                </label>
                <input 
                  type="text" 
                  placeholder="e.g. ASL-2083-0012 or CHQ-99120"
                  className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm font-mono"
                  value={formData.invoice}
                  onChange={(e) => setFormData({...formData, invoice: e.target.value})}
                />
              </div>

              {/* Description / Project Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Description / Project Scope Details
                </label>
                <textarea 
                  rows={2}
                  placeholder="e.g. 50% advance for SaaS cloud portal deployment milestone..."
                  className="w-full px-3 py-2 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              {/* Bank Voucher / Deposit Slip Attachment */}
              <div className="pt-1">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Bank Deposit Slip / Voucher Photo (Optional)
                </label>
                {formData.receipt_photo ? (
                  <div className="flex items-center gap-3 p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl">
                    <img 
                      src={formData.receipt_photo} 
                      alt="Attachment Preview" 
                      className="w-14 h-14 object-cover rounded-xl border border-emerald-300 shadow-2xs"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-emerald-900 truncate">Voucher Photo Attached</p>
                      <p className="text-[11px] text-emerald-700">Compressed & ready for ledger storage</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, receipt_photo: '' }))}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2.5 py-1.5 bg-white rounded-lg border border-rose-200 shadow-2xs cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-200 hover:border-accent rounded-2xl cursor-pointer bg-slate-50/50 hover:bg-blue-50/20 transition-all group">
                    <ImageIcon className="text-slate-400 group-hover:text-accent mb-1 transition-colors" size={24} />
                    <span className="text-xs font-semibold text-slate-600 group-hover:text-accent">
                      Click to upload bank voucher, cheque slip, or eSewa receipt
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">JPG, PNG, WebP up to 10MB (auto-compressed)</span>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={handleReceiptPhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              {/* Form Action Footer */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white">
                <button 
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2.5 bg-accent text-white rounded-xl font-bold text-xs hover:bg-accent-hover transition-all shadow-md shadow-accent/20 cursor-pointer flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>{editingId ? 'Save Income Changes' : 'Record Income'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Income;
