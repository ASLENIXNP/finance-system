import { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Package, 
  Edit, 
  Trash2, 
  Loader2, 
  RotateCcw,
  Download,
  Copy,
  Check,
  X,
  Layers,
  Box,
  Percent,
  Tag
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';
import { getTodayBsDate } from '../lib/nepaliDate';

interface Product {
  id: string;
  item_code: string;
  name: string;
  type: string;
  description?: string;
  default_rate: number;
  tax_rate: number;
  is_active: boolean;
}

const defaultProducts: Product[] = [
  { id: 'p1', item_code: 'SRV-001', name: 'Custom Web Application Development', type: 'Service', description: 'Full stack scalable software development', default_rate: 85000, tax_rate: 13, is_active: true },
  { id: 'p2', item_code: 'SRV-002', name: 'UI/UX Design & Prototyping', type: 'Service', description: 'Figma interactive prototype & user journey design', default_rate: 45000, tax_rate: 13, is_active: true },
  { id: 'p3', item_code: 'SRV-003', name: 'Annual Software Maintenance (AMC)', type: 'Service', description: 'Regular SLA maintenance, uptime, and database backups', default_rate: 35000, tax_rate: 13, is_active: true },
  { id: 'p4', item_code: 'PRD-001', name: 'Cloud Server VPS (1 Year)', type: 'Product', description: 'High-performance cloud hosting with dedicated RAM/SSD', default_rate: 20000, tax_rate: 13, is_active: true },
];

const DELETED_PRODUCTS_KEY = 'aslenix_deleted_products';

const getDeletedProductIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_PRODUCTS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const recordDeletedProductId = (id: string, code?: string) => {
  try {
    const set = getDeletedProductIds();
    if (id) set.add(id);
    if (code) set.add(code);
    localStorage.setItem(DELETED_PRODUCTS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Failed to record deleted product id:', e);
  }
};

const formatNPR = (amount: number): string => {
  return `रु. ${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('aslenix_products');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const deletedIds = getDeletedProductIds();
          return parsed.filter(item => !deletedIds.has(item.id) && !deletedIds.has(item.item_code));
        }
      } catch (e) {}
    }
    const deletedIds = getDeletedProductIds();
    return defaultProducts.filter(item => !deletedIds.has(item.id) && !deletedIds.has(item.item_code));
  });
  const [loading, setLoading] = useState(false);

  const saveProducts = (data: Product[]) => {
    setProducts(data);
    try {
      localStorage.setItem('aslenix_products', JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save products to localStorage', e);
    }
  };

  // Dynamic Statistics
  const dynamicStats = useMemo(() => {
    const totalCount = products.length;
    const activeCount = products.filter(p => p.is_active).length;
    const inactiveCount = totalCount - activeCount;

    const services = products.filter(p => p.type === 'Service');
    const physicalProducts = products.filter(p => p.type === 'Product');

    const avgRate = totalCount > 0 
      ? products.reduce((acc, p) => acc + (Number(p.default_rate) || 0), 0) / totalCount 
      : 0;

    return {
      totalCount,
      activeCount,
      inactiveCount,
      serviceCount: services.length,
      productCount: physicalProducts.length,
      avgRate
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q ||
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.item_code && p.item_code.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q));

      const matchesType = typeFilter === 'All' || p.type === typeFilter;
      const matchesStatus = statusFilter === 'All' || 
        (statusFilter === 'Active' ? p.is_active : !p.is_active);

      return matchesSearch && matchesType && matchesStatus;
    });
  }, [products, searchTerm, typeFilter, statusFilter]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Service',
    description: '',
    default_rate: 0,
    tax_rate: 13,
  });

  const resetForm = () => {
    setFormData({ name: '', type: 'Service', description: '', default_rate: 0, tax_rate: 13 });
    setEditingId(null);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const deletedIds = getDeletedProductIds();
        const validServerProducts = data.filter((p: any) => 
          !deletedIds.has(p.id) && !deletedIds.has(p.item_code)
        );

        setProducts(prev => {
          const serverIds = new Set(validServerProducts.map((p: any) => p.id));
          const serverCodes = new Set(validServerProducts.map((p: any) => p.item_code));
          const localOnly = prev.filter(p => 
            !deletedIds.has(p.id) && 
            !deletedIds.has(p.item_code) && 
            !serverIds.has(p.id) && 
            !serverCodes.has(p.item_code)
          );
          const combined = [...validServerProducts, ...localOnly];
          saveProducts(combined);
          return combined;
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      if (editingId) {
        const updated = products.map(p => 
          p.id === editingId ? { ...p, ...formData } : p
        );
        saveProducts(updated);

        try {
          await supabase
            .from('products')
            .update({
              name: formData.name,
              type: formData.type,
              description: formData.description,
              default_rate: formData.default_rate,
              tax_rate: formData.tax_rate,
            })
            .eq('id', editingId);
        } catch (dbErr) {
          console.error('DB update err:', dbErr);
        }
      } else {
        const prefix = formData.type === 'Product' ? 'PRD' : 'SRV';
        const newCode = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
        const newProduct: Product = {
          id: `p_${Date.now()}`,
          item_code: newCode,
          name: formData.name,
          type: formData.type,
          description: formData.description,
          default_rate: formData.default_rate,
          tax_rate: formData.tax_rate,
          is_active: true
        };
        saveProducts([newProduct, ...products]);

        try {
          const { data: insertedData } = await supabase.from('products').insert([
            {
              item_code: newCode,
              ...formData
            }
          ]).select();

          if (insertedData?.[0]?.id) {
            setProducts(prev => prev.map(p => p.id === newProduct.id ? { ...p, id: insertedData[0].id } : p));
          }
        } catch (dbErr) {
          console.error('DB insert err:', dbErr);
        }
      }
      
      resetForm();
      setIsModalOpen(false);
    } catch (error: any) {
      alert(error.message || 'Error saving item');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleProductStatus = async (productId: string, currentStatus: boolean) => {
    const updated = products.map(p => 
      p.id === productId ? { ...p, is_active: !currentStatus } : p
    );
    saveProducts(updated);

    try {
      await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', productId);
    } catch (error: any) {
      console.error('Error updating status:', error);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      type: product.type,
      description: product.description || '',
      default_rate: product.default_rate,
      tax_rate: product.tax_rate,
    });
    setIsModalOpen(true);
  };

  const handleDuplicate = (product: Product) => {
    const prefix = product.type === 'Product' ? 'PRD' : 'SRV';
    const newCode = `${prefix}-${Math.floor(100 + Math.random() * 900)}`;
    const duplicated: Product = {
      ...product,
      id: `p_${Date.now()}`,
      item_code: newCode,
      name: `${product.name} (Copy)`,
      is_active: true
    };
    saveProducts([duplicated, ...products]);
  };

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    const target = products.find(p => p.id === productToDelete || p.item_code === productToDelete);
    recordDeletedProductId(productToDelete, target?.item_code);

    const updated = products.filter(p => p.id !== productToDelete && p.item_code !== productToDelete);
    saveProducts(updated);
    setDeleteModalOpen(false);

    try {
      await supabase
        .from('products')
        .delete()
        .or(`id.eq.${productToDelete},item_code.eq.${target?.item_code || productToDelete}`);
    } catch (error: any) {
      console.error('Error deleting product from DB:', error);
    } finally {
      setProductToDelete(null);
    }
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExportCSV = () => {
    if (filteredProducts.length === 0) return;
    const headers = ['Item Code', 'Item Name', 'Type', 'Description', 'Default Rate (NPR)', 'Tax Rate (%)', 'Status'];
    const rows = filteredProducts.map(p => [
      p.item_code,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.type}"`,
      `"${(p.description || '').replace(/"/g, '""')}"`,
      p.default_rate,
      p.tax_rate,
      `"${p.is_active ? 'Active' : 'Inactive'}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aslenix-catalog-${getTodayBsDate()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* 1. Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Products & Services Catalog</h2>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage your service offerings, product inventory, standard billing rates, and tax rules.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <button 
            onClick={handleExportCSV}
            disabled={filteredProducts.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Export catalog to CSV"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-5 py-2 bg-accent text-white rounded-xl font-semibold hover:bg-accent-hover transition-all shadow-sm shadow-accent/20 cursor-pointer flex-1 md:flex-none text-xs"
          >
            <Plus size={16} />
            <span>Add Offering</span>
          </button>
        </div>
      </div>

      {/* 2. DYNAMIC SUMMARY METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Card 1: Total Catalog Offerings */}
        <div className="bg-[#F8FAFF] p-5 rounded-3xl shadow-xs border border-blue-100/90 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100/80 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-200/60 shrink-0">
              <Package size={20} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              CATALOG
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Catalog Offerings
            </p>
            <h3 className="text-2xl font-black text-slate-900 mt-1 font-mono">
              {dynamicStats.totalCount}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              <strong className="text-slate-700">{dynamicStats.activeCount}</strong> active • {dynamicStats.inactiveCount} archived
            </p>
          </div>
        </div>

        {/* Card 2: Professional Services */}
        <div className="bg-[#F8F9FE] p-5 rounded-3xl shadow-xs border border-indigo-100/90 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-indigo-100/80 rounded-2xl flex items-center justify-center text-indigo-600 border border-indigo-200/60 shrink-0">
              <Layers size={20} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
              SERVICES
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Service Offerings
            </p>
            <h3 className="text-2xl font-black text-indigo-600 mt-1 font-mono">
              {dynamicStats.serviceCount}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Development, design, consulting & retainer
            </p>
          </div>
        </div>

        {/* Card 3: Products & Hosting */}
        <div className="bg-[#FFF9F5] p-5 rounded-3xl shadow-xs border border-orange-100/90 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-100/80 rounded-2xl flex items-center justify-center text-orange-600 border border-orange-200/60 shrink-0">
              <Box size={20} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
              SUBSCRIPTIONS
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Products & Subscriptions
            </p>
            <h3 className="text-2xl font-black text-orange-600 mt-1 font-mono">
              {dynamicStats.productCount}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Cloud servers, licenses & infrastructure
            </p>
          </div>
        </div>

        {/* Card 4: Average Catalog Rate */}
        <div className="bg-[#F6FAF7] p-5 rounded-3xl shadow-xs border border-emerald-100/90 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-100/80 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-200/60 shrink-0">
              <Percent size={20} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              AVG RATE
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Average Unit Price
            </p>
            <h3 className="text-2xl font-black text-emerald-600 mt-1 font-mono">
              {formatNPR(dynamicStats.avgRate)}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1">
              Standard rate across active catalog
            </p>
          </div>
        </div>
      </div>

      {/* 3. SEARCH & FILTER TOOLBAR */}
      <div className="bg-white p-4 rounded-2xl shadow-xs border border-slate-200/90 mb-6 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Search offerings by name, item code (e.g. SRV-001), or description..." 
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
                <option value="Service">Service</option>
                <option value="Product">Product</option>
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
              Showing <strong className="text-slate-800">{filteredProducts.length}</strong> of {products.length}
            </div>
          </div>
        </div>
      </div>

      {/* 4. PRODUCTS & SERVICES TABLE */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200/80 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Item Code & Name</th>
                <th className="px-5 py-3.5">Offering Type</th>
                <th className="px-5 py-3.5">Standard Rate (NPR)</th>
                <th className="px-5 py-3.5">Tax (VAT)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-accent" size={24} />
                      <p className="text-xs font-medium">Loading catalog items...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-3 border border-indigo-100">
                        <Package size={26} />
                      </div>
                      <h4 className="font-bold text-slate-800 text-base">No Catalog Items Found</h4>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                        {products.length > 0 
                          ? 'No items match your filter criteria. Try resetting filters.'
                          : 'Your catalog is currently empty. Add your first service or product offering to get started.'}
                      </p>
                      {products.length > 0 ? (
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
                          <span>+ Add First Item</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/70 transition-colors group">
                    {/* 1. Item Code & Name */}
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 leading-snug">{product.name}</div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono mt-0.5">
                        <span 
                          onClick={(e) => handleCopyId(product.item_code, e)}
                          className="text-slate-600 hover:text-accent font-semibold cursor-pointer flex items-center gap-1 transition-colors"
                          title="Click to copy Item Code"
                        >
                          {product.item_code}
                          {copiedId === product.item_code ? (
                            <Check size={11} className="text-emerald-600" />
                          ) : (
                            <Copy size={11} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </span>
                        {product.description && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500 font-sans truncate max-w-[280px]" title={product.description}>
                              {product.description}
                            </span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* 2. Offering Type */}
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${
                        product.type === 'Service'
                          ? 'bg-blue-50 text-blue-700 border-blue-200'
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {product.type === 'Service' ? <Layers size={11} /> : <Box size={11} />}
                        <span>{product.type}</span>
                      </span>
                    </td>

                    {/* 3. Rate */}
                    <td className="px-5 py-4 font-black text-slate-900 text-sm font-mono">
                      {formatNPR(product.default_rate)}
                    </td>

                    {/* 4. Tax */}
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-xs font-semibold border border-slate-200 font-mono">
                        <Tag size={10} className="text-slate-400" />
                        <span>{product.tax_rate}% VAT</span>
                      </span>
                    </td>

                    {/* 5. Status Toggle */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <button 
                          type="button"
                          onClick={() => handleToggleProductStatus(product.id, product.is_active)}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            product.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={`Click to mark as ${product.is_active ? 'Inactive' : 'Active'}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              product.is_active ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className={`text-xs font-bold ${product.is_active ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </td>

                    {/* 6. Actions */}
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button 
                          onClick={() => handleDuplicate(product)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Duplicate Item"
                        >
                          <Copy size={15} />
                        </button>
                        <button 
                          onClick={() => handleEditClick(product)}
                          className="p-1.5 text-slate-400 hover:text-accent hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Item Details"
                        >
                          <Edit size={15} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(product.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete Item"
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

      {/* 5. ADD / EDIT PRODUCT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/60">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center">
                  <Package size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {editingId ? 'Edit Offering' : 'Add New Offering'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {editingId ? `Updating record #${editingId}` : 'Add a billable service or sellable product to your inventory'}
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
                    Offering Type <span className="text-rose-500">*</span>
                  </label>
                  <select 
                    className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm font-medium cursor-pointer"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Service">Professional Service</option>
                    <option value="Product">Physical / Digital Product</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Item Name <span className="text-rose-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Custom Web Application Development"
                    className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Item Description
                </label>
                <textarea 
                  rows={2}
                  placeholder="Detailed description of features, deliverables, or specifications..."
                  className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm resize-none font-medium"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Default Unit Rate (रु. NPR) <span className="text-rose-500">*</span>
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
                      value={formData.default_rate}
                      onChange={(e) => setFormData({...formData, default_rate: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Standard Tax Rate (% VAT)
                  </label>
                  <div className="relative">
                    <input 
                      type="number" 
                      required
                      min="0"
                      max="100"
                      placeholder="13"
                      className="w-full px-3 py-2.5 bg-slate-50/70 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-sm font-semibold font-mono"
                      value={formData.tax_rate}
                      onChange={(e) => setFormData({...formData, tax_rate: parseFloat(e.target.value) || 0})}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                      %
                    </span>
                  </div>
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
                  <span>{isSubmitting ? 'Saving...' : (editingId ? 'Save Offering Changes' : 'Save Offering')}</span>
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
        title="Delete Offering"
        message="Are you sure you want to permanently delete this catalog item? This will remove it from future invoice creation."
        confirmText="Delete Offering"
        isDanger={true}
      />
    </div>
  );
};

export default Products;
