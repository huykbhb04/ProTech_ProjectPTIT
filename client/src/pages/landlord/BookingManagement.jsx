import React, { useState, useEffect } from 'react';
import {
    Calendar, User, Search, ListFilter,
    Plus, ChevronLeft, ChevronRight, Building2, Loader, CalendarDays, CalendarClock, FilePen
} from 'lucide-react';
import bookingService from '../../services/bookingService';

const StatCard = ({ label, value, color, trend }) => (
    <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#bec9c3' }}>
        <p className="text-[11.5px] text-[#6f7a74] uppercase tracking-wider mb-1">{label}</p>
        <div className="flex items-end gap-2">
            <span className="text-[32px] font-bold" style={{ color }}>{value}</span>
            {trend && <span className="text-[11.5px] pb-2" style={{ color: '#0f6e56' }}>{trend}</span>}
        </div>
    </div>
);

const StatusBadge = ({ status }) => {
    const statusMap = {
        pending: { label: 'Đang chờ', bg: '#fef3c7', color: '#d97706' },
        confirmed: { label: 'Đã xác nhận', bg: '#e6f7f2', color: '#005440' },
        rejected: { label: 'Đã từ chối', bg: '#fee2e2', color: '#dc2626' },
        completed: { label: 'Đã hoàn thành', bg: '#e5e9e5', color: '#6f7a74' }
    };
    const s = statusMap[status] || { label: status, bg: '#e5e9e5', color: '#6f7a74' };
    return <span className="px-3 py-1 rounded-full text-[11.5px] font-bold uppercase" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>;
};

const LogPreview = ({ log }) => {
    if (!log) return <span className="text-[#6f7a74]">Không có log</span>;
    if (typeof log === 'object') {
        return (
            <div className="space-y-1 text-[13px] text-[#3f4944]">
                <div>Hành động: <strong>{log.action}</strong></div>
                <div>Thời gian: <strong>{log.confirmedAt || log.rejectedAt}</strong></div>
                <div>Lý do / ghi chú: <strong>{log.landlordNotes || log.reason || '—'}</strong></div>
                <div>Trạng thái trước: <strong>{log.previousStatus || '—'}</strong></div>
            </div>
        );
    }
    return <pre className="whitespace-pre-wrap rounded-lg bg-[#f7faf6] p-3 text-[12px] text-[#3f4944]">{String(log)}</pre>;
};

const BookingCard = ({ booking, onConfirm, onReject, onViewLog }) => {
    const isPending = booking.status === 'pending';
    const confirmLog = booking.confirm_log ? (() => { try { return JSON.parse(booking.confirm_log); } catch { return booking.confirm_log; } })() : null;

    return (
        <div className="bg-white p-6 rounded-[12px] border flex items-center justify-between hover:bg-[#f9fbfc] transition-all" style={{ borderColor: '#bec9c3' }}>
            <div className="flex items-center gap-6 w-1/4">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#e0e7ff' }}>
                    <User style={{ width: 24, height: 24, color: '#4338ca' }} />
                </div>
                <div>
                    <h4 className="font-bold text-[16px] text-[#181d1a]">{booking.tenant_name}</h4>
                    <p className="text-[14px] text-[#3f4944]">{booking.tenant_phone || 'Chưa có'}</p>
                </div>
            </div>
            <div className="flex flex-col gap-1 w-1/4">
                <div className="flex items-center gap-2 text-[14px]">
                    <Building2 style={{ width: 20, height: 20, color: '#0f6e56' }} />
                    <span className="font-semibold">{booking.building_name} - Phòng {booking.room_number}</span>
                </div>
                <div className="flex items-center gap-4 text-[#6f7a74] text-[14px]">
                    <span className="flex items-center gap-1"><CalendarDays style={{ width: 16, height: 16 }} />{booking.scheduled_date ? new Date(booking.scheduled_date).toLocaleDateString('vi-VN') : 'Chưa xác định'}</span>
                    <span className="flex items-center gap-1"><CalendarClock style={{ width: 16, height: 16 }} />{booking.scheduled_time || 'N/A'}</span>
                </div>
            </div>
            <div className="flex items-center justify-center w-1/4">
                <div className="flex flex-col items-center gap-2">
                    <StatusBadge status={booking.status} />
                    <button onClick={() => onViewLog(booking)} className="text-[12px] text-[#0f6e56] font-semibold underline">Xem log</button>
                </div>
            </div>
            <div className="flex items-center gap-2 w-1/4 justify-end">
                {isPending ? (
                    <>
                        <button onClick={() => onConfirm(booking)} className="px-4 py-2 rounded-lg text-[14px] font-semibold text-white hover:opacity-90 transition-all" style={{ backgroundColor: '#0f6e56' }}>Xác nhận</button>
                        <button onClick={() => onReject(booking.booking_id)} className="px-4 py-2 rounded-lg text-[14px] font-semibold border hover:bg-[#fee2e2] transition-all" style={{ borderColor: '#dc2626', color: '#dc2626' }}>Từ chối</button>
                    </>
                ) : booking.status === 'completed' ? (
                    <button className="flex items-center gap-1 px-4 py-2 rounded-lg text-[14px] font-semibold border hover:border-[#0f6e56] hover:text-[#0f6e56] transition-all" style={{ borderColor: '#bec9c3', color: '#3f4944' }}><FilePen style={{ width: 16, height: 16 }} />Tạo hợp đồng</button>
                ) : (
                    <button className="px-4 py-2 rounded-lg text-[14px] font-semibold border hover:border-[#0f6e56] hover:text-[#0f6e56] transition-all" style={{ borderColor: '#bec9c3', color: '#3f4944' }}>Chi tiết</button>
                )}
            </div>
        </div>
    );
};

const ConfirmModal = ({ booking, onClose, onConfirm, loading }) => {
    const [form, setForm] = useState({ leadName: '', leadPhone: '', notes: '' });
    if (!booking) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-[16px] w-full max-w-md shadow-xl" style={{ fontFamily: "'Be Vietnam Pro', sans-serif" }}>
                <div className="p-6 border-b" style={{ borderColor: '#bec9c3', backgroundColor: '#f7faf6' }}><h3 className="text-[20px] font-bold text-[#181d1a]">Xác nhận lịch hẹn</h3></div>
                <div className="p-6 space-y-4">
                    <div className="p-4 rounded-xl" style={{ backgroundColor: '#e6f7f2' }}><p className="text-[14px] text-[#181d1a]">Hệ thống sẽ tự động gửi thông báo xác nhận cho khách hàng <strong>{booking.tenant_name}</strong>.</p></div>
                    <div className="space-y-3">
                        <input value={form.leadName} onChange={(e) => setForm({ ...form, leadName: e.target.value })} className="w-full rounded-lg border px-3 py-2" placeholder="Người dẫn xem" />
                        <input value={form.leadPhone} onChange={(e) => setForm({ ...form, leadPhone: e.target.value })} className="w-full rounded-lg border px-3 py-2" placeholder="Số điện thoại" />
                        <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full rounded-lg border px-3 py-2" placeholder="Ghi chú" rows={3} />
                    </div>
                    <button onClick={() => onConfirm(form)} disabled={loading} className="w-full py-3 rounded-lg text-white font-semibold text-[14px] hover:opacity-90 transition-all disabled:opacity-50" style={{ backgroundColor: '#0f6e56' }}>{loading ? 'Đang xử lý...' : 'Xác nhận ngay'}</button>
                </div>
            </div>
        </div>
    );
};

const LogModal = ({ booking, onClose }) => {
    if (!booking) return null;
    const log = booking.confirm_log ? (() => { try { return JSON.parse(booking.confirm_log); } catch { return booking.confirm_log; } })() : null;
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div className="relative bg-white rounded-[16px] w-full max-w-lg shadow-xl">
                <div className="p-6 border-b" style={{ borderColor: '#bec9c3', backgroundColor: '#f7faf6' }}><h3 className="text-[20px] font-bold text-[#181d1a]">Confirm log</h3></div>
                <div className="p-6"><LogPreview log={log} /></div>
                <div className="p-6 border-t" style={{ borderColor: '#bec9c3' }}><button onClick={onClose} className="w-full py-2 rounded-lg border">Đóng</button></div>
            </div>
        </div>
    );
};

const BookingManagement = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [confirmModal, setConfirmModal] = useState(null);
    const [logModal, setLogModal] = useState(null);
    const [confirming, setConfirming] = useState(false);

    useEffect(() => { fetchBookings(); }, []);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const data = await bookingService.getLandlordBookings();
            setBookings(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error fetching bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirm = async (formData) => {
        setConfirming(true);
        try {
            await bookingService.confirmBooking(confirmModal.booking_id, {
                leadPersonName: formData.leadName,
                leadPersonPhone: formData.leadPhone,
                landlordNotes: formData.notes,
            });
            setConfirmModal(null);
            fetchBookings();
            alert('Đã xác nhận lịch xem phòng thành công!');
        } catch (error) {
            alert('Lỗi: ' + (error.response?.data?.message || error.message));
        } finally {
            setConfirming(false);
        }
    };

    const handleReject = async (id) => {
        const reason = window.prompt('Nhập lý do từ chối (không bắt buộc):', '');
        if (window.confirm('Bạn có chắc muốn từ chối lịch hẹn này?')) {
            try {
                await bookingService.rejectBooking(id, { reason });
                fetchBookings();
            } catch (error) {
                alert('Lỗi: ' + error.message);
            }
        }
    };

    const filtered = bookings.filter(b => {
        const matchesSearch = b.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) || b.building_name?.toLowerCase().includes(searchTerm.toLowerCase()) || b.room_number?.toString().includes(searchTerm);
        const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const stats = { total: bookings.length, pending: bookings.filter(b => b.status === 'pending').length, confirmed: bookings.filter(b => b.status === 'confirmed').length };

    return (
        <div className="min-h-screen pb-20" style={{ backgroundColor: '#f7faf6', fontFamily: "'Be Vietnam Pro', sans-serif", paddingTop: '80px', paddingLeft: '24px', paddingRight: '24px', maxWidth: '1280px', margin: '0 auto' }}>
            <div className="flex items-end justify-between mb-6">
                <div><p className="text-[11.5px] font-semibold uppercase tracking-wider text-[#6f7a74] mb-1">Quản lý</p><h1 className="text-[24px] font-semibold text-[#181d1a] leading-8">Lịch hẹn xem phòng</h1></div>
                <div className="flex items-center gap-3"><button className="flex items-center gap-2 px-4 py-2 rounded-lg text-[14px] font-semibold text-white hover:opacity-90 transition-all" style={{ backgroundColor: '#0f6e56' }}><Plus style={{ width: 16, height: 16 }} />Thêm tòa nhà</button></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <StatCard label="Tổng số lịch hẹn" value={stats.total} color="#181d1a" trend="+12% tháng này" />
                <StatCard label="Đang chờ duyệt" value={stats.pending} color="#b45309" trend="Cần xử lý ngay" />
                <StatCard label="Đã xác nhận" value={stats.confirmed} color="#0f6e56" trend="Thành công cao" />
            </div>
            <div className="p-4 rounded-xl flex flex-wrap items-center justify-between gap-4 mb-6" style={{ backgroundColor: '#f1f4f1', border: '1px solid #bec9c3' }}>
                <div className="relative flex-grow max-w-md"><Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, color: '#6f7a74' }} /><input type="text" placeholder="Tìm kiếm khách hàng..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 rounded-lg border text-[14px] focus:outline-none focus:border-[#0f6e56]" style={{ borderColor: '#bec9c3', backgroundColor: 'white' }} /></div>
                <div className="flex items-center gap-2"><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-4 py-2 rounded-lg border text-[14px] focus:outline-none focus:border-[#0f6e56]" style={{ borderColor: '#bec9c3', backgroundColor: 'white' }}><option value="all">Tất cả trạng thái</option><option value="pending">Đang chờ</option><option value="confirmed">Đã xác nhận</option><option value="rejected">Từ chối</option><option value="completed">Đã hoàn thành</option></select><button className="flex items-center gap-1 px-4 py-2 rounded-lg text-[14px] font-semibold border hover:bg-[#ebefeb] transition-colors" style={{ borderColor: '#bec9c3', color: '#3f4944' }}><ListFilter style={{ width: 16, height: 16 }} />Lọc nâng cao</button><button className="flex items-center gap-1 px-4 py-2 rounded-lg text-[14px] font-semibold border hover:bg-[#ebefeb] transition-colors" style={{ borderColor: '#bec9c3', color: '#3f4944' }}><Plus style={{ width: 16, height: 16 }} />Xuất file</button></div>
            </div>
            <div className="flex flex-col gap-4 mb-6">
                {loading ? <div className="flex justify-center py-20"><Loader style={{ width: 24, height: 24, color: '#bec9c3' }} className="animate-spin" /></div> : filtered.length === 0 ? <div className="bg-white rounded-xl border p-16 text-center" style={{ borderColor: '#bec9c3' }}><Calendar style={{ width: 48, height: 48, color: '#bec9c3', margin: '0 auto' }} /><p className="text-[14px] font-semibold text-[#6f7a74] mt-4">Không có lịch hẹn nào</p></div> : filtered.map(booking => <BookingCard key={booking.booking_id} booking={booking} onConfirm={setConfirmModal} onReject={handleReject} onViewLog={setLogModal} />)}
            </div>
            <div className="flex items-center justify-between border-t pt-6" style={{ borderColor: '#bec9c3' }}><span className="text-[14px] text-[#6f7a74]">Hiển thị {filtered.length}/{stats.total} kết quả</span><div className="flex items-center gap-1"><button className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-[#ebefeb] transition-colors" style={{ borderColor: '#bec9c3' }}><ChevronLeft style={{ width: 16, height: 16, color: '#6f7a74' }} /></button><button className="w-10 h-10 rounded-lg text-[14px] font-bold flex items-center justify-center transition-colors" style={{ backgroundColor: '#0f6e56', color: 'white' }}>1</button><button className="w-10 h-10 rounded-lg border flex items-center justify-center hover:bg-[#ebefeb] transition-colors" style={{ borderColor: '#bec9c3' }}><ChevronRight style={{ width: 16, height: 16, color: '#6f7a74' }} /></button></div></div>
            <button className="fixed bottom-6 right-6 w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform z-50" style={{ backgroundColor: '#0f6e56', color: 'white' }}><Plus style={{ width: 28, height: 28 }} /></button>
            <ConfirmModal booking={confirmModal} onClose={() => setConfirmModal(null)} onConfirm={handleConfirm} loading={confirming} />
            <LogModal booking={logModal} onClose={() => setLogModal(null)} />
        </div>
    );
};

export default BookingManagement;
