import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Plus, 
  Trash2, 
  Printer, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  RefreshCw,
  Search,
  CheckCircle,
  Ban,
  CreditCard,
  Download,
  FileText,
  Eye,
  RotateCcw,
  X
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { NepaliDatePicker } from '../components/NepaliDatePicker';
import { 
  bsToAdDate, 
  toBsDateString, 
  getTodayBsDate, 
  formatNepaliDate
} from '../lib/nepaliDate';
import { getStoredCompanySettings, type CompanySettingsData } from './CompanySettings';
import { 
  formatNPR, 
  numberToWordsNPR, 
  isValidNepalPAN, 
  calculateTaxBreakdown, 
  type TaxClassification 
} from '../lib/accounting';

interface Customer {
  id: string;
  customer_id: string;
  name: string;
  company_name: string;
  pan_number: string;
  phone: string;
  email: string;
  address?: string;
  type: string;
  is_active: boolean;
}

export interface InvoiceItemRow {
  id: number | string;
  product_id?: string;
  name: string;
  desc: string;
  qty: number;
  unit: string;
  rate: number;
  discount: number;
  taxClassification: TaxClassification;
  tax: number;
}

export interface StoredInvoice {
  id: string;
  invoice_no: string;
  customer_id?: string;
  customer_name: string;
  customer_pan: string;
  customer_address: string;
  customer_phone?: string;
  customer_email?: string;
  invoice_date: string; // YYYY-MM-DD
  invoice_date_bs: string; // YYYY-MM-DD in BS
  due_date: string;
  fiscal_year: string;
  subtotal: number;
  total_discount: number;
  taxable_amount: number;
  exempt_amount: number;
  total_tax: number;
  grand_total: number;
  amount_paid: number;
  balance_due: number;
  status: 'Paid' | 'Partially Paid' | 'Unpaid' | 'Overdue' | 'Cancelled';
  is_vat_invoice: boolean;
  notes?: string;
  cancellation_reason?: string;
  items: InvoiceItemRow[];
  created_at?: string;
}

interface CreditNoteItem {
  id: string;
  credit_note_no: string;
  invoice_no: string;
  customer_name: string;
  date_bs: string;
  taxable_amount: number;
  tax_amount: number;
  total_amount: number;
  reason: string;
  created_at: string;
}

const LOCAL_STORAGE_INVOICES_KEY = 'aslenix_invoices_v2';
const LOCAL_STORAGE_CREDIT_NOTES_KEY = 'aslenix_credit_notes_v2';

const getStoredInvoices = (): StoredInvoice[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_INVOICES_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr;
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored invoices:', e);
  }

  // Initial invoices for demonstration & offline fallback
  return [
    {
      id: 'inv-seed-001',
      invoice_no: 'ASL-2082/83-0012',
      customer_id: 'cust-101',
      customer_name: 'Tech Innovations Pvt. Ltd.',
      customer_pan: '609123456',
      customer_address: 'Putalisadak, Kathmandu, Nepal',
      customer_phone: '+977 1-4412345',
      customer_email: 'accounts@techinnovations.com.np',
      invoice_date: '2026-10-01',
      invoice_date_bs: '2083-06-15',
      due_date: '2083-06-30',
      fiscal_year: '2082/83',
      subtotal: 150000,
      total_discount: 0,
      taxable_amount: 150000,
      exempt_amount: 0,
      total_tax: 19500,
      grand_total: 169500,
      amount_paid: 169500,
      balance_due: 0,
      status: 'Paid',
      is_vat_invoice: true,
      notes: 'Website Development & Corporate CMS deployment',
      items: [
        {
          id: 1,
          name: 'Website Development & Corporate Branding',
          desc: 'Corporate dynamic portal design, CMS integration & cloud deployment',
          qty: 1,
          unit: 'Project',
          rate: 150000,
          discount: 0,
          taxClassification: 'Taxable',
          tax: 13,
        },
      ],
      created_at: new Date().toISOString(),
    },
    {
      id: 'inv-seed-002',
      invoice_no: 'ASL-2082/83-0014',
      customer_id: 'cust-102',
      customer_name: 'Himalayan Coffee House',
      customer_pan: '608987654',
      customer_address: 'Thamel, Kathmandu, Nepal',
      customer_phone: '+977 1-4423456',
      customer_email: 'info@himalayancoffee.np',
      invoice_date: '2026-10-05',
      invoice_date_bs: '2083-06-19',
      due_date: '2083-07-04',
      fiscal_year: '2082/83',
      subtotal: 45000,
      total_discount: 0,
      taxable_amount: 45000,
      exempt_amount: 0,
      total_tax: 5850,
      grand_total: 50850,
      amount_paid: 20000,
      balance_due: 30850,
      status: 'Partially Paid',
      is_vat_invoice: true,
      notes: 'Social Media Management & Digital Assets',
      items: [
        {
          id: 1,
          name: 'Monthly Social Media Retainer & Campaign Design',
          desc: 'Content creation, ad graphics, and audience growth management',
          qty: 1,
          unit: 'Month',
          rate: 45000,
          discount: 0,
          taxClassification: 'Taxable',
          tax: 13,
        },
      ],
      created_at: new Date().toISOString(),
    },
  ];
};

const getStoredCreditNotes = (): CreditNoteItem[] => {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CREDIT_NOTES_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) return arr;
    }
  } catch (e) {
    console.warn('Failed to parse credit notes:', e);
  }
  return [];
};

const generateNextInvoiceNumber = (prefix = 'ASL-', fiscalYear = '2082/83', count = 1): string => {
  const seq = String(count).padStart(4, '0');
  return `${prefix}${fiscalYear}-${seq}`;
};

export const InvoiceCreate: React.FC = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const customerIdFromUrl = searchParams.get('customerId');

  // Navigation tab
  const [activeTab, setActiveTab] = useState<'list' | 'create' | 'preview' | 'credit_notes'>('list');

  // Stored state
  const [companySettings, setCompanySettings] = useState<CompanySettingsData>(getStoredCompanySettings);
  const [invoices, setInvoices] = useState<StoredInvoice[]>(getStoredInvoices);
  const [creditNotes, setCreditNotes] = useState<CreditNoteItem[]>(getStoredCreditNotes);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [fiscalYearFilter, setFiscalYearFilter] = useState('All');

  // Currently selected / viewing invoice for print or payment
  const [previewInvoice, setPreviewInvoice] = useState<StoredInvoice | null>(() => invoices[0] || null);

  // Modal states
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<StoredInvoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Bank Transfer');
  const [paymentRef, setPaymentRef] = useState('');
  const [paymentDateBs, setPaymentDateBs] = useState(getTodayBsDate());

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [invoiceToCancel, setInvoiceToCancel] = useState<StoredInvoice | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  // ==========================================
  // Form State for NEW INVOICE
  // ==========================================
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerIdFromUrl || '');
  const [invoiceNumber, setInvoiceNumber] = useState(() => 
    generateNextInvoiceNumber(companySettings.invoice_prefix || 'ASL-', companySettings.fiscal_year || '2082/83', invoices.length + 1)
  );
  const [registrationNo, setRegistrationNo] = useState(() => companySettings.registration_no || '391840/82/83');
  const [panNo, setPanNo] = useState(() => companySettings.pan_number || companySettings.pan_vat_no || '623611557');
  const [invoiceDate, setInvoiceDate] = useState(getTodayBsDate());
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return toBsDateString(d);
  });
  const [isVatInvoice, setIsVatInvoice] = useState(true);
  const [overallDiscount, setOverallDiscount] = useState(0);

  const [customerInfo, setCustomerInfo] = useState({
    name: 'Tech Innovations Pvt. Ltd.',
    address: 'Putalisadak, Kathmandu, Nepal',
    pan: '609123456',
    phone: '+977 1-4412345',
    email: 'accounts@techinnovations.com.np',
    customerRef: 'CUST-1001',
  });

  const [items, setItems] = useState<InvoiceItemRow[]>([
    {
      id: 1,
      name: 'Custom Web Application & ERP Integration',
      desc: 'Modern web architecture, PostgreSQL database schema, security & deployment',
      qty: 1,
      unit: 'Project',
      rate: 150000,
      discount: 0,
      taxClassification: 'Taxable',
      tax: 13,
    },
  ]);

  // Sync settings
  useEffect(() => {
    const handleSettingsUpdate = () => {
      const updated = getStoredCompanySettings();
      setCompanySettings(updated);
      if (updated.registration_no) setRegistrationNo(updated.registration_no);
      if (updated.pan_number || updated.pan_vat_no) setPanNo(updated.pan_number || updated.pan_vat_no);
    };
    window.addEventListener('company_settings_updated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);
    return () => {
      window.removeEventListener('company_settings_updated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  // Fetch customers from Supabase
  const loadCustomers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .order('name', { ascending: true });

      if (!error && data && data.length > 0) {
        setCustomers(data);
      }
    } catch (e) {
      console.warn('Customer fetch note:', e);
    }
  }, []);

  // Fetch invoices from Supabase
  const loadInvoicesFromSupabase = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          customers (
            name,
            company_name,
            pan_number,
            address,
            phone,
            email,
            customer_id
          ),
          invoice_items (*)
        `)
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const mapped: StoredInvoice[] = data.map((inv: any) => ({
          id: inv.id,
          invoice_no: inv.invoice_no,
          customer_id: inv.customer_id,
          customer_name: inv.customers?.company_name || inv.customers?.name || 'Customer',
          customer_pan: inv.customers?.pan_number || 'N/A',
          customer_address: inv.customers?.address || 'Kathmandu, Nepal',
          customer_phone: inv.customers?.phone || '',
          customer_email: inv.customers?.email || '',
          invoice_date: inv.invoice_date,
          invoice_date_bs: inv.invoice_date_bs || toBsDateString(inv.invoice_date),
          due_date: inv.due_date,
          fiscal_year: inv.fiscal_year || '2082/83',
          subtotal: Number(inv.subtotal || 0),
          total_discount: Number(inv.total_discount || 0),
          taxable_amount: Number(inv.taxable_amount || 0),
          exempt_amount: Number(inv.exempt_amount || 0),
          total_tax: Number(inv.total_tax || 0),
          grand_total: Number(inv.grand_total || 0),
          amount_paid: Number(inv.amount_paid || 0),
          balance_due: Number(inv.grand_total || 0) - Number(inv.amount_paid || 0),
          status: inv.status || 'Unpaid',
          is_vat_invoice: inv.is_vat_invoice !== false,
          notes: inv.notes || '',
          cancellation_reason: inv.cancellation_reason || '',
          items: (inv.invoice_items || []).map((item: any, idx: number) => ({
            id: item.id || idx + 1,
            name: item.item_name || 'Item',
            desc: item.description || '',
            qty: Number(item.quantity || 1),
            unit: item.unit || 'Pcs',
            rate: Number(item.rate || 0),
            discount: Number(item.discount || 0),
            taxClassification: item.tax_classification || 'Taxable',
            tax: Number(item.tax_rate || 13),
          })),
          created_at: inv.created_at,
        }));

        setInvoices(mapped);
        localStorage.setItem(LOCAL_STORAGE_INVOICES_KEY, JSON.stringify(mapped));
        if (mapped.length > 0) {
          setPreviewInvoice(mapped[0]);
        }
      }
    } catch (err) {
      console.warn('Using local invoice store:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCustomers();
    loadInvoicesFromSupabase();
  }, [loadCustomers, loadInvoicesFromSupabase]);

  // When selected customer changes in creation form
  useEffect(() => {
    if (!selectedCustomerId) return;
    const active = customers.find((c) => c.id === selectedCustomerId);
    if (!active) return;

    setCustomerInfo({
      name: active.company_name || active.name || 'Customer Name',
      address: active.address || (active.company_name ? `${active.company_name}, Kathmandu, Nepal` : 'Kathmandu, Nepal'),
      pan: active.pan_number || 'N/A',
      phone: active.phone || 'N/A',
      email: active.email || 'N/A',
      customerRef: active.customer_id || 'CUST-1001',
    });
  }, [customers, selectedCustomerId]);

  // Calculations for Creation Form
  const taxLines = useMemo(() => {
    return items.map((it) => ({
      quantity: Number(it.qty) || 0,
      rate: Number(it.rate) || 0,
      discount: Number(it.discount) || 0,
      taxClassification: it.taxClassification,
      customVatRate: it.tax,
    }));
  }, [items]);

  const taxBreakdown = useMemo(() => {
    return calculateTaxBreakdown(taxLines, isVatInvoice, Number(overallDiscount) || 0);
  }, [taxLines, isVatInvoice, overallDiscount]);

  // Items manipulation
  const addItem = () => {
    setItems([
      ...items,
      {
        id: Date.now(),
        name: '',
        desc: '',
        qty: 1,
        unit: 'Pcs',
        rate: 0,
        discount: 0,
        taxClassification: 'Taxable',
        tax: 13,
      },
    ]);
  };

  const removeItem = (id: number | string) => {
    if (items.length <= 1) return;
    setItems(items.filter((item) => item.id !== id));
  };

  const updateItem = (id: number | string, field: keyof InvoiceItemRow, value: any) => {
    setItems(
      items.map((item) => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // ==========================================
  // SAVE INVOICE (Supabase + Local fallback)
  // ==========================================
  const handleSaveInvoice = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!customerInfo.name.trim()) {
      alert('Please enter or select a customer name.');
      return;
    }

    if (items.some((it) => !it.name.trim() || it.rate < 0 || it.qty <= 0)) {
      alert('Please ensure all items have a valid name, positive quantity, and rate.');
      return;
    }

    const adInvoiceDate = bsToAdDate(invoiceDate).toISOString().slice(0, 10);
    const adDueDate = bsToAdDate(dueDate).toISOString().slice(0, 10);

    const newInvoice: StoredInvoice = {
      id: `inv-${Date.now()}`,
      invoice_no: invoiceNumber.trim(),
      customer_id: selectedCustomerId || undefined,
      customer_name: customerInfo.name,
      customer_pan: customerInfo.pan,
      customer_address: customerInfo.address,
      customer_phone: customerInfo.phone,
      customer_email: customerInfo.email,
      invoice_date: adInvoiceDate,
      invoice_date_bs: invoiceDate,
      due_date: adDueDate,
      fiscal_year: companySettings.fiscal_year || '2082/83',
      subtotal: taxBreakdown.grossSubtotal,
      total_discount: taxBreakdown.totalDiscount,
      taxable_amount: taxBreakdown.taxableAmount,
      exempt_amount: taxBreakdown.exemptAmount,
      total_tax: taxBreakdown.vatAmount,
      grand_total: taxBreakdown.grandTotal,
      amount_paid: 0,
      balance_due: taxBreakdown.grandTotal,
      status: 'Unpaid',
      is_vat_invoice: isVatInvoice,
      items: items.map((it) => ({ ...it })),
      created_at: new Date().toISOString(),
    };

    // 1. Save locally first
    const updatedInvoices = [newInvoice, ...invoices];
    setInvoices(updatedInvoices);
    localStorage.setItem(LOCAL_STORAGE_INVOICES_KEY, JSON.stringify(updatedInvoices));
    setPreviewInvoice(newInvoice);

    // 2. Sync to Supabase
    try {
      const invoicePayload = {
        invoice_no: newInvoice.invoice_no,
        customer_id: selectedCustomerId || null,
        invoice_date: adInvoiceDate,
        invoice_date_bs: invoiceDate,
        due_date: adDueDate,
        fiscal_year: newInvoice.fiscal_year,
        subtotal: newInvoice.subtotal,
        total_discount: newInvoice.total_discount,
        taxable_amount: newInvoice.taxable_amount,
        exempt_amount: newInvoice.exempt_amount,
        total_tax: newInvoice.total_tax,
        grand_total: newInvoice.grand_total,
        amount_paid: 0,
        balance_due: newInvoice.grand_total,
        status: 'Unpaid',
        is_vat_invoice: isVatInvoice,
      };

      const { data: dbInv, error: invError } = await supabase
        .from('invoices')
        .insert([invoicePayload])
        .select()
        .single();

      if (!invError && dbInv?.id) {
        const itemRows = items.map((it) => ({
          invoice_id: dbInv.id,
          item_name: it.name,
          description: it.desc,
          quantity: it.qty,
          unit: it.unit,
          rate: it.rate,
          discount: it.discount,
          tax_classification: it.taxClassification,
          tax_rate: it.tax,
          amount: it.qty * it.rate - it.discount,
        }));

        await supabase.from('invoice_items').insert(itemRows);

        // Audit Log
        await supabase.from('audit_logs').insert([{
          table_name: 'invoices',
          record_id: dbInv.id,
          action: 'INSERT',
          performed_by: 'Super Admin',
          details: { invoice_no: newInvoice.invoice_no, grand_total: newInvoice.grand_total },
        }]);

        // Auto-create balanced Journal Voucher for double-entry ledger
        const jvPayload = {
          entry_no: `JV-INV-${newInvoice.invoice_no}`,
          entry_date: adInvoiceDate,
          entry_date_bs: invoiceDate,
          reference_no: newInvoice.invoice_no,
          description: `Sales Revenue recognized for Invoice ${newInvoice.invoice_no} (${customerInfo.name})`,
          total_debit: newInvoice.grand_total,
          total_credit: newInvoice.grand_total,
          is_balanced: true,
          status: 'Posted',
          source: 'Invoice',
          created_by: 'Super Admin',
        };

        await supabase.from('journal_entries').insert([jvPayload]);
      }
    } catch (dbErr) {
      console.warn('Supabase sync notice:', dbErr);
    }

    // Switch to preview tab
    setActiveTab('preview');
  };

  // ==========================================
  // RECORD PAYMENT
  // ==========================================
  const handleOpenPaymentModal = (invoice: StoredInvoice) => {
    setSelectedInvoiceForPayment(invoice);
    setPaymentAmount(invoice.balance_due > 0 ? invoice.balance_due : invoice.grand_total);
    setPaymentRef(`PAY-${Date.now().toString().slice(-6)}`);
    setPaymentDateBs(getTodayBsDate());
    setPaymentModalOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedInvoiceForPayment) return;
    const payAmt = Number(paymentAmount) || 0;
    if (payAmt <= 0) {
      alert('Please enter a valid payment amount greater than zero.');
      return;
    }

    const newAmountPaid = (selectedInvoiceForPayment.amount_paid || 0) + payAmt;
    const newBalanceDue = Math.max(0, selectedInvoiceForPayment.grand_total - newAmountPaid);
    const newStatus: StoredInvoice['status'] = newBalanceDue <= 0 ? 'Paid' : 'Partially Paid';

    // Update in local state
    const updated = invoices.map((inv) => {
      if (inv.id === selectedInvoiceForPayment.id) {
        return {
          ...inv,
          amount_paid: newAmountPaid,
          balance_due: newBalanceDue,
          status: newStatus,
        };
      }
      return inv;
    });

    setInvoices(updated);
    localStorage.setItem(LOCAL_STORAGE_INVOICES_KEY, JSON.stringify(updated));

    // Sync to Supabase
    try {
      await supabase
        .from('invoices')
        .update({
          amount_paid: newAmountPaid,
          balance_due: newBalanceDue,
          status: newStatus,
        })
        .eq('invoice_no', selectedInvoiceForPayment.invoice_no);

      // Insert payment record
      await supabase.from('payments').insert([{
        payment_ref: paymentRef,
        customer_id: selectedInvoiceForPayment.customer_id || null,
        amount: payAmt,
        payment_date: bsToAdDate(paymentDateBs).toISOString().slice(0, 10),
        method: paymentMethod,
        category: 'Invoice Payment',
        notes: `Payment for Invoice ${selectedInvoiceForPayment.invoice_no}`,
      }]);
    } catch (e) {
      console.warn('Payment sync notice:', e);
    }

    setPaymentModalOpen(false);
    setSelectedInvoiceForPayment(null);
  };

  // ==========================================
  // CANCEL INVOICE & CREDIT NOTE
  // ==========================================
  const handleOpenCancelModal = (invoice: StoredInvoice) => {
    setInvoiceToCancel(invoice);
    setCancellationReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancelInvoice = async () => {
    if (!invoiceToCancel) return;
    if (!cancellationReason.trim()) {
      alert('Under Nepal IRD compliance rules, an official cancellation reason is required to issue a Credit Note.');
      return;
    }

    const creditNoteNo = `CN-${invoiceToCancel.invoice_no}`;
    const newCreditNote: CreditNoteItem = {
      id: `cn-${Date.now()}`,
      credit_note_no: creditNoteNo,
      invoice_no: invoiceToCancel.invoice_no,
      customer_name: invoiceToCancel.customer_name,
      date_bs: getTodayBsDate(),
      taxable_amount: invoiceToCancel.taxable_amount,
      tax_amount: invoiceToCancel.total_tax,
      total_amount: invoiceToCancel.grand_total,
      reason: cancellationReason.trim(),
      created_at: new Date().toISOString(),
    };

    // Update locally
    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === invoiceToCancel.id) {
        return {
          ...inv,
          status: 'Cancelled' as const,
          cancellation_reason: cancellationReason.trim(),
        };
      }
      return inv;
    });

    const updatedCreditNotes = [newCreditNote, ...creditNotes];
    setInvoices(updatedInvoices);
    setCreditNotes(updatedCreditNotes);
    localStorage.setItem(LOCAL_STORAGE_INVOICES_KEY, JSON.stringify(updatedInvoices));
    localStorage.setItem(LOCAL_STORAGE_CREDIT_NOTES_KEY, JSON.stringify(updatedCreditNotes));

    // Sync to Supabase
    try {
      await supabase
        .from('invoices')
        .update({
          status: 'Cancelled',
          cancellation_reason: cancellationReason.trim(),
        })
        .eq('invoice_no', invoiceToCancel.invoice_no);

      await supabase.from('credit_notes').insert([{
        credit_note_no: creditNoteNo,
        customer_id: invoiceToCancel.customer_id || null,
        date: new Date().toISOString().slice(0, 10),
        date_bs: getTodayBsDate(),
        reason: cancellationReason.trim(),
        taxable_amount: invoiceToCancel.taxable_amount,
        tax_amount: invoiceToCancel.total_tax,
        total_amount: invoiceToCancel.grand_total,
        status: 'Issued',
      }]);

      await supabase.from('audit_logs').insert([{
        table_name: 'invoices',
        record_id: invoiceToCancel.id,
        action: 'CANCEL',
        performed_by: 'Super Admin',
        details: { invoice_no: invoiceToCancel.invoice_no, reason: cancellationReason.trim() },
      }]);
    } catch (e) {
      console.warn('Cancel sync notice:', e);
    }

    setCancelModalOpen(false);
    setInvoiceToCancel(null);
  };

  // Export Sales Register CSV (IRD Annex 8 compliant)
  const handleExportSalesRegisterCSV = () => {
    if (invoices.length === 0) return;
    const escapeCsv = (v: any) => `"${String(v || '').replace(/"/g, '""')}"`;
    const rows = [
      ['Date (BS)', 'Date (AD)', 'Invoice No', 'Buyer Name', 'Buyer PAN', 'Total Sales (Rs)', 'Exempt Sales (Rs)', 'Taxable Sales (Rs)', '13% VAT (Rs)', 'Status'],
      ...invoices.map((inv) => [
        inv.invoice_date_bs,
        inv.invoice_date,
        inv.invoice_no,
        inv.customer_name,
        inv.customer_pan,
        inv.grand_total,
        inv.exempt_amount,
        inv.taxable_amount,
        inv.total_tax,
        inv.status,
      ]),
    ];
    const csvContent = rows.map((r) => r.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `aslenix_sales_register_annex8_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Print Handler
  const handlePrint = () => {
    window.scrollTo(0, 0);
    document.querySelectorAll('.overflow-y-auto').forEach((el) => {
      (el as HTMLElement).scrollTop = 0;
    });
    window.print();
  };

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return invoices.filter((inv) => {
      const matchSearch =
        !q ||
        inv.invoice_no.toLowerCase().includes(q) ||
        inv.customer_name.toLowerCase().includes(q) ||
        inv.customer_pan.includes(q);
      const matchStatus = statusFilter === 'All' || inv.status === statusFilter;
      const matchFY = fiscalYearFilter === 'All' || inv.fiscal_year === fiscalYearFilter;
      return matchSearch && matchStatus && matchFY;
    });
  }, [invoices, searchQuery, statusFilter, fiscalYearFilter]);

  // Statistics
  const stats = useMemo(() => {
    const totalInvoiced = invoices.filter((i) => i.status !== 'Cancelled').reduce((a, b) => a + b.grand_total, 0);
    const totalCollected = invoices.filter((i) => i.status !== 'Cancelled').reduce((a, b) => a + b.amount_paid, 0);
    const totalReceivables = invoices.filter((i) => i.status !== 'Cancelled').reduce((a, b) => a + b.balance_due, 0);
    const totalVatCollected = invoices.filter((i) => i.status !== 'Cancelled').reduce((a, b) => a + b.total_tax, 0);
    return { totalInvoiced, totalCollected, totalReceivables, totalVatCollected };
  }, [invoices]);

  const activeDisplayInvoice = previewInvoice || invoices[0];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 print:p-0 print:m-0 print:pb-0 print:overflow-visible print:transform-none space-y-6">
      
      {/* Top Header & Tab Controls (Hidden during print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Invoices & Nepal Tax Billing</h1>
            <span className="px-3 py-1 bg-gradient-to-r from-[#fff3ef] to-[#f0f4fe] text-slate-800 text-xs font-bold rounded-full border border-[#ffcfdc]/70">
              IRD Compliant
            </span>
          </div>
          <p className="text-slate-500 text-sm mt-0.5">
            13% VAT calculation, Official A4 Tax Invoices, Credit Notes, and IRD Annex 8 Sales Register.
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200/80">
          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'list'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText size={15} />
            <span>All Invoices ({invoices.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInvoiceNumber(generateNextInvoiceNumber(companySettings.invoice_prefix || 'ASL-', companySettings.fiscal_year || '2082/83', invoices.length + 1));
              setActiveTab('create');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'btn-gradient shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Plus size={15} className={activeTab === 'create' ? 'text-black' : ''} />
            <span>New Tax Invoice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('preview')}
            disabled={!activeDisplayInvoice}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'preview'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Printer size={15} />
            <span>Letterhead Print</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('credit_notes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'credit_notes'
                ? 'bg-white text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw size={15} />
            <span>Credit Notes ({creditNotes.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ALL INVOICES LIST & RECONCILIATION */}
      {/* ========================================================================= */}
      {activeTab === 'list' && (
        <div className="space-y-6 no-print animate-in fade-in duration-300">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-3xl border border-blue-100 bg-[#F8FAFF] shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">TOTAL INVOICED</span>
              <h3 className="text-2xl font-black text-slate-900 font-mono mt-1">{formatNPR(stats.totalInvoiced)}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Accrual Revenue (Active Invoices)</p>
            </div>

            <div className="p-5 rounded-3xl border border-emerald-100 bg-[#F6FAF7] shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">COLLECTED CASH</span>
              <h3 className="text-2xl font-black text-emerald-700 font-mono mt-1">{formatNPR(stats.totalCollected)}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Total Payments Received</p>
            </div>

            <div className="p-5 rounded-3xl border border-rose-100 bg-[#FFF8F8] shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">RECEIVABLES OUTSTANDING</span>
              <h3 className="text-2xl font-black text-rose-700 font-mono mt-1">{formatNPR(stats.totalReceivables)}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Customer Balance Due</p>
            </div>

            <div className="p-5 rounded-3xl border border-purple-100 bg-[#FAF7FD] shadow-xs">
              <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">13% OUTPUT VAT</span>
              <h3 className="text-2xl font-black text-purple-700 font-mono mt-1">{formatNPR(stats.totalVatCollected)}</h3>
              <p className="text-xs text-slate-500 mt-0.5">Output Tax Payable to IRD</p>
            </div>
          </div>

          {/* Search, Filter & Action Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                type="text"
                placeholder="Search by invoice #, customer name, PAN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="All">All Statuses</option>
                <option value="Paid">Paid</option>
                <option value="Partially Paid">Partially Paid</option>
                <option value="Unpaid">Unpaid</option>
                <option value="Cancelled">Cancelled</option>
              </select>

              <select
                value={fiscalYearFilter}
                onChange={(e) => setFiscalYearFilter(e.target.value)}
                className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
              >
                <option value="All">All Fiscal Years</option>
                <option value="2082/83">FY 2082/83</option>
                <option value="2081/82">FY 2081/82</option>
              </select>

              <button
                type="button"
                onClick={handleExportSalesRegisterCSV}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold shadow-xs cursor-pointer"
                title="Export Sales Book in IRD Annex 8 format"
              >
                <Download size={14} className="text-slate-500" />
                <span>Export Annex 8 CSV</span>
              </button>

              <button
                type="button"
                onClick={() => loadInvoicesFromSupabase()}
                disabled={loading}
                className="p-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl shadow-xs cursor-pointer"
                title="Refresh from Supabase"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Invoices Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-3">Date (BS / AD)</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-3 text-right">Taxable (Rs)</th>
                    <th className="py-3 px-3 text-right">13% VAT</th>
                    <th className="py-3 px-4 text-right">Grand Total</th>
                    <th className="py-3 px-3 text-right">Balance Due</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400">
                        No invoices match your search or filters. Click &ldquo;New Tax Invoice&rdquo; to generate one.
                      </td>
                    </tr>
                  ) : (
                    filteredInvoices.map((inv) => {
                      const isCancelled = inv.status === 'Cancelled';
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            {inv.invoice_no}
                          </td>
                          <td className="py-3.5 px-3 whitespace-nowrap">
                            <span className="font-semibold text-slate-800">{inv.invoice_date_bs}</span>
                            <span className="block text-[10px] text-slate-400">{inv.invoice_date}</span>
                          </td>
                          <td className="py-3.5 px-4 min-w-[180px]">
                            <p className="font-bold text-slate-900 truncate">{inv.customer_name}</p>
                            <span className="text-[10px] text-slate-500 font-mono">PAN: {inv.customer_pan || 'N/A'}</span>
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-700">
                            {formatNPR(inv.taxable_amount)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-semibold text-purple-700">
                            {formatNPR(inv.total_tax)}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                            {formatNPR(inv.grand_total)}
                          </td>
                          <td className="py-3.5 px-3 text-right font-mono font-bold">
                            <span className={inv.balance_due > 0 ? 'text-rose-600' : 'text-slate-400'}>
                              {formatNPR(inv.balance_due)}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 text-center">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider border ${
                                inv.status === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : inv.status === 'Partially Paid'
                                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                                  : inv.status === 'Cancelled'
                                  ? 'bg-slate-100 text-slate-600 border-slate-300'
                                  : 'bg-rose-50 text-rose-700 border-rose-200'
                              }`}
                            >
                              {inv.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* View / Print */}
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewInvoice(inv);
                                  setActiveTab('preview');
                                }}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="View & Print Official Tax Invoice"
                              >
                                <Eye size={15} />
                              </button>

                              {/* Record Payment */}
                              {!isCancelled && inv.balance_due > 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenPaymentModal(inv)}
                                  className="p-1.5 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                                  title="Record Payment"
                                >
                                  <CreditCard size={15} />
                                </button>
                              )}

                              {/* Cancel & Credit Note */}
                              {!isCancelled && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenCancelModal(inv)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="Cancel Invoice & Issue Credit Note"
                                >
                                  <Ban size={15} />
                                </button>
                              )}
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CREATE TAX INVOICE FORM */}
      {/* ========================================================================= */}
      {activeTab === 'create' && (
        <form onSubmit={handleSaveInvoice} className="space-y-6 no-print animate-in fade-in duration-300">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Tax Invoice Information</h3>
                <p className="text-xs text-slate-500">Provide customer coordinates and verify 13% Nepal VAT applicability.</p>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                  <input
                    type="checkbox"
                    checked={isVatInvoice}
                    onChange={(e) => setIsVatInvoice(e.target.checked)}
                    className="accent-slate-950 w-4 h-4 cursor-pointer"
                  />
                  <span>13% VAT Tax Invoice (कर बीजक)</span>
                </label>
              </div>
            </div>

            {/* Grid 1: Invoice Meta */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Invoice Number
                </label>
                <input
                  type="text"
                  required
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-slate-950"
                  placeholder="ASL-2082/83-0001"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Invoice Date (BS)
                </label>
                <NepaliDatePicker
                  value={invoiceDate}
                  onChange={setInvoiceDate}
                  required
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  AD: {bsToAdDate(invoiceDate).toISOString().slice(0, 10)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Payment Due Date (BS)
                </label>
                <NepaliDatePicker
                  value={dueDate}
                  onChange={setDueDate}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Fiscal Year
                </label>
                <input
                  type="text"
                  value={companySettings.fiscal_year || '2082/83'}
                  readOnly
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-700"
                />
              </div>
            </div>

            {/* Grid 2: Customer Coordinates */}
            <div className="p-4 bg-slate-50/70 border border-slate-200/80 rounded-2xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Customer & Buyer Coordinates
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Quick Select:</span>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 outline-none"
                  >
                    <option value="">-- Choose Existing Customer --</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.company_name || c.name} ({c.pan_number ? `PAN: ${c.pan_number}` : 'No PAN'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Company / Customer Name *</label>
                  <input
                    type="text"
                    required
                    value={customerInfo.name}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold"
                    placeholder="Tech Innovations Pvt. Ltd."
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Buyer PAN (9-Digits)</label>
                  <input
                    type="text"
                    value={customerInfo.pan}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, pan: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-mono"
                    placeholder="609123456"
                    maxLength={9}
                  />
                  {customerInfo.pan && customerInfo.pan !== 'N/A' && !isValidNepalPAN(customerInfo.pan) && (
                    <span className="text-[10px] text-amber-600 mt-0.5 block">Notice: Standard Nepal PAN is 9 digits.</span>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={customerInfo.phone}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                    placeholder="+977 1-4412345"
                  />
                </div>

                <div className="lg:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Billing Address</label>
                  <input
                    type="text"
                    value={customerInfo.address}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, address: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                    placeholder="Putalisadak, Kathmandu, Nepal"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Billing Email</label>
                  <input
                    type="email"
                    value={customerInfo.email}
                    onChange={(e) => setCustomerInfo({ ...customerInfo, email: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm"
                    placeholder="billing@customer.com"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Particulars & Services</h4>
                <button
                  type="button"
                  onClick={addItem}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus size={14} /> Add Row
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                      <th className="py-2.5 px-3 w-10 text-center">#</th>
                      <th className="py-2.5 px-3">Item / Description</th>
                      <th className="py-2.5 px-2 w-16 text-center">Qty</th>
                      <th className="py-2.5 px-2 w-20 text-center">Unit</th>
                      <th className="py-2.5 px-3 w-28 text-right">Rate (Rs)</th>
                      <th className="py-2.5 px-3 w-24 text-right">Disc (Rs)</th>
                      <th className="py-2.5 px-3 w-28 text-center">Tax Type</th>
                      <th className="py-2.5 px-3 w-32 text-right">Amount (Rs)</th>
                      <th className="py-2.5 px-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, index) => {
                      const lineNet = item.qty * item.rate - item.discount;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-3 text-center text-slate-400 font-bold">{index + 1}</td>
                          <td className="py-2.5 px-3 space-y-1">
                            <input
                              type="text"
                              required
                              value={item.name}
                              onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                              placeholder="Item Name / Professional Service"
                              className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-slate-950"
                            />
                            <input
                              type="text"
                              value={item.desc}
                              onChange={(e) => updateItem(item.id, 'desc', e.target.value)}
                              placeholder="Optional deliverables & scope details"
                              className="w-full px-2.5 py-1 text-slate-500 border border-slate-100 rounded-lg text-[11px]"
                            />
                          </td>
                          <td className="py-2.5 px-2">
                            <input
                              type="number"
                              min="0.1"
                              step="any"
                              value={item.qty}
                              onChange={(e) => updateItem(item.id, 'qty', Number(e.target.value))}
                              className="w-full px-2 py-1.5 text-center border border-slate-200 rounded-lg text-xs"
                            />
                          </td>
                          <td className="py-2.5 px-2">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => updateItem(item.id, 'unit', e.target.value)}
                              className="w-full px-2 py-1.5 text-center border border-slate-200 rounded-lg text-xs text-slate-600"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.rate}
                              onChange={(e) => updateItem(item.id, 'rate', Number(e.target.value))}
                              className="w-full px-2 py-1.5 text-right font-mono border border-slate-200 rounded-lg text-xs font-semibold"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min="0"
                              step="any"
                              value={item.discount}
                              onChange={(e) => updateItem(item.id, 'discount', Number(e.target.value))}
                              className="w-full px-2 py-1.5 text-right font-mono border border-slate-200 rounded-lg text-xs text-slate-600"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            <select
                              value={item.taxClassification}
                              onChange={(e) => updateItem(item.id, 'taxClassification', e.target.value as TaxClassification)}
                              className="w-full px-2 py-1.5 border border-slate-200 rounded-lg text-[11px] font-semibold text-slate-800"
                            >
                              <option value="Taxable">13% Taxable</option>
                              <option value="Exempt">Exempt</option>
                              <option value="Zero-Rated">Zero-Rated</option>
                            </select>
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 text-xs">
                            {formatNPR(lineNet)}
                          </td>
                          <td className="py-2.5 px-2 text-center">
                            {items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="p-1 text-slate-300 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Totals Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Invoice-Level Additional Discount (Rs.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={overallDiscount}
                    onChange={(e) => setOverallDiscount(Number(e.target.value))}
                    className="w-48 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    placeholder="0.00"
                  />
                </div>
                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
                  <span className="font-bold text-slate-900 block mb-0.5">Amount in Words:</span>
                  <p className="font-semibold text-slate-800 italic">{numberToWordsNPR(taxBreakdown.grandTotal)}</p>
                </div>
              </div>

              <div className="space-y-2 bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Gross Subtotal:</span>
                  <span className="font-mono font-semibold text-slate-900">{formatNPR(taxBreakdown.grossSubtotal)}</span>
                </div>
                {taxBreakdown.totalDiscount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Total Discount:</span>
                    <span className="font-mono font-semibold">-{formatNPR(taxBreakdown.totalDiscount)}</span>
                  </div>
                )}
                {taxBreakdown.exemptAmount > 0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>Non-Taxable / Exempt Sales:</span>
                    <span className="font-mono font-semibold text-slate-900">{formatNPR(taxBreakdown.exemptAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Amount (करयोग्य रकम):</span>
                  <span className="font-mono font-semibold text-slate-900">{formatNPR(taxBreakdown.taxableAmount)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>13% Value Added Tax (१३% मू.अ.कर):</span>
                  <span className="font-mono font-bold text-purple-700">{formatNPR(taxBreakdown.vatAmount)}</span>
                </div>
                <div className="pt-2 border-t border-slate-300 flex justify-between items-baseline text-sm font-bold text-slate-900">
                  <span>Grand Total (कुल जम्मा):</span>
                  <span className="font-mono text-base font-black text-slate-950">{formatNPR(taxBreakdown.grandTotal)}</span>
                </div>
              </div>
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-gradient flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold active:scale-98 transition-all cursor-pointer"
              >
                <CheckCircle size={16} className="text-black" />
                <span>Save & Issue Tax Invoice</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: OFFICIAL NEPAL TAX INVOICE A4 LETTERHEAD PRINT PREVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'preview' && activeDisplayInvoice && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs no-print">
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">Currently Previewing:</span>
              <span className="font-mono font-bold text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                {activeDisplayInvoice.invoice_no}
              </span>
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                  activeDisplayInvoice.status === 'Paid'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : activeDisplayInvoice.status === 'Cancelled'
                    ? 'bg-slate-100 text-slate-600 border-slate-300'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {activeDisplayInvoice.status}
              </span>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setActiveTab('list')}
                className="px-4 py-2 border border-slate-200 text-xs font-semibold text-slate-700 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                Back to List
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="btn-gradient flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold active:scale-98 transition-all cursor-pointer shadow-sm"
              >
                <Printer size={16} className="text-black" />
                <span>Print Tax Invoice (A4)</span>
              </button>
            </div>
          </div>

          {/* Printable Corporate A4 Letterhead Canvas */}
          <div
            id="printable-invoice"
            className="max-w-[840px] mx-auto bg-[#f1f0ee] rounded-2xl shadow-xl border border-slate-300/80 overflow-hidden print:shadow-none print:border-none print:rounded-none print:m-0 print:w-full print:max-w-full relative"
          >
            {/* Watermark Layer */}
            <div className="invoice-watermark-layer absolute inset-0 flex items-center justify-center pointer-events-none select-none z-0 overflow-hidden">
              <img
                src={companySettings.logo_url || '/logo.png'}
                alt="Aslenix Watermark"
                className="w-[380px] max-w-[62%] object-contain opacity-[0.038] select-none filter blur-[0.2px]"
              />
            </div>

            {/* Cancelled Watermark Badge if applicable */}
            {activeDisplayInvoice.status === 'Cancelled' && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <div className="border-8 border-rose-600/30 text-rose-600/30 font-black text-6xl tracking-widest uppercase p-6 rounded-3xl transform -rotate-12">
                  CANCELLED
                </div>
              </div>
            )}

            {/* Letterhead Content */}
            <div className="invoice-content-wrapper relative z-10 p-8 sm:p-10 print:p-0 text-slate-800 flex flex-col">
              {/* 1. Header with Reg No, PAN No, Title, and Logo */}
              <div className="print-header pb-1 mb-3">
                <div className="header-row relative grid grid-cols-1 sm:min-h-[150px] sm:grid-cols-[1fr_auto_1fr] items-start gap-4 w-full">
                  {/* Left: Registration details */}
                  <div className="header-left flex flex-col text-left sm:self-end sm:mb-1">
                    <div className="registration-details grid min-w-[205px] grid-cols-[58px_1fr] items-center gap-x-2 gap-y-1 rounded-md border border-slate-300/80 bg-white/20 px-2 py-1.5 text-[13px] font-bold text-slate-950">
                      <span className="font-bold whitespace-nowrap">Reg No:</span>
                      <span className="font-bold text-slate-950 font-mono">
                        {registrationNo || '391840/82/83'}
                      </span>
                      <span className="font-bold whitespace-nowrap">PAN No:</span>
                      <span className="font-bold text-slate-950 font-mono">
                        {panNo || '623611557'}
                      </span>
                    </div>
                  </div>

                  {/* Center: Company Name */}
                  <div className="header-center flex flex-col items-center justify-center text-center py-1">
                    <h1 className="whitespace-nowrap text-3xl sm:text-4xl font-black tracking-[0.28em] text-slate-950 font-sans uppercase leading-none">
                      A S L E N I X
                    </h1>
                    <p className="text-[11px] sm:text-xs font-black tracking-[0.36em] text-slate-950 uppercase mt-2 leading-none">
                      T E C H & S O L U T I O N
                    </p>
                  </div>

                  {/* Right: Logo and Ref No */}
                  <div className="header-right flex flex-col items-start sm:h-full sm:items-end sm:justify-between shrink-0 pr-1">
                    <img
                      src={companySettings.logo_url || '/logo.png'}
                      alt="ASLENIX Logo"
                      className="h-16 sm:h-20 w-auto object-contain print:h-16 drop-shadow-xs"
                    />
                    <div className="header-reference mt-3 flex items-center gap-1.5 text-xs font-bold text-slate-950 sm:mt-auto sm:mb-1">
                      <span className="whitespace-nowrap text-slate-500 font-semibold uppercase text-[11px]">Invoice No:</span>
                      <span className="font-bold font-mono text-slate-950">{activeDisplayInvoice.invoice_no}</span>
                    </div>
                  </div>
                </div>

                <div className="w-full h-[2px] bg-slate-900 mt-4"></div>
                <div className="invoice-title mt-2 mb-3 text-center text-xs sm:text-sm font-black tracking-[0.25em] text-slate-950 uppercase">
                  {activeDisplayInvoice.is_vat_invoice ? 'TAX INVOICE (कर बीजक)' : 'INVOICE (बीजक)'}
                </div>
              </div>

              {/* 2. Sub-Header Metadata Bar */}
              <div className="flex flex-wrap justify-between items-center gap-3 mb-4 pt-0.5 text-xs font-medium">
                <div className="flex items-center gap-3 text-slate-600">
                  <span>
                    Payment Due: <span className="font-semibold text-slate-900">{formatNepaliDate(activeDisplayInvoice.due_date)}</span>
                  </span>
                  <span className="text-slate-300">|</span>
                  <span className="text-slate-500">
                    Fiscal Year: <span className="font-bold text-slate-900 font-mono">{activeDisplayInvoice.fiscal_year}</span>
                  </span>
                </div>

                <div className="invoice-date-field ml-auto flex items-center gap-2 text-center text-slate-950 font-bold">
                  <span className="whitespace-nowrap text-slate-500 font-semibold uppercase text-[11px]">DATE:</span>
                  <span className="font-mono font-bold text-slate-950">
                    {activeDisplayInvoice.invoice_date_bs} BS ({activeDisplayInvoice.invoice_date} AD)
                  </span>
                </div>
              </div>

              {/* 3. Billed To Card */}
              <div className="print-billing grid grid-cols-1 md:grid-cols-3 gap-5 mb-5 print:gap-3 print:mb-2">
                <div className="md:col-span-2 space-y-1.5 p-3.5 rounded-xl border border-slate-300/80 bg-white/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    BILLED TO (खरिदकर्ता)
                  </span>
                  <p className="font-bold text-base text-slate-900">{activeDisplayInvoice.customer_name}</p>
                  <p className="text-xs text-slate-600 leading-relaxed">{activeDisplayInvoice.customer_address}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs pt-1 border-t border-slate-100">
                    <div>
                      <span className="text-slate-400 font-medium">Buyer PAN/VAT: </span>
                      <span className="font-bold font-mono text-slate-900">{activeDisplayInvoice.customer_pan || 'N/A'}</span>
                    </div>
                    {activeDisplayInvoice.customer_phone && (
                      <div>
                        <span className="text-slate-400 font-medium">Phone: </span>
                        <span className="text-slate-800">{activeDisplayInvoice.customer_phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Box */}
                <div className="bg-white/60 p-3.5 rounded-xl border border-slate-300/80 flex flex-col justify-between print:p-2.5 print:rounded-lg">
                  <div>
                    <div className="flex justify-between items-center mb-2.5 print:mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Payment Status
                      </span>
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border uppercase tracking-wider ${
                          activeDisplayInvoice.status === 'Paid'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : activeDisplayInvoice.status === 'Cancelled'
                            ? 'bg-slate-100 text-slate-600 border-slate-300'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {activeDisplayInvoice.status}
                      </span>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Total Invoiced:</span>
                        <span className="font-semibold text-slate-800 font-mono">{formatNPR(activeDisplayInvoice.grand_total)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-medium">Amount Paid:</span>
                        <span className="font-semibold text-emerald-700 font-mono">{formatNPR(activeDisplayInvoice.amount_paid)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-200/80 flex justify-between items-baseline">
                    <span className="text-xs font-bold text-slate-900">Balance Due:</span>
                    <span className="text-base font-extrabold text-rose-700 font-mono">
                      {formatNPR(activeDisplayInvoice.balance_due)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 4. Itemized Table */}
              <div className="print-items mb-5 overflow-x-auto print:overflow-visible print:mb-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-y border-slate-300/80 bg-slate-200/50 text-[11px] uppercase tracking-wider text-slate-700 font-bold">
                      <th className="py-2.5 px-3 text-center w-10">S.N.</th>
                      <th className="py-2.5 px-3">Description of Goods / Services</th>
                      <th className="py-2.5 px-2 text-center w-14">Qty</th>
                      <th className="py-2.5 px-2 text-center w-16">Unit</th>
                      <th className="py-2.5 px-3 text-right w-24">Rate (Rs)</th>
                      <th className="py-2.5 px-3 text-right w-20">Disc (Rs)</th>
                      <th className="py-2.5 px-2 text-center w-20">Tax</th>
                      <th className="py-2.5 px-3 text-right w-28">Amount (Rs)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                    {activeDisplayInvoice.items.map((item, index) => {
                      const lineNet = item.qty * item.rate - item.discount;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/40">
                          <td className="py-3 px-3 text-center text-slate-400 font-medium align-top">{index + 1}</td>
                          <td className="py-3 px-3 align-top">
                            <p className="font-semibold text-slate-900 text-xs">{item.name}</p>
                            {item.desc && <p className="text-slate-500 text-[11px] mt-0.5">{item.desc}</p>}
                          </td>
                          <td className="py-3 px-2 text-center align-top font-mono">{item.qty}</td>
                          <td className="py-3 px-2 text-center align-top text-slate-600">{item.unit}</td>
                          <td className="py-3 px-3 text-right align-top font-mono">{formatNPR(item.rate)}</td>
                          <td className="py-3 px-3 text-right align-top font-mono text-slate-500">{formatNPR(item.discount)}</td>
                          <td className="py-3 px-2 text-center align-top text-[11px] font-semibold text-purple-700">
                            {item.taxClassification === 'Exempt' ? 'Exempt' : `${item.tax}%`}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-slate-900 font-mono text-xs align-top">
                            {formatNPR(lineNet)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* 5. Totals & Nepal IRD Compliant Summary */}
              <div className="print-summary grid grid-cols-1 md:grid-cols-2 gap-6 pt-3 border-t border-slate-200 mb-6 print:gap-3 print:pt-2 print:mb-2">
                {/* Bank Details & Terms */}
                <div className="space-y-3 print:space-y-1.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                      BANK DETAILS FOR SETTLEMENT
                    </span>
                    <div className="bg-white/60 p-3 rounded-lg border border-slate-300/80 text-xs space-y-1">
                      <div className="grid grid-cols-[100px_1fr]">
                        <span className="text-slate-500">Bank Name:</span>
                        <span className="font-semibold text-slate-900">{companySettings.bank_name || 'Global IME Bank'}</span>
                      </div>
                      <div className="grid grid-cols-[100px_1fr]">
                        <span className="text-slate-500">Account Name:</span>
                        <span className="font-semibold text-slate-900">{companySettings.bank_account_name || companySettings.company_name}</span>
                      </div>
                      <div className="grid grid-cols-[100px_1fr]">
                        <span className="text-slate-500">Account No:</span>
                        <span className="font-mono font-bold text-slate-900">{companySettings.bank_account_no || '01234567890123'}</span>
                      </div>
                      <div className="grid grid-cols-[100px_1fr]">
                        <span className="text-slate-500">Branch:</span>
                        <span className="font-semibold text-slate-900">{companySettings.bank_branch || 'Baneshwor Branch'}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                      IN WORDS (अक्षरेपी)
                    </span>
                    <p className="text-[11px] font-semibold text-slate-800 italic">
                      {numberToWordsNPR(activeDisplayInvoice.grand_total)}
                    </p>
                  </div>
                </div>

                {/* Right: Totals */}
                <div className="flex flex-col justify-start items-end">
                  <div className="w-full max-w-[300px] space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Subtotal (जम्मा):</span>
                      <span className="font-semibold text-slate-900 font-mono">{formatNPR(activeDisplayInvoice.subtotal)}</span>
                    </div>

                    {activeDisplayInvoice.total_discount > 0 && (
                      <div className="flex justify-between text-emerald-600">
                        <span>Total Discount (छुट):</span>
                        <span className="font-semibold font-mono">-{formatNPR(activeDisplayInvoice.total_discount)}</span>
                      </div>
                    )}

                    {activeDisplayInvoice.exempt_amount > 0 && (
                      <div className="flex justify-between text-slate-600">
                        <span>Non-Taxable / Exempt Sales:</span>
                        <span className="font-semibold text-slate-900 font-mono">{formatNPR(activeDisplayInvoice.exempt_amount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600">
                      <span>Taxable Amount (करयोग्य रकम):</span>
                      <span className="font-semibold text-slate-900 font-mono">{formatNPR(activeDisplayInvoice.taxable_amount)}</span>
                    </div>

                    <div className="flex justify-between text-slate-600">
                      <span>13% VAT (१३% मू.अ.कर):</span>
                      <span className="font-bold text-purple-700 font-mono">{formatNPR(activeDisplayInvoice.total_tax)}</span>
                    </div>

                    <div className="border-t-2 border-slate-900 pt-2 mt-1.5 flex justify-between items-baseline">
                      <span className="text-sm font-black text-slate-900 uppercase">
                        Grand Total (कुल जम्मा):
                      </span>
                      <span className="text-lg font-black text-slate-950 font-mono">
                        {formatNPR(activeDisplayInvoice.grand_total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 6. Signature Area */}
              <div className="print-signatures mt-6 pt-16 sm:pt-20 border-t border-slate-200 flex justify-between items-end print:mt-4 print:pt-14">
                <div className="text-left w-52">
                  <div className="border-t border-slate-400 w-44 mb-2"></div>
                  <p className="text-xs font-bold text-slate-900">Authorized Signature</p>
                  <p className="text-[10px] text-slate-500">For {companySettings.company_name || 'ASLENIX TECH & SOLUTION'}</p>
                </div>

                <div className="text-right w-52">
                  <div className="border-t border-slate-400 w-44 ml-auto mb-2"></div>
                  <p className="text-xs font-bold text-slate-900">Customer Signature</p>
                  <p className="text-[10px] text-slate-500">Received in good condition</p>
                </div>
              </div>

              {/* 7. Footer */}
              <div className="print-footer mt-12 sm:mt-16 pt-3.5 border-t border-slate-900 print:mt-12 print:pt-2.5">
                <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-800 font-medium px-1">
                  <div className="flex items-center gap-1.5">
                    <Phone size={12} className="text-slate-950 shrink-0" />
                    <span>{companySettings.phone || '+977 9709043147'}</span>
                  </div>
                  <span className="text-slate-300 font-light">|</span>
                  <div className="flex items-center gap-1.5">
                    <Mail size={12} className="text-blue-600 shrink-0" />
                    <span>{companySettings.email || 'aslenixtech@gmail.com'}</span>
                  </div>
                  <span className="text-slate-300 font-light">|</span>
                  <div className="flex items-center gap-1.5">
                    <MapPin size={12} className="text-rose-600 shrink-0" />
                    <span>{companySettings.address || 'Buddhanagar, Kathmandu'}</span>
                  </div>
                  <span className="text-slate-300 font-light">|</span>
                  <div className="flex items-center gap-1.5">
                    <Globe size={12} className="text-slate-700 shrink-0" />
                    <span>{companySettings.website || 'www.aslenix.tech'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CREDIT NOTES LIST */}
      {/* ========================================================================= */}
      {activeTab === 'credit_notes' && (
        <div className="space-y-6 no-print animate-in fade-in duration-300">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Credit Notes Register (क्रेडिट नोट)</h3>
              <p className="text-xs text-slate-500">Official credit notes issued for cancelled or revised tax invoices under Nepal VAT regulations.</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <th className="py-3 px-4">Credit Note #</th>
                    <th className="py-3 px-3">Date (BS)</th>
                    <th className="py-3 px-3">Original Invoice #</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-3 text-right">Taxable Credit (Rs)</th>
                    <th className="py-3 px-3 text-right">13% VAT Adjustment</th>
                    <th className="py-3 px-4 text-right">Total Credit (Rs)</th>
                    <th className="py-3 px-4">Official Reason</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {creditNotes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No credit notes have been issued yet. When you cancel an invoice, an official Credit Note is registered here.
                      </td>
                    </tr>
                  ) : (
                    creditNotes.map((cn) => (
                      <tr key={cn.id} className="hover:bg-slate-50/50">
                        <td className="py-3.5 px-4 font-mono font-bold text-rose-700">{cn.credit_note_no}</td>
                        <td className="py-3.5 px-3 font-semibold">{cn.date_bs}</td>
                        <td className="py-3.5 px-3 font-mono font-bold text-slate-800">{cn.invoice_no}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{cn.customer_name}</td>
                        <td className="py-3.5 px-3 text-right font-mono font-semibold">{formatNPR(cn.taxable_amount)}</td>
                        <td className="py-3.5 px-3 text-right font-mono font-semibold text-purple-700">{formatNPR(cn.tax_amount)}</td>
                        <td className="py-3.5 px-4 text-right font-mono font-black text-slate-900">{formatNPR(cn.total_amount)}</td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{cn.reason}</td>
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
      {/* MODAL: RECORD PAYMENT AGAINST INVOICE */}
      {/* ========================================================================= */}
      {paymentModalOpen && selectedInvoiceForPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 no-print animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CreditCard size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Record Payment</h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-bold text-slate-900 font-mono">{selectedInvoiceForPayment.invoice_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">{selectedInvoiceForPayment.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Grand Total:</span>
                <span className="font-mono font-semibold text-slate-900">{formatNPR(selectedInvoiceForPayment.grand_total)}</span>
              </div>
              <div className="flex justify-between text-rose-600 font-bold">
                <span>Remaining Balance Due:</span>
                <span className="font-mono">{formatNPR(selectedInvoiceForPayment.balance_due)}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Payment Amount (NPR) *
                </label>
                <input
                  type="number"
                  min="1"
                  step="any"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base font-mono font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  <option value="Bank Transfer">Bank Transfer / ConnectIPS</option>
                  <option value="eSewa">eSewa Mobile Wallet</option>
                  <option value="Khalti">Khalti Mobile Wallet</option>
                  <option value="Cash">Cash in Hand</option>
                  <option value="Cheque">Bank Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Payment Date (BS)
                </label>
                <NepaliDatePicker
                  value={paymentDateBs}
                  onChange={setPaymentDateBs}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Transaction Reference / Voucher #
                </label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  placeholder="e.g. NABIL-TXN-998811"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Confirm Payment Receipt
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CANCEL INVOICE & ISSUE CREDIT NOTE */}
      {/* ========================================================================= */}
      {cancelModalOpen && invoiceToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 no-print animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
                  <Ban size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">Cancel Invoice & Issue Credit Note</h3>
              </div>
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Under Nepal Inland Revenue Department (IRD) compliance, completed tax invoices cannot be deleted silently.
              Cancelling <strong>{invoiceToCancel.invoice_no}</strong> will issue an official <strong>Credit Note</strong> in the audit trail.
            </p>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs space-y-1 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-500">Invoice:</span>
                <span className="font-bold text-slate-900">{invoiceToCancel.invoice_no}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Customer:</span>
                <span className="font-semibold text-slate-800">{invoiceToCancel.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Credit:</span>
                <span className="font-bold text-rose-700">{formatNPR(invoiceToCancel.grand_total)}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Cancellation Reason (Required by IRD) *
              </label>
              <textarea
                required
                rows={3}
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="e.g. Scope revised by client, error in billing coordinates, contract cancelled..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={handleConfirmCancelInvoice}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
              >
                Confirm Cancellation & Issue Credit Note
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default InvoiceCreate;
