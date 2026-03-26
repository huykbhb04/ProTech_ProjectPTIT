import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, User, Phone, CheckCircle2, XCircle, AlertCircle, ChevronRight, Home, Info, Filter, ArrowRight, FileText } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import bookingService from '../../services/bookingService';
import contractService from '../../services/contractService';

const MyBookings = () => {
    const navigate = useNavigate();
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchBookings();
    }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const data = await bookingService.getTenantBookings();
            setBookings(data);
            if (data.length > 0 && !selectedBooking) {
                // setSelectedBooking(data[0]);
            }
        } catch (error) {
            console.error("Error fetching bookings:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateContract = async (bookingId) => {
        try {
            const result = await contractService.createFromBooking(bookingId);
            if (result.success) {
                navigate(`/tenant/contract/${result.contractId}`);
            }
        } catch (error) {
            alert(error.response?.data?.message || "Có lỗi xảy ra khi khởi tạo hợp đồng.");
        }
    };

    const stats = {
        total: bookings.length,
        pending: bookings.filter(b => b.status === 'pending').length,
        confirmed: bookings.filter(b => b.status === 'confirmed').length
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'confirmed': return 'text-green-600 bg-green-50 border-green-100';
            case 'rejected': return 'text-red-600 bg-red-50 border-red-100';
            case 'cancelled': return 'text-gray-600 bg-gray-50 border-gray-100';
            default: return 'text-amber-600 bg-amber-50 border-amber-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'confirmed': return <CheckCircle2 size={14} />;
            case 'rejected': return <XCircle size={14} />;
            case 'cancelled': return <AlertCircle size={14} />;
            default: return <Clock size={14} />;
        }
    };

    const filteredBookings = bookings.filter(b => filter === 'all' || b.status === filter);

    const BookingRow = ({ booking }) => {
        const isActive = selectedBooking?.booking_id === booking.booking_id;
        return (
            <div
                onClick={() => setSelectedBooking(booking)}
                className={`group relative flex items-center gap-6 p-5 bg-white border rounded-3xl transition-all cursor-pointer hover:shadow-xl hover:shadow-indigo-50/50 ${isActive ? 'border-indigo-600 shadow-lg ring-4 ring-indigo-50' : 'border-gray-100 hover:border-indigo-200'
                    }`}
            >
                <div className="w-20 h-20 rounded-2xl bg-gray-50 flex-shrink-0 flex items-center justify-center text-gray-400 group-hover:scale-105 transition-transform overflow-hidden relative border border-gray-100">
                    <Home size={32} strokeWidth={1.5} />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/10 to-transparent"></div>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-5">
                        <h4 className="font-black text-gray-900 text-lg tracking-tight group-hover:text-indigo-600 transition-colors">
                            Phòng {booking.room_number} <span className="text-gray-300 mx-1 font-light">|</span> <span className="text-sm text-gray-500 font-bold uppercase">{booking.building_name}</span>
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-gray-500">
                            <MapPin size={12} className="text-gray-400" />
                            <span className="text-xs font-bold line-clamp-1">{booking.location_detail || 'Vị trí đã lưu'}</span>
                        </div>
                    </div>

                    <div className="md:col-span-4 flex items-center gap-6">
                        <div className="text-center md:text-left">
                            <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Thời gian</div>
                            <div className="flex items-center gap-2 text-sm font-black text-gray-700">
                                <Calendar size={14} className="text-indigo-400" />
                                {new Date(booking.booking_date).toLocaleDateString('vi-VN')}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-gray-400 mt-0.5">
                                <Clock size={12} />
                                {booking.booking_time.substring(0, 5)}
                            </div>
                        </div>
                    </div>

                    <div className="md:col-span-3 flex justify-end">
                        <div className={`px-4 py-2 rounded-2xl border text-[11px] font-black uppercase tracking-wider flex items-center gap-2 shadow-sm ${getStatusStyle(booking.status)}`}>
                            {getStatusIcon(booking.status)}
                            {booking.status === 'pending' ? 'Chờ xác nhận' :
                                booking.status === 'confirmed' ? 'Đã xác nhận' :
                                    booking.status === 'rejected' ? 'Đã từ chối' : 'Đã hủy'}
                        </div>
                    </div>
                </div>

                <div className={`absolute right-4 opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? 'hidden' : ''}`}>
                    <ArrowRight size={20} className="text-indigo-600" />
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[60vh]">
            <div className="relative">
                <div className="w-16 h-16 border-4 border-indigo-100 rounded-full"></div>
                <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                <div className="mt-4 text-center text-sm font-black text-gray-400 uppercase tracking-widest">Đang tải...</div>
            </div>
        </div>
    );

    return (
        <div className="max-w-[1400px] mx-auto px-6 py-10">
            {/* Desktop Header with Stats */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12">
                <div className="space-y-2">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                            <Calendar size={24} />
                        </div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic">Lịch hẹn của tôi</h1>
                    </div>
                    <p className="text-gray-500 font-bold uppercase text-xs tracking-[0.2em] ml-1">Lưu trữ và quản lý lộ trình tìm phòng của bạn</p>
                </div>

                <div className="grid grid-cols-3 gap-8 p-6 bg-white border border-gray-100 rounded-[2.5rem] shadow-sm flex-grow lg:flex-grow-0 min-w-[400px]">
                    <div className="text-center">
                        <div className="text-2xl font-black text-gray-900">{stats.total}</div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng cộng</div>
                    </div>
                    <div className="text-center border-x border-gray-50 px-8">
                        <div className="text-2xl font-black text-amber-500">{stats.pending}</div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chờ duyệt</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-black text-green-500">{stats.confirmed}</div>
                        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Đã chốt</div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
                {/* Left side: Navigation and List */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
                            {[
                                { id: 'all', label: 'Tất cả' },
                                { id: 'pending', label: 'Chờ xác nhận' },
                                { id: 'confirmed', label: 'Đã xác nhận' },
                                { id: 'rejected', label: 'Bị từ chối' }
                            ].map(btn => (
                                <button
                                    key={btn.id}
                                    onClick={() => setFilter(btn.id)}
                                    className={`px-6 py-2.5 rounded-2xl text-xs font-black transition-all whitespace-nowrap border ${filter === btn.id
                                        ? 'bg-gray-900 text-white border-gray-900 shadow-lg'
                                        : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200 hover:text-indigo-600'
                                        }`}
                                >
                                    {btn.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredBookings.length > 0 ? (
                            filteredBookings.map(b => (
                                <BookingRow key={b.booking_id} booking={b} />
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center p-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200 text-center">
                                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-xl mb-6">
                                    <Info size={40} className="text-gray-300" />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Không tìm thấy yêu cầu</h3>
                                <p className="text-gray-500 font-bold max-w-sm mb-8">Bạn có thể thay đổi bộ lọc hoặc đi xem các phòng đang hot nhất hiện nay.</p>
                                <Link to="/tenant/discover" className="px-10 py-4 bg-indigo-600 text-white rounded-3xl font-black shadow-2xl shadow-indigo-100 hover:-translate-y-1 transition-all">
                                    Tiếp tục săn phòng
                                </Link>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right side: Premium Detail Panel */}
                <div className="lg:col-span-4 lg:sticky lg:top-28">
                    {selectedBooking ? (
                        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] overflow-hidden animate-in fade-in slide-in-from-right-10 duration-500">
                            {/* Header Image/Banner */}
                            <div className="h-40 bg-gradient-to-br from-indigo-600 to-indigo-900 relative p-8 flex flex-col justify-end">
                                <div className="absolute top-6 right-6 px-4 py-2 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                                    ID: #{selectedBooking.booking_id}
                                </div>
                                <h2 className="text-2xl font-black text-white italic">Chi tiết cuộc hẹn</h2>
                                <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-1">Cập nhật lúc {new Date(selectedBooking.updated_at || selectedBooking.created_at).toLocaleTimeString('vi-VN')}</p>
                            </div>

                            <div className="p-8 space-y-8">
                                <div className="space-y-6">
                                    {/* Core Info Row */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-[2rem] border border-gray-100/50">
                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                <Calendar size={10} /> Ngày xem
                                            </div>
                                            <div className="text-sm font-black text-gray-900">{new Date(selectedBooking.booking_date).toLocaleDateString('vi-VN')}</div>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-[2rem] border border-gray-100/50">
                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                <Clock size={10} /> Giờ xem
                                            </div>
                                            <div className="text-sm font-black text-gray-900">{selectedBooking.booking_time.substring(0, 5)}</div>
                                        </div>
                                    </div>

                                    {/* Place Info */}
                                    <div className="p-6 bg-indigo-50/30 rounded-[2.5rem] border border-indigo-100/50 relative overflow-hidden group/place">
                                        <div className="absolute -top-4 -right-4 w-24 h-24 bg-indigo-600/5 rounded-full blur-2xl group-hover/place:scale-150 transition-transform"></div>
                                        <div className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-3">Thông tin căn phòng</div>
                                        <div className="font-black text-gray-900 text-lg mb-1 group-hover/place:text-indigo-600 transition-colors">Phòng {selectedBooking.room_number} <span className="text-gray-300 font-light ml-2">|</span> <span className="text-gray-500 font-black ml-1 uppercase">{selectedBooking.building_name}</span></div>
                                        <div className="flex items-start gap-2 text-gray-500 font-bold text-xs leading-relaxed">
                                            <MapPin size={14} className="text-indigo-600 mt-0.5 shrink-0" />
                                            {selectedBooking.location_detail || 'Địa chỉ đang được cập nhật bởi chủ hệ thống'}
                                        </div>
                                    </div>

                                    {/* Status-specific Action Section */}
                                    {selectedBooking.status === 'confirmed' ? (
                                        <div className="space-y-6 animate-in zoom-in-95 duration-500">
                                            <div className="h-px bg-gray-50"></div>
                                            <div className="flex items-center gap-3 text-green-600 font-black text-sm uppercase tracking-tight">
                                                <CheckCircle2 size={24} className="bg-green-100 p-1 rounded-lg" />
                                                Lịch hẹn đã sẵn sàng!
                                            </div>

                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="flex items-center gap-5 p-5 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
                                                        <User size={28} />
                                                    </div>
                                                    <div>
                                                        <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Người dẫn xem</div>
                                                        <div className="font-black text-gray-900 text-lg leading-tight">{selectedBooking.lead_person_name}</div>
                                                        <div className="flex items-center gap-1 text-indigo-600 font-black text-[10px] mt-1">
                                                            <Phone size={10} /> {selectedBooking.lead_person_phone}
                                                        </div>
                                                    </div>
                                                </div>

                                                {selectedBooking.landlord_notes && (
                                                    <div className="p-6 bg-white border-2 border-dashed border-indigo-100 rounded-[2.5rem]">
                                                        <div className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-2">Ghi chú quan trọng</div>
                                                        <p className="text-xs font-bold text-gray-600 leading-relaxed italic">"{selectedBooking.landlord_notes}"</p>
                                                    </div>
                                                )}

                                                <a
                                                    href={`tel:${selectedBooking.lead_person_phone}`}
                                                    className="flex items-center justify-center gap-3 w-full py-5 bg-white border border-gray-100 text-gray-900 rounded-[2rem] font-black text-sm shadow-sm hover:bg-gray-50 transition-all group"
                                                >
                                                    <Phone size={18} className="group-hover:animate-bounce" /> Gọi điện ngay
                                                </a>

                                                <button
                                                    onClick={() => handleCreateContract(selectedBooking.booking_id)}
                                                    className="flex items-center justify-center gap-3 w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm shadow-2xl hover:bg-gray-900 hover:-translate-y-1 transition-all group"
                                                >
                                                    <FileText size={18} /> Ký hợp đồng online
                                                </button>
                                            </div>
                                        </div>
                                    ) : selectedBooking.status === 'pending' ? (
                                        <div className="p-8 bg-amber-50/50 rounded-[2.5rem] border border-amber-100/50 text-center space-y-4">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm ring-8 ring-amber-50">
                                                <Clock size={32} className="text-amber-500 animate-[spin_4s_linear_infinite]" />
                                            </div>
                                            <div>
                                                <h4 className="font-black text-amber-900">Đang chờ phản hồi</h4>
                                                <p className="text-xs font-bold text-amber-700/70 mt-2 leading-relaxed">Chủ trọ sẽ nhận được thông báo về yêu cầu của bạn. Thông tin liên hệ sẽ hiện ra sau khi lịch được xác nhận.</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="p-8 bg-red-50/50 rounded-[2.5rem] border border-red-100/50 text-center space-y-4">
                                            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm ring-8 ring-red-50">
                                                <XCircle size={32} className="text-red-500" />
                                            </div>
                                            <p className="text-xs font-bold text-red-900/70 mt-2 leading-relaxed">Lịch hẹn này không thể thực hiện được. Vui lòng chọn một khung giờ khác hoặc liên hệ trực tiếp với chủ trọ.</p>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => setSelectedBooking(null)}
                                        className="w-full py-5 border border-gray-100 text-gray-400 rounded-[2rem] text-xs font-black hover:bg-gray-50 transition-all uppercase tracking-widest"
                                    >
                                        Đóng chi tiết
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-[3rem] p-16 border-2 border-dashed border-gray-100 text-center flex flex-col items-center justify-center min-h-[400px]">
                            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 group hover:scale-110 transition-transform">
                                <ChevronRight className="text-gray-200 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" size={40} />
                            </div>
                            <h4 className="text-xl font-black text-gray-900">Thông tin chi tiết</h4>
                            <p className="text-sm font-bold text-gray-400 mt-2 max-w-[200px]">Chọn một cuộc hẹn trong danh sách để xem đầy đủ thông tin</p>

                            <div className="mt-12 p-6 bg-indigo-600 rounded-[2rem] text-white shadow-xl shadow-indigo-100 relative overflow-hidden text-left">
                                <div className="absolute top-0 right-0 p-4 opacity-10">
                                    <Filter size={80} />
                                </div>
                                <h5 className="font-black text-sm mb-1 italic">Bạn có biết? ✨</h5>
                                <p className="text-[11px] font-bold text-indigo-100 leading-relaxed opacity-90">Những lịch hẹn có thông báo mới sẽ được ưu tiên hiển thị lên đầu danh sách.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MyBookings;
