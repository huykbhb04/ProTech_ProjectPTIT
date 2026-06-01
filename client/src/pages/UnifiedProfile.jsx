import React, { useState, useEffect } from 'react';
import {
    User, Camera, Calendar, MapPin, Mail, ShieldCheck,
    CreditCard, Star, Save, Trash2, Plus,
    CircleCheck, CircleAlert, Loader
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import userService from '../services/userService';
import { toast } from 'react-hot-toast';
import { updateUser } from '../features/auth/authSlice';

const UnifiedProfile = () => {
    const dispatch = useDispatch();
    const { user: authUser } = useSelector((state) => state.auth);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        phone_number: '',
        date_of_birth: '',
        address: ''
    });

    // Payment methods state
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [newMethod, setNewMethod] = useState({
        type: 'bank',
        provider: '',
        account_number: '',
        account_name: ''
    });

    useEffect(() => {
        fetchProfile();
        fetchPaymentMethods();
    }, []);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            setError(false);
            const data = await userService.getProfile();
            setProfile(data);
            const formatDateForInput = (dateValue) => {
                if (!dateValue) return '';
                // Nếu server trả về "YYYY-MM-DD" (do đã đặt dateStrings: true)
                if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
                    return dateValue.split(' ')[0].split('T')[0];
                }
                const d = new Date(dateValue);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            setFormData({
                full_name: data.full_name || '',
                email: data.email || '',
                phone_number: data.phone_number || '',
                date_of_birth: data.date_of_birth ? formatDateForInput(data.date_of_birth) : '',
                address: data.address || ''
            });
        } catch (err) {
            console.error('Lỗi khi tải profile:', err);
            setError(true);
            toast.error('Lỗi khi tải thông tin cá nhân');
        } finally {
            setLoading(false);
        }
    };

    const fetchPaymentMethods = async () => {
        try {
            const data = await userService.getPaymentMethods();
            setPaymentMethods(data);
        } catch (error) {
            console.error('Lỗi khi tải phương thức thanh toán', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('avatar', file);

        try {
            setSaving(true);
            const res = await userService.uploadAvatar(uploadData);
            setProfile(prev => ({ ...prev, avatar_url: res.avatarUrl }));
            // Đồng bộ với Redux Navbar
            dispatch(updateUser({ avatar_url: res.avatarUrl, avatar: res.avatarUrl }));
            toast.success('Cập nhật ảnh đại diện thành công');
        } catch (error) {
            toast.error('Lỗi khi tải ảnh lên');
        } finally {
            setSaving(false);
        }
    };

    const handleSubmitProfile = async (e) => {
        e.preventDefault();
        try {
            setSaving(true);
            await userService.updateProfile(formData);
            toast.success('Đã lưu thông tin cá nhân');
            // Đồng bộ với Redux Navbar
            dispatch(updateUser({
                full_name: formData.full_name,
                fullName: formData.full_name,
                email: formData.email
            }));
            fetchProfile();
        } catch (error) {
            toast.error('Lỗi khi cập nhật thông tin');
        } finally {
            setSaving(false);
        }
    };

    const handleAddPaymentMethod = async () => {
        try {
            await userService.addPaymentMethod(newMethod);
            toast.success('Đã thêm phương thức thanh toán');
            setShowPaymentModal(false);
            fetchPaymentMethods();
        } catch (error) {
            toast.error('Lỗi khi thêm phương thức');
        }
    };

    const handleDeletePaymentMethod = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa?')) return;
        try {
            await userService.deletePaymentMethod(id);
            toast.success('Đã xóa phương thức thanh toán');
            fetchPaymentMethods();
        } catch (error) {
            toast.error('Lỗi khi xóa phương thức');
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center">
            <Loader className="animate-spin text-indigo-600" size={48} />
        </div>
    );

    if (error || !profile) return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center space-y-6 p-8">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                    <CircleAlert size={40} className="text-red-400" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-gray-900 mb-2">Không thể tải thông tin</h2>
                    <p className="text-gray-500 text-sm">Đã xảy ra lỗi khi tải thông tin cá nhân. Vui lòng thử lại.</p>
                </div>
                <button
                    onClick={fetchProfile}
                    className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all active:scale-95"
                >
                    Thử lại
                </button>
            </div>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Section */}
            <div className="glass rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden flex flex-col md:flex-row items-center gap-8 border-white/40 shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full"></div>

                <div className="relative">
                    <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl overflow-hidden group">
                        <img
                            src={profile?.avatar_url || `https://ui-avatars.com/api/?name=${profile?.full_name}&background=6366f1&color=fff`}
                            alt="Avatar"
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                            <Camera className="text-white" size={24} />
                            <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} disabled={saving} />
                        </label>
                    </div>
                </div>

                <div className="flex-1 text-center md:text-left space-y-2">
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">{profile?.full_name}</h1>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                        <span className="px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {profile?.role === 'tenant' ? 'Người thuê' : profile?.role === 'landlord' ? 'Chủ nhà' : 'Quản trị viên'}
                        </span>
                        {profile?.is_verified ? (
                            <span className="flex items-center gap-1.5 px-4 py-1.5 bg-green-100 text-green-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                <ShieldCheck size={14} /> Đã xác thực
                            </span>
                        ) : (
                            <span className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-100 text-amber-700 rounded-full text-[10px] font-black uppercase tracking-widest">
                                <CircleAlert size={14} /> Chưa xác thực
                            </span>
                        )}
                    </div>
                </div>

                {/* Reputation Score Card */}
                {profile?.role === 'tenant' && (
                    <div className="bg-white/60 backdrop-blur-xl p-6 rounded-3xl border border-white/60 shadow-lg text-center min-w-[150px]">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Điểm uy tín</p>
                        <div className="flex items-center justify-center gap-2">
                            <Star className="text-yellow-500 fill-yellow-500" size={20} />
                            <span className="text-3xl font-black text-gray-900">{profile?.reputation_score || 100}</span>
                        </div>
                        <p className="text-[10px] text-green-600 font-bold mt-2">Đáng tin cậy</p>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Editor */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="glass rounded-[2rem] p-8 md:p-10 border-white/40 shadow-xl space-y-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                <User size={24} />
                            </div>
                            <h2 className="text-xl font-black text-gray-900">Thông tin cá nhân</h2>
                        </div>

                        <form onSubmit={handleSubmitProfile} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Họ và tên</label>
                                <input
                                    name="full_name" value={formData.full_name} onChange={handleInputChange}
                                    className="w-full bg-white/50 border border-gray-100 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-gray-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Email</label>
                                <input
                                    name="email" value={formData.email} onChange={handleInputChange}
                                    className="w-full bg-white/50 border border-gray-100 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-gray-800"
                                    type="email"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Số điện thoại</label>
                                <input
                                    name="phone_number" value={formData.phone_number} onChange={handleInputChange}
                                    className="w-full bg-white/50 border border-gray-100 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-gray-800"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Ngày sinh</label>
                                <div className="relative">
                                    <input
                                        name="date_of_birth" value={formData.date_of_birth} onChange={handleInputChange}
                                        className="w-full bg-white/50 border border-gray-100 rounded-2xl px-6 py-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-gray-800"
                                        type="date"
                                    />
                                    <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" size={20} />
                                </div>
                            </div>
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Địa chỉ thường trú</label>
                                <div className="relative">
                                    <input
                                        name="address" value={formData.address} onChange={handleInputChange}
                                        className="w-full bg-white/50 border border-gray-100 rounded-2xl px-6 py-4 pl-14 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold text-gray-800"
                                        placeholder="Nhập địa chỉ hiện tại của bạn"
                                    />
                                    <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                </div>
                            </div>

                            <div className="md:col-span-2 pt-4">
                                <button
                                    type="submit" disabled={saving}
                                    className="w-full md:w-auto px-10 py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
                                >
                                    {saving ? <Loader className="animate-spin" size={20} /> : <Save size={20} />}
                                    Lưu thay đổi
                                </button>
                            </div>
                        </form>
                    </div>

                </div>

                {/* Sidebar Section: Payment Methods */}
                <div className="space-y-8">
                    <div className="glass rounded-[2rem] p-8 border-white/40 shadow-xl space-y-6 flex flex-col h-full">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                                    <CreditCard size={24} />
                                </div>
                                <h2 className="text-xl font-black text-gray-900">Thanh toán</h2>
                            </div>
                            <button
                                onClick={() => setShowPaymentModal(true)}
                                className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100"
                            >
                                <Plus size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 flex-1">
                            {paymentMethods.length > 0 ? paymentMethods.map((method) => (
                                <div key={method.method_id} className="p-4 bg-white/50 rounded-2xl border border-white/60 group hover:shadow-md transition-all relative">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-xl ${method.type === 'bank' ? 'bg-indigo-50 text-indigo-600' : 'bg-orange-50 text-orange-600'}`}>
                                            <CreditCard size={18} />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{method.provider}</p>
                                            <p className="font-bold text-gray-800 text-sm">{method.account_number}</p>
                                            <p className="text-[10px] font-bold text-gray-500">{method.account_name}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDeletePaymentMethod(method.method_id)}
                                        className="absolute top-4 right-4 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            )) : (
                                <div className="text-center py-10 text-gray-400 space-y-2">
                                    <CreditCard size={32} className="mx-auto opacity-20" />
                                    <p className="text-xs font-bold">Chưa có phương thức nào</p>
                                </div>
                            )}
                        </div>

                        <div className="bg-indigo-50 p-6 rounded-3xl space-y-3">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                <CircleCheck size={14} /> Bảo mật thanh toán
                            </p>
                            <p className="text-[10px] font-bold text-indigo-900/60 leading-relaxed uppercase">
                                Thông tin của bạn được mã hóa và bảo vệ theo tiêu chuẩn SSL 256-bit.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Payment Method Modal (Simple implementation) */}
            {showPaymentModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <div className="fixed inset-0 bg-black/20 backdrop-blur-md" onClick={() => setShowPaymentModal(false)}></div>
                    <div className="relative glass-dark rounded-[2.5rem] p-10 w-full max-w-md border border-white/20 shadow-2xl animate-in zoom-in duration-300">
                        <h2 className="text-2xl font-black text-white mb-6">Thêm phương thức mới</h2>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Loại tài khoản</label>
                                <select
                                    className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none"
                                    value={newMethod.type} onChange={e => setNewMethod({ ...newMethod, type: e.target.value })}
                                >
                                    <option value="bank" className="bg-gray-900">Ngân hàng</option>
                                    <option value="e-wallet" className="bg-gray-900">Ví điện tử</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Tên đơn vị (Vd: MB Bank, MoMo)</label>
                                <input
                                    className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none"
                                    value={newMethod.provider} onChange={e => setNewMethod({ ...newMethod, provider: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Số tài khoản / Số điện thoại</label>
                                <input
                                    className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none"
                                    value={newMethod.account_number} onChange={e => setNewMethod({ ...newMethod, account_number: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Tên chủ tài khoản</label>
                                <input
                                    className="w-full bg-white/10 border border-white/10 rounded-2xl px-6 py-4 text-white font-bold outline-none uppercase"
                                    value={newMethod.account_name} onChange={e => setNewMethod({ ...newMethod, account_name: e.target.value })}
                                />
                            </div>
                            <button
                                onClick={handleAddPaymentMethod}
                                className="w-full py-4 bg-white text-gray-900 rounded-2xl font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                            >
                                Thêm phương thức
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UnifiedProfile;
