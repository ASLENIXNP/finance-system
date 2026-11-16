import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const InvoiceCreate = lazy(() => import('./pages/InvoiceCreate'));
const Customers = lazy(() => import('./pages/Customers'));
const Income = lazy(() => import('./pages/Income'));
const Expenses = lazy(() => import('./pages/Expenses'));
const CompanySettings = lazy(() => import('./pages/CompanySettings'));
const Login = lazy(() => import('./pages/Login'));
const Products = lazy(() => import('./pages/Products'));
const Payments = lazy(() => import('./pages/Payments'));
const Users = lazy(() => import('./pages/Users'));
const Payroll = lazy(() => import('./pages/Payroll'));
const Accounting = lazy(() => import('./pages/Accounting'));
const Reports = lazy(() => import('./pages/Reports'));

const PageLoading = () => (
  <div className="flex min-h-[320px] items-center justify-center" role="status" aria-live="polite">
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-600 shadow-sm">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600" />
      Loading page…
    </div>
  </div>
);

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
      <Suspense fallback={<PageLoading />}>
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
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
