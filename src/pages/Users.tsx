import { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Edit, 
  Trash2, 
  Shield, 
  RotateCcw, 
  Users as UsersIcon, 
  ShieldCheck, 
  UserCheck, 
  Briefcase, 
  Download, 
  X, 
  Check, 
  Copy,
  Mail,
  Clock
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string;
}

const initialUsersData: UserItem[] = [
  { id: 'USR-001', name: 'Super Admin', email: 'admin@aslenix.com', role: 'Super Admin', status: 'Active', lastLogin: '१५ असोज २०८३ (10:15 AM)' },
  { id: 'USR-002', name: 'Bikash Thapa', email: 'bikash@aslenix.com', role: 'Accountant', status: 'Active', lastLogin: '१४ असोज २०८३ (04:30 PM)' },
  { id: 'USR-003', name: 'Sarita Sharma', email: 'sarita@aslenix.com', role: 'Billing Staff', status: 'Active', lastLogin: '१५ असोज २०८३ (09:00 AM)' },
  { id: 'USR-004', name: 'Ravi Kumar', email: 'ravi@aslenix.com', role: 'Admin', status: 'Inactive', lastLogin: '२९ भाद्र २०८३ (11:20 AM)' },
  { id: 'USR-005', name: 'Guest User', email: 'guest@aslenix.com', role: 'Viewer', status: 'Active', lastLogin: '१२ असोज २०८३ (02:15 PM)' },
];

const roleColors: Record<string, string> = {
  'Super Admin': 'bg-purple-50 text-purple-700 border-purple-200',
  'Admin': 'bg-blue-50 text-blue-700 border-blue-200',
  'Accountant': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Billing Staff': 'bg-amber-50 text-amber-700 border-amber-200',
  'Viewer': 'bg-slate-50 text-slate-700 border-slate-200',
};

const DELETED_USERS_KEY = 'aslenix_deleted_users';

const getDeletedUserIds = (): Set<string> => {
  try {
    const raw = localStorage.getItem(DELETED_USERS_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
};

const recordDeletedUserId = (id: string) => {
  try {
    const set = getDeletedUserIds();
    if (id) set.add(id);
    localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(Array.from(set)));
  } catch (e) {
    console.error('Failed to record deleted user id:', e);
  }
};

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [usersData, setUsersData] = useState<UserItem[]>(() => {
    const deletedIds = getDeletedUserIds();
    const saved = localStorage.getItem('aslenix_users');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(item => !deletedIds.has(item.id));
        }
      } catch {
        // fallback
      }
    }
    return initialUsersData.filter(item => !deletedIds.has(item.id));
  });

  const saveUsersData = (data: UserItem[]) => {
    setUsersData(data);
    localStorage.setItem('aslenix_users', JSON.stringify(data));
  };

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Toggle user status directly
  const handleToggleStatus = (user: UserItem) => {
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    const updated = usersData.map(u => u.id === user.id ? { ...u, status: nextStatus } : u);
    saveUsersData(updated);
  };

  // Dynamic statistics
  const stats = useMemo(() => {
    const total = usersData.length;
    const admins = usersData.filter(u => u.role === 'Super Admin' || u.role === 'Admin').length;
    const active = usersData.filter(u => u.status === 'Active').length;
    const staff = usersData.filter(u => u.role === 'Accountant' || u.role === 'Billing Staff').length;
    const activePercentage = total > 0 ? Math.round((active / total) * 100) : 0;

    return { total, admins, active, staff, activePercentage };
  }, [usersData]);

  // Export CSV
  const handleExportCSV = () => {
    if (usersData.length === 0) return;
    const headers = ['User ID', 'Name', 'Email', 'Role', 'Status', 'Last Login'];
    const rows = filteredUsers.map(u => [
      `"${u.id}"`,
      `"${u.name.replace(/"/g, '""')}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.status}"`,
      `"${u.lastLogin}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aslenix_users_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = useMemo(() => {
    return usersData.filter((user) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch = !q || 
        user.name.toLowerCase().includes(q) || 
        user.email.toLowerCase().includes(q) ||
        user.id.toLowerCase().includes(q);

      const matchesRole = roleFilter === 'All' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'All' || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [usersData, searchTerm, roleFilter, statusFilter]);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Viewer',
    status: 'Active'
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', role: 'Viewer', status: 'Active' });
    setEditingId(null);
  };

  const handleDeleteClick = (id: string) => {
    setUserToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      recordDeletedUserId(userToDelete);
      const updated = usersData.filter(item => item.id !== userToDelete);
      saveUsersData(updated);
      setDeleteModalOpen(false);
      setUserToDelete(null);
    }
  };

  const handleEditClick = (user: UserItem) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      const updated = usersData.map(item => 
        item.id === editingId 
          ? { ...item, ...formData } 
          : item
      );
      saveUsersData(updated);
    } else {
      const nextNum = Math.floor(100 + Math.random() * 900);
      const newUser: UserItem = {
        id: `USR-${nextNum}`,
        lastLogin: 'Never Logged In',
        ...formData
      };
      saveUsersData([newUser, ...usersData]);
    }
    setIsModalOpen(false);
    resetForm();
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">User Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage system access, staff accounts, and role permissions.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={handleExportCSV}
            disabled={usersData.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex-1 sm:flex-none"
          >
            <Download size={16} className="text-slate-500" />
            Export
          </button>
          <button 
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white rounded-xl font-semibold text-sm hover:bg-accent-hover transition-all shadow-md shadow-accent/20 hover:shadow-lg hover:shadow-accent/30 cursor-pointer flex-1 sm:flex-none"
          >
            <Plus size={18} />
            Invite User
          </button>
        </div>
      </div>

      {/* 4 Dynamic Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <UsersIcon size={20} />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
              Directory
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total System Users</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-slate-900">{stats.total}</h3>
            <span className="text-xs text-slate-500 font-medium">accounts</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
              <ShieldCheck size={20} />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
              Privileged
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Super Admins & Admins</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-purple-700">{stats.admins}</h3>
            <span className="text-xs text-slate-500 font-medium">with full rights</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <UserCheck size={20} />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {stats.activePercentage}% active
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Operators</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-emerald-600">{stats.active}</h3>
            <span className="text-xs text-slate-500 font-medium">active logins</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <Briefcase size={20} />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Finance & Billing
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Staff Accounts</p>
          <div className="mt-1 flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-amber-700">{stats.staff}</h3>
            <span className="text-xs text-slate-500 font-medium">operational roles</span>
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Table Header/Controls */}
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input 
              type="text" 
              placeholder="Search users by name, email, or ID..." 
              className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full"
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Role Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-sm">
              <Filter size={13} className="text-slate-400" />
              <span className="font-semibold text-slate-500">Role:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
              >
                <option value="All">All Roles</option>
                <option value="Super Admin">Super Admin</option>
                <option value="Admin">Admin</option>
                <option value="Accountant">Accountant</option>
                <option value="Billing Staff">Billing Staff</option>
                <option value="Viewer">Viewer</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-sm">
              <span className="font-semibold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
              >
                <option value="All">All Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            {(roleFilter !== 'All' || statusFilter !== 'All' || searchTerm) && (
              <button
                onClick={() => {
                  setRoleFilter('All');
                  setStatusFilter('All');
                  setSearchTerm('');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors shadow-sm cursor-pointer"
                title="Clear all filters"
              >
                <RotateCcw size={13} />
                Clear
              </button>
            )}

            <div className="text-xs text-slate-400 font-medium pl-1">
              Showing <span className="font-semibold text-slate-700">{filteredUsers.length}</span> of {usersData.length}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">User Details</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Last Login (अन्तिम लगइन BS)</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-14 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <UsersIcon size={24} />
                      </div>
                      <p className="font-semibold text-slate-700 mt-1">No users match your criteria</p>
                      <p className="text-xs text-slate-400 max-w-sm">Try broadening your search keyword or resetting the role and status filters.</p>
                      <button 
                        onClick={() => {
                          setRoleFilter('All');
                          setStatusFilter('All');
                          setSearchTerm('');
                        }}
                        className="text-accent text-xs font-semibold hover:underline mt-2 cursor-pointer"
                      >
                        Reset filters to view all users
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shadow-sm shrink-0">
                          {user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{user.name}</span>
                            <button
                              onClick={(e) => handleCopyId(user.id, e)}
                              className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 hover:text-accent bg-slate-100 hover:bg-accent/10 px-1.5 py-0.5 rounded transition-colors"
                              title="Click to copy User ID"
                            >
                              {copiedId === user.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                              {user.id}
                            </button>
                          </div>
                          <div className="flex items-center gap-1 text-slate-400 text-xs mt-0.5">
                            <Mail size={12} />
                            <a href={`mailto:${user.email}`} className="hover:text-accent transition-colors">
                              {user.email}
                            </a>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColors[user.role] || roleColors['Viewer']}`}>
                        <Shield size={12} />
                        {user.role}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border cursor-pointer transition-all hover:scale-105 ${
                          user.status === 'Active' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' 
                            : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                        }`}
                        title="Click to toggle status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></span>
                        {user.status}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-slate-500 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Clock size={12} className="text-slate-400" />
                        <span>{user.lastLogin}</span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => handleEditClick(user)}
                          className="p-1.5 text-slate-400 hover:text-accent hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit user"
                        >
                          <Edit size={16} />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(user.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove user"
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

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Remove User"
        message="Are you sure you want to remove this user? This will revoke their access to the system permanently."
        confirmText="Remove User"
        isDanger={true}
      />

      {/* Add / Edit User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  {editingId ? 'Edit User Profile' : 'Invite New User'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  {editingId ? 'Modify role permissions and account status' : 'Assign roles and credentials for system access'}
                </p>
              </div>
              <button 
                onClick={() => { setIsModalOpen(false); resetForm(); }}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Ramesh Shrestha"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="staff@aslenix.com"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Role Permission</label>
                  <select
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all cursor-pointer"
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                  >
                    <option value="Super Admin">Super Admin (Full Access)</option>
                    <option value="Admin">Admin</option>
                    <option value="Accountant">Accountant</option>
                    <option value="Billing Staff">Billing Staff</option>
                    <option value="Viewer">Viewer (Read-Only)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Account Status</label>
                  <select
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent focus:bg-white transition-all cursor-pointer"
                    value={formData.status}
                    onChange={(e) => setFormData({...formData, status: e.target.value})}
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
              
              <div className="pt-5 mt-5 border-t border-slate-100 flex justify-end gap-3">
                <button 
                  type="button"
                  onClick={() => { setIsModalOpen(false); resetForm(); }}
                  className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 font-medium text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2.5 bg-accent text-white rounded-xl hover:bg-accent-hover font-semibold text-sm transition-all shadow-md shadow-accent/20 cursor-pointer"
                >
                  {editingId ? 'Save Changes' : 'Send Invite'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;
