import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Zap,
    Camera,
    CheckCircle2,
    Image as ImageIcon,
    AlertCircle,
    Download,
    Shield,
    Phone,
    Calculator
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

    useEffect(() => {
        fetchBill();
    }, [id]);

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
            // We need to send two separate requests for electricity and water as per server API
            const electricData = new FormData();
            electricData.append('type', 'electricity');
            electricData.append('reading_value', readingUpdate.electric_reading);
            if (readingUpdate.proof_image) electricData.append('image', readingUpdate.proof_image);

            const waterData = new FormData();
            waterData.append('type', 'water');
            waterData.append('reading_value', readingUpdate.water_reading);
            // Re-using same image for both if present, or just one
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
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 text-center">
            <div className="glass p-8 rounded-3xl border-red-100 max-w-md">
                <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-black text-gray-900 mb-2">Đã xảy ra lỗi</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <button onClick={() => navigate('/tenant/bills')} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold">Quay lại</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen relative pb-20 overflow-x-hidden">
            {/* Background Decorative */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => navigate('/tenant/bills')}
                        className="p-3 hover:bg-white/80 glass rounded-2xl transition-all shadow-sm border-white/40 hover:scale-105 active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1 block">Chi tiết hóa đơn</span>
                        <h1 className="text-2xl font-black text-gray-900 leading-none">Tháng {bill.month}/{bill.year}</h1>
                    </div>
                    <div className="ml-auto">
                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-colors ${bill.status === 'paid' ? 'bg-green-100 text-green-700 border-green-200' :
                            bill.status === 'pending_payment' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                bill.status === 'pending_active' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                    bill.status === 'pending_tenant' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                        'bg-gray-100 text-gray-600 border-gray-200'
                            }`}>
                            {bill.status === 'paid' ? 'Đã Thanh Toán' :
                                bill.status === 'pending_payment' ? 'Chờ Thanh Toán' :
                                    bill.status === 'pending_tenant' ? 'Cần Chốt Số' :
                                        bill.status === 'pending_active' ? 'Chờ Xác Nhận' : 'Chưa Chốt'}
                        </span>
                    </div>
                </div>

                {/* 3-Step Process */}
                {bill.status === 'pending_tenant' && (
                    <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
                        <div className="glass p-8 rounded-[2.5rem] border-white/40 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-[100px]"></div>

                            <div className="flex justify-between items-start mb-10 relative z-10">
                                {[
                                    { n: 1, text: 'Kiểm tra số', icon: Zap },
                                    { n: 2, text: 'Minh chứng', icon: Camera },
                                    { n: 3, text: 'Xác nhận', icon: CheckCircle2 }
                                ].map((s, idx) => (
                                    <div key={idx} className="flex flex-col items-center gap-3 relative z-10">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-lg ${step >= s.n ? 'bg-indigo-600 text-white scale-110' : 'bg-white text-gray-400 border border-gray-100'
                                            }`}>
                                            <s.icon size={24} />
                                        </div>
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${step >= s.n ? 'text-indigo-600' : 'text-gray-400'}`}>
                                            {s.text}
                                        </span>
                                        {idx < 2 && (
                                            <div className={`absolute top-7 -right-1/2 w-full h-[2px] -z-10 ${step > idx + 1 ? 'bg-indigo-600' : 'bg-gray-100'}`}></div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <div className="animate-in fade-in zoom-in-95 duration-300">
                                {step === 1 && (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-white/50 p-6 rounded-3xl border border-white/60">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Số Điện Hiện Tại (kWh)</label>
                                                <input
                                                    type="number"
                                                    name="electric_reading"
                                                    value={readingUpdate.electric_reading}
                                                    onChange={handleReadingChange}
                                                    className="w-full bg-transparent text-3xl font-black text-gray-900 border-none focus:ring-0 p-0"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="bg-white/50 p-6 rounded-3xl border border-white/60">
                                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Số Nước Hiện Tại (m³)</label>
                                                <input
                                                    type="number"
                                                    name="water_reading"
                                                    value={readingUpdate.water_reading}
                                                    onChange={handleReadingChange}
                                                    className="w-full bg-transparent text-3xl font-black text-gray-900 border-none focus:ring-0 p-0"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setStep(2)}
                                            className="w-full py-5 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all hover:scale-[1.02] active:scale-95 shadow-xl"
                                        >
                                            Tiếp tục: Chụp ảnh minh chứng
                                        </button>
                                    </div>
                                )}

                                {step === 2 && (
                                    <div className="space-y-8">
                                        <div className="relative aspect-video rounded-[2rem] overflow-hidden border-2 border-dashed border-gray-200 hover:border-indigo-400 transition-colors group">
                                            {readingUpdate.proof_preview ? (
                                                <img src={readingUpdate.proof_preview} className="w-full h-full object-cover" alt="Proof" />
                                            ) : (
                                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                                    <ImageIcon size={48} className="mb-4 opacity-20" />
                                                    <p className="text-sm font-bold">Bấm để tải ảnh đồng hồ (Tùy chọn)</p>
                                                </div>
                                            )}
                                            <input
                                                type="file" accept="image/*"
                                                onChange={handleImageChange}
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                            />
                                        </div>
                                        <div className="flex gap-4">
                                            <button onClick={() => setStep(1)} className="flex-1 py-5 glass font-black uppercase tracking-widest rounded-2xl text-gray-600">Quay lại</button>
                                            <button onClick={submitReadings} disabled={isSubmitting} className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3">
                                                {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <CheckCircle2 size={20} />}
                                                Gửi xác nhận chốt số
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Bill Details */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-8 space-y-8">
                        <div className="glass rounded-[2.5rem] border-white/40 shadow-2xl relative overflow-hidden p-1 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10">
                            <div className="bg-white/90 backdrop-blur-xl rounded-[2.4rem] p-8 md:p-12">
                                <div className="flex justify-between items-start mb-12">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-indigo-600 rounded-lg"></div>
                                            <span className="text-xl font-black text-gray-900 tracking-tight">SmartProp Invoice</span>
                                        </div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mã hóa đơn: #BILL-{(bill.bill_id || bill.id || '').toString().padStart(6, '0')}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ngày lập</p>
                                        <p className="font-bold text-gray-900">{new Date(bill.created_at).toLocaleDateString('vi-VN')}</p>
                                    </div>
                                </div>

                                <div className="space-y-6 mb-12">
                                    <div className="grid grid-cols-12 pb-4 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        <div className="col-span-6">Dịch vụ & Chi tiết</div>
                                        <div className="col-span-3 text-right">Sử dụng</div>
                                        <div className="col-span-3 text-right">Thành tiền</div>
                                    </div>

                                    <div className="grid grid-cols-12 items-center py-2">
                                        <div className="col-span-6">
                                            <p className="font-black text-gray-900">Tiền thuê phòng</p>
                                            <p className="text-xs text-gray-500">Phòng {bill.room_number}, {bill.building_name}</p>
                                        </div>
                                        <div className="col-span-3 text-right text-sm font-bold text-gray-600">1 tháng</div>
                                        <div className="col-span-3 text-right font-black text-gray-900">{new Intl.NumberFormat('vi-VN').format(bill.rent_price)}₫</div>
                                    </div>

                                    <div className="grid grid-cols-12 items-center py-2">
                                        <div className="col-span-6">
                                            <p className="font-black text-gray-900">Tiền điện</p>
                                            <p className="text-xs text-gray-500">Chỉ số: {bill.old_electric} → {bill.electric_reading || '?'}</p>
                                        </div>
                                        <div className="col-span-3 text-right text-sm font-bold text-gray-600">{bill.electric_reading ? (bill.electric_reading - bill.old_electric) : 0} kWh</div>
                                        <div className="col-span-3 text-right font-black text-gray-900">{new Intl.NumberFormat('vi-VN').format(bill.electric_cost)}₫</div>
                                    </div>

                                    <div className="grid grid-cols-12 items-center py-2">
                                        <div className="col-span-6">
                                            <p className="font-black text-gray-900">Tiền nước</p>
                                            <p className="text-xs text-gray-500">Chỉ số: {bill.old_water} → {bill.water_reading || '?'}</p>
                                        </div>
                                        <div className="col-span-3 text-right text-sm font-bold text-gray-600">{bill.water_reading ? (bill.water_reading - bill.old_water) : 0} m³</div>
                                        <div className="col-span-3 text-right font-black text-gray-900">{new Intl.NumberFormat('vi-VN').format(bill.water_cost)}₫</div>
                                    </div>

                                    <div className="grid grid-cols-12 items-center py-2">
                                        <div className="col-span-6">
                                            <p className="font-black text-gray-900">Phí dịch vụ cố định</p>
                                            <p className="text-xs text-gray-500">Rác, vệ sinh, bảo vệ...</p>
                                        </div>
                                        <div className="col-span-3 text-right text-sm font-bold text-gray-600">-</div>
                                        <div className="col-span-3 text-right font-black text-gray-900">{new Intl.NumberFormat('vi-VN').format(bill.service_price)}₫</div>
                                    </div>
                                </div>

                                <div className="bg-indigo-600 rounded-3xl p-8 flex justify-between items-center text-white shadow-xl shadow-indigo-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                                    <div>
                                        <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">Tổng cộng (VNĐ)</p>
                                        <p className="text-3xl font-black">{new Intl.NumberFormat('vi-VN').format(bill.total_amount)}₫</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">Trạng thái</p>
                                        <p className="font-black text-xl italic">{bill.status === 'paid' ? 'SUCCESS' : 'PENDING'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {bill.proof_image && (
                            <div className="glass p-8 rounded-[2rem] border-white/40 shadow-lg text-center">
                                <h2 className="text-lg font-black text-gray-900 mb-6 flex items-center justify-center gap-3">
                                    <Camera size={20} className="text-indigo-600" />
                                    Minh chứng chỉ số
                                </h2>
                                <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm inline-block max-w-sm">
                                    <img src={bill.proof_image} alt="Meter Proof" className="w-full h-auto" />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="lg:col-span-4 space-y-6">
                        {bill.status === 'pending_payment' && (
                            <div className="glass p-8 rounded-[2rem] border-white/40 shadow-2xl space-y-8 animate-in slide-in-from-right-10 duration-500">
                                <div className="text-center">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3">Quét mã thanh toán</p>
                                    <div className="w-56 h-56 mx-auto bg-white p-4 rounded-3xl shadow-xl border border-gray-100 relative group">
                                        <img
                                            src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`MB|0345678999999|${bill.total_amount}|BILL${bill.bill_id || bill.id}`)}`}
                                            className="w-full h-full grayscale group-hover:grayscale-0 transition-all duration-700"
                                            alt="QR Payment"
                                        />
                                        <div className="absolute inset-0 border-4 border-indigo-600/10 rounded-3xl pointer-events-none group-hover:scale-110 transition-transform"></div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="bg-white/50 p-4 rounded-2xl border border-white/60">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ngân hàng</p>
                                        <p className="font-bold text-gray-800">MB Bank (Quân Đội)</p>
                                    </div>
                                    <div className="bg-white/50 p-4 rounded-2xl border border-white/60">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Số tài khoản</p>
                                        <p className="font-bold text-gray-800">0345 678 999 999</p>
                                    </div>
                                    <div className="bg-white/50 p-4 rounded-2xl border border-white/60">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nội dung CK</p>
                                        <p className="font-bold text-indigo-600 uppercase">#BILL-{bill.bill_id || bill.id} {bill.tenant_name}</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={isSubmitting}
                                    className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {isSubmitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <CheckCircle2 size={20} />}
                                    Xác nhận đã chuyển khoản
                                </button>
                            </div>
                        )}

                        {bill.status === 'paid' && (
                            <div className="glass p-8 rounded-[2rem] border-white/40 shadow-2xl text-center space-y-6">
                                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-green-50 mb-2 animate-bounce-slow">
                                    <CheckCircle2 size={40} />
                                </div>
                                <h3 className="text-xl font-black text-gray-900">Đã thanh toán!</h3>
                                <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2 group">
                                    <Download size={18} /> Tải hóa đơn (PDF)
                                </button>
                            </div>
                        )}

                        <div className="glass p-8 rounded-[2rem] border-white/40 shadow-lg space-y-6">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Shield size={16} className="text-green-500" /> Hỗ trợ bảo mật
                            </h3>
                            <div className="flex items-center gap-4 p-4 bg-white/40 rounded-2xl border border-white/50">
                                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                                    <Phone size={18} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hotline chủ nhà</p>
                                    <p className="text-sm font-bold text-gray-800">{bill.landlord_phone || '090 XXX XXXX'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TenantBillDetail;
