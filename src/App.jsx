import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import RequireRole from './components/RequireRole';

const LandingPage = lazy(() => import('./pages/public/LandingPage'));
const RoleSelection = lazy(() => import('./pages/public/RoleSelection'));
const LoginPage = lazy(() => import('./pages/public/LoginPage'));

const FarmerDashboard = lazy(() => import('./pages/farmer/FarmerDashboard'));
const AddProduce = lazy(() => import('./pages/farmer/AddProduce'));
const MyListings = lazy(() => import('./pages/farmer/MyListings'));
const FarmerOrders = lazy(() => import('./pages/farmer/FarmerOrders'));

const BuyerDashboard = lazy(() => import('./pages/buyer/BuyerDashboard'));
const BrowseProducts = lazy(() => import('./pages/buyer/BrowseProducts'));
const FarmerList = lazy(() => import('./pages/buyer/FarmerList'));
const BuyerOrders = lazy(() => import('./pages/buyer/BuyerOrders'));
const Cart = lazy(() => import('./pages/buyer/Cart'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const UserManagement = lazy(() => import('./pages/admin/UserManagement'));
const ProductModeration = lazy(() => import('./pages/admin/ProductModeration'));
const Transactions = lazy(() => import('./pages/admin/Transactions'));
const ReportsIssues = lazy(() => import('./pages/admin/ReportsIssues'));

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/role-selection" element={<RoleSelection />} />
        <Route path="/login" element={<LoginPage />} />

        <Route path="/farmer/dashboard" element={<RequireRole role="farmer"><FarmerDashboard /></RequireRole>} />
        <Route path="/farmer/add-produce" element={<RequireRole role="farmer"><AddProduce /></RequireRole>} />
        <Route path="/farmer/listings" element={<RequireRole role="farmer"><MyListings /></RequireRole>} />
        <Route path="/farmer/orders" element={<RequireRole role="farmer"><FarmerOrders /></RequireRole>} />

        <Route path="/buyer/dashboard" element={<RequireRole role="buyer"><BuyerDashboard /></RequireRole>} />
        <Route path="/buyer/browse" element={<RequireRole role="buyer"><BrowseProducts /></RequireRole>} />
        <Route path="/buyer/farmers" element={<RequireRole role="buyer"><FarmerList /></RequireRole>} />
        <Route path="/buyer/orders" element={<RequireRole role="buyer"><BuyerOrders /></RequireRole>} />
        <Route path="/buyer/cart" element={<RequireRole role="buyer"><Cart /></RequireRole>} />

        <Route path="/admin/dashboard" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
        <Route path="/admin/users" element={<RequireRole role="admin"><UserManagement /></RequireRole>} />
        <Route path="/admin/products" element={<RequireRole role="admin"><ProductModeration /></RequireRole>} />
        <Route path="/admin/transactions" element={<RequireRole role="admin"><Transactions /></RequireRole>} />
        <Route path="/admin/reports" element={<RequireRole role="admin"><ReportsIssues /></RequireRole>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default App;
