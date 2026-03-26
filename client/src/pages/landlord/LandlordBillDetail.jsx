import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FileText, Calendar, DollarSign, ArrowLeft,
    CheckCircle2, XCircle, AlertCircle, Image as ImageIcon,
    ExternalLink, CreditCard
} from 'lucide-react';
import api from '../../services/api';

const LandlordBillDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [bill, setBill] = useState(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchBillDetail();
    }, [id]);

    const fetchBillDetail = async () => {
        try {
            const res = await api.get(`/bills/${id}`);
            setBill(res.data);
        } catch (error) {
            console.error('Error fetching bill:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmBill = async () => {
        if (!window.confirm('Bạn có chắc muốn xác nhận hóa đơn này?')) return;
        setProcessing(true);
        try {
            await api.put(`/bills/${id}/confirm`);
            alert('Đã xác nhận hóa đơn thành công!');
            fetchBillDetail();
        } catch (error) {
            console.error('Error confirming bill:', error);
            alert(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setProcessing(false);
        }
    };

    const handleApprovePayment = async () => {
        if (!window.confirm('Xác nhận thông tin chuyển khoản chính xác?')) return;
        setProcessing(true);
        try {
            await api.put(`/bills/${id}/approve-payment`);
            alert('Đã xác nhận thanh toán thành công!');
            fetchBillDetail();
        } catch (error) {
            console.error('Error approving payment:', error);
            alert(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setProcessing(false);
        }
    };

    const handleMarkAsPaid = async () => {
        if (!window.confirm('Xác nhận đã nhận được tiền thanh toán?')) return;
        setProcessing(true);
        try {
            await api.put(`/bills/${id}/mark-paid`, {
                payment_method: 'cash',
                payment_note: 'Chủ nhà xác nhận thủ công'
            });
            alert('Đã đánh dấu đã thanh toán!');
            fetchBillDetail();
        } catch (error) {
            console.error('Error marking as paid:', error);
            alert(error.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!bill) return <div>Không tìm thấy hóa đơn</div>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'overdue': return 'bg-red-100 text-red-700';
            case 'confirmed': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="max-w-4xl mx-auto pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button
                    onClick={() => navigate('/landlord/bills')}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Chi tiết hóa đơn #{bill.bill_id}</h1>
                    <p className="text-gray-500">Phòng {bill.room_number} - {bill.tenant_name}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Status Banner */}
                    <div className={`rounded-2xl p-6 ${getStatusColor(bill.status)} bg-opacity-10 border border-opacity-20`}>
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-bold uppercase tracking-wide">
                                {bill.status === 'paid' ? 'Đã hoàn tất thanh toán' :
                                    bill.status === 'pending_approval' ? 'Chờ xác nhận thanh toán' :
                                        bill.status === 'confirmed' ? 'Chờ thanh toán' :
                                            bill.status === 'overdue' ? 'Đã quá hạn thanh toán' : 'Đang dự thảo'}
                            </h3>
                        </div>
                        <p className="opacity-80">
                            Hạn thanh toán: {new Date(bill.due_date).toLocaleDateString('vi-VN')}
                        </p>
                    </div>

                    {/* Meter Images */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <ImageIcon size={20} className="text-indigo-600" />
                            Hình ảnh chỉ số điện nước
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm font-bold text-gray-500 mb-2">Điện (Chỉ số: {bill.electricity_new})</p>
                                {bill.electricity_image_url ? (
                                    <div className="relative group rounded-xl overflow-hidden border border-gray-200">
                                        <img src={bill.electricity_image_url} alt="Electricity" className="w-full h-48 object-cover" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a href={bill.electricity_image_url} target="_blank" rel="noreferrer" className="text-white flex items-center gap-2 font-bold hover:underline">
                                                <ExternalLink size={16} /> Xem ảnh gốc
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-48 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm">Chưa có ảnh</div>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-500 mb-2">Nước (Chỉ số: {bill.water_new})</p>
                                {bill.water_image_url ? (
                                    <div className="relative group rounded-xl overflow-hidden border border-gray-200">
                                        <img src={bill.water_image_url} alt="Water" className="w-full h-48 object-cover" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a href={bill.water_image_url} target="_blank" rel="noreferrer" className="text-white flex items-center gap-2 font-bold hover:underline">
                                                <ExternalLink size={16} /> Xem ảnh gốc
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-48 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 text-sm">Chưa có ảnh</div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Payment Proof */}
                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CreditCard size={20} className="text-indigo-600" />
                            Thông tin thanh toán
                        </h3>
                        {bill.payment_proof_url ? (
                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-xl">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-gray-500">Người gửi:</p>
                                            <p className="font-bold">{bill.tenant_name}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-500">Mã giao dịch:</p>
                                            <p className="font-bold">{bill.transaction_ref || 'N/A'}</p>
                                        </div>
                                        <div className="col-span-2">
                                            <p className="text-gray-500">Ghi chú:</p>
                                            <p className="font-medium">{bill.payment_note || 'Không có'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-sm font-bold text-gray-500 mb-2">Ảnh bằng chứng chuyển khoản:</p>
                                    <div className="relative group rounded-xl overflow-hidden border border-gray-200 max-w-sm">
                                        <img src={bill.payment_proof_url} alt="Payment Proof" className="w-full h-auto object-cover" />
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <a href={bill.payment_proof_url} target="_blank" rel="noreferrer" className="text-white flex items-center gap-2 font-bold hover:underline">
                                                <ExternalLink size={16} /> Xem ảnh gốc
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <AlertCircle className="w-8 h-8 mb-2" />
                                <p>Chưa có thông tin thanh toán từ người thuê</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Summary & Actions */}
                <div className="space-y-6">
                    <div className="bg-white rounded-2xl p-6 shadow-lg border border-indigo-100 sticky top-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Tổng cộng</h3>

                        <div className="space-y-3 mb-6">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Tiền phòng</span>
                                <span className="font-medium">{bill.room_rent?.toLocaleString('vi-VN')} ₫</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Điện ({bill.electricity_consumption} kWh)</span>
                                <span className="font-medium">{bill.electricity_cost?.toLocaleString('vi-VN')} ₫</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Nước ({bill.water_consumption} m³)</span>
                                <span className="font-medium">{bill.water_cost?.toLocaleString('vi-VN')} ₫</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Dịch vụ</span>
                                <span className="font-medium">{bill.service_cost?.toLocaleString('vi-VN')} ₫</span>
                            </div>
                            <div className="h-px bg-gray-100 my-2"></div>
                            <div className="flex justify-between items-end">
                                <span className="font-bold text-gray-900">Tổng thanh toán</span>
                                <span className="text-2xl font-black text-indigo-600">
                                    {bill.total_amount?.toLocaleString('vi-VN')} ₫
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {bill.status === 'confirmed' && (
                                <button
                                    onClick={handleMarkAsPaid}
                                    disabled={processing}
                                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {processing ? 'Đang xử lý...' : (
                                        <>
                                            <CheckCircle2 size={18} /> Xác nhận đã nhận tiền
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Confirmation is usually handled automatically when tenant pays, but can be forced */}
                            {bill.status === 'pending_approval' && (
                                <button
                                    onClick={handleApprovePayment}
                                    disabled={processing}
                                    className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl shadow-lg shadow-green-200 transition-all flex items-center justify-center gap-2"
                                >
                                    {processing ? 'Đang xử lý...' : (
                                        <>
                                            <CheckCircle2 size={18} /> Xác nhận đã nhận tiền
                                        </>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandlordBillDetail;
