import { Save, Building2, MapPin, Phone, Mail, Globe, Landmark, FileText, Upload } from 'lucide-react';

const CompanySettings = () => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-primary">Company Profile & Settings</h2>
        <p className="text-slate-500 text-sm mt-1">Manage your official company information for invoices and reports.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent/10 text-accent rounded-lg">
                <Building2 size={20} />
              </div>
              <h3 className="text-lg font-semibold text-primary">Basic Information</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Company Name</label>
                <input type="text" defaultValue="ASLENIX TECH AND SOLUTION" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Registration Number</label>
                <input type="text" placeholder="Enter Registration No." className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">PAN / VAT Number</label>
                <input type="text" placeholder="Enter PAN No." className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent/10 text-accent rounded-lg">
                <MapPin size={20} />
              </div>
              <h3 className="text-lg font-semibold text-primary">Contact Details</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2">Registered Address</label>
                <textarea defaultValue="Budhanagar, Kathmandu, Nepal" rows={2} className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2"><Phone size={14} className="text-slate-400" /> Phone Number</label>
                <input type="text" placeholder="+977..." className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2"><Mail size={14} className="text-slate-400" /> Email Address</label>
                <input type="email" placeholder="contact@company.com" className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2"><Globe size={14} className="text-slate-400" /> Website</label>
                <input type="url" placeholder="https://www..." className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col items-center">
             <div className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400 mb-4 cursor-pointer hover:bg-slate-100 hover:border-slate-300 transition-colors">
               <Upload size={24} className="mb-2" />
               <span className="text-xs font-medium">Upload Logo</span>
             </div>
             <p className="text-xs text-center text-slate-500 mb-4">Recommended size: 256x256px. PNG or JPG format.</p>
             <button className="w-full py-2 bg-slate-50 text-slate-700 font-medium rounded-lg text-sm border border-slate-200 hover:bg-slate-100 transition-colors">
               Select Image
             </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent/10 text-accent rounded-lg">
                <Landmark size={20} />
              </div>
              <h3 className="text-lg font-semibold text-primary">Bank Details</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Bank Name</label>
                <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Account Name</label>
                <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Account Number</label>
                <input type="text" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-accent/10 text-accent rounded-lg">
                <FileText size={20} />
              </div>
              <h3 className="text-lg font-semibold text-primary">Billing Defaults</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Fiscal Year</label>
                <select className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent">
                  <option>2082/83</option>
                  <option>2083/84</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Invoice Prefix</label>
                <input type="text" defaultValue="ASL-" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Default Tax Rate (%)</label>
                <input type="number" defaultValue="13" className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end">
        <button className="flex items-center gap-2 px-6 py-2.5 bg-accent text-white rounded-xl font-medium hover:bg-accent-hover transition-colors shadow-sm">
          <Save size={18} />
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default CompanySettings;
