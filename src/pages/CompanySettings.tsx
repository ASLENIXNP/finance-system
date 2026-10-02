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
  Image as ImageIcon 
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
  company_name: 'ASLENIX TECH AND SOLUTION',
  registration_no: 'REG-2080-9842',
  pan_vat_no: '123456789',
  address: 'Budhanagar, Kathmandu, Nepal',
  phone: '+977 1-4000000',
  email: 'contact@aslenix.com',
  website: 'https://aslenix.com',
  logo_url: '/logo.png',
  bank_name: 'Global IME Bank',
  bank_account_name: 'ASLENIX TECH AND SOLUTION',
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
      return { ...DEFAULT_COMPANY_SETTINGS, ...JSON.parse(saved) };
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
          // Merge db record without overwriting local custom logo if db doesn't store logo
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
    // Reset save status on edit
    if (saveStatus !== 'idle') {
      setSaveStatus('idle');
    }
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

          // Generate PNG or WebP data URL
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
    if (window.confirm('Reset all company settings and logo back to default values?')) {
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
      // 1. Immediately persist to localStorage
      localStorage.setItem('aslenix_company_settings', JSON.stringify(formData));
      
      // Dispatch custom event for real-time sync with Header, Invoice creation, etc.
      window.dispatchEvent(new CustomEvent('company_settings_updated', { detail: formData }));

      // 2. Attempt sync with Supabase company_settings table (excluding logo_url which is stored locally)
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
        // Fallback is graceful since localStorage is primary client state
        console.warn('Supabase sync note (localStorage active):', dbErr);
      }

      setSaveStatus('success');
      setStatusMessage('Company settings saved successfully! All invoices and reports updated.');
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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-16">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-bold text-primary tracking-tight">Company Profile & Settings</h2>
          <p className="text-slate-500 text-sm mt-1">Manage your official company information for invoices, salary slips, and reports.</p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
            title="Reset to default company configuration"
          >
            <RefreshCw size={14} />
            Reset Defaults
          </button>
          
          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover active:scale-95 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
          >
            <Save size={16} />
            {isSaving ? 'Saving Changes...' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* Status Alert Banner */}
      {saveStatus === 'success' && (
        <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-emerald-800 text-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5 font-medium">
            <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          <span className="text-xs text-emerald-600 font-normal">Stored persistently</span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-rose-800 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} className="text-rose-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Left Columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-accent/10 text-accent rounded-xl">
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary">Basic Information</h3>
                  <p className="text-xs text-slate-400">Official business name and legal registration details</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Company Name *</label>
                  <input 
                    type="text" 
                    value={formData.company_name}
                    onChange={(e) => handleChange('company_name', e.target.value)}
                    required
                    placeholder="e.g. ASLENIX TECH AND SOLUTION"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Registration Number</label>
                  <input 
                    type="text" 
                    value={formData.registration_no}
                    onChange={(e) => handleChange('registration_no', e.target.value)}
                    placeholder="Enter Registration No." 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">PAN / VAT Number</label>
                  <input 
                    type="text" 
                    value={formData.pan_vat_no}
                    onChange={(e) => handleChange('pan_vat_no', e.target.value)}
                    placeholder="Enter PAN No." 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* Contact Details */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-accent/10 text-accent rounded-xl">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary">Contact Details</h3>
                  <p className="text-xs text-slate-400">Headquarters location and official communication channels</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Registered Address</label>
                  <textarea 
                    value={formData.address}
                    onChange={(e) => handleChange('address', e.target.value)}
                    rows={2} 
                    placeholder="e.g. Budhanagar, Kathmandu, Nepal"
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" /> Phone Number
                  </label>
                  <input 
                    type="text" 
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="+977..." 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Mail size={14} className="text-slate-400" /> Email Address
                  </label>
                  <input 
                    type="email" 
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="contact@company.com" 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <Globe size={14} className="text-slate-400" /> Website
                  </label>
                  <input 
                    type="url" 
                    value={formData.website}
                    onChange={(e) => handleChange('website', e.target.value)}
                    placeholder="https://www..." 
                    className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" 
                  />
                </div>
              </div>
            </div>

            {/* Terms and Invoice Footer */}
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-accent/10 text-accent rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary">Invoice Terms & Policy</h3>
                  <p className="text-xs text-slate-400">Default payment terms printed at the bottom of generated invoices</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Terms & Conditions</label>
                <textarea 
                  value={formData.terms_conditions}
                  onChange={(e) => handleChange('terms_conditions', e.target.value)}
                  rows={3} 
                  placeholder="Enter invoice terms and conditions..."
                  className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Right Sidebar Columns */}
          <div className="space-y-6">
            {/* Logo Upload Card */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-4">
                <h4 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <ImageIcon size={16} className="text-accent" /> Company Logo
                </h4>
                {formData.logo_url && formData.logo_url !== '/logo.png' && (
                  <button
                    type="button"
                    onClick={() => handleChange('logo_url', '/logo.png')}
                    className="text-xs text-rose-500 hover:text-rose-700 font-medium flex items-center gap-1 transition-colors"
                    title="Revert to default logo"
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
                className={`w-36 h-36 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-3 text-center cursor-pointer transition-all duration-200 group relative overflow-hidden ${
                  isDragging 
                    ? 'border-accent bg-accent/10 scale-102' 
                    : 'border-slate-200 bg-slate-50/70 hover:bg-slate-100/70 hover:border-slate-300'
                }`}
                title="Click or drag an image here to upload logo"
              >
                {formData.logo_url ? (
                  <div className="w-full h-full flex flex-col items-center justify-center">
                    <img 
                      src={formData.logo_url} 
                      alt="Company Logo Preview" 
                      className="max-h-24 max-w-full object-contain group-hover:opacity-60 transition-opacity" 
                    />
                    <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl backdrop-blur-[2px]">
                      <Upload size={20} className="mb-1" />
                      <span className="text-[11px] font-medium">Change Logo</span>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload size={24} className="mb-2 text-slate-400 group-hover:text-accent transition-colors" />
                    <span className="text-xs font-semibold text-slate-600">Upload Logo</span>
                    <span className="text-[10px] text-slate-400 mt-1">Drag & drop here</span>
                  </>
                )}
              </div>

              <p className="text-xs text-center text-slate-400 mt-3 mb-4 leading-relaxed">
                Recommended size: 256×256px or 512×512px. PNG, JPG, or WebP.
              </p>

              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-xl text-xs border border-slate-200 transition-all flex items-center justify-center gap-2 active:scale-98"
              >
                <Upload size={14} />
                {formData.logo_url ? 'Replace Logo' : 'Select Image'}
              </button>
            </div>

            {/* Bank Details */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-accent/10 text-accent rounded-xl">
                  <Landmark size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary">Bank Details</h3>
                  <p className="text-xs text-slate-400">Account info for customer wire transfers</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Bank Name</label>
                  <input 
                    type="text" 
                    value={formData.bank_name}
                    onChange={(e) => handleChange('bank_name', e.target.value)}
                    placeholder="e.g. Global IME Bank"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Account Name</label>
                  <input 
                    type="text" 
                    value={formData.bank_account_name}
                    onChange={(e) => handleChange('bank_account_name', e.target.value)}
                    placeholder="e.g. ASLENIX TECH AND SOLUTION"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Account Number</label>
                  <input 
                    type="text" 
                    value={formData.bank_account_no}
                    onChange={(e) => handleChange('bank_account_no', e.target.value)}
                    placeholder="e.g. 01234567890123"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Branch</label>
                  <input 
                    type="text" 
                    value={formData.bank_branch}
                    onChange={(e) => handleChange('bank_branch', e.target.value)}
                    placeholder="e.g. Baneshwor Branch"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" 
                  />
                </div>
              </div>
            </div>
            
            {/* Billing Defaults */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-accent/10 text-accent rounded-xl">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-primary">Billing Defaults</h3>
                  <p className="text-xs text-slate-400">Default invoice numbering and VAT settings</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Fiscal Year</label>
                  <select 
                    value={formData.fiscal_year}
                    onChange={(e) => handleChange('fiscal_year', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                  >
                    <option value="2081/82">2081/82</option>
                    <option value="2082/83">2082/83</option>
                    <option value="2083/84">2083/84</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Invoice Prefix</label>
                  <input 
                    type="text" 
                    value={formData.invoice_prefix}
                    onChange={(e) => handleChange('invoice_prefix', e.target.value)}
                    placeholder="e.g. ASL-"
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">Default Tax Rate (%)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="0"
                    max="100"
                    value={formData.default_tax_rate}
                    onChange={(e) => handleChange('default_tax_rate', parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Floating / Bottom Save Bar */}
        <div className="mt-8 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-400">
            All modifications will persist across reloads and sync automatically with your invoices and salary slips.
          </p>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              type="button"
              onClick={handleResetToDefault}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Reset
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-7 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold hover:bg-accent-hover transition-all shadow-sm active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {isSaving ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CompanySettings;
