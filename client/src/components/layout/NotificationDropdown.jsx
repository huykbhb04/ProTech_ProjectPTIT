import React, { useState, useEffect, useRef } from 'react';
import { Bell, Calendar, Info, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import notificationService from '../../services/notificationService';
import { Link } from 'react-router-dom';

const NotificationDropdown = ({ user }) => {
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (user) {
            fetchNotifications();
            const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [user]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const data = await notificationService.getNotifications();
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        } catch (error) {
            console.error("Error fetching notifications:", error);
        }
    };

    const markAsRead = async (id) => {
        try {
            await notificationService.markAsRead(id);
            fetchNotifications();
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await notificationService.markAllAsRead();
            fetchNotifications();
        } catch (error) {
            console.error("Error marking all as read:", error);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'booking': return <Calendar size={16} className="text-indigo-600" />;
            case 'bill': return <Info size={16} className="text-green-600" />;
            case 'alert': return <AlertTriangle size={16} className="text-amber-600" />;
            default: return <Bell size={16} className="text-gray-600" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all relative group"
            >
                <Bell size={24} className="group-hover:rotate-12 transition-transform" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white ring-4 ring-white shadow-sm">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-[100] animate-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                        <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest leading-none">Thông báo</h3>
                        <button
                            onClick={markAllAsRead}
                            className="text-[10px] font-black text-indigo-600 hover:text-indigo-800 uppercase tracking-tighter"
                        >
                            Đánh dấu tất cả đã đọc
                        </button>
                    </div>

                    <div className="max-h-[400px] overflow-y-auto">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center">
                                <Bell className="mx-auto h-12 w-12 text-gray-200 mb-2" />
                                <p className="text-sm text-gray-400 font-bold">Chưa có thông báo nào</p>
                            </div>
                        ) : (
                            notifications.map((noti) => (
                                <div
                                    key={noti.noti_id}
                                    onClick={() => markAsRead(noti.noti_id)}
                                    className={`p-4 border-b border-gray-50 flex gap-4 cursor-pointer transition-all hover:bg-gray-50 ${!noti.is_read ? 'bg-indigo-50/30' : ''}`}
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                                            {getIcon(noti.type)}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <p className="text-xs font-black text-gray-900 leading-tight">{noti.title}</p>
                                        <p className="text-[11px] text-gray-500 font-medium leading-relaxed">{noti.body}</p>
                                        <p className="text-[9px] text-gray-400 font-bold">{new Date(noti.created_at).toLocaleString('vi-VN')}</p>
                                    </div>
                                    {!noti.is_read && (
                                        <div className="flex-shrink-0 flex items-center">
                                            <div className="w-2 h-2 rounded-full bg-indigo-600 shadow-sm shadow-indigo-200"></div>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-3 border-t border-gray-50 text-center bg-gray-50/10">
                        <Link
                            to={user.role === 'landlord' ? '/landlord/notifications' : '/tenant/bookings'}
                            className="text-[10px] font-black text-gray-400 hover:text-indigo-600 uppercase tracking-widest flex items-center justify-center gap-2 group/all"
                            onClick={() => setIsOpen(false)}
                        >
                            Xem tất cả hoạt động <ChevronRight size={12} className="group-hover/all:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationDropdown;
