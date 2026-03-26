import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Phone, CheckCircle2, XCircle, ChevronRight, Info, Building2, Search, Filter, Mail, ArrowUpRight } from 'lucide-react';
import bookingService from '../../services/bookingService';

const BookingManagement = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [confirmModal, setConfirmModal] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [leadInfo, setLeadInfo] = useState({
        leadPersonName: '',
        leadPersonPhone: '',
        landlordNotes: ''
    });

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const data = await bookingService.getLandlordBookings();
            setBookings(data);
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (e) => {
        e.preventDefault();
        try {
            await bookingService.confirmBooking(confirmModal.booking_id, leadInfo);
            setConfirmModal(null);
            fetchBookings();
            // Using a more subtle notification would be better, but keeping alert for reliability
            alert("Đã xác nhận lịch xem phòng thành công!");
        } catch (error) {
            alert("Lỗi khi xác nhận: " + (error.response?.data?.message || error.message));
        }
    };

    const handleReject = async (id) => {
        if (window.confirm("Bạn có chắc muốn từ chối lịch hẹn này? Thông báo sẽ được gửi tới người thuê.")) {
            try {
                await bookingService.rejectBooking(id);
                fetchBookings();
            } catch (error) {
                alert("Lỗi khi từ chối: " + error.message);
            }
        }
    };

    const filteredBookings = bookings.filter(b => {
        const matchesSearch = b.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.building_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.room_number.toString().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length
    };

    const getStatusVariant = (status) => {
        switch (status) {
            case 'confirmed': return { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-50', border: 'border-green-100' };
            case 'rejected': return { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-50', border: 'border-red-100' };
            default: return { bg: 'bg-amber-500', text: 'text-amber-500', light: 'bg-amber-50', border: 'border-amber-100' };
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[500px]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Đang tải dữ liệu...</p>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto space-y-10 pb-20">
            {/* Professional Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tight italic">Quản lý lịch hẹn</h2>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1 ml-1">Hệ thống điều phối dẫn khách xem phòng tập trung</p>
                </div>

                <div className="flex items-center gap-4 w-full lg:w-auto">
                    <div className="grid grid-cols-3 gap-2 bg-white px-4 py-2 rounded-[2rem] border border-gray-100 shadow-sm">
                        <div className="flex flex-col items-center px-4 border-r border-gray-50">
                            <span className="text-lg font-black text-gray-900">{stats.total}</span>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Yêu cầu</span>
                        </div>
                        <div className="flex flex-col items-center px-4 border-r border-gray-50">
                            <span className="text-lg font-black text-amber-500">{stats.pending}</span>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Chờ duyệt</span>
                        </div>
                        <div className="flex flex-col items-center px-4">
                            <span className="text-lg font-black text-green-500">{stats.confirmed}</span>
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Đã chốt</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm theo tên khách, phòng, tòa nhà..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-gray-50 border-transparent rounded-[1.8rem] text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all"
                    />
                </div>
                <div className="flex bg-gray-50 p-1.5 rounded-[1.8rem] border border-gray-50 shrink-0">
                    {[
                        { id: 'all', label: 'Tất cả' },
                        { id: 'pending', label: 'Chờ duyệt' },
                        { id: 'confirmed', label: 'Đã xác nhận' },
                        { id: 'rejected', label: 'Đã từ chối' }
                    ].map(f => (
                        <button
                            key={f.id}
                            onClick={() => setStatusFilter(f.id)}
                            className={`px-6 py-2.5 rounded-[1.5rem] text-[11px] font-black uppercase tracking-wider transition-all ${statusFilter === f.id ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            {f.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Booking Grid/Table */}
            <div className="grid grid-cols-1 gap-1">
                {/* Desktop Header Row */}
                <div className="hidden lg:grid grid-cols-12 gap-6 px-10 py-4 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                    <div className="col-span-3">Thông tin tòa nhà & Phòng</div>
                    <div className="col-span-3">Người thuê</div>
                    <div className="col-span-2">Thời gian hẹn</div>
                    <div className="col-span-2">Trạng thái</div>
                    <div className="col-span-2 text-right">Hành động</div>
                </div>

                {filteredBookings.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-32 text-center border-2 border-dashed border-gray-100 mt-4">
                        <Calendar size={64} className="mx-auto text-gray-200 mb-6" />
                        <h3 className="text-2xl font-black text-gray-900 italic">Mọi thứ đều yên tĩnh!</h3>
                        <p className="text-sm font-bold text-gray-400 mt-3 max-w-xs mx-auto">Hiện không có yêu cầu nào khớp với bộ lọc của bạn.</p>
                    </div>
                ) : (
                    filteredBookings.map((booking) => {
                        const variant = getStatusVariant(booking.status);
                        return (
                            <div key={booking.booking_id} className="bg-white rounded-[2.5rem] p-6 lg:px-10 border border-gray-100 shadow-sm hover:shadow-2xl hover:shadow-indigo-100/30 hover:-translate-y-0.5 transition-all group/card mb-4 lg:mb-1">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                                    {/* Property Column */}
                                    <div className="lg:col-span-3 flex items-center gap-4">
                                        <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover/card:bg-indigo-600 group-hover/card:text-white transition-all overflow-hidden relative border border-indigo-100">
                                            <Building2 size={24} />
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-900 group-hover/card:text-indigo-600 transition-colors">Phòng {booking.room_number}</div>
                                            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-tight">{booking.building_name}</div>
                                        </div>
                                    </div>

                                    {/* Tenant Column */}
                                    <div className="lg:col-span-3 flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                                            <img src={`https://ui-avatars.com/api/?name=${booking.tenant_name}&background=random&color=fff&bold=true`} alt="" />
                                        </div>
                                        <div>
                                            <div className="font-black text-gray-900 text-sm">{booking.tenant_name}</div>
                                            <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                                                <Phone size={10} className="text-indigo-600" />
                                                {booking.tenant_phone}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Time Column */}
                                    <div className="lg:col-span-2">
                                        <div className="flex items-center gap-2 text-sm font-black text-gray-800">
                                            <Calendar size={14} className="text-indigo-400" />
                                            {new Date(booking.booking_date).toLocaleDateString('vi-VN')}
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-1">
                                            <Clock size={12} />
                                            {booking.booking_time.substring(0, 5)}
                                        </div>
                                    </div>

                                    {/* Status Column */}
                                    <div className="lg:col-span-2">
                                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[10px] font-black uppercase tracking-wider ${variant.light} ${variant.text} ${variant.border}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${variant.bg}`}></div>
                                            {booking.status === 'pending' ? 'Chờ duyệt' :
                                                booking.status === 'confirmed' ? 'Đã chốt' :
                                                    booking.status === 'rejected' ? 'Bị từ chối' : 'Đã hủy'}
                                        </div>
                                    </div>

                                    {/* Actions Column */}
                                    <div className="lg:col-span-2 flex justify-end gap-2">
                                        {booking.status === 'pending' ? (
                                            <>
                                                <button
                                                    onClick={() => handleReject(booking.booking_id)}
                                                    className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                                                    title="Từ chối"
                                                >
                                                    <XCircle size={22} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setConfirmModal(booking);
                                                        setLeadInfo({
                                                            leadPersonName: 'Chính chủ',
                                                            leadPersonPhone: '',
                                                            landlordNotes: ''
                                                        });
                                                    }}
                                                    className="px-6 py-3 bg-indigo-600 text-white rounded-[1.2rem] text-xs font-black shadow-lg shadow-indigo-100 hover:bg-gray-900 hover:-translate-y-1 transition-all flex items-center gap-2"
                                                >
                                                    Phê duyệt <ArrowUpRight size={14} />
                                                </button>
                                            </>
                                        ) : (
                                            <button
                                                onClick={() => {
                                                    // Add logic to view detail modal if needed
                                                    alert(`Thông tin dẫn khách:\nNgười dẫn: ${booking.lead_person_name}\nSĐT: ${booking.lead_person_phone}`);
                                                }}
                                                className="flex items-center gap-2 text-[11px] font-black text-gray-400 hover:text-indigo-600 transition-colors uppercase tracking-widest"
                                            >
                                                Chi tiết <ChevronRight size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Premium Confirm Modal */}
            {confirmModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.2)] flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
                        {/* Side Banner */}
                        <div className="w-full md:w-64 bg-indigo-600 p-10 flex flex-col justify-between text-white relative overflow-hidden">
                            <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
                            <div className="relative z-10">
                                <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-8">Xác nhận lịch</div>
                                <h3 className="text-3xl font-black italic leading-tight">Sắp xếp dẫn khách</h3>
                                <p className="text-xs font-bold text-indigo-100 mt-4 leading-relaxed opacity-80">Phòng {confirmModal.room_number} <br /> {confirmModal.building_name}</p>
                            </div>
                            <div className="relative z-10 space-y-4">
                                <div className="flex items-center gap-4 p-4 bg-white/10 backdrop-blur rounded-2xl border border-white/10">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border border-white/20">
                                        <img src={`https://ui-avatars.com/api/?name=${confirmModal.tenant_name}&background=fff&color=4f46e5&bold=true`} alt="" />
                                    </div>
                                    <div>
                                        <div className="text-[9px] font-black uppercase tracking-widest opacity-60">Khách thuê</div>
                                        <div className="text-sm font-black">{confirmModal.tenant_name}</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Form Area */}
                        <div className="flex-1 p-10 bg-white overflow-y-auto max-h-[90vh]">
                            <div className="flex justify-between items-center mb-8">
                                <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">Cấu hình người dẫn xem</div>
                                <button onClick={() => setConfirmModal(null)} className="text-gray-300 hover:text-red-500 transition-colors">
                                    <XCircle size={24} />
                                </button>
                            </div>

                            <form onSubmit={handleConfirm} className="space-y-8">
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: 'Chính chủ', icon: User, label: 'Chính chủ', desc: 'Bạn dẫn khách' },
                                        { id: 'staff', icon: Mail, label: 'Nhân viên', desc: 'Chỉ định người khác' }
                                    ].map(opt => (
                                        <div
                                            key={opt.id}
                                            onClick={() => setLeadInfo({ ...leadInfo, leadPersonName: opt.id === 'Chính chủ' ? 'Chính chủ' : '' })}
                                            className={`p-5 rounded-[2rem] border-2 transition-all cursor-pointer group ${(opt.id === 'Chính chủ' && leadInfo.leadPersonName === 'Chính chủ') ||
                                                    (opt.id === 'staff' && leadInfo.leadPersonName !== 'Chính chủ')
                                                    ? 'border-indigo-600 bg-indigo-50/30' : 'border-gray-100 hover:border-indigo-100'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <opt.icon className={`${(opt.id === 'Chính chủ' && leadInfo.leadPersonName === 'Chính chủ') || (opt.id === 'staff' && leadInfo.leadPersonName !== 'Chính chủ') ? 'text-indigo-600' : 'text-gray-400'}`} size={24} />
                                                <div className={`w-5 h-5 rounded-full border-4 flex items-center justify-center ${(opt.id === 'Chính chủ' && leadInfo.leadPersonName === 'Chính chủ') ||
                                                        (opt.id === 'staff' && leadInfo.leadPersonName !== 'Chính chủ')
                                                        ? 'border-indigo-600 bg-indigo-600 ring-4 ring-white' : 'border-gray-200'
                                                    }`}>
                                                    <CheckCircle2 size={10} className="text-white" />
                                                </div>
                                            </div>
                                            <div className="text-sm font-black text-gray-900">{opt.label}</div>
                                            <div className="text-[10px] font-bold text-gray-500 mt-1">{opt.desc}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Họ tên người dẫn</label>
                                        <input
                                            type="text"
                                            required
                                            value={leadInfo.leadPersonName}
                                            onChange={(e) => setLeadInfo({ ...leadInfo, leadPersonName: e.target.value })}
                                            className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] text-sm font-black focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all"
                                            placeholder="Tên người dẫn"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Số điện thoại liên hệ</label>
                                        <input
                                            type="tel"
                                            required
                                            value={leadInfo.leadPersonPhone}
                                            onChange={(e) => setLeadInfo({ ...leadInfo, leadPersonPhone: e.target.value })}
                                            className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2rem] text-sm font-black focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all"
                                            placeholder="Số điện thoại"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Ghi chú gửi người thuê (tùy chọn)</label>
                                        <textarea
                                            rows="2"
                                            value={leadInfo.landlordNotes}
                                            onChange={(e) => setLeadInfo({ ...leadInfo, landlordNotes: e.target.value })}
                                            className="w-full px-8 py-5 bg-gray-50 border-transparent rounded-[2.5rem] text-sm font-black focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all resize-none"
                                            placeholder="Dặn dò khách trước khi đến..."
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-sm shadow-2xl shadow-indigo-100 hover:bg-gray-900 hover:-translate-y-1 transition-all"
                                >
                                    Xác nhận & Gửi thông báo
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingManagement;
