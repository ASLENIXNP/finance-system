-- ==============================================================================
-- ASLENIX FINANCE - MIGRATION V2: NEPAL ACCOUNTING & IRD COMPLIANCE
-- Non-destructive: preserves existing tables, safely adds columns, COA,
-- journal vouchers, VAT registers, TDS tracking, and audit logging.
-- Run this in your Supabase SQL Editor.
-- ==============================================================================

-- 1. Extend Company Settings for IRD & VAT Compliance
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS is_vat_registered BOOLEAN DEFAULT true;
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS vat_no VARCHAR(100) DEFAULT '623611557';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'NPR';
ALTER TABLE company_settings ADD COLUMN IF NOT EXISTS invoice_footer TEXT DEFAULT 'Thank you for choosing ASLENIX TECH AND SOLUTION. For inquiries, contact +977 9709043147.';

-- 2. Extend Customers with VAT Status
ALTER TABLE customers ADD COLUMN IF NOT EXISTS is_vat_registered BOOLEAN DEFAULT false;

-- 3. Extend Invoices for Nepal Tax Invoice Requirements
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS invoice_date_bs VARCHAR(20);
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS taxable_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS exempt_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS balance_due DECIMAL(15,2) NOT NULL DEFAULT 0.00;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS is_vat_invoice BOOLEAN DEFAULT true;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS fiscal_year VARCHAR(20) DEFAULT '2082/83';
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;

-- 4. Extend Invoice Items for Item-level Tax Classification
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS tax_classification VARCHAR(50) DEFAULT 'Taxable';
ALTER TABLE invoice_items ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(15,2) DEFAULT 0.00;

-- 5. Extend Expenses for Input VAT & TDS Deductions
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS date_bs VARCHAR(20);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS is_vat_bill BOOLEAN DEFAULT false;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS taxable_amount DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS exempt_amount DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tds_applicable BOOLEAN DEFAULT false;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tds_category VARCHAR(100);
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tds_rate DECIMAL(5,2) DEFAULT 0.00;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS tds_amount DECIMAL(15,2) DEFAULT 0.00;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS net_paid DECIMAL(15,2);

-- 6. Credit Notes Table (Nepal VAT Act Compliance)
CREATE TABLE IF NOT EXISTS credit_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    credit_note_no VARCHAR(50) UNIQUE NOT NULL,
    invoice_id UUID REFERENCES invoices(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    date_bs VARCHAR(20),
    reason TEXT NOT NULL,
    taxable_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'Issued',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 7. Chart of Accounts (COA) Table
CREATE TABLE IF NOT EXISTS chart_of_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    account_type VARCHAR(50) NOT NULL, -- Asset, Liability, Equity, Revenue, Expense
    sub_type VARCHAR(100),
    normal_balance VARCHAR(10) NOT NULL, -- Debit, Credit
    is_system BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert Default Standard Chart of Accounts
INSERT INTO chart_of_accounts (code, name, account_type, sub_type, normal_balance, is_system)
VALUES 
('1010', 'Cash in Hand', 'Asset', 'Cash & Bank', 'Debit', true),
('1020', 'Global IME Bank (Main Account)', 'Asset', 'Cash & Bank', 'Debit', true),
('1030', 'Nabil Bank Account', 'Asset', 'Cash & Bank', 'Debit', true),
('1040', 'Digital Wallets (eSewa / Khalti)', 'Asset', 'Cash & Bank', 'Debit', true),
('1100', 'Accounts Receivable (Debtors)', 'Asset', 'Current Asset', 'Debit', true),
('1200', 'Input VAT Receivable', 'Asset', 'Duties & Taxes', 'Debit', true),
('1210', 'Advance TDS Receivable', 'Asset', 'Duties & Taxes', 'Debit', true),
('1500', 'Office Equipment & Computers', 'Asset', 'Fixed Asset', 'Debit', false),
('2010', 'Accounts Payable (Creditors)', 'Liability', 'Current Liability', 'Credit', true),
('2100', 'Output VAT Payable', 'Liability', 'Duties & Taxes', 'Credit', true),
('2110', 'TDS Payable to IRD', 'Liability', 'Duties & Taxes', 'Credit', true),
('2120', 'Salaries & Payroll Payable', 'Liability', 'Current Liability', 'Credit', true),
('3010', 'Owners Capital', 'Equity', 'Equity', 'Credit', true),
('3020', 'Retained Earnings', 'Equity', 'Equity', 'Credit', true),
('4010', 'IT & Software Development Revenue', 'Revenue', 'Operating Revenue', 'Credit', true),
('4020', 'Cloud & Hosting Services Revenue', 'Revenue', 'Operating Revenue', 'Credit', false),
('4030', 'Digital Marketing & Consulting Revenue', 'Revenue', 'Operating Revenue', 'Credit', false),
('4900', 'Other Income', 'Revenue', 'Other Income', 'Credit', false),
('5010', 'Staff Salaries & Wages', 'Expense', 'Payroll Expense', 'Debit', true),
('5020', 'Office Rent Expense', 'Expense', 'Administrative Expense', 'Debit', false),
('5030', 'Utilities & Internet Expense', 'Expense', 'Administrative Expense', 'Debit', false),
('5040', 'Cloud & Infrastructure Hosting', 'Expense', 'Direct Expense', 'Debit', false),
('5050', 'Office Refreshments & Tea', 'Expense', 'Administrative Expense', 'Debit', false),
('5060', 'Professional & Legal Fees', 'Expense', 'Administrative Expense', 'Debit', false),
('5070', 'Marketing & Advertising', 'Expense', 'Selling Expense', 'Debit', false),
('5080', 'Bank Charges & Payment Fees', 'Expense', 'Financial Expense', 'Debit', false)
ON CONFLICT (code) DO NOTHING;

-- 8. Journal Entries (General Journal Vouchers)
CREATE TABLE IF NOT EXISTS journal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_no VARCHAR(50) UNIQUE NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    entry_date_bs VARCHAR(20),
    reference_no VARCHAR(100),
    description TEXT NOT NULL,
    total_debit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_credit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    is_balanced BOOLEAN DEFAULT true,
    status VARCHAR(50) DEFAULT 'Posted', -- Draft, Posted, Void
    source VARCHAR(50) DEFAULT 'Manual', -- Manual, Invoice, Payment, Expense, Payroll
    created_by VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 9. Journal Entry Lines (Debit & Credit rows)
CREATE TABLE IF NOT EXISTS journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_id UUID REFERENCES chart_of_accounts(id) ON DELETE RESTRICT,
    description TEXT,
    debit DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    credit DECIMAL(15,2) NOT NULL DEFAULT 0.00
);

-- 10. TDS Records Table (Nepal Income Tax Act Tracking)
CREATE TABLE IF NOT EXISTS tds_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tds_ref VARCHAR(50) UNIQUE NOT NULL,
    entity_type VARCHAR(50) NOT NULL, -- Vendor, Employee, Customer
    entity_name VARCHAR(255) NOT NULL,
    pan_number VARCHAR(50),
    section VARCHAR(100) NOT NULL,
    payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_date_bs VARCHAR(20),
    gross_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tds_rate DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    tds_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    deposit_status VARCHAR(50) DEFAULT 'Payable', -- Payable, Deposited, Exempt
    deposit_date DATE,
    deposit_voucher_no VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 11. Audit Trail Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id VARCHAR(100),
    action VARCHAR(50) NOT NULL, -- INSERT, UPDATE, DELETE, CANCEL, POST
    performed_by VARCHAR(255) DEFAULT 'System',
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 12. Enable Row Level Security (RLS) & Dev Access Policies
ALTER TABLE credit_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE journal_entry_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE tds_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users full access" ON credit_notes FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON chart_of_accounts FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON journal_entries FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON journal_entry_lines FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON tds_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON audit_logs FOR ALL TO authenticated USING (true);

