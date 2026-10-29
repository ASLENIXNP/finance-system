import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  BookOpen, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Download, 
  Printer, 
  Building2, 
  Layers, 
  Scale, 
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { NepaliDatePicker } from '../components/NepaliDatePicker';
import { 
  toBsDateString, 
  getTodayBsDate, 
  bsToAdDate 
} from '../lib/nepaliDate';
import { 
  formatNPR, 
  STANDARD_CHART_OF_ACCOUNTS, 
  type AccountItem 
} from '../lib/accounting';

export interface JournalLineItem {
  id: string | number;
  accountId: string;
  accountCode: string;
  accountName: string;
  description: string;
  debit: number;
  credit: number;
}

export interface JournalEntryRecord {
  id: string;
  entry_no: string;
  entry_date: string; // AD
  entry_date_bs: string; // BS
  reference_no?: string;
  description: string;
  total_debit: number;
  total_credit: number;
  is_balanced: boolean;
  status: 'Posted' | 'Draft' | 'Void';
  source: string;
  created_by: string;
  created_at: string;
  lines: JournalLineItem[];
}

const LOCAL_STORAGE_JOURNAL_KEY = 'aslenix_journal_v2';
const LOCAL_STORAGE_COA_KEY = 'aslenix_coa_v2';

const getInitialCOA = (): AccountItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_COA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse stored COA:', e);
  }
  return STANDARD_CHART_OF_ACCOUNTS;
};

const DUMMY_SEED_JV_IDS = new Set(['jv-001', 'jv-002', 'jv-003']);

const getInitialJournals = (): JournalEntryRecord[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_JOURNAL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter((item: any) => !DUMMY_SEED_JV_IDS.has(item.id));
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored journals:', e);
  }

  return [];
};

export const Accounting: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'journals' | 'ledger' | 'coa' | 'trial_balance'>('journals');
  const [coa] = useState<AccountItem[]>(getInitialCOA);
  const [journals, setJournals] = useState<JournalEntryRecord[]>(getInitialJournals);
  const [loading, setLoading] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [selectedLedgerAccount, setSelectedLedgerAccount] = useState<string>('1020'); // Global IME Bank default

  // New JV Modal State
  const [newJvModalOpen, setNewJvModalOpen] = useState(false);
  const [jvDateBs, setJvDateBs] = useState(getTodayBsDate());
  const [jvRefNo, setJvRefNo] = useState('');
  const [jvDescription, setJvDescription] = useState('');
  const [jvLines, setJvLines] = useState<JournalLineItem[]>([
    { id: 1, accountId: '1020', accountCode: '1020', accountName: 'Global IME Bank (Main Account)', description: '', debit: 0, credit: 0 },
    { id: 2, accountId: '4010', accountCode: '4010', accountName: 'IT & Software Development Revenue', description: '', debit: 0, credit: 0 },
  ]);

  // Sync with Supabase on mount
  const syncWithSupabase = useCallback(async () => {
    setLoading(true);
    try {
      const { data: dbEntries, error } = await supabase
        .from('journal_entries')
        .select(`
          *,
          journal_entry_lines (
            id,
            account_id,
            description,
            debit,
            credit,
            chart_of_accounts (
              code,
              name
            )
          )
        `)
        .order('entry_date', { ascending: false });

      if (!error && dbEntries && dbEntries.length > 0) {
        const mapped: JournalEntryRecord[] = dbEntries.map((e: any) => ({
          id: e.id,
          entry_no: e.entry_no,
          entry_date: e.entry_date,
          entry_date_bs: e.entry_date_bs || toBsDateString(e.entry_date),
          reference_no: e.reference_no,
          description: e.description,
          total_debit: Number(e.total_debit || 0),
          total_credit: Number(e.total_credit || 0),
          is_balanced: e.is_balanced,
          status: e.status || 'Posted',
          source: e.source || 'Manual',
          created_by: e.created_by || 'Super Admin',
          created_at: e.created_at,
          lines: (e.journal_entry_lines || []).map((l: any, idx: number) => ({
            id: l.id || idx + 1,
            accountId: l.account_id || '',
            accountCode: l.chart_of_accounts?.code || '',
            accountName: l.chart_of_accounts?.name || 'Account',
            description: l.description || '',
            debit: Number(l.debit || 0),
            credit: Number(l.credit || 0),
          })),
        }));

        setJournals(mapped);
        localStorage.setItem(LOCAL_STORAGE_JOURNAL_KEY, JSON.stringify(mapped));
      }
    } catch (e) {
      console.warn('Supabase journal fetch note:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    syncWithSupabase();
  }, [syncWithSupabase]);

  // JV Modal calculations
  const modalDebits = useMemo(() => jvLines.reduce((acc, l) => acc + (Number(l.debit) || 0), 0), [jvLines]);
  const modalCredits = useMemo(() => jvLines.reduce((acc, l) => acc + (Number(l.credit) || 0), 0), [jvLines]);
  const isJvBalanced = Math.abs(modalDebits - modalCredits) < 0.01 && modalDebits > 0;

  const handleAddJvLine = () => {
    const defaultAcc = coa[0];
    setJvLines([
      ...jvLines,
      {
        id: Date.now(),
        accountId: defaultAcc.code,
        accountCode: defaultAcc.code,
        accountName: defaultAcc.name,
        description: '',
        debit: 0,
        credit: 0,
      },
    ]);
  };

  const handleRemoveJvLine = (id: string | number) => {
    if (jvLines.length <= 2) return;
    setJvLines(jvLines.filter((l) => l.id !== id));
  };

  const handleUpdateJvLine = (id: string | number, field: keyof JournalLineItem, value: any) => {
    setJvLines(
      jvLines.map((line) => {
        if (line.id === id) {
          if (field === 'accountCode') {
            const acc = coa.find((c) => c.code === value);
            return {
              ...line,
              accountCode: value,
              accountId: value,
              accountName: acc?.name || '',
            };
          }
          return { ...line, [field]: value };
        }
        return line;
      })
    );
  };

  // Post Journal Voucher
  const handlePostJournalVoucher = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isJvBalanced) {
      alert('Total debits must equal total credits before posting. (Double-entry balancing rule)');
      return;
    }

    if (!jvDescription.trim()) {
      alert('Please enter a narration/description for this voucher.');
      return;
    }

    const nextNo = `JV-2082/83-${String(journals.length + 1).padStart(4, '0')}`;
    const adDate = bsToAdDate(jvDateBs).toISOString().slice(0, 10);

    const newRecord: JournalEntryRecord = {
      id: `jv-${Date.now()}`,
      entry_no: nextNo,
      entry_date: adDate,
      entry_date_bs: jvDateBs,
      reference_no: jvRefNo.trim() || undefined,
      description: jvDescription.trim(),
      total_debit: modalDebits,
      total_credit: modalCredits,
      is_balanced: true,
      status: 'Posted',
      source: 'Manual',
      created_by: 'Super Admin',
      created_at: new Date().toISOString(),
      lines: [...jvLines],
    };

    const updated = [newRecord, ...journals];
    setJournals(updated);
    localStorage.setItem(LOCAL_STORAGE_JOURNAL_KEY, JSON.stringify(updated));

    // Sync to Supabase
    try {
      const payload = {
        entry_no: newRecord.entry_no,
        entry_date: newRecord.entry_date,
        entry_date_bs: newRecord.entry_date_bs,
        reference_no: newRecord.reference_no,
        description: newRecord.description,
        total_debit: newRecord.total_debit,
        total_credit: newRecord.total_credit,
        is_balanced: true,
        status: 'Posted',
        source: 'Manual',
        created_by: 'Super Admin',
      };

      const { data: dbEntry } = await supabase.from('journal_entries').insert([payload]).select().single();
      if (dbEntry?.id) {
        // Look up account IDs if available
        const linePayloads = jvLines.map((l) => ({
          entry_id: dbEntry.id,
          description: l.description,
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
        }));
        await supabase.from('journal_entry_lines').insert(linePayloads);
      }
    } catch (err) {
      console.warn('Supabase post notice:', err);
    }

    setNewJvModalOpen(false);
    setJvDescription('');
    setJvRefNo('');
  };

  // General Ledger Computation
  const ledgerTransactions = useMemo(() => {
    const list: Array<{
      dateBs: string;
      dateAd: string;
      entryNo: string;
      reference?: string;
      description: string;
      debit: number;
      credit: number;
      runningBalance: number;
    }> = [];

    const selectedAcc = coa.find((c) => c.code === selectedLedgerAccount);
    const isDebitNormal = selectedAcc?.normalBalance === 'Debit';
    let balance = 0;

    // Sort journals ascending for chronological running balance
    const sortedJournals = [...journals].sort(
      (a, b) => new Date(a.entry_date).getTime() - new Date(b.entry_date).getTime()
    );

    for (const j of sortedJournals) {
      for (const line of j.lines) {
        if (line.accountCode === selectedLedgerAccount) {
          const deb = Number(line.debit) || 0;
          const cred = Number(line.credit) || 0;
          if (isDebitNormal) {
            balance += deb - cred;
          } else {
            balance += cred - deb;
          }

          list.push({
            dateBs: j.entry_date_bs,
            dateAd: j.entry_date,
            entryNo: j.entry_no,
            reference: j.reference_no,
            description: line.description || j.description,
            debit: deb,
            credit: cred,
            runningBalance: balance,
          });
        }
      }
    }

    return list;
  }, [journals, selectedLedgerAccount, coa]);

  // Trial Balance Computation
  const trialBalanceRows = useMemo(() => {
    const accountTotals: Record<string, { debit: number; credit: number }> = {};

    for (const j of journals) {
      if (j.status !== 'Posted') continue;
      for (const line of j.lines) {
        const code = line.accountCode;
        if (!accountTotals[code]) {
          accountTotals[code] = { debit: 0, credit: 0 };
        }
        accountTotals[code].debit += Number(line.debit) || 0;
        accountTotals[code].credit += Number(line.credit) || 0;
      }
    }

    let sumDebit = 0;
    let sumCredit = 0;

    const rows = coa
      .map((acc) => {
        const totals = accountTotals[acc.code] || { debit: 0, credit: 0 };
        let debitBal = 0;
        let creditBal = 0;

        if (acc.normalBalance === 'Debit') {
          const net = totals.debit - totals.credit;
          if (net >= 0) debitBal = net;
          else creditBal = Math.abs(net);
        } else {
          const net = totals.credit - totals.debit;
          if (net >= 0) creditBal = net;
          else debitBal = Math.abs(net);
        }

        sumDebit += debitBal;
        sumCredit += creditBal;

        return {
          code: acc.code,
          name: acc.name,
          type: acc.type,
          subType: acc.subType,
          normalBalance: acc.normalBalance,
          debitBalance: debitBal,
          creditBalance: creditBal,
        };
      })
      .filter((r) => r.debitBalance > 0 || r.creditBalance > 0);

    return { rows, sumDebit, sumCredit, isBalanced: Math.abs(sumDebit - sumCredit) < 0.01 };
  }, [coa, journals]);

  // Export Trial Balance CSV
  const handleExportTrialBalanceCSV = () => {
    const escapeCsv = (v: any) => `"${String(v || '').replace(/"/g, '""')}"`;
    const rows = [
      ['Account Code', 'Account Name', 'Type', 'Debit Balance (Rs)', 'Credit Balance (Rs)'],
      ...trialBalanceRows.rows.map((r) => [r.code, r.name, r.type, r.debitBalance, r.creditBalance]),
      ['TOTAL', '', '', trialBalanceRows.sumDebit, trialBalanceRows.sumCredit],
    ];
    const csv = rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aslenix_trial_balance_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredJournals = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return journals.filter((j) => {
      const matchQ =
        !q ||
        j.entry_no.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q) ||
        (j.reference_no && j.reference_no.toLowerCase().includes(q));
      const matchSrc = sourceFilter === 'All' || j.source === sourceFilter;
      return matchQ && matchSrc;
    });
  }, [journals, searchQuery, sourceFilter]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">General Ledger & Double-Entry Accounting</h1>
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-[#fff3ef] to-[#f0f4fe] text-slate-800 border border-[#ffcfdc]/70">
              <Scale size={12} className="text-rose-600" /> Balanced Ledger
            </span>
            {loading && <span className="text-xs text-slate-400 font-medium animate-pulse">Syncing...</span>}
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            Double-entry journal vouchers, comprehensive chart of accounts, and real-time trial balance.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('journals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'journals' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen size={15} />
            <span>Journal Vouchers</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ledger')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'ledger' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers size={15} />
            <span>General Ledger</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coa')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'coa' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 size={15} />
            <span>Chart of Accounts</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('trial_balance')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'trial_balance' ? 'bg-white text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Scale size={15} />
            <span>Trial Balance</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: JOURNAL VOUCHERS */}
      {/* ========================================================================= */}
      {activeTab === 'journals' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                placeholder="Search vouchers by #, narration, reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2.5">
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="All">All Sources</option>
                <option value="Manual">Manual JV</option>
                <option value="Invoice">Invoicing</option>
                <option value="Payment">Payments</option>
                <option value="Opening">Opening Balance</option>
              </select>

              <button
                type="button"
                onClick={() => setNewJvModalOpen(true)}
                className="btn-gradient flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
              >
                <Plus size={15} className="text-black" />
                <span>New Journal Voucher</span>
              </button>
            </div>
          </div>

          {/* Vouchers List */}
          <div className="space-y-4">
            {filteredJournals.length === 0 ? (
              <div className="bg-white p-12 text-center text-slate-400 rounded-2xl border border-slate-200">
                No journal vouchers found matching your filter criteria.
              </div>
            ) : (
              filteredJournals.map((jv) => (
                <div key={jv.id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                  <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200">
                        {jv.entry_no}
                      </span>
                      <span className="font-semibold text-slate-700">{jv.entry_date_bs} BS ({jv.entry_date})</span>
                      {jv.reference_no && (
                        <span className="text-slate-500 font-mono">Ref: {jv.reference_no}</span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                        {jv.source}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 font-mono font-bold">
                      <span className="text-slate-600">Total: {formatNPR(jv.total_debit)}</span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        <CheckCircle2 size={12} /> Balanced
                      </span>
                    </div>
                  </div>

                  <div className="px-5 py-3 text-xs text-slate-600 border-b border-slate-100">
                    <span className="font-bold text-slate-900">Narration: </span>
                    <span>{jv.description}</span>
                  </div>

                  {/* Lines */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="text-[11px] text-slate-400 font-semibold border-b border-slate-100 uppercase">
                          <th className="py-2 px-5 w-24">Code</th>
                          <th className="py-2 px-3">Account Title & Particulars</th>
                          <th className="py-2 px-4 text-right w-36">Debit (NPR)</th>
                          <th className="py-2 px-4 text-right w-36">Credit (NPR)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {jv.lines.map((line, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/40">
                            <td className="py-2 px-5 font-mono text-slate-500 font-bold">{line.accountCode}</td>
                            <td className="py-2 px-3">
                              <span className="font-bold text-slate-900">{line.accountName}</span>
                              {line.description && (
                                <span className="block text-[11px] text-slate-400 mt-0.5">{line.description}</span>
                              )}
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900">
                              {line.debit > 0 ? formatNPR(line.debit) : '-'}
                            </td>
                            <td className="py-2 px-4 text-right font-mono font-semibold text-slate-900">
                              {line.credit > 0 ? formatNPR(line.credit) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GENERAL LEDGER */}
      {/* ========================================================================= */}
      {activeTab === 'ledger' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600">Select Ledger Account:</span>
              <select
                value={selectedLedgerAccount}
                onChange={(e) => setSelectedLedgerAccount(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none"
              >
                {coa.map((acc) => (
                  <option key={acc.code} value={acc.code}>
                    {acc.code} - {acc.name} ({acc.type})
                  </option>
                ))}
              </select>
            </div>

            <div className="text-right">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">CURRENT ACCOUNT BALANCE</span>
              <span className="text-xl font-black font-mono text-slate-950">
                {formatNPR(ledgerTransactions[ledgerTransactions.length - 1]?.runningBalance || 0)}
              </span>
            </div>
          </div>

          {/* Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-3 px-4">Date (BS)</th>
                    <th className="py-3 px-3">Voucher #</th>
                    <th className="py-3 px-3">Reference</th>
                    <th className="py-3 px-4">Particulars / Narration</th>
                    <th className="py-3 px-3 text-right">Debit (Rs)</th>
                    <th className="py-3 px-3 text-right">Credit (Rs)</th>
                    <th className="py-3 px-4 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgerTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        No transactions recorded for this account yet.
                      </td>
                    </tr>
                  ) : (
                    ledgerTransactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-semibold text-slate-800">{tx.dateBs}</td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{tx.entryNo}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">{tx.reference || '-'}</td>
                        <td className="py-3 px-4 text-slate-700 max-w-sm">{tx.description}</td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                          {tx.debit > 0 ? formatNPR(tx.debit) : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-900">
                          {tx.credit > 0 ? formatNPR(tx.credit) : '-'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-black text-slate-950">
                          {formatNPR(tx.runningBalance)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CHART OF ACCOUNTS */}
      {/* ========================================================================= */}
      {activeTab === 'coa' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Standard Chart of Accounts (COA)</h3>
              <p className="text-xs text-slate-500">Standard 4-digit code structure tailored for software & service companies in Nepal.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-3 px-4 w-24">Code</th>
                    <th className="py-3 px-4">Account Title</th>
                    <th className="py-3 px-3">Classification</th>
                    <th className="py-3 px-3">Sub-Type</th>
                    <th className="py-3 px-3 text-center">Normal Balance</th>
                    <th className="py-3 px-4">Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {coa.map((acc) => (
                    <tr key={acc.code} className="hover:bg-slate-50/50">
                      <td className="py-3 px-4 font-mono font-bold text-slate-950">{acc.code}</td>
                      <td className="py-3 px-4 font-bold text-slate-900">{acc.name}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            acc.type === 'Asset'
                              ? 'bg-blue-50 text-blue-700'
                              : acc.type === 'Liability'
                              ? 'bg-rose-50 text-rose-700'
                              : acc.type === 'Revenue'
                              ? 'bg-emerald-50 text-emerald-700'
                              : acc.type === 'Expense'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-purple-50 text-purple-700'
                          }`}
                        >
                          {acc.type}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600">{acc.subType}</td>
                      <td className="py-3 px-3 text-center font-semibold text-slate-700">{acc.normalBalance}</td>
                      <td className="py-3 px-4 text-slate-500 max-w-sm truncate">{acc.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: TRIAL BALANCE */}
      {/* ========================================================================= */}
      {activeTab === 'trial_balance' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900">Trial Balance (प्रारम्भिक सन्तुलन परीक्षण)</h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                    trialBalanceRows.isBalanced
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-rose-50 text-rose-700 border-rose-200'
                  }`}
                >
                  {trialBalanceRows.isBalanced ? 'Balanced: Debits = Credits' : 'Discrepancy Detected'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">As of Fiscal Year 2082/83 to Date.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportTrialBalanceCSV}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
              >
                <Download size={14} className="text-slate-500" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                <Printer size={14} />
                <span>Print Report</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-3 px-4 w-28">Account Code</th>
                    <th className="py-3 px-4">Account Title</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-4 text-right w-44">Debit Balance (Rs)</th>
                    <th className="py-3 px-4 text-right w-44">Credit Balance (Rs)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono">
                  {trialBalanceRows.rows.map((row) => (
                    <tr key={row.code} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-4 font-bold text-slate-900">{row.code}</td>
                      <td className="py-2.5 px-4 font-sans font-bold text-slate-900">{row.name}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-600">{row.type}</td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                        {row.debitBalance > 0 ? formatNPR(row.debitBalance) : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                        {row.creditBalance > 0 ? formatNPR(row.creditBalance) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-900 text-white font-mono font-black text-sm">
                    <td colSpan={3} className="py-3.5 px-4 font-sans uppercase">TOTALS:</td>
                    <td className="py-3.5 px-4 text-right">{formatNPR(trialBalanceRows.sumDebit)}</td>
                    <td className="py-3.5 px-4 text-right">{formatNPR(trialBalanceRows.sumCredit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREATE NEW BALANCED JOURNAL VOUCHER */}
      {/* ========================================================================= */}
      {newJvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <BookOpen size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">New Balanced Journal Voucher</h3>
                  <p className="text-[11px] text-slate-500">Post adjustments, depreciation, payroll, or custom double-entry entries.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setNewJvModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePostJournalVoucher} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Voucher Date (BS) *
                  </label>
                  <NepaliDatePicker
                    value={jvDateBs}
                    onChange={setJvDateBs}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Reference / Bill / Cheque #
                  </label>
                  <input
                    type="text"
                    value={jvRefNo}
                    onChange={(e) => setJvRefNo(e.target.value)}
                    placeholder="e.g. BILL-9988 or CHQ-001"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Narration / Description *
                </label>
                <input
                  type="text"
                  required
                  value={jvDescription}
                  onChange={(e) => setJvDescription(e.target.value)}
                  placeholder="Being amount settled for..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                />
              </div>

              {/* Lines Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Voucher Debits & Credits</span>
                  <button
                    type="button"
                    onClick={handleAddJvLine}
                    className="flex items-center gap-1 text-xs font-bold text-accent hover:text-accent-hover"
                  >
                    <Plus size={14} /> Add Line
                  </button>
                </div>

                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-[11px] font-bold text-slate-600 border-b border-slate-200 uppercase">
                        <th className="py-2 px-3">Account Title</th>
                        <th className="py-2 px-3">Description</th>
                        <th className="py-2 px-3 w-32 text-right">Debit (NPR)</th>
                        <th className="py-2 px-3 w-32 text-right">Credit (NPR)</th>
                        <th className="py-2 px-2 w-8"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {jvLines.map((line) => (
                        <tr key={line.id}>
                          <td className="py-2 px-3">
                            <select
                              value={line.accountCode}
                              onChange={(e) => handleUpdateJvLine(line.id, 'accountCode', e.target.value)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold"
                            >
                              {coa.map((acc) => (
                                <option key={acc.code} value={acc.code}>
                                  {acc.code} - {acc.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="text"
                              value={line.description}
                              onChange={(e) => handleUpdateJvLine(line.id, 'description', e.target.value)}
                              placeholder="Line particulars"
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-600"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={line.debit}
                              onChange={(e) => handleUpdateJvLine(line.id, 'debit', Number(e.target.value))}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-right"
                            />
                          </td>
                          <td className="py-2 px-3">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={line.credit}
                              onChange={(e) => handleUpdateJvLine(line.id, 'credit', Number(e.target.value))}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold text-right"
                            />
                          </td>
                          <td className="py-2 px-2 text-center">
                            {jvLines.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveJvLine(line.id)}
                                className="text-slate-300 hover:text-rose-600"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-mono font-bold text-xs border-t border-slate-200">
                        <td colSpan={2} className="py-2 px-3 font-sans uppercase">Totals:</td>
                        <td className="py-2 px-3 text-right text-slate-900">{formatNPR(modalDebits)}</td>
                        <td className="py-2 px-3 text-right text-slate-900">{formatNPR(modalCredits)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                {/* Balancing indicator */}
                <div
                  className={`p-3 rounded-xl border text-xs flex items-center justify-between font-bold ${
                    isJvBalanced
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isJvBalanced ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                    <span>
                      {isJvBalanced
                        ? 'Voucher is Balanced (Debits = Credits)'
                        : `Voucher is Out of Balance! Discrepancy: ${formatNPR(Math.abs(modalDebits - modalCredits))}`}
                    </span>
                  </div>
                  <span className="font-mono text-[11px]">
                    Debits: {formatNPR(modalDebits)} | Credits: {formatNPR(modalCredits)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setNewJvModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!isJvBalanced}
                  className="px-5 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post Journal Voucher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Accounting;
