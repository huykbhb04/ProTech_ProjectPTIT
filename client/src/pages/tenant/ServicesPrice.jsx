import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Calendar,
  Heart,
  User,
  Sparkles,
  Check,
  X,
  BadgeCheck,
  Award,
  Clock3,
  ShieldCheck,
  LogOut
} from 'lucide-react';
import api from '../../services/api';
import { logout, reset } from '../../features/auth/authSlice';
import { fetchSavedIds } from '../../features/savedListings/savedListingsSlice';

const defaultHeroImage = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop';

const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value));
};

const ServicesPrice = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const { savedIds } = useSelector(state => state.savedListings);

  const [includeVat, setIncludeVat] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user && (user.role === 'tenant' || user.role === 'guest')) {
      dispatch(fetchSavedIds());
    }
  }, [dispatch, user]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleLogout = () => {
    dispatch(logout());
    dispatch(reset());
    navigate('/');
  };

  // Pricing Data based on database premium_services
  const PACKAGES = [
    {
      id: 'super_vip',
      name: 'Tin VIP Nổi Bật',
      stars: 5,
      pricePerDay: 12000,
      badgeColor: 'bg-red-500 text-white',
      headerBg: 'bg-red-500',
      titleStyle: 'MÀU ĐỎ, IN HOA, ĐẬM',
      size: 'Rất lớn',
      autoApprove: true,
      extra10Days: true,
      showCall: true,
      pushPrice: 0, // Free push
      textColor: 'text-red-500',
      borderColor: 'border-red-200'
    },
    {
      id: 'top_rank',
      name: 'Tin VIP 1',
      stars: 4,
      pricePerDay: 10000,
      badgeColor: 'bg-[#ec4899] text-white', // pink-500
      headerBg: 'bg-[#ec4899]',
      titleStyle: 'MÀU HỒNG, IN HOA, ĐẬM',
      size: 'Lớn',
      autoApprove: true,
      extra10Days: true,
      showCall: true,
      pushPrice: 2000,
      textColor: 'text-[#ec4899]',
      borderColor: 'border-pink-200'
    },
    {
      id: 'featured',
      name: 'Tin VIP 2',
      stars: 3,
      pricePerDay: 5000,
      badgeColor: 'bg-orange-500 text-white',
      headerBg: 'bg-orange-500',
      titleStyle: 'MÀU CAM, IN HOA, ĐẬM',
      size: 'Trung bình',
      autoApprove: true,
      extra10Days: true,
      showCall: true,
      pushPrice: 2000,
      textColor: 'text-orange-500',
      borderColor: 'border-orange-200'
    },
    {
      id: 'regular',
      name: 'Tin thường',
      stars: 0,
      pricePerDay: 0,
      badgeColor: 'bg-blue-600 text-white',
      headerBg: 'bg-blue-600',
      titleStyle: 'Mặc định, viết thường',
      size: 'Nhỏ',
      autoApprove: false,
      extra10Days: false,
      showCall: true,
      pushPrice: 2000,
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200'
    }
  ];

  const calculatePrice = (pricePerDay, days, discount = 1) => {
    let price = pricePerDay * days * discount;
    if (includeVat) {
      price = price * 1.08;
    }
    return price;
  };

  return (
    <div className="min-h-screen bg-[#faf8ff] text-[#191b23]">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }`}</style>
      
      {/* Header and Nav */}
      <nav className="sticky top-0 z-50 border-b border-[#e2e8f0] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex flex-col items-start min-w-fit group shrink-0">
              <div className="flex items-center">
                <span className="text-2xl font-black tracking-tighter uppercase text-indigo-600">PropTech</span>
              </div>
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight -mt-1 hidden md:block">Nền tảng thuê phòng thông minh</span>
            </Link>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {(!user || user.role === 'tenant' || user.role === 'guest') && (
              <>
                <Link to="/tenant/saved" className="hidden sm:flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] px-4 py-2 text-[14px] font-medium text-[#191b23] transition-colors hover:border-indigo-600 hover:text-indigo-600">
                  <Heart size={16} className="text-[#ba1a1a]" />
                  Tin đã lưu
                  {savedIds.length > 0 && <span className="ml-1 rounded-full bg-[#ba1a1a] px-2 py-0.5 text-[11px] font-bold text-white">{savedIds.length}</span>}
                </Link>
                <Link to="/tenant/bookings" className="hidden sm:flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] px-4 py-2 text-[14px] font-medium text-[#191b23] transition-colors hover:border-indigo-600 hover:text-indigo-600">
                  <Calendar size={16} className="text-[#737686]" />
                  Lịch hẹn
                </Link>
              </>
            )}
            {user ? (
              <>
                <Link to={`/${user.role === 'guest' ? 'tenant' : user.role}/profile`} className="flex items-center gap-2 rounded-[8px] border border-[#e2e8f0] px-3 py-2 text-[14px] font-medium text-[#191b23] hover:border-indigo-600 hover:text-indigo-600">
                  <User size={16} />
                  <span className="hidden md:inline">{user.full_name || user.fullName || 'Tài khoản'}</span>
                </Link>
                <button onClick={handleLogout} className="inline-flex items-center gap-2 rounded-[8px] bg-[#0c1a3a] px-4 py-2 text-[14px] font-medium text-white hover:opacity-90">
                  <LogOut size={16} /> <span className="hidden md:inline">Đăng xuất</span>
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="rounded-[8px] px-4 py-2 text-[14px] font-medium text-[#191b23] transition-colors hover:bg-[#f3f3fe]">Đăng nhập</Link>
                <Link to="/register" className="rounded-[8px] bg-indigo-600 px-5 py-2 text-[14px] font-medium text-white shadow-sm transition-opacity hover:opacity-90">Đăng ký</Link>
              </>
            )}
          </div>
        </div>
        <div className="border-t border-[#e2e8f0] bg-white">
          <div className="mx-auto max-w-[1280px] px-4 md:px-8 py-2.5 flex items-center gap-6 overflow-x-auto no-scrollbar scroll-smooth">
            {[
              { id: '1', name: 'Phòng trọ' },
              { id: '3', name: 'Nhà nguyên căn' },
              { id: '2', name: 'Căn hộ chung cư' },
              { id: '8', name: 'Căn hộ mini' },
              { id: '12', name: 'Căn hộ dịch vụ' },
              { id: '5', name: 'Ở ghép' },
              { id: '4', name: 'Mặt bằng' },
              { id: 'pricing', name: 'Bảng giá dịch vụ' }
            ].map(cat => {
              const isActive = cat.id === 'pricing';
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    if (cat.id === 'pricing') return;
                    navigate(`/tenant/discover?category=${cat.id}`);
                  }}
                  className={`pb-1 transition-all border-b-2 whitespace-nowrap text-[13px] ${
                    isActive 
                      ? 'border-indigo-600 text-indigo-600 font-bold' 
                      : 'border-transparent text-[#515d81] hover:text-indigo-600 hover:border-indigo-600/30 font-semibold'
                  }`}
                >
                  {cat.name}
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-[1280px] px-4 py-12 md:px-8">
        
        {/* Page Title & VAT Toggle */}
        <div className="mb-10 flex flex-col items-center justify-between gap-6 md:flex-row border-b border-[#e2e8f0] pb-8">
          <div>
            <h1 className="text-[32px] font-bold text-[#0c1a3a] leading-tight flex items-center gap-2">
              <Sparkles className="text-amber-500 fill-amber-500" size={28} />
              Bảng giá dịch vụ đăng tin
            </h1>
            <p className="mt-2 text-[15px] text-gray-500 font-medium">Áp dụng giá thực tế hệ thống, cập nhật năm 2026</p>
          </div>
          
          {/* VAT Toggle Switch */}
          <div className="flex items-center gap-3 bg-white border border-[#e2e8f0] rounded-full px-5 py-3 shadow-sm select-none">
            <span className="text-[14px] font-bold text-gray-700">Giá bao gồm 8% VAT</span>
            <button
              onClick={() => setIncludeVat(!includeVat)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none ${includeVat ? 'bg-indigo-600' : 'bg-gray-200'}`}
              role="switch"
              aria-checked={includeVat}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${includeVat ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>
        </div>

        {/* Pricing Comparison Matrix Table */}
        <div className="overflow-x-auto rounded-2xl border border-[#e2e8f0] bg-white shadow-xl">
          <table className="w-full min-w-[950px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="border-b border-[#e2e8f0]">
                {/* Empty corner header */}
                <th className="w-[180px] bg-gray-50/50 p-5 font-bold text-[#0c1a3a]">Dịch vụ</th>
                {PACKAGES.map(pkg => (
                  <th key={pkg.id} className={`p-0 text-center border-l border-[#e2e8f0] w-[200px]`}>
                    <div className={`${pkg.headerBg} p-5 text-white flex flex-col items-center justify-center min-h-[110px]`}>
                      <span className="font-extrabold text-[16px] uppercase tracking-wide">{pkg.name}</span>
                      {pkg.stars > 0 && (
                        <div className="flex gap-0.5 mt-1.5 text-amber-300">
                          {Array.from({ length: pkg.stars }).map((_, i) => (
                            <span key={i} className="text-[14px]">★</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              
              {/* Row 1: 5 days price */}
              <tr className="hover:bg-gray-50/40">
                <td className="p-4 font-bold text-gray-700 bg-gray-50/20">Giá 5 ngày</td>
                {PACKAGES.map(pkg => (
                  <td key={pkg.id} className="p-4 text-center font-bold text-[16px] border-l border-[#e2e8f0]">
                    {pkg.pricePerDay > 0 ? (
                      <span>{formatCurrency(calculatePrice(pkg.pricePerDay, 5))}đ</span>
                    ) : (
                      <span className="text-gray-400">Miễn phí</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row 2: 10 days price */}
              <tr className="hover:bg-gray-50/40">
                <td className="p-4 font-bold text-gray-700 bg-gray-50/20">Giá 10 ngày</td>
                {PACKAGES.map(pkg => (
                  <td key={pkg.id} className="p-4 text-center font-bold text-[16px] border-l border-[#e2e8f0]">
                    {pkg.pricePerDay > 0 ? (
                      <span>{formatCurrency(calculatePrice(pkg.pricePerDay, 10))}đ</span>
                    ) : (
                      <span className="text-gray-400">Miễn phí</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row 3: 15 days price */}
              <tr className="hover:bg-gray-50/40">
                <td className="p-4 font-bold text-gray-700 bg-gray-50/20">Giá 15 ngày</td>
                {PACKAGES.map(pkg => (
                  <td key={pkg.id} className="p-4 text-center font-bold text-[16px] border-l border-[#e2e8f0]">
                    {pkg.pricePerDay > 0 ? (
                      <span>{formatCurrency(calculatePrice(pkg.pricePerDay, 15))}đ</span>
                    ) : (
                      <span className="text-gray-400">Miễn phí</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row 4: 30 days price (Discount 20%) */}
              <tr className="hover:bg-gray-50/40">
                <td className="p-4 font-bold text-gray-700 bg-gray-50/20">Giá 30 ngày</td>
                {PACKAGES.map(pkg => (
                  <td key={pkg.id} className="p-4 text-center border-l border-[#e2e8f0]">
                    {pkg.pricePerDay > 0 ? (
                      <div className="flex flex-col items-center">
                        <span className="text-[12px] text-gray-400 line-through font-medium">
                          {formatCurrency(calculatePrice(pkg.pricePerDay, 30))}đ
                        </span>
                        <span className="text-[11px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full mt-0.5">
                          Giảm 20%
                        </span>
                        <span className="text-[18px] font-extrabold text-gray-900 mt-1">
                          {formatCurrency(calculatePrice(pkg.pricePerDay, 30, 0.8))}đ
                        </span>
                      </div>
                    ) : (
                      <span className="font-bold text-[16px] text-gray-400">Miễn phí</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row 5: Push price */}
              <tr className="hover:bg-gray-50/40">
                <td className="p-4 font-bold text-gray-700 bg-gray-50/20">Giá đẩy tin</td>
                {PACKAGES.map(pkg => (
                  <td key={pkg.id} className="p-4 text-center font-semibold text-gray-700 border-l border-[#e2e8f0]">
                    {pkg.pricePerDay > 0 ? (
                      pkg.pushPrice === 0 ? (
                        <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded">Miễn phí</span>
                      ) : (
                        <span>{formatCurrency(includeVat ? pkg.pushPrice * 1.08 : pkg.pushPrice)}đ / lần</span>
                      )
                    ) : (
                      <span className="text-gray-400">Không khả dụng</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Row 6: Title Color */}
              <tr className="hover:bg-gray-50/40">
                <td className="p-4 font-bold text-gray-700 bg-gray-50/20">Màu sắc tiêu đề</td>
                {PACKAGES.map(pkg => (
                  <td key={pkg.id} className={`p-4 text-center font-bold border-l border-[#e2e8f0] ${pkg.textColor}`}>
                    {pkg.titleStyle}
                  </td>
                ))}
              </tr>

              {/* Row 7: Ad Size */}
              <tr className="hover:bg-gray-50/40">
                <td className="p-4 font-bold text-gray-700 bg-gray-50/20">Kích thước tin</td>
                {PACKAGES.map(pkg => (
                  <td key={pkg.id} className="p-4 text-center font-semibold text-gray-700 border-l border-[#e2e8f0]">
                    {pkg.size}
                  </td>
                ))}
              </tr>

              {/* Row 8: Auto Approve */}
              <tr className="hover:bg-gray-50/40">
                <td className="p-4 font-bold text-gray-700 bg-gray-50/20">Tự động duyệt (*)</td>
                {PACKAGES.map(pkg => (
                  <td key={pkg.id} className="p-4 text-center border-l border-[#e2e8f0]">
                    <div className="flex justify-center">
                      {pkg.autoApprove ? (
                        <div className="bg-green-500 text-white rounded-full p-1"><Check size={16} /></div>
                      ) : (
                        <div className="bg-gray-200 text-gray-400 rounded-full p-1"><X size={16} /></div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 9: Extra 10 days for regular listings */}
              <tr className="hover:bg-gray-50/40">
                <td className="p-4 font-bold text-gray-700 bg-gray-50/20">Duy trì thêm 10 ngày tin thường</td>
                {PACKAGES.map(pkg => (
                  <td key={pkg.id} className="p-4 text-center border-l border-[#e2e8f0]">
                    <div className="flex justify-center">
                      {pkg.extra10Days ? (
                        <div className="bg-green-500 text-white rounded-full p-1"><Check size={16} /></div>
                      ) : (
                        <div className="bg-gray-200 text-gray-400 rounded-full p-1"><X size={16} /></div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 10: Show phone button */}
              <tr className="hover:bg-gray-50/40">
                <td className="p-4 font-bold text-gray-700 bg-gray-50/20">Hiển thị nút gọi điện</td>
                {PACKAGES.map(pkg => (
                  <td key={pkg.id} className="p-4 text-center border-l border-[#e2e8f0]">
                    <div className="flex justify-center">
                      {pkg.showCall ? (
                        <div className="bg-green-500 text-white rounded-full p-1"><Check size={16} /></div>
                      ) : (
                        <div className="bg-gray-200 text-gray-400 rounded-full p-1"><X size={16} /></div>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Row 11: Call to action buttons */}
              <tr>
                <td className="p-5 bg-gray-50/20"></td>
                {PACKAGES.map(pkg => (
                  <td key={pkg.id} className="p-5 border-l border-[#e2e8f0] text-center bg-gray-50/10">
                    <button
                      onClick={() => {
                        if (user?.role === 'landlord') {
                          navigate('/landlord/listings');
                        } else if (user) {
                          navigate(`/${user.role}/profile`);
                        } else {
                          navigate('/login');
                        }
                      }}
                      className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-[13px] font-bold text-white shadow-md shadow-indigo-600/10 transition-all active:scale-95 whitespace-nowrap"
                    >
                      Đăng tin ngay
                    </button>
                  </td>
                ))}
              </tr>

            </tbody>
          </table>
        </div>

        {/* Footnote */}
        <p className="mt-4 text-[12px] text-gray-400 font-medium">
          (*) Các tin VIP sẽ được hiển thị ngay sau khi khách hàng đăng tin mà không cần chờ duyệt. Tin thường cần được quản trị viên duyệt nội dung trước khi hiển thị công khai.
        </p>

        {/* Commitments Section */}
        <div className="grid gap-6 mt-16 md:grid-cols-4">
          {[
            { icon: BadgeCheck, title: 'Bảo mật tuyệt đối', desc: 'Thanh toán qua ví điện tử và cổng ngân hàng quốc gia an toàn.' },
            { icon: Award, title: 'Hiệu quả tối đa', desc: 'Hơn 85% chủ trọ tìm thấy khách hàng thuê thành công trong 1 tuần đầu.' },
            { icon: Clock3, title: 'Hỗ trợ kỹ thuật 24/7', desc: 'Gọi ngay hotline 1900 6789 bất kể khi nào bạn cần hỗ trợ.' },
            { icon: ShieldCheck, title: 'Hợp đồng minh bạch', desc: 'Mọi gói dịch vụ đều xuất hóa đơn VAT đầy đủ khi yêu cầu.' }
          ].map((item, i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#e2e8f0] p-5 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4"><item.icon size={22} /></div>
              <h4 className="font-bold text-[#0c1a3a] text-[15px] mb-2">{item.title}</h4>
              <p className="text-[13px] text-gray-500 leading-relaxed font-medium">{item.desc}</p>
            </div>
          ))}
        </div>

      </main>

      {/* Footer */}
      <footer id="footer" className="bg-[#0c1a3a] py-12 text-white mt-16">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-4 md:grid-cols-4 md:px-8">
          <div className="md:col-span-2">
            <div className="mb-4 text-[24px] font-semibold tracking-tight">PropTech</div>
            <p className="max-w-md text-[14px] leading-6 text-[#c7d3fd]">Hệ sinh thái công nghệ bất động sản giúp việc tìm kiếm và quản lý không gian sống trở nên dễ dàng hơn.</p>
          </div>
          <div>
            <h4 className="mb-4 text-[14px] font-semibold uppercase tracking-[0.16em] text-[#dae2ff]">Khám phá</h4>
            <ul className="space-y-3 text-[14px] text-[#c7d3fd]">
              <li><Link className="transition-colors hover:text-white" to="/tenant/discover">Danh sách phòng</Link></li>
              <li><Link className="transition-colors hover:text-white" to="/services-price">Bảng giá dịch vụ</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-4 text-[14px] font-semibold uppercase tracking-[0.16em] text-[#dae2ff]">Liên hệ</h4>
            <ul className="space-y-3 text-[14px] text-[#c7d3fd]">
              <li>info@proptech.com</li>
              <li>1900 6789</li>
            </ul>
          </div>
        </div>
        <div className="mx-auto mt-10 max-w-[1280px] border-t border-white/10 px-4 pt-6 text-center text-[12px] text-[#c7d3fd] md:px-8">© 2024 PropTech. All rights reserved.</div>
      </footer>
    </div>
  );
};

export default ServicesPrice;
