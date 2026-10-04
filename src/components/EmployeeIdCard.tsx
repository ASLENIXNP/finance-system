import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Calendar, 
  CreditCard, 
  Edit3, 
  Trash2, 
  Camera, 
  QrCode, 
  ChevronDown, 
  ChevronUp, 
  ZoomIn 
} from 'lucide-react';
import type { Employee } from '../pages/Payroll';
import { getStoredCompanySettings, type CompanySettingsData } from '../pages/CompanySettings';

interface EmployeeIdCardProps {
  employee: Employee;
  companySettings?: CompanySettingsData;
  onCalculateSalary?: (emp: Employee) => void;
  onEdit?: (emp: Employee) => void;
  onDelete?: (emp: Employee) => void;
  onViewBadge?: (emp: Employee) => void;
  onUploadPhoto?: (empId: string, file: File) => void;
  onZoomPhoto?: (emp: Employee, photoSrc: string) => void;
  isPrintOnly?: boolean;
}

export const EmployeeIdCard: React.FC<EmployeeIdCardProps> = ({
  employee,
  companySettings,
  onCalculateSalary,
  onEdit,
  onDelete,
  onViewBadge,
  onUploadPhoto,
  onZoomPhoto,
  isPrintOnly = false,
}) => {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showFullDetails, setShowFullDetails] = useState<boolean>(false);
  const settings = companySettings || getStoredCompanySettings();

  // Generate real scannable QR Code containing official employee verification credentials
  useEffect(() => {
    let isMounted = true;
    const verificationPayload = JSON.stringify({
      org: settings.company_name || 'ASLENIX TECH AND SOLUTION',
      id: employee.employee_code,
      name: employee.name,
      role: employee.designation,
      dept: employee.department,
      email: employee.email,
      status: employee.is_active ? 'ACTIVE' : 'INACTIVE',
      sys: 'ASLENIX_DIGITAL_ID'
    });

    QRCode.toDataURL(verificationPayload, {
      width: 200,
      margin: 1,
      color: {
        dark: '#0f172a',
        light: '#ffffff'
      },
      errorCorrectionLevel: 'M'
    })
      .then((url) => {
        if (isMounted) setQrCodeUrl(url);
      })
      .catch((err) => console.error('Error generating QR Code:', err));

    return () => {
      isMounted = false;
    };
  }, [employee, settings.company_name]);

  const photoSrc = employee.photo_url && employee.photo_url.trim() !== '' ? employee.photo_url : '';

  return (
    <div 
      className={`relative bg-gradient-to-b from-[#f3f4fd] via-[#f7f8fe] to-white border border-[#e0e3f5] rounded-[28px] sm:rounded-[32px] p-6 sm:p-7 shadow-[0_8px_30px_rgba(224,228,248,0.4)] transition-all duration-300 ${
        isPrintOnly 
          ? 'w-full max-w-[380px] mx-auto shadow-none print:shadow-none print:border-slate-300' 
          : 'hover:shadow-[0_12px_40px_rgba(200,208,245,0.65)] hover:-translate-y-1 hover:border-indigo-300/80 group'
      }`}
    >
      {/* 1. TOP HEADER: BRAND LOGO & ACTIVE BADGE */}
      <div className="flex items-center justify-between gap-3">
        {/* Left: Aslenix Brand Logo */}
        <div className="flex items-center gap-2.5">
          <img 
            src={settings.logo_url || '/logo.png'} 
            alt="Company Logo" 
            className="h-8 sm:h-9 w-auto object-contain shrink-0 drop-shadow-xs" 
          />
          <div className="flex flex-col">
            <span className="text-[13px] sm:text-[14px] font-black tracking-[0.08em] text-slate-900 uppercase leading-none">
              {settings.company_name ? settings.company_name.split(' ')[0] : 'ASLENIX'}
            </span>
            <span className="text-[8px] sm:text-[8.5px] font-bold tracking-[0.24em] text-slate-600 uppercase mt-1 leading-none">
              {settings.company_name ? settings.company_name.split(' ').slice(1).join(' ') || 'TECH & SOLUTION' : 'TECH & SOLUTION'}
            </span>
          </div>
        </div>

        {/* Right: Pill Badge ACTIVE / INACTIVE */}
        <span 
          className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider shrink-0 transition-all ${
            employee.is_active 
              ? 'bg-[#bbf7d0]/80 text-[#15803d] border border-emerald-300/40 shadow-2xs' 
              : 'bg-slate-200/90 text-slate-600 border border-slate-300/50 shadow-2xs'
          }`}
        >
          {employee.is_active ? 'ACTIVE' : 'INACTIVE'}
        </span>
      </div>

      {/* 2. PROFILE SECTION: CIRCULAR PHOTO, NAME, ROLE & DEPARTMENT */}
      <div className="flex items-center gap-4 mt-6">
        {/* Circular Profile Avatar */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden ring-2 ring-indigo-200/90 ring-offset-2 ring-offset-white shadow-sm bg-slate-100 flex items-center justify-center relative group/avatar">
            {photoSrc ? (
              <img 
                src={photoSrc} 
                alt={employee.name} 
                onClick={() => onZoomPhoto?.(employee, photoSrc)}
                style={{ 
                  imageRendering: '-webkit-optimize-contrast',
                  filter: 'contrast(1.06) brightness(1.02)'
                }}
                className="w-full h-full object-cover object-center cursor-pointer transition-transform duration-300 group-hover/avatar:scale-105" 
                title="Click to zoom HD profile photo"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-slate-200 flex items-center justify-center text-indigo-700 font-bold text-base">
                {employee.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
              </div>
            )}

            {/* Quick hover overlay to change photo or sharpen (only in interactive mode) */}
            {!isPrintOnly && (
              <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/avatar:opacity-100 transition-opacity rounded-full flex items-center justify-center gap-1 backdrop-blur-2xs">
                {photoSrc && onZoomPhoto && (
                  <button
                    type="button"
                    onClick={() => onZoomPhoto(employee, photoSrc)}
                    title="Zoom full photo"
                    className="p-1 bg-white/20 hover:bg-white/40 text-white rounded-full transition-colors"
                  >
                    <ZoomIn size={11} />
                  </button>
                )}
                {onUploadPhoto && (
                  <label 
                    title="Upload photo"
                    className="p-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full cursor-pointer transition-colors"
                  >
                    <Camera size={11} />
                    <input 
                      type="file" 
                      accept="image/*" 
                      className="hidden" 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onUploadPhoto(employee.id, file);
                      }} 
                    />
                  </label>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Name & Title */}
        <div className="min-w-0 flex-1">
          <h3 
            className="text-base sm:text-lg font-bold text-slate-900 tracking-tight leading-snug line-clamp-1"
            title={employee.name}
          >
            {employee.name}
          </h3>
          <p className="text-xs sm:text-sm font-medium text-slate-500 mt-0.5 line-clamp-1">
            {employee.designation || 'Staff'}
          </p>
          <p className="text-xs font-normal text-slate-400 mt-0.5 line-clamp-1">
            {employee.department || 'General'}
          </p>
        </div>
      </div>

      {/* 3. LOWER CREDENTIALS & SCANNABLE QR CODE */}
      <div className="flex items-center justify-between gap-3 mt-6 pt-1">
        {/* Left: Employee ID & Email */}
        <div className="min-w-0 flex-1 space-y-3">
          <div>
            <span className="text-[9px] sm:text-[9.5px] font-bold tracking-[0.14em] text-slate-400 uppercase block">
              EMPLOYEE ID
            </span>
            <span className="text-sm sm:text-base font-bold font-mono text-slate-900 mt-0.5 block tracking-tight">
              {employee.employee_code}
            </span>
          </div>

          <div>
            <span className="text-[9px] sm:text-[9.5px] font-bold tracking-[0.14em] text-slate-400 uppercase block">
              EMAIL
            </span>
            <span 
              className="text-[11px] sm:text-xs font-medium text-slate-600 truncate block mt-0.5 max-w-[155px]"
              title={employee.email}
            >
              {employee.email || 'N/A'}
            </span>
          </div>
        </div>

        {/* Right: Crisp Scannable QR Code */}
        <div className="shrink-0 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-center">
          {qrCodeUrl ? (
            <img 
              src={qrCodeUrl} 
              alt={`QR Code for ${employee.employee_code}`} 
              className="w-24 h-24 sm:w-26 sm:h-26 object-contain rounded-xl"
              title="Scan with camera for digital employee verification"
            />
          ) : (
            <div className="w-24 h-24 sm:w-26 sm:h-26 bg-slate-50 rounded-xl flex items-center justify-center animate-pulse">
              <QrCode size={24} className="text-slate-300" />
            </div>
          )}
        </div>
      </div>

      {/* 4. FOOTER IDENTIFIER */}
      <div className="text-center mt-5 pt-2">
        <p className="text-[9px] sm:text-[9.5px] font-bold tracking-[0.24em] text-slate-400 uppercase">
          {settings.company_name ? settings.company_name.split(' ')[0] : 'ASLENIX'} • DIGITAL EMPLOYEE ID
        </p>
      </div>

      {/* 5. INTERACTIVE ACTIONS (Only rendered in card grid, omitted in print badge) */}
      {!isPrintOnly && (
        <div className="mt-4 pt-4 border-t border-indigo-100/70 space-y-3">
          {/* Quick Salary Pill */}
          <div className="flex items-center justify-between bg-white/80 backdrop-blur-xs px-3.5 py-2 rounded-xl border border-slate-200/70 text-xs">
            <span className="text-slate-500 font-medium flex items-center gap-1.5">
              <CreditCard size={13} className="text-emerald-600" />
              Fixed Monthly Salary:
            </span>
            <span className="font-mono font-bold text-slate-900">
              Rs. {employee.fixed_salary.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onCalculateSalary?.(employee)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow-md transition-all active:scale-[0.98] cursor-pointer"
              title="Calculate Attendance & Salary for this Employee"
            >
              <Calendar size={14} />
              <span>Calculate Salary</span>
            </button>

            {onViewBadge && (
              <button
                type="button"
                onClick={() => onViewBadge(employee)}
                className="p-2.5 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100/80 rounded-xl transition-colors border border-indigo-200/80 cursor-pointer shadow-2xs"
                title="View Full Digital ID Badge & Print"
              >
                <QrCode size={15} />
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(employee)}
                className="p-2.5 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/80 cursor-pointer shadow-2xs"
                title="Edit Employee Information"
              >
                <Edit3 size={14} />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(employee)}
                className="p-2.5 text-rose-500 hover:text-rose-700 bg-white hover:bg-rose-50 rounded-xl transition-colors border border-rose-200/80 cursor-pointer shadow-2xs"
                title="Delete Employee"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>

          {/* Expandable Banking & Statutory Details */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="w-full flex items-center justify-center gap-1 py-1 text-[11px] font-semibold text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
            >
              <span>{showFullDetails ? 'Hide Banking & PAN' : 'View Bank & PAN Details'}</span>
              {showFullDetails ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showFullDetails && (
              <div className="mt-2 p-3 bg-white/90 rounded-xl border border-slate-200/80 text-xs space-y-1.5 animate-in fade-in slide-in-from-top-1">
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Phone:</span>
                  <span className="font-medium text-slate-800 font-mono">{employee.phone || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Bank:</span>
                  <span className="font-medium text-slate-800 truncate max-w-[180px]">
                    {employee.bank_name} {employee.bank_account_no ? `(••••${employee.bank_account_no.slice(-4)})` : ''}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">PAN:</span>
                  <span className="font-mono font-semibold text-slate-800">{employee.pan_number || 'N/A'}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span className="text-slate-400">Joined:</span>
                  <span className="font-medium text-slate-800">{employee.joining_date} BS</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeIdCard;
