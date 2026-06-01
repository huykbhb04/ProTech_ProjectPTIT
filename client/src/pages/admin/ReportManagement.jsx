import React, { useState, useEffect } from 'react';
import { 
    ShieldAlert, AlertTriangle, PhoneCall, CheckCircle, XCircle, 
    Image as ImageIcon, Loader2, ExternalLink, Calendar, User, 
    FileText, Check, Ban, EyeOff, ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import reportService from '../../services/reportService';

const ReportManagement = () => {
    const [activeTab, setActiveTab] = useState('reports'); // 'reports' or 'disputes'
    const [reports, setReports] = useState([]);
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    
    // Modals & Inputs
    const [selectedItem, setSelectedItem] = useState(null);
    const [showNotesModal, setShowNotesModal] = useState(false);
    const [adminNotes, setAdminNotes] = useState('');
    const [notesAction, setNotesAction] = useState(''); // 'lock_listing', 'block_user', 'dismiss', 'approve_dispute', 'reject_dispute'
    
    const [showImageLightbox, setShowImageLightbox] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (activeTab === 'reports') {
                const data = await reportService.adminGetReports();
                setReports(data);
            } else {
                const data = await reportService.adminGetDisputes();
                setDisputes(data);
            }
        } catch (err) {
            console.error('Error fetching admin reports/disputes:', err);
            toast.error('Lỗi khi tải dữ liệu từ máy chủ.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const handleActionClick = (item, action) => {
        setSelectedItem(item);
        setNotesAction(action);
        setAdminNotes('');
        setShowNotesModal(true);
    };

    const handleConfirmAction = async () => {
        if (!selectedItem) return;
        setActionLoading(true);
        try {
            if (activeTab === 'reports') {
                await reportService.adminResolveReport(selectedItem.report_id, {
                    action: notesAction,
                    adminNotes
                });
                toast.success('Xử lý phản ánh thành công!');
            } else {
                // For disputes: notesAction is 'approve_dispute' or 'reject_dispute'
                const action = notesAction === 'approve_dispute' ? 'approve' : 'reject';
                await reportService.adminResolveDispute(selectedItem.dispute_id, {
                    action,
                    adminNotes
                });
                toast.success('Xử lý khiếu nại thành công!');
            }
            setShowNotesModal(false);
            setSelectedItem(null);
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra khi xử lý.');
        } finally {
            setActionLoading(false);
        }
    };

    const formatTime = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return d.toLocaleDateString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getReasonLabel = (reason) => {
        const map = {
            'fraud': 'Lừa đảo',
            'duplicate': 'Trùng lặp',
            'no_contact': 'Không liên hệ được',
            'fake_info': 'Sai thực tế',
            'other': 'Lý do khác'
        };
        return map[reason] || reason;
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto p-2">
            
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-5">
                <div>
                    <h1 className="text-[28px] font-black text-gray-900 leading-9 tracking-tight flex items-center gap-3">
                        <ShieldAlert className="text-red-500 shrink-0" size={32} />
                        Quản lý Phản ánh & Khiếu nại
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Duyệt phản ánh tin đăng bất thường từ người thuê và khiếu nại giải trình của chủ trọ.</p>
                </div>

                {/* Tabs */}
                <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200/50 shrink-0">
                    <button 
                        onClick={() => setActiveTab('reports')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'reports' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Phản ánh tin đăng ({reports.length})
                    </button>
                    <button 
                        onClick={() => setActiveTab('disputes')}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${activeTab === 'disputes' ? 'bg-white text-indigo-600 shadow-md' : 'text-gray-500 hover:text-gray-900'}`}
                    >
                        Đơn khiếu nại chủ trọ ({disputes.length})
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                    <Loader2 className="animate-spin text-indigo-600" size={40} />
                </div>
            ) : (
                <div className="bg-white rounded-3xl border border-gray-200/50 shadow-xl overflow-hidden">
                    {activeTab === 'reports' ? (
                        /* REPORTS TABLE */
                        reports.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-400 text-[10.5px] font-black uppercase tracking-wider border-b border-gray-100">
                                            <th className="px-6 py-4">Mã / Thời gian</th>
                                            <th className="px-6 py-4">Tin đăng / Chủ trọ</th>
                                            <th className="px-6 py-4">Người phản ánh</th>
                                            <th className="px-6 py-4">Lý do & Mô tả</th>
                                            <th className="px-6 py-4">Bộ lọc / Trạng thái</th>
                                            <th className="px-6 py-4 text-right">Phán quyết</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {reports.map((report) => {
                                            const isFraud = report.reason === 'fraud';
                                            const isUrgent = isFraud && report.listing_status === 'hidden';
                                            return (
                                                <tr key={report.report_id} className={`transition-colors hover:bg-gray-50/50 ${isUrgent ? 'bg-red-50/20' : ''}`}>
                                                    <td className="px-6 py-4 space-y-1">
                                                        <span className="font-mono text-xs text-gray-500">#RP-{report.report_id}</span>
                                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Calendar size={12} /> {formatTime(report.created_at)}
                                                        </p>
                                                    </td>
                                                    <td className="px-6 py-4 max-w-[280px]">
                                                        <div className="space-y-1">
                                                            <p className="font-semibold text-gray-800 line-clamp-1">{report.listing_title}</p>
                                                            <div className="text-xs text-gray-500 flex flex-wrap items-center gap-1.5">
                                                                <span className="font-medium">{report.landlord_name}</span>
                                                                <span>·</span>
                                                                <a 
                                                                    href={`tel:${report.landlord_phone}`} 
                                                                    className="text-indigo-600 font-bold hover:underline flex items-center gap-0.5 inline-flex"
                                                                    title="Hotline đối chất trực tiếp"
                                                                >
                                                                    <PhoneCall size={10} /> {report.landlord_phone}
                                                                </a>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 space-y-1">
                                                        <p className="font-bold text-gray-700">{report.reporter_name}</p>
                                                        <p className="text-xs text-gray-400 font-medium">{report.reporter_phone}</p>
                                                        <p className="text-[10px] text-slate-400">IP: {report.ip_address}</p>
                                                    </td>
                                                    <td className="px-6 py-4 max-w-[320px] space-y-1">
                                                        <span className={`inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded ${isFraud ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                                                            {getReasonLabel(report.reason)}
                                                        </span>
                                                        <p className="text-gray-600 text-xs line-clamp-2 leading-relaxed">{report.description || 'Không có mô tả chi tiết.'}</p>
                                                    </td>
                                                    <td className="px-6 py-4 space-y-1.5">
                                                        {/* Status badges */}
                                                        <div>
                                                            {report.listing_status === 'hidden' ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-red-100 text-red-700 border border-red-200 rounded-full text-[10px] font-extrabold uppercase">
                                                                    ⚠ Bot tự động ẩn
                                                                </span>
                                                            ) : report.listing_status === 'locked' ? (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200 rounded-full text-[10px] font-extrabold uppercase">
                                                                    🔒 Bị khóa vĩnh viễn
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-green-100 text-green-700 border border-green-200 rounded-full text-[10px] font-extrabold uppercase">
                                                                    ✓ Đang hoạt động
                                                                </span>
                                                            )}
                                                        </div>
                                                        {report.status === 'pending' ? (
                                                            <span className="text-[11px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">Chờ xử lý</span>
                                                        ) : (
                                                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${report.status === 'resolved_lock' ? 'text-red-500 bg-red-50 border border-red-200' : 'text-slate-500 bg-slate-50 border border-slate-200'}`}>
                                                                {report.status === 'resolved_lock' ? 'Đã khóa' : 'Đã bỏ qua'}
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        {report.status === 'pending' ? (
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <button 
                                                                    onClick={() => handleActionClick(report, 'lock_listing')}
                                                                    className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl transition-all"
                                                                    title="Khóa tin đăng vĩnh viễn"
                                                                >
                                                                    <EyeOff size={16} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleActionClick(report, 'block_user')}
                                                                    className="p-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-xl transition-all"
                                                                    title="Khóa tài khoản chủ nhà"
                                                                >
                                                                    <Ban size={16} />
                                                                </button>
                                                                <button 
                                                                    onClick={() => handleActionClick(report, 'dismiss')}
                                                                    className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-xl transition-all"
                                                                    title="Bỏ qua phản ánh (Khôi phục hiển thị)"
                                                                >
                                                                    <Check size={16} />
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs text-gray-400 italic">Đã giải quyết</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-20 text-center text-gray-400 space-y-3">
                                <ShieldCheck size={48} className="mx-auto opacity-35 text-indigo-500" />
                                <p className="font-bold">Tuyệt vời! Không có phản ánh nào cần xử lý.</p>
                            </div>
                        )
                    ) : (
                        /* DISPUTES TABLE */
                        disputes.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-400 text-[10.5px] font-black uppercase tracking-wider border-b border-gray-100">
                                            <th className="px-6 py-4">Mã / Thời gian</th>
                                            <th className="px-6 py-4">Tin đăng / Chủ trọ</th>
                                            <th className="px-6 py-4">Giải trình khiếu nại</th>
                                            <th className="px-6 py-4">Bằng chứng hình ảnh</th>
                                            <th className="px-6 py-4">Trạng thái khiếu nại</th>
                                            <th className="px-6 py-4 text-right">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 text-sm">
                                        {disputes.map((dispute) => (
                                            <tr key={dispute.dispute_id} className="transition-colors hover:bg-gray-50/50">
                                                <td className="px-6 py-4 space-y-1">
                                                    <span className="font-mono text-xs text-gray-500">#DP-{dispute.dispute_id}</span>
                                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Calendar size={12} /> {formatTime(dispute.created_at)}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 max-w-[240px]">
                                                    <div className="space-y-1">
                                                        <p className="font-semibold text-gray-800 line-clamp-1">{dispute.listing_title}</p>
                                                        <div className="text-xs text-gray-500 flex flex-wrap items-center gap-1.5">
                                                            <span className="font-medium">{dispute.landlord_name}</span>
                                                            <span>·</span>
                                                            <a 
                                                                href={`tel:${dispute.landlord_phone}`} 
                                                                className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-0.5"
                                                            >
                                                                <PhoneCall size={10} /> {dispute.landlord_phone}
                                                            </a>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 max-w-[340px]">
                                                    <p className="text-gray-700 text-xs leading-relaxed font-medium">{dispute.explanation}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-1.5 flex-wrap">
                                                        {dispute.proof_images && dispute.proof_images.length > 0 ? (
                                                            dispute.proof_images.map((img, idx) => (
                                                                <button 
                                                                    key={idx} 
                                                                    onClick={() => setShowImageLightbox(img)}
                                                                    className="w-12 h-12 rounded-lg overflow-hidden border border-gray-200 bg-gray-50 hover:opacity-85 transition-opacity"
                                                                >
                                                                    <img src={img} alt="proof" className="w-full h-full object-cover" />
                                                                </button>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-gray-400">Không có ảnh</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 space-y-1">
                                                    {dispute.status === 'pending' ? (
                                                        <span className="text-[11px] font-bold text-amber-500 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded">Đang khiếu nại</span>
                                                    ) : (
                                                        <span className={`inline-flex items-center gap-0.5 px-2.5 py-0.5 border rounded-full text-[10px] font-extrabold uppercase ${dispute.status === 'resolved_approved' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                                            {dispute.status === 'resolved_approved' ? 'Đã duyệt (Phục hồi)' : 'Từ chối (Giữ phạt)'}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {dispute.status === 'pending' ? (
                                                        <div className="flex items-center justify-end gap-1.5">
                                                            <button 
                                                                onClick={() => handleActionClick(dispute, 'approve_dispute')}
                                                                className="px-3 py-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded-xl text-xs font-bold transition-all"
                                                                title="Phê duyệt khiếu nại (Kích hoạt lại tin)"
                                                            >
                                                                Duyệt
                                                            </button>
                                                            <button 
                                                                onClick={() => handleActionClick(dispute, 'reject_dispute')}
                                                                className="px-3 py-1.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl text-xs font-bold transition-all"
                                                                title="Từ chối khiếu nại (Giữ phạt)"
                                                            >
                                                                Từ chối
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-gray-400 italic">Đã xử lý</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-20 text-center text-gray-400 space-y-3">
                                <FileText size={48} className="mx-auto opacity-35 text-indigo-500" />
                                <p className="font-bold">Không có đơn khiếu nại nào hiện tại.</p>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* NOTES MODAL */}
            {showNotesModal && selectedItem && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm">
                    <div className="w-full max-w-md overflow-hidden rounded-[24px] bg-white shadow-2xl animate-in zoom-in duration-200">
                        <div className="border-b border-gray-100 bg-slate-900 px-6 py-5 text-white">
                            <h3 className="text-lg font-bold">Xác nhận phán quyết</h3>
                            <p className="mt-0.5 text-xs text-white/75">Lập hồ sơ lý do xử lý phản ánh / khiếu nại này.</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-slate-50 border rounded-2xl p-4 space-y-1 text-xs">
                                <div className="flex justify-between"><span className="text-gray-400">Đối tượng:</span><strong className="text-gray-800">{selectedItem.listing_title}</strong></div>
                                <div className="flex justify-between"><span className="text-gray-400">Chủ trọ:</span><strong className="text-slate-700">{selectedItem.landlord_name}</strong></div>
                                <div className="flex justify-between"><span className="text-gray-400">Quyết định:</span>
                                    <strong className="text-indigo-600">
                                        {notesAction === 'lock_listing' && 'Khóa tin đăng vĩnh viễn'}
                                        {notesAction === 'block_user' && 'Khóa tài khoản chủ nhà'}
                                        {notesAction === 'dismiss' && 'Bỏ qua báo cáo (Kích hoạt lại)'}
                                        {notesAction === 'approve_dispute' && 'Chấp nhận khiếu nại (Kích hoạt lại)'}
                                        {notesAction === 'reject_dispute' && 'Từ chối khiếu nại'}
                                    </strong>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">Ghi chú xử lý / Lý do gửi chủ nhà</label>
                                <textarea 
                                    rows="3" 
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    placeholder="Vd: Tin đăng sai giá thực tế quá nhiều lần. Khóa tin để làm gương..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-slate-500 outline-none placeholder:text-gray-400 text-slate-800 font-medium"
                                />
                            </div>

                            <div className="flex justify-end gap-3 pt-2">
                                <button 
                                    onClick={() => { setShowNotesModal(false); setSelectedItem(null); }}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
                                >
                                    Hủy
                                </button>
                                <button 
                                    onClick={handleConfirmAction}
                                    disabled={actionLoading}
                                    className="rounded-xl bg-slate-900 hover:bg-slate-950 text-white px-5 py-2.5 text-xs font-bold flex items-center gap-1.5 shadow-lg"
                                >
                                    {actionLoading && <Loader2 className="animate-spin" size={14} />}
                                    Xác nhận phán quyết
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* IMAGE LIGHTBOX */}
            {showImageLightbox && (
                <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/90 p-4" onClick={() => setShowImageLightbox(null)}>
                    <button className="absolute right-6 top-6 text-white/70 hover:text-white" onClick={() => setShowImageLightbox(null)}>
                        <XCircle size={32} />
                    </button>
                    <img src={showImageLightbox} alt="Proof Large" className="max-h-[85vh] max-w-[90vw] object-contain rounded-xl shadow-2xl" onClick={(e) => e.stopPropagation()} />
                </div>
            )}
        </div>
    );
};

export default ReportManagement;
