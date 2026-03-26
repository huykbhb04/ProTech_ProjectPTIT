import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Calendar, DollarSign, ChevronRight,
    Clock, CheckCircle2, AlertCircle, Filter
} from 'lucide-react';
import api from '../../services/api';

const TenantBills = () => {
    const navigate = useNavigate();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, pending, paid, overdue

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        try {
            const res = await api.get('/bills/tenant/list');
            setBills(res.data);
        } catch (error) {
            console.error('Error fetching bills:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'paid': return 'bg-green-100 text-green-700';
            case 'pending': return 'bg-yellow-100 text-yellow-700';
            case 'overdue': return 'bg-red-100 text-red-700';
            case 'confirmed': return 'bg-blue-100 text-blue-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'paid': return 'Đã thanh toán';
            case 'pending': return 'Chờ thanh toán';
            case 'overdue': return 'Quá hạn';
            case 'confirmed': return 'Chờ duyệt';
            default: return status;
        }
    };

    const filteredBills = bills.filter(bill => {
        if (filter === 'all') return true;
        return bill.status === filter;
    });

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto px-4 md:px-10 py-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Hóa đơn & Thanh toán</h1>
                    <p className="text-gray-500 font-medium mt-1">Quản lý hóa đơn điện nước hàng tháng</p>
                </div>

                {/* Filter */}
                <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                    {['all', 'pending', 'paid'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${filter === f
                                ? 'bg-indigo-100 text-indigo-700 shadow-sm'
                                : 'text-gray-500 hover:bg-gray-50'
                                }`}
                        >
                            {f === 'all' ? 'Tất cả' : f === 'pending' ? 'Chưa trả' : 'Đã trả'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBills.length > 0 ? (
                    filteredBills.map((bill) => (
                        <div
                            key={bill.bill_id}
                            onClick={() => navigate(`/tenant/bills/${bill.bill_id}`)}
                            className="bg-white rounded-2xl p-6 shadow-lg shadow-indigo-100 border border-white/50 hover:border-indigo-200 transition-all cursor-pointer group"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bill.status === 'paid' ? 'bg-green-100 text-green-600' :
                                        bill.status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'
                                        }`}>
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                            Tháng {new Date(bill.billing_month).getMonth() + 1}/{new Date(bill.billing_month).getFullYear()}
                                        </p>
                                        <h3 className="text-xl font-black text-gray-900">
                                            {bill.total_amount.toLocaleString('vi-VN')} ₫
                                        </h3>
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getStatusColor(bill.status)}`}>
                                    {getStatusText(bill.status)}
                                </span>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 flex items-center gap-2">
                                        <Calendar size={16} /> Hạn thanh toán
                                    </span>
                                    <span className={`font-semibold ${new Date(bill.due_date) < new Date() && bill.status !== 'paid' ? 'text-red-600' : 'text-gray-900'
                                        }`}>
                                        {new Date(bill.due_date).toLocaleDateString('vi-VN')}
                                    </span>
                                </div>
                                <div className="h-px bg-gray-100"></div>
                                <div className="flex justify-between items-center text-indigo-600 font-bold text-sm group-hover:translate-x-1 transition-transform">
                                    Xem chi tiết
                                    <ChevronRight size={16} />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full flex flex-col items-center justify-center py-12 text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 mb-4">
                            <FileText size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">Không có hóa đơn nào</h3>
                        <p className="text-gray-500">Bạn chưa có hóa đơn nào trong danh mục này</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TenantBills;
