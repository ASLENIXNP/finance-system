import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import InvoiceCreate from './pages/InvoiceCreate';
import Customers from './pages/Customers';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import CompanySettings from './pages/CompanySettings';
import Login from './pages/Login';
import Products from './pages/Products';
import Payments from './pages/Payments';
import Users from './pages/Users';
import Payroll from './pages/Payroll';
import Accounting from './pages/Accounting';
import Reports from './pages/Reports';

function App() {
  useEffect(() => {
    // Automated initial clean-slate purge of old legacy demo seeds
    const PURGE_KEY = 'aslenix_clean_slate_v1';
    if (!localStorage.getItem(PURGE_KEY)) {
      localStorage.removeItem('aslenix_invoices_v2');
      localStorage.removeItem('aslenix_credit_notes_v2');
      localStorage.removeItem('aslenix_payments');
      localStorage.removeItem('aslenix_expenses');
      localStorage.removeItem('aslenix_customers');
      localStorage.removeItem('aslenix_products');
      localStorage.removeItem('aslenix_journals_v2');
      localStorage.removeItem('aslenix_income');
      localStorage.removeItem('aslenix_payroll_records');
      localStorage.removeItem('aslenix_employees');
      localStorage.setItem(PURGE_KEY, 'true');
    }
  }, []);
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="products" element={<Products />} />
          <Route path="invoices" element={<InvoiceCreate />} />
          <Route path="accounting" element={<Accounting />} />
          <Route path="reports" element={<Reports />} />
          <Route path="income" element={<Income />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="payments" element={<Payments />} />
          <Route path="payroll" element={<Payroll />} />
          <Route path="settings" element={<CompanySettings />} />
          <Route path="users" element={<Users />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
