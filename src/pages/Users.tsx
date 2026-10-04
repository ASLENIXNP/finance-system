import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Briefcase,
  Check,
  Copy,
  Download,
  Filter,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  Users as UsersIcon,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface UserItem {
  id: string;
  name: string;
  role: string;
  createdAt: string | null;
}

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  accountant: 'Accountant',
  billing_staff: 'Billing Staff',
  viewer: 'Viewer',
};

const roleColors: Record<string, string> = {
  'Super Admin': 'bg-purple-50 text-purple-700 border-purple-200',
  Admin: 'bg-blue-50 text-blue-700 border-blue-200',
  Accountant: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Billing Staff': 'bg-amber-50 text-amber-700 border-amber-200',
  Viewer: 'bg-slate-50 text-slate-700 border-slate-200',
};

const Users = () => {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('profiles')
        .select('id, full_name, role, created_at')
        .order('created_at', { ascending: false });

      if (queryError) throw queryError;

      setUsers((data ?? []).map((profile) => ({
        id: profile.id,
        name: profile.full_name,
        role: roleLabels[profile.role] ?? profile.role,
        createdAt: profile.created_at,
      })));
    } catch (fetchError) {
      console.error('Failed to load Supabase profiles:', fetchError);
      setError(fetchError instanceof Error
        ? fetchError.message
        : 'Unable to load user profiles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filteredUsers = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    return users.filter((user) => {
      const matchesSearch = !query ||
        user.name.toLowerCase().includes(query) ||
        user.id.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query);
      return matchesSearch && (roleFilter === 'All' || user.role === roleFilter);
    });
  }, [users, searchTerm, roleFilter]);

  const stats = useMemo(() => {
    const admins = users.filter((user) => user.role === 'Super Admin' || user.role === 'Admin').length;
    const financeStaff = users.filter((user) => user.role === 'Accountant' || user.role === 'Billing Staff').length;
    return {
      total: users.length,
      admins,
      financeStaff,
      other: users.length - admins - financeStaff,
    };
  }, [users]);

  const handleCopyId = async (id: string) => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch (copyError) {
      console.error('Failed to copy profile ID:', copyError);
    }
  };

  const handleExportCSV = () => {
    if (filteredUsers.length === 0) return;

    const escapeCsv = (value: string) => `"${value.replace(/"/g, '""')}"`;
    const rows = [
      ['User ID', 'Name', 'Role', 'Profile Created'],
      ...filteredUsers.map((user) => [
        user.id,
        user.name,
        user.role,
        user.createdAt ? new Date(user.createdAt).toISOString() : '',
      ]),
    ];
    const csv = rows.map((row) => row.map(escapeCsv).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = `aslenix_profiles_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const metrics = [
    { label: 'Supabase Profiles', value: stats.total, tag: 'DIRECTORY', color: 'blue', icon: <UsersIcon size={20} /> },
    { label: 'Administrators', value: stats.admins, tag: 'ADMIN ACCESS', color: 'purple', icon: <ShieldCheck size={20} /> },
    { label: 'Finance Staff', value: stats.financeStaff, tag: 'FINANCE ROLES', color: 'emerald', icon: <Briefcase size={20} /> },
    { label: 'Other Roles', value: stats.other, tag: 'OTHER ACCESS', color: 'orange', icon: <Shield size={20} /> },
  ];

  const metricStyles: Record<string, string> = {
    blue: 'bg-[#F8FAFF] border-blue-100/90 text-blue-600',
    purple: 'bg-[#FAF7FD] border-purple-100/90 text-purple-600',
    emerald: 'bg-[#F6FAF7] border-emerald-100/90 text-emerald-600',
    orange: 'bg-[#FFF9F5] border-orange-100/90 text-orange-600',
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-primary tracking-tight">User Management</h1>
          <p className="text-slate-500 text-sm mt-1">Profiles loaded from the shared Supabase database.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => void fetchUsers()}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex-1 sm:flex-none"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={filteredUsers.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl font-medium text-sm hover:bg-slate-50 transition-colors shadow-sm disabled:opacity-50 cursor-pointer flex-1 sm:flex-none"
          >
            <Download size={16} className="text-slate-500" />
            Export
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => (
          <div key={metric.tag} className={`p-5 rounded-3xl border shadow-xs flex flex-col justify-between ${metricStyles[metric.color]}`}>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-white/80 rounded-2xl flex items-center justify-center border border-current/10 shrink-0">
                {metric.icon}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider">{metric.tag}</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{metric.label}</p>
              <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">{metric.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-4 md:p-5 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              type="text"
              placeholder="Search profiles by name, role, or ID..."
              className="w-full pl-10 pr-9 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all shadow-sm"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-700 shadow-sm">
              <Filter size={13} className="text-slate-400" />
              <span className="font-semibold text-slate-500">Role:</span>
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
              >
                <option value="All">All Roles</option>
                {Object.values(roleLabels).map((role) => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div className="text-xs text-slate-400 font-medium pl-1">
              Showing <span className="font-semibold text-slate-700">{filteredUsers.length}</span> of {users.length}
            </div>
          </div>
        </div>

        {error && (
          <div role="alert" className="m-4 flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            <AlertCircle size={17} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold">Could not load Supabase profiles</p>
              <p>{error}</p>
              <p className="mt-1 text-xs">Check that the profiles table exists and authenticated users have permission to read it.</p>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold text-xs uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Profile</th>
                <th className="px-6 py-3.5">Assigned Role</th>
                <th className="px-6 py-3.5">Profile Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={3} className="px-6 py-14 text-center text-slate-500">
                    <span className="inline-flex items-center gap-2"><RefreshCw size={16} className="animate-spin" /> Loading Supabase profiles...</span>
                  </td>
                </tr>
              ) : !error && filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-14 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                        <UsersIcon size={24} />
                      </div>
                      <p className="font-semibold text-slate-700 mt-1">
                        {users.length === 0 ? 'No Supabase profiles found' : 'No profiles match your search'}
                      </p>
                      <p className="text-xs text-slate-400 max-w-sm">
                        {users.length === 0 ? 'Profiles will appear here after they are created in the database.' : 'Try a different search or role filter.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-sm shadow-sm shrink-0">
                          {user.name.split(' ').map((part) => part[0]).join('').substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{user.name}</p>
                          <button
                            type="button"
                            onClick={() => void handleCopyId(user.id)}
                            className="inline-flex items-center gap-1 font-mono text-[10px] text-slate-400 hover:text-accent bg-slate-100 hover:bg-accent/10 px-1.5 py-0.5 rounded transition-colors"
                            title="Copy profile ID"
                          >
                            {copiedId === user.id ? <Check size={10} className="text-emerald-500" /> : <Copy size={10} />}
                            {user.id}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${roleColors[user.role] || roleColors.Viewer}`}>
                        <Shield size={12} />
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {user.createdAt ? new Date(user.createdAt).toLocaleString() : '—'}
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

export default Users;
