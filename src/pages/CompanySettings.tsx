import React, { useState, useEffect, useRef } from 'react';
import { 
  Save, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Landmark, 
  FileText, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Trash2, 
  Image as ImageIcon,
  Copy,
  Check,
  ShieldCheck,
  Eye,
  Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface CompanySettingsData {
  company_name: string;
  registration_no: string;
  pan_vat_no: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo_url: string;
  bank_name: string;
  bank_account_name: string;
  bank_account_no: string;
  bank_branch: string;
  fiscal_year: string;
  invoice_prefix: string;
  default_tax_rate: number;
  terms_conditions: string;
}

export const DEFAULT_COMPANY_SETTINGS: CompanySettingsData = {
  company_name: 'ASLENIX TECH & SOLUTION',
  registration_no: '391840/82/83',
  pan_vat_no: '623611557',
  address: 'Buddhanagar, Kathmandu',
  phone: '+977 9709043147',
  email: 'aslenixtech@gmail.com',
  website: 'www.aslenix.tech',
  logo_url: '/logo.png',
  bank_name: 'Global IME Bank',
  bank_account_name: 'ASLENIX TECH & SOLUTION',
  bank_account_no: '01234567890123',
  bank_branch: 'Baneshwor Branch',
  fiscal_year: '2082/83',
  invoice_prefix: 'ASL-',
  default_tax_rate: 13,
  terms_conditions: 'Payment is required within 15 days of invoice date. All payments can be made via bank transfer to the account listed above.',
};

export const getStoredCompanySettings = (): CompanySettingsData => {
  try {
    const saved = localStorage.getItem('aslenix_company_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.pan_vat_no === '123456789') parsed.pan_vat_no = '623611557';
      if (parsed.registration_no === 'REG-2080-9842') parsed.registration_no = '391840/82/83';
      if (parsed.phone === '+977 1-4000000') parsed.phone = '+977 9709043147';
      if (parsed.email === 'contact@aslenix.com') parsed.email = 'aslenixtech@gmail.com';
      if (parsed.website === 'https://aslenix.com') parsed.website = 'www.aslenix.tech';
      if (parsed.address === 'Budhanagar, Kathmandu, Nepal') parsed.address = 'Buddhanagar, Kathmandu';
      return { ...DEFAULT_COMPANY_SETTINGS, ...parsed };
    }
  } catch (err) {
    console.error('Failed to parse saved company settings', err);
  }
  return DEFAULT_COMPANY_SETTINGS;
};

const CompanySettings: React.FC = () => {
  const [formData, setFormData] = useState<CompanySettingsData>(getStoredCompanySettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from Supabase on mount if available
  useEffect(() => {
    let isMounted = true;
    const loadFromDb = async () => {
      try {
        const { data, error } = await supabase
          .from('company_settings')
          .select('*')
          .limit(1)
          .maybeSingle();

        if (!error && data && isMounted) {
          setFormData((prev) => {
            const merged: CompanySettingsData = {
              ...prev,
              company_name: data.company_name || prev.company_name,
              registration_no: data.registration_no || prev.registration_no,
              pan_vat_no: data.pan_vat_no || prev.pan_vat_no,
              address: data.address || prev.address,
              phone: data.phone || prev.phone,
              email: data.email || prev.email,
              website: data.website || prev.website,
              bank_name: data.bank_name || prev.bank_name,
              bank_account_name: data.bank_account_name || prev.bank_account_name,
              bank_account_no: data.bank_account_no || prev.bank_account_no,
              bank_branch: data.bank_branch || prev.bank_branch,
              fiscal_year: data.fiscal_year || prev.fiscal_year,
              invoice_prefix: data.invoice_prefix || prev.invoice_prefix,
              default_tax_rate: typeof data.default_tax_rate === 'number' ? data.default_tax_rate : prev.default_tax_rate,
              terms_conditions: data.terms_conditions || prev.terms_conditions,
            };
            localStorage.setItem('aslenix_company_settings', JSON.stringify(merged));
            return merged;
          });
        }
      } catch (err) {
        console.warn('Could not load company settings from DB, using local cache:', err);
      }
    };

    loadFromDb();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleChange = (field: keyof CompanySettingsData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (saveStatus !== 'idle') {
      setSaveStatus('idle');
    }
  };

  const copyToClipboard = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Optimize and process uploaded logo using HTML5 Canvas (max 512x512, crisp web quality)
  const processImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, or WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_DIM = 512;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_DIM) {
            height = Math.round((height * MAX_DIM) / width);
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width = Math.round((width * MAX_DIM) / height);
            height = MAX_DIM;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);

          const dataUrl = canvas.toDataURL('image/png', 0.95);
          handleChange('logo_url', dataUrl);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all company settings and logo back to default official values?')) {
      setFormData(DEFAULT_COMPANY_SETTINGS);
      localStorage.setItem('aslenix_company_settings', JSON.stringify(DEFAULT_COMPANY_SETTINGS));
      window.dispatchEvent(new CustomEvent('company_settings_updated', { detail: DEFAULT_COMPANY_SETTINGS }));
      setSaveStatus('success');
      setStatusMessage('Settings reset to defaults and saved!');
      setTimeout(() => setSaveStatus('idle'), 4000);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // 1. Persist to localStorage and dispatch custom event
      localStorage.setItem('aslenix_company_settings', JSON.stringify(formData));
      window.dispatchEvent(new CustomEvent('company_settings_updated', { detail: formData }));

      // 2. Sync with Supabase company_settings table
      try {
        const payloadToDb = {
          company_name: formData.company_name,
          registration_no: formData.registration_no,
          pan_vat_no: formData.pan_vat_no,
          address: formData.address,
          phone: formData.phone,
          email: formData.email,
          website: formData.website,
          bank_name: formData.bank_name,
          bank_account_name: formData.bank_account_name,
          bank_account_no: formData.bank_account_no,
          bank_branch: formData.bank_branch,
          fiscal_year: formData.fiscal_year,
          invoice_prefix: formData.invoice_prefix,
          default_tax_rate: Number(formData.default_tax_rate) || 13,
          terms_conditions: formData.terms_conditions,
          updated_at: new Date().toISOString(),
        };

        const { data: existingRows } = await supabase
          .from('company_settings')
          .select('id')
          .limit(1);

        if (existingRows && existingRows.length > 0) {
          await supabase
            .from('company_settings')
            .update(payloadToDb)
            .eq('id', existingRows[0].id);
        } else {
          await supabase
            .from('company_settings')
            .insert([payloadToDb]);
        }
      } catch (dbErr) {
        console.warn('Supabase sync note (localStorage active):', dbErr);
      }

      setSaveStatus('success');
      setStatusMessage('Company settings saved successfully! Invoices, salary slips, and sidebar updated.');
      setTimeout(() => {
        setSaveStatus('idle');
      }, 4000);
    } catch (err: any) {
      console.error('Error saving company settings:', err);
      setSaveStatus('error');
      setStatusMessage(err?.message || 'Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Company Profile & Settings</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <ShieldCheck size={12} /> Verified System Entity
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">Configure company credentials, banking coordinates, and letterhead assets.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-600 bg-white border border-slate-200/90 rounded-2xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs cursor-pointer"
            title="Reset to default official company configuration"
          >
            <RefreshCw size={14} />
            Reset Defaults
          </button>
          
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="btn-gradient flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-bold active:scale-98 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isSaving ? <RefreshCw size={16} className="animate-spin text-black" /> : <Save size={16} className="text-black" />}
            <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* Status Alerts */}
      {saveStatus === 'success' && (
        <div className="p-4 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between gap-3 text-emerald-800 text-sm shadow-xs animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center gap-2.5 font-medium">
            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <span className="text-xs text-emerald-700 font-semibold bg-emerald-100/80 px-2.5 py-0.5 rounded-full">
            Active Everywhere
          </span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-rose-800 text-sm shadow-xs animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Top 3 Identity Cards (matching rounded-3xl with top-right badges) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Legal Entity */}
        <div className="bg-blue-50/50 border border-blue-100/70 rounded-3xl p-6 relative overflow-hidden shadow-xs">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-white text-blue-600 rounded-2xl shadow-xs border border-blue-100/80">
              <Building2 size={22} />
            </div>
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              LEGAL ENTITY
            </span>
          </div>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight truncate">
            {formData.company_name || 'ASLENIX TECH & SOLUTION'}
          </h3>
          <div className="mt-3 space-y-1 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Reg No:</span>
              <span className="font-bold text-slate-800 font-mono">{formData.registration_no || '391840/82/83'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">PAN / VAT:</span>
              <span className="font-bold text-slate-900 font-mono">{formData.pan_vat_no || '623611557'}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Contact Channels */}
        <div className="bg-emerald-50/50 border border-emerald-100/70 rounded-3xl p-6 relative overflow-hidden shadow-xs">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-white text-emerald-600 rounded-2xl shadow-xs border border-emerald-100/80">
              <Phone size={22} />
            </div>
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              COMMUNICATIONS
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 truncate">
            {formData.phone || '+977 9709043147'}
          </h3>
          <div className="mt-3 space-y-1 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Official Email:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[170px]">{formData.email || 'aslenixtech@gmail.com'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Headquarters:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[170px]">{formData.address || 'Buddhanagar, Kathmandu'}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Banking & Fiscal Defaults */}
        <div className="bg-purple-50/50 border border-purple-100/70 rounded-3xl p-6 relative overflow-hidden shadow-xs">
          <div className="flex justify-between items-start mb-3">
            <div className="p-3 bg-white text-purple-600 rounded-2xl shadow-xs border border-purple-100/80">
              <Landmark size={22} />
            </div>
            <span className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">
              BANKING & FISCAL
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 truncate">
            {formData.bank_name || 'Global IME Bank'}
          </h3>
          <div className="mt-3 space-y-1 text-xs text-slate-600">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Account No:</span>
              <span className="font-mono font-bold text-slate-800">{formData.bank_account_no || '01234567890123'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Active Fiscal Year:</span>
              <span className="font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-full">{formData.fiscal_year || '2082/83'}</span>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Left Columns (Form controls) */}
          <div className="lg:col-span-2 space-y-6">
            {/* 1. Legal Entity & Registration */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-200/80 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Legal Entity & Registration</h3>
                  <p className="text-xs text-slate-500">Official registered business names printed on invoices and contracts.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Company Registered Name *
                  </label>
                  <input 
                    type="text" 
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    required
                    placeholder="e.g. ASLENIX TECH & SOLUTION"
                    className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all uppercase" 
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Registration Number
                    </label>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.registration_no, 'reg')}
                      className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'reg' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      {copiedField === 'reg' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={formData.registration_no}
                    onChange={(e) => handleChange('registration_no', e.target.value)}
                    placeholder="391840/82/83" 
                    className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all" 
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      PAN / VAT Number
                    </label>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.pan_vat_no, 'pan')}
                      className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'pan' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      {copiedField === 'pan' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={formData.pan_vat_no}
                    onChange={(e) => handleChange('pan_vat_no', e.target.value)}
                    placeholder="623611557" 
                    className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* 2. Communication & Location Channels */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-200/80 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Communication & Location</h3>
                  <p className="text-xs text-slate-500">Official communication channels shown on invoice footers and contact bars.</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Registered Headquarters Address
                  </label>
                  <input 
                    type="text"
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    placeholder="Buddhanagar, Kathmandu"
                    className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <Phone size={13} className="text-slate-400" /> Phone Number
                  </label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+977 9709043147" 
                    className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all font-mono" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <Mail size={13} className="text-slate-400" /> Official Email
                  </label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="aslenixtech@gmail.com" 
                    className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all" 
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 flex items-center gap-1.5">
                    <Globe size={13} className="text-slate-400" /> Official Website URL
                  </label>
                  <input 
                    type="text" 
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="www.aslenix.tech" 
                    className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* 3. Bank Account Coordinates */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-200/80 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl">
                  <Landmark size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Bank & Remittance Coordinates</h3>
                  <p className="text-xs text-slate-500">Official bank coordinates automatically displayed in the invoice payment card.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Bank Name</label>
                  <input 
                    type="text" 
                    value={formData.bank_name}
                    onChange={(e) => handleChange('bank_name', e.target.value)}
                    placeholder="Global IME Bank"
                    className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Account Holder Name</label>
                  <input 
                    type="text" 
                    value={formData.bank_account_name}
                    onChange={(e) => handleChange('bank_account_name', e.target.value)}
                    placeholder="ASLENIX TECH & SOLUTION"
                    className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all" 
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Account Number</label>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.bank_account_no, 'acct')}
                      className="text-[11px] text-slate-400 hover:text-slate-700 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedField === 'acct' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      {copiedField === 'acct' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={formData.bank_account_no}
                    onChange={(e) => handleChange('bank_account_no', e.target.value)}
                    placeholder="01234567890123"
                    className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Branch Name</label>
                  <input 
                    type="text" 
                    value={formData.bank_branch}
                    onChange={(e) => handleChange('bank_branch', e.target.value)}
                    placeholder="Baneshwor Branch"
                    className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* 4. Invoice Policy & Defaults */}
            <div className="bg-white p-6 md:p-8 rounded-3xl shadow-xs border border-slate-200/80 space-y-6">
              <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Invoice Policy & VAT Defaults</h3>
                  <p className="text-xs text-slate-500">Configure numbering schemes, default VAT rates, and terms printed on tax invoices.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Fiscal Year</label>
                  <select 
                    value={formData.fiscal_year}
                    onChange={(e) => handleChange('fiscal_year', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all"
                  >
                    <option value="2081/82">2081/82</option>
                    <option value="2082/83">2082/83</option>
                    <option value="2083/84">2083/84</option>
                    <option value="2084/85">2084/85</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Invoice Prefix</label>
                  <input 
                    type="text" 
                    value={formData.invoice_prefix}
                    onChange={(e) => handleChange('invoice_prefix', e.target.value)}
                    placeholder="ASL-"
                    className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all" 
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Default VAT Rate (%)</label>
                  <div className="relative">
                    <input 
                      type="number" 
                      step="0.1"
                      min="0"
                      max="100"
                      value={formData.default_tax_rate}
                      onChange={(e) => handleChange('default_tax_rate', parseFloat(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 transition-all" 
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                  </div>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                    Default Payment Terms & Conditions
                  </label>
                  <textarea 
                    value={formData.terms_conditions}
                    onChange={(e) => handleChange('terms_conditions', e.target.value)}
                    rows={3} 
                    placeholder="Payment is required within 15 days of invoice date..."
                    className="w-full px-4 py-3 bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-2xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-950 focus:border-slate-950 resize-none transition-all leading-relaxed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Logo Upload & Interactive Letterhead Live Preview */}
          <div className="space-y-6">
            {/* Logo Upload Card */}
            <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/80 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <ImageIcon size={16} className="text-slate-700" /> Company Logo Mark
                </h4>
                {formData.logo_url && formData.logo_url !== '/logo.png' && (
                  <button
                    type="button"
                    onClick={() => handleChange('logo_url', '/logo.png')}
                    className="text-xs text-rose-600 hover:text-rose-800 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                    title="Revert to default Aslenix logo"
                  >
                    <Trash2 size={12} /> Default
                  </button>
                )}
              </div>

              {/* Hidden file input */}
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept="image/png, image/jpeg, image/webp, image/svg+xml"
                className="hidden" 
              />

              {/* Logo Preview & Drop Area */}
              <div 
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`w-full h-44 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all duration-200 group relative overflow-hidden ${
                  isDragging 
                    ? 'border-slate-950 bg-slate-100 scale-102' 
                    : 'border-slate-300 bg-slate-50/70 hover:bg-slate-100/70 hover:border-slate-400'
                }`}
                title="Click or drag an image here to upload logo"
              >
                {formData.logo_url ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <img 
                      src={formData.logo_url} 
                      alt="Company Logo Preview" 
                      className="max-h-28 max-w-full object-contain group-hover:opacity-40 transition-opacity drop-shadow-xs" 
                    />
                    <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl backdrop-blur-xs">
                      <Upload size={22} className="mb-1" />
                      <span className="text-xs font-bold">Replace Logo</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="mb-2 text-slate-400 group-hover:text-slate-900 transition-colors" />
                    <span className="text-xs font-bold text-slate-700">Upload Official Logo</span>
                    <span className="text-[11px] text-slate-400 mt-1">PNG, SVG, or WebP</span>
                  </>
                )}
              </div>

              <div className="w-full mt-4 flex items-center justify-between text-[11px] text-slate-400">
                <span>Recommended: 512×512px</span>
                <span className="font-semibold text-slate-600">Crisp HD</span>
              </div>

              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full mt-4 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <Upload size={14} />
                {formData.logo_url ? 'Choose New Logo' : 'Select Image File'}
              </button>
            </div>

            {/* Live Letterhead & Invoice Header Preview Card */}
            <div className="bg-white p-6 rounded-3xl shadow-xs border border-slate-200/80">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Eye size={14} className="text-blue-600" /> Live Letterhead Preview
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Real-time
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mb-4">
                This is how your official branding renders across invoices, receipts, and payslips:
              </p>

              {/* Miniature Letterhead Simulation */}
              <div className="p-4 bg-[#f1f0ee] rounded-2xl border border-slate-300/80 text-left text-slate-800 space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-black tracking-widest text-slate-950 uppercase leading-tight truncate">
                      {formData.company_name || 'A S L E N I X'}
                    </p>
                    <p className="text-[9px] font-black tracking-widest text-slate-600 uppercase mt-0.5">
                      TECH & SOLUTION
                    </p>
                    <div className="mt-2 text-[10px] space-y-0.5 text-slate-700">
                      <p><span className="font-bold text-slate-900">Reg:</span> {formData.registration_no || '391840/82/83'}</p>
                      <p><span className="font-bold text-slate-900">PAN:</span> {formData.pan_vat_no || '623611557'}</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end shrink-0">
                    <img 
                      src={formData.logo_url || '/logo.png'} 
                      alt="Logo" 
                      className="h-10 w-auto object-contain" 
                    />
                    <span className="mt-1.5 px-2 py-0.5 bg-slate-950 text-white text-[9px] font-black tracking-wider uppercase rounded">
                      TAX INVOICE
                    </span>
                  </div>
                </div>

                <div className="w-full h-[1.5px] bg-slate-900"></div>

                <div className="text-[9px] text-slate-600 flex justify-between items-center">
                  <span>Fiscal: <b>{formData.fiscal_year || '2082/83'}</b></span>
                  <span>Default VAT: <b>{formData.default_tax_rate}%</b></span>
                </div>

                <div className="pt-2 border-t border-slate-300 text-[8.5px] text-slate-600 flex flex-wrap justify-between gap-1 leading-tight">
                  <span>📞 {formData.phone || '+977 9709043147'}</span>
                  <span>📍 {formData.address || 'Kathmandu'}</span>
                  <span>🌐 {formData.website || 'www.aslenix.tech'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="p-6 bg-white rounded-3xl shadow-xs border border-slate-200/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs text-slate-500">
            <Sparkles size={16} className="text-amber-500 shrink-0" />
            <span>Updates sync automatically with your invoices, PDF exports, and sidebar header.</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              type="button"
              onClick={handleResetToDefault}
              className="flex-1 sm:flex-none px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
            >
              Reset Defaults
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="btn-gradient flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-98 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving ? <RefreshCw size={16} className="animate-spin text-black" /> : <Save size={16} className="text-black" />}
              <span>{isSaving ? 'Saving Changes...' : 'Save Settings'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CompanySettings;
