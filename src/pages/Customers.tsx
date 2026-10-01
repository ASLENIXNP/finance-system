import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Download, Loader2, Edit, Trash2, FileText } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { supabase } from '../lib/supabase';

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

const Customers = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<string | null>(null);
  
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
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

      if (error) throw error;
      setCustomers(data || []);
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
        const { error } = await supabase
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
          
        if (error) throw error;
      } else {
        const newId = `CUST-${Math.floor(1000 + Math.random() * 9000)}`;
        
        const { error } = await supabase.from('customers').insert([
          {
            customer_id: newId,
            ...formData
          }
        ]);
  
        if (error) throw error;
      }
      
      resetForm();
      setIsModalOpen(false);
      fetchCustomers();
    } catch (error: any) {
      alert(error.message || 'Error saving customer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleCustomerStatus = async (customerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('customers')
        .update({ is_active: !currentStatus })
        .eq('id', customerId);
        
      if (error) throw error;
      
      setCustomers(customers.map(c => 
        c.id === customerId ? { ...c, is_active: !currentStatus } : c
      ));
    } catch (error: any) {
      console.error('Error updating status:', error);
      alert('Failed to update customer status.');
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
    
    try {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', customerToDelete);
        
      if (error) throw error;
      setCustomers(customers.filter(c => c.id !== customerToDelete));
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      alert('Failed to delete customer. They might be linked to existing invoices.');
    } finally {
      setCustomerToDelete(null);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">Customers</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your clients, companies, and organizations.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition-colors shadow-sm flex-1 md:flex-none">
            <Download size={18} />
            Export
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors shadow-sm flex-1 md:flex-none"
          >
            <Plus size={18} />
            Add Customer
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
              placeholder="Search customers by name, company, or PAN..." 
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
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Type / PAN</th>
                <th className="px-6 py-4">Total Billed</th>
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
                      <p>Loading customers...</p>
                    </div>
                  </td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <p>No customers found.</p>
                      <button className="text-accent font-medium hover:underline text-sm mt-1">Add your first customer</button>
                    </div>
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-primary">{customer.company_name || customer.name}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{customer.customer_id} {customer.company_name ? `• ${customer.name}` : ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div>{customer.phone || 'N/A'}</div>
                      <div className="text-slate-500 text-xs mt-0.5">{customer.email || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-medium mb-1">
                        {customer.type}
                      </span>
                      <div className="text-xs text-slate-500">PAN: {customer.pan_number || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-primary">
                      रु. 0.00 {/* To be calculated from invoices */}
                    </td>
                    <td className="px-6 py-4">
                      <button 
                        onClick={() => handleToggleCustomerStatus(customer.id, customer.is_active)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 ${
                          customer.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span className="sr-only">Toggle status</span>
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            customer.is_active ? 'translate-x-6' : 'translate-x-1'
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
                          onClick={() => handleCreateInvoice(customer)}
                          className="p-2 text-slate-400 hover:text-accent hover:bg-white rounded-lg transition-colors shadow-sm"
                          title="Create invoice for this customer"
                        >
                          <FileText size={16} />
                        </button>
                        <button 
                          onClick={() => handleEditClick(customer)}
                          className="p-2 text-slate-400 hover:text-accent hover:bg-white rounded-lg transition-colors shadow-sm"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(customer.id)}
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
        
        {/* Pagination placeholder */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm text-slate-500 bg-slate-50/30">
          <div>Showing 1 to 4 of 4 entries</div>
          <div className="flex gap-1">
            <button className="px-3 py-1 border border-slate-200 rounded text-slate-400 cursor-not-allowed">Prev</button>
            <button className="px-3 py-1 bg-accent text-white rounded font-medium">1</button>
            <button className="px-3 py-1 border border-slate-200 rounded text-slate-400 cursor-not-allowed">Next</button>
          </div>
        </div>
      </div>

      {/* Add / Edit Customer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-primary">
                {editingId ? 'Edit Customer' : 'Add New Customer'}
              </h3>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Customer Type</label>
                  <select 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                  >
                    <option value="Company">Company</option>
                    <option value="Individual">Individual</option>
                    <option value="Organization">Organization</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Primary Contact Name *</label>
                  <input 
                    type="text" 
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company Name</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">PAN Number</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    value={formData.pan_number}
                    onChange={(e) => setFormData({...formData, pan_number: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
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
                  {isSubmitting ? 'Saving...' : (editingId ? 'Save Changes' : 'Save Customer')}
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
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone and may affect existing invoices."
        confirmText="Delete Customer"
        isDanger={true}
      />

      <ConfirmModal 
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        onConfirm={() => {}}
        title="Coming Soon"
        message={alertMessage}
        confirmText="Got it"
        hideCancel={true}
      />
    </div>
  );
};

export default Customers;
