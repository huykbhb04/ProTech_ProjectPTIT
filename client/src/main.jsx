import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { store } from './store';
import App from './App.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import './index.css';
import { ErrorBoundary } from './components/common';
import { ToastContainer } from './components/common';

import LandlordLayout from './layouts/LandlordLayout.jsx';
import LandlordDashboard from './pages/landlord/Dashboard.jsx';
import PropertyList from './pages/landlord/PropertyList.jsx';
import BuildingDetail from './pages/landlord/BuildingDetail.jsx';
import Listings from './pages/landlord/Listings.jsx';
import EditListing from './pages/landlord/EditListing.jsx';
import Wallet from './pages/landlord/Wallet.jsx';
import BookingManagement from './pages/landlord/BookingManagement.jsx';
import Notifications from './pages/landlord/Notifications.jsx';
import LandlordContracts from './pages/landlord/LandlordContracts.jsx';
import LandlordBills from './pages/landlord/LandlordBills.jsx';
import LandlordBillDetail from './pages/landlord/LandlordBillDetail.jsx';
import LandlordContractDetail from './pages/landlord/LandlordContractDetail.jsx';
import AdCampaigns from './pages/landlord/AdCampaigns.jsx';

import TenantLayout from './layouts/TenantLayout.jsx';
import TenantDashboard from './pages/tenant/Dashboard.jsx';
import DiscoverRooms from './pages/tenant/DiscoverRooms.jsx';
import RoomDetail from './pages/tenant/RoomDetail.jsx';
import MyBookings from './pages/tenant/MyBookings.jsx';
import ContractSigning from './pages/tenant/ContractSigning.jsx';
import TenantContractView from './pages/tenant/TenantContractView.jsx';
import TenantBills from './pages/tenant/TenantBills.jsx';
import TenantBillDetail from './pages/tenant/TenantBillDetail.jsx';
import TenantChat from './pages/tenant/TenantChat.jsx';
import SavedListings from './pages/tenant/SavedListings.jsx';
import RoommateMatching from './pages/tenant/RoommateMatching.jsx';
import ServicesPrice from './pages/tenant/ServicesPrice.jsx';
import UnifiedProfile from './pages/UnifiedProfile.jsx';

import AdminLayout from './layouts/AdminLayout.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import MonetizationSettings from './pages/admin/MonetizationSettings.jsx';
import SeoManager from './pages/admin/SeoManager.jsx';
import ThemeManager from './pages/admin/ThemeManager.jsx';
import BannerManagement from './pages/admin/BannerManagement.jsx';
import CategoryManagement from './pages/admin/CategoryManagement.jsx';
import UserManagement from './pages/admin/UserManagement.jsx';

// ProtectedRoute: ngăn người dùng không đúng role truy cập trang
const ProtectedRoute = ({ allowedRoles, children }) => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'landlord') return <Navigate to="/landlord/dashboard" replace />;
    return <Navigate to="/tenant/discover" replace />;
  }

  return children;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <Router>
      <ErrorBoundary>
        <ToastContainer />
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

            {/* Landlord Routes */}
            <Route
              path="/landlord"
              element={
                <ProtectedRoute allowedRoles={['landlord']}>
                  <LandlordLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<LandlordDashboard />} />
              <Route path="profile" element={<UnifiedProfile />} />
              <Route path="properties" element={<PropertyList />} />
              <Route path="properties/:id" element={<BuildingDetail />} />
              <Route path="listings" element={<Listings />} />
              <Route path="properties/:buildingId/rooms/:roomId/edit-listing" element={<EditListing />} />
              <Route path="bookings" element={<BookingManagement />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="wallet" element={<Wallet />} />
              <Route path="contracts" element={<LandlordContracts />} />
              <Route path="contracts/:id" element={<LandlordContractDetail />} />
              <Route path="bills" element={<LandlordBills />} />
              <Route path="bills/:id" element={<LandlordBillDetail />} />
              <Route path="campaigns" element={<AdCampaigns />} />
              <Route path="analytics" element={<div className="text-center mt-10 text-gray-500">Đang phát triển: Phân tích</div>} />
              <Route path="maintenance" element={<div className="text-center mt-10 text-gray-500">Đang phát triển: Bảo trì</div>} />
            </Route>

            {/* Public tenant detail routes */}
            <Route path="/tenant/room/:id" element={<RoomDetail />} />
            <Route path="/room/:id" element={<RoomDetail />} />

            {/* Tenant Routes */}
            <Route
              path="/tenant"
              element={
                <ProtectedRoute allowedRoles={['tenant', 'guest']}>
                  <TenantLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<TenantDashboard />} />
              <Route path="roommates" element={<RoommateMatching />} />
              <Route path="room/:id" element={<RoomDetail />} />
              <Route path="bookings" element={<MyBookings />} />
              <Route path="contract/:id" element={<ContractSigning />} />
              <Route path="my-contract/:id" element={<TenantContractView />} />
              <Route path="bills" element={<TenantBills />} />
              <Route path="bills/:id" element={<TenantBillDetail />} />
              <Route path="chat" element={<TenantChat />} />
              <Route path="profile" element={<UnifiedProfile />} />
              <Route path="saved" element={<SavedListings />} />
            </Route>

            {/* DiscoverRooms — public route */}
            <Route path="/tenant/discover" element={<DiscoverRooms />} />
            <Route path="/services-price" element={<ServicesPrice />} />
            <Route path="/tenant/services-price" element={<ServicesPrice />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="profile" element={<UnifiedProfile />} />
              <Route path="monetization" element={<MonetizationSettings />} />
              <Route path="banners" element={<BannerManagement />} />
              <Route path="categories" element={<CategoryManagement />} />
              <Route path="seo" element={<SeoManager />} />
              <Route path="theme" element={<ThemeManager />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="logs" element={<div className="text-center mt-10 text-gray-500">Đang phát triển: System Logs</div>} />
            </Route>
          </Routes>
        </ErrorBoundary>
      </Router>
    </Provider>
);
