import React, { useState } from 'react';
import { X, Calendar, Clock, CheckCircle2, ShieldCheck, MapPin, XCircle } from 'lucide-react';
import bookingService from '../../services/bookingService';

const BookingModal = ({ isOpen, onClose, roomId, roomNumber, buildingName, onSuccess }) => {
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await bookingService.createBooking({
                roomId,
                bookingDate,
                bookingTime
            });
            setSuccess(true);
            if (onSuccess) onSuccess();
            setTimeout(() => {
                onClose();
                setSuccess(false);
            }, 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
                {/* Left Visual Panel */}
                <div className="md:w-64 bg-indigo-600 p-10 flex flex-col justify-between text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-6">Trình đặt lịch</div>
                        <h3 className="text-3xl font-black italic leading-tight">Sẵn sàng để xem phòng?</h3>
                        <p className="text-xs font-bold text-indigo-100 mt-4 leading-relaxed opacity-80">Chọn thời gian phù hợp nhất để chúng tôi sắp xếp người đón tiếp bạn.</p>
                    </div>

                    <div className="relative z-10 py-6 border-y border-white/10 my-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                                <MapPin size={16} />
                            </div>
                            <div>
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Vị trí</div>
                                <div className="text-sm font-black">Phòng {roomNumber}</div>
                            </div>
                        </div>
                        <div className="text-xs font-bold text-indigo-100/60 leading-tight uppercase tracking-tighter">{buildingName}</div>
                    </div>

                    <div className="relative z-10 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-indigo-200">
                        <ShieldCheck size={14} /> Bảo mật thông tin 100%
                    </div>
                </div>

                {/* Right Form Panel */}
                <div className="flex-1 p-10 md:p-12 bg-white relative">
                    <button onClick={onClose} className="absolute top-8 right-8 text-gray-300 hover:text-red-500 transition-colors p-2 hover:bg-gray-50 rounded-full">
                        <X size={24} />
                    </button>

                    {success ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-10 space-y-6 animate-in fade-in zoom-in-90 duration-500">
                            <div className="w-24 h-24 bg-green-50 text-green-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-4 animate-bounce shadow-xl shadow-green-50">
                                <CheckCircle2 size={48} />
                            </div>
                            <div>
                                <h4 className="text-3xl font-black text-gray-900 tracking-tight italic">Gửi thành công!</h4>
                                <p className="text-gray-500 font-bold mt-2 leading-relaxed">Yêu cầu của bạn đã được gửi tới chủ trọ. <br />Chúng tôi sẽ thông báo cho bạn ngay khi có cập nhật.</p>
                            </div>
                            <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 animate-[progress_3s_linear]"></div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            <div>
                                <h2 className="text-2xl font-black text-gray-900 italic">Chọn lịch hẹn</h2>
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Thông tin sẽ gửi trực tiếp đến chủ trọ</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-8">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Ngày dự kiến</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                                <Calendar size={20} className="text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                                            </div>
                                            <input
                                                type="date"
                                                required
                                                min={new Date().toISOString().split('T')[0]}
                                                className="block w-full pl-16 pr-8 py-5 bg-gray-50 border-transparent rounded-[2rem] text-sm font-black focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all cursor-pointer"
                                                value={bookingDate}
                                                onChange={(e) => setBookingDate(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Giờ mong muốn</label>
                                        <div className="relative group">
                                            <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none">
                                                <Clock size={20} className="text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                                            </div>
                                            <input
                                                type="time"
                                                required
                                                className="block w-full pl-16 pr-8 py-5 bg-gray-50 border-transparent rounded-[2rem] text-sm font-black focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-600 transition-all cursor-pointer"
                                                value={bookingTime}
                                                onChange={(e) => setBookingTime(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-5 bg-red-50 border border-red-100 text-red-600 text-xs font-black rounded-2xl flex items-center gap-3 animate-shake">
                                        <XCircle size={20} />
                                        {error}
                                    </div>
                                )}

                                <div className="pt-4 space-y-4">
                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-6 bg-indigo-600 text-white rounded-[2.5rem] font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-gray-900 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 disabled:translate-y-0 relative overflow-hidden group"
                                    >
                                        <span className="relative z-10 flex items-center justify-center gap-3">
                                            {loading ? 'Đang xử lý...' : 'Xác nhận đặt lịch'}
                                            {!loading && <CheckCircle2 size={20} />}
                                        </span>
                                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-indigo-400 to-indigo-600 opacity-0 group-hover:opacity-20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                    </button>

                                    <p className="text-[9px] text-center text-gray-400 font-bold leading-relaxed uppercase tracking-tighter">
                                        Bằng cách xác nhận, bạn đồng ý với các <br />
                                        <span className="text-indigo-600 underline cursor-pointer hover:text-gray-900 transition-colors uppercase">điều khoản dịch vụ & chính sách bảo mật</span>
                                    </p>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
