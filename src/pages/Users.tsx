import { useState } from 'react';
import { Search, Plus, Filter, UserCog, MoreVertical, Edit, Trash2, Shield } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

const initialUsersData = [
  { id: 'USR-001', name: 'Super Admin', email: 'admin@aslenix.com', role: 'Super Admin', status: 'Active', lastLogin: 'Oct 01, 2026 10:15 AM' },
  { id: 'USR-002', name: 'Bikash Thapa', email: 'bikash@aslenix.com', role: 'Accountant', status: 'Active', lastLogin: 'Sep 30, 2026 04:30 PM' },
  { id: 'USR-003', name: 'Sarita Sharma', email: 'sarita@aslenix.com', role: 'Billing Staff', status: 'Active', lastLogin: 'Oct 01, 2026 09:00 AM' },
  { id: 'USR-004', name: 'Ravi Kumar', email: 'ravi@aslenix.com', role: 'Admin', status: 'Inactive', lastLogin: 'Sep 15, 2026 11:20 AM' },
  { id: 'USR-005', name: 'Guest User', email: 'guest@aslenix.com', role: 'Viewer', status: 'Active', lastLogin: 'Sep 28, 2026 02:15 PM' },
];

const roleColors: Record<string, string> = {
  'Super Admin': 'bg-purple-50 text-purple-700 border-purple-200',
  'Admin': 'bg-blue-50 text-blue-700 border-blue-200',
  'Accountant': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Billing Staff': 'bg-amber-50 text-amber-700 border-amber-200',
  'Viewer': 'bg-slate-50 text-slate-700 border-slate-200',
};

const Users = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [usersData, setUsersData] = useState(initialUsersData);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleDeleteClick = (id: string) => {
    setUserToDelete(id);
    setDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      setUsersData(usersData.filter(item => item.id !== userToDelete));
      setUserToDelete(null);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-primary">User Management</h2>
          <p className="text-slate-500 text-sm mt-1">Manage system access, staff accounts, and role permissions.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-accent text-white rounded-lg font-medium hover:bg-accent-hover transition-colors shadow-sm flex-1 md:flex-none">
            <Plus size={18} />
            Invite User
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
              placeholder="Search users by name or email..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors w-full md:w-auto justify-center">
              <Filter size={16} />
              Role Filter
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-medium">
              <tr>
                <th className="px-6 py-4">User Details</th>
                <th className="px-6 py-4">Assigned Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Last Login</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {usersData.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold shadow-inner">
                        {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-primary">{user.name}</div>
                        <div className="text-slate-500 text-xs mt-0.5">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColors[user.role]}`}>
                      <Shield size={12} />
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                      user.status === 'Active' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'Active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">
                    {user.lastLogin}
                  </td>
                  <td className="px-6 py-4 text-right relative overflow-hidden">
                    <div className="flex items-center justify-end transition-transform duration-300 group-hover:-translate-x-20 text-slate-400">
                      <span className="text-xs mr-2 opacity-0 group-hover:opacity-100 transition-opacity">Actions</span>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-300 mx-0.5"></div>
                    </div>
                    
                    <div className="absolute top-0 bottom-0 -right-24 group-hover:right-0 px-4 flex items-center justify-center gap-2 bg-slate-50 transition-all duration-300">
                      <button 
                        onClick={() => {
                          setAlertMessage(`Edit feature for ${user.name} is coming soon!`);
                          setAlertModalOpen(true);
                        }}
                        className="p-2 text-slate-400 hover:text-accent hover:bg-white rounded-lg transition-colors shadow-sm"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(user.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-white rounded-lg transition-colors shadow-sm"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Remove User"
        message="Are you sure you want to remove this user? This will revoke their access to the system."
        confirmText="Remove User"
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

export default Users;
