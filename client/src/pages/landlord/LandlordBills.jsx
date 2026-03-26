import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Calendar, DollarSign, ChevronRight,
    Filter, Download, CheckCircle2, AlertCircle, Clock
} from 'lucide-react';
import api from '../../services/api';

const LandlordBills = () => {
    const navigate = useNavigate();
    const [bills, setBills] = useState([]);
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        confirmed: 0,
        paid: 0,
        overdue: 0,
        totalRevenue: 0
    });
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, confirmed, paid, overdue
    const [showOnlyMyConfirm, setShowOnlyMyConfirm] = useState(false);

    useEffect(() => {
        fetchBills();
    }, [filter]);

    const fetchBills = async () => {
        setLoading(true);
        try {
            // In a real app, query params would be used for filtering on server
            const res = await api.get('/bills/landlord/list');
            setBills(res.data.bills);
            setStats(res.data.stats);
        } catch (error) {
            console.error('Error fetching bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'paid':
                return <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase flex items-center gap-1"><CheckCircle2 size={12} /> Đã thanh toán</span>;
            case 'pending':
                return <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold uppercase flex items-center gap-1"><Clock size={12} /> Chờ thanh toán</span>;
            case 'confirmed':
            case 'confirmed':
                return <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase flex items-center gap-1"><AlertCircle size={12} /> Chờ thanh toán</span>;
            case 'pending_approval':
                return <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase flex items-center gap-1"><Clock size={12} /> Chờ duyệt</span>;
            case 'overdue':
                return <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase flex items-center gap-1"><AlertCircle size={12} /> Quá hạn</span>;
            default:
                return <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-bold uppercase">{status}</span>;
        }
    };

    const filteredBills = bills.filter(bill => {
        if (filter === 'all') return true;
        return bill.status === filter;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header & Stats */}
            <div>
                <h1 className="text-2xl font-black text-gray-900 mb-6 tracking-tight">Quản lý Hóa đơn & Thu chi</h1>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Doanh thu thực tế</p>
                        <p className="text-2xl font-black text-green-600">
                            {stats.totalRevenue.toLocaleString('vi-VN')} ₫
                        </p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Chờ thanh toán</p>
                        <p className="text-2xl font-black text-yellow-600">{stats.pending}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Chờ xác nhận</p>
                        <p className="text-2xl font-black text-blue-600">{stats.confirmed}</p>
                    </div>
                    <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-1">Quá hạn</p>
                        <p className="text-2xl font-black text-red-600">{stats.overdue}</p>
                    </div>
                </div>
            </div>

            {/* Filter & Actions */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {['all', 'confirmed', 'pending_approval', 'paid', 'overdue'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${filter === f
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {f === 'all' ? 'Tất cả' :
                                f === 'pending_approval' ? 'Chờ duyệt' :
                                    f === 'confirmed' ? 'Chưa thanh toán' :
                                        f === 'paid' ? 'Đã thu' : 'Quá hạn'}
                        </button>
                    ))}
                </div>

                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 shadow-sm">
                    <Download size={18} />
                    Xuất báo cáo
                </button>
            </div>

            {/* Bills Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Mã / Phòng</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Kỳ hóa đơn</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Người thuê</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tổng tiền</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center">
                                        <div className="inline-block w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                    </td>
                                </tr>
                            ) : filteredBills.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        Không tìm thấy hóa đơn nào
                                    </td>
                                </tr>
                            ) : (
                                filteredBills.map((bill) => (
                                    <tr key={bill.bill_id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                                                    <FileText size={20} />
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-black text-gray-900">#{bill.bill_id}</div>
                                                    <div className="text-sm text-gray-500">Phòng {bill.room_number}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                Tháng {new Date(bill.billing_month).getMonth() + 1}/{new Date(bill.billing_month).getFullYear()}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Hạn: {new Date(bill.due_date).toLocaleDateString('vi-VN')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{bill.tenant_name}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-black text-gray-900">
                                                {bill.total_amount?.toLocaleString('vi-VN')} ₫
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getStatusBadge(bill.status)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <button
                                                onClick={() => navigate(`/landlord/bills/${bill.bill_id}`)}
                                                className="text-indigo-600 hover:text-indigo-900 font-bold flex items-center gap-1 hover:underline"
                                            >
                                                Chi tiết <ChevronRight size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default LandlordBills;
