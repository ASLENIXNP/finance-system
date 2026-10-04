-- ASLENIX FINANCE SYSTEM - DATABASE SCHEMA
-- Run this entire script in your Supabase SQL Editor

-- 1. Create custom enum types for statuses
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'accountant', 'billing_staff', 'viewer');
CREATE TYPE customer_type AS ENUM ('Individual', 'Company', 'Organization', 'Government', 'Other');
CREATE TYPE item_type AS ENUM ('Product', 'Service');
CREATE TYPE invoice_status AS ENUM ('Paid', 'Partially Paid', 'Unpaid', 'Overdue', 'Cancelled');
CREATE TYPE payment_method AS ENUM ('Cash', 'Bank Transfer', 'Mobile Banking', 'eSewa', 'Khalti', 'Card', 'Cheque', 'Other');

-- 2. User Profiles Table (extends Supabase Auth)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'viewer',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 3. Company Settings
CREATE TABLE company_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL DEFAULT 'ASLENIX TECH AND SOLUTION',
    registration_no VARCHAR(100),
    pan_vat_no VARCHAR(100),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    fiscal_year VARCHAR(20) DEFAULT '2082/83',
    invoice_prefix VARCHAR(10) DEFAULT 'ASL-',
    default_tax_rate DECIMAL(5,2) DEFAULT 13.00,
    bank_name VARCHAR(255),
    bank_account_name VARCHAR(255),
    bank_account_no VARCHAR(100),
    bank_branch VARCHAR(255),
    terms_conditions TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Insert default company record
INSERT INTO company_settings (company_name) VALUES ('ASLENIX TECH AND SOLUTION');

-- 4. Customers Table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    pan_number VARCHAR(100),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    type customer_type DEFAULT 'Company',
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 5. Products & Services Table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type item_type DEFAULT 'Service',
    description TEXT,
    unit VARCHAR(50) DEFAULT 'Pcs',
    default_rate DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 13.00,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 6. Invoices Table
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_no VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_discount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    total_tax DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    grand_total DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    amount_paid DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    status invoice_status DEFAULT 'Unpaid',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 7. Invoice Items Table
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    item_name VARCHAR(255) NOT NULL,
    description TEXT,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 1.00,
    unit VARCHAR(50),
    rate DECIMAL(12,2) NOT NULL,
    discount DECIMAL(12,2) DEFAULT 0.00,
    tax_rate DECIMAL(5,2) DEFAULT 13.00,
    amount DECIMAL(15,2) NOT NULL
);

-- 8. Income & Payments Table
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_ref VARCHAR(100) UNIQUE,
    invoice_id UUID REFERENCES invoices(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES customers(id) ON DELETE RESTRICT,
    amount DECIMAL(15,2) NOT NULL,
    payment_date DATE NOT NULL,
    method payment_method DEFAULT 'Bank Transfer',
    bank_transaction_id VARCHAR(255),
    category VARCHAR(100) DEFAULT 'Sales',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 9. Expenses Table
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_ref VARCHAR(100) UNIQUE,
    date DATE NOT NULL,
    category VARCHAR(100) NOT NULL,
    sub_category VARCHAR(100),
    vendor_name VARCHAR(255) NOT NULL,
    vendor_pan VARCHAR(100),
    description TEXT,
    amount DECIMAL(15,2) NOT NULL,
    tax_amount DECIMAL(15,2) DEFAULT 0.00,
    total_amount DECIMAL(15,2) NOT NULL,
    method payment_method DEFAULT 'Bank Transfer',
    receipt_no VARCHAR(100),
    attachment_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 10. Employees Table (Fixed Salary set by Accountant)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(100) NOT NULL,
    department VARCHAR(100) DEFAULT 'General',
    email VARCHAR(255),
    phone VARCHAR(50),
    pan_number VARCHAR(100),
    fixed_salary DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    bank_name VARCHAR(255),
    bank_account_no VARCHAR(100),
    bank_branch VARCHAR(255),
    joining_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- 11. Employee Salary / Payroll Records Table
CREATE TABLE payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_ref VARCHAR(100) UNIQUE NOT NULL,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    month VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    total_working_days DECIMAL(5,1) NOT NULL DEFAULT 26.0,
    present_days DECIMAL(5,1) NOT NULL DEFAULT 0.0,
    absent_days DECIMAL(5,1) NOT NULL DEFAULT 0.0,
    half_days DECIMAL(5,1) NOT NULL DEFAULT 0.0,
    effective_days DECIMAL(5,1) NOT NULL DEFAULT 0.0,
    fixed_salary DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    per_day_rate DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    earned_salary DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    attendance_salary DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    bonus_allowance DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    deductions DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    net_before_tds DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    tds_rate DECIMAL(5,2) NOT NULL DEFAULT 1.00,
    tds_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    net_salary DECIMAL(15,2) NOT NULL DEFAULT 0.00,
    payment_status VARCHAR(50) DEFAULT 'Unpaid',
    payment_date DATE,
    payment_method payment_method DEFAULT 'Bank Transfer',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable Row Level Security (RLS) policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_records ENABLE ROW LEVEL SECURITY;

-- Allow read/write for all authenticated users (Basic Dev Policy)
CREATE POLICY "Allow authenticated users full access" ON customers FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON products FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON invoices FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON invoice_items FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON payments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON company_settings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON employees FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users full access" ON payroll_records FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow authenticated users to read profiles" ON profiles FOR SELECT TO authenticated USING (true);

-- Insert Sample Employees
INSERT INTO employees (employee_code, name, designation, department, email, phone, pan_number, fixed_salary, bank_name, bank_account_no, bank_branch, joining_date)
VALUES 
('EMP-001', 'Aarav Sharma', 'Senior Full Stack Engineer', 'Technology', 'aarav.sharma@aslenix.com', '9841000001', '609123456', 75000.00, 'Nabil Bank', '01901017500123', 'Putalisadak', '2025-01-15'),
('EMP-002', 'Pooja Shrestha', 'Lead Accountant', 'Finance', 'pooja.shrestha@aslenix.com', '9841000002', '608987654', 60000.00, 'Global IME Bank', '04501010098765', 'New Baneshwor', '2025-02-01'),
('EMP-003', 'Rohan Adhikari', 'UI/UX & Frontend Designer', 'Creative & Tech', 'rohan.adhikari@aslenix.com', '9841000003', '610543210', 48000.00, 'NIC Asia Bank', '12405060708090', 'Thamel', '2025-04-10'),
('EMP-004', 'Sneha Karki', 'Business Development Officer', 'Marketing', 'sneha.karki@aslenix.com', '9841000004', '611223344', 38000.00, 'Sanima Bank', '08901234567890', 'Lalitpur', '2025-06-01');
