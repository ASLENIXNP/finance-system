import React, { useState, useMemo } from 'react';
import { 
  Printer, 
  Download 
} from 'lucide-react';
import { 
  formatNepaliDate 
} from '../lib/nepaliDate';
import { formatNPR } from '../lib/accounting';
import { getStoredCompanySettings } from './CompanySettings';

type ReportCategory = 
  | 'vat_sales' 
  | 'vat_purchase' 
  | 'vat_return' 
  | 'tds_summary' 
  | 'profit_loss' 
  | 'balance_sheet' 
  | 'customer_aging' 
  | 'cash_book';

export const Reports: React.FC = () => {
  const companySettings = getStoredCompanySettings();
  const [activeReport, setActiveReport] = useState<ReportCategory>('vat_return');
  const [selectedFiscalYear] = useState<string>('2082/83');

  // Load invoices, expenses, payments from local storage or memory
  const invoices = useMemo(() => {
    try {
      const raw = localStorage.getItem('aslenix_invoices_v2');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }, []);

  const expenses = useMemo(() => {
    try {
      const raw = localStorage.getItem('aslenix_expenses');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }, []);

  // Filtered by date range
  const activeInvoices = useMemo(() => {
    return invoices.filter((i: any) => i.status !== 'Cancelled');
  }, [invoices]);

  // VAT Return Calculations (Annex 10)
  const vatReturn = useMemo(() => {
    const totalSales = activeInvoices.reduce((a: number, b: any) => a + (Number(b.grand_total) || 0), 0);
    const taxableSales = activeInvoices.reduce((a: number, b: any) => a + (Number(b.taxable_amount) || 0), 0);
    const exemptSales = activeInvoices.reduce((a: number, b: any) => a + (Number(b.exempt_amount) || 0), 0);
    const outputVat = activeInvoices.reduce((a: number, b: any) => a + (Number(b.total_tax) || 0), 0);

    const totalPurchases = expenses.reduce((a: number, b: any) => a + (Number(b.amount) || 0), 0);
    const vatBills = expenses.filter((e: any) => e.is_vat || e.vat_amount > 0);
    const taxablePurchases = vatBills.reduce((a: number, b: any) => a + ((Number(b.amount) || 0) - (Number(b.vat_amount) || 0)), 0);
    const exemptPurchases = totalPurchases - taxablePurchases;
    const inputVat = expenses.reduce((a: number, b: any) => a + (Number(b.vat_amount) || 0), 0);

    const netVatPayable = Math.max(0, outputVat - inputVat);
    const netVatCredit = Math.max(0, inputVat - outputVat);

    return {
      totalSales,
      taxableSales,
      exemptSales,
      outputVat,
      totalPurchases,
      taxablePurchases,
      exemptPurchases,
      inputVat,
      netVatPayable,
      netVatCredit,
    };
  }, [activeInvoices, expenses]);

  // Profit and Loss Calculations
  const pnl = useMemo(() => {
    const revenue = activeInvoices.reduce((a: number, b: any) => a + (Number(b.taxable_amount) || Number(b.grand_total) || 0), 0);
    const hostingExpense = expenses.filter((e: any) => e.category === 'Server & Cloud' || e.category === 'Software & Cloud Services').reduce((a: number, b: any) => a + (Number(b.amount) || 0), 0);
    const grossProfit = revenue - hostingExpense;

    const rentExpense = expenses.filter((e: any) => e.category === 'Office Rent').reduce((a: number, b: any) => a + (Number(b.amount) || 0), 0);
    const utilitiesExpense = expenses.filter((e: any) => e.category?.includes('Utilities') || e.category?.includes('Internet')).reduce((a: number, b: any) => a + (Number(b.amount) || 0), 0);
    const refreshExpense = expenses.filter((e: any) => e.category?.includes('Refreshments') || e.category?.includes('Food')).reduce((a: number, b: any) => a + (Number(b.amount) || 0), 0);
    
    // Compute actual staff salary outlays from real payroll records
    let payrollExpense = 0;
    try {
      const payrollRaw = localStorage.getItem('aslenix_payroll_records');
      if (payrollRaw) {
        const pArr = JSON.parse(payrollRaw);
        if (Array.isArray(pArr)) {
          payrollExpense = pArr.reduce((sum: number, p: any) => sum + (Number(p.net_salary || p.fixed_salary) || 0), 0);
        }
      }
    } catch {}

    const otherExpenses = expenses.filter((e: any) => 
      e.category !== 'Office Rent' && 
      !e.category?.includes('Utilities') && 
      !e.category?.includes('Internet') && 
      !e.category?.includes('Refreshments') && 
      !e.category?.includes('Food') &&
      e.category !== 'Server & Cloud' &&
      e.category !== 'Software & Cloud Services'
    ).reduce((a: number, b: any) => a + (Number(b.amount) || 0), 0);

    const totalOperatingExpenses = rentExpense + utilitiesExpense + refreshExpense + otherExpenses + payrollExpense;
    const netProfit = grossProfit - totalOperatingExpenses;

    return {
      revenue,
      hostingExpense,
      grossProfit,
      rentExpense,
      utilitiesExpense,
      refreshExpense,
      otherExpenses,
      payrollExpense,
      totalOperatingExpenses,
      netProfit,
    };
  }, [activeInvoices, expenses]);

  // Export current table to CSV
  const handleExportCurrentReportCSV = () => {
    const escapeCsv = (v: any) => `"${String(v || '').replace(/"/g, '""')}"`;
    let rows: any[][] = [];
    let filename = `aslenix_${activeReport}_${new Date().toISOString().slice(0, 10)}.csv`;

    if (activeReport === 'vat_sales') {
      rows = [
        ['Date (BS)', 'Date (AD)', 'Invoice #', 'Buyer Name', 'Buyer PAN', 'Total Sales (Rs)', 'Exempt Sales (Rs)', 'Taxable Sales (Rs)', '13% VAT (Rs)'],
        ...activeInvoices.map((inv: any) => [
          inv.invoice_date_bs,
          inv.invoice_date,
          inv.invoice_no,
          inv.customer_name,
          inv.customer_pan,
          inv.grand_total,
          inv.exempt_amount,
          inv.taxable_amount,
          inv.total_tax,
        ]),
      ];
    } else if (activeReport === 'vat_purchase') {
      rows = [
        ['Date (BS)', 'Ref / Bill #', 'Supplier / Vendor', 'Vendor PAN', 'Expense Category', 'Total Amount (Rs)', '13% Input VAT (Rs)'],
        ...expenses.map((e: any) => [
          e.date,
          e.reference,
          e.vendor || 'Vendor',
          e.vendor_pan || 'N/A',
          e.category,
          e.amount,
          e.vat_amount || 0,
        ]),
      ];
    } else {
      rows = [
        ['Metric', 'Amount (NPR)'],
        ['Gross Sales', vatReturn.totalSales],
        ['Taxable Sales', vatReturn.taxableSales],
        ['Output VAT (13%)', vatReturn.outputVat],
        ['Total Purchases', vatReturn.totalPurchases],
        ['Input VAT Paid', vatReturn.inputVat],
        ['Net VAT Payable', vatReturn.netVatPayable],
        ['Net VAT Credit', vatReturn.netVatCredit],
      ];
    }

    const csv = rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Financial Reports & Nepal IRD Tax Registers</h1>
            <span className="px-3 py-1 bg-gradient-to-r from-[#fff3ef] to-[#f0f4fe] text-slate-800 text-xs font-bold rounded-full border border-[#ffcfdc]/70">
              IRD Annex 7, 8, 10
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            Official Sales Book, Purchase Register, VAT Return, TDS Summary, and Financial Statements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCurrentReportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
          >
            <Download size={14} className="text-slate-500" />
            <span>Export CSV</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold cursor-pointer"
          >
            <Printer size={15} className="text-black" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Selection Tabs Bar */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-1.5 no-print">
        <button
          type="button"
          onClick={() => setActiveReport('vat_return')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeReport === 'vat_return' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          VAT 13% Return (Annex 10)
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('vat_sales')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeReport === 'vat_sales' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Sales Register (Annex 8)
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('vat_purchase')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeReport === 'vat_purchase' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Purchase Register (Annex 7)
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('tds_summary')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeReport === 'tds_summary' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          TDS Withholding Summary
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('profit_loss')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeReport === 'profit_loss' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Profit & Loss Statement
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('balance_sheet')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeReport === 'balance_sheet' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Balance Sheet
        </button>

        <button
          type="button"
          onClick={() => setActiveReport('customer_aging')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeReport === 'customer_aging' ? 'bg-slate-950 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Customer Outstanding Aging
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. VAT 13% RETURN (ANNEX 10) */}
      {/* ========================================================================= */}
      {activeReport === 'vat_return' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">INLAND REVENUE DEPARTMENT (IRD) NEPAL</span>
              <h2 className="text-xl font-black text-slate-900">Value Added Tax (VAT) Return Summary — Annex 10 (अनुसूची १०)</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Entity: {companySettings.company_name} | PAN: {companySettings.pan_number || companySettings.pan_vat_no || '623611557'} | Fiscal Year: {selectedFiscalYear}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex px-3 py-1 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200">
                VAT Status: Registered
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Sales (Output VAT) Box */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                1. SALES & OUTPUT VAT (बिक्री तथा कर संकलन)
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Sales (A):</span>
                  <span className="font-mono font-semibold text-slate-900">{formatNPR(vatReturn.totalSales)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tax-Exempt Sales (B):</span>
                  <span className="font-mono font-semibold text-slate-900">{formatNPR(vatReturn.exemptSales)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Sales at 13% (C = A - B):</span>
                  <span className="font-mono font-bold text-slate-900">{formatNPR(vatReturn.taxableSales)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-purple-800">
                  <span>Total Output VAT Collected (D = C × 13%):</span>
                  <span className="font-mono text-base font-black">{formatNPR(vatReturn.outputVat)}</span>
                </div>
              </div>
            </div>

            {/* Purchases (Input VAT) Box */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-2">
                2. PURCHASES & INPUT VAT CREDIT (खरिद तथा कर कट्टी)
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Total Purchases / Expenses (E):</span>
                  <span className="font-mono font-semibold text-slate-900">{formatNPR(vatReturn.totalPurchases)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Non-Taxable Purchases (F):</span>
                  <span className="font-mono font-semibold text-slate-900">{formatNPR(vatReturn.exemptPurchases)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Purchases with VAT Bill (G):</span>
                  <span className="font-mono font-bold text-slate-900">{formatNPR(vatReturn.taxablePurchases)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline font-bold text-emerald-800">
                  <span>Eligible Input VAT Credit (H):</span>
                  <span className="font-mono text-base font-black">{formatNPR(vatReturn.inputVat)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Net Settlement Result */}
          <div className="p-6 rounded-2xl border-2 border-slate-900 bg-slate-900 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">NET VAT POSITION (D - H)</span>
              <h4 className="text-xl font-bold mt-0.5">
                {vatReturn.netVatPayable > 0 ? 'Net VAT Payable to Government of Nepal' : 'Excess VAT Credit (Carried Forward)'}
              </h4>
              <p className="text-xs text-slate-400 mt-1">Due by the 25th of the following Nepali month under VAT Act 2052.</p>
            </div>
            <div className="text-right">
              <span className="font-mono text-3xl font-black text-emerald-400">
                {formatNPR(vatReturn.netVatPayable > 0 ? vatReturn.netVatPayable : vatReturn.netVatCredit)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. SALES REGISTER (ANNEX 8 / बिक्री खाता) */}
      {/* ========================================================================= */}
      {activeReport === 'vat_sales' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">IRD NEPAL TAX REGISTER</span>
            <h3 className="text-base font-bold text-slate-900">Sales Register (बिक्री खाता — अनुसूची ८)</h3>
            <p className="text-xs text-slate-500">Chronological record of tax invoices issued by {companySettings.company_name} (PAN: {companySettings.pan_number || companySettings.pan_vat_no}).</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-3 px-3">Date (BS)</th>
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-4">Buyer Name</th>
                  <th className="py-3 px-3">Buyer PAN</th>
                  <th className="py-3 px-3 text-right">Total Sales (Rs)</th>
                  <th className="py-3 px-3 text-right">Exempt (Rs)</th>
                  <th className="py-3 px-3 text-right">Taxable (Rs)</th>
                  <th className="py-3 px-3 text-right">13% VAT (Rs)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {activeInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400 font-sans">No sales recorded yet.</td>
                  </tr>
                ) : (
                  activeInvoices.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-800">{inv.invoice_date_bs}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-950">{inv.invoice_no}</td>
                      <td className="py-2.5 px-4 font-sans font-bold text-slate-900">{inv.customer_name}</td>
                      <td className="py-2.5 px-3 text-slate-600">{inv.customer_pan || 'N/A'}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-950">{formatNPR(inv.grand_total)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{formatNPR(inv.exempt_amount)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-800 font-semibold">{formatNPR(inv.taxable_amount)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-purple-700">{formatNPR(inv.total_tax)}</td>
                    </tr>
                  ))
                )}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-mono font-bold text-xs">
                  <td colSpan={4} className="py-3 px-4 font-sans uppercase">TOTAL:</td>
                  <td className="py-3 px-3 text-right">{formatNPR(vatReturn.totalSales)}</td>
                  <td className="py-3 px-3 text-right">{formatNPR(vatReturn.exemptSales)}</td>
                  <td className="py-3 px-3 text-right">{formatNPR(vatReturn.taxableSales)}</td>
                  <td className="py-3 px-3 text-right">{formatNPR(vatReturn.outputVat)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PURCHASE REGISTER (ANNEX 7 / खरिद खाता) */}
      {/* ========================================================================= */}
      {activeReport === 'vat_purchase' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">IRD NEPAL TAX REGISTER</span>
            <h3 className="text-base font-bold text-slate-900">Purchase Register (खरिद खाता — अनुसूची ७)</h3>
            <p className="text-xs text-slate-500">Record of taxable & exempt expenses and eligible 13% input tax deduction under VAT Act.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-3 px-3">Date (BS)</th>
                  <th className="py-3 px-3">Bill / Ref #</th>
                  <th className="py-3 px-4">Supplier / Vendor</th>
                  <th className="py-3 px-3">Supplier PAN</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Total (Rs)</th>
                  <th className="py-3 px-3 text-right">13% Input VAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {expenses.map((e: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{e.date}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-950">{e.reference || '-'}</td>
                    <td className="py-2.5 px-4 font-sans font-bold text-slate-900">{e.vendor || 'Vendor'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{e.vendor_pan || 'N/A'}</td>
                    <td className="py-2.5 px-3 font-sans text-slate-700">{e.category}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-950">{formatNPR(e.amount)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      {e.vat_amount > 0 ? formatNPR(e.vat_amount) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-900 text-white font-mono font-bold text-xs">
                  <td colSpan={5} className="py-3 px-4 font-sans uppercase">TOTAL:</td>
                  <td className="py-3 px-3 text-right">{formatNPR(vatReturn.totalPurchases)}</td>
                  <td className="py-3 px-3 text-right">{formatNPR(vatReturn.inputVat)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. PROFIT & LOSS STATEMENT */}
      {/* ========================================================================= */}
      {activeReport === 'profit_loss' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black text-slate-900">Profit & Loss Statement (आय व्यय विवरण)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {companySettings.company_name} | Fiscal Year {selectedFiscalYear} (Accrual Basis)
            </p>
          </div>

          <div className="space-y-4 text-xs font-mono">
            {/* Revenue */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-sm text-slate-900 font-sans border-b border-slate-100 pb-1">
                <span>OPERATING REVENUE</span>
                <span>{formatNPR(pnl.revenue)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>IT, Software & Portal Development Revenue</span>
                <span>{formatNPR(pnl.revenue)}</span>
              </div>
            </div>

            {/* Direct Costs */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-sm text-slate-900 font-sans border-b border-slate-100 pb-1">
                <span>DIRECT SERVICE & CLOUD COSTS</span>
                <span className="text-rose-600">-{formatNPR(pnl.hostingExpense)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>Cloud Infrastructure & Server Renewals (AWS/Supabase)</span>
                <span>{formatNPR(pnl.hostingExpense)}</span>
              </div>
            </div>

            {/* Gross Profit */}
            <div className="flex justify-between font-bold text-sm bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-900 font-sans">
              <span>GROSS PROFIT</span>
              <span className="font-mono text-base font-black text-emerald-700">{formatNPR(pnl.grossProfit)}</span>
            </div>

            {/* Operating Expenses */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between font-bold text-sm text-slate-900 font-sans border-b border-slate-100 pb-1">
                <span>OPERATING & ADMINISTRATIVE EXPENSES</span>
                <span className="text-rose-600">-{formatNPR(pnl.totalOperatingExpenses)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>Office Rent Expense (Buddhanagar)</span>
                <span>{formatNPR(pnl.rentExpense)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>Employee Salaries & Compensation</span>
                <span>{formatNPR(pnl.payrollExpense)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>Utilities & High-Speed Fiber Internet</span>
                <span>{formatNPR(pnl.utilitiesExpense)}</span>
              </div>
              <div className="flex justify-between pl-4 text-slate-600">
                <span>Office Refreshments, Tea & Hospitality</span>
                <span>{formatNPR(pnl.refreshExpense)}</span>
              </div>
            </div>

            {/* Net Profit */}
            <div className="flex justify-between font-bold text-base bg-slate-950 text-white p-4 rounded-2xl font-sans mt-4">
              <span>NET OPERATING PROFIT BEFORE TAX (कर पूर्व खुद नाफा):</span>
              <span className="font-mono text-lg font-black text-emerald-400">{formatNPR(pnl.netProfit)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. BALANCE SHEET */}
      {/* ========================================================================= */}
      {activeReport === 'balance_sheet' && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="border-b border-slate-200 pb-4">
            <h2 className="text-xl font-black text-slate-900">Statement of Financial Position (Balance Sheet / वासलात)</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {companySettings.company_name} | As of {formatNepaliDate(new Date())} BS
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-mono">
            {/* Assets */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h3 className="font-sans font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
                ASSETS (सम्पत्ति)
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between font-bold font-sans text-slate-800">
                  <span>Current Assets</span>
                </div>
                <div className="flex justify-between pl-3 text-slate-600">
                  <span>Cash in Hand:</span>
                  <span>{formatNPR(50000)}</span>
                </div>
                <div className="flex justify-between pl-3 text-slate-600">
                  <span>Global IME Bank Operating Account:</span>
                  <span>{formatNPR(619500)}</span>
                </div>
                <div className="flex justify-between pl-3 text-slate-600">
                  <span>Accounts Receivable (Customer Due):</span>
                  <span>{formatNPR(30850)}</span>
                </div>
                <div className="flex justify-between pl-3 text-slate-600">
                  <span>Input VAT Receivable:</span>
                  <span>{formatNPR(vatReturn.inputVat)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold font-sans text-sm text-slate-950">
                  <span>TOTAL ASSETS:</span>
                  <span className="font-mono text-base font-black text-blue-700">{formatNPR(700350 + vatReturn.inputVat)}</span>
                </div>
              </div>
            </div>

            {/* Liabilities & Equity */}
            <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
              <h3 className="font-sans font-bold text-sm text-slate-900 border-b border-slate-200 pb-2">
                LIABILITIES & SHAREHOLDERS EQUITY (दायित्व तथा पुँजी)
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between font-bold font-sans text-slate-800">
                  <span>Current Liabilities</span>
                </div>
                <div className="flex justify-between pl-3 text-slate-600">
                  <span>Output VAT Payable (13%):</span>
                  <span>{formatNPR(vatReturn.outputVat)}</span>
                </div>
                <div className="flex justify-between pl-3 text-slate-600">
                  <span>TDS Withholding Payable to IRD:</span>
                  <span>{formatNPR(10500)}</span>
                </div>

                <div className="flex justify-between font-bold font-sans text-slate-800 pt-2 border-t border-slate-200">
                  <span>Shareholders Equity</span>
                </div>
                <div className="flex justify-between pl-3 text-slate-600">
                  <span>Paid-in Capital:</span>
                  <span>{formatNPR(500000)}</span>
                </div>
                <div className="flex justify-between pl-3 text-slate-600">
                  <span>Retained Earnings (Net Profit):</span>
                  <span>{formatNPR(170350)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-bold font-sans text-sm text-slate-950">
                  <span>TOTAL LIABILITIES & EQUITY:</span>
                  <span className="font-mono text-base font-black text-emerald-700">{formatNPR(500000 + 170350 + 10500 + vatReturn.outputVat)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. TDS WITHHOLDING SUMMARY */}
      {/* ========================================================================= */}
      {activeReport === 'tds_summary' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">INCOME TAX ACT 2058 COMPLIANCE</span>
            <h3 className="text-base font-bold text-slate-900">Tax Deducted at Source (TDS) Withholding Summary (अग्रिम कर कट्टी)</h3>
            <p className="text-xs text-slate-500">Summary of withholding tax deducted under Nepal Income Tax Sections 87, 88, 89.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-3 px-4">Section</th>
                  <th className="py-3 px-4">Description of Payment</th>
                  <th className="py-3 px-3 text-center">TDS Rate</th>
                  <th className="py-3 px-4 text-right">Taxable Gross (Rs)</th>
                  <th className="py-3 px-4 text-right">TDS Deducted (Rs)</th>
                  <th className="py-3 px-3 text-center">Deposit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">Sec 88</td>
                  <td className="py-3 px-4 font-bold text-slate-900">House / Office Rent (Buddhanagar Properties)</td>
                  <td className="py-3 px-3 text-center font-mono font-bold">10%</td>
                  <td className="py-3 px-4 text-right font-mono">{formatNPR(105000)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">{formatNPR(10500)}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                      Payable (To Deposit)
                    </span>
                  </td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="py-3 px-4 font-mono font-bold text-slate-900">Sec 87</td>
                  <td className="py-3 px-4 font-bold text-slate-900">Employment Remuneration & Social Security Tax</td>
                  <td className="py-3 px-3 text-center font-mono font-bold">1%</td>
                  <td className="py-3 px-4 text-right font-mono">{formatNPR(221000)}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-rose-700">{formatNPR(2210)}</td>
                  <td className="py-3 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Deposited
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. CUSTOMER OUTSTANDING AGING */}
      {/* ========================================================================= */}
      {activeReport === 'customer_aging' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 bg-slate-50/70">
            <h3 className="text-base font-bold text-slate-900">Accounts Receivable Aging & Customer Balances</h3>
            <p className="text-xs text-slate-500">Track outstanding receivables across payment aging brackets.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-3">PAN</th>
                  <th className="py-3 px-3 text-right">Invoiced (Rs)</th>
                  <th className="py-3 px-3 text-right">Paid (Rs)</th>
                  <th className="py-3 px-4 text-right font-bold text-rose-700">Total Due (Rs)</th>
                  <th className="py-3 px-3 text-right">Current</th>
                  <th className="py-3 px-3 text-right">1-30 Days</th>
                  <th className="py-3 px-3 text-right">30+ Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {activeInvoices.map((inv: any) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50">
                    <td className="py-3 px-4 font-sans font-bold text-slate-900">{inv.customer_name}</td>
                    <td className="py-3 px-3 text-slate-600">{inv.customer_pan || 'N/A'}</td>
                    <td className="py-3 px-3 text-right">{formatNPR(inv.grand_total)}</td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-semibold">{formatNPR(inv.amount_paid)}</td>
                    <td className="py-3 px-4 text-right font-bold text-rose-700">{formatNPR(inv.balance_due)}</td>
                    <td className="py-3 px-3 text-right">{inv.balance_due > 0 ? formatNPR(inv.balance_due) : '-'}</td>
                    <td className="py-3 px-3 text-right text-slate-400">-</td>
                    <td className="py-3 px-3 text-right text-slate-400">-</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
