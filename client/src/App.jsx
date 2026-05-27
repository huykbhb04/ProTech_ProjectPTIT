import { Link, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, reset } from './features/auth/authSlice';
import { useNavigate } from 'react-router-dom';

import TopNavbar from './components/layout/TopNavbar';

function App() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const onLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/');
  };

  // Redirect based on user role
  if (user && user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (user && user.role === 'landlord') {
    return <Navigate to="/landlord/dashboard" replace />;
  }

  if (user && (user.role === 'tenant' || user.role === 'guest')) {
    return <Navigate to="/tenant/discover" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <TopNavbar user={user} />

      <div className="flex-1 flex flex-col justify-center items-center bg-[url('https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2670&auto=format&fit=crop')] bg-cover bg-center relative">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-0"></div>

        <div className="z-10 text-center text-white p-8 glass rounded-2xl max-w-2xl mx-4">
          <h1 className="text-5xl font-bold mb-6">PropTech</h1>
          <p className="text-xl mb-8 text-gray-100">Hệ sinh thái Quản lý & Cho thuê Nhà trọ Thông minh ứng dụng AI</p>

          <div className="flex justify-center gap-4">
            {user ? (
              <button onClick={onLogout} className="bg-red-500 hover:bg-red-600 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-lg hover:shadow-xl">
                Đăng xuất
              </button>
            ) : (
              <>
                <Link to="/login" className="bg-white text-indigo-600 px-8 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all shadow-lg hover:shadow-xl">
                  Đăng nhập
                </Link>
                <Link to="/register" className="bg-indigo-600 text-white px-8 py-3 rounded-full font-semibold hover:bg-indigo-700 transition-all shadow-lg hover:shadow-xl">
                  Đăng ký
                </Link>
                <Link to="/tenant/discover" className="bg-green-500 text-white px-8 py-3 rounded-full font-semibold hover:bg-green-600 transition-all shadow-lg hover:shadow-xl">
                  Xem tin đăng
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
