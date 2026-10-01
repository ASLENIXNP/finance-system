import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Package, Edit, Trash2, Loader2 } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';

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
  { id: 'p1', item_code: 'SRV-001', name: 'Custom Web Application Development', type: 'Service', description: 'Full stack development', default_rate: 85000, tax_rate: 13, is_active: true },
  { id: 'p2', item_code: 'SRV-002', name: 'UI/UX Design & Prototyping', type: 'Service', description: 'Figma UI/UX design', default_rate: 45000, tax_rate: 13, is_active: true },
  { id: 'p3', item_code: 'SRV-003', name: 'Annual Software Maintenance (AMC)', type: 'Service', description: 'Regular maintenance and backup', default_rate: 35000, tax_rate: 13, is_active: true },
  { id: 'p4', item_code: 'PRD-001', name: 'Cloud Server VPS (1 Year)', type: 'Product', description: 'High performance hosting', default_rate: 20000, tax_rate: 13, is_active: true },
];

const Products = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('aslenix_products');
    return saved ? JSON.parse(saved) : defaultProducts;
  });
  const [loading, setLoading] = useState(false);

  const saveProducts = (data: Product[]) => {
    setProducts(data);
    localStorage.setItem('aslenix_products', JSON.stringify(data));
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Service',
    default_rate: 0,
    tax_rate: 13,
  });

  const resetForm = () => {
    setFormData({ name: '', type: 'Service', default_rate: 0, tax_rate: 13 });
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
        saveProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
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
          default_rate: formData.default_rate,
          tax_rate: formData.tax_rate,
          is_active: true
        };
        saveProducts([newProduct, ...products]);

        try {
          await supabase.from('products').insert([
            {
              item_code: newCode,
              ...formData
            }
          ]);
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
      default_rate: product.default_rate,
      tax_rate: product.tax_rate,
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    
    // Always remove from local state & localStorage immediately so it never returns on reload!
    const updated = products.filter(p => p.id !== productToDelete);
    saveProducts(updated);
    setDeleteModalOpen(false);

    try {
      await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete);
    } catch (error: any) {
      console.error('Error deleting product from DB:', error);
    } finally {
      setProductToDelete(null);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Products & Services</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your service offerings, products, and standard rates.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors shadow-sm flex-1 md:flex-none"
          >
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
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Loader2 className="animate-spin text-accent" size={24} />
                      <p>Loading products...</p>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p>No products or services found.</p>
                      <button className="text-accent font-medium hover:underline text-sm mt-1">Add your first item</button>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                          <Package size={20} />
                        </div>
                        <div>
                          <div className="font-semibold text-primary">{item.name}</div>
                          <div className="text-slate-500 text-xs mt-0.5">{item.item_code}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium">
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-primary">
                      रु. {item.default_rate.toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500">
                      {item.tax_rate}%
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleProductStatus(item.id, item.is_active)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                          item.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span className="sr-only">Toggle status</span>
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            item.is_active ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right relative overflow-hidden">
                      <div className="flex items-center justify-end transition-transform duration-300 group-hover:-translate-x-20 text-slate-400">
                        {/* A visual cue that you can slide or hover */}
                        <span className="text-xs mr-2 opacity-0 group-hover:opacity-100 transition-opacity">Actions</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                      </div>
                      
                      <div className="absolute top-0 bottom-0 -right-24 group-hover:right-0 px-4 flex items-center justify-center gap-2 bg-slate-50 transition-all duration-300">
                        <button 
                          onClick={() => handleEditClick(item)}
                          className="p-2 text-slate-400 hover:text-accent hover:bg-white rounded-lg transition-colors shadow-sm"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(item.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors shadow-sm"
                        >
                          <Trash2 size={16} />
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

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-primary">
                {editingId ? 'Edit Item' : 'Add New Item'}
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g. Website Maintenance"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Item Type</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="type" 
                      value="Service" 
                      checked={formData.type === 'Service'}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="text-accent focus:ring-accent"
                    />
                    <span className="text-sm text-slate-700">Service</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="radio" 
                      name="type" 
                      value="Product" 
                      checked={formData.type === 'Product'}
                      onChange={(e) => setFormData({...formData, type: e.target.value})}
                      className="text-accent focus:ring-accent"
                    />
                    <span className="text-sm text-slate-700">Product</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Default Rate (रु.) *</label>
                  <input 
                    type="number" 
                    required
                    min="0"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    value={formData.default_rate}
                    onChange={(e) => setFormData({...formData, default_rate: Number(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Tax Rate (%)</label>
                  <input 
                    type="number" 
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    value={formData.tax_rate}
                    onChange={(e) => setFormData({...formData, tax_rate: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-accent text-white rounded-lg hover:bg-accent-hover font-medium transition-colors disabled:opacity-70 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                  {isSubmitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Save Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Item"
        message="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete Item"
        isDanger={true}
      />
    </div>
  );
};

export default Products;
