/**
 * ASLENIX FINANCE - NEPAL ACCOUNTING & IRD COMPLIANCE UTILITIES
 * Standardized for Inland Revenue Department (IRD) Nepal specifications.
 */

// 1. Currency & Number Formatting for Nepal (NPR / Rs.)
export const formatNPR = (amount: number | string | null | undefined): string => {
  const num = Number(amount) || 0;
  return `Rs. ${num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const roundToTwoDecimals = (val: number): number => {
  return Math.round((val + Number.EPSILON) * 100) / 100;
};

// 2. Nepal PAN Validation (Nepal PAN is strictly 9 numeric digits)
export const isValidNepalPAN = (pan?: string | null): boolean => {
  if (!pan) return false;
  const clean = pan.trim();
  return /^\d{9}$/.test(clean);
};

// 3. Number to Words in Nepali Rupees (अक्षरेपी)
const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertBelowThousand(n: number): string {
  let str = '';
  if (n >= 100) {
    str += ones[Math.floor(n / 100)] + ' Hundred ';
    n %= 100;
  }
  if (n >= 20) {
    str += tens[Math.floor(n / 10)] + ' ';
    n %= 10;
  }
  if (n > 0) {
    str += ones[n] + ' ';
  }
  return str.trim();
}

/**
 * Converts numeric amount to words in Indian/Nepali numbering format (Crore, Lakh, Thousand, Hundred)
 * Example: 150000.50 -> "Rupees One Lakh Fifty Thousand and Fifty Paisa Only"
 */
export const numberToWordsNPR = (amount: number): string => {
  if (amount === 0) return 'Rupees Zero Only';
  if (isNaN(amount) || !isFinite(amount)) return '';

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const wholePart = Math.floor(absAmount);
  const decimalPart = Math.round((absAmount - wholePart) * 100);

  let remaining = wholePart;
  let words = '';

  // Crores (10,000,000)
  if (remaining >= 10000000) {
    const crore = Math.floor(remaining / 10000000);
    words += convertBelowThousand(crore) + ' Crore ';
    remaining %= 10000000;
  }

  // Lakhs (100,000)
  if (remaining >= 100000) {
    const lakh = Math.floor(remaining / 100000);
    words += convertBelowThousand(lakh) + ' Lakh ';
    remaining %= 100000;
  }

  // Thousands (1,000)
  if (remaining >= 1000) {
    const thousand = Math.floor(remaining / 1000);
    words += convertBelowThousand(thousand) + ' Thousand ';
    remaining %= 1000;
  }

  // Remaining (Hundreds & Tens)
  if (remaining > 0) {
    words += convertBelowThousand(remaining) + ' ';
  }

  words = words.trim();
  let result = `Rupees ${words}`;

  if (decimalPart > 0) {
    result += ` and ${convertBelowThousand(decimalPart)} Paisa`;
  }

  result += ' Only';
  return isNegative ? `Minus ${result}` : result;
};

// 4. Nepal IRD Tax Classifications & Calculation
export type TaxClassification = 'Taxable' | 'Exempt' | 'Zero-Rated';

export interface TaxCalculationLine {
  quantity: number;
  rate: number;
  discount?: number; // monetary discount
  taxClassification: TaxClassification;
  customVatRate?: number; // defaults to 13% if Taxable
}

export interface TaxCalculationResult {
  grossSubtotal: number;
  totalDiscount: number;
  taxableAmount: number;
  exemptAmount: number;
  zeroRatedAmount: number;
  vatAmount: number;
  grandTotal: number;
}

export const calculateTaxBreakdown = (
  lines: TaxCalculationLine[],
  isVatRegistered: boolean = true,
  invoiceDiscount: number = 0
): TaxCalculationResult => {
  let grossSubtotal = 0;
  let totalLineDiscount = 0;
  let taxableSubtotal = 0;
  let exemptSubtotal = 0;
  let zeroRatedSubtotal = 0;
  let vatAmount = 0;

  for (const line of lines) {
    const lineGross = roundToTwoDecimals(line.quantity * line.rate);
    const lineDiscount = Math.min(lineGross, roundToTwoDecimals(line.discount || 0));
    const lineNet = Math.max(0, lineGross - lineDiscount);

    grossSubtotal += lineGross;
    totalLineDiscount += lineDiscount;

    if (!isVatRegistered || line.taxClassification === 'Exempt') {
      exemptSubtotal += lineNet;
    } else if (line.taxClassification === 'Zero-Rated') {
      zeroRatedSubtotal += lineNet;
    } else {
      // Taxable at 13% (or custom)
      const vatRate = line.customVatRate !== undefined ? line.customVatRate : 13;
      taxableSubtotal += lineNet;
      vatAmount += roundToTwoDecimals(lineNet * (vatRate / 100));
    }
  }

  // Apply invoice-level overall discount proportionally if present
  const totalDiscount = roundToTwoDecimals(totalLineDiscount + (invoiceDiscount || 0));
  if (invoiceDiscount > 0 && taxableSubtotal > 0) {
    const proportion = Math.min(1, invoiceDiscount / (taxableSubtotal + exemptSubtotal + zeroRatedSubtotal));
    const taxDiscount = roundToTwoDecimals(taxableSubtotal * proportion);
    taxableSubtotal = Math.max(0, taxableSubtotal - taxDiscount);
    vatAmount = roundToTwoDecimals(taxableSubtotal * 0.13);
  }

  const grandTotal = roundToTwoDecimals(taxableSubtotal + exemptSubtotal + zeroRatedSubtotal + vatAmount);

  return {
    grossSubtotal: roundToTwoDecimals(grossSubtotal),
    totalDiscount: roundToTwoDecimals(totalDiscount),
    taxableAmount: roundToTwoDecimals(taxableSubtotal),
    exemptAmount: roundToTwoDecimals(exemptSubtotal),
    zeroRatedAmount: roundToTwoDecimals(zeroRatedSubtotal),
    vatAmount: roundToTwoDecimals(vatAmount),
    grandTotal,
  };
};

// 5. Nepal TDS Sections & Rates (Income Tax Act 2058)
export interface TDSCategory {
  code: string;
  section: string;
  name: string;
  defaultRate: number; // in percentage
  threshold?: number;
  description: string;
}

export const NEPAL_TDS_CATEGORIES: TDSCategory[] = [
  {
    code: 'TDS_SEC_88_CONSULTANCY',
    section: 'Sec 88',
    name: 'Technical / Consultancy Services (Non-VAT)',
    defaultRate: 15,
    description: '15% TDS on fees for technical, management or consultancy services without VAT invoice',
  },
  {
    code: 'TDS_SEC_88_SERVICE_VAT',
    section: 'Sec 88',
    name: 'Technical / Professional Services (With VAT Bill)',
    defaultRate: 1.5,
    description: '1.5% TDS on service contract with official VAT invoice',
  },
  {
    code: 'TDS_SEC_88_RENT',
    section: 'Sec 88',
    name: 'House / Office Rent (Corporate / Commercial)',
    defaultRate: 10,
    description: '10% TDS on house, building, or office rent payments',
  },
  {
    code: 'TDS_SEC_89_CONTRACT',
    section: 'Sec 89',
    name: 'Supply of Goods / Works Contract (> NPR 50,000)',
    defaultRate: 1.5,
    threshold: 50000,
    description: '1.5% TDS on contract or procurement exceeding Rs 50,000',
  },
  {
    code: 'TDS_SEC_88_COMMISSION',
    section: 'Sec 88',
    name: 'Brokerage & Commission',
    defaultRate: 15,
    description: '15% withholding tax on sales brokerage or agent commission',
  },
  {
    code: 'TDS_SEC_87_EMPLOYMENT',
    section: 'Sec 87',
    name: 'Employment Remuneration / Social Security',
    defaultRate: 1,
    description: '1% Social Security Tax on remuneration within first tax bracket',
  },
  {
    code: 'TDS_EXEMPT',
    section: 'Exempt',
    name: 'TDS Exempt / Threshold Not Met',
    defaultRate: 0,
    description: 'Transactions exempt from withholding tax',
  },
];

// 6. Chart of Accounts (COA) Standard Definition
export interface AccountItem {
  code: string;
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  subType: string;
  normalBalance: 'Debit' | 'Credit';
  description?: string;
}

export const STANDARD_CHART_OF_ACCOUNTS: AccountItem[] = [
  // Assets (1000 - 1999)
  { code: '1010', name: 'Cash in Hand', type: 'Asset', subType: 'Cash & Bank', normalBalance: 'Debit', description: 'Liquid cash maintained in office' },
  { code: '1020', name: 'Global IME Bank (Main Account)', type: 'Asset', subType: 'Cash & Bank', normalBalance: 'Debit', description: 'Primary operating bank account' },
  { code: '1030', name: 'Nabil Bank Account', type: 'Asset', subType: 'Cash & Bank', normalBalance: 'Debit', description: 'Secondary bank account' },
  { code: '1040', name: 'Digital Wallets (eSewa / Khalti)', type: 'Asset', subType: 'Cash & Bank', normalBalance: 'Debit', description: 'Corporate digital payment wallets' },
  { code: '1100', name: 'Accounts Receivable (Debtors)', type: 'Asset', subType: 'Current Asset', normalBalance: 'Debit', description: 'Customer balances due on credit sales' },
  { code: '1200', name: 'Input VAT Receivable', type: 'Asset', subType: 'Duties & Taxes', normalBalance: 'Debit', description: '13% VAT paid on eligible purchases/expenses' },
  { code: '1210', name: 'Advance TDS Receivable', type: 'Asset', subType: 'Duties & Taxes', normalBalance: 'Debit', description: 'TDS deducted by clients on payments to Aslenix' },
  { code: '1500', name: 'Office Equipment & Computers', type: 'Asset', subType: 'Fixed Asset', normalBalance: 'Debit', description: 'Laptops, screens, hardware' },

  // Liabilities (2000 - 2999)
  { code: '2010', name: 'Accounts Payable (Creditors)', type: 'Liability', subType: 'Current Liability', normalBalance: 'Credit', description: 'Vendor balances due for purchases/services' },
  { code: '2100', name: 'Output VAT Payable', type: 'Liability', subType: 'Duties & Taxes', normalBalance: 'Credit', description: '13% VAT collected on taxable sales' },
  { code: '2110', name: 'TDS Payable to IRD', type: 'Liability', subType: 'Duties & Taxes', normalBalance: 'Credit', description: 'Withholding tax deducted on vendor/employee payments' },
  { code: '2120', name: 'Salaries & Payroll Payable', type: 'Liability', subType: 'Current Liability', normalBalance: 'Credit', description: 'Accrued unpaid staff salaries' },

  // Equity (3000 - 3999)
  { code: '3010', name: 'Owners Capital', type: 'Equity', subType: 'Equity', normalBalance: 'Credit', description: 'Initial paid-up capital of Aslenix Tech' },
  { code: '3020', name: 'Retained Earnings', type: 'Equity', subType: 'Equity', normalBalance: 'Credit', description: 'Cumulative net profit or loss' },

  // Revenue (4000 - 4999)
  { code: '4010', name: 'IT & Software Development Revenue', type: 'Revenue', subType: 'Operating Revenue', normalBalance: 'Credit', description: 'Web, mobile app, and software development' },
  { code: '4020', name: 'Cloud & Hosting Services Revenue', type: 'Revenue', subType: 'Operating Revenue', normalBalance: 'Credit', description: 'Cloud deployment, servers, domains' },
  { code: '4030', name: 'Digital Marketing & Consulting Revenue', type: 'Revenue', subType: 'Operating Revenue', normalBalance: 'Credit', description: 'Strategy, branding, UI/UX, SEO' },
  { code: '4900', name: 'Other Income', type: 'Revenue', subType: 'Other Income', normalBalance: 'Credit', description: 'Interest, refunds, foreign exchange gain' },

  // Expenses (5000 - 5999)
  { code: '5010', name: 'Staff Salaries & Wages', type: 'Expense', subType: 'Payroll Expense', normalBalance: 'Debit', description: 'Employee fixed compensation & allowances' },
  { code: '5020', name: 'Office Rent Expense', type: 'Expense', subType: 'Administrative Expense', normalBalance: 'Debit', description: 'Monthly office premises rental' },
  { code: '5030', name: 'Utilities & Internet Expense', type: 'Expense', subType: 'Administrative Expense', normalBalance: 'Debit', description: 'Electricity, fiber internet, water' },
  { code: '5040', name: 'Cloud & Infrastructure Hosting', type: 'Expense', subType: 'Direct Expense', normalBalance: 'Debit', description: 'AWS, Vercel, Supabase, domain renewals' },
  { code: '5050', name: 'Office Refreshments & Tea', type: 'Expense', subType: 'Administrative Expense', normalBalance: 'Debit', description: 'Snacks, tea, coffee, kitchen supplies' },
  { code: '5060', name: 'Professional & Legal Fees', type: 'Expense', subType: 'Administrative Expense', normalBalance: 'Debit', description: 'Audit fees, legal compliance, accounting' },
  { code: '5070', name: 'Marketing & Advertising', type: 'Expense', subType: 'Selling Expense', normalBalance: 'Debit', description: 'Online ads, sponsorships, promotional assets' },
  { code: '5080', name: 'Bank Charges & Payment Fees', type: 'Expense', subType: 'Financial Expense', normalBalance: 'Debit', description: 'Gateway commission, wire fees, cheque charges' },
  { code: '5990', name: 'Depreciation & Amortization', type: 'Expense', subType: 'Non-Cash Expense', normalBalance: 'Debit', description: 'Equipment depreciation' },
];

// 7. Role-Based Permissions Helper
export type UserRole = 'super_admin' | 'admin' | 'accountant' | 'billing_staff' | 'viewer';

export interface RolePermissions {
  canCreateInvoice: boolean;
  canEditInvoice: boolean;
  canCancelInvoice: boolean;
  canRecordPayment: boolean;
  canRecordExpense: boolean;
  canViewPayroll: boolean;
  canManagePayroll: boolean;
  canPostJournalEntry: boolean;
  canViewReports: boolean;
  canEditCompanySettings: boolean;
  canManageUsers: boolean;
  canExportData: boolean;
}

export const getRolePermissions = (role?: string | null): RolePermissions => {
  const r = (role || 'viewer').toLowerCase();

  switch (r) {
    case 'super_admin':
      return {
        canCreateInvoice: true,
        canEditInvoice: true,
        canCancelInvoice: true,
        canRecordPayment: true,
        canRecordExpense: true,
        canViewPayroll: true,
        canManagePayroll: true,
        canPostJournalEntry: true,
        canViewReports: true,
        canEditCompanySettings: true,
        canManageUsers: true,
        canExportData: true,
      };

    case 'admin':
      return {
        canCreateInvoice: true,
        canEditInvoice: true,
        canCancelInvoice: true,
        canRecordPayment: true,
        canRecordExpense: true,
        canViewPayroll: true,
        canManagePayroll: true,
        canPostJournalEntry: true,
        canViewReports: true,
        canEditCompanySettings: true,
        canManageUsers: false,
        canExportData: true,
      };

    case 'accountant':
      return {
        canCreateInvoice: true,
        canEditInvoice: true,
        canCancelInvoice: true,
        canRecordPayment: true,
        canRecordExpense: true,
        canViewPayroll: true,
        canManagePayroll: true,
        canPostJournalEntry: true,
        canViewReports: true,
        canEditCompanySettings: false,
        canManageUsers: false,
        canExportData: true,
      };

    case 'billing_staff':
      return {
        canCreateInvoice: true,
        canEditInvoice: false,
        canCancelInvoice: false,
        canRecordPayment: true,
        canRecordExpense: false,
        canViewPayroll: false,
        canManagePayroll: false,
        canPostJournalEntry: false,
        canViewReports: false,
        canEditCompanySettings: false,
        canManageUsers: false,
        canExportData: false,
      };

    case 'viewer':
    default:
      return {
        canCreateInvoice: false,
        canEditInvoice: false,
        canCancelInvoice: false,
        canRecordPayment: false,
        canRecordExpense: false,
        canViewPayroll: false,
        canManagePayroll: false,
        canPostJournalEntry: false,
        canViewReports: true,
        canEditCompanySettings: false,
        canManageUsers: false,
        canExportData: true,
      };
  }
};

