import React, { useState, useEffect } from 'react';
import { Bell, Calendar, Info, AlertTriangle, CheckCircle2, Trash2, Check, ArrowUpRight, Search } from 'lucide-react';
import notificationService from '../../services/notificationService';

const Notifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await notificationService.getNotifications();
            setNotifications(data);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            // Local update for speed
            setNotifications(notifications.map(n => n.noti_id === id ? { ...n, is_read: 1 } : n));
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'booking': return <Calendar size={22} className="text-indigo-600" />;
            case 'bill': return <Info size={22} className="text-green-600" />;
            case 'alert': return <AlertTriangle size={22} className="text-amber-600" />;
            default: return <Bell size={22} className="text-gray-600" />;
        }
    };

    const filteredNotifications = notifications.filter(noti => {
        const matchesSearch = noti.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            noti.body.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filter === 'all' ? true :
            filter === 'unread' ? !noti.is_read :
                noti.type === filter;
        return matchesSearch && matchesFilter;
    });

    if (loading) return (
        <div className="flex items-center justify-center min-h-[500px]">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-12 pb-32">
            {/* Elegant Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 bg-gray-900 rounded-[2rem] flex items-center justify-center text-white shadow-2xl">
                            <Bell size={28} />
                        </div>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tighter italic">Trung tâm thông báo</h2>
                    </div>
                    <p className="text-gray-500 font-bold uppercase text-[10px] tracking-[0.3em] ml-2">Luôn cập nhật mọi biến động trong hệ thống của bạn</p>
                </div>

                {notifications.some(n => !n.is_read) && (
                    <button
                        onClick={markAllAsRead}
                        className="flex items-center gap-2 px-8 py-4 bg-white border-2 border-indigo-50 text-indigo-600 rounded-[2rem] font-black text-xs hover:bg-indigo-600 hover:text-white hover:shadow-xl hover:shadow-indigo-100 transition-all active:scale-95"
                    >
                        <Check size={18} /> Đánh dấu tất cả đã đọc
                    </button>
                )}
            </div>

            {/* Premium Filter & Search Bar */}
            <div className="bg-white p-3 rounded-[3rem] border border-gray-100 shadow-sm flex flex-col lg:flex-row gap-2">
                <div className="flex-1 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-indigo-600 transition-colors" size={20} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm nội dung thông báo..."
                        className="w-full pl-16 pr-8 py-5 bg-gray-50 border-transparent rounded-[2.5rem] text-sm font-bold focus:bg-white focus:ring-4 focus:ring-indigo-50 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex bg-gray-50 p-1.5 rounded-[2.5rem] overflow-x-auto no-scrollbar shrink-0">
                    {[
                        { id: 'all', label: 'Tất cả', icon: Bell },
                        { id: 'unread', label: 'Chưa đọc', icon: Bell },
                        { id: 'booking', label: 'Lịch hẹn', icon: Calendar },
                        { id: 'bill', label: 'Hóa đơn', icon: Info },
                    ].map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setFilter(item.id)}
                            className={`flex items-center gap-2 px-8 py-3.5 rounded-[2rem] font-black text-[11px] uppercase tracking-wider transition-all whitespace-nowrap ${filter === item.id
                                    ? 'bg-white text-indigo-600 shadow-xl'
                                    : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            <item.icon size={14} />
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Notifications Feed */}
            <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                    <div className="bg-white rounded-[4rem] p-32 text-center border-2 border-dashed border-gray-100">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce transition-all duration-[3000ms]">
                            <Bell size={48} className="text-gray-200" />
                        </div>
                        <h3 className="text-3xl font-black text-gray-900 mb-3">Mọi thứ đều đã sẵn sàng!</h3>
                        <p className="text-gray-400 font-bold max-w-sm mx-auto uppercase text-xs tracking-widest leading-relaxed">Không có thông báo nào khớp với bộ lọc hiện tại của bạn.</p>
                    </div>
                ) : (
                    filteredNotifications.map((noti) => (
                        <div
                            key={noti.noti_id}
                            onClick={() => !noti.is_read && markAsRead(noti.noti_id)}
                            className={`group bg-white rounded-[3rem] p-8 border transition-all flex flex-col md:flex-row gap-8 items-start md:items-center relative cursor-pointer ${!noti.is_read
                                    ? 'border-indigo-100 bg-indigo-50/10 shadow-lg shadow-indigo-50/50'
                                    : 'border-gray-50 hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-50/30'
                                }`}
                        >
                            <div className="flex-shrink-0">
                                <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-sm border transition-transform group-hover:scale-110 duration-500 ${!noti.is_read ? 'bg-white border-indigo-100 ring-8 ring-indigo-50/50' : 'bg-gray-50 border-gray-100'
                                    }`}>
                                    {getIcon(noti.type)}
                                </div>
                            </div>

                            <div className="flex-1 space-y-3">
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <h4 className={`text-xl transition-all ${!noti.is_read ? 'font-black text-gray-900' : 'font-bold text-gray-400'}`}>
                                            {noti.title}
                                        </h4>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${noti.type === 'booking' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                    noti.type === 'bill' ? 'bg-green-50 text-green-600 border-green-100' :
                                                        noti.type === 'alert' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                            'bg-gray-50 text-gray-600 border-gray-100'
                                                }`}>
                                                {noti.type}
                                            </span>
                                            {!noti.is_read && (
                                                <div className="flex items-center gap-1.5 text-[9px] font-black text-indigo-600 uppercase tracking-widest">
                                                    <div className="w-2 h-2 rounded-full bg-indigo-600 animate-pulse"></div>
                                                    Thông báo mới
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[11px] font-black text-gray-900 italic">#{noti.noti_id}</div>
                                        <div className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-tighter">
                                            {new Date(noti.created_at).toLocaleDateString('vi-VN')}
                                            <span className="mx-2 opacity-30">|</span>
                                            {new Date(noti.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                                <p className={`text-base leading-relaxed max-w-3xl ${!noti.is_read ? 'font-black text-gray-700' : 'font-medium text-gray-400 opacity-80'}`}>
                                    {noti.body}
                                </p>
                            </div>

                            <div className="md:w-12 h-12 flex justify-center items-center">
                                {!noti.is_read ? (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            markAsRead(noti.noti_id);
                                        }}
                                        className="p-4 bg-gray-900 text-white rounded-2xl opacity-0 lg:group-hover:opacity-100 transition-all hover:scale-110 shadow-2xl"
                                        title="Đánh dấu đã đọc"
                                    >
                                        <Check size={20} />
                                    </button>
                                ) : (
                                    <ArrowUpRight className="text-gray-100 lg:group-hover:text-indigo-200 transition-colors" size={32} />
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Reading Tip Footer */}
            <div className="bg-gradient-to-r from-gray-900 to-indigo-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/20">
                        <Info size={32} className="text-indigo-300" />
                    </div>
                    <div>
                        <h5 className="text-xl font-black italic mb-2">Thông tin bảo mật</h5>
                        <p className="text-indigo-100/70 font-medium text-sm leading-relaxed max-w-2xl">
                            Các thông báo về giao dịch tài chính và mật khẩu sẽ được hệ thống mã hóa. Hãy đảm bảo không chia sẻ tài khoản
                            với bất kỳ ai để bảo vệ thông tin cá nhân của bạn.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Notifications;
