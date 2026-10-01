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
  Receipt
} from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';

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
  notes?: string;
}

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
  total_working_days: number; // Default 26, admin editable
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
  notes?: string;
}

/**
 * Exact Salary & Attendance Calculation Engine
 * 1. Working Days: Default 26, admin can adjust
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
  const total_working_days = Math.max(1, Number(workingDaysInput) || 26);
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

const initialEmployees: Employee[] = [
  {
    id: 'EMP-001',
    employee_code: 'EMP-001',
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
    joining_date: '2025-01-15',
    is_active: true,
  },
  {
    id: 'EMP-002',
    employee_code: 'EMP-002',
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
    joining_date: '2025-02-01',
    is_active: true,
  },
  {
    id: 'EMP-003',
    employee_code: 'EMP-003',
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
    joining_date: '2025-04-10',
    is_active: true,
  },
  {
    id: 'EMP-004',
    employee_code: 'EMP-004',
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
    joining_date: '2025-06-01',
    is_active: true,
  },
  {
    id: 'EMP-005',
    employee_code: 'EMP-005',
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
    joining_date: '2025-08-15',
    is_active: true,
  }
];

// Initial demo records calculated using the exact salary and 1% TDS rules
const initialPayrollRecords: PayrollRecord[] = [
  {
    id: 'PAY-2026-10-001',
    payroll_ref: 'PAY-2026-10-001',
    employee_id: 'EMP-001',
    employee_code: 'EMP-001',
    employee_name: 'Aarav Sharma',
    designation: 'Senior Full Stack Engineer',
    department: 'Technology',
    month: 'October',
    year: 2026,
    total_working_days: 26,
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
    payment_date: '2026-10-01',
    payment_method: 'Bank Transfer',
    reference_no: 'NBL-TXN-98442',
    notes: '24 present, 2 half days = 25 effective days. 1% TDS applied.'
  },
  {
    id: 'PAY-2026-10-002',
    payroll_ref: 'PAY-2026-10-002',
    employee_id: 'EMP-002',
    employee_code: 'EMP-002',
    employee_name: 'Pooja Shrestha',
    designation: 'Lead Accountant',
    department: 'Finance',
    month: 'October',
    year: 2026,
    total_working_days: 26,
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
    id: 'PAY-2026-10-003',
    payroll_ref: 'PAY-2026-10-003',
    employee_id: 'EMP-003',
    employee_code: 'EMP-003',
    employee_name: 'Rohan Adhikari',
    designation: 'UI/UX & Frontend Designer',
    department: 'Creative & Tech',
    month: 'October',
    year: 2026,
    total_working_days: 26,
    present_days: 23,
    half_days: 2,
    absent_days: 2,
    effective_days: 24.0,
    fixed_salary: 48000,
    per_day_rate: 1846.15,
    attendance_salary: 44307.69,
    earned_salary: 44307.69,
    bonus_allowance: 1000,
    deductions: 2000,
    net_before_tds: 43307.69,
    tds_rate: 1,
    tds_amount: 433.08,
    net_salary: 42874.61,
    payment_status: 'Unpaid',
    notes: 'Advance salary deduction Rs. 2,000. 1% TDS applied.'
  },
  {
    id: 'PAY-2026-10-004',
    payroll_ref: 'PAY-2026-10-004',
    employee_id: 'EMP-004',
    employee_code: 'EMP-004',
    employee_name: 'Sneha Karki',
    designation: 'Business Development Officer',
    department: 'Marketing',
    month: 'October',
    year: 2026,
    total_working_days: 26,
    present_days: 26,
    half_days: 0,
    absent_days: 0,
    effective_days: 26.0,
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
    payment_date: '2026-10-01',
    payment_method: 'Bank Transfer',
    reference_no: 'SNM-TXN-55120',
    notes: '100% full attendance + marketing commission. 1% TDS applied.'
  }
];

const monthsList = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
  'Baisakh', 'Jestha', 'Ashadh', 'Shrawan', 'Bhadra', 'Ashwin', 'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'
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
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('aslenix_employees');
    return saved ? JSON.parse(saved) : initialEmployees;
  });
  
  // Persistent state for Payroll Records with backward-compatible mapper
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>(() => {
    const saved = localStorage.getItem('aslenix_payroll_records');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return parsed.map((r: any) => {
          const attendance_salary = r.attendance_salary ?? r.earned_salary ?? ((r.fixed_salary / (r.total_working_days || 26)) * (r.effective_days || 0));
          const net_before_tds = r.net_before_tds ?? (attendance_salary + (r.bonus_allowance || 0) - (r.deductions || 0));
          const tds_rate = r.tds_rate ?? 1;
          const tds_amount = r.tds_amount ?? Number((net_before_tds * (tds_rate / 100)).toFixed(2));
          const net_salary = r.tds_amount !== undefined ? r.net_salary : Math.max(0, Number((net_before_tds - tds_amount).toFixed(2)));
          return {
            ...r,
            attendance_salary: Number(attendance_salary.toFixed(2)),
            earned_salary: Number(attendance_salary.toFixed(2)),
            net_before_tds: Number(net_before_tds.toFixed(2)),
            tds_rate,
            tds_amount,
            net_salary
          };
        });
      } catch (e) {
        console.error('Error loading payroll records:', e);
      }
    }
    return initialPayrollRecords;
  });

  // Filters & Period
  const [selectedMonth, setSelectedMonth] = useState('October');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [defaultWorkingDays, setDefaultWorkingDays] = useState(26);

  // Modals
  const [isSalaryModalOpen, setIsSalaryModalOpen] = useState(false);
  const [editingPayrollId, setEditingPayrollId] = useState<string | null>(null);
  
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);

  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [payingRecord, setPayingRecord] = useState<PayrollRecord | null>(null);
  const [paymentFormData, setPaymentFormData] = useState({
    payment_date: new Date().toISOString().split('T')[0],
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
    joining_date: new Date().toISOString().split('T')[0],
    is_active: true,
    notes: ''
  });

  // Save to localStorage
  const saveEmployees = (updated: Employee[]) => {
    setEmployees(updated);
    localStorage.setItem('aslenix_employees', JSON.stringify(updated));
  };

  const savePayrollRecords = (updated: PayrollRecord[]) => {
    setPayrollRecords(updated);
    localStorage.setItem('aslenix_payroll_records', JSON.stringify(updated));
  };

  // Filtered Payroll Records for Selected Period
  const periodPayrollRecords = useMemo(() => {
    return payrollRecords.filter(record => 
      record.month === selectedMonth && 
      record.year === selectedYear
    );
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
      const defaultEmpId = empId || (employees.length > 0 ? employees[0].id : '');
      setEditingPayrollId(null);
      setSalaryFormData({
        employee_id: defaultEmpId,
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
    setIsSalaryModalOpen(true);
  };

  // Submit Salary calculation modal
  const handleSaveSalaryRecord = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedEmp = employees.find(e => e.id === salaryFormData.employee_id);
    if (!selectedEmp) {
      alert('Please select a valid employee.');
      return;
    }

    const calc = calculatedSalaryDetails;

    if (editingPayrollId) {
      // Update existing record
      const updated = payrollRecords.map(item => {
        if (item.id === editingPayrollId) {
          return {
            ...item,
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
            notes: salaryFormData.notes
          };
        }
        return item;
      });
      savePayrollRecords(updated);
    } else {
      // Create new record
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
      setEmployeeFormData({ ...emp });
    } else {
      setEditingEmployeeId(null);
      const nextCode = `EMP-${String(employees.length + 1).padStart(3, '0')}`;
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
        joining_date: new Date().toISOString().split('T')[0],
        is_active: true,
        notes: ''
      });
    }
    setIsEmployeeModalOpen(true);
  };

  // Save Employee Profile & Fixed Salary
  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeFormData.name || !employeeFormData.designation) {
      alert('Name and designation are required.');
      return;
    }

    if (editingEmployeeId) {
      const updated = employees.map(emp => {
        if (emp.id === editingEmployeeId) {
          return {
            ...emp,
            ...(employeeFormData as Employee),
            fixed_salary: Number(employeeFormData.fixed_salary) || 0
          };
        }
        return emp;
      });
      saveEmployees(updated);
    } else {
      const newEmp: Employee = {
        id: employeeFormData.employee_code || `EMP-${Date.now()}`,
        employee_code: employeeFormData.employee_code || `EMP-${employees.length + 1}`,
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
        joining_date: employeeFormData.joining_date || new Date().toISOString().split('T')[0],
        is_active: employeeFormData.is_active ?? true,
        notes: employeeFormData.notes || ''
      };
      saveEmployees([...employees, newEmp]);
    }

    setIsEmployeeModalOpen(false);
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
              <option value={2026}>2026 (2082/83)</option>
              <option value={2025}>2025 (2081/82)</option>
              <option value={2027}>2027 (2083/84)</option>
            </select>
          </div>

          <button
            onClick={() => handleOpenSalaryModal()}
            className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl text-sm font-medium hover:bg-accent-hover transition-colors shadow-sm shadow-accent/20 cursor-pointer"
          >
            <Plus size={18} />
            <span>Add / Calculate Salary</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Card 1: Total Gross / Attendance Salary */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Gross Attendance</span>
            <div className="p-2 bg-blue-50 text-accent rounded-xl">
              <DollarSign size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-primary">{formatNPR(summaryMetrics.totalAttendanceSalary)}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Before Allowances & TDS</p>
          </div>
        </div>

        {/* Card 2: 1% TDS Withheld */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total 1% TDS</span>
            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
              <Receipt size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-red-600">-{formatNPR(summaryMetrics.totalTds)}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Statutory tax deducted</p>
          </div>
        </div>

        {/* Card 3: Final Net Payroll */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Final Net Payroll</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-emerald-600">{formatNPR(summaryMetrics.totalPayroll)}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Net payable to staff</p>
          </div>
        </div>

        {/* Card 4: Pending Payout */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Pending Payout</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Clock size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-amber-600">{formatNPR(summaryMetrics.pendingPayout)}</h3>
            <p className="text-xs text-slate-500 mt-0.5">Unpaid / In Approval</p>
          </div>
        </div>

        {/* Card 5: Average Attendance */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Avg. Attendance</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
              <Percent size={18} />
            </div>
          </div>
          <div className="mt-3">
            <h3 className="text-xl font-bold text-purple-700">{summaryMetrics.avgAttendance}%</h3>
            <p className="text-xs text-slate-500 mt-0.5">{summaryMetrics.activeEmployeesCount} active employees</p>
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
          <div className="flex flex-col lg:flex-row justify-between items-stretch lg:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex flex-wrap items-center gap-3">
              {/* Search */}
              <div className="relative min-w-[240px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search employee, ID, role..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-accent focus:bg-white transition-all"
                />
              </div>

              {/* Department Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <Filter size={14} className="text-slate-400" />
                <span className="font-medium">Dept:</span>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
                >
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <span className="font-medium">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 outline-none cursor-pointer text-xs"
                >
                  <option value="All">All</option>
                  <option value="Paid">Paid</option>
                  <option value="Approved">Approved</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            {/* Quick Batch Actions & Admin Working Days Input */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs">
                <span className="text-slate-600 font-semibold">Working Days (Default 26):</span>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={defaultWorkingDays}
                  onChange={(e) => setDefaultWorkingDays(Number(e.target.value) || 26)}
                  className="w-12 bg-white border border-slate-300 text-center font-bold text-slate-900 rounded py-0.5 outline-none focus:border-accent"
                />
              </div>

              <button
                onClick={handleGenerateAllForMonth}
                title="Generates salary record with 100% full present for all active employees not yet recorded"
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
              >
                <UserCheck size={14} className="text-emerald-600" />
                <span>Auto-Fill All Employees</span>
              </button>
            </div>
          </div>

          {/* Payroll Table displaying all requested columns */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-100">
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
                    <th className="px-4 py-3.5 text-right font-bold text-slate-900 whitespace-nowrap">Net Payable</th>
                    <th className="px-2 py-3.5 text-center whitespace-nowrap">Status</th>
                    <th className="px-3 py-3.5 text-right whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {displayedPayroll.length === 0 ? (
                    <tr>
                      <td colSpan={15} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <Banknote size={36} className="text-slate-300" />
                          <p className="font-medium text-slate-600">No payroll records found for {selectedMonth} {selectedYear}.</p>
                          <p className="text-xs text-slate-400">Click "+ Add / Calculate Salary" or "Auto-Fill All Employees" to generate records.</p>
                          <button
                            onClick={handleGenerateAllForMonth}
                            className="mt-2 px-4 py-1.5 bg-accent text-white text-xs font-semibold rounded-lg hover:bg-accent-hover transition-colors"
                          >
                            Populate Active Employees
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    displayedPayroll.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Employee */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs border border-slate-200 shrink-0">
                              {record.employee_name.split(' ').map(n => n[0]).join('')}
                            </div>
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
                              title="View & Print Official Payslip"
                              className="p-1.5 text-slate-500 hover:text-accent hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <FileText size={15} />
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
                    ))
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
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-primary">Employee Salary Directory</h2>
              <p className="text-xs text-slate-500">Employee profiles, bank accounts, and monthly fixed base salaries set by the accountant.</p>
            </div>
            <button
              onClick={() => handleOpenEmployeeModal()}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              <UserPlus size={16} />
              <span>Add New Employee</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] font-semibold tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3.5">Code & Name</th>
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
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Code & Name */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-accent/10 text-accent font-bold flex items-center justify-center text-xs">
                            {emp.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-900 leading-tight">{emp.name}</p>
                            <span className="text-xs font-mono font-medium text-slate-400">{emp.employee_code}</span>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT SALARY CALCULATION */}
      {isSalaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-accent/10 text-accent rounded-xl">
                  <Banknote size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">
                    {editingPayrollId ? 'Edit Attendance & Calculate Salary' : 'Calculate Employee Salary'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calculates attendance salary, allowances, other deductions, and 1% TDS.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSalaryModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSalaryRecord} className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
              {/* Employee Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Select Employee *</label>
                  <select
                    required
                    value={salaryFormData.employee_id}
                    onChange={(e) => setSalaryFormData({ ...salaryFormData, employee_id: e.target.value })}
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
                      onChange={(e) => setSalaryFormData({ ...salaryFormData, month: e.target.value })}
                      className="w-full px-2 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                    >
                      {monthsList.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                    <input
                      type="number"
                      value={salaryFormData.year}
                      onChange={(e) => setSalaryFormData({ ...salaryFormData, year: Number(e.target.value) })}
                      className="w-20 px-2 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent text-center font-bold"
                    />
                  </div>
                </div>
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
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Default = 26</span>
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
                  placeholder="e.g. October payroll with festival bonus"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSalaryModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-medium rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-accent text-white font-medium rounded-xl text-sm hover:bg-accent-hover transition-colors shadow-sm shadow-accent/20 cursor-pointer"
                >
                  {editingPayrollId ? 'Update Salary Record' : 'Save & Calculate Salary'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD / EDIT EMPLOYEE PROFILE & FIXED SALARY */}
      {isEmployeeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <UserPlus size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary">
                    {editingEmployeeId ? 'Edit Employee & Fixed Salary' : 'Add New Employee'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Fix the employee's baseline monthly salary and banking details.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsEmployeeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEmployee} className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee Full Name *</label>
                  <input
                    type="text"
                    required
                    value={employeeFormData.name || ''}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, name: e.target.value })}
                    placeholder="e.g. Bipin Shrestha"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID / Code *</label>
                  <input
                    type="text"
                    required
                    value={employeeFormData.employee_code || ''}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, employee_code: e.target.value })}
                    placeholder="e.g. EMP-006"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Designation / Role *</label>
                  <input
                    type="text"
                    required
                    value={employeeFormData.designation || ''}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, designation: e.target.value })}
                    placeholder="e.g. Frontend Developer"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Department *</label>
                  <input
                    type="text"
                    required
                    value={employeeFormData.department || ''}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, department: e.target.value })}
                    placeholder="e.g. Technology, Finance, Marketing"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>
              </div>

              {/* Highlighted Fixed Salary Field */}
              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200">
                <label className="block text-xs font-bold text-emerald-900 mb-1">
                  Fixed Monthly Salary (रु.) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-emerald-700 text-sm">
                    रु.
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    required
                    value={employeeFormData.fixed_salary || ''}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, fixed_salary: Number(e.target.value) })}
                    placeholder="e.g. 50000"
                    className="w-full pl-9 pr-4 py-2.5 bg-white border border-emerald-300 rounded-xl text-lg font-bold text-emerald-900 outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-emerald-700 mt-1.5">
                  Base salary fixed by the accountant. Daily salary rate is calculated as: 
                  <span className="font-semibold"> Fixed Salary ÷ Total Working Days</span>.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                  <input
                    type="email"
                    value={employeeFormData.email || ''}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, email: e.target.value })}
                    placeholder="employee@aslenix.com"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={employeeFormData.phone || ''}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, phone: e.target.value })}
                    placeholder="98XXXXXXXX"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    value={employeeFormData.bank_name || ''}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, bank_name: e.target.value })}
                    placeholder="e.g. Nabil Bank"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Account No.</label>
                  <input
                    type="text"
                    value={employeeFormData.bank_account_no || ''}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, bank_account_no: e.target.value })}
                    placeholder="0190101XXXXXXXX"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">PAN Number</label>
                  <input
                    type="text"
                    value={employeeFormData.pan_number || ''}
                    onChange={(e) => setEmployeeFormData({ ...employeeFormData, pan_number: e.target.value })}
                    placeholder="60XXXXXXXX"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEmployeeModalOpen(false)}
                  className="px-5 py-2.5 text-slate-600 hover:bg-slate-100 font-medium rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-primary text-white font-medium rounded-xl text-sm hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                >
                  {editingEmployeeId ? 'Save Changes' : 'Create Employee Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DISBURSE / PAY SALARY */}
      {isPayModalOpen && payingRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5 text-emerald-600">
                <div className="p-2 bg-emerald-50 rounded-xl">
                  <CreditCard size={20} />
                </div>
                <h3 className="text-lg font-bold text-primary">Disburse Salary</h3>
              </div>
              <button 
                onClick={() => setIsPayModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-xs text-slate-500 uppercase font-semibold">Paying To</p>
                <p className="text-base font-bold text-slate-900">{payingRecord.employee_name}</p>
                <p className="text-xs text-slate-500">{payingRecord.designation} • {payingRecord.department}</p>
                
                <div className="mt-3 pt-3 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-xs text-slate-500">Net Payable (After 1% TDS):</span>
                  <span className="text-xl font-extrabold text-emerald-700">{formatNPR(payingRecord.net_salary)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Date</label>
                <input
                  type="date"
                  value={paymentFormData.payment_date}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_date: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Payment Method</label>
                <select
                  value={paymentFormData.payment_method}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_method: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transaction Ref / Cheque No.</label>
                <input
                  type="text"
                  value={paymentFormData.reference_no}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, reference_no: e.target.value })}
                  placeholder="e.g. TXN-88219"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="record_expense"
                  checked={paymentFormData.record_in_expenses}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, record_in_expenses: e.target.checked })}
                  className="w-4 h-4 text-accent rounded border-slate-300 focus:ring-accent cursor-pointer"
                />
                <label htmlFor="record_expense" className="text-xs text-slate-600 cursor-pointer select-none">
                  Automatically log this in Company Expenditure under <span className="font-semibold">"Payroll & Salaries"</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-5 py-2 text-slate-600 hover:bg-slate-100 font-medium rounded-xl text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="px-6 py-2 bg-emerald-600 text-white font-medium rounded-xl text-sm hover:bg-emerald-700 transition-colors shadow-sm shadow-emerald-600/20 cursor-pointer"
                >
                  Confirm & Mark Paid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: PRINTABLE OFFICIAL SALARY SLIP (PAYSLIP) */}
      {isPayslipModalOpen && activePayslip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden relative my-8">
            {/* Modal Controls Bar (hidden during print) */}
            <div className="no-print flex justify-between items-center px-6 py-3.5 bg-slate-800 text-white">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <FileText size={18} />
                <span>Salary Slip Preview — {activePayslip.employee_name} ({activePayslip.month} {activePayslip.year})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-accent hover:bg-accent-hover text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Printer size={15} />
                  <span>Print Payslip</span>
                </button>
                <button
                  onClick={() => setIsPayslipModalOpen(false)}
                  className="p-1.5 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* A4 Printable Content */}
            <div id="printable-payslip" className="p-8 sm:p-12 text-slate-800 bg-white">
              {/* Company Header */}
              <div className="border-b-2 border-slate-900 pb-5 mb-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">ASLENIX TECH AND SOLUTION</h2>
                    <p className="text-xs text-slate-600 mt-1">Kathmandu, Nepal • Phone: +977-1-4400000</p>
                    <p className="text-xs text-slate-600">Email: accounts@aslenix.com • Website: www.aslenix.com</p>
                    <p className="text-xs text-slate-600 font-mono mt-0.5">PAN / VAT No: 609876543</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-3 py-1 bg-slate-100 text-slate-800 font-extrabold text-xs uppercase tracking-wider rounded border border-slate-300">
                      Official Payslip
                    </span>
                    <p className="text-xs font-mono text-slate-500 mt-2">Ref: {activePayslip.payroll_ref}</p>
                    <p className="text-xs font-semibold text-slate-800 mt-1">Pay Period: {activePayslip.month} {activePayslip.year}</p>
                  </div>
                </div>
              </div>

              {/* Employee Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs mb-6">
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Employee ID</span>
                  <p className="font-bold text-slate-900 mt-0.5">{activePayslip.employee_code}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Employee Name</span>
                  <p className="font-bold text-slate-900 mt-0.5">{activePayslip.employee_name}</p>
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
                  <p className="font-semibold text-slate-900 mt-0.5">{activePayslip.payment_date || 'Pending'}</p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-semibold text-[10px]">Txn Reference</span>
                  <p className="font-mono text-slate-900 mt-0.5">{activePayslip.reference_no || 'N/A'}</p>
                </div>
              </div>

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
                        <span className="text-slate-600">Fixed Monthly Base:</span>
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
                        <span>Absent / Half-day Adjustment:</span>
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
                        <span>-{formatNPR(activePayslip.deductions + activePayslip.tds_amount)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Net Payable Highlight Banner */}
              <div className="p-4 bg-slate-900 text-white rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 mb-6">
                <div>
                  <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Final Net Salary Payable</span>
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
                This is a computer-generated salary slip from ASLENIX TECH AND SOLUTION Finance Management System.
              </p>
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
