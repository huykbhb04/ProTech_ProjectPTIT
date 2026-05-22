import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Zap,
    Camera,
    CircleCheck,
    Image as ImageIcon,
    CircleAlert,
    Download,
    Shield,
    Phone,
    Loader
} from 'lucide-react';
import billService from '../../services/billService';
import { toast } from 'react-hot-toast';

const TenantBillDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [step, setStep] = useState(1);
    const [readingUpdate, setReadingUpdate] = useState({
        electric_reading: 0,
        water_reading: 0,
        proof_image: null,
        proof_preview: null
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => { fetchBill(); }, [id]);

    const fetchBill = async () => {
        try {
            setLoading(true);
            const data = await billService.getBillDetail(id);
            setBill(data);
            setReadingUpdate(prev => ({
                ...prev,
                electric_reading: data.electric_reading || 0,
                water_reading: data.water_reading || 0,
                proof_preview: data.proof_image || null
            }));
            if (data.status === 'pending_tenant') setStep(1);
            else setStep(3);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleReadingChange = (e) => {
        const { name, value } = e.target;
        setReadingUpdate(prev => ({ ...prev, [name]: Number(value) }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setReadingUpdate(prev => ({
                ...prev,
                proof_image: file,
                proof_preview: URL.createObjectURL(file)
            }));
        }
    };

    const submitReadings = async () => {
        try {
            setIsSubmitting(true);
            const electricData = new FormData();
            electricData.append('type', 'electricity');
            electricData.append('reading_value', readingUpdate.electric_reading);
            if (readingUpdate.proof_image) electricData.append('image', readingUpdate.proof_image);

            const waterData = new FormData();
            waterData.append('type', 'water');
            waterData.append('reading_value', readingUpdate.water_reading);
            if (readingUpdate.proof_image) waterData.append('image', readingUpdate.proof_image);

            await Promise.all([
                billService.tenantConfirmBill(id, electricData),
                billService.tenantConfirmBill(id, waterData)
            ]);
            toast.success('Đã gửi số điện nước thành công!');
            fetchBill();
            setStep(3);
        } catch (err) {
            toast.error(err.message || 'Lỗi khi gửi số điện nước');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePayment = async () => {
        try {
            setIsSubmitting(true);
            await billService.tenantPayBill(id);
            toast.success('Đã xác nhận thanh toán. Vui lòng chờ chủ nhà phê duyệt.');
            fetchBill();
        } catch (err) {
            toast.error(err.message || 'Lỗi thanh toán');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <Loader size={24} className="animate-spin text-gray-300" />
        </div>
    );

    if (error) return (
        <div className="flex items-center justify-center min-h-[400px] flex-col gap-4">
            <CircleAlert size={40} className="text-red-400" />
            <p className="font-bold text-gray-600">{error}</p>
            <button onClick={() => navigate('/tenant/bills')} className="btn-primary">Quay lại</button>
        </div>
    );

    const getStatusBadge = (status) => {
        if (status === 'paid') return 'badge-success';
        if (status === 'pending_payment') return 'badge-warning';
        if (status === 'pending_tenant' || status === 'pending_active') return 'badge-info';
        return 'badge-muted';
    };

    const getStatusLabel = (status) => {
        if (status === 'paid') return 'Đã Thanh Toán';
        if (status === 'pending_payment') return 'Chờ Thanh Toán';
        if (status === 'pending_tenant') return 'Cần Chốt Số';
        if (status === 'pending_active') return 'Chờ Xác Nhận';
        return 'Chưa Chốt';
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in-up">

            {/* ── Header ── */}
            <div className="section-divider flex items-end justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/tenant/bills')} className="btn-ghost px-3 py-3">
                        <ArrowLeft size={16} />
                    </button>
                    <div>
                        <p className="section-label mb-1">Chi tiết hóa đơn</p>
                        <h1 className="page-title">Tháng {bill.month}/{bill.year}</h1>
                    </div>
                </div>
                <span className={`badge ${getStatusBadge(bill.status)}`}>{getStatusLabel(bill.status)}</span>
            </div>

            {/* ── 3-Step: Chốt số (chỉ hiện khi pending_tenant) ── */}
            {bill.status === 'pending_tenant' && (
                <div className="card-base p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[100px]" />

                    {/* Step indicators */}
                    <div className="flex justify-between items-start mb-10 relative z-10">
                        {[
                            { n: 1, text: 'Kiểm tra số', icon: Zap },
                            { n: 2, text: 'Minh chứng', icon: Camera },
                            { n: 3, text: 'Xác nhận', icon: CheckCircle }
                        ].map((s, idx) => (
                            <div key={idx} className="flex flex-col items-center gap-3 relative z-10">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${step >= s.n ? 'bg-black text-white' : 'bg-gray-50 text-gray-400 border border-gray-100'}`}>
                                    <s.icon size={24} />
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s.n ? 'text-black' : 'text-gray-400'}`}>
                                    {s.text}
                                </span>
                                {idx < 2 && (
                                    <div className={`absolute top-7 -right-1/2 w-full h-[2px] -z-10 ${step > idx + 1 ? 'bg-black' : 'bg-gray-100'}`} />
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Step content */}
                    {step === 1 && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="card-base p-6">
                                    <label className="section-label mb-3 block">Số Điện Hiện Tại (kWh)</label>
                                    <input type="number" name="electric_reading"
                                        value={readingUpdate.electric_reading} onChange={handleReadingChange}
                                        className="w-full bg-transparent text-3xl font-black text-black border-none focus:ring-0 p-0"
                                        placeholder="0" />
                                </div>
                                <div className="card-base p-6">
                                    <label className="section-label mb-3 block">Số Nước Hiện Tại (m³)</label>
                                    <input type="number" name="water_reading"
                                        value={readingUpdate.water_reading} onChange={handleReadingChange}
                                        className="w-full bg-transparent text-3xl font-black text-black border-none focus:ring-0 p-0"
                                        placeholder="0" />
                                </div>
                            </div>
                            <button onClick={() => setStep(2)}
                                className="btn-primary w-full justify-center py-4">
                                Tiếp tục: Chụp ảnh minh chứng
                            </button>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6">
                            <div className="relative aspect-video overflow-hidden border-2 border-dashed border-gray-200 hover:border-black transition-colors group">
                                {readingUpdate.proof_preview ? (
                                    <img src={readingUpdate.proof_preview} className="w-full h-full object-cover" alt="Proof" />
                                ) : (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                        <ImageIcon size={48} className="mb-4 opacity-20" />
                                        <p className="text-sm font-bold">Bấm để tải ảnh đồng hồ (Tùy chọn)</p>
                                    </div>
                                )}
                                <input type="file" accept="image/*" onChange={handleImageChange}
                                    className="absolute inset-0 opacity-0 cursor-pointer" />
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => setStep(1)} className="btn-ghost flex-1 justify-center py-4">Quay lại</button>
                                <button onClick={submitReadings} disabled={isSubmitting}
                                    className="btn-primary flex-[2] justify-center py-4">
                                    {isSubmitting ? <Loader size={16} className="animate-spin" /> : <CircleCheck size={16} />}
                                    Gửi xác nhận chốt số
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Bill Details Grid ── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

                {/* Left: Invoice */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="card-base p-8 md:p-12">
                        {/* Invoice Header */}
                        <div className="flex justify-between items-start mb-10">
                            <div className="space-y-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-6 h-6 bg-black" />
                                    <span className="text-lg font-black text-black tracking-tight">SmartProp Invoice</span>
                                </div>
                                <p className="section-label">Mã hóa đơn: #BILL-{(bill.bill_id || bill.id || '').toString().padStart(6, '0')}</p>
                            </div>
                            <div className="text-right">
                                <p className="section-label mb-1">Ngày lập</p>
                                <p className="font-bold text-black">{new Date(bill.created_at).toLocaleDateString('vi-VN')}</p>
                            </div>
                        </div>

                        {/* Line Items */}
                        <div className="space-y-3 mb-10">
                            <div className="grid grid-cols-12 pb-3 border-b border-gray-100">
                                <div className="col-span-6 table-header">Dịch vụ & Chi tiết</div>
                                <div className="col-span-3 table-header text-right">Sử dụng</div>
                                <div className="col-span-3 table-header text-right">Thành tiền</div>
                            </div>
                            {[
                                { name: 'Tiền thuê phòng', sub: `Phòng ${bill.room_number}, ${bill.building_name}`, usage: '1 tháng', amount: bill.rent_price },
                                { name: 'Tiền điện', sub: `Chỉ số: ${bill.old_electric} → ${bill.electric_reading || '?'}`, usage: `${bill.electric_reading ? (bill.electric_reading - bill.old_electric) : 0} kWh`, amount: bill.electric_cost },
                                { name: 'Tiền nước', sub: `Chỉ số: ${bill.old_water} → ${bill.water_reading || '?'}`, usage: `${bill.water_reading ? (bill.water_reading - bill.old_water) : 0} m³`, amount: bill.water_cost },
                                { name: 'Phí dịch vụ cố định', sub: 'Rác, vệ sinh, bảo vệ...', usage: '-', amount: bill.service_price }
                            ].map((item, i) => (
                                <div key={i} className="grid grid-cols-12 items-center py-3 border-b border-gray-50">
                                    <div className="col-span-6">
                                        <p className="font-bold text-black text-sm">{item.name}</p>
                                        <p className="meta-text">{item.sub}</p>
                                    </div>
                                    <div className="col-span-3 text-right text-sm font-medium text-gray-500">{item.usage}</div>
                                    <div className="col-span-3 text-right font-black text-black">{new Intl.NumberFormat('vi-VN').format(item.amount)}₫</div>
                                </div>
                            ))}
                        </div>

                        {/* Total */}
                        <div className="bg-black text-white p-6 flex justify-between items-center">
                            <div>
                                <p className="section-label text-white/40 mb-1">Tổng cộng (VNĐ)</p>
                                <p className="text-2xl font-black">{new Intl.NumberFormat('vi-VN').format(bill.total_amount)}₫</p>
                            </div>
                            <div className="text-right">
                                <p className="section-label text-white/40 mb-1">Trạng thái</p>
                                <p className="font-black uppercase">{bill.status === 'paid' ? 'SUCCESS' : 'PENDING'}</p>
                            </div>
                        </div>
                    </div>

                    {bill.proof_image && (
                        <div className="card-base p-6 text-center">
                            <h2 className="text-sm font-black text-black mb-4 flex items-center justify-center gap-2">
                                <Camera size={16} /> Minh chứng chỉ số
                            </h2>
                            <div className="overflow-hidden border border-gray-100 inline-block max-w-sm">
                                <img src={bill.proof_image} alt="Meter Proof" className="w-full h-auto" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right: Payment sidebar */}
                <div className="lg:col-span-4 space-y-4">
                    {bill.status === 'pending_payment' && (
                        <div className="card-base p-8 space-y-6">
                            <div className="text-center">
                                <p className="section-label mb-3">Quét mã thanh toán</p>
                                <div className="w-48 h-48 mx-auto bg-white p-3 border border-gray-100 inline-block">
                                    <img
                                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`MB|0345678999999|${bill.total_amount}|BILL${bill.bill_id || bill.id}`)}`}
                                        className="w-full h-full"
                                        alt="QR Payment"
                                    />
                                </div>
                            </div>
                            <div className="space-y-3">
                                {[
                                    { label: 'Ngân hàng', value: 'MB Bank (Quân Đội)' },
                                    { label: 'Số tài khoản', value: '0345 678 999 999' },
                                    { label: 'Nội dung CK', value: `#BILL-${bill.bill_id || bill.id} ${bill.tenant_name}` }
                                ].map(item => (
                                    <div key={item.label} className="p-3 bg-gray-50 border border-gray-100">
                                        <p className="section-label mb-0.5">{item.label}</p>
                                        <p className="font-bold text-black text-sm">{item.value}</p>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handlePayment} disabled={isSubmitting}
                                className="btn-primary w-full justify-center py-4">
                                {isSubmitting ? <Loader size={14} className="animate-spin" /> : <CircleCheck size={14} />}
                                Xác nhận đã chuyển khoản
                            </button>
                        </div>
                    )}

                    {bill.status === 'paid' && (
                        <div className="card-base p-8 text-center space-y-4">
                            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                                <CircleCheck size={32} />
                            </div>
                            <h3 className="font-black text-black">Đã thanh toán!</h3>
                            <button className="btn-primary w-full justify-center">
                                <Download size={14} /> Tải hóa đơn (PDF)
                            </button>
                        </div>
                    )}

                    {/* Support */}
                    <div className="card-base p-6 space-y-4">
                        <h3 className="section-label flex items-center gap-2">
                            <Shield size={14} className="text-emerald-500" /> Hỗ trợ bảo mật
                        </h3>
                        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-100">
                            <div className="p-2 bg-black text-white">
                                <Phone size={14} />
                            </div>
                            <div>
                                <p className="section-label mb-0.5">Hotline chủ nhà</p>
                                <p className="font-bold text-black text-sm">{bill.landlord_phone || '090 XXX XXXX'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TenantBillDetail;
