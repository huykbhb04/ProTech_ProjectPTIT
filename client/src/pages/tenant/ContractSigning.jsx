import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft, CircleCheck, ShieldCheck, PenTool,
    Building2, User, FileText, Calendar, Users, Upload,
    Info, Phone, Mail, MapPin, Home, CheckCircle2,
    ChevronRight, Loader2, AlertCircle
} from 'lucide-react';
import SignaturePad from 'react-signature-canvas';
import { toast } from 'react-hot-toast';
import contractService from '../../services/contractService';

/* ─── constants ─────────────────────────────────────── */
const DURATION_OPTIONS = [
    { months: 3,  label: '3 tháng' },
    { months: 6,  label: '6 tháng' },
    { months: 12, label: '12 tháng' },
    { months: 24, label: '24 tháng' },
];
const OCCUPANT_OPTIONS = [1, 2, 3, 4, 5];

/* ─── helpers ───────────────────────────────────────── */
const fmt = (n) => new Intl.NumberFormat('vi-VN').format(n ?? 0);
const fmtDate = (s) => {
    if (!s) return '--';
    return new Date(s).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};
const addMonths = (dateStr, m) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    d.setMonth(d.getMonth() + m);
    return d.toISOString().split('T')[0];
};
const parseTerms = (content) => {
    if (!content) return [];
    try {
        const parsed = typeof content === 'string' ? JSON.parse(content) : content;
        return Array.isArray(parsed?.terms) ? parsed.terms : [];
    } catch { return []; }
};

/* ─── sub-components ─────────────────────────────────── */
const StepBadge = ({ n, done }) => (
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 transition-colors ${
        done ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'
    }`}>
        {done ? <CheckCircle2 size={16} /> : n}
    </div>
);

const InfoRow = ({ label, value, accent }) => (
    <div className="flex justify-between items-center py-3 border-b border-gray-100/60 last:border-0">
        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</span>
        <span className={`font-black ${accent ? 'text-indigo-600' : 'text-gray-900'}`}>{value}</span>
    </div>
);

const ImageUploadBox = ({ label, preview, onChange }) => (
    <div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">{label}</p>
        <label className="relative block aspect-[3/2] rounded-2xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-indigo-400 transition-colors cursor-pointer bg-gray-50/50 group">
            {preview ? (
                <img src={preview} className="absolute inset-0 w-full h-full object-cover" alt={label} />
            ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-300 group-hover:text-indigo-400 transition-colors">
                    <Upload size={26} />
                    <p className="text-[9px] font-bold uppercase tracking-wider">Tải ảnh lên</p>
                </div>
            )}
            <input type="file" className="hidden" accept="image/*" onChange={onChange} />
        </label>
    </div>
);

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════ */
const ContractSigning = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const signaturePadRef = useRef(null);

    /* state */
    const [contract, setContract]   = useState(null);
    const [loading, setLoading]     = useState(true);
    const [signing, setSigning]     = useState(false);
    const [activeStep, setActiveStep] = useState(0);

    /* personal info */
    const [info, setInfo] = useState({ full_name: '', id_number: '', dob: '', address: '' });

    /* CCCD images */
    const [frontFile, setFrontFile]       = useState(null);
    const [frontPreview, setFrontPreview] = useState(null);
    const [backFile, setBackFile]         = useState(null);
    const [backPreview, setBackPreview]   = useState(null);

    /* contract options */
    const [duration, setDuration]   = useState(12);
    const [occupants, setOccupants] = useState(1);

    /* commitments */
    const [commits, setCommits] = useState({
        read: false, agree: false, correct: false, legal: false
    });
    const allCommitted = Object.values(commits).every(Boolean);

    /* computed */
    const endDate = contract?.start_date ? addMonths(contract.start_date, duration) : '';
    const terms   = parseTerms(contract?.contract_content);

    /* ── fetch contract ── */
    useEffect(() => {
        (async () => {
            try {
                const data = await contractService.getContractDetail(id);
                setContract(data);
                // pre-fill if tenant info already saved
                if (data.tenant_full_name) {
                    setInfo({
                        full_name: data.tenant_full_name,
                        id_number: data.tenant_id_number || '',
                        dob: data.tenant_dob ? data.tenant_dob.split('T')[0] : '',
                        address: data.tenant_address || ''
                    });
                }
                // detect contract duration from DB and snap to nearest option
                if (data.start_date && data.end_date) {
                    const months = Math.round(
                        (new Date(data.end_date) - new Date(data.start_date)) / (1000 * 60 * 60 * 24 * 30)
                    );
                    const closest = DURATION_OPTIONS.reduce((p, c) =>
                        Math.abs(c.months - months) < Math.abs(p.months - months) ? c : p
                    );
                    setDuration(closest.months);
                }
            } catch {
                toast.error('Không thể tải thông tin hợp đồng');
            } finally {
                setLoading(false);
            }
        })();
    }, [id]);

    /* ── file handlers ── */
    const handleFile = (side) => (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        if (side === 'front') { setFrontFile(file); setFrontPreview(url); }
        else                  { setBackFile(file);  setBackPreview(url);  }
    };

    /* ── step nav helpers ── */
    const goNext = (from) => {
        if (from === 1) {
            if (!info.full_name || !info.id_number || !info.dob || !info.address) {
                toast.error('Vui lòng điền đầy đủ thông tin cá nhân (*)');
                return;
            }
        }
        setActiveStep(from + 1);
    };

    /* ── sign submit ── */
    const handleSign = async () => {
        if (!allCommitted) { toast.error('Vui lòng xác nhận đầy đủ các cam kết'); return; }
        if (signaturePadRef.current?.isEmpty()) { toast.error('Vui lòng ký tên của bạn'); return; }

        try {
            setSigning(true);
            await contractService.updatePersonalInfo(id, info);
            await contractService.tenantSign(id);
            toast.success('Ký hợp đồng thành công! Chờ chủ nhà xác nhận.');
            navigate(`/tenant/my-contract/${id}`);
        } catch (err) {
            toast.error(err.response?.data?.message || err.message || 'Lỗi khi ký hợp đồng');
        } finally {
            setSigning(false);
        }
    };

    /* ── loading / not found ── */
    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader2 size={40} className="text-indigo-500 animate-spin" />
        </div>
    );
    if (!contract) return (
        <div className="min-h-screen flex flex-col items-center justify-center gap-4">
            <AlertCircle size={40} className="text-red-400" />
            <p className="text-gray-500 font-bold">Không tìm thấy hợp đồng.</p>
        </div>
    );

    /* ─────────────────────────────────────────────── */
    const STEPS = ['Xem hợp đồng', 'Thông tin cá nhân', 'Tùy chọn', 'Ký kết'];

    return (
        <div className="min-h-screen pb-24" style={{ background: 'linear-gradient(135deg,#f8faff 0%,#eef2ff 60%,#f0f4ff 100%)' }}>
            {/* BG blur */}
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-400/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-400/5 blur-[120px] rounded-full" />
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8 relative z-10">

                {/* ── Header ── */}
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)}
                        className="p-3 glass rounded-2xl hover:bg-white/80 shadow-sm border-white/40 hover:scale-105 active:scale-95 transition-all">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-0.5">Xác thực &amp; Ký kết trực tuyến</p>
                        <h1 className="text-2xl font-black text-gray-900 leading-tight">Hoàn tất hợp đồng thuê</h1>
                    </div>
                </div>

                {/* ── Step bar ── */}
                <div className="flex items-center gap-1 mb-8 overflow-x-auto pb-1">
                    {STEPS.map((label, i) => {
                        const isDone   = activeStep > i;
                        const isActive = activeStep === i;
                        return (
                            <React.Fragment key={i}>
                                <button onClick={() => setActiveStep(i)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${
                                        isActive ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-105'
                                        : isDone  ? 'bg-emerald-100 text-emerald-700'
                                                  : 'bg-white/60 text-gray-400 hover:bg-white/90'
                                    }`}>
                                    {isDone ? <CheckCircle2 size={13} /> : <span className="opacity-60">{i + 1}.</span>}
                                    {label}
                                </button>
                                {i < STEPS.length - 1 && (
                                    <ChevronRight size={14} className={isDone ? 'text-emerald-400' : 'text-gray-300'} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>

                {/* ── Main grid ── */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* ══ LEFT — steps ══════════════════════════════════ */}
                    <div className="lg:col-span-7 space-y-6">

                        {/* ─ STEP 0: View Contract ─ */}
                        {activeStep === 0 && (
                            <div className="space-y-5">
                                {/* Property */}
                                <div className="glass p-7 rounded-[2rem] border-white/40 shadow-xl">
                                    <div className="flex items-center gap-3 mb-5">
                                        <StepBadge n="1" done={activeStep > 0} />
                                        <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">Thông tin tài sản thuê</h3>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="p-4 bg-indigo-50/60 rounded-2xl">
                                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Tòa nhà</p>
                                            <p className="font-black text-gray-900 text-sm">{contract.building_name}</p>
                                        </div>
                                        <div className="p-4 bg-indigo-50/60 rounded-2xl">
                                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Phòng</p>
                                            <p className="font-black text-gray-900 text-sm">Phòng {contract.room_number}</p>
                                        </div>
                                        <div className="col-span-2 p-4 bg-indigo-50/60 rounded-2xl flex gap-2 items-start">
                                            <MapPin size={14} className="text-indigo-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-sm text-gray-700 font-bold">{contract.building_address || 'Chưa cập nhật địa chỉ'}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Landlord */}
                                <div className="glass p-7 rounded-[2rem] border-white/40 shadow-xl">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-9 h-9 bg-violet-600 text-white rounded-xl flex items-center justify-center"><User size={16} /></div>
                                        <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">Bên cho thuê (Bên A)</h3>
                                    </div>
                                    <div className="space-y-3">
                                        {[
                                            { Icon: User,  val: contract.landlord_name  || '--' },
                                            { Icon: Phone, val: contract.landlord_phone || '--' },
                                            { Icon: Mail,  val: contract.landlord_email || '--' },
                                        ].map(({ Icon, val }, i) => (
                                            <div key={i} className="flex items-center gap-3 p-3 bg-white/40 rounded-xl">
                                                <Icon size={14} className="text-gray-400 flex-shrink-0" />
                                                <span className="text-sm font-bold text-gray-700">{val}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Pricing */}
                                <div className="glass p-7 rounded-[2rem] border-white/40 shadow-xl">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-9 h-9 bg-orange-500 text-white rounded-xl flex items-center justify-center"><Home size={16} /></div>
                                        <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">Tài chính hợp đồng</h3>
                                    </div>
                                    <InfoRow label="Giá thuê / tháng"    value={`${fmt(contract.monthly_price)}₫`} />
                                    <InfoRow label="Tiền đặt cọc"        value={`${fmt(contract.deposit_amount)}₫`} />
                                    <InfoRow label="Ngày bắt đầu"        value={fmtDate(contract.start_date)} />
                                    <InfoRow label="Ngày kết thúc (gốc)" value={fmtDate(contract.end_date)} />
                                </div>

                                {/* Terms */}
                                <div className="glass p-7 rounded-[2rem] border-white/40 shadow-xl">
                                    <div className="flex items-center gap-3 mb-5">
                                        <div className="w-9 h-9 bg-emerald-600 text-white rounded-xl flex items-center justify-center"><FileText size={16} /></div>
                                        <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">Các điều khoản hợp đồng</h3>
                                    </div>
                                    {terms.length > 0 ? (
                                        <ol className="space-y-3">
                                            {terms.map((t, i) => (
                                                <li key={i} className="flex gap-3 p-4 bg-gray-50/60 rounded-2xl">
                                                    <span className="w-6 h-6 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center text-[11px] font-black flex-shrink-0">{i + 1}</span>
                                                    <span className="text-sm text-gray-700 font-medium leading-relaxed">{t}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-400 italic text-sm">
                                            <Info size={14} /> Chưa có điều khoản cụ thể từ chủ nhà.
                                        </div>
                                    )}
                                </div>

                                <button onClick={() => setActiveStep(1)}
                                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-indigo-200 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                                    Tiếp theo: Thông tin cá nhân <ChevronRight size={18} />
                                </button>
                            </div>
                        )}

                        {/* ─ STEP 1: Personal Info + CCCD ─ */}
                        {activeStep === 1 && (
                            <div className="space-y-5">
                                <div className="glass p-7 rounded-[2rem] border-white/40 shadow-xl">
                                    <div className="flex items-center gap-3 mb-6">
                                        <StepBadge n="2" done={activeStep > 1} />
                                        <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">Thông tin bên thuê (Bên B)</h3>
                                    </div>

                                    <div className="space-y-3 mb-7">
                                        {/* Full name */}
                                        <div className="p-4 bg-white/50 rounded-2xl border border-white/70">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Họ và tên đầy đủ *</label>
                                            <input
                                                value={info.full_name}
                                                onChange={e => setInfo(p => ({ ...p, full_name: e.target.value.toUpperCase() }))}
                                                className="w-full bg-transparent font-black text-gray-900 border-none p-0 focus:ring-0 placeholder-gray-300 text-sm"
                                                placeholder="NGUYỄN VĂN A"
                                            />
                                        </div>
                                        {/* CCCD number */}
                                        <div className="p-4 bg-white/50 rounded-2xl border border-white/70">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Số CCCD / CMND *</label>
                                            <input
                                                value={info.id_number}
                                                onChange={e => setInfo(p => ({ ...p, id_number: e.target.value }))}
                                                className="w-full bg-transparent font-black text-gray-900 border-none p-0 focus:ring-0 placeholder-gray-300 text-sm"
                                                placeholder="001234567890"
                                            />
                                        </div>
                                        {/* DOB */}
                                        <div className="p-4 bg-white/50 rounded-2xl border border-white/70">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Ngày sinh *</label>
                                            <input
                                                type="date"
                                                value={info.dob}
                                                onChange={e => setInfo(p => ({ ...p, dob: e.target.value }))}
                                                className="w-full bg-transparent font-black text-gray-900 border-none p-0 focus:ring-0 text-sm"
                                            />
                                        </div>
                                        {/* Address */}
                                        <div className="p-4 bg-white/50 rounded-2xl border border-white/70">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest block mb-1">Địa chỉ thường trú *</label>
                                            <input
                                                value={info.address}
                                                onChange={e => setInfo(p => ({ ...p, address: e.target.value }))}
                                                className="w-full bg-transparent font-bold text-gray-900 border-none p-0 focus:ring-0 placeholder-gray-300 text-sm"
                                                placeholder="Số nhà, đường, phường/xã, quận/huyện, tỉnh/TP"
                                            />
                                        </div>
                                    </div>

                                    {/* CCCD Upload – no AI */}
                                    <div className="border-t border-gray-100/50 pt-6">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Upload size={14} className="text-indigo-400" />
                                            <h4 className="text-[11px] font-black text-gray-600 uppercase tracking-widest">Ảnh CCCD (Tùy chọn)</h4>
                                        </div>
                                        <p className="text-[10px] text-gray-400 font-bold italic mb-4">Ảnh CCCD giúp chủ nhà xác minh danh tính nhanh hơn.</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <ImageUploadBox label="Mặt trước" preview={frontPreview} onChange={handleFile('front')} />
                                            <ImageUploadBox label="Mặt sau"   preview={backPreview}  onChange={handleFile('back')}  />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setActiveStep(0)}
                                        className="flex-1 py-4 bg-white/60 text-gray-600 rounded-2xl font-black uppercase tracking-wider border border-gray-200 hover:bg-white transition-all">
                                        ← Quay lại
                                    </button>
                                    <button onClick={() => goNext(1)}
                                        className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                                        Tiếp theo →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ─ STEP 2: Contract Options ─ */}
                        {activeStep === 2 && (
                            <div className="space-y-5">
                                <div className="glass p-7 rounded-[2rem] border-white/40 shadow-xl">
                                    <div className="flex items-center gap-3 mb-6">
                                        <StepBadge n="3" done={activeStep > 2} />
                                        <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">Tùy chọn hợp đồng</h3>
                                    </div>

                                    {/* Duration */}
                                    <div className="mb-8">
                                        <div className="flex items-center gap-2 mb-4">
                                            <Calendar size={15} className="text-indigo-400" />
                                            <h4 className="text-[11px] font-black text-gray-600 uppercase tracking-widest">Thời hạn thuê</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {DURATION_OPTIONS.map(opt => (
                                                <button key={opt.months} onClick={() => setDuration(opt.months)}
                                                    className={`p-4 rounded-2xl border-2 font-black text-sm transition-all flex flex-col items-center gap-1 ${
                                                        duration === opt.months
                                                            ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100'
                                                            : 'border-gray-200 bg-white/40 text-gray-500 hover:border-indigo-300'
                                                    }`}>
                                                    {opt.label}
                                                    {duration === opt.months && (
                                                        <span className="text-[9px] text-indigo-500 flex items-center gap-1 font-black">
                                                            <CheckCircle2 size={10} /> Đã chọn
                                                        </span>
                                                    )}
                                                </button>
                                            ))}
                                        </div>
                                        {contract.start_date && (
                                            <div className="mt-4 p-4 bg-indigo-50/60 rounded-2xl flex items-center gap-3">
                                                <Info size={14} className="text-indigo-400 flex-shrink-0" />
                                                <p className="text-[11px] text-gray-600 font-bold">
                                                    Từ <span className="text-indigo-600">{fmtDate(contract.start_date)}</span> đến <span className="text-indigo-600">{fmtDate(endDate)}</span>
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Occupants */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-4">
                                            <Users size={15} className="text-indigo-400" />
                                            <h4 className="text-[11px] font-black text-gray-600 uppercase tracking-widest">Số người ở</h4>
                                        </div>
                                        <div className="flex gap-3 flex-wrap">
                                            {OCCUPANT_OPTIONS.map(n => (
                                                <button key={n} onClick={() => setOccupants(n)}
                                                    className={`w-14 h-14 rounded-2xl border-2 font-black text-xl transition-all ${
                                                        occupants === n
                                                            ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                                                            : 'border-gray-200 bg-white/40 text-gray-600 hover:border-indigo-300'
                                                    }`}>
                                                    {n}
                                                </button>
                                            ))}
                                        </div>
                                        <p className="mt-3 text-[10px] text-gray-400 font-bold italic">
                                            * Số người ở thực tế phải đúng như đã khai báo trong hợp đồng.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex gap-3">
                                    <button onClick={() => setActiveStep(1)}
                                        className="flex-1 py-4 bg-white/60 text-gray-600 rounded-2xl font-black uppercase tracking-wider border border-gray-200 hover:bg-white transition-all">
                                        ← Quay lại
                                    </button>
                                    <button onClick={() => setActiveStep(3)}
                                        className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-wider shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all">
                                        Tiếp theo →
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* ─ STEP 3: Commitment + Signature ─ */}
                        {activeStep === 3 && (
                            <div className="space-y-5">
                                {/* Commitments */}
                                <div className="glass p-7 rounded-[2rem] border-white/40 shadow-xl">
                                    <div className="flex items-center gap-3 mb-6">
                                        <StepBadge n="4" done={false} />
                                        <h3 className="text-base font-black text-gray-900 uppercase tracking-tight">Cam kết và xác nhận</h3>
                                    </div>
                                    <div className="space-y-3 mb-8">
                                        {[
                                            { key: 'read',    text: 'Tôi đã đọc và hiểu toàn bộ nội dung hợp đồng thuê phòng.' },
                                            { key: 'agree',   text: `Tôi đồng ý với tất cả điều khoản, thời hạn ${duration} tháng và số người ở là ${occupants} người.` },
                                            { key: 'correct', text: 'Tôi xác nhận thông tin cá nhân đã cung cấp là hoàn toàn chính xác và trung thực.' },
                                            { key: 'legal',   text: 'Tôi hiểu rằng chữ ký điện tử này có giá trị pháp lý theo quy định của pháp luật Việt Nam.' },
                                        ].map(({ key, text }) => (
                                            <button key={key} onClick={() => setCommits(c => ({ ...c, [key]: !c[key] }))}
                                                className={`w-full flex items-start gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                                                    commits[key]
                                                        ? 'border-emerald-400 bg-emerald-50/60'
                                                        : 'border-gray-200 bg-white/30 hover:border-gray-300'
                                                }`}>
                                                {commits[key]
                                                    ? <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                                                    : <div className="w-5 h-5 border-2 border-gray-300 rounded-full flex-shrink-0 mt-0.5" />
                                                }
                                                <span className={`text-sm font-bold leading-relaxed ${commits[key] ? 'text-emerald-800' : 'text-gray-600'}`}>{text}</span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Signature pad */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <PenTool size={15} className="text-indigo-400" />
                                            <h4 className="text-[11px] font-black text-gray-600 uppercase tracking-widest">Ký tên xác nhận</h4>
                                        </div>
                                        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/40 shadow-inner overflow-hidden relative group">
                                            <div className="absolute top-4 left-4 p-2 bg-indigo-50 text-indigo-400 rounded-lg pointer-events-none group-hover:scale-110 transition-transform z-10">
                                                <PenTool size={14} />
                                            </div>
                                            <SignaturePad
                                                ref={signaturePadRef}
                                                canvasProps={{
                                                    className: 'signature-canvas w-full h-48',
                                                    style: { background: 'transparent' }
                                                }}
                                            />
                                            <div className="absolute bottom-3 right-3 z-10">
                                                <button onClick={() => signaturePadRef.current?.clear()}
                                                    className="px-4 py-2 bg-red-50 text-red-500 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all">
                                                    Xóa nháp
                                                </button>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-[10px] text-gray-400 font-bold text-center italic">
                                            Bằng việc ký tên, bạn đồng ý ràng buộc bởi tất cả các điều khoản của hợp đồng.
                                        </p>
                                    </div>
                                </div>

                                <button onClick={() => setActiveStep(2)}
                                    className="w-full py-3 bg-white/60 text-gray-600 rounded-2xl font-black uppercase tracking-wider border border-gray-200 hover:bg-white transition-all">
                                    ← Quay lại
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ══ RIGHT — sticky summary ══════════════════════════ */}
                    <div className="lg:col-span-5">
                        <div className="glass p-8 rounded-[2.5rem] border-white/40 shadow-2xl space-y-6 sticky top-8">
                            {/* Building */}
                            <div>
                                <h4 className="text-2xl font-black text-gray-900 leading-tight mb-1">{contract.building_name}</h4>
                                <p className="text-indigo-600 font-black italic text-sm">Phòng {contract.room_number}</p>
                            </div>

                            {/* Financial summary */}
                            <div className="space-y-1">
                                <InfoRow label="Giá thuê / tháng" value={`${fmt(contract.monthly_price)}₫`} />
                                <InfoRow label="Tiền cọc"         value={`${fmt(contract.deposit_amount)}₫`} />
                                <InfoRow label="Thời hạn"         value={`${duration} tháng`} accent />
                                <InfoRow label="Ngày kết thúc"    value={fmtDate(endDate)} />
                                <InfoRow label="Số người ở"       value={`${occupants} người`} />
                            </div>

                            {/* Tenant summary */}
                            {info.full_name && (
                                <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100/50 space-y-1">
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Bên thuê xác nhận</p>
                                    <p className="font-black text-gray-900 text-sm">{info.full_name}</p>
                                    {info.id_number && <p className="text-xs text-gray-500 font-bold">CCCD: {info.id_number}</p>}
                                </div>
                            )}

                            {/* Sign button — only on step 3 */}
                            {activeStep === 3 && (
                                <button
                                    onClick={handleSign}
                                    disabled={signing || !allCommitted}
                                    className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-[0.15em] shadow-2xl shadow-gray-900/20 flex items-center justify-center gap-3 transition-all hover:scale-[1.03] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100">
                                    {signing
                                        ? <Loader2 size={22} className="animate-spin" />
                                        : <><CircleCheck size={22} /> Hoàn tất ký hợp đồng</>
                                    }
                                </button>
                            )}

                            {/* Legal notice */}
                            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex items-start gap-3">
                                <ShieldCheck size={20} className="text-indigo-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Bảo vệ pháp lý</p>
                                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed italic">
                                        Hợp đồng điện tử có đầy đủ giá trị pháp lý theo Luật Giao dịch điện tử Việt Nam.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ContractSigning;
