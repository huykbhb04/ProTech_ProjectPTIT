import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import tenantService from '../../services/tenantService';
import {
    House, Zap, Droplets, Wrench, ArrowRight,
    Wallet, Clock, MapPin, FileText, Search
} from 'lucide-react';
import { Spinner, PageHeader } from '../../components/ui';

/* ── Utility Reading Card ── */
const UtilityCard = ({ icon, label, value, unit, accent, date }) => (
    <div className="card-base p-5 hover:shadow-md transition-all duration-200 group">
        <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${accent}15`, color: accent }}>
                {icon}
            </div>
            <span className="section-label">{label}</span>
        </div>
        <div className="flex items-baseline gap-1.5 mb-2">
            <span className="text-3xl font-black text-black tracking-tighter">{value}</span>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{unit}</span>
        </div>
        {date && (
            <p className="meta-text flex items-center gap-1 text-gray-400">
                <Clock size={9} /> {new Date(date).toLocaleDateString('vi-VN')}
            </p>
        )}
    </div>
);

/* ── Quick Action ── */
const QuickAction = ({ to, icon: Icon, label, desc, primary = false }) => {
    const Comp = to ? Link : 'button';
    return (
        <Comp to={to}
            className={`flex items-center gap-4 p-4 border transition-all duration-200 group ${primary
                ? 'bg-black border-black text-white hover:bg-gray-900'
                : 'card-base hover:border-gray-200 hover:shadow-sm'
                }`}>
            <div className={`w-10 h-10 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${primary ? 'bg-white/10 text-white' : 'bg-gray-50 text-gray-500'}`}>
                <Icon size={18} />
            </div>
            <div>
                <p className={`text-sm font-bold leading-none mb-0.5 ${primary ? 'text-white' : 'text-black'}`}>{label}</p>
                {desc && <p className={`text-[10px] font-bold uppercase tracking-widest ${primary ? 'text-gray-400' : 'text-gray-400'}`}>{desc}</p>}
            </div>
        </Comp>
    );
};

/* ── Service Price Row ── */
const ServiceRow = ({ cfg }) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
        <div className="flex items-center gap-3">
            <div className={`w-7 h-7 flex items-center justify-center text-[9px] font-black ${cfg.type === 'electricity' ? 'bg-amber-50 text-amber-700' : 'bg-cyan-50 text-cyan-700'}`}>
                {cfg.type === 'electricity' ? 'KWH' : 'M³'}
            </div>
            <span className="text-sm font-medium text-gray-700">{cfg.name}</span>
        </div>
        <span className="text-sm font-black text-black">{new Intl.NumberFormat('vi-VN').format(cfg.price)}₫</span>
    </div>
);

const TenantDashboard = () => {
    const { user } = useSelector(s => s.auth);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        tenantService.getMyRoom()
            .then(res => setData(res))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    if (loading) return (
        <div className="flex items-center justify-center h-[60vh]">
            <Spinner size="lg" />
        </div>
    );

    /* No contract */
    if (!data || !data.hasContract) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 max-w-md mx-auto">
            <div className="w-20 h-20 border border-gray-100 flex items-center justify-center text-gray-300 mb-8">
                <House size={32} />
            </div>
            <p className="section-label mb-3">Chưa có phòng</p>
            <h2 className="text-2xl font-bold text-black tracking-tighter mb-4">Bạn chưa thuê phòng nào</h2>
            <p className="body-text mb-8">Hãy khám phá các không gian sống phù hợp với bạn ngay hôm nay.</p>
            <Link to="/tenant/discover" className="btn-primary">
                <Search size={15} /> Tìm phòng ngay
            </Link>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-10 space-y-8 animate-fade-in-up">

            {/* Welcome Header */}
            <PageHeader
                label="Tổng quan"
                title={`Xin chào, ${user?.full_name?.split(' ').pop() || 'bạn'}`}
            />

            {/* ── Main Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                {/* Left — 8 cols */}
                <div className="lg:col-span-8 space-y-6">

                    {/* Room Card */}
                    <div className="card-base p-6 md:p-8 relative overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="badge badge-info">Phòng của bạn</span>
                                    <span className="badge badge-success">
                                        <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Đang thuê
                                    </span>
                                </div>
                                <h2 className="text-5xl font-black text-black tracking-tighter mb-2">P. {data.room_number}</h2>
                                <p className="flex items-center gap-1.5 body-text">
                                    <MapPin size={14} className="text-indigo-500 flex-shrink-0" />
                                    {data.building_name} · {data.address_full}
                                </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="section-label mb-1">Giá thuê / tháng</p>
                                <p className="text-2xl font-black text-indigo-600">
                                    {new Intl.NumberFormat('vi-VN').format(data.contract?.monthly_price)} ₫
                                </p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-gray-100">
                            <div>
                                <p className="section-label mb-1">Diện tích</p>
                                <p className="text-lg font-black text-black">{data.area} m²</p>
                            </div>
                            <div>
                                <p className="section-label mb-1">Hết hạn HĐ</p>
                                <p className="text-lg font-black text-black">{new Date(data.contract?.end_date).toLocaleDateString('vi-VN')}</p>
                            </div>
                            <div className="flex items-center justify-end">
                                {data.contract?.contract_id && (
                                    <Link to={`/tenant/my-contract/${data.contract.contract_id}`}
                                        className="text-[11px] font-black uppercase tracking-wide text-indigo-600 hover:text-black flex items-center gap-1 transition-colors">
                                        Hợp đồng <ArrowRight size={12} />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <p className="section-label mb-3">Thao tác nhanh</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <QuickAction to="/tenant/bills" icon={Wallet} label="Thanh toán & Hóa đơn" desc="Xem và thanh toán cước phí" primary />
                            <div className="grid grid-cols-2 gap-3">
                                <QuickAction icon={Wrench} label="Báo sự cố" desc="Gửi yêu cầu" />
                                <QuickAction to={`/tenant/my-contract/${data.contract?.contract_id}`} icon={FileText} label="Hợp đồng" desc="Xem chi tiết" />
                            </div>
                        </div>
                    </div>

                    {/* Utility Readings */}
                    <div>
                        <p className="section-label mb-3">Chỉ số sử dụng</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <UtilityCard
                                icon={<Zap size={16} />} label="Điện (số mới)"
                                value={data.latest_electricity?.new_index || '0'} unit="kWh"
                                accent="#f59e0b" date={data.latest_electricity?.record_date}
                            />
                            <UtilityCard
                                icon={<Droplets size={16} />} label="Nước (số mới)"
                                value={data.latest_water?.new_index || '0'} unit="m³"
                                accent="#06b6d4" date={data.latest_water?.record_date}
                            />
                        </div>
                    </div>
                </div>

                {/* Right — 4 cols */}
                <div className="lg:col-span-4 space-y-5">

                    {/* Service Prices */}
                    {data.utility_configs?.length > 0 && (
                        <div className="card-base p-5">
                            <p className="section-label mb-4">Giá dịch vụ</p>
                            {data.utility_configs.map(cfg => <ServiceRow key={cfg.config_id} cfg={cfg} />)}
                        </div>
                    )}

                    {/* Black CTA */}
                    <div className="bg-black text-white p-6 space-y-4">
                        <p className="section-label text-gray-500">Khám phá thêm</p>
                        <p className="text-lg font-bold text-white tracking-tight">Tìm bạn cùng phòng phù hợp?</p>
                        <Link to="/tenant/roommates" className="btn-ghost border-white text-white hover:bg-white hover:text-black inline-flex">
                            Tìm ngay <ArrowRight size={13} />
                        </Link>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default TenantDashboard;
