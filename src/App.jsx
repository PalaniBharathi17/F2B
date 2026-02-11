import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/public/LandingPage';
import RoleSelection from './pages/public/RoleSelection';
import LoginPage from './pages/public/LoginPage';

// Farmer Pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import AddProduce from './pages/farmer/AddProduce';
import MyListings from './pages/farmer/MyListings';
import FarmerOrders from './pages/farmer/FarmerOrders';

// Buyer Pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';
import BrowseProducts from './pages/buyer/BrowseProducts';
import FarmerList from './pages/buyer/FarmerList';
import BuyerOrders from './pages/buyer/BuyerOrders';
import Cart from './pages/buyer/Cart';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ProductModeration from './pages/admin/ProductModeration';
import Transactions from './pages/admin/Transactions';
import ReportsIssues from './pages/admin/ReportsIssues';


function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/role-selection" element={<RoleSelection />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Farmer Routes */}
      <Route path="/farmer/dashboard" element={<FarmerDashboard />} />
      <Route path="/farmer/add-produce" element={<AddProduce />} />
      <Route path="/farmer/listings" element={<MyListings />} />
      <Route path="/farmer/orders" element={<FarmerOrders />} />

      {/* Buyer Routes */}
      <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
      <Route path="/buyer/browse" element={<BrowseProducts />} />
      <Route path="/buyer/farmers" element={<FarmerList />} />
      <Route path="/buyer/orders" element={<BuyerOrders />} />
      <Route path="/buyer/cart" element={<Cart />} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/users" element={<UserManagement />} />
      <Route path="/admin/products" element={<ProductModeration />} />
      <Route path="/admin/transactions" element={<Transactions />} />
      <Route path="/admin/reports" element={<ReportsIssues />} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
