import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Placeholder from './components/Placeholder';
import InvoiceCreate from './pages/InvoiceCreate';
import Customers from './pages/Customers';
import Income from './pages/Income';
import Expenses from './pages/Expenses';
import CompanySettings from './pages/CompanySettings';
import Login from './pages/Login';
import Products from './pages/Products';
import Payments from './pages/Payments';
import Users from './pages/Users';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<Customers />} />
          <Route path="products" element={<Products />} />
          <Route path="invoices" element={<InvoiceCreate />} />
          <Route path="income" element={<Income />} />
          <Route path="expenses" element={<Expenses />} />
          <Route path="payments" element={<Payments />} />
          <Route path="settings" element={<CompanySettings />} />
          <Route path="users" element={<Users />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
