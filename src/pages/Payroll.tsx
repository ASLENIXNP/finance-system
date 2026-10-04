import { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Banknote, 
  Calendar, 
  Printer, 
  CheckCircle2, 
  Clock, 
  Building2, 
  DollarSign, 
  CreditCard, 
  FileText, 
  UserCheck, 
  Edit, 
  Trash2, 
  Check, 
  UserPlus, 
  Percent,
  Receipt,
  User,
  Mail,
  Phone,
  Landmark,
  ShieldCheck,
  X,
  Briefcase,
  Hash,
  Camera,
  Upload,
  List,
  Copy,
  ZoomIn,
  Download,
  Loader2,
  QrCode
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import { NepaliDatePicker } from '../components/NepaliDatePicker';
import { formatNepaliDate, getTodayBsDate } from '../lib/nepaliDate';
import { EmployeeIdCard } from '../components/EmployeeIdCard';

export interface Employee {
  id: string;
  employee_code: string;
  name: string;
  designation: string;
  department: string;
  email: string;
  phone: string;
  pan_number: string;
  fixed_salary: number; // Monthly base salary fixed by accountant
  bank_name: string;
  bank_account_no: string;
  bank_branch: string;
  joining_date: string;
  is_active: boolean;
  photo_url?: string;
  notes?: string;
}

const DEFAULT_WORKING_DAYS = 30;

export interface PayrollRecord {
  id: string;
  payroll_ref: string;
  employee_id: string;
  employee_code: string;
  employee_name: string;
  designation: string;
  department: string;
  month: string;
  year: number;
  total_working_days: number; // Default 30, admin editable
  present_days: number;       // 1 full day each
  half_days: number;          // 0.5 day each; 2 half days = 1 full day
  absent_days: number;        // total_working_days - present_days - (half_days * 0.5)
  effective_days: number;     // present_days + (half_days * 0.5)
  fixed_salary: number;       // Fixed Monthly Salary
  per_day_rate: number;       // fixed_salary / total_working_days
  attendance_salary: number;  // per_day_rate * effective_days
  earned_salary: number;      // alias to attendance_salary for compatibility
  bonus_allowance: number;    // Allowances
  deductions: number;         // Other Deductions
  net_before_tds: number;     // attendance_salary + bonus_allowance - deductions
  tds_rate: number;           // 1% TDS rate
  tds_amount: number;         // net_before_tds * (tds_rate / 100)
  net_salary: number;         // Final Net Pay: net_before_tds - tds_amount
  payment_status: 'Unpaid' | 'Approved' | 'Paid';
  payment_date?: string;
  payment_method?: string;
  reference_no?: string;
  photo_url?: string;
  notes?: string;
}

/**
 * Exact Salary & Attendance Calculation Engine
 * 1. Working Days: Default 30, admin can adjust
 * 2. Effective Days = Present + (Half Days × 0.5)
 * 3. Absent Days = Total Working Days - Present - (Half Days × 0.5)
 * 4. Daily Rate = Fixed Salary ÷ Total Working Days
 * 5. Attendance Salary = Daily Rate × Effective Days
 * 6. Net Before TDS = Attendance Salary + Allowances - Other Deductions
 * 7. 1% TDS = Net Before TDS × 1%
 * 8. Final Net Pay = Net Before TDS - TDS
 */
export const calculatePayrollValues = (
  fixed_salary: number,
  workingDaysInput: number,
  presentInput: number,
  halfDaysInput: number,
  bonusInput: number = 0,
  deductionsInput: number = 0,
  applyTds: boolean = true,
  tdsPercent: number = 1
) => {
  const total_working_days = Math.max(1, Number(workingDaysInput) || DEFAULT_WORKING_DAYS);
  const present_days = Math.max(0, Number(presentInput) || 0);
  const half_days = Math.max(0, Number(halfDaysInput) || 0);

  // Effective Days = Present + (Half Days × 0.5)
  // 2 half days = 1 full working day
  const effective_days = present_days + (half_days * 0.5);

  // Absent Days = Total Working Days - Present - (Half Days × 0.5)
  // Prevents double-counting absences and half-days
  const absent_days = Math.max(0, Number((total_working_days - effective_days).toFixed(2)));

  // Daily Rate = Fixed Salary ÷ Total Working Days
  const per_day_rate = fixed_salary / total_working_days;

  // Attendance-Based Salary = Daily Rate × Effective Days
  const attendance_salary = per_day_rate * effective_days;

  const bonus_allowance = Math.max(0, Number(bonusInput) || 0);
  const deductions = Math.max(0, Number(deductionsInput) || 0);

  // Net Before TDS = Attendance-Based Salary + Allowances - Other Deductions
  const net_before_tds = Math.max(0, attendance_salary + bonus_allowance - deductions);

  // 1% TDS = Net Before TDS × 1%
  const tds_amount = applyTds ? Number((net_before_tds * (tdsPercent / 100)).toFixed(2)) : 0;

  // Final Net Pay = Net Before TDS - TDS
  const net_salary = Math.max(0, Number((net_before_tds - tds_amount).toFixed(2)));

  return {
    fixed_salary: Number(fixed_salary) || 0,
    total_working_days,
    present_days,
    half_days,
    absent_days,
    effective_days: Number(effective_days.toFixed(2)),
    per_day_rate: Number(per_day_rate.toFixed(2)),
    attendance_salary: Number(attendance_salary.toFixed(2)),
    earned_salary: Number(attendance_salary.toFixed(2)),
    bonus_allowance,
    deductions,
    net_before_tds: Number(net_before_tds.toFixed(2)),
    tds_rate: tdsPercent,
    tds_amount,
    net_salary,
  };
};

const optimizeProfilePhoto = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Could not read the selected profile photo.'));
    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('The selected profile photo could not be loaded.'));
        return;
      }

      const image = new Image();
      image.onerror = () => reject(new Error('The selected file is not a valid image.'));
      image.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 600;
        canvas.width = size;
        canvas.height = size;
        const context = canvas.getContext('2d');
        if (!context) {
          reject(new Error('Could not prepare the selected profile photo.'));
          return;
        }

        const cropSize = Math.min(image.naturalWidth, image.naturalHeight);
        const cropX = (image.naturalWidth - cropSize) / 2;
        const cropY = (image.naturalHeight - cropSize) / 2;
        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'high';
        context.drawImage(image, cropX, cropY, cropSize, cropSize, 0, 0, size, size);
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
};

export const getEmployeePhoto = (emp: { name: string; photo_url?: string }) => {
  if (emp.photo_url && emp.photo_url.trim() !== '') {
    return emp.photo_url;
  }
  return '';
};

const initialEmployees: Employee[] = [
  {
    id: 'ASL-001',
    employee_code: 'ASL-001',
    name: 'Aarav Sharma',
    designation: 'Senior Full Stack Engineer',
    department: 'Technology',
    email: 'aarav.sharma@aslenix.com',
    phone: '9841000001',
    pan_number: '609123456',
    fixed_salary: 75000,
    bank_name: 'Nabil Bank',
    bank_account_no: '01901017500123',
    bank_branch: 'Putalisadak',
    joining_date: '2081-10-01',
    is_active: true,
    photo_url: '',
  },
  {
    id: 'ASL-002',
    employee_code: 'ASL-002',
    name: 'Pooja Shrestha',
    designation: 'Lead Accountant',
    department: 'Finance',
    email: 'pooja.shrestha@aslenix.com',
    phone: '9841000002',
    pan_number: '608987654',
    fixed_salary: 60000,
    bank_name: 'Global IME Bank',
    bank_account_no: '04501010098765',
    bank_branch: 'New Baneshwor',
    joining_date: '2081-11-15',
    is_active: true,
    photo_url: '',
  },
  {
    id: 'ASL-003',
    employee_code: 'ASL-003',
    name: 'Rohan Adhikari',
    designation: 'UI/UX & Frontend Designer',
    department: 'Creative & Tech',
    email: 'rohan.adhikari@aslenix.com',
    phone: '9841000003',
    pan_number: '610543210',
    fixed_salary: 48000,
    bank_name: 'NIC Asia Bank',
    bank_account_no: '12405060708090',
    bank_branch: 'Thamel',
    joining_date: '2082-01-01',
    is_active: true,
    photo_url: '',
  },
  {
    id: 'ASL-004',
    employee_code: 'ASL-004',
    name: 'Sneha Karki',
    designation: 'Business Development Officer',
    department: 'Marketing',
    email: 'sneha.karki@aslenix.com',
    phone: '9841000004',
    pan_number: '611223344',
    fixed_salary: 38000,
    bank_name: 'Sanima Bank',
    bank_account_no: '08901234567890',
    bank_branch: 'Lalitpur',
    joining_date: '2082-03-01',
    is_active: true,
    photo_url: '',
  },
  {
    id: 'ASL-005',
    employee_code: 'ASL-005',
    name: 'Manish KC',
    designation: 'QA & Support Engineer',
    department: 'Technology',
    email: 'manish.kc@aslenix.com',
    phone: '9841000005',
    pan_number: '612345678',
    fixed_salary: 42000,
    bank_name: 'Everest Bank',
    bank_account_no: '00109988776655',
    bank_branch: 'Lazimpat',
    joining_date: '2082-05-15',
    is_active: true,
    photo_url: '',
  }
];

// Initial demo records calculated using the exact salary and 1% TDS rules
const initialPayrollRecords: PayrollRecord[] = [
  {
    id: 'PAY-2083-06-001',
    payroll_ref: 'PAY-2083-06-001',
    employee_id: 'ASL-001',
    employee_code: 'ASL-001',
    employee_name: 'Aarav Sharma',
    designation: 'Senior Full Stack Engineer',
    department: 'Technology',
    month: 'Ashwin',
    year: 2083,
    total_working_days: 30,
    present_days: 24,
    half_days: 2,
    absent_days: 1,
    effective_days: 25.0,
    fixed_salary: 75000,
    per_day_rate: 2884.62,
    attendance_salary: 72115.38,
    earned_salary: 72115.38,
    bonus_allowance: 2500,
    deductions: 1500,
    net_before_tds: 73115.38,
    tds_rate: 1,
    tds_amount: 731.15,
    net_salary: 72384.23,
    payment_status: 'Paid',
    payment_date: '2083-06-15',
    payment_method: 'Bank Transfer',
    reference_no: 'NBL-TXN-98442',
    notes: '24 present, 2 half days = 25 effective days. 1% TDS applied.'
  },
  {
    id: 'PAY-2083-06-002',
    payroll_ref: 'PAY-2083-06-002',
    employee_id: 'ASL-002',
    employee_code: 'ASL-002',
    employee_name: 'Pooja Shrestha',
    designation: 'Lead Accountant',
    department: 'Finance',
    month: 'Ashwin',
    year: 2083,
    total_working_days: 30,
    present_days: 25,
    half_days: 1,
    absent_days: 0.5,
    effective_days: 25.5,
    fixed_salary: 60000,
    per_day_rate: 2307.69,
    attendance_salary: 58846.15,
    earned_salary: 58846.15,
    bonus_allowance: 0,
    deductions: 0,
    net_before_tds: 58846.15,
    tds_rate: 1,
    tds_amount: 588.46,
    net_salary: 58257.69,
    payment_status: 'Approved',
    payment_date: undefined,
    payment_method: undefined,
    reference_no: undefined,
    notes: 'Approved by management. 1% TDS applied.'
  },
  {
    id: 'PAY-2083-06-003',
    payroll_ref: 'PAY-2083-06-003',
    employee_id: 'ASL-003',
    employee_code: 'ASL-003',
    employee_name: 'Rohan Adhikari',
    designation: 'UI/UX & Frontend Designer',
    department: 'Creative & Tech',
    month: 'Ashwin',
    year: 2083,
    total_working_days: 30,
    present_days: 23,
    half_days: 2,
    absent_days: 2,
    effective_days: 24.0,
    fixed_salary: 48000,
    per_day_rate: 1600.00,
    attendance_salary: 38400.00,
    earned_salary: 38400.00,
    bonus_allowance: 1000,
    deductions: 2000,
    net_before_tds: 39400.00,
    tds_rate: 1,
    tds_amount: 394.00,
    net_salary: 39006.00,
    payment_status: 'Unpaid',
    notes: 'Advance salary deduction Rs. 2,000. 1% TDS applied.'
  },
  {
    id: 'PAY-2083-06-004',
    payroll_ref: 'PAY-2083-06-004',
    employee_id: 'ASL-004',
    employee_code: 'ASL-004',
    employee_name: 'Sneha Karki',
    designation: 'Business Development Officer',
    department: 'Marketing',
    month: 'Ashwin',
    year: 2083,
    total_working_days: 30,
    present_days: 30,
    half_days: 0,
    absent_days: 0,
    effective_days: 30.0,
    fixed_salary: 38000,
    per_day_rate: 1461.54,
    attendance_salary: 38000.00,
    earned_salary: 38000.00,
    bonus_allowance: 3000,
    deductions: 0,
    net_before_tds: 41000.00,
    tds_rate: 1,
    tds_amount: 410.00,
    net_salary: 40590.00,
    payment_status: 'Paid',
    payment_date: '2083-06-15',
    payment_method: 'Bank Transfer',
    reference_no: 'SNM-TXN-55120',
    notes: '100% full attendance + marketing commission. 1% TDS applied.'
  }
];

const monthsList = [
  'Baishakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin',
  'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
];

const formatNPR = (amount: number) => {
  return `रु. ${amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const numberToWordsNepali = (num: number): string => {
  const rounded = Math.round(num);
  if (rounded === 0) return 'Zero Rupees Only';
  
  const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  function convertLessThanOneThousand(n: number): string {
    let current = '';
    if (n >= 100) {
      current += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      current += b[Math.floor(n / 10)] + ' ';
      n %= 10;
    }
    if (n > 0) {
      current += a[n] + ' ';
    }
    return current;
  }

  let words = '';
  let n = rounded;
  if (n >= 10000000) {
    words += convertLessThanOneThousand(Math.floor(n / 10000000)) + 'Crore ';
    n %= 10000000;
  }
  if (n >= 100000) {
    words += convertLessThanOneThousand(Math.floor(n / 100000)) + 'Lakh ';
    n %= 100000;
  }
  if (n >= 1000) {
    words += convertLessThanOneThousand(Math.floor(n / 1000)) + 'Thousand ';
    n %= 1000;
  }
  if (n > 0) {
    words += convertLessThanOneThousand(n);
  }
  return `Rupees ${words.trim()} Only`;
};

const Payroll = () => {
  const [activeTab, setActiveTab] = useState<'payroll' | 'employees'>('payroll');
  
  // Persistent state for Employees
  // Persistent state for Employees (with automatic migration from legacy EMP- to fixed ASL-)
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('aslenix_employees');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        let hasMigrated = false;
        const migrated: Employee[] = parsed.map((e: Employee, idx: number) => {
          const rawCode = e.employee_code || e.id || `ASL-${String(idx + 1).padStart(3, '0')}`;
          const cleanSuffix = rawCode.replace(/^(EMP|ASL)-?/i, '');
          const newCode = `ASL-${cleanSuffix || String(idx + 1).padStart(3, '0')}`;
          const newId = e.id?.startsWith('ASL-') ? e.id : (e.id?.startsWith('EMP-') ? e.id.replace(/^EMP-/i, 'ASL-') : newCode);
          if (newCode !== e.employee_code || newId !== e.id) {
            hasMigrated = true;
          }
          return {
            ...e,
            id: newId,
            employee_code: newCode,
          };
        });
        if (hasMigrated) {
          localStorage.setItem('aslenix_employees', JSON.stringify(migrated));
        }
        return migrated;
      } catch (err) {
        console.error('Error loading employees:', err);
      }
    }
    return initialEmployees;
  });

  // Strict deduplication helper: guarantees exactly 1 row per employee per (month + year)
  const deduplicatePayrollRecords = (records: PayrollRecord[]): PayrollRecord[] => {
    const map = new Map<string, PayrollRecord>();
    for (const r of records) {
      const empKey = r.employee_id || r.employee_code || r.employee_name;
      const key = `${empKey}_${r.month}_${r.year}`;
      // Later entry updates/overwrites earlier entry
      map.set(key, r);
    }
    return Array.from(map.values());
  };
  
  // Persistent state for Payroll Records with backward-compatible mapper and automatic deduplication
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => {
    const saved = localStorage.getItem('aslenix_payroll_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const mapped = parsed.map((r: any) => {
          const attendance_salary = r.attendance_salary ?? r.earned_salary ?? ((r.fixed_salary / (r.total_working_days || DEFAULT_WORKING_DAYS)) * (r.effective_days || 0));
          const net_before_tds = r.net_before_tds ?? (attendance_salary + (r.bonus_allowance || 0) - (r.deductions || 0));
          const tds_rate = r.tds_rate ?? 1;
          const tds_amount = r.tds_amount ?? Number((net_before_tds * (tds_rate / 100)).toFixed(2));
          const net_salary = r.tds_amount !== undefined ? r.net_salary : Math.max(0, Number((net_before_tds - tds_amount).toFixed(2)));
          const employee_id = (r.employee_id || '').replace(/^EMP-/i, 'ASL-');
          const employee_code = (r.employee_code || '').replace(/^EMP-/i, 'ASL-');
          return {
            ...r,
            employee_id,
            employee_code,
            attendance_salary: Number(attendance_salary.toFixed(2)),
            earned_salary: Number(attendance_salary.toFixed(2)),
            net_before_tds: Number(net_before_tds.toFixed(2)),
            tds_rate,
            tds_amount,
            net_salary
          };
        });
        // Deduplicate immediately on load so any existing duplicates in user storage are cleaned up!
        return deduplicatePayrollRecords(mapped);
      } catch (e) {
        console.error('Error loading payroll records:', e);
      }
    }
    return deduplicatePayrollRecords(initialPayrollRecords);
  });

  // Filters & Period
  const [selectedMonth, setSelectedMonth] = useState('Ashwin');
  const [selectedYear, setSelectedYear] = useState(2083);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [defaultWorkingDays, setDefaultWorkingDays] = useState(DEFAULT_WORKING_DAYS);

  // Modals
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [editingPayrollId, setEditingPayrollId] = useState<string | null>(null);
  
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingRecord, setPayingRecord] = useState<PayrollRecord | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    payment_date: getTodayBsDate(),
    payment_method: 'Bank Transfer',
    reference_no: '',
    record_in_expenses: true,
  });

  const [isPayslipModalOpen, setIsPayslipModalOpen] = useState(false);
  const [activePayslip, setActivePayslip] = useState<PayrollRecord | null>(null);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'payroll' | 'employee' } | null>(null);

  // Form states for Salary Calculation Modal
  const [salaryFormData, setSalaryFormData] = useState({
    employee_id: '',
    month: 'Ashwin',
    year: 2083,
    total_working_days: defaultWorkingDays,
    present_days: defaultWorkingDays,
    half_days: 0,
    bonus_allowance: 0,
    deductions: 0,
    apply_tds: true,
    tds_rate: 1,
    notes: ''
  });

  // Form states for Employee Profile Modal
  const [employeeFormData, setEmployeeFormData] = useState<Partial<Employee>>({
    name: '',
    employee_code: '',
    designation: '',
    department: 'Technology',
    email: '',
    phone: '',
    pan_number: '',
    fixed_salary: 40000,
    bank_name: 'Nabil Bank',
    bank_account_no: '',
    bank_branch: '',
    joining_date: getTodayBsDate(),
    is_active: true,
    photo_url: '',
    notes: ''
  });

  // Photo optimization, lightbox preview and clipboard states
  const [photoOptimizingId, setPhotoOptimizingId] = useState<string | null>(null);
  const [modalPhotoOptimizing, setModalPhotoOptimizing] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    isOpen: boolean;
    emp: Employee | null;
    photoSrc: string;
  }>({
    isOpen: false,
    emp: null,
    photoSrc: ''
  });

  const handleCopyCode = (id: string, code: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => {
      setCopiedCodeId((curr) => (curr === id ? null : curr));
    }, 2000);
  };

  // Employee Directory Filters & View Mode
  const [employeeViewMode, setEmployeeViewMode] = useState<'cards' | 'detailed' | 'table'>('cards');
  const [idCardModalEmp, setIdCardModalEmp] = useState<Employee | null>(null);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [employeeDeptFilter, setEmployeeDeptFilter] = useState('All');

  // Filtered employees for Employee Directory Tab
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const q = employeeSearchTerm.toLowerCase().trim();
      const matchesSearch = !q || (
        emp.name.toLowerCase().includes(q) ||
        emp.employee_code.toLowerCase().includes(q) ||
        emp.designation.toLowerCase().includes(q) ||
        emp.department.toLowerCase().includes(q) ||
        (emp.email && emp.email.toLowerCase().includes(q)) ||
        (emp.phone && emp.phone.includes(q)) ||
        (emp.pan_number && emp.pan_number.toLowerCase().includes(q)) ||
        (emp.bank_name && emp.bank_name.toLowerCase().includes(q))
      );
      const matchesDept = employeeDeptFilter === 'All' || emp.department === employeeDeptFilter;
      return matchesSearch && matchesDept;
    });
  }, [employees, employeeSearchTerm, employeeDeptFilter]);

  // Save to localStorage
  const saveEmployees = (updated: Employee[]) => {
    setEmployees(updated);
    localStorage.setItem('aslenix_employees', JSON.stringify(updated));
  };

  const savePayrollRecords = (updated: PayrollRecord[]) => {
    const cleanList = deduplicatePayrollRecords(updated);
    setPayrollRecords(cleanList);
    localStorage.setItem('aslenix_payroll_records', JSON.stringify(cleanList));
  };

  // Filtered Payroll Records for Selected Period: guaranteed strictly 1 row per employee
  const periodPayrollRecords = useMemo(() => {
    const periodList = payrollRecords.filter(record => 
      record.month === selectedMonth && 
      record.year === selectedYear
    );
    return deduplicatePayrollRecords(periodList);
  }, [payrollRecords, selectedMonth, selectedYear]);

  const displayedPayroll = useMemo(() => {
    return periodPayrollRecords.filter(record => {
      const matchesSearch = 
        record.employee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employee_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.designation.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = departmentFilter === 'All' || record.department === departmentFilter;
      const matchesStatus = statusFilter === 'All' || record.payment_status === statusFilter;
      
      return matchesSearch && matchesDept && matchesStatus;
    });
  }, [periodPayrollRecords, searchTerm, departmentFilter, statusFilter]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    const totalPayroll = periodPayrollRecords.reduce((acc, curr) => acc + curr.net_salary, 0);
    const totalAttendanceSalary = periodPayrollRecords.reduce((acc, curr) => acc + curr.attendance_salary, 0);
    const totalTds = periodPayrollRecords.reduce((acc, curr) => acc + curr.tds_amount, 0);
    const totalPaid = periodPayrollRecords
      .filter(r => r.payment_status === 'Paid')
      .reduce((acc, curr) => acc + curr.net_salary, 0);
    const pendingPayout = totalPayroll - totalPaid;

    const totalWorkingDaysSum = periodPayrollRecords.reduce((acc, curr) => acc + curr.total_working_days, 0);
    const totalEffectiveDaysSum = periodPayrollRecords.reduce((acc, curr) => acc + curr.effective_days, 0);
    const avgAttendance = totalWorkingDaysSum > 0 
      ? ((totalEffectiveDaysSum / totalWorkingDaysSum) * 100).toFixed(1) 
      : '0.0';

    return {
      totalPayroll,
      totalAttendanceSalary,
      totalTds,
      totalPaid,
      pendingPayout,
      recordCount: periodPayrollRecords.length,
      activeEmployeesCount: employees.filter(e => e.is_active).length,
      avgAttendance
    };
  }, [periodPayrollRecords, employees]);

  // Departments list for filters
  const departments = useMemo(() => {
    const set = new Set(employees.map(e => e.department));
    return ['All', ...Array.from(set)];
  }, [employees]);

  // Real-time calculation helpers for the Salary Modal using exact rules
  const calculatedSalaryDetails = useMemo(() => {
    const selectedEmp = employees.find(e => e.id === salaryFormData.employee_id);
    const fixed_salary = selectedEmp ? selectedEmp.fixed_salary : 0;
    
    return {
      selectedEmp,
      ...calculatePayrollValues(
        fixed_salary,
        salaryFormData.total_working_days,
        salaryFormData.present_days,
        salaryFormData.half_days,
        salaryFormData.bonus_allowance,
        salaryFormData.deductions,
        salaryFormData.apply_tds,
        salaryFormData.tds_rate
      )
    };
  }, [salaryFormData, employees]);

  // Open modal to add or edit salary record
  const handleOpenSalaryModal = (record?: PayrollRecord, empId?: string) => {
    if (record) {
      setEditingPayrollId(record.id);
      setSalaryFormData({
        employee_id: record.employee_id,
        month: record.month,
        year: record.year,
        total_working_days: record.total_working_days,
        present_days: record.present_days,
        half_days: record.half_days,
        bonus_allowance: record.bonus_allowance,
        deductions: record.deductions,
        apply_tds: record.tds_rate > 0,
        tds_rate: record.tds_rate || 1,
        notes: record.notes || ''
      });
    } else {
      const targetEmpId = empId || (employees.length > 0 ? employees[0].id : '');
      // Check if this employee ALREADY has a payroll record for the selected month and year
      const existing = payrollRecords.find(r => 
        (r.employee_id === targetEmpId || r.employee_code === targetEmpId) &&
        r.month === selectedMonth &&
        r.year === selectedYear
      );

      if (existing) {
        // Pre-fill existing record to update it in-place (no duplicate rows)
        setEditingPayrollId(existing.id);
        setSalaryFormData({
          employee_id: existing.employee_id,
          month: existing.month,
          year: existing.year,
          total_working_days: existing.total_working_days,
          present_days: existing.present_days,
          half_days: existing.half_days,
          bonus_allowance: existing.bonus_allowance,
          deductions: existing.deductions,
          apply_tds: existing.tds_rate > 0,
          tds_rate: existing.tds_rate || 1,
          notes: existing.notes || ''
        });
      } else {
        setEditingPayrollId(null);
        setSalaryFormData({
          employee_id: targetEmpId,
          month: selectedMonth,
          year: selectedYear,
          total_working_days: defaultWorkingDays,
          present_days: defaultWorkingDays,
          half_days: 0,
          bonus_allowance: 0,
          deductions: 0,
          apply_tds: true,
          tds_rate: 1,
          notes: ''
        });
      }
    }
    setIsSalaryModalOpen(true);
  };

  // Auto-detect existing record when changing employee in salary modal
  const handleEmployeeChangeInSalaryModal = (newEmpId: string) => {
    const existing = payrollRecords.find(r => 
      (r.employee_id === newEmpId || r.employee_code === newEmpId) &&
      r.month === salaryFormData.month &&
      r.year === salaryFormData.year
    );

    if (existing) {
      setEditingPayrollId(existing.id);
      setSalaryFormData(prev => ({
        ...prev,
        employee_id: newEmpId,
        total_working_days: existing.total_working_days,
        present_days: existing.present_days,
        half_days: existing.half_days,
        bonus_allowance: existing.bonus_allowance,
        deductions: existing.deductions,
        apply_tds: existing.tds_rate > 0,
        tds_rate: existing.tds_rate || 1,
        notes: existing.notes || ''
      }));
    } else {
      setEditingPayrollId(null);
      setSalaryFormData(prev => ({
        ...prev,
        employee_id: newEmpId,
        total_working_days: defaultWorkingDays,
        present_days: defaultWorkingDays,
        half_days: 0,
        bonus_allowance: 0,
        deductions: 0,
        apply_tds: true,
        tds_rate: 1,
        notes: ''
      }));
    }
  };

  // Auto-detect existing record when changing period in salary modal
  const handlePeriodChangeInSalaryModal = (newMonth: string, newYear: number) => {
    const existing = payrollRecords.find(r => 
      (r.employee_id === salaryFormData.employee_id || r.employee_code === salaryFormData.employee_id) &&
      r.month === newMonth &&
      r.year === newYear
    );

    if (existing) {
      setEditingPayrollId(existing.id);
      setSalaryFormData(prev => ({
        ...prev,
        month: newMonth,
        year: newYear,
        total_working_days: existing.total_working_days,
        present_days: existing.present_days,
        half_days: existing.half_days,
        bonus_allowance: existing.bonus_allowance,
        deductions: existing.deductions,
        apply_tds: existing.tds_rate > 0,
        tds_rate: existing.tds_rate || 1,
        notes: existing.notes || ''
      }));
    } else {
      setEditingPayrollId(null);
      setSalaryFormData(prev => ({
        ...prev,
        month: newMonth,
        year: newYear,
        total_working_days: defaultWorkingDays,
        present_days: defaultWorkingDays,
        half_days: 0,
        bonus_allowance: 0,
        deductions: 0,
        apply_tds: true,
        tds_rate: 1,
        notes: ''
      }));
    }
  };

  // Submit Salary calculation modal - ALWAYS updates existing employee record for that month/year (Upsert)
  const handleSaveSalaryRecord = (e?: React.FormEvent) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    const selectedEmp = employees.find(e => e.id === salaryFormData.employee_id);
    if (!selectedEmp) {
      alert('Please select a valid employee.');
      return;
    }

    const calc = calculatedSalaryDetails;

    // Look for existing record: by editingPayrollId OR by (employee_id/code + month + year)
    const existingIndex = payrollRecords.findIndex(item => 
      (editingPayrollId && item.id === editingPayrollId) ||
      ((item.employee_id === selectedEmp.id || item.employee_code === selectedEmp.employee_code) &&
        item.month === salaryFormData.month &&
        item.year === salaryFormData.year)
    );

    if (existingIndex >= 0) {
      // Update existing record in-place - GUARANTEE ONE ROW PER EMPLOYEE
      const existing = payrollRecords[existingIndex];
      const updatedRecord: PayrollRecord = {
        ...existing,
        employee_id: selectedEmp.id,
        employee_code: selectedEmp.employee_code,
        employee_name: selectedEmp.name,
        designation: selectedEmp.designation,
        department: selectedEmp.department,
        month: salaryFormData.month,
        year: salaryFormData.year,
        total_working_days: calc.total_working_days,
        present_days: calc.present_days,
        half_days: calc.half_days,
        absent_days: calc.absent_days,
        effective_days: calc.effective_days,
        fixed_salary: calc.fixed_salary,
        per_day_rate: calc.per_day_rate,
        attendance_salary: calc.attendance_salary,
        earned_salary: calc.attendance_salary,
        bonus_allowance: calc.bonus_allowance,
        deductions: calc.deductions,
        net_before_tds: calc.net_before_tds,
        tds_rate: calc.tds_rate,
        tds_amount: calc.tds_amount,
        net_salary: calc.net_salary,
        notes: salaryFormData.notes,
        payment_status: existing.payment_status || 'Unpaid'
      };

      const updatedList = [...payrollRecords];
      updatedList[existingIndex] = updatedRecord;

      // Filter out any other accidental duplicate rows for this employee in this month & year
      const cleanList = updatedList.filter((item, idx) => {
        if (
          (item.employee_id === selectedEmp.id || item.employee_code === selectedEmp.employee_code) &&
          item.month === salaryFormData.month &&
          item.year === salaryFormData.year
        ) {
          return idx === existingIndex;
        }
        return true;
      });

      savePayrollRecords(cleanList);
    } else {
      // Create single new record
      const newRef = `PAY-${salaryFormData.year}-${String(monthsList.indexOf(salaryFormData.month) + 1).padStart(2, '0')}-${String(payrollRecords.length + 1).padStart(3, '0')}`;
      const newRecord: PayrollRecord = {
        id: newRef,
        payroll_ref: newRef,
        employee_id: selectedEmp.id,
        employee_code: selectedEmp.employee_code,
        employee_name: selectedEmp.name,
        designation: selectedEmp.designation,
        department: selectedEmp.department,
        month: salaryFormData.month,
        year: salaryFormData.year,
        total_working_days: calc.total_working_days,
        present_days: calc.present_days,
        half_days: calc.half_days,
        absent_days: calc.absent_days,
        effective_days: calc.effective_days,
        fixed_salary: calc.fixed_salary,
        per_day_rate: calc.per_day_rate,
        attendance_salary: calc.attendance_salary,
        earned_salary: calc.attendance_salary,
        bonus_allowance: calc.bonus_allowance,
        deductions: calc.deductions,
        net_before_tds: calc.net_before_tds,
        tds_rate: calc.tds_rate,
        tds_amount: calc.tds_amount,
        net_salary: calc.net_salary,
        payment_status: 'Unpaid',
        notes: salaryFormData.notes
      };
      savePayrollRecords([newRecord, ...payrollRecords]);
    }

    setIsSalaryModalOpen(false);
  };

  // Open Employee Modal
  const handleOpenEmployeeModal = (emp?: Employee) => {
    if (emp) {
      setEditingEmployeeId(emp.id);
      const cleanSuffix = (emp.employee_code || emp.id || '').replace(/^(EMP|ASL)-?/i, '');
      setEmployeeFormData({ 
        ...emp,
        employee_code: `ASL-${cleanSuffix}`,
        photo_url: emp.photo_url || ''
      });
    } else {
      setEditingEmployeeId(null);
      const nextCode = `ASL-${String(employees.length + 1).padStart(3, '0')}`;
      setEmployeeFormData({
        name: '',
        employee_code: nextCode,
        designation: '',
        department: 'Technology',
        email: '',
        phone: '',
        pan_number: '',
        fixed_salary: 40000,
        bank_name: 'Nabil Bank',
        bank_account_no: '',
        bank_branch: 'Kathmandu',
        joining_date: getTodayBsDate(),
        is_active: true,
        photo_url: '',
        notes: ''
      });
    }
    setIsEmployeeModalOpen(true);
  };

  // Save Employee Profile & Fixed Salary
  const handleSaveEmployee = (e?: React.FormEvent) => {
    if (e?.preventDefault) {
      e.preventDefault();
    }
    if (!employeeFormData.name || !employeeFormData.designation) {
      alert('Name and designation are required.');
      return;
    }

    const cleanSuffix = (employeeFormData.employee_code || '').replace(/^(EMP|ASL)-?/i, '').trim();
    const finalCode = `ASL-${cleanSuffix || String(employees.length + 1).padStart(3, '0')}`;

    if (editingEmployeeId) {
      const updated = employees.map(emp => {
        if (emp.id === editingEmployeeId) {
          return {
            ...emp,
            ...(employeeFormData as Employee),
            employee_code: finalCode,
            fixed_salary: Number(employeeFormData.fixed_salary) || 0,
            photo_url: employeeFormData.photo_url ?? emp.photo_url
          };
        }
        return emp;
      });
      saveEmployees(updated);
    } else {
      const newEmp: Employee = {
        id: finalCode,
        employee_code: finalCode,
        name: employeeFormData.name || '',
        designation: employeeFormData.designation || '',
        department: employeeFormData.department || 'General',
        email: employeeFormData.email || '',
        phone: employeeFormData.phone || '',
        pan_number: employeeFormData.pan_number || '',
        fixed_salary: Number(employeeFormData.fixed_salary) || 0,
        bank_name: employeeFormData.bank_name || 'Nabil Bank',
        bank_account_no: employeeFormData.bank_account_no || '',
        bank_branch: employeeFormData.bank_branch || '',
        joining_date: employeeFormData.joining_date || getTodayBsDate(),
        is_active: employeeFormData.is_active ?? true,
        photo_url: employeeFormData.photo_url || '',
        notes: employeeFormData.notes || ''
      };
      saveEmployees([...employees, newEmp]);
    }

    setIsEmployeeModalOpen(false);
  };

  // Direct photo upload with auto HD 600px square optimization
  const handleDirectPhotoUpload = async (employeeId: string, file: File, recordFallback?: PayrollRecord) => {
    if (!file) return;
    try {
      setPhotoOptimizingId(employeeId);
      const dataUrl = await optimizeProfilePhoto(file);
      if (dataUrl) {
        let employeeFound = false;
        const updated = employees.map(emp => {
          if (emp.id === employeeId || emp.employee_code === employeeId || (recordFallback && emp.name.toLowerCase() === recordFallback.employee_name.toLowerCase())) {
            employeeFound = true;
            return { ...emp, photo_url: dataUrl };
          }
          return emp;
        });

        if (!employeeFound && recordFallback) {
          const newEmp: Employee = {
            id: recordFallback.employee_id || employeeId,
            employee_code: recordFallback.employee_code || employeeId,
            name: recordFallback.employee_name,
            designation: recordFallback.designation,
            department: recordFallback.department || 'General',
            email: '',
            phone: '',
            pan_number: '',
            fixed_salary: recordFallback.fixed_salary,
            bank_name: 'Nabil Bank',
            bank_account_no: '',
            bank_branch: '',
            joining_date: getTodayBsDate(),
            is_active: true,
            photo_url: dataUrl,
          };
          updated.push(newEmp);
        }
        saveEmployees(updated);

        // Also sync photo_url into payroll records
        const updatedRecords = payrollRecords.map(r => {
          if (r.employee_id === employeeId || r.employee_code === employeeId || (recordFallback && r.employee_name.toLowerCase() === recordFallback.employee_name.toLowerCase())) {
            return { ...r, photo_url: dataUrl };
          }
          return r;
        });
        savePayrollRecords(updatedRecords);
      }
    } catch (err) {
      console.error('Failed to optimize employee photo:', err);
    } finally {
      setPhotoOptimizingId(null);
    }
  };

  // Upload in Employee Modal with auto HD 600px square optimization
  const handleModalPhotoUpload = async (file: File) => {
    if (!file) return;
    try {
      setModalPhotoOptimizing(true);
      const dataUrl = await optimizeProfilePhoto(file);
      if (dataUrl) {
        setEmployeeFormData(prev => ({ ...prev, photo_url: dataUrl }));
      }
    } catch (err) {
      console.error('Failed to optimize photo in modal:', err);
    } finally {
      setModalPhotoOptimizing(false);
    }
  };

  // Remove photo by Admin
  const handleRemoveEmployeePhoto = (employeeId: string) => {
    const updated = employees.map(emp => {
      if (emp.id === employeeId) {
        return { ...emp, photo_url: '' };
      }
      return emp;
    });
    saveEmployees(updated);
    if (lightboxPhoto.isOpen && lightboxPhoto.emp?.id === employeeId) {
      setLightboxPhoto({ isOpen: false, emp: null, photoSrc: '' });
    }
  };

  // Auto-Fill All Employees for the month using exact rules
  const handleGenerateAllForMonth = () => {
    const existingEmployeeIds = new Set(periodPayrollRecords.map(r => r.employee_id));
    const unrecordedEmployees = employees.filter(e => e.is_active && !existingEmployeeIds.has(e.id));

    if (unrecordedEmployees.length === 0) {
      alert(`All active employees already have payroll records generated for ${selectedMonth} ${selectedYear}!`);
      return;
    }

    const newRecords: PayrollRecord[] = unrecordedEmployees.map((emp, idx) => {
      const calc = calculatePayrollValues(
        emp.fixed_salary,
        defaultWorkingDays,
        defaultWorkingDays, // 100% Present
        0,                  // 0 Half days
        0,                  // 0 Allowances
        0,                  // 0 Deductions
        true,               // 1% TDS applied
        1
      );

      const ref = `PAY-${selectedYear}-${String(monthsList.indexOf(selectedMonth) + 1).padStart(2, '0')}-${String(payrollRecords.length + idx + 1).padStart(3, '0')}`;
      return {
        id: ref,
        payroll_ref: ref,
        employee_id: emp.id,
        employee_code: emp.employee_code,
        employee_name: emp.name,
        designation: emp.designation,
        department: emp.department,
        month: selectedMonth,
        year: selectedYear,
        total_working_days: calc.total_working_days,
        present_days: calc.present_days,
        half_days: calc.half_days,
        absent_days: calc.absent_days,
        effective_days: calc.effective_days,
        fixed_salary: calc.fixed_salary,
        per_day_rate: calc.per_day_rate,
        attendance_salary: calc.attendance_salary,
        earned_salary: calc.attendance_salary,
        bonus_allowance: calc.bonus_allowance,
        deductions: calc.deductions,
        net_before_tds: calc.net_before_tds,
        tds_rate: calc.tds_rate,
        tds_amount: calc.tds_amount,
        net_salary: calc.net_salary,
        payment_status: 'Unpaid',
        notes: 'Auto-generated with 100% full attendance (1% TDS applied)'
      };
    });

    savePayrollRecords([...newRecords, ...payrollRecords]);
  };

  // Quick Action: Mark an existing record as Full Present (recalculates with exact rules)
  const handleMarkFullPresent = (record: PayrollRecord) => {
    const calc = calculatePayrollValues(
      record.fixed_salary,
      record.total_working_days,
      record.total_working_days,
      0,
      record.bonus_allowance,
      record.deductions,
      record.tds_rate > 0,
      record.tds_rate || 1
    );

    const updated = payrollRecords.map(item => {
      if (item.id === record.id) {
        return {
          ...item,
          present_days: calc.present_days,
          half_days: calc.half_days,
          absent_days: calc.absent_days,
          effective_days: calc.effective_days,
          per_day_rate: calc.per_day_rate,
          attendance_salary: calc.attendance_salary,
          earned_salary: calc.attendance_salary,
          net_before_tds: calc.net_before_tds,
          tds_amount: calc.tds_amount,
          net_salary: calc.net_salary,
          notes: 'Marked full present (1% TDS applied)'
        };
      }
      return item;
    });

    savePayrollRecords(updated);
  };

  // Handle Pay Salary Action
  const handleOpenPayModal = (record: PayrollRecord) => {
    setPayingRecord(record);
    setPaymentFormData({
      payment_date: new Date().toISOString().split('T')[0],
      payment_method: 'Bank Transfer',
      reference_no: `TXN-${Date.now().toString().slice(-6)}`,
      record_in_expenses: true,
    });
    setIsPayModalOpen(true);
  };

  const handleConfirmPayment = () => {
    if (!payingRecord) return;

    const updated = payrollRecords.map(r => {
      if (r.id === payingRecord.id) {
        return {
          ...r,
          payment_status: 'Paid' as const,
          payment_date: paymentFormData.payment_date,
          payment_method: paymentFormData.payment_method,
          reference_no: paymentFormData.reference_no,
        };
      }
      return r;
    });

    savePayrollRecords(updated);
    setIsPayModalOpen(false);
    setPayingRecord(null);
  };

  // Delete Handlers with cascade
  const handleDeleteClick = (id: string, type: 'payroll' | 'employee') => {
    setItemToDelete({ id, type });
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!itemToDelete) return;
    if (itemToDelete.type === 'payroll') {
      const updated = payrollRecords.filter(r => r.id !== itemToDelete.id);
      savePayrollRecords(updated);
    } else {
      const updatedEmployees = employees.filter(e => e.id !== itemToDelete.id);
      saveEmployees(updatedEmployees);
      const updatedPayroll = payrollRecords.filter(r => r.employee_id !== itemToDelete.id);
      savePayrollRecords(updatedPayroll);
    }
    setDeleteModalOpen(false);
    setItemToDelete(null);
  };

  // View Payslip Modal
  const handleOpenPayslip = (record: PayrollRecord) => {
    setActivePayslip(record);
    setIsPayslipModalOpen(true);
  };

  const handlePrintPayslip = () => {
    window.addEventListener('afterprint', () => {
      setIsPayslipModalOpen(false);
      setActivePayslip(null);
    }, { once: true });
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-accent rounded-xl">
              <Banknote size={24} />
            </span>
            <h1 className="text-2xl font-bold text-primary">Employee Salary & Payroll</h1>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Exact Attendance Calculation (Full, Half-Day, Absent), Allowances, 1% TDS, and Net Payout.
          </p>
        </div>

        {/* Month & Period Selector */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 shadow-sm">
            <Calendar size={16} className="text-slate-500" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
            >
              {monthsList.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer border-l border-slate-200 pl-2"
            >
              <option value={2084}>2084 BS</option>
              <option value={2083}>2083 BS</option>
              <option value={2082}>2082 BS</option>
              <option value={2081}>2081 BS</option>
              <option value={2080}>2080 BS</option>
            </select>
          </div>

          <button
            onClick={() => handleOpenSalaryModal()}
            className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] cursor-pointer"
          >
            <Plus size={18} className="text-black" />
            <span>Add / Calculate Salary</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Gross / Attendance Salary */}
        <div className="bg-[#F8FAFF] p-5 rounded-3xl shadow-xs border border-blue-100/90 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-blue-100/80 rounded-2xl flex items-center justify-center text-blue-600 border border-blue-200/60 shrink-0">
              <DollarSign size={20} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
              GROSS SALARY
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gross Attendance</p>
            <h3 className="text-xl font-black text-slate-900 mt-1 font-mono">{formatNPR(summaryMetrics.totalAttendanceSalary)}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Before Allowances & TDS</p>
          </div>
        </div>

        {/* Card 2: 1% TDS Withheld */}
        <div className="bg-[#FFF6F6] p-5 rounded-3xl shadow-xs border border-rose-100/90 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-rose-100/80 rounded-2xl flex items-center justify-center text-rose-600 border border-rose-200/60 shrink-0">
              <Receipt size={20} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600">
              1% TDS
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total 1% TDS</p>
            <h3 className="text-xl font-black text-rose-600 mt-1 font-mono">-{formatNPR(summaryMetrics.totalTds)}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Statutory tax deducted</p>
          </div>
        </div>

        {/* Card 3: Final Net Payroll */}
        <div className="bg-[#F6FAF7] p-5 rounded-3xl shadow-xs border border-emerald-100/90 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-emerald-100/80 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-200/60 shrink-0">
              <CheckCircle2 size={20} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
              NET PAYOUT
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Final Net Payroll</p>
            <h3 className="text-xl font-black text-emerald-600 mt-1 font-mono">{formatNPR(summaryMetrics.totalPayroll)}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Net payable to staff</p>
          </div>
        </div>

        {/* Card 4: Pending Payout */}
        <div className="bg-[#FFF9F5] p-5 rounded-3xl shadow-xs border border-orange-100/90 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-orange-100/80 rounded-2xl flex items-center justify-center text-orange-600 border border-orange-200/60 shrink-0">
              <Clock size={20} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-600">
              APPROVAL
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Pending Payout</p>
            <h3 className="text-xl font-black text-orange-600 mt-1 font-mono">{formatNPR(summaryMetrics.pendingPayout)}</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Unpaid / In Approval</p>
          </div>
        </div>

        {/* Card 5: Average Attendance */}
        <div className="bg-[#FAF7FD] p-5 rounded-3xl shadow-xs border border-purple-100/90 hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="w-10 h-10 bg-purple-100/80 rounded-2xl flex items-center justify-center text-purple-600 border border-purple-200/60 shrink-0">
              <Percent size={20} />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600">
              ATTENDANCE
            </span>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg. Attendance</p>
            <h3 className="text-xl font-black text-purple-700 mt-1 font-mono">{summaryMetrics.avgAttendance}%</h3>
            <p className="text-[11px] text-slate-500 mt-0.5"><strong className="text-slate-700">{summaryMetrics.activeEmployeesCount}</strong> active employees</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('payroll')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'payroll'
              ? 'border-accent text-accent'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Calendar size={18} />
          <span>Monthly Payroll & Attendance ({periodPayrollRecords.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('employees')}
          className={`px-6 py-3 text-sm font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            activeTab === 'employees'
              ? 'border-accent text-accent'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 size={18} />
          <span>Employees & Fixed Salaries ({employees.length})</span>
        </button>
      </div>

      {/* TAB 1: PAYROLL PROCESSING & ATTENDANCE */}
      {activeTab === 'payroll' && (
        <div className="space-y-4">
          {/* Controls & Batch Actions */}
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white/95 p-4 rounded-2xl border border-slate-200 shadow-[0_10px_30px_rgba(15,23,42,0.04)] backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[260px]">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employee, ID, role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/80 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none transition-all focus:border-accent focus:bg-white focus:ring-2 focus:ring-accent/10"
                />
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm">
                <Filter size={14} className="text-slate-400" />
                <span className="font-semibold text-slate-500">Dept:</span>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer text-xs"
                >
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 shadow-sm">
                <span className="font-semibold text-slate-500">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent font-semibold text-slate-800 outline-none cursor-pointer text-xs"
                >
                  <option value="All">All</option>
                  <option value="Paid">Paid</option>
                  <option value="Approved">Approved</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            {/* Quick Batch Actions & Admin Working Days Input */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs shadow-sm">
                <span className="text-slate-600 font-semibold">Working Days</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={defaultWorkingDays}
                  onChange={(e) => setDefaultWorkingDays(Number(e.target.value) || DEFAULT_WORKING_DAYS)}
                  className="w-12 bg-white border border-slate-300 text-center font-bold text-slate-900 rounded-lg py-1 outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
                />
              </div>

              <button
                onClick={handleGenerateAllForMonth}
                title="Generates salary record with 100% full present for all active employees not yet recorded"
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer shadow-sm hover:shadow-md"
              >
                <UserCheck size={14} className="text-emerald-600" />
                <span>Auto-Fill All Employees</span>
              </button>
            </div>
          </div>

          {/* Payroll Table displaying all requested columns */}
          <div className="bg-white rounded-2xl shadow-[0_12px_30px_rgba(15,23,42,0.06)] border border-slate-200/80 overflow-hidden ring-1 ring-slate-200/60">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-gradient-to-r from-slate-50 via-slate-50 to-slate-100 text-slate-500 uppercase text-[11px] font-semibold tracking-[0.12em] border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3.5 whitespace-nowrap">Employee</th>
                    <th className="px-3 py-3.5 text-right whitespace-nowrap">Fixed Salary</th>
                    <th className="px-2 py-3.5 text-center whitespace-nowrap">Working Days</th>
                    <th className="px-2 py-3.5 text-center whitespace-nowrap">Present</th>
                    <th className="px-2 py-3.5 text-center whitespace-nowrap">Half Day</th>
                    <th className="px-2 py-3.5 text-center whitespace-nowrap">Absent</th>
                    <th className="px-2 py-3.5 text-center whitespace-nowrap">Effective Days</th>
                    <th className="px-3 py-3.5 text-right whitespace-nowrap">Daily Rate</th>
                    <th className="px-3 py-3.5 text-right font-medium whitespace-nowrap">Gross/Attendance Salary</th>
                    <th className="px-2 py-3.5 text-right whitespace-nowrap">Allowances</th>
                    <th className="px-2 py-3.5 text-right whitespace-nowrap">Other Deductions</th>
                    <th className="px-3 py-3.5 text-right text-red-600 whitespace-nowrap">TDS (1%)</th>
                    <th className="px-4 py-3.5 text-right font-bold text-slate-800 whitespace-nowrap">Net Payable</th>
                    <th className="px-2 py-3.5 text-center whitespace-nowrap">Status</th>
                    <th className="px-3 py-3.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {displayedPayroll.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="py-14 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-3 px-6">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 shadow-inner">
                            <Banknote size={32} />
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-semibold text-slate-700">No payroll records found for {selectedMonth} {selectedYear}.</p>
                            <p className="text-sm text-slate-500">Click "+ Add / Calculate Salary" or "Auto-Fill All Employees" to generate records.</p>
                          </div>
                          <button
                            onClick={handleGenerateAllForMonth}
                            className="btn-gradient mt-2 px-5 py-2 text-xs font-bold rounded-xl shadow-md transition-all"
                          >
                            Populate Active Employees
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedPayroll.map((record) => {
                      const matchingEmp = employees.find(e => 
                        (record.employee_id && (e.id === record.employee_id || e.employee_code === record.employee_id)) ||
                        (record.employee_code && (e.employee_code === record.employee_code || e.id === record.employee_code)) ||
                        (e.name && record.employee_name && e.name.trim().toLowerCase() === record.employee_name.trim().toLowerCase())
                      );
                      const photoSrc = record.photo_url || (matchingEmp ? getEmployeePhoto(matchingEmp) : '');
                      const empId = matchingEmp?.id || record.employee_id || record.employee_code;
                      const isOptimizing = photoOptimizingId === empId;

                      return (
                        <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* 1. Employee with Profile Photo */}
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-3">
                              {photoSrc ? (
                                <div className="relative shrink-0 group/row-photo">
                                  <div className="w-10 h-10 rounded-full ring-2 ring-indigo-100 shadow-sm border border-slate-200 overflow-hidden bg-slate-100 group-hover/row-photo:ring-indigo-400 group-hover/row-photo:scale-105 transition-all duration-200">
                                    <img
                                      src={photoSrc}
                                      alt={record.employee_name}
                                      style={{
                                        imageRendering: '-webkit-optimize-contrast',
                                        filter: 'contrast(1.05) brightness(1.02)'
                                      }}
                                      onClick={() => setLightboxPhoto({ isOpen: true, emp: matchingEmp || null, photoSrc })}
                                      className="w-full h-full object-cover object-center cursor-pointer"
                                      title="Click to view full HD profile"
                                    />
                                  </div>
                                  {/* Quick change photo hover button */}
                                  <label
                                    title="Change employee photo"
                                    className="absolute inset-0 bg-slate-900/60 rounded-full opacity-0 group-hover/row-photo:opacity-100 flex items-center justify-center text-white cursor-pointer transition-opacity backdrop-blur-2xs"
                                  >
                                    <Camera size={13} />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleDirectPhotoUpload(empId, file, record);
                                      }}
                                    />
                                  </label>
                                  {isOptimizing && (
                                    <div className="absolute inset-0 bg-slate-950/75 rounded-full flex items-center justify-center text-white backdrop-blur-xs">
                                      <Loader2 size={13} className="animate-spin text-indigo-400" />
                                    </div>
                                  )}
                                  {/* Active Status Pulse Indicator */}
                                  {matchingEmp?.is_active !== false && (
                                    <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3" title="Active Employee">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div className="relative shrink-0">
                                  <label
                                    title="Click to upload employee photo"
                                    className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-50 to-slate-100 hover:bg-indigo-100 border border-dashed border-indigo-300 hover:border-indigo-500 text-indigo-700 font-bold flex flex-col items-center justify-center text-xs shrink-0 cursor-pointer group/upload transition-all shadow-xs relative ring-2 ring-white"
                                  >
                                    <span className="group-hover/upload:hidden tracking-wider font-semibold">
                                      {record.employee_name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                    </span>
                                    <div className="hidden group-hover/upload:flex flex-col items-center gap-0.5">
                                      <Camera size={14} className="text-indigo-600 scale-110" />
                                      <span className="text-[7px] font-bold uppercase tracking-wider text-indigo-600">Photo</span>
                                    </div>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleDirectPhotoUpload(empId, file, record);
                                      }}
                                    />
                                  </label>
                                  {isOptimizing && (
                                    <div className="absolute inset-0 bg-slate-950/75 rounded-full flex items-center justify-center text-white backdrop-blur-xs">
                                      <Loader2 size={13} className="animate-spin text-indigo-400" />
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-900 leading-tight truncate">{record.employee_name}</p>
                                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-400">
                                  <span className="font-mono">{record.employee_code}</span>
                                  <span>•</span>
                                  <span className="truncate max-w-[120px]">{record.designation}</span>
                                </div>
                              </div>
                            </div>
                          </td>

                        {/* 2. Fixed Salary */}
                        <td className="px-3 py-3.5 text-right font-medium text-slate-900 whitespace-nowrap">
                          {formatNPR(record.fixed_salary)}
                        </td>

                        {/* 3. Working Days */}
                        <td className="px-2 py-3.5 text-center font-medium text-slate-700">
                          <span className="px-2 py-0.5 bg-slate-100 rounded text-xs">
                            {record.total_working_days}
                          </span>
                        </td>

                        {/* 4. Present */}
                        <td className="px-2 py-3.5 text-center">
                          <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {record.present_days}
                          </span>
                        </td>

                        {/* 5. Half Day */}
                        <td className="px-2 py-3.5 text-center">
                          {record.half_days > 0 ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200" title="Each half-day = 0.5 effective day">
                              {record.half_days} <span className="text-[10px] ml-0.5 opacity-75">(0.5x)</span>
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">0</span>
                          )}
                        </td>

                        {/* 6. Absent */}
                        <td className="px-2 py-3.5 text-center">
                          {record.absent_days > 0 ? (
                            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                              {record.absent_days}
                            </span>
                          ) : (
                            <span className="text-slate-300 text-xs">0</span>
                          )}
                        </td>

                        {/* 7. Effective Days */}
                        <td className="px-2 py-3.5 text-center font-bold text-slate-800">
                          <div className="flex flex-col items-center">
                            <span>{record.effective_days}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({((record.effective_days / record.total_working_days) * 100).toFixed(0)}%)
                            </span>
                          </div>
                        </td>

                        {/* 8. Daily Rate */}
                        <td className="px-3 py-3.5 text-right text-xs font-mono text-slate-600 whitespace-nowrap">
                          {formatNPR(record.per_day_rate)}
                        </td>

                        {/* 9. Gross/Attendance Salary */}
                        <td className="px-3 py-3.5 text-right font-medium text-slate-800 whitespace-nowrap">
                          {formatNPR(record.attendance_salary)}
                        </td>

                        {/* 10. Allowances */}
                        <td className="px-2 py-3.5 text-right text-xs whitespace-nowrap">
                          {record.bonus_allowance > 0 ? (
                            <span className="text-emerald-700 font-medium">+{formatNPR(record.bonus_allowance)}</span>
                          ) : (
                            <span className="text-slate-300">रु. 0</span>
                          )}
                        </td>

                        {/* 11. Other Deductions */}
                        <td className="px-2 py-3.5 text-right text-xs whitespace-nowrap">
                          {record.deductions > 0 ? (
                            <span className="text-red-600 font-medium">-{formatNPR(record.deductions)}</span>
                          ) : (
                            <span className="text-slate-300">रु. 0</span>
                          )}
                        </td>

                        {/* 12. TDS (1%) */}
                        <td className="px-3 py-3.5 text-right text-xs font-mono text-red-600 font-medium whitespace-nowrap">
                          -{formatNPR(record.tds_amount)}
                        </td>

                        {/* 13. Net Payable */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <p className="font-extrabold text-emerald-700 text-sm leading-tight">
                            {formatNPR(record.net_salary)}
                          </p>
                        </td>

                        {/* 14. Status */}
                        <td className="px-2 py-3.5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${
                            record.payment_status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : record.payment_status === 'Approved'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              record.payment_status === 'Paid'
                                ? 'bg-emerald-500'
                                : record.payment_status === 'Approved'
                                ? 'bg-blue-500'
                                : 'bg-amber-500'
                            }`} />
                            {record.payment_status}
                          </span>
                        </td>

                        {/* 15. Actions */}
                        <td className="px-3 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Payslip */}
                            <button
                              onClick={() => handleOpenPayslip(record)}
                              title={`View & print salary slip for ${record.employee_name}`}
                              aria-label={`View and print salary slip for ${record.employee_name}`}
                              className="p-1.5 text-slate-500 hover:text-accent hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Printer size={15} />
                            </button>

                            {/* Pay Salary button (if not already paid) */}
                            {record.payment_status !== 'Paid' && (
                              <button
                                onClick={() => handleOpenPayModal(record)}
                                title="Mark Salary as Disbursed / Paid"
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <CreditCard size={15} />
                              </button>
                            )}

                            {/* Quick Mark Full Present */}
                            {record.payment_status !== 'Paid' && record.effective_days < record.total_working_days && (
                              <button
                                onClick={() => handleMarkFullPresent(record)}
                                title="Quick mark 100% full present (auto-recalculates salary and TDS)"
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Check size={15} />
                              </button>
                            )}

                            {/* Edit */}
                            <button
                              onClick={() => handleOpenSalaryModal(record)}
                              title="Edit Attendance & Salary"
                              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit size={15} />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteClick(record.id, 'payroll')}
                              title="Delete Record"
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                  )}
                </tbody>
              </table>
            </div>

            {/* Attendance Calculation Legend & Accounting Rules */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-semibold text-slate-700">Salary Accounting Rules:</span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  Effective Days = Present + (0.5 × Half Days)
                </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  Daily Rate = Fixed ÷ Working Days
                </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                  Attendance Salary = Daily Rate × Effective Days
                </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-red-700">
                  TDS = Net Before TDS × 1%
                </span>
                <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-emerald-700 font-bold">
                  Final Net Pay = Net Before TDS - TDS
                </span>
              </div>
              <div className="text-slate-400">
                Total Records: {displayedPayroll.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EMPLOYEES & FIXED SALARY DIRECTORY */}
      {activeTab === 'employees' && (
        <div className="space-y-5">
          {/* Header & Controls Toolbar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Employee Directory & Compensation</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                    {filteredEmployees.length} {filteredEmployees.length === 1 ? 'Staff Member' : 'Staff Members'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Individual profile containers with photos, designation, bank accounts, and monthly fixed base salaries.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                {/* View Mode Toggle: Digital ID Cards vs Detailed Cards vs Table */}
                <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setEmployeeViewMode('cards')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      employeeViewMode === 'cards'
                        ? 'bg-white text-indigo-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Official Digital Employee ID Cards"
                  >
                    <QrCode size={13} className={employeeViewMode === 'cards' ? 'text-indigo-600' : 'text-slate-400'} />
                    <span>Digital ID Cards</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmployeeViewMode('detailed')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      employeeViewMode === 'detailed'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Detailed Salary Benchmark View"
                  >
                    <CreditCard size={13} className={employeeViewMode === 'detailed' ? 'text-emerald-600' : 'text-slate-400'} />
                    <span>Salary Details</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmployeeViewMode('table')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      employeeViewMode === 'table'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="List Table View"
                  >
                    <List size={13} />
                    <span>Table</span>
                  </button>
                </div>

                {/* Add New Employee Button */}
                <button
                  onClick={() => handleOpenEmployeeModal()}
                  className="btn-gradient flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-[0.98] cursor-pointer ml-auto lg:ml-0"
                >
                  <UserPlus size={17} className="text-black" />
                  <span>Add New Employee</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
              <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, ID code, designation, email, phone, or bank..."
                  value={employeeSearchTerm}
                  onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
                {employeeSearchTerm && (
                  <button
                    onClick={() => setEmployeeSearchTerm('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter size={15} className="text-slate-400 shrink-0" />
                <select
                  value={employeeDeptFilter}
                  onChange={(e) => setEmployeeDeptFilter(e.target.value)}
                  className="w-full sm:w-44 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
                >
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept === 'All' ? 'All Departments' : dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                <User size={18} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase">Total Profiles</p>
                <p className="text-base font-bold text-slate-900">{employees.length}</p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase">Active Staff</p>
                <p className="text-base font-bold text-emerald-700">
                  {employees.filter(e => e.is_active).length}
                </p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-sm">
                <Building2 size={18} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase">Departments</p>
                <p className="text-base font-bold text-indigo-700">
                  {new Set(employees.map(e => e.department)).size}
                </p>
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center font-bold text-sm">
                <Banknote size={18} />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-500 uppercase">Monthly Payroll</p>
                <p className="text-sm font-bold text-slate-900 truncate">
                  {formatNPR(employees.reduce((acc, e) => acc + (e.is_active ? e.fixed_salary : 0), 0))}
                </p>
              </div>
            </div>
          </div>

          {/* VIEW 1: OFFICIAL DIGITAL EMPLOYEE ID CARDS (MATCHING SPECIFICATION) */}
          {employeeViewMode === 'cards' && (
            <div>
              {filteredEmployees.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <User size={28} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">No employees found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No employee profiles match the current filter or search criteria.
                  </p>
                  <button
                    onClick={() => { setEmployeeSearchTerm(''); setEmployeeDeptFilter('All'); }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEmployees.map((emp) => (
                    <EmployeeIdCard
                      key={emp.id}
                      employee={emp}
                      onCalculateSalary={() => handleOpenSalaryModal(undefined, emp.id)}
                      onEdit={() => handleOpenEmployeeModal(emp)}
                      onDelete={() => handleDeleteClick(emp.id, 'employee')}
                      onViewBadge={() => setIdCardModalEmp(emp)}
                      onUploadPhoto={(id, file) => handleDirectPhotoUpload(id, file)}
                      onZoomPhoto={(e, src) => setLightboxPhoto({ isOpen: true, emp: e, photoSrc: src })}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: DETAILED SALARY BENCHMARK CARDS */}
          {employeeViewMode === 'detailed' && (
            <div>
              {filteredEmployees.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <User size={28} />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">No employees found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    No employee profiles match the current filter or search criteria.
                  </p>
                  <button
                    onClick={() => { setEmployeeSearchTerm(''); setEmployeeDeptFilter('All'); }}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredEmployees.map((emp) => {
                    const photoSrc = getEmployeePhoto(emp);
                    return (
                      <div
                        key={emp.id}
                        className="bg-white rounded-3xl border border-slate-200/90 hover:border-indigo-400/50 shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1.5 transition-all duration-300 p-5 flex flex-col justify-between group relative overflow-hidden"
                      >
                        {/* Top decorative accent bar */}
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 opacity-90 group-hover:h-2 transition-all" />

                        <div>
                          {/* Card Header: Profile Photo, Name, Code & Status */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3.5 min-w-0">
                              {/* Photo Avatar: Genuine Circular Profile Avatar with Multi-layer Ring & Sharp Clarity */}
                              {photoSrc ? (
                                <div className="relative shrink-0 group/photo">
                                  <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full ring-4 ring-white shadow-xl shadow-slate-200/90 border-2 border-indigo-100/80 overflow-hidden bg-slate-100 group-hover/photo:ring-indigo-400 group-hover/photo:border-indigo-400 transition-all duration-300">
                                    <img
                                      src={photoSrc}
                                      alt={emp.name}
                                      style={{ 
                                        imageRendering: '-webkit-optimize-contrast',
                                        filter: 'contrast(1.07) brightness(1.02) saturate(1.04)'
                                      }}
                                      onClick={() => setLightboxPhoto({ isOpen: true, emp, photoSrc })}
                                      className="w-full h-full object-cover object-center cursor-pointer transform group-hover/photo:scale-105 transition-transform duration-300"
                                      title="Click to view full HD profile"
                                    />
                                  </div>

                                  {/* Direct hover action overlay */}
                                  <div className="absolute inset-0 bg-slate-900/70 rounded-full opacity-0 group-hover/photo:opacity-100 flex items-center justify-center gap-1 transition-opacity backdrop-blur-2xs">
                                    <button
                                      type="button"
                                      onClick={() => setLightboxPhoto({ isOpen: true, emp, photoSrc })}
                                      title="View Full Resolution Photo"
                                      className="p-1.5 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors cursor-pointer shadow-xs"
                                    >
                                      <ZoomIn size={12} />
                                    </button>
                                    <label
                                      title="Change employee photo (HD Auto-Crop)"
                                      className="p-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full cursor-pointer transition-colors shadow-xs"
                                    >
                                      <Camera size={12} />
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleDirectPhotoUpload(emp.id, file);
                                        }}
                                      />
                                    </label>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveEmployeePhoto(emp.id)}
                                      title="Remove photo"
                                      className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-full cursor-pointer transition-colors shadow-xs"
                                    >
                                      <X size={12} />
                                    </button>
                                  </div>

                                  {/* Optimizing spinner badge */}
                                  {photoOptimizingId === emp.id && (
                                    <div className="absolute inset-0 bg-slate-950/75 rounded-full flex flex-col items-center justify-center text-white gap-0.5 backdrop-blur-xs">
                                      <Loader2 size={16} className="animate-spin text-indigo-400" />
                                      <span className="text-[8px] font-bold tracking-wider">PREPARING</span>
                                    </div>
                                  )}

                                  {/* Active Status Pulse Indicator on bottom of circular profile */}
                                  {emp.is_active ? (
                                    <span className="absolute bottom-0 right-0 flex h-4.5 w-4.5" title="Active Employee">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-emerald-500 border-2 border-white shadow-xs"></span>
                                    </span>
                                  ) : (
                                    <span
                                      className="absolute bottom-0 right-0 w-4.5 h-4.5 rounded-full border-2 border-white bg-slate-400 shadow-xs"
                                      title="Inactive Employee"
                                    />
                                  )}
                                </div>
                              ) : (
                                <div className="relative shrink-0">
                                  {/* Direct upload circular container for admin when no photo is set */}
                                  <label
                                    title="Click to upload crisp employee photo (Admin)"
                                    className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-gradient-to-br from-indigo-50/90 via-blue-50/70 to-slate-100 border-2 border-dashed border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50 flex flex-col items-center justify-center text-indigo-700 transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md group/upload relative ring-4 ring-white"
                                  >
                                    <span className="font-bold text-base tracking-wider text-slate-800 group-hover/upload:hidden">
                                      {emp.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                    </span>
                                    <div className="hidden group-hover/upload:flex flex-col items-center gap-0.5">
                                      <Camera size={18} className="text-indigo-600 scale-110" />
                                      <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-600">
                                        + Photo
                                      </span>
                                    </div>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleDirectPhotoUpload(emp.id, file);
                                      }}
                                    />
                                  </label>

                                  {photoOptimizingId === emp.id && (
                                    <div className="absolute inset-0 bg-slate-950/75 rounded-full flex flex-col items-center justify-center text-white gap-0.5 backdrop-blur-xs">
                                      <Loader2 size={16} className="animate-spin text-indigo-400" />
                                      <span className="text-[8px] font-bold tracking-wider">PREPARING</span>
                                    </div>
                                  )}

                                  {emp.is_active ? (
                                    <span className="absolute bottom-0 right-0 flex h-4.5 w-4.5" title="Active Employee">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-emerald-500 border-2 border-white shadow-xs"></span>
                                    </span>
                                  ) : (
                                    <span
                                      className="absolute bottom-0 right-0 w-4.5 h-4.5 rounded-full border-2 border-white bg-slate-400 shadow-xs"
                                      title="Inactive Employee"
                                    />
                                  )}
                                </div>
                              )}

                              <div className="min-w-0 flex-1">
                                <h3 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors leading-tight line-clamp-1">
                                  {emp.name}
                                </h3>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                                  <button
                                    type="button"
                                    onClick={(e) => handleCopyCode(emp.id, emp.employee_code, e)}
                                    title="Click to copy employee code"
                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-mono text-[11px] font-semibold bg-slate-100 hover:bg-slate-200/80 text-slate-700 border border-slate-200/80 transition-all cursor-pointer active:scale-95 group/code"
                                  >
                                    <Hash size={11} className="text-slate-400 group-hover/code:text-indigo-600" />
                                    <span>{emp.employee_code}</span>
                                    {copiedCodeId === emp.id ? (
                                      <Check size={11} className="text-emerald-600 animate-in zoom-in" />
                                    ) : (
                                      <Copy size={10} className="text-slate-400 opacity-0 group-hover/code:opacity-100 transition-opacity" />
                                    )}
                                  </button>
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                    <Building2 size={11} className="text-blue-500" />
                                    <span>{emp.department}</span>
                                  </span>
                                </div>
                                <p className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-1.5 line-clamp-1">
                                  <Briefcase size={12} className="text-slate-400 shrink-0" />
                                  <span>{emp.designation}</span>
                                </p>
                              </div>
                            </div>

                            {/* Status Pill */}
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 shadow-2xs ${
                              emp.is_active
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${emp.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                              {emp.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>

                          {/* Fixed Monthly Base Salary Showcase Container */}
                          <div className="mt-4 p-3.5 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/15 border border-emerald-500/25 shadow-xs relative overflow-hidden group/salary">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-950 flex items-center gap-1.5">
                                <Banknote size={12} className="text-emerald-600" />
                                Fixed Monthly Salary
                              </span>
                              <span className="text-[10px] font-semibold text-emerald-800 bg-white/90 backdrop-blur-xs px-2 py-0.5 rounded-md border border-emerald-200/80 shadow-2xs">
                                Benchmark
                              </span>
                            </div>
                            <div className="flex items-baseline justify-between mt-1">
                              <p className="text-xl font-black font-mono tracking-tight text-emerald-950">
                                {formatNPR(emp.fixed_salary)}
                              </p>
                              <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/60 px-2 py-0.5 rounded-md border border-emerald-200/60 font-mono">
                                ≈ {formatNPR(emp.fixed_salary / DEFAULT_WORKING_DAYS)}/day
                              </span>
                            </div>
                          </div>

                          {/* Contact, Banking & Statutory Details */}
                          <div className="mt-3.5 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                            <div className="flex items-center justify-between gap-2 py-0.5 px-1 rounded-md hover:bg-slate-50 transition-colors">
                              <span className="flex items-center gap-1.5 text-slate-400 shrink-0 font-medium">
                                <Mail size={13} className="text-slate-400" />
                                Email:
                              </span>
                              <a
                                href={emp.email ? `mailto:${emp.email}` : undefined}
                                className="font-medium text-slate-800 hover:text-blue-600 truncate max-w-[190px] transition-colors"
                                title={emp.email || 'No email provided'}
                              >
                                {emp.email || 'N/A'}
                              </a>
                            </div>

                            <div className="flex items-center justify-between gap-2 py-0.5 px-1 rounded-md hover:bg-slate-50 transition-colors">
                              <span className="flex items-center gap-1.5 text-slate-400 shrink-0 font-medium">
                                <Phone size={13} className="text-slate-400" />
                                Phone:
                              </span>
                              <a
                                href={emp.phone ? `tel:${emp.phone}` : undefined}
                                className="font-mono font-medium text-slate-800 hover:text-blue-600 transition-colors"
                              >
                                {emp.phone || 'N/A'}
                              </a>
                            </div>

                            <div className="flex items-center justify-between gap-2 py-0.5 px-1 rounded-md hover:bg-slate-50 transition-colors">
                              <span className="flex items-center gap-1.5 text-slate-400 shrink-0 font-medium">
                                <Landmark size={13} className="text-slate-400" />
                                Bank:
                              </span>
                              <span
                                className="font-medium text-slate-800 truncate max-w-[190px]"
                                title={`${emp.bank_name} - ${emp.bank_account_no}`}
                              >
                                {emp.bank_name} {emp.bank_account_no ? `(••••${emp.bank_account_no.slice(-4)})` : ''}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 py-0.5 px-1 rounded-md hover:bg-slate-50 transition-colors">
                              <span className="flex items-center gap-1.5 text-slate-400 shrink-0 font-medium">
                                <ShieldCheck size={13} className="text-slate-400" />
                                PAN:
                              </span>
                              <span className="font-mono font-semibold text-slate-700 bg-slate-100/90 px-2 py-0.5 rounded-md border border-slate-200/80 text-[11px]">
                                {emp.pan_number || 'N/A'}
                              </span>
                            </div>

                            <div className="flex items-center justify-between gap-2 py-0.5 px-1 rounded-md hover:bg-slate-50 transition-colors">
                              <span className="flex items-center gap-1.5 text-slate-400 shrink-0 font-medium">
                                <Calendar size={13} className="text-slate-400" />
                                Joined (BS):
                              </span>
                              <span className="font-semibold text-slate-700 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60 text-[11px]">
                                {formatNepaliDate(emp.joining_date)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Card Actions Footer */}
                        <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                          <button
                            onClick={() => handleOpenSalaryModal(undefined, emp.id)}
                            className="flex-1 flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-800 text-white rounded-xl text-xs font-semibold shadow-sm hover:shadow-md hover:shadow-indigo-500/20 transition-all active:scale-[0.98] cursor-pointer"
                            title="Calculate Salary & Attendance for this Employee"
                          >
                            <Calendar size={14} />
                            <span>Calculate Salary</span>
                          </button>

                          <button
                            onClick={() => setIdCardModalEmp(emp)}
                            title="View Official Digital ID Badge"
                            className="p-2.5 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 rounded-xl transition-colors border border-indigo-200/80 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                          >
                            <QrCode size={15} />
                          </button>

                          <button
                            onClick={() => handleOpenEmployeeModal(emp)}
                            title="Edit Employee Profile & Photo"
                            className="p-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200/80 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                          >
                            <Edit size={15} />
                          </button>

                          <button
                            onClick={() => handleDeleteClick(emp.id, 'employee')}
                            title="Delete Employee"
                            className="p-2.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200/60 cursor-pointer shadow-2xs hover:shadow-xs active:scale-95"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: TABLE VIEW (WITH PHOTOS) */}
          {employeeViewMode === 'table' && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-5 py-3.5">Employee</th>
                      <th className="px-4 py-3.5">Designation & Dept</th>
                      <th className="px-4 py-3.5">Contact Details</th>
                      <th className="px-4 py-3.5">PAN Number</th>
                      <th className="px-4 py-3.5">Bank Information</th>
                      <th className="px-4 py-3.5 text-right">Fixed Monthly Salary</th>
                      <th className="px-4 py-3.5 text-center">Status</th>
                      <th className="px-5 py-3.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmployees.map((emp) => {
                      const photoSrc = getEmployeePhoto(emp);
                      return (
                        <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* Code & Name with Photo */}
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {photoSrc ? (
                                <div className="relative group/tblphoto shrink-0">
                                  <img
                                    src={photoSrc}
                                    alt={emp.name}
                                    style={{ 
                                      imageRendering: '-webkit-optimize-contrast',
                                      filter: 'contrast(1.07) brightness(1.02) saturate(1.04)'
                                    }}
                                    onClick={() => setLightboxPhoto({ isOpen: true, emp, photoSrc })}
                                    className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow-xs border border-slate-200 cursor-pointer hover:ring-indigo-400 transition-all bg-slate-100"
                                    title="Click to view full HD profile"
                                  />
                                  <div className="absolute inset-0 bg-slate-900/60 rounded-full opacity-0 group-hover/tblphoto:opacity-100 flex items-center justify-center gap-1 text-white transition-opacity backdrop-blur-2xs">
                                    <button
                                      type="button"
                                      onClick={() => setLightboxPhoto({ isOpen: true, emp, photoSrc })}
                                      title="View HD Photo"
                                      className="p-1 hover:bg-white/20 rounded-full cursor-pointer"
                                    >
                                      <ZoomIn size={12} />
                                    </button>
                                    <label
                                      title="Change photo (HD Auto-Crop)"
                                      className="p-1 hover:bg-white/20 rounded-full cursor-pointer"
                                    >
                                      <Camera size={12} />
                                      <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={(e) => {
                                          const file = e.target.files?.[0];
                                          if (file) handleDirectPhotoUpload(emp.id, file);
                                        }}
                                      />
                                    </label>
                                  </div>
                                  {photoOptimizingId === emp.id && (
                                    <div className="absolute inset-0 bg-slate-950/70 rounded-full flex items-center justify-center text-white backdrop-blur-xs">
                                      <Loader2 size={13} className="animate-spin text-indigo-400" />
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <label
                                  title="Click to upload crisp photo (Admin)"
                                  className="w-11 h-11 rounded-full bg-indigo-50 hover:bg-indigo-100 border border-dashed border-indigo-200 hover:border-indigo-400 text-indigo-700 font-bold flex items-center justify-center text-xs shrink-0 cursor-pointer group/tblupload transition-colors relative ring-2 ring-white"
                                >
                                  <span className="group-hover/tblupload:hidden">
                                    {emp.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                                  </span>
                                  <Camera size={14} className="hidden group-hover/tblupload:block text-indigo-600" />
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleDirectPhotoUpload(emp.id, file);
                                    }}
                                  />
                                  {photoOptimizingId === emp.id && (
                                    <div className="absolute inset-0 bg-slate-950/70 rounded-xl flex items-center justify-center text-white backdrop-blur-xs">
                                      <Loader2 size={13} className="animate-spin text-indigo-400" />
                                    </div>
                                  )}
                                </label>
                              )}
                              <div>
                                <p className="font-semibold text-slate-900 leading-tight">{emp.name}</p>
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyCode(emp.id, emp.employee_code, e)}
                                  title="Copy employee code"
                                  className="inline-flex items-center gap-1 text-xs font-mono font-medium text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer group/code"
                                >
                                  <span>{emp.employee_code}</span>
                                  {copiedCodeId === emp.id ? (
                                    <Check size={11} className="text-emerald-600 animate-in zoom-in" />
                                  ) : (
                                    <Copy size={10} className="opacity-0 group-hover/code:opacity-100 transition-opacity" />
                                  )}
                                </button>
                              </div>
                            </div>
                          </td>

                          {/* Designation & Dept */}
                          <td className="px-4 py-4">
                            <p className="font-medium text-slate-800">{emp.designation}</p>
                            <span className="text-xs text-slate-500">{emp.department}</span>
                          </td>

                          {/* Contact */}
                          <td className="px-4 py-4 text-xs">
                            <p className="text-slate-800">{emp.email}</p>
                            <p className="text-slate-400 mt-0.5">{emp.phone}</p>
                          </td>

                          {/* PAN */}
                          <td className="px-4 py-4 font-mono text-xs text-slate-700">
                            {emp.pan_number || 'N/A'}
                          </td>

                          {/* Bank Details */}
                          <td className="px-4 py-4 text-xs">
                            <p className="font-medium text-slate-800">{emp.bank_name}</p>
                            <p className="text-slate-400 font-mono mt-0.5">{emp.bank_account_no}</p>
                          </td>

                          {/* Fixed Monthly Salary */}
                          <td className="px-4 py-4 text-right">
                            <p className="font-bold text-emerald-700 text-base">
                              {formatNPR(emp.fixed_salary)}
                            </p>
                            <span className="text-[10px] text-slate-400">Fixed base / mo</span>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${
                              emp.is_active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {emp.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleOpenSalaryModal(undefined, emp.id)}
                                title="Calculate / Generate Payroll for this Employee"
                                className="p-1.5 text-accent hover:bg-accent/10 rounded-lg transition-colors cursor-pointer"
                              >
                                <Calendar size={16} />
                              </button>
                              <button
                                onClick={() => handleOpenEmployeeModal(emp)}
                                title="Edit Employee & Fixed Salary"
                                className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(emp.id, 'employee')}
                                title="Delete Employee"
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: ADD / EDIT SALARY CALCULATION */}
      {isSalaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col ring-1 ring-slate-900/5">
            <div className="flex justify-between items-center px-7 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-blue-50/40">
              <div className="flex items-center gap-3.5">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-indigo-600 to-blue-700 text-white shadow-lg shadow-indigo-500/25 ring-4 ring-blue-50 shrink-0">
                  <Banknote size={22} className="drop-shadow-sm" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900">
                      {editingPayrollId ? 'Edit Attendance & Calculate Salary' : 'Calculate Employee Salary'}
                    </h3>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 rounded-full border border-blue-200/60">
                      Monthly Payroll
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Calculates attendance salary, allowances, other deductions, and 1% TDS.
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsSalaryModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all duration-200 hover:rotate-90 cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSalaryRecord} className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
              {/* Employee Selection */}
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Select Employee *</label>
                    <select
                      required
                      value={salaryFormData.employee_id}
                      onChange={(e) => handleEmployeeChangeInSalaryModal(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    >
                      {employees.map(e => (
                        <option key={e.id} value={e.id}>
                          {e.name} ({e.employee_code}) - Fixed: {formatNPR(e.fixed_salary)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Month & Year *</label>
                    <div className="flex gap-2">
                      <select
                        value={salaryFormData.month}
                        onChange={(e) => handlePeriodChangeInSalaryModal(e.target.value, salaryFormData.year)}
                        className="w-full px-2 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                      >
                        {monthsList.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        value={salaryFormData.year}
                        onChange={(e) => handlePeriodChangeInSalaryModal(salaryFormData.month, Number(e.target.value))}
                        className="w-20 px-2 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-center font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* Selected Employee Mini Banner with Photo */}
                {calculatedSalaryDetails.selectedEmp && (
                  <div className="p-3 bg-gradient-to-r from-slate-50 via-blue-50/30 to-indigo-50/20 rounded-xl border border-slate-200/80 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white">
                        {calculatedSalaryDetails.selectedEmp.name.split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{calculatedSalaryDetails.selectedEmp.name}</span>
                          <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                            {calculatedSalaryDetails.selectedEmp.employee_code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          {calculatedSalaryDetails.selectedEmp.designation} • {calculatedSalaryDetails.selectedEmp.department}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block uppercase font-bold">Fixed Base</span>
                      <span className="font-bold text-xs text-emerald-700 font-mono">
                        {formatNPR(calculatedSalaryDetails.selectedEmp.fixed_salary)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Attendance Inputs */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar size={14} className="text-accent" /> Attendance Breakdown
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSalaryFormData({
                        ...salaryFormData,
                        present_days: salaryFormData.total_working_days,
                        half_days: 0,
                      });
                    }}
                    className="text-xs font-medium text-accent hover:underline cursor-pointer"
                  >
                    Mark 100% Present
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Total Working Days (Admin customizable) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Working Days *
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      step="0.5"
                      required
                      value={salaryFormData.total_working_days}
                      onChange={(e) => setSalaryFormData({ ...salaryFormData, total_working_days: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Default = {DEFAULT_WORKING_DAYS}</span>
                  </div>

                  {/* Present Days */}
                  <div>
                    <label className="block text-[11px] font-semibold text-emerald-700 mb-1">
                      Present Days *
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={salaryFormData.total_working_days}
                      step="0.5"
                      required
                      value={salaryFormData.present_days}
                      onChange={(e) => setSalaryFormData({ ...salaryFormData, present_days: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-xl text-sm font-semibold text-emerald-800 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-emerald-600 mt-0.5 block">1.0 full day each</span>
                  </div>

                  {/* Half Days */}
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-700 mb-1">
                      Half Days (0.5x)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max={salaryFormData.total_working_days * 2}
                      step="1"
                      value={salaryFormData.half_days}
                      onChange={(e) => setSalaryFormData({ ...salaryFormData, half_days: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-amber-300 rounded-xl text-sm font-semibold text-amber-800 outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                    />
                    <span className="text-[10px] text-amber-600 mt-0.5 block">2 half = 1 day worked</span>
                  </div>

                  {/* Absent Days (auto-computed) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-red-700 mb-1">
                      Absent Days
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={calculatedSalaryDetails.absent_days}
                      className="w-full px-3 py-2 bg-slate-100 border border-red-200 rounded-xl text-sm font-semibold text-red-800 outline-none cursor-not-allowed"
                    />
                    <span className="text-[10px] text-red-500 mt-0.5 block">Auto = Work - Effective</span>
                  </div>
                </div>

                <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">Effective Worked Days:</span>
                    <span className="font-bold text-emerald-700 text-sm">{calculatedSalaryDetails.effective_days} Days</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-slate-600">Deduction (Absence/Half):</span>
                    <span className="font-bold text-red-600 text-sm">
                      {(calculatedSalaryDetails.total_working_days - calculatedSalaryDetails.effective_days).toFixed(1)} Days
                    </span>
                  </div>
                </div>
              </div>

              {/* Adjustments: Allowances & Deductions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Allowances & Bonuses (रु.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={salaryFormData.bonus_allowance}
                    onChange={(e) => setSalaryFormData({ ...salaryFormData, bonus_allowance: Number(e.target.value) })}
                    placeholder="Overtime, performance bonus..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Other Deductions (रु.)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={salaryFormData.deductions}
                    onChange={(e) => setSalaryFormData({ ...salaryFormData, deductions: Number(e.target.value) })}
                    placeholder="Advance recovery, loan, fines..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>
              </div>

              {/* 1% TDS Option */}
              <div className="p-3 bg-red-50/50 rounded-xl border border-red-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="apply_tds_checkbox"
                    checked={salaryFormData.apply_tds}
                    onChange={(e) => setSalaryFormData({ ...salaryFormData, apply_tds: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500 cursor-pointer"
                  />
                  <label htmlFor="apply_tds_checkbox" className="text-xs font-medium text-slate-800 cursor-pointer select-none">
                    Apply 1% TDS (Tax Deducted at Source on Net Before TDS)
                  </label>
                </div>
                <span className="text-xs font-bold text-red-700 font-mono">
                  -{formatNPR(calculatedSalaryDetails.tds_amount)}
                </span>
              </div>

              {/* Real-time Calculation Summary Card according to exact rules */}
              <div className="bg-slate-900 text-white p-5 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs uppercase tracking-wider text-slate-400">Fixed Monthly Base</span>
                    <p className="text-lg font-bold">{formatNPR(calculatedSalaryDetails.fixed_salary)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs uppercase tracking-wider text-slate-400">
                      Daily Salary Rate (Fixed ÷ {calculatedSalaryDetails.total_working_days})
                    </span>
                    <p className="text-lg font-bold font-mono text-blue-300">{formatNPR(calculatedSalaryDetails.per_day_rate)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div>
                    <span className="text-slate-400">Effective Days:</span>
                    <p className="text-sm font-bold text-emerald-400">{calculatedSalaryDetails.effective_days} Days</p>
                    <span className="text-[10px] text-slate-500">{calculatedSalaryDetails.present_days} Pres + {calculatedSalaryDetails.half_days} Half</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Gross Attendance:</span>
                    <p className="text-sm font-bold text-slate-200">{formatNPR(calculatedSalaryDetails.attendance_salary)}</p>
                    <span className="text-[10px] text-slate-500">Daily × {calculatedSalaryDetails.effective_days}d</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Net Before TDS:</span>
                    <p className="text-sm font-bold text-amber-300">{formatNPR(calculatedSalaryDetails.net_before_tds)}</p>
                    <span className="text-[10px] text-slate-500">+{calculatedSalaryDetails.bonus_allowance} -{calculatedSalaryDetails.deductions}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">1% TDS Deduction:</span>
                    <p className="text-sm font-bold text-red-400">-{formatNPR(calculatedSalaryDetails.tds_amount)}</p>
                    <span className="text-[10px] text-slate-500">1% of Net Before TDS</span>
                  </div>
                </div>

                <div className="border-t border-slate-800 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-slate-300">Final Net Pay (After 1% TDS):</span>
                    <span className="text-xs text-slate-400 block">Net Before TDS - 1% TDS</span>
                  </div>
                  <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                    {formatNPR(calculatedSalaryDetails.net_salary)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  value={salaryFormData.notes}
                  onChange={(e) => setSalaryFormData({ ...salaryFormData, notes: e.target.value })}
                  placeholder="e.g. Ashwin payroll with Dashain festival bonus (असोज तलब)"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
            </form>

            {/* Action Buttons Footer */}
            <div className="px-7 py-4 bg-slate-50/90 backdrop-blur-md border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
                <CheckCircle2 size={16} className="text-emerald-600" />
                <span>Statutory 1% TDS & Working Day Calculation Verified</span>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200/90 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 hover:border-slate-300 font-semibold text-sm transition-all duration-150 shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSaveSalaryRecord}
                  className="btn-gradient px-6 py-2.5 rounded-xl font-bold text-sm active:scale-[0.98] transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Banknote size={16} className="text-black" />
                  <span>{editingPayrollId ? 'Update Salary Record' : 'Save & Calculate Salary'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT EMPLOYEE PROFILE & FIXED SALARY */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[92vh] flex flex-col ring-1 ring-slate-900/5">
            {/* Executive Header */}
            <div className="flex justify-between items-center px-7 py-5 border-b border-slate-100 bg-gradient-to-r from-slate-50/90 via-white to-indigo-50/40">
              <div className="flex items-center gap-3.5">
                <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-blue-600 text-white shadow-lg shadow-indigo-500/25 ring-4 ring-indigo-50 shrink-0">
                  <UserPlus size={22} className="drop-shadow-sm" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold tracking-tight text-slate-900">
                      {editingEmployeeId ? 'Edit Employee Profile' : 'Add New Employee'}
                    </h3>
                    <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200/60">
                      Staff Directory
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure staff details, baseline monthly fixed salary, and bank deposit info.
                  </p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsEmployeeModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all duration-200 hover:rotate-90 cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-7 overflow-y-auto space-y-6 custom-scrollbar flex-1 bg-white">
              {/* Employee Photo / Avatar Upload Section */}
              <div className="p-4.5 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/25 to-blue-50/30 border border-slate-200/90 space-y-3.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
                    <Camera size={15} className="text-indigo-600" />
                    <span>Employee Profile Photo</span>
                    <span className="px-2 py-0.5 text-[9px] font-bold text-indigo-700 bg-indigo-100/70 rounded-full">
                      HD 600px Auto-Crop
                    </span>
                  </span>
                  {employeeFormData.photo_url && (
                    <button
                      type="button"
                      onClick={() => setEmployeeFormData(prev => ({ ...prev, photo_url: '' }))}
                      className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline cursor-pointer"
                    >
                      Reset Photo
                    </button>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4">
                  {/* Profile photo preview or employee initials */}
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full ring-4 ring-white shadow-xl border-2 border-indigo-100 overflow-hidden bg-slate-100 flex items-center justify-center">
                      {employeeFormData.photo_url ? (
                        <img
                          src={employeeFormData.photo_url}
                          alt={employeeFormData.name || 'Employee profile'}
                          className="w-full h-full object-cover object-center"
                        />
                      ) : (
                        <span className="w-full h-full bg-gradient-to-br from-indigo-100 to-slate-200 flex items-center justify-center text-indigo-700 font-bold text-2xl">
                          {(employeeFormData.name || 'Employee').split(' ').map(part => part[0]).slice(0, 2).join('').toUpperCase()}
                        </span>
                      )}
                    </div>
                    {modalPhotoOptimizing && (
                      <div className="absolute inset-0 bg-slate-950/75 rounded-full flex flex-col items-center justify-center text-white gap-1 backdrop-blur-xs">
                        <Loader2 size={20} className="animate-spin text-indigo-400" />
                        <span className="text-[9px] font-bold tracking-wider">PREPARING...</span>
                      </div>
                    )}
                    <label 
                      className="absolute bottom-0 right-0 p-2 bg-indigo-600 text-white rounded-full shadow-md hover:bg-indigo-700 transition-colors cursor-pointer border-2 border-white"
                      title="Upload custom photo"
                    >
                      <Camera size={14} />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleModalPhotoUpload(file);
                        }}
                      />
                    </label>
                  </div>

                  {/* Upload Controls & URL Input */}
                  <div className="flex-1 w-full space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 hover:border-indigo-400 rounded-xl text-xs font-semibold text-slate-700 shadow-xs hover:bg-indigo-50/50 transition-all cursor-pointer">
                        <Upload size={14} className="text-indigo-600" />
                        <span>Upload From Computer</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleModalPhotoUpload(file);
                          }}
                        />
                      </label>

                    </div>

                    {employeeFormData.photo_url && employeeFormData.photo_url.startsWith('data:image/') ? (
                      <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-200/90 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                          <div className="min-w-0">
                            <p className="font-semibold text-emerald-950 truncate">Profile Photo Selected</p>
                            <span className="text-[10px] text-emerald-700">Cropped to a square for a consistent profile display</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEmployeeFormData(prev => ({ ...prev, photo_url: '' }))}
                          className="text-xs text-rose-600 hover:text-rose-700 font-semibold px-2 py-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-500 font-medium shrink-0">or Web URL:</span>
                        <input
                          type="url"
                          placeholder="https://example.com/photo.jpg"
                          value={employeeFormData.photo_url || ''}
                          onChange={(e) => setEmployeeFormData(prev => ({ ...prev, photo_url: e.target.value }))}
                          className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-800 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                        />
                      </div>
                    )}
                    <p className="text-[11px] text-slate-400">
                      Upload a profile photo or use the employee initials shown when no photo is available.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 1: Personal & Role Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <User size={15} className="text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Personal & Role Information
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Employee Full Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User size={16} />
                      </div>
                      <input
                        type="text"
                        required
                        value={employeeFormData.name || ''}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                        placeholder="e.g. Bipin Shrestha"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Employee ID / Code <span className="text-rose-500">*</span></span>
                      <span className="text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        Fixed: ASL-
                      </span>
                    </label>
                    <div className="relative flex rounded-xl shadow-xs overflow-hidden border border-slate-200 hover:border-slate-300 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20 transition-all bg-slate-50/60">
                      <div className="bg-indigo-50/90 border-r border-indigo-100 px-3.5 flex items-center gap-1.5 text-indigo-700 font-mono font-bold text-xs select-none">
                        <Hash size={14} className="text-indigo-500" />
                        <span>ASL-</span>
                      </div>
                      <input
                        type="text"
                        required
                        value={(employeeFormData.employee_code || '').replace(/^(ASL|EMP)-?/i, '')}
                        onChange={(e) => {
                          const suffix = e.target.value.replace(/^(ASL|EMP)-?/i, '').trim();
                          setEmployeeFormData({ ...employeeFormData, employee_code: `ASL-${suffix}` });
                        }}
                        placeholder="001 or 01012"
                        className="w-full px-3.5 py-2.5 bg-transparent text-sm font-mono font-bold text-slate-900 outline-none placeholder:text-slate-400 placeholder:font-normal"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Designation / Role <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Briefcase size={16} />
                      </div>
                      <input
                        type="text"
                        required
                        value={employeeFormData.designation || ''}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, designation: e.target.value })}
                        placeholder="e.g. Frontend Developer"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                      Department <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Building2 size={16} />
                      </div>
                      <input
                        type="text"
                        required
                        value={employeeFormData.department || ''}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, department: e.target.value })}
                        placeholder="e.g. Technology, Finance, Marketing"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Highlighted Fixed Monthly Salary Card with Quick Presets */}
              <div className="relative overflow-hidden rounded-2xl border border-emerald-300/80 bg-gradient-to-br from-emerald-50/90 via-white to-teal-50/40 p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 uppercase tracking-wide">
                    <Banknote size={15} className="text-emerald-600" />
                    <span>Fixed Monthly Base Salary (रु.)</span>
                    <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100/70 border border-emerald-200 px-2.5 py-0.5 rounded-full w-fit">
                    Accountant Benchmark
                  </span>
                </div>

                <div className="relative mb-3">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <span className="text-lg font-black text-emerald-700">रु.</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={employeeFormData.fixed_salary || ''}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, fixed_salary: Number(e.target.value) })}
                    placeholder="40000"
                    className="w-full pl-12 pr-4 py-3 bg-white border-2 border-emerald-400/80 rounded-xl text-xl font-bold font-mono text-emerald-950 shadow-inner outline-none focus:ring-4 focus:ring-emerald-500/15 focus:border-emerald-600 transition-all"
                  />
                </div>

                {/* Quick Salary Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 mb-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">Quick Presets:</span>
                  {[25000, 35000, 40000, 50000, 75000, 100000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setEmployeeFormData({ ...employeeFormData, fixed_salary: amt })}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all duration-150 cursor-pointer ${
                        employeeFormData.fixed_salary === amt
                          ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600'
                          : 'bg-white hover:bg-emerald-100/60 text-slate-700 border border-slate-200 hover:border-emerald-300'
                      }`}
                    >
                      रु. {(amt / 1000)}k
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-[11px] text-emerald-800/80 bg-white/70 px-3 py-1.5 rounded-lg border border-emerald-100">
                  <span className="font-semibold text-emerald-900">Per-Day Salary Rate:</span>
                  <span>
                    रु. {employeeFormData.fixed_salary ? (Number(employeeFormData.fixed_salary) / DEFAULT_WORKING_DAYS).toFixed(2) : '0.00'} / day (based on standard {DEFAULT_WORKING_DAYS} working days)
                  </span>
                </div>
              </div>

              {/* Section 3: Contact & Direct Banking */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
                  <Landmark size={15} className="text-indigo-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Contact, Banking & Statutory PAN
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail size={16} />
                      </div>
                      <input
                        type="email"
                        value={employeeFormData.email || ''}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                        placeholder="employee@aslenix.com"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Phone Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Phone size={16} />
                      </div>
                      <input
                        type="text"
                        value={employeeFormData.phone || ''}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                        placeholder="98XXXXXXXX"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bank Name</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Landmark size={16} />
                      </div>
                      <input
                        type="text"
                        value={employeeFormData.bank_name || ''}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, bank_name: e.target.value })}
                        placeholder="e.g. Nabil Bank"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium text-slate-800 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bank Account No.</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <CreditCard size={16} />
                      </div>
                      <input
                        type="text"
                        value={employeeFormData.bank_account_no || ''}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, bank_account_no: e.target.value })}
                        placeholder="0190101XXXXXXXX"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-mono font-medium text-slate-800 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">PAN Number</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <FileText size={16} />
                      </div>
                      <input
                        type="text"
                        value={employeeFormData.pan_number || ''}
                        onChange={(e) => setEmployeeFormData({ ...employeeFormData, pan_number: e.target.value })}
                        placeholder="60XXXXXXXX"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-mono font-medium text-slate-800 outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 4: Official Appointment Date in Nepali BS */}
              <div>
                <NepaliDatePicker 
                  label="Joining Date (नियुक्ति मिति)"
                  value={employeeFormData.joining_date || getTodayBsDate()}
                  onChange={(val) => setEmployeeFormData({ ...employeeFormData, joining_date: val })}
                  required
                />
              </div>
            </form>

            {/* Footer with Classy, Executive Buttons */}
            <div className="px-7 py-4 bg-slate-50/90 backdrop-blur-md border-t border-slate-100 flex items-center justify-between gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>Encrypted Staff Profile</span>
              </div>

              <div className="flex items-center gap-3 ml-auto">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200/90 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 hover:border-slate-300 font-semibold text-sm transition-all duration-150 shadow-sm active:scale-[0.98] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEmployee}
                  className="btn-gradient px-6 py-2.5 rounded-xl font-bold text-sm active:scale-[0.98] transition-all flex items-center gap-2.5 cursor-pointer"
                >
                  <UserCheck size={16} className="text-black" />
                  <span>{editingEmployeeId ? 'Save Profile Changes' : 'Create Employee Profile'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: DISBURSE / PAY SALARY */}
      {isPayModalOpen && payingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 ring-1 ring-slate-900/5">
            <div className="flex justify-between items-center px-6 py-5 border-b border-slate-100 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/30">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 ring-4 ring-emerald-50 shrink-0">
                  <CreditCard size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Disburse Salary</h3>
                  <p className="text-xs text-slate-500">Record salary disbursement and payment reference</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-400 hover:text-slate-700 flex items-center justify-center transition-all duration-200 hover:rotate-90 cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4 bg-white">
              <div className="bg-gradient-to-br from-slate-50 to-emerald-50/30 p-4 rounded-2xl border border-slate-200/80">
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Paying To</p>
                <p className="text-base font-bold text-slate-900">{payingRecord.employee_name}</p>
                <p className="text-xs text-slate-500">{payingRecord.designation} • {payingRecord.department}</p>
                
                <div className="mt-3 pt-3 border-t border-slate-200/80 flex justify-between items-center">
                  <span className="text-xs text-slate-600 font-medium">Net Payable (After 1% TDS):</span>
                  <span className="text-xl font-extrabold text-emerald-700 font-mono">{formatNPR(payingRecord.net_salary)}</span>
                </div>
              </div>

              <div>
                <NepaliDatePicker 
                  label="Payment Date (भुक्तानी मिति)"
                  value={paymentFormData.payment_date}
                  onChange={(val) => setPaymentFormData({ ...paymentFormData, payment_date: val })}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Payment Method</label>
                <select
                  value={paymentFormData.payment_method}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_method: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                >
                  <option value="Bank Transfer">Bank Transfer (Nabil / Global / NIC)</option>
                  <option value="Cash">Cash</option>
                  <option value="Cheque">Cheque</option>
                  <option value="eSewa">eSewa</option>
                  <option value="Khalti">Khalti</option>
                  <option value="Mobile Banking">Mobile Banking</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Transaction Ref / Cheque No.</label>
                <input
                  type="text"
                  value={paymentFormData.reference_no}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, reference_no: e.target.value })}
                  placeholder="e.g. TXN-88219"
                  className="w-full px-3.5 py-2.5 bg-slate-50/60 hover:bg-white focus:bg-white border border-slate-200 hover:border-slate-300 rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="record_expense"
                  checked={paymentFormData.record_in_expenses}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, record_in_expenses: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="record_expense" className="text-xs text-slate-600 cursor-pointer select-none">
                  Automatically log this in Company Expenditure under <span className="font-semibold text-slate-800">"Payroll & Salaries"</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 bg-slate-50/90 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-200/90 bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-100/70 hover:border-slate-300 font-semibold text-sm transition-all duration-150 shadow-sm active:scale-[0.98] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPayment}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-semibold text-sm shadow-md hover:shadow-xl hover:shadow-emerald-600/25 active:scale-[0.98] transition-all duration-200 flex items-center gap-2 cursor-pointer border border-emerald-500/30"
              >
                <CheckCircle2 size={16} className="text-emerald-200" />
                <span>Confirm & Mark Paid</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PRINTABLE OFFICIAL SALARY SLIP (PAYSLIP) */}
      {isPayslipModalOpen && activePayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[calc(100vh-2rem)] overflow-hidden relative flex flex-col">
            {/* Modal Controls Bar (hidden during print) */}
            <div className="no-print sticky top-0 z-20 flex shrink-0 justify-between items-center gap-3 px-4 sm:px-6 py-3.5 bg-slate-800 text-white shadow-md">
              <div className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                <FileText size={18} />
                <span className="truncate">Salary Slip Preview — {activePayslip.employee_name} ({activePayslip.month} {activePayslip.year} BS)</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrintPayslip}
                  className="btn-gradient flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
                >
                  <Printer size={15} className="text-black" />
                  <span>Print Salary Slip</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsPayslipModalOpen(false);
                    setActivePayslip(null);
                  }}
                  className="flex items-center gap-1.5 rounded-lg border border-slate-500 px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700 cursor-pointer"
                >
                  <X size={15} />
                  <span>Cancel / Close</span>
                </button>
              </div>
            </div>

            {/* A4 Printable Content */}
            <div id="printable-payslip" className="min-h-0 flex-1 overflow-y-auto p-8 sm:p-12 text-slate-800 bg-white">
              {/* Company Header */}
              {(() => {
                let comp: any = null;
                try {
                  const raw = localStorage.getItem('aslenix_company_settings');
                  if (raw) comp = JSON.parse(raw);
                } catch (e) {}
                const compName = comp?.company_name || 'ASLENIX TECH AND SOLUTION';
                const compAddr = comp?.address || 'Budhanagar, Kathmandu, Nepal';
                const compPhone = comp?.phone || '+977-1-4400000';
                const compEmail = comp?.email || 'contact@aslenix.com';
                const compWeb = comp?.website || 'https://aslenix.com';
                const compPan = comp?.pan_vat_no || '123456789';

                return (
                  <div className="border-b-2 border-slate-900 pb-5 mb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">{compName}</h2>
                        <p className="text-xs text-slate-600 mt-1">{compAddr} • Phone: {compPhone}</p>
                        <p className="text-xs text-slate-600">Email: {compEmail} • Website: {compWeb}</p>
                        <p className="text-xs text-slate-600 font-mono mt-0.5">PAN / VAT No: {compPan}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 font-extrabold text-xs uppercase tracking-wider rounded border border-slate-300">
                          Official Salary Slip
                        </span>
                        <p className="text-xs font-mono text-slate-500 mt-2">Ref: {activePayslip.payroll_ref}</p>
                        <p className="text-xs font-semibold text-slate-800 mt-1">Pay Period: {activePayslip.month} {activePayslip.year} BS</p>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Employee Meta Grid */}
              {(() => {
                const payslipEmp = employees.find(e => 
                  (activePayslip.employee_id && (e.id === activePayslip.employee_id || e.employee_code === activePayslip.employee_id)) ||
                  (activePayslip.employee_code && (e.employee_code === activePayslip.employee_code || e.id === activePayslip.employee_code)) ||
                  (e.name && activePayslip.employee_name && e.name.trim().toLowerCase() === activePayslip.employee_name.trim().toLowerCase())
                );
                const payslipPhoto = activePayslip.photo_url || (payslipEmp ? getEmployeePhoto(payslipEmp) : '');

                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-6">
                    <div>
                      <span className="text-slate-400 uppercase font-semibold text-[10px]">Employee ID</span>
                      <p className="font-bold text-slate-900 mt-0.5">{activePayslip.employee_code}</p>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {payslipPhoto ? (
                        <div className="w-10 h-10 rounded-full ring-2 ring-white border border-slate-300 overflow-hidden bg-slate-100 shrink-0 shadow-xs">
                          <img
                            src={payslipPhoto}
                            alt={activePayslip.employee_name}
                            className="w-full h-full object-cover object-center"
                          />
                        </div>
                      ) : null}
                      <div className="min-w-0">
                        <span className="text-slate-400 uppercase font-semibold text-[10px]">Employee Name</span>
                        <p className="font-bold text-slate-900 mt-0.5 truncate">{activePayslip.employee_name}</p>
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-semibold text-[10px]">Designation</span>
                      <p className="font-bold text-slate-900 mt-0.5">{activePayslip.designation}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-semibold text-[10px]">Department</span>
                      <p className="font-bold text-slate-900 mt-0.5">{activePayslip.department}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-semibold text-[10px]">Payment Method</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{activePayslip.payment_method || 'Bank Transfer'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-semibold text-[10px]">Payment Status</span>
                      <p className="font-bold text-emerald-700 mt-0.5">{activePayslip.payment_status}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-semibold text-[10px]">Payment Date</span>
                      <p className="font-semibold text-slate-900 mt-0.5">{activePayslip.payment_date ? formatNepaliDate(activePayslip.payment_date, 'full') : 'Pending'}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase font-semibold text-[10px]">Txn Reference</span>
                      <p className="font-mono text-slate-900 mt-0.5">{activePayslip.reference_no || 'N/A'}</p>
                    </div>
                  </div>
                );
              })()}

              {/* Attendance Table */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  1. Attendance & Working Days Summary
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-xs text-center">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Total Working Days</th>
                        <th className="py-2 px-3 text-emerald-700">Present Days (1.0x)</th>
                        <th className="py-2 px-3 text-amber-700">Half Days (0.5x)</th>
                        <th className="py-2 px-3 text-red-700">Absent Days (0.0x)</th>
                        <th className="py-2 px-3 font-bold text-slate-900 bg-slate-200/60">Effective Paid Days</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{activePayslip.total_working_days} Days</td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-700">{activePayslip.present_days} Days</td>
                        <td className="py-2.5 px-3 font-semibold text-amber-700">{activePayslip.half_days} Days</td>
                        <td className="py-2.5 px-3 font-semibold text-red-700">{activePayslip.absent_days} Days</td>
                        <td className="py-2.5 px-3 font-extrabold text-slate-900 bg-slate-200/40 text-sm">
                          {activePayslip.effective_days} Days
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-[10px] text-slate-500 mt-1 italic">
                  Note: 2 Half-Days equal 1 full working day. Deductions are calculated proportionately without double-counting.
                </p>
              </div>

              {/* Salary Breakdown Table (Earnings vs Deductions) */}
              <div className="mb-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  2. Salary, Allowances & Tax (TDS) Breakdown
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200 text-xs">
                  {/* Earnings Column */}
                  <div>
                    <div className="bg-slate-100 font-bold text-slate-700 py-2 px-4 border-b border-slate-200">
                      Earnings & Allowances
                    </div>
                    <div className="p-4 space-y-2.5">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Basic Monthly Salary:</span>
                        <span className="font-semibold text-slate-800">{formatNPR(activePayslip.fixed_salary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Daily Salary Rate (Fixed ÷ {activePayslip.total_working_days}):</span>
                        <span className="font-mono text-slate-600">{formatNPR(activePayslip.per_day_rate)}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700 font-medium">
                        <span>Attendance Salary ({activePayslip.effective_days} days):</span>
                        <span>{formatNPR(activePayslip.attendance_salary)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Allowances & Incentives:</span>
                        <span className="font-semibold text-slate-800">+{formatNPR(activePayslip.bonus_allowance)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-slate-900">
                        <span>Net Before TDS:</span>
                        <span>{formatNPR(activePayslip.net_before_tds)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Deductions Column */}
                  <div>
                    <div className="bg-slate-100 font-bold text-slate-700 py-2 px-4 border-b border-slate-200">
                      Deductions & 1% TDS
                    </div>
                    <div className="p-4 space-y-2.5">
                      <div className="flex justify-between text-slate-600">
                        <span>Attendance Adjustment:</span>
                        <span className="text-red-600 font-mono">
                          -{formatNPR(activePayslip.per_day_rate * (activePayslip.total_working_days - activePayslip.effective_days))}
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Other Deductions (Advance/Loan):</span>
                        <span className="text-red-600 font-mono">-{formatNPR(activePayslip.deductions)}</span>
                      </div>
                      <div className="flex justify-between text-red-600 font-semibold bg-red-50/50 p-1.5 rounded border border-red-100">
                        <span>1% TDS (Tax Deducted at Source):</span>
                        <span className="font-mono">-{formatNPR(activePayslip.tds_amount)}</span>
                      </div>
                      <div className="border-t border-slate-200 pt-2 flex justify-between font-bold text-red-700">
                        <span>Total Deductions & Tax:</span>
                        <span>-{formatNPR(
                          activePayslip.per_day_rate * (activePayslip.total_working_days - activePayslip.effective_days) +
                          activePayslip.deductions +
                          activePayslip.tds_amount
                        )}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payable Highlight Banner */}
              <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-300 font-bold">Net Salary Payable to {activePayslip.employee_name}</span>
                  <p className="text-xs text-slate-300 italic mt-0.5">
                    {numberToWordsNepali(activePayslip.net_salary)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-emerald-400 font-mono tracking-tight">
                    {formatNPR(activePayslip.net_salary)}
                  </span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-3 gap-6 pt-10 mt-6 border-t border-slate-200 text-center text-xs text-slate-500">
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mx-auto w-3/4 mb-1"></div>
                  <p className="font-semibold text-slate-800">Prepared By (Accountant)</p>
                  <p className="text-[10px] text-slate-400">Aslenix Finance Dept</p>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mx-auto w-3/4 mb-1"></div>
                  <p className="font-semibold text-slate-800">Verified & Approved</p>
                  <p className="text-[10px] text-slate-400">Managing Director</p>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mx-auto w-3/4 mb-1"></div>
                  <p className="font-semibold text-slate-800">Employee Signature</p>
                  <p className="text-[10px] text-slate-400">Acknowledgment</p>
                </div>
              </div>

              {/* Disclaimer */}
              <p className="text-center text-[10px] text-slate-400 mt-8 pt-4 border-t border-slate-100">
                This is a computer-generated salary slip from {(() => {
                  try {
                    const raw = localStorage.getItem('aslenix_company_settings');
                    if (raw) return JSON.parse(raw).company_name || 'ASLENIX TECH AND SOLUTION';
                  } catch (e) {}
                  return 'ASLENIX TECH AND SOLUTION';
                })()} Finance Management System.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: FULL RESOLUTION HD PHOTO LIGHTBOX */}
      {lightboxPhoto.isOpen && lightboxPhoto.emp && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setLightboxPhoto({ isOpen: false, emp: null, photoSrc: '' })}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200/90 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col ring-1 ring-slate-900/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Lightbox Header */}
            <div className="flex justify-between items-center px-6 py-4.5 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-sm">
                  {lightboxPhoto.emp.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">
                    {lightboxPhoto.emp.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs font-mono font-medium text-slate-500">
                      {lightboxPhoto.emp.employee_code}
                    </span>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      {lightboxPhoto.emp.department}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setLightboxPhoto({ isOpen: false, emp: null, photoSrc: '' })}
                className="w-8 h-8 rounded-full bg-slate-200/70 hover:bg-slate-300/80 text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>

            {/* Photo Preview Container */}
            <div className="p-6 flex flex-col items-center justify-center bg-radial from-slate-50 to-slate-100/90">
              <div className="relative group/box rounded-3xl overflow-hidden ring-4 ring-white shadow-2xl border border-slate-200/80 bg-white max-w-[320px] max-h-[320px]">
                <img
                  src={lightboxPhoto.photoSrc}
                  alt={lightboxPhoto.emp.name}
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                  className="w-full h-full object-cover max-w-[320px] max-h-[320px]"
                />
                <div className="absolute bottom-2 left-2 right-2 px-3 py-1.5 rounded-xl bg-slate-950/70 text-white backdrop-blur-xs flex items-center justify-between text-xs">
                  <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    High-Definition Profile
                  </span>
                  <span className="text-[10px] font-mono text-slate-300">600×600 HD</span>
                </div>
              </div>

              <p className="text-xs text-slate-500 mt-3 text-center">
                {lightboxPhoto.emp.designation} • {lightboxPhoto.emp.department}
              </p>
            </div>

            {/* Lightbox Action Controls */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <a
                  href={lightboxPhoto.photoSrc}
                  download={`${lightboxPhoto.emp.name.replace(/\s+/g, '_')}_profile.jpg`}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition-colors cursor-pointer"
                  title="Download full quality photo"
                >
                  <Download size={14} />
                  <span>Download</span>
                </a>

              </div>

              <div className="flex items-center gap-2">
                <label className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shadow-sm">
                  <Camera size={14} />
                  <span>Change</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && lightboxPhoto.emp) {
                        handleDirectPhotoUpload(lightboxPhoto.emp.id, file).then(() => {
                          optimizeProfilePhoto(file).then((newSrc) => {
                            if (newSrc) {
                              setLightboxPhoto(prev => ({ ...prev, photoSrc: newSrc }));
                            }
                          });
                        });
                      }
                    }}
                  />
                </label>

                <button
                  type="button"
                  onClick={() => {
                    if (lightboxPhoto.emp) {
                      handleRemoveEmployeePhoto(lightboxPhoto.emp.id);
                    }
                  }}
                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-colors border border-rose-200/60 cursor-pointer"
                  title="Remove photo"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: OFFICIAL DIGITAL EMPLOYEE ID BADGE LIGHTBOX & PRINT */}
      {idCardModalEmp && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setIdCardModalEmp(null)}
        >
          <div 
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200 p-6 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3.5 mb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                  <QrCode size={16} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 leading-none">Digital Employee ID Badge</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Official Scannable Credential Card</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIdCardModalEmp(null)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                title="Close"
              >
                <X size={15} />
              </button>
            </div>

            {/* Badge Render Area */}
            <div id="printable-id-card" className="py-2 flex justify-center">
              <EmployeeIdCard
                employee={idCardModalEmp}
                isPrintOnly={true}
              />
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2.5 mt-5 pt-3.5 border-t border-slate-100">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-[0.98] cursor-pointer"
              >
                <Printer size={14} />
                <span>Print ID Badge</span>
              </button>
              <button
                type="button"
                onClick={() => setIdCardModalEmp(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete ${itemToDelete?.type === 'payroll' ? 'Salary Record' : 'Employee'}`}
        message={`Are you sure you want to delete this ${
          itemToDelete?.type === 'payroll' ? 'payroll entry' : 'employee record'
        }? This action cannot be undone.`}
        confirmText="Delete"
        isDanger={true}
      />
    </div>
  );
};

export default Payroll;
