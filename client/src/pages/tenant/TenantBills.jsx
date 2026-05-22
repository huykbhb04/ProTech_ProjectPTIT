import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Calendar, ChevronRight, Loader } from 'lucide-react';
import api from '../../services/api';

/* ── Status helpers ── */
const billBadge = s => ({ paid: 'badge-success', pending: 'badge-warning', overdue: 'badge-danger', confirmed: 'badge-info' }[s] || 'badge-muted');
const billLabel = s => ({ paid: 'Đã thanh toán', pending: 'Chờ thanh toán', overdue: 'Quá hạn', confirmed: 'Chờ duyệt' }[s] || s);

const FILTERS = [
    { id: 'all', label: 'Tất cả' },
    { id: 'pending', label: 'Chưa trả' },
    { id: 'paid', label: 'Đã trả' },
    { id: 'overdue', label: 'Quá hạn' },
];

const TenantBills = () => {
    const navigate = useNavigate();
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        api.get('/bills/tenant/list')
            .then(r => setBills(r.data))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const filtered = bills.filter(b => filter === 'all' ? true : b.status === filter);
    const unpaidTotal = bills.filter(b => b.status !== 'paid').reduce((s, b) => s + (b.total_amount || 0), 0);

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <Loader size={24} className="animate-spin text-gray-300" />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8 space-y-8 animate-fade-in-up">

            {/* ── Header ── */}
            <div className="section-divider">
                <p className="section-label mb-2">Tài chính</p>
                <h1 className="page-title">Hóa đơn & Thanh toán</h1>
            </div>

            {/* ── Summary Banner ── */}
            {unpaidTotal > 0 && (
                <div className="bg-black text-white p-5 flex items-center justify-between">
                    <div>
                        <p className="section-label text-gray-500 mb-1">Còn phải thanh toán</p>
                        <p className="text-2xl font-black tracking-tighter">{unpaidTotal.toLocaleString('vi-VN')} ₫</p>
                    </div>
                    <Calendar size={28} className="text-gray-600" />
                </div>
            )}

            {/* ── Filters ── */}
            <div className="flex gap-1 overflow-x-auto scrollbar-hide">
                {FILTERS.map(f => (
                    <button key={f.id} onClick={() => setFilter(f.id)}
                        className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
                            filter === f.id ? 'bg-black text-white border-black' : 'border-gray-200 text-gray-500 hover:border-gray-400 bg-white'
                        }`}>
                        {f.label}
                    </button>
                ))}
            </div>

            {/* ── Bill Cards ── */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filtered.map(bill => {
                        const isOverdue = new Date(bill.due_date) < new Date() && bill.status !== 'paid';
                        return (
                            <div key={bill.bill_id}
                                onClick={() => navigate(`/tenant/bills/${bill.bill_id}`)}
                                className="card-hover p-5 cursor-pointer group">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 flex items-center justify-center ${
                                            bill.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                                            isOverdue ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'
                                        }`}>
                                            <FileText size={18} />
                                        </div>
                                        <div>
                                            <p className="section-label">
                                                Tháng {new Date(bill.billing_month).getMonth() + 1}/{new Date(bill.billing_month).getFullYear()}
                                            </p>
                                            <p className="text-xl font-black text-black tracking-tighter">
                                                {bill.total_amount.toLocaleString('vi-VN')} ₫
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`badge ${billBadge(bill.status)}`}>{billLabel(bill.status)}</span>
                                </div>

                                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                                    <p className={`meta-text ${isOverdue ? 'text-red-500' : 'text-gray-400'}`}>
                                        Hạn: {new Date(bill.due_date).toLocaleDateString('vi-VN')}
                                    </p>
                                    <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-indigo-600 group-hover:text-black transition-colors">
                                        Xem chi tiết <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="empty-state border border-dashed border-gray-200">
                    <FileText size={32} className="text-gray-200 mx-auto mb-4" />
                    <p className="empty-state-text">Không có hóa đơn nào</p>
                </div>
            )}
        </div>
    );
};

export default TenantBills;
