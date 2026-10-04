import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Filter, 
  Download, 
  Loader2, 
  Edit, 
  Trash2, 
  FileText, 
  RotateCcw,
  Users,
  Building2,
  ShieldCheck,
  UserCheck,
  Copy,
  Check,
  Phone,
  Mail,
  X
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';
import { getTodayBsDate } from '../lib/nepaliDate';

interface Customer {
  id: string;
  customer_id: string;
  name: string;
  company_name: string;
  pan_number: string;
  phone: string;
  email: string;
  type: string;
  is_active: boolean;
}

const defaultCustomers: Customer[] = [
  { id: 'c1', customer_id: 'CUST-1001', name: 'Global Tech Nepal', company_name: 'Global Tech Nepal Pvt. Ltd.', pan_number: '601234567', phone: '9851000001', email: 'info@globaltech.com.np', type: 'Company', is_active: true },
  { id: 'c2', customer_id: 'CUST-1002', name: 'Himalayan Mart', company_name: 'Himalayan Mart Pvt. Ltd.', pan_number: '602345678', phone: '9851000002', email: 'accounts@himalayanmart.com', type: 'Company', is_active: true },
  { id: 'c3', customer_id: 'CUST-1003', name: 'Vertex Media', company_name: 'Vertex Media Group', pan_number: '603456789', phone: '9851000003', email: 'hello@vertexmedia.com', type: 'Company', is_active: true },
];

const DELETED_CUSTOMERS_KEY = 'aslenix_deleted_customers';

const getDeletedCustomerIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_CUSTOMERS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const recordDeletedCustomerId = (id: string, code?: string) => {
  try {
    const set = getDeletedCustomerIds();
    if (id) set.add(id);
    if (code) set.add(code);
    localStorage.setItem(DELETED_CUSTOMERS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Failed to record deleted customer id:', e);
  }
};

const getTypeColor = (type: string) => {
  switch (type?.toLowerCase()) {
    case 'company':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'individual':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'organization':
      return 'bg-amber-50 text-amber-700 border-amber-200';
    case 'government':
      return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    default:
      return 'bg-slate-50 text-slate-700 border-slate-200';
  }
};

const Customers = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('aslenix_customers');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const deletedIds = getDeletedCustomerIds();
          return parsed.filter(c => !deletedIds.has(c.id) && !deletedIds.has(c.customer_id));
        }
      } catch (e) {}
    }
    const deletedIds = getDeletedCustomerIds();
    return defaultCustomers.filter(c => !deletedIds.has(c.id) && !deletedIds.has(c.customer_id));
  });
  const [loading, setLoading] = useState(false);

  const saveCustomers = (data: Customer[]) => {
    setCustomers(data);
    try {
      localStorage.setItem('aslenix_customers', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save customers to localStorage', e);
    }
  };

  // Dynamic Statistics
  const dynamicStats = useMemo(() => {
    const totalCount = customers.length;
    const activeCount = customers.filter(c => c.is_active).length;
    const inactiveCount = totalCount - activeCount;

    const companyCount = customers.filter(c => c.type === 'Company' || c.type === 'Organization').length;
    const individualCount = customers.filter(c => c.type === 'Individual').length;
    const panRegisteredCount = customers.filter(c => c.pan_number && c.pan_number.trim().length >= 9).length;

    return {
      totalCount,
      activeCount,
      inactiveCount,
      companyCount,
      individualCount,
      panRegisteredCount
    };
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        (c.name && c.name.toLowerCase().includes(q)) ||
        (c.company_name && c.company_name.toLowerCase().includes(q)) ||
        (c.pan_number && c.pan_number.toLowerCase().includes(q)) ||
        (c.customer_id && c.customer_id.toLowerCase().includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q)) ||
        (c.phone && c.phone.includes(q));

      const matchesType = typeFilter === 'All' || c.type === typeFilter;
      const matchesStatus = statusFilter === 'All' || 
        (statusFilter === 'Active' ? c.is_active : !c.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [customers, searchTerm, typeFilter, statusFilter]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    company_name: '',
    pan_number: '',
    phone: '',
    email: '',
    type: 'Company',
  });

  const resetForm = () => {
    setFormData({ name: '', company_name: '', pan_number: '', phone: '', email: '', type: 'Company' });
    setEditingId(null);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const deletedIds = getDeletedCustomerIds();
        const validServerCustomers = data.filter((c: any) => 
          !deletedIds.has(c.id) && !deletedIds.has(c.customer_id)
        );

        setCustomers(prev => {
          const serverIds = new Set(validServerCustomers.map((c: any) => c.id));
          const serverCodes = new Set(validServerCustomers.map((c: any) => c.customer_id));
          const localOnly = prev.filter(c => 
            !deletedIds.has(c.id) && 
            !deletedIds.has(c.customer_id) && 
            !serverIds.has(c.id) && 
            !serverCodes.has(c.customer_id)
          );
          const combined = [...validServerCustomers, ...localOnly];
          saveCustomers(combined);
          return combined;
        });
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingId) {
        const updated = customers.map(c => 
          c.id === editingId ? { ...c, ...formData } : c
        );
        saveCustomers(updated);

        try {
          await supabase
            .from('customers')
            .update({
              name: formData.name,
              company_name: formData.company_name,
              pan_number: formData.pan_number,
              phone: formData.phone,
              email: formData.email,
              type: formData.type,
            })
            .eq('id', editingId);
        } catch (dbErr) {
          console.error('DB update error:', dbErr);
        }
      } else {
        const newId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
        const newCustomer: Customer = {
          id: `c_${Date.now()}`,
          customer_id: newId,
          name: formData.name,
          company_name: formData.company_name,
          pan_number: formData.pan_number,
          phone: formData.phone,
          email: formData.email,
          type: formData.type,
          is_active: true
        };
        saveCustomers([newCustomer, ...customers]);

        try {
          const { data: insertedData } = await supabase.from('customers').insert([
            {
              customer_id: newId,
              ...formData
            }
          ]).select();

          if (insertedData?.[0]?.id) {
            setCustomers(prev => prev.map(c => c.id === newCustomer.id ? { ...c, id: insertedData[0].id } : c));
          }
        } catch (dbErr) {
          console.error('DB insert error:', dbErr);
        }
      }
      
      resetForm();
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message || 'Error saving customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCustomerStatus = async (customerId: string, currentStatus: boolean) => {
    const updated = customers.map(c => 
      c.id === customerId ? { ...c, is_active: !currentStatus } : c
    );
    saveCustomers(updated);

    try {
      await supabase
        .from('customers')
        .update({ is_active: !currentStatus })
        .eq('id', customerId);
    } catch (error: any) {
      console.error('Error updating status:', error);
    }
  };

  const handleEditClick = (customer: Customer) => {
    setEditingId(customer.id);
    setFormData({
      name: customer.name || '',
      company_name: customer.company_name || '',
      pan_number: customer.pan_number || '',
      phone: customer.phone || '',
      email: customer.email || '',
      type: customer.type || 'Company',
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (customerId: string) => {
    setCustomerToDelete(customerId);
    setDeleteModalOpen(true);
  };

  const handleCreateInvoice = (customer: Customer) => {
    navigate(`/invoices?customerId=${customer.id}`);
  };

  const confirmDelete = async () => {
    if (!customerToDelete) return;
    
    const target = customers.find(c => c.id === customerToDelete || c.customer_id === customerToDelete);
    recordDeletedCustomerId(customerToDelete, target?.customer_id);

    const updated = customers.filter(c => c.id !== customerToDelete && c.customer_id !== customerToDelete);
    saveCustomers(updated);
    setDeleteModalOpen(false);

    try {
      await supabase
        .from('customers')
        .delete()
        .or(`id.eq.${customerToDelete},customer_id.eq.${target?.customer_id || customerToDelete}`);
    } catch (error: any) {
      console.error('Error deleting customer from DB:', error);
    } finally {
      setCustomerToDelete(null);
    }
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExportCSV = () => {
    if (filteredCustomers.length === 0) return;
    const headers = ['Customer ID', 'Client Name', 'Company Name', 'PAN Number', 'Phone', 'Email', 'Type', 'Status'];
    const rows = filteredCustomers.map(c => [
      c.customer_id,
      `"${(c.name || '').replace(/"/g, '""')}"`,
      `"${(c.company_name || '').replace(/"/g, '""')}"`,
      `"${c.pan_number || ''}"`,
      `"${c.phone || ''}"`,
      `"${c.email || ''}"`,
      `"${c.type}"`,
      `"${c.is_active ? 'Active' : 'Inactive'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aslenix-customers-${getTodayBsDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Client & Customer Directory</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage your client entities, corporate accounts, tax profiles, and contact details.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button 
            onClick={handleExportCSV}
            disabled={filteredCustomers.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Export customer list to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-all shadow-sm shadow-accent/20 cursor-pointer flex-1 md:flex-none text-xs"
          >
            <Plus size={16} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Client Accounts */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Total Client Accounts
              </p>
              <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">
                {dynamicStats.totalCount}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                <strong>{dynamicStats.activeCount}</strong> active accounts • {dynamicStats.inactiveCount} inactive
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-100 shrink-0">
              <Users size={22} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
        </div>

        {/* Card 2: Corporate Entities */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Corporate Entities
              </p>
              <h3 className="text-2xl font-black text-indigo-600 mt-1 font-mono">
                {dynamicStats.companyCount}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Companies, businesses & institutions
              </p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
              <Building2 size={22} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
        </div>

        {/* Card 3: Tax Verified (PAN) Accounts */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tax-Verified (PAN)
              </p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1 font-mono">
                {dynamicStats.panRegisteredCount}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Accounts registered for IRD/VAT compliance
              </p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shrink-0">
              <ShieldCheck size={22} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-500" />
        </div>

        {/* Card 4: Individual & Retail */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/90 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Individual Accounts
              </p>
              <h3 className="text-2xl font-black text-purple-600 mt-1 font-mono">
                {dynamicStats.individualCount}
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Retail clients & individual customers
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 border border-purple-100 shrink-0">
              <UserCheck size={22} />
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
        </div>
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/90 mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search customers by name, company, PAN, phone, or email..." 
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

          {/* Filters & Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
              <Filter size={13} className="text-slate-400" />
              <span className="font-semibold text-slate-500">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
              >
                <option value="All">All Types</option>
                <option value="Company">Company</option>
                <option value="Individual">Individual</option>
                <option value="Organization">Organization</option>
                <option value="Government">Government</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-2xs">
              <span className="font-semibold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
              >
                <option value="All">All Status</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Inactive Only</option>
              </select>
            </div>

            {/* Reset Filters Button */}
            {(typeFilter !== 'All' || statusFilter !== 'All' || searchTerm) && (
              <button
                onClick={() => {
                  setTypeFilter('All');
                  setStatusFilter('All');
                  setSearchTerm('');
                }}
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-xl transition-colors cursor-pointer border border-rose-200"
                title="Reset active filters"
              >
                <RotateCcw size={12} />
                <span>Reset</span>
              </button>
            )}

            <div className="text-xs text-slate-500 font-medium pl-1">
              Showing <strong className="text-slate-800">{filteredCustomers.length}</strong> of {customers.length}
            </div>
          </div>
        </div>
      </div>

      {/* 4. CUSTOMERS TABLE */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Client Profile</th>
                <th className="px-5 py-3.5">Contact Details</th>
                <th className="px-5 py-3.5">Category & Tax Info</th>
                <th className="px-5 py-3.5">Account Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-accent" size={24} />
                      <p className="text-xs font-medium">Loading customer accounts...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-accent mb-3 border border-blue-100">
                        <Users size={26} />
                      </div>
                      <h4 className="font-bold text-slate-800 text-base">No Customers Found</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {customers.length > 0 
                          ? 'No customer records match your filter criteria. Try resetting filters.'
                          : 'Your client directory is currently empty. Add your first customer or company to get started.'}
                      </p>
                      {customers.length > 0 ? (
                        <button
                          onClick={() => {
                            setTypeFilter('All');
                            setStatusFilter('All');
                            setSearchTerm('');
                          }}
                          className="mt-3.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Reset Filters
                        </button>
                      ) : (
                        <button 
                          onClick={() => { resetForm(); setIsModalOpen(true); }}
                          className="mt-4 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Plus size={14} />
                          <span>+ Add First Customer</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer) => {
                  const displayName = customer.company_name || customer.name || 'Client';
                  const initials = displayName.slice(0, 2).toUpperCase();

                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* 1. Client Profile */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-300/80 flex items-center justify-center font-bold text-slate-700 text-xs shrink-0 shadow-2xs">
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-snug">{displayName}</div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                              <span 
                                onClick={(e) => handleCopyId(customer.customer_id, e)}
                                className="text-slate-600 hover:text-accent font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                                title="Click to copy ID"
                              >
                                {customer.customer_id}
                                {copiedId === customer.customer_id ? (
                                  <Check size={11} className="text-emerald-600" />
                                ) : (
                                  <Copy size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </span>
                              {customer.company_name && customer.name && (
                                <>
                                  <span>•</span>
                                  <span className="text-slate-500 font-sans">{customer.name}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. Contact Details */}
                      <td className="px-5 py-4">
                        <div className="space-y-1">
                          {customer.phone ? (
                            <a 
                              href={`tel:${customer.phone}`}
                              className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-accent transition-colors"
                            >
                              <Phone size={12} className="text-slate-400" />
                              <span>{customer.phone}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No phone</span>
                          )}

                          {customer.email ? (
                            <a 
                              href={`mailto:${customer.email}`}
                              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-accent transition-colors"
                            >
                              <Mail size={12} className="text-slate-400" />
                              <span className="truncate max-w-[200px]">{customer.email}</span>
                            </a>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No email</span>
                          )}
                        </div>
                      </td>

                      {/* 3. Category & Tax Info */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block px-2.5 py-0.5 rounded-md text-xs font-semibold border ${getTypeColor(customer.type)}`}>
                            {customer.type}
                          </span>
                          {customer.pan_number ? (
                            <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200" title="IRD VAT/PAN">
                              PAN: {customer.pan_number}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">No PAN</span>
                          )}
                        </div>
                      </td>

                      {/* 4. Status Toggle */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            type="button"
                            onClick={() => handleToggleCustomerStatus(customer.id, customer.is_active)}
                            className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              customer.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                            }`}
                            title={`Click to mark as ${customer.is_active ? 'Inactive' : 'Active'}`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                customer.is_active ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className={`text-xs font-bold ${customer.is_active ? 'text-emerald-700' : 'text-slate-400'}`}>
                            {customer.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </td>

                      {/* 5. Visible Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button 
                            onClick={() => handleCreateInvoice(customer)}
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                            title="Generate Invoice for this client"
                          >
                            <FileText size={15} />
                          </button>
                          <button 
                            onClick={() => handleEditClick(customer)}
                            className="p-1.5 text-slate-400 hover:text-accent hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Client Profile"
                          >
                            <Edit size={15} />
                          </button>
                          <button 
                            onClick={() => handleDeleteClick(customer.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Client Record"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. ADD / EDIT CUSTOMER MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-accent border border-blue-100 flex items-center justify-center">
                  <Users size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingId ? 'Edit Customer Profile' : 'Add New Customer'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingId ? `Updating record #${editingId}` : 'Register a new client company or individual for billing'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Customer Entity Type
                  </label>
                  <select 
                    className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm font-medium cursor-pointer"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Company">Company / Pvt. Ltd.</option>
                    <option value="Individual">Individual Client</option>
                    <option value="Organization">Non-Profit / Organization</option>
                    <option value="Government">Government / Public Body</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Primary Contact Name <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Suwam Subedi"
                    className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Company / Organization Name
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. Global Tech Nepal Pvt. Ltd."
                    className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm font-medium"
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    PAN / VAT Registration No.
                  </label>
                  <input 
                    type="text" 
                    maxLength={9}
                    placeholder="9-digit PAN e.g. 601234567"
                    className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm font-mono"
                    value={formData.pan_number}
                    onChange={(e) => setFormData({...formData, pan_number: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Phone / Mobile Number
                  </label>
                  <input 
                    type="text" 
                    placeholder="e.g. 9851000001"
                    className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm font-medium"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input 
                    type="email" 
                    placeholder="e.g. billing@globaltech.com.np"
                    className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm font-medium"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white">
                <button 
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-semibold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-accent text-white rounded-xl font-bold text-xs hover:bg-accent-hover transition-all shadow-md shadow-accent/20 cursor-pointer flex items-center gap-2 disabled:opacity-70"
                >
                  {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                  <span>{isSubmitting ? 'Saving...' : (editingId ? 'Save Client Changes' : 'Save Customer')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. CONFIRM DELETE MODAL */}
      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Customer Profile"
        message="Are you sure you want to permanently delete this customer record? All associated contact details will be removed."
        confirmText="Delete Record"
        isDanger={true}
      />
    </div>
  );
};

export default Customers;
