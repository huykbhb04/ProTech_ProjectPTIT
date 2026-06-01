import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
    TrendingUp, House, Home, Users, TriangleAlert, CircleAlert,
    Receipt, CircleCheck, CheckCircle, Wrench, Bell, CircleQuestionMark, User,
    Building2, Plus, FileText, Download, ArrowRight, MapPin,
    Star, Settings, ChevronRight, Activity, Calendar
} from 'lucide-react';
import notificationService from '../../services/notificationService';
import statisticsService from '../../services/statisticsService';
import { Spinner } from '../../components/ui';

/* ── Page Header ── */
const PageHeader = ({ label, title, description, actions }) => (
    <div className="mb-6">
        <div className="flex items-end justify-between">
            <div>
                {label && <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[#6f7a74] mb-1">{label}</p>}
                <h1 className="text-[24px] font-semibold text-[#181d1a] leading-8">{title}</h1>
                {description && <p className="text-sm text-[#3f4944] mt-1">{description}</p>}
            </div>
            {actions && <div className="flex gap-2">{actions}</div>}
        </div>
    </div>
);

/* ── Alert Banner ── */
const AlertBanner = ({ type = 'warning', message, actionText, onAction }) => {
    const colors = {
        warning: { bg: '#fffbeb', border: '#f59e0b', text: '#181d1a', icon: '#f59e0b' },
        info: { bg: '#eff6ff', border: '#3b82f6', text: '#1e40af', icon: '#3b82f6' },
        error: { bg: '#fef2f2', border: '#ef4444', text: '#991b1b', icon: '#ef4444' },
    };
    const c = colors[type] || colors.warning;

    return (
        <div
            className="rounded-[10px] p-4 flex items-center justify-between mb-6 border-l-4"
            style={{ backgroundColor: c.bg, borderLeftColor: c.border }}
        >
            <div className="flex items-center gap-3">
                <TriangleAlert size={20} style={{ color: c.icon }} />
                <span className="text-sm font-medium" style={{ color: c.text }}>{message}</span>
            </div>
            {actionText && onAction && (
                <button
                    onClick={onAction}
                    className="text-[#0f6e56] font-bold text-sm hover:underline"
                >
                    {actionText}
                </button>
            )}
        </div>
    );
};

/* ── Stat Card ── */
const StatCard = ({ icon: Icon, iconBg, iconColor, trend, label, value, suffix = '' }) => (
    <div
        className="rounded-[14px] p-4 flex flex-col justify-between h-32 border"
        style={{ backgroundColor: '#ffffff', borderColor: '#bec9c3' }}
    >
        <div className="flex justify-between items-start">
            <div
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: iconBg }}
            >
                <Icon style={{ color: iconColor, width: 18, height: 18 }} />
            </div>
            {trend && (
                <span className="text-xs font-semibold" style={{ color: iconColor }}>
                    {trend}
                </span>
            )}
        </div>
        <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-wider text-[#6f7a74]">
                {label}
            </p>
            <p className="text-[20px] font-semibold text-[#181d1a] leading-7">
                {value}{suffix}
            </p>
        </div>
    </div>
);

/* ── Featured Revenue Box ── */
const RevenueBox = ({ amount, progress, goalLabel }) => (
    <div
        className="rounded-[14px] p-5 relative overflow-hidden border"
        style={{ backgroundColor: '#ffffff', borderColor: '#bec9c3' }}
    >
        <div className="relative z-10">
            <p className="text-sm font-semibold text-[#3f4944] mb-1">Tổng thu tháng này</p>
            <h2 className="text-[36px] font-bold text-[#0f6e56] leading-tight">
                {amount}
            </h2>
            <div className="mt-4 flex items-center gap-3">
                <div className="h-2 w-48 rounded-full overflow-hidden" style={{ backgroundColor: '#ebefeb' }}>
                    <div
                        className="h-full rounded-full"
                        style={{ width: `${progress}%`, backgroundColor: '#0f6e56' }}
                    />
                </div>
                <span className="text-[11.5px] text-[#6f7a74]">{goalLabel}</span>
            </div>
        </div>
        <div
            className="absolute right-0 top-0 h-full w-1/3 opacity-5 pointer-events-none flex items-center justify-center"
        >
            <TrendingUp style={{ width: 120, height: 120, color: '#0f6e56' }} />
        </div>
    </div>
);

/* ── Activity Item ── */
const ActivityItem = ({ icon: Icon, iconColor, title, subtitle, time, onClick }) => (
    <div
        className="px-6 py-4 flex items-center gap-4 cursor-pointer hover:bg-[#f9fbfc] transition-colors border-b"
        style={{ borderColor: '#bec9c3' }}
        onClick={onClick}
    >
        <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ backgroundColor: '#ebefeb' }}
        >
            <Icon style={{ color: iconColor, width: 18, height: 18 }} />
        </div>
        <div className="flex-1">
            <p className="text-sm font-medium text-[#181d1a]">{title}</p>
            <p className="text-[11.5px] text-[#6f7a74]">{subtitle}</p>
        </div>
        <span className="text-[11.5px] text-[#6f7a74]">{time}</span>
    </div>
);

/* ── Quick Access Button ── */
const QuickAccessBtn = ({ icon: Icon, label, onClick }) => (
    <button
        onClick={onClick}
        className="rounded-[14px] p-4 flex flex-col items-center justify-center gap-2 hover:bg-[#f0fdf8] transition-all border-dashed"
        style={{ backgroundColor: '#ffffff', borderColor: '#bec9c3' }}
    >
        <Icon
            className="transition-transform"
            style={{ color: '#0f6e56', width: 32, height: 32 }}
        />
        <span className="text-sm font-bold text-[#181d1a]">{label}</span>
    </button>
);

/* ── Map Placeholder ── */
const MapPlaceholder = ({ location, stats }) => (
    <div
        className="rounded-[14px] p-4 border"
        style={{ backgroundColor: '#ffffff', borderColor: '#bec9c3' }}
    >
        <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#181d1a]">Vị trí tài sản</h3>
            <MapPin style={{ color: '#6f7a74', width: 20, height: 20 }} />
        </div>
        <div
            className="aspect-square rounded-lg relative overflow-hidden"
            style={{ backgroundColor: '#e5e9e5' }}
        >
            <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&h=400&fit=crop"
                alt="Map"
                className="w-full h-full object-cover opacity-80"
            />
            <div
                className="absolute inset-0"
                style={{ backgroundColor: 'rgba(15, 110, 86, 0.1)' }}
            />
            <div
                className="absolute bottom-4 left-4 right-4 p-3 rounded-lg border"
                style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    backdropFilter: 'blur(8px)',
                    borderColor: 'rgba(255, 255, 255, 0.2)'
                }}
            >
                <p className="text-[11.5px] font-bold text-[#181d1a]">{location}</p>
                <p className="text-[10px] text-[#6f7a74]">{stats}</p>
            </div>
        </div>
    </div>
);

/* ── Satisfaction Card ── */
const SatisfactionCard = ({ rating, reviewCount }) => (
    <div
        className="rounded-[14px] p-4"
        style={{ backgroundColor: '#0f1f1a' }}
    >
        <p className="text-[11.5px] font-semibold uppercase mb-1" style={{ color: 'rgba(160, 243, 212, 0.7)' }}>
            Chỉ số hài lòng
        </p>
        <div className="flex items-end gap-3">
            <h4 className="text-[48px] font-bold leading-none" style={{ color: '#ffffff' }}>
                {rating}
            </h4>
            <div className="flex items-center mb-1 gap-0.5">
                {[1, 2, 3, 4].map((i) => (
                    <Star key={i} style={{ color: '#a0f3d4', width: 14, height: 14, fill: '#a0f3d4' }} />
                ))}
                <Star style={{ color: '#a0f3d4', width: 14, height: 14, fill: 'none', stroke: '#a0f3d4', strokeWidth: 2 }} />
            </div>
        </div>
        <p className="text-sm mt-2" style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            Dựa trên {reviewCount} phản hồi từ khách thuê trong tháng qua.
        </p>
    </div>
);

/* ── Reputation Score Card ── */
const ReputationScoreCard = ({ score = 100 }) => {
    let colorClass = 'bg-[#10b981]'; // green
    let text = 'Rất uy tín';
    let desc = 'Tin đăng của bạn đang được ưu tiên hiển thị ở vị trí cao trong kết quả tìm kiếm.';

    if (score < 50) {
        colorClass = 'bg-red-500';
        text = 'Cảnh báo/Hạn chế';
        desc = 'Điểm uy tín của bạn quá thấp. Tài khoản đã bị hạn chế đăng tin mới.';
    } else if (score < 70) {
        colorClass = 'bg-amber-500';
        text = 'Trung bình';
        desc = 'Tin đăng có thể bị giảm hiển thị. Vui lòng cải thiện chất lượng phục vụ và thông tin.';
    } else if (score < 90) {
        colorClass = 'bg-[#3b82f6]'; // blue
        text = 'Khá uy tín';
        desc = 'Tin đăng hiển thị bình thường trên trang chủ.';
    }

    return (
        <div
            className="rounded-[14px] p-5 border"
            style={{ backgroundColor: '#ffffff', borderColor: '#bec9c3' }}
        >
            <div className="flex items-center justify-between">
                <span className="text-[11.5px] font-semibold uppercase tracking-wider text-[#6f7a74]">Thang điểm uy tín</span>
                <span className="text-[#6f7a74] text-xs font-semibold">Tối đa: 100</span>
            </div>
            
            <div className="mt-4 flex items-center gap-4">
                <div className="relative flex items-center justify-center shrink-0">
                    <svg className="w-16 h-16 transform -rotate-90">
                        <circle cx="32" cy="32" r="26" fill="none" stroke="#ebefeb" strokeWidth="5" />
                        <circle cx="32" cy="32" r="26" fill="none" stroke={score < 50 ? '#ef4444' : score < 70 ? '#f59e0b' : score < 90 ? '#3b82f6' : '#10b981'} strokeWidth="5" 
                                strokeDasharray={163.36} 
                                strokeDashoffset={163.36 - (score / 100) * 163.36}
                                strokeLinecap="round" />
                    </svg>
                    <span className="absolute text-base font-bold text-slate-800">{score}</span>
                </div>

                <div className="min-w-0">
                    <span className={`inline-block text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${colorClass}`}>
                        {text}
                    </span>
                    <p className="mt-1.5 text-xs text-[#6f7a74] leading-relaxed">
                        {desc}
                    </p>
                </div>
            </div>
        </div>
    );
};

/* ── Top App Bar ── */
const TopAppBar = ({ user }) => {
    const navigate = useNavigate();

    return (
        <header
            className="fixed top-0 right-0 h-20 flex items-center justify-between px-6 z-40 border-b"
            style={{
                width: 'calc(100% - 260px)',
                backgroundColor: '#f7faf6',
                borderColor: '#bec9c3'
            }}
        >
            <div className="flex items-center gap-8">
                <h2 className="text-[20px] font-semibold text-[#181d1a]">Trang chủ</h2>
                <div className="hidden md:flex gap-6">
                    <Link to="/landlord/properties" className="text-[#0f6e56] font-bold border-b-2 border-[#0f6e56] pb-1 text-sm">
                        Tất cả tòa nhà
                    </Link>
                    <Link to="/landlord/reports" className="text-[#3f4944] font-medium hover:text-[#0f6e56] transition-all text-sm">
                        Báo cáo tháng
                    </Link>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                    <Link to="/landlord/notifications" className="p-1.5 rounded-full hover:bg-[#ebefeb] transition-all relative">
                        <Bell style={{ color: '#3f4944', width: 22, height: 22 }} />
                    </Link>
                    <Link to="/landlord/profile" className="p-1.5 rounded-full hover:bg-[#ebefeb] transition-all">
                        <CircleQuestionMark style={{ color: '#3f4944', width: 22, height: 22 }} />
                    </Link>
                    <Link to="/landlord/profile" className="p-1.5 rounded-full hover:bg-[#ebefeb] transition-all">
                        <User style={{ color: '#3f4944', width: 22, height: 22 }} />
                    </Link>
                </div>
                <Link
                    to="/landlord/properties/new"
                    className="text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-all"
                    style={{ backgroundColor: '#0f6e56' }}
                >
                    + Thêm tòa nhà
                </Link>
            </div>
        </header>
    );
};

const LandlordDashboard = () => {
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [notifications, setNotifications] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [notis, statsData] = await Promise.all([
                    notificationService.getNotifications().catch(() => []),
                    statisticsService.getOverviewStats().catch(() => null)
                ]);
                setNotifications(notis.slice(0, 6));
                setStats(statsData?.stats || null);
            } catch (err) {
                console.error(err);
                setStats(null);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const getUserName = () => {
        if (!user) return 'Chủ nhà';
        const name = user.full_name || user.name || user.email || 'Chủ nhà';
        return name.split(' ').pop() || name;
    };

    const fmt = (n) => {
        if (!n) return '0';
        if (n >= 1e9) return (n / 1e9).toFixed(1) + ' Tỷ';
        if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
        return new Intl.NumberFormat('vi-VN').format(n);
    };

    const fmtVND = (n) => {
        if (!n) return '0 VNĐ';
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
    };

    const formatTime = (d) => {
        const diff = Math.floor((Date.now() - new Date(d)) / 60000);
        if (diff < 60) return `${diff} phút trước`;
        if (diff < 1440) return `${Math.floor(diff / 60)} giờ trước`;
        return new Date(d).toLocaleDateString('vi-VN');
    };

    const unread = notifications.filter(n => !n.is_read).length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Spinner size="lg" />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen pb-20"
            style={{
                backgroundColor: '#f7faf6',
                fontFamily: "'Be Vietnam Pro', sans-serif",
                paddingTop: '80px',
                paddingLeft: '24px',
                paddingRight: '24px',
                maxWidth: '1280px',
                margin: '0 auto'
            }}
        >
            {/* Top App Bar */}
            <TopAppBar user={{}} />

            {/* Welcome Header */}
            <section className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-[32px] font-bold text-[#181d1a] leading-10 tracking-tight">
                        Xin chào, {getUserName()}
                    </h1>
                    <p className="text-sm text-[#3f4944]">
                        Chào mừng trở lại!{unread > 0 ? ` Bạn có ${unread} thông báo mới.` : ' Chúc bạn một ngày làm việc hiệu quả.'}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-sm text-[#6f7a74] font-medium">
                        {new Date().toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                        })}
                    </p>
                </div>
            </section>

            {/* Alert Banner */}
            {stats?.reputationScore !== undefined && stats.reputationScore < 50 && (
                <AlertBanner
                    type="error"
                    message={`Cảnh báo: Điểm uy tín của bạn hiện đang là ${stats.reputationScore}/100. Tài khoản bị hạn chế đăng thêm tin mới do điểm dưới 50!`}
                    actionText="Xem hồ sơ"
                    onAction={() => navigate('/landlord/profile')}
                />
            )}
            {stats?.openRequests > 0 && (
                <AlertBanner
                    type="warning"
                    message={`Có ${stats.openRequests} yêu cầu bảo trì đang chờ xử lý.`}
                    actionText="Xem ngay"
                    onAction={() => navigate('/landlord/maintenance')}
                />
            )}

            <div className="grid grid-cols-12 gap-6">
                {/* Left Column: Stats & Revenue */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                        <StatCard
                            icon={TrendingUp}
                            iconBg="#e6f7f2"
                            iconColor="#0f6e56"
                            trend="+12%"
                            label="Doanh thu"
                            value={fmt(stats?.totalRevenue || 0)}
                        />
                        <StatCard
                            icon={Home}
                            iconBg="#f0fdf4"
                            iconColor="#16a34a"
                            trend="98%"
                            label="Tỷ lệ trống"
                            value={stats?.vacantRooms || 0}
                            suffix=" Phòng"
                        />
                        <StatCard
                            icon={Users}
                            iconBg="#eef2ff"
                            iconColor="#4f46e5"
                            trend="45 mới"
                            label="Khách thuê"
                            value={stats?.totalTenants?.toLocaleString() || '0'}
                        />
                        <StatCard
                            icon={TriangleAlert}
                            iconBg="#fffbeb"
                            iconColor="#f59e0b"
                            trend="8 Chờ"
                            label="Bảo trì"
                            value={stats?.openRequests || 0}
                            suffix=" Yêu cầu"
                        />
                    </div>

                    {/* Featured Revenue Box */}
                    <RevenueBox
                        amount={fmtVND(stats?.monthlyRevenue || 0)}
                        progress={75}
                        goalLabel="75% mục tiêu tháng"
                    />

                    {/* Recent Activity */}
                    <div
                        className="rounded-[14px] overflow-hidden border"
                        style={{ backgroundColor: '#ffffff', borderColor: '#bec9c3' }}
                    >
                        <div
                            className="px-6 py-4 border-b flex justify-between items-center"
                            style={{ borderColor: '#bec9c3' }}
                        >
                            <h3 className="text-sm font-bold text-[#181d1a]">Hoạt động gần đây</h3>
                            <Link
                                to="/landlord/notifications"
                                className="text-[#0f6e56] text-[11.5px] font-bold hover:underline"
                            >
                                Xem tất cả
                            </Link>
                        </div>
                        <div>
                            {notifications.length > 0 ? notifications.map((n, i) => {
                                const iconMap = {
                                    booking: { icon: Calendar, color: '#0f6e56' },
                                    bill: { icon: CheckCircle, color: '#16a34a' },
                                    alert: { icon: TriangleAlert, color: '#f59e0b' },
                                };
                                const { icon: Icon, color } = iconMap[n.type] || { icon: Receipt, color: '#0f6e56' };

                                return (
                                    <ActivityItem
                                        key={n.noti_id || i}
                                        icon={Icon}
                                        iconColor={color}
                                        title={n.title || n.body?.substring(0, 50)}
                                        subtitle={n.body?.substring(0, 100)}
                                        time={formatTime(n.created_at)}
                                        onClick={() => navigate('/landlord/notifications')}
                                    />
                                );
                            }) : (
                                <>
                                    <ActivityItem
                                        icon={FileText}
                                        iconColor="#0f6e56"
                                        title="Hợp đồng mới được ký - Căn hộ A102"
                                        subtitle="Bởi Nguyễn Văn B"
                                        time="10 phút trước"
                                        onClick={() => {}}
                                    />
                                    <ActivityItem
                                        icon={Wrench}
                                        iconColor="#ba1a1a"
                                        title="Yêu cầu bảo trì mới - Hệ thống nước Tòa B"
                                        subtitle="Mức độ: Cao"
                                        time="45 phút trước"
                                        onClick={() => navigate('/landlord/maintenance')}
                                    />
                                    <ActivityItem
                                        icon={CheckCircle}
                                        iconColor="#005440"
                                        title="Thanh toán hóa đơn tháng 11 thành công"
                                        subtitle="Hợp đồng #1224"
                                        time="2 giờ trước"
                                        onClick={() => navigate('/landlord/bills')}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column: Quick Access & Trends */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Quick Access Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <QuickAccessBtn
                            icon={Building2}
                            label="Thêm phòng"
                            onClick={() => navigate('/landlord/properties/new')}
                        />
                        <QuickAccessBtn
                            icon={User}
                            label="Thêm khách"
                            onClick={() => navigate('/landlord/contracts/new')}
                        />
                        <QuickAccessBtn
                            icon={Receipt}
                            label="Xuất hóa đơn"
                            onClick={() => navigate('/landlord/bills')}
                        />
                        <QuickAccessBtn
                            icon={Download}
                            label="Báo cáo nhanh"
                            onClick={() => navigate('/landlord/reports')}
                        />
                    </div>

                    {/* Building Overview Map */}
                    <MapPlaceholder
                        location="Quận 1, TP.HCM"
                        stats="12 Tòa nhà • 450 Căn hộ"
                    />

                    {/* Landlord Reputation Score */}
                    <ReputationScoreCard score={stats?.reputationScore} />

                    {/* Tenant Satisfaction */}
                    <SatisfactionCard
                        rating="4.8"
                        reviewCount={320}
                    />
                </div>
            </div>
        </div>
    );
};

export default LandlordDashboard;
