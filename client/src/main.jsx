import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import './index.css';

import LandlordLayout from './layouts/LandlordLayout.jsx';
import LandlordDashboard from './pages/landlord/Dashboard.jsx';
import PropertyList from './pages/landlord/PropertyList.jsx';
import BuildingDetail from './pages/landlord/BuildingDetail.jsx';
import Listings from './pages/landlord/Listings.jsx';
import Wallet from './pages/landlord/Wallet.jsx';
import BookingManagement from './pages/landlord/BookingManagement.jsx';
import Notifications from './pages/landlord/Notifications.jsx';
import LandlordContracts from './pages/landlord/LandlordContracts.jsx';
import LandlordBills from './pages/landlord/LandlordBills.jsx';
import LandlordBillDetail from './pages/landlord/LandlordBillDetail.jsx';
import LandlordContractDetail from './pages/landlord/LandlordContractDetail.jsx';

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
import UnifiedProfile from './pages/UnifiedProfile.jsx';
import SavedListings from './pages/tenant/SavedListings.jsx';
import RoommateMatching from './pages/tenant/RoommateMatching.jsx';

import AdminLayout from './layouts/AdminLayout.jsx';
import AdminDashboard from './pages/admin/Dashboard.jsx';
import MonetizationSettings from './pages/admin/MonetizationSettings.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Landlord Routes */}
          <Route path="/landlord" element={<LandlordLayout />}>
            <Route path="dashboard" element={<LandlordDashboard />} />
            <Route path="profile" element={<UnifiedProfile />} />
            <Route path="properties" element={<PropertyList />} />
            <Route path="properties/:id" element={<BuildingDetail />} />
            <Route path="listings" element={<Listings />} />
            <Route path="bookings" element={<BookingManagement />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="wallet" element={<Wallet />} />
            <Route path="finance" element={<div className="text-center mt-10 text-gray-500">Đang phát triển: Tài chính</div>} />
            <Route path="contracts" element={<LandlordContracts />} />
            <Route path="contracts/:id" element={<LandlordContractDetail />} />
            <Route path="bills" element={<LandlordBills />} />
            <Route path="bills/:id" element={<LandlordBillDetail />} />
            <Route path="analytics" element={<div className="text-center mt-10 text-gray-500">Đang phát triển: Phân tích</div>} />
            <Route path="maintenance" element={<div className="text-center mt-10 text-gray-500">Đang phát triển: Bảo trì</div>} />
          </Route>

          {/* Tenant Routes */}
          <Route path="/tenant" element={<TenantLayout />}>
            <Route path="dashboard" element={<TenantDashboard />} />
            <Route path="discover" element={<DiscoverRooms />} />
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

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="profile" element={<UnifiedProfile />} />
            <Route path="monetization" element={<MonetizationSettings />} />
            <Route path="users" element={<div className="text-center mt-10 text-gray-500">Đang phát triển: Quản lý Users</div>} />
            <Route path="logs" element={<div className="text-center mt-10 text-gray-500">Đang phát triển: System Logs</div>} />
          </Route>
        </Routes>
      </Router>
    </Provider>
  </React.StrictMode>,
);
