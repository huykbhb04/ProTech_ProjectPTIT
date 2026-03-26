import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import tenantService from '../../services/tenantService';
import {
    Home, Zap, Droplets, Wrench, ArrowRight,
    Calendar, Wallet, Clock, MapPin,
    FileText, Bell, ChevronRight, User
} from 'lucide-react';

const UtilityCard = ({ icon, label, value, unit, color, date }) => (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.02)] hover:shadow-md hover:border-gray-200 transition-all flex flex-col justify-between h-full group">
        <div>
            <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color} bg-opacity-10 shrink-0`}>
                    {icon}
                </div>
                <span className="text-sm font-semibold text-gray-500">{label}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
                <span className="text-3xl font-bold text-gray-900 tracking-tight">{value}</span>
                <span className="text-sm font-medium text-gray-400">{unit}</span>
            </div>
        </div>
        {date && (
            <p className="text-xs text-gray-400 mt-4 flex items-center gap-1 font-medium bg-gray-50 w-fit px-2 py-1 rounded-lg">
                <Clock size={10} /> {new Date(date).toLocaleDateString('vi-VN')}
            </p>
        )}
    </div>
);

const QuickAction = ({ to, icon, label, description, primary = false, onClick }) => {
    const Component = to ? Link : 'button';
    return (
        <Component
            to={to}
            onClick={onClick}
            className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${primary
                ? 'bg-gradient-to-br from-indigo-600 to-violet-600 border-transparent text-white shadow-lg shadow-indigo-200 hover:shadow-xl hover:translate-y-[-2px]'
                : 'bg-white border-gray-100 text-gray-700 hover:border-indigo-100 hover:bg-indigo-50/30'
                }`}
        >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110 ${primary ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
                }`}>
                {icon}
            </div>
            <div>
                <span className={`block text-sm font-bold ${primary ? 'text-white' : 'text-gray-900 group-hover:text-indigo-700'}`}>
                    {label}
                </span>
                {description && (
                    <span className={`text-xs mt-0.5 block ${primary ? 'text-indigo-100' : 'text-gray-400'}`}>
                        {description}
                    </span>
                )}
            </div>
        </Component>
    );
};

const TenantDashboard = () => {
    const { user } = useSelector((state) => state.auth);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await tenantService.getMyRoom();
                setData(res);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!data || !data.hasContract) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-white/50 rounded-3xl border border-dashed border-gray-200 m-4">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-6">
                <Home size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Chưa thuê phòng</h2>
            <p className="text-gray-500 max-w-xs mb-6 text-sm">Bạn chưa có phòng nào trong hệ thống. Hãy tìm phòng phù hợp nhé.</p>
            <Link to="/tenant/discover" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center gap-2">
                Tìm phòng ngay <ArrowRight size={16} />
            </Link>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 md:px-10 py-6 md:py-10 space-y-8 pb-12 animate-in fade-in duration-500">


            {/* 2. Main Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* Left Content (8 cols) */}
                <div className="lg:col-span-8 space-y-8">

                    {/* Room Card - Clean Design */}
                    <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50/50 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none"></div>

                        <div className="relative z-10">
                            <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                                <div>
                                    <div className="flex items-center gap-2 mb-3">
                                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-full border border-indigo-100">
                                            Phòng của bạn
                                        </span>
                                        <span className="px-3 py-1 bg-green-50 text-green-600 text-xs font-bold rounded-full border border-green-100 flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span> Đang thuê
                                        </span>
                                    </div>
                                    <h2 className="text-4xl font-black text-gray-900 tracking-tight mb-2">P. {data.room_number}</h2>
                                    <p className="text-gray-500 flex items-center gap-1.5 text-sm font-medium">
                                        <MapPin size={16} className="text-indigo-500" />
                                        {data.building_name} • {data.address_full}
                                    </p>
                                </div>
                                <div className="text-right hidden md:block">
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Giá thuê tháng</p>
                                    <p className="text-2xl font-black text-indigo-600">{new Intl.NumberFormat('vi-VN').format(data.contract?.monthly_price)} ₫</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-50">
                                <div className="text-center md:text-left">
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Diện tích</p>
                                    <p className="text-lg font-bold text-gray-900">{data.area} m²</p>
                                </div>
                                <div className="text-center md:text-left">
                                    <p className="text-xs text-gray-400 font-bold uppercase mb-1">Hết hạn HĐ</p>
                                    <p className="text-lg font-bold text-gray-900">{new Date(data.contract?.end_date).toLocaleDateString('vi-VN')}</p>
                                </div>
                                <div className="text-right flex items-center justify-end">
                                    {data.contract?.contract_id && (
                                        <Link to={`/tenant/my-contract/${data.contract.contract_id}`} className="group/link inline-flex items-center gap-1 text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors">
                                            Hợp đồng <ArrowRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions Row */}
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg mb-4 px-1">Thao tác nhanh</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <QuickAction
                                to="/tenant/bills"
                                icon={<Wallet size={24} />}
                                label="Thanh toán & Hóa đơn"
                                description="Xem và thanh toán cước phí"
                                primary
                            />
                            <div className="grid grid-cols-2 gap-4">
                                <QuickAction
                                    icon={<Wrench size={20} />}
                                    label="Báo sự cố"
                                    description="Gửi yêu cầu sửa chữa"
                                />
                                <QuickAction
                                    to={`/tenant/my-contract/${data.contract?.contract_id}`}
                                    icon={<FileText size={20} />}
                                    label="Hợp đồng"
                                    description="Xem chi tiết"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Stats Section */}
                    <div>
                        <div className="flex justify-between items-center mb-4 px-1">
                            <h3 className="font-bold text-gray-900 text-lg">Chỉ số sử dụng</h3>
                            <button className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors">
                                Cập nhật mới nhất
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <UtilityCard
                                icon={<Zap size={18} className="text-amber-500" />}
                                color="bg-amber-100"
                                label="Điện (Số mới)"
                                value={data.latest_electricity?.new_index || '0'}
                                unit="kWh"
                                date={data.latest_electricity?.record_date}
                            />
                            <UtilityCard
                                icon={<Droplets size={18} className="text-cyan-500" />}
                                color="bg-cyan-100"
                                label="Nước (Số mới)"
                                value={data.latest_water?.new_index || '0'}
                                unit="m³"
                                date={data.latest_water?.record_date}
                            />
                        </div>
                    </div>

                </div>

                {/* Right Content (4 cols) */}
                <div className="lg:col-span-4 space-y-8">

                    {/* Schedule Widget (Clean) */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
                            <Calendar size={20} className="text-indigo-600" /> Lịch sắp tới
                        </h3>

                        <div className="space-y-6 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-gray-100"></div>

                            {/* Items */}
                            <div className="relative flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-teal-50 border-4 border-white z-10 flex items-center justify-center text-teal-600 shrink-0 shadow-sm">
                                    <Zap size={18} />
                                </div>
                                <div className="flex-1 pt-1">
                                    <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md mb-1 inline-block">Vệ sinh</span>
                                    <p className="font-bold text-gray-900 text-sm">Dọn dẹp phòng</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {data.next_cleaning_date
                                            ? new Date(data.next_cleaning_date).toLocaleDateString('vi-VN')
                                            : 'Chưa có lịch'}
                                    </p>
                                </div>
                            </div>

                            <div className="relative flex gap-4">
                                <div className="w-10 h-10 rounded-full bg-orange-50 border-4 border-white z-10 flex items-center justify-center text-orange-600 shrink-0 shadow-sm">
                                    <Wrench size={18} />
                                </div>
                                <div className="flex-1 pt-1">
                                    <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-md mb-1 inline-block">Bảo trì</span>
                                    <p className="font-bold text-gray-900 text-sm">Kiểm tra định kỳ</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {data.next_maintenance_date
                                            ? new Date(data.next_maintenance_date).toLocaleDateString('vi-VN')
                                            : 'Sắp tới'}
                                    </p>
                                </div>
                            </div>

                            {/* Empty State filler */}
                            {!data.next_cleaning_date && !data.next_maintenance_date && (
                                <p className="text-center text-gray-400 text-xs py-4 italic">Không có lịch sắp tới</p>
                            )}
                        </div>
                    </div>

                    {/* Services Widget */}
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
                            <Wallet size={20} className="text-indigo-600" /> Giá dịch vụ
                        </h3>
                        <div className="space-y-3">
                            {data.utility_configs?.map(cfg => (
                                <div key={cfg.config_id} className="flex justify-between items-center p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-default">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${cfg.type === 'electricity' ? 'bg-amber-100 text-amber-700' : 'bg-cyan-100 text-cyan-700'
                                            }`}>
                                            {cfg.type === 'electricity' ? 'Đ' : 'N'}
                                        </div>
                                        <span className="text-gray-700 font-medium text-sm">{cfg.name}</span>
                                    </div>
                                    <span className="font-bold text-gray-900 text-sm">{new Intl.NumberFormat('vi-VN').format(cfg.price)}₫</span>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

export default TenantDashboard;
