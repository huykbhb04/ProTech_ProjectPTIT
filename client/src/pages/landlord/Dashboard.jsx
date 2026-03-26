import React, { useState, useEffect } from 'react';
import {
    TrendingUp,
    Users,
    Home,
    AlertTriangle,
    Clock
} from 'lucide-react';
import notificationService from '../../services/notificationService';

const DashboardWidget = ({ title, value, subtext, icon: Icon, color }) => (
    <div className="glass p-6 rounded-2xl border-l-4 card-hover overflow-hidden relative" style={{ borderColor: color }}>
        <div className="flex justify-between items-start">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="mt-2 text-3xl font-bold text-gray-800">{value}</h3>
                <p className="mt-1 text-xs text-gray-500">{subtext}</p>
            </div>
            <div className={`p-3 rounded-full bg-opacity-20`} style={{ backgroundColor: color }}>
                <Icon className="h-6 w-6" style={{ color: color }} />
            </div>
        </div>
        {/* Decorative circle */}
        <div className="absolute -bottom-4 -right-4 w-24 h-24 rounded-full opacity-10" style={{ backgroundColor: color }}></div>
    </div>
);

const AINotification = () => (
    <div className="mb-8 glass rounded-xl p-4 flex items-center shadow-sm border border-indigo-100">
        <span className="flex h-2 w-2 relative mr-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
        </span>
        <p className="text-sm text-indigo-800 font-medium">
            <span className="font-bold">AI Insight:</span> Phòng 201 có mức tiêu thụ điện tăng đột biến 20% so với tháng trước. Kiểm tra ngay?
        </p>
    </div>
);

const LandlordDashboard = () => {
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        const fetchRecentActivity = async () => {
            try {
                const data = await notificationService.getNotifications();
                setNotifications(data.slice(0, 5));
            } catch (error) {
                console.error("Error fetching activity:", error);
            }
        };

        fetchRecentActivity();
    }, []);

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 60) return `${diffInMinutes}p trước`;
        if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h trước`;
        return date.toLocaleDateString('vi-VN');
    };

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Command Center</h1>
                <p className="text-gray-500">Chào mừng trở lại! Đây là tình hình kinh doanh hôm nay.</p>
            </div>

            <AINotification />

            {/* Widgets Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                <DashboardWidget
                    title="Tổng Doanh Thu"
                    value="45.2 Tr"
                    subtext="+12% so với tháng trước"
                    icon={TrendingUp}
                    color="#3B82F6"
                />
                <DashboardWidget
                    title="Tỷ lệ lấp đầy"
                    value="92%"
                    subtext="Chỉ còn 3 phòng trống"
                    icon={Home}
                    color="#10B981"
                />
                <DashboardWidget
                    title="Khách thuê"
                    value="48"
                    subtext="2 hợp đồng sắp hết hạn"
                    icon={Users}
                    color="#8B5CF6"
                />
                <DashboardWidget
                    title="Yêu cầu bảo trì"
                    value="3"
                    subtext="1 yêu cầu khẩn cấp"
                    icon={AlertTriangle}
                    color="#F59E0B"
                />
            </div>

            {/* Chart Section Placeholder */}
            <div className="grid gap-6 lg:grid-cols-3">
                <div className="lg:col-span-2 glass rounded-2xl p-6 h-80 flex flex-col justify-center items-center">
                    <h3 className="text-lg font-semibold text-gray-700 w-full text-left mb-4">Biểu đồ doanh thu (Demo)</h3>
                    <div className="w-full h-full bg-gray-100/50 rounded-xl border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                        [Chart Component Placeholder]
                    </div>
                </div>
                <div className="glass rounded-2xl p-6 h-80 flex flex-col overflow-hidden">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">Hoạt động gần đây</h3>
                    <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin">
                        <ul className="space-y-4">
                            {notifications.length > 0 ? (
                                notifications.map((noti) => (
                                    <li key={noti.noti_id} className="flex items-start space-x-3 text-sm">
                                        <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${noti.is_read ? 'bg-gray-300' : 'bg-blue-500'}`}></div>
                                        <div className="flex-1">
                                            <p className={`line-clamp-2 ${noti.is_read ? 'text-gray-500' : 'text-gray-800 font-medium'}`}>
                                                {noti.body}
                                            </p>
                                            <p className="text-[10px] text-gray-400 mt-1">{formatTime(noti.created_at)}</p>
                                        </div>
                                    </li>
                                ))
                            ) : (
                                <li className="text-center text-gray-400 py-10">Không có hoạt động mới</li>
                            )}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandlordDashboard;
