import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FileText, ArrowLeft, Calendar, House, User, Zap, Droplet,
    Package, CircleCheck, Shield, Download, DollarSign,
    Droplets, ShieldCheck, CircleAlert, Loader,
    Clock, CreditCard, X, Copy, CheckCircle2
} from 'lucide-react';
import contractService from '../../services/contractService';
import { toast } from 'react-hot-toast';

const TenantContractView = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [assets, setAssets] = useState([]);
    const [utilityConfigs, setUtilityConfigs] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        fetchContractData();
    }, [id]);

    const fetchContractData = async () => {
        try {
            setLoading(true);
            const [contractData, assetsData, configsData] = await Promise.all([
                contractService.getContractDetail(id),
                contractService.getRoomAssets(id),
                contractService.getUtilityConfigs(id)
            ]);
            setContract(contractData);
            setAssets(assetsData);
            setUtilityConfigs(configsData);
        } catch (error) {
            console.error('Error fetching contract:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader size={24} className="animate-spin text-gray-300" />
        </div>
    );

    if (!contract) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-gray-500">
            <CircleAlert size={48} className="mb-4 text-red-400" />
            <p className="font-bold">Không tìm thấy thông tin hợp đồng</p>
            <button onClick={() => navigate('/tenant/dashboard')} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">Quay lại Dashboard</button>
        </div>
    );

    const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n ?? 0);
    const isSignedByTenant = contract?.status === 'signed_by_tenant';

    const handleCopy = (text) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopied(true);
            toast.success('Đã sao chép!');
            setTimeout(() => setCopied(false), 2000);
        });
    };

    const terms = typeof contract.terms === 'string' ? JSON.parse(contract.terms) : contract.terms;
    const additionalServices = typeof contract.additional_services === 'string' ? JSON.parse(contract.additional_services) : (contract.additional_services || []);
    const serviceCommitments = typeof contract.service_commitments === 'string' ? JSON.parse(contract.service_commitments) : contract.service_commitments;

    return (
        <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in-up">
            {/* ── Header ── */}
            <div className="section-divider flex items-end justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="btn-ghost px-3 py-3">
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <p className="section-label mb-1">Hợp đồng chính thức</p>
                        <h1 className="page-title">Mã số: {contract.contract_id || `CT-${contract.id}`}</h1>
                    </div>
                </div>
                <button className="btn-primary">
                    <Download size={14} /> Tải bản gốc (PDF)
                </button>
            </div>

            {/* ── Payment CTA — chỉ hiện khi tenant đã ký, chờ landlord ── */}
            {isSignedByTenant && (
                <div className="glass p-5 rounded-[2rem] border border-amber-200/60 shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)' }}>
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                                <Clock size={22} className="text-amber-600" />
                            </div>
                            <div>
                                <p className="font-black text-gray-900 text-sm">Bạn đã ký hợp đồng thành công ✅</p>
                                <p className="text-xs text-amber-700 font-bold mt-0.5">
                                    Đang chờ chủ nhà xác nhận. Bạn có thể chuẩn bị tiền cọc trước.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex-shrink-0"
                            style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)' }}
                        >
                            <CreditCard size={16} />
                            Xem thông tin thanh toán cọc
                            <span className="ml-1 px-2 py-0.5 bg-white/20 rounded-full text-[10px]">
                                {fmt(contract.deposit_amount)}₫
                            </span>
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* \u2500\u2500 Status Banner \u2500\u2500 */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-black text-white p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                        <div className="space-y-2">
                            <span className="badge bg-white/10 text-white border-white/20 flex items-center gap-1">
                                <ShieldCheck size={9} /> Hợp đồng đã ký kết
                            </span>
                            <h2 className="text-2xl font-black mt-2">{contract.building_name}</h2>
                            <p className="text-white/60 text-sm font-medium">Phòng {contract.room_number || '101'} • {contract.address}</p>
                        </div>
                        <div className="border border-white/10 p-5 text-center min-w-[180px]">
                            <p className="section-label text-white/40 mb-1">Giá thuê / tháng</p>
                            <p className="text-2xl font-black">{new Intl.NumberFormat('vi-VN').format(contract.monthly_price)}₫</p>
                        </div>
                    </div>

                    {/* Contract Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="glass p-8 rounded-[2rem] border-white/40 shadow-lg">
                                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Calendar size={18} /> Thời hạn thuê
                                </h3>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center p-4 bg-white/40 rounded-2xl border border-white/60">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Bắt đầu</span>
                                        <span className="font-black text-gray-800">{new Date(contract.start_date).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                    <div className="flex justify-between items-center p-4 bg-white/40 rounded-2xl border border-white/60">
                                        <span className="text-xs font-bold text-gray-400 uppercase">Kết thúc</span>
                                        <span className="font-black text-gray-800">{new Date(contract.end_date).toLocaleDateString('vi-VN')}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="glass p-8 rounded-[2rem] border-white/40 shadow-lg">
                                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <DollarSign size={18} /> Tiền đặt cọc
                                </h3>
                                <div className="flex flex-col items-center justify-center h-28 space-y-2">
                                    <p className="text-3xl font-black text-indigo-600">{new Intl.NumberFormat('vi-VN').format(contract.deposit_amount)}₫</p>
                                    <div className="flex items-center gap-1 text-[10px] font-black text-green-600 uppercase bg-green-50 px-3 py-1 rounded-full border border-green-100">
                                        <CircleCheck size={10} /> Đã xác nhận
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Terms Text Section */}
                        <div className="glass p-10 rounded-[2.5rem] border-white/40 shadow-lg">
                            <h3 className="text-lg font-black text-gray-900 mb-8 flex items-center gap-3">
                                <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                Điều khoản hợp đồng
                            </h3>
                            <div className="space-y-8">
                                {terms && typeof terms === 'object' ? Object.entries(terms).map(([key, value]) => (
                                    <div key={key} className="relative pl-8 border-l-2 border-indigo-100 group">
                                        <div className="absolute -left-2 top-0 w-4 h-4 bg-indigo-600 rounded-full border-4 border-white shadow-sm group-hover:scale-125 transition-transform"></div>
                                        <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-2">{key.replace(/_/g, ' ')}</h4>
                                        <p className="text-gray-700 leading-relaxed font-bold italic">{value}</p>
                                    </div>
                                )) : (
                                    <p className="text-gray-500 italic">Điều khoản đang được cập nhật...</p>
                                )}
                            </div>
                        </div>

                        {/* Handover Data */}
                        {(contract.handover_electricity_index || contract.handover_water_index) && (
                            <div className="glass p-8 rounded-[2rem] border-white/40 shadow-lg">
                                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                                    Chỉ số bàn nhận
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {contract.handover_electricity_index && (
                                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Zap className="text-amber-600" size={20} />
                                                <span className="text-[10px] font-black text-gray-500 uppercase">Số điện</span>
                                            </div>
                                            <p className="text-2xl font-black text-amber-600">
                                                {contract.handover_electricity_index} <span className="text-xs font-bold text-amber-400">kWh</span>
                                            </p>
                                        </div>
                                    )}
                                    {contract.handover_water_index && (
                                        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Droplet className="text-blue-600" size={20} />
                                                <span className="text-[10px] font-black text-gray-500 uppercase">Số nước</span>
                                            </div>
                                            <p className="text-2xl font-black text-blue-600">
                                                {contract.handover_water_index} <span className="text-xs font-bold text-blue-400">m³</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Service Commitments */}
                        {serviceCommitments && (
                            <div className="glass p-8 rounded-[2rem] border-white/40 shadow-lg">
                                <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-3">
                                    <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                                    Cam kết dịch vụ
                                </h3>
                                <div className="space-y-4">
                                    {serviceCommitments.maintenance_response_time && (
                                        <div className="p-4 bg-white/40 rounded-2xl border border-white/60">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Thời gian phản hồi bảo trì</span>
                                            <span className="font-bold text-gray-800">{serviceCommitments.maintenance_response_time}</span>
                                        </div>
                                    )}
                                    {serviceCommitments.repair_responsibility && (
                                        <div className="p-4 bg-white/40 rounded-2xl border border-white/60">
                                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Trách nhiệm sửa chữa</span>
                                            <span className="font-bold text-gray-800">{serviceCommitments.repair_responsibility}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Sidebar */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Utility Prices */}
                        {utilityConfigs.length > 0 && (
                            <div className="glass p-8 rounded-[2rem] border-white/40 shadow-lg">
                                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Droplets size={18} /> Đơn giá dịch vụ
                                </h3>
                                <div className="space-y-4">
                                    {utilityConfigs.map((config) => (
                                        <div key={config.config_id} className="flex justify-between items-center p-4 bg-white/40 rounded-2xl border border-white/60">
                                            <span className="text-xs font-bold text-gray-500">{config.name}</span>
                                            <span className="font-black text-gray-900">{new Intl.NumberFormat('vi-VN').format(config.price)}₫</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Additional Services */}
                        {additionalServices.length > 0 && (
                            <div className="glass p-8 rounded-[2rem] border-white/40 shadow-lg">
                                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Package size={18} /> Tiện ích đi kèm
                                </h3>
                                <div className="space-y-3">
                                    {additionalServices.filter(s => s.included).map((service, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                                            <div className="flex items-center gap-2">
                                                <CircleCheck className="text-indigo-600" size={14} />
                                                <span className="text-xs font-bold text-gray-700">{service.name}</span>
                                            </div>
                                            <span className="text-[10px] font-black text-indigo-600">
                                                {service.price > 0 ? `${new Intl.NumberFormat('vi-VN').format(service.price)}₫` : 'Miễn phí'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Room Assets */}
                        {assets.length > 0 && (
                            <div className="glass p-8 rounded-[2rem] border-white/40 shadow-lg">
                                <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <House size={18} /> Danh mục tài sản
                                </h3>
                                <div className="space-y-2">
                                    {assets.map((asset) => (
                                        <div key={asset.asset_id} className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/60">
                                            <span className="text-xs font-bold text-gray-700">{asset.item_name}</span>
                                            <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter ${asset.condition_status === 'new' ? 'bg-green-100 text-green-700' :
                                                    asset.condition_status === 'good' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-amber-100 text-amber-700'
                                                }`}>
                                                {asset.condition_status === 'new' ? 'Mới' : asset.condition_status === 'good' ? 'Tốt' : 'Trung bình'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Signature Status */}
                        <div className="glass p-8 rounded-[2rem] border-white/40 shadow-lg">
                            <h3 className="text-sm font-black text-indigo-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                <Shield size={18} /> Xác thực bảo mật
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
                                    <CircleCheck size={20} className="text-green-600 mt-1" />
                                    <div>
                                        <p className="text-xs font-black text-gray-900">Bên thuê (Bạn)</p>
                                        <p className="text-[10px] text-gray-500 italic">{contract.tenant_signed_at ? new Date(contract.tenant_signed_at).toLocaleString('vi-VN') : 'Đã ký trực tuyến'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
                                    <CircleCheck size={20} className="text-green-600 mt-1" />
                                    <div>
                                        <p className="text-xs font-black text-gray-900">Bên cho thuê</p>
                                        <p className="text-[10px] text-gray-500 italic">{contract.landlord_signed_at ? new Date(contract.landlord_signed_at).toLocaleString('vi-VN') : 'Đã ký trực tuyến'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            </div>

            {/* ── Payment Modal ── */}
            {showPaymentModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                    onClick={(e) => { if (e.target === e.currentTarget) setShowPaymentModal(false); }}>
                    <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-md relative">
                        <button onClick={() => setShowPaymentModal(false)}
                            className="absolute top-5 right-5 p-2 hover:bg-gray-100 rounded-xl transition-colors">
                            <X size={18} />
                        </button>

                        {/* Header */}
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center"
                                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                                <CreditCard size={22} className="text-white" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Thanh toán tiền cọc</p>
                                <h3 className="text-xl font-black text-gray-900">Thông tin chuyển khoản</h3>
                            </div>
                        </div>

                        {/* Amount */}
                        <div className="p-5 rounded-2xl mb-5 text-center"
                            style={{ background: 'linear-gradient(135deg, #eef2ff, #f5f3ff)' }}>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Số tiền cần cọc</p>
                            <p className="text-4xl font-black text-indigo-700">{fmt(contract.deposit_amount)}₫</p>
                            <p className="text-xs text-gray-500 font-bold mt-1">
                                Phòng {contract.room_number} — {contract.building_name}
                            </p>
                        </div>

                        {/* Bank info */}
                        <div className="space-y-3 mb-6">
                            {[
                                { label: 'Ngân hàng', value: 'Vietcombank (VCB)' },
                                { label: 'Số tài khoản', value: contract.landlord_phone || '1234567890', copy: true },
                                { label: 'Chủ tài khoản', value: contract.landlord_name || 'Chủ nhà' },
                                { label: 'Nội dung CK', value: `Coc hop dong ${contract.contract_id} - ${contract.room_number}`, copy: true },
                            ].map(({ label, value, copy }) => (
                                <div key={label} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
                                        <p className="font-black text-gray-900 text-sm">{value}</p>
                                    </div>
                                    {copy && (
                                        <button onClick={() => handleCopy(value)}
                                            className="p-2 hover:bg-indigo-50 rounded-xl transition-colors text-indigo-400 hover:text-indigo-600">
                                            <Copy size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-700 font-bold mb-5">
                            ⚠️ Vui lòng chuyển khoản đúng số tiền và nội dung. Sau khi chủ nhà xác nhận ký hợp đồng, tiền cọc sẽ được ghi nhận.
                        </div>

                        <button
                            onClick={() => { setShowPaymentModal(false); toast.success('Đã ghi nhận! Chờ chủ nhà xác nhận thanh toán.'); }}
                            className="w-full py-4 rounded-2xl font-black text-white text-sm uppercase tracking-wider transition-all hover:scale-[1.02] active:scale-95"
                            style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}>
                            <CheckCircle2 size={16} className="inline mr-2" />
                            Đã chuyển khoản xong
                        </button>
                    </div>
                </div>
        )}
    </div>
    );
};

export default TenantContractView;
