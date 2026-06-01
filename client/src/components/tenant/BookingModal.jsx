import React, { useState } from 'react';
import { X, Calendar, Clock, CircleCheck, ShieldCheck, MapPin, CircleX } from 'lucide-react';
import bookingService from '../../services/bookingService';

const BookingModal = ({ isOpen, onClose, roomId, roomNumber, buildingName, onSuccess }) => {
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async () => {
        setLoading(true);
        setError('');

        try {
            const selectedAt = new Date(`${bookingDate}T${bookingTime}:00`);
            const minAllowedAt = new Date(Date.now() + 60 * 60 * 1000);

            if (Number.isNaN(selectedAt.getTime())) {
                setError('Vui lòng chọn ngày và giờ hợp lệ.');
                return;
            }

            if (selectedAt < minAllowedAt) {
                setError('Vui lòng chọn lịch hẹn cách thời điểm hiện tại ít nhất 1 tiếng.');
                return;
            }

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
                setBookingDate('');
                setBookingTime('');
            }, 5000);
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra khi đặt lịch.');
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = (e) => {
        e.preventDefault();
        handleSubmit();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-md animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
                {/* Left Visual Panel */}
                <div className="md:w-80 bg-indigo-600 p-10 flex flex-col justify-between text-white relative">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative z-10">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60 mb-6">Trình đặt lịch</div>
                        <h3 className="text-3xl font-black italic leading-tight">
                            Sẵn sàng để xem phòng?
                        </h3>
                        <p className="text-xs font-bold text-indigo-100 mt-4 leading-relaxed opacity-80">
                            Chọn thời gian phù hợp nhất để chúng tôi sắp xếp người đón tiếp bạn.
                        </p>
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
                        
                        {bookingDate && (
                            <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                                <div className="flex items-center gap-2 text-[10px] font-black">
                                    <Calendar size={12} /> {bookingDate}
                                </div>
                                <div className="flex items-center gap-2 text-[10px] font-black">
                                    <Clock size={12} /> {bookingTime}
                                </div>
                            </div>
                        )}
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
                                <CircleCheck size={48} />
                            </div>
                            <div>
                                <h4 className="text-3xl font-black text-gray-900 tracking-tight italic">Đặt lịch thành công!</h4>
                                <p className="text-gray-500 font-bold mt-2 leading-relaxed">
                                    Yêu cầu đặt lịch của bạn đã được gửi tới Chủ trọ. <br />
                                    Chủ trọ sẽ xác nhận lịch hẹn và liên hệ dẫn bạn xem phòng.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div className="space-y-8 animate-in slide-in-from-right-10 duration-500">
                                <div>
                                    <h2 className="text-2xl font-black text-gray-900 italic">Chọn lịch hẹn</h2>
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">Thông tin sẽ gửi trực tiếp đến chủ trọ</p>
                                </div>

                                <form onSubmit={handleFormSubmit} className="space-y-8">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                            <CircleX size={20} />
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-6 bg-[#2563eb] text-white rounded-[2.5rem] font-black text-lg shadow-2xl shadow-indigo-100 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 group"
                                    >
                                        {loading ? 'Đang gửi yêu cầu...' : 'Xác nhận đặt lịch xem phòng'}
                                        {!loading && <CircleCheck size={20} />}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BookingModal;
