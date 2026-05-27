import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { register, reset } from '../features/auth/authSlice';
import authService from '../services/authService';
import { ArrowLeft, User, Building2, Check, ShieldCheck, Mail, Loader2, Github } from 'lucide-react';
import { toast } from 'react-hot-toast';

function Register() {
    const [step, setStep] = useState(1);
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');
    const [googleLoading, setGoogleLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        phoneNumber: '',
        role: 'guest',
    });

    const { fullName, email, password, phoneNumber, role } = formData;
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const { user, isLoading, isError, isSuccess, message } = useSelector((state) => state.auth);

    useEffect(() => {
        if (isError) toast.error(message);
        if (isSuccess) {
            toast.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.');
            navigate('/login');
        } else if (user) {
            navigate('/');
        }
        dispatch(reset());
    }, [user, isError, isSuccess, message, navigate, dispatch]);

    const onChange = (e) => {
        setFormData((prevState) => ({
            ...prevState,
            [e.target.name]: e.target.value,
        }));
    };

    const handleRoleSelect = (selectedRole) => {
        setFormData((prevState) => ({ ...prevState, role: selectedRole }));
    };

    const validateForm = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^(0|84)(3|5|7|8|9)([0-9]{8})$/;

        if (!fullName.trim()) return toast.error('Vui lòng nhập họ và tên'), false;
        if (!emailRegex.test(email)) return toast.error('Email không đúng định dạng (VD: example@mail.com)'), false;
        if (!phoneRegex.test(phoneNumber)) return toast.error('Số điện thoại không hợp lệ (VD: 0912345678)'), false;
        if (password.length < 6) return toast.error('Mật khẩu phải có ít nhất 6 ký tự'), false;
        if (!['guest', 'landlord'].includes(role)) return toast.error('Vui lòng chọn vai trò người dùng'), false;
        return true;
    };

    const handleSendOtp = async () => {
        if (!validateForm()) return;
        try {
            const res = await authService.sendRegisterOtp(email);
            setOtpSent(true);
            setStep(2);
            if (res?.debugOtp) {
                console.log(`[Dev Mode] OTP: ${res.debugOtp}`);
            }
            toast.success('Đã gửi mã xác thực đến email');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể gửi OTP');
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (step === 1) return handleSendOtp();
        dispatch(register({ fullName, email, password, phoneNumber, role, otp }));
    };

    const handleGoogleLogin = async () => {
        try {
            setGoogleLoading(true);
            const url = await authService.getGoogleAuthUrl();
            window.location.href = url;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể khởi tạo Google login');
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex bg-black text-white font-sans selection:bg-white selection:text-black">
            <div className="fixed inset-0 z-0 pointer-events-none w-1/2 hidden lg:block">
                <img src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?q=80&w=2670&auto=format&fit=crop" alt="Luxury Building" className="w-full h-full object-cover opacity-80" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black"></div>
            </div>

            <div className="relative z-10 w-full lg:w-1/2 flex flex-col justify-between p-10 lg:p-20 hidden lg:flex">
                <Link to="/" className="text-2xl font-black tracking-tighter uppercase text-indigo-400">PropTech</Link>
                <div className="animate-in fade-in slide-in-from-bottom-10 duration-1000">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400 mb-6">Gia nhập cộng đồng</p>
                    <h1 className="text-6xl font-black leading-none tracking-tighter uppercase">KẾT NỐI</h1>
                    <p className="text-5xl font-light italic text-gray-400 mt-3 tracking-tight uppercase">Thành công.</p>
                </div>
                <div className="flex items-center gap-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    <ShieldCheck size={16} />
                    <span>Xác thực danh tính toàn cầu</span>
                </div>
            </div>

            <div className="relative z-10 w-full lg:w-1/2 flex items-center justify-center p-8 md:p-12 border-l border-white/10 bg-black/40 backdrop-blur-3xl overflow-y-auto pt-24 pb-12">
                <div className="w-full max-w-md relative animate-in fade-in slide-in-from-right-10 duration-700">
                    <div className="absolute -top-16 left-0">
                        <Link to="/" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white transition-colors group">
                            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Trang chủ
                        </Link>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-4xl font-black uppercase tracking-tight mb-2">Đăng ký.</h2>
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Khởi đầu hành trình PropTech của bạn</p>
                    </div>

                    <form className="space-y-5" onSubmit={onSubmit}>
                        <div className="mb-8">
                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-4 ml-1">Bạn muốn gia nhập với tư cách?</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" onClick={() => handleRoleSelect('guest')} className={`relative p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 active:scale-95 shadow-xl ${role === 'guest' ? 'border-white bg-white/10 text-white' : 'border-white/10 bg-white/5 text-gray-500 hover:border-white/30 hover:text-gray-300'}`}>
                                    <div className={`p-4 rounded-2xl ${role === 'guest' ? 'bg-white text-black' : 'bg-white/5 text-gray-400'}`}><User size={24} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Người thuê</span>
                                    {role === 'guest' && <div className="absolute -top-2 -right-2 bg-white text-black p-1.5 rounded-full shadow-lg"><Check size={14} strokeWidth={4} /></div>}
                                </button>
                                <button type="button" onClick={() => handleRoleSelect('landlord')} className={`relative p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-4 active:scale-95 shadow-xl ${role === 'landlord' ? 'border-white bg-white/10 text-white' : 'border-white/10 bg-white/5 text-gray-500 hover:border-white/30 hover:text-gray-300'}`}>
                                    <div className={`p-4 rounded-2xl ${role === 'landlord' ? 'bg-white text-black' : 'bg-white/5 text-gray-400'}`}><Building2 size={24} /></div>
                                    <span className="text-[10px] font-black uppercase tracking-widest leading-none">Chủ nhà</span>
                                    {role === 'landlord' && <div className="absolute -top-2 -right-2 bg-white text-black p-1.5 rounded-full shadow-lg"><Check size={14} strokeWidth={4} /></div>}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-2"><label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Họ và tên</label><input type="text" name="fullName" value={fullName} onChange={onChange} required className="w-full bg-white/5 border border-white/10 px-5 py-3.5 rounded-2xl text-sm font-bold text-white placeholder-gray-600 focus:outline-none focus:border-white focus:bg-white/10 transition-all shadow-lg" placeholder="Ví dụ: Alex Nguyễn" /></div>
                            <div className="space-y-2"><label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Số điện thoại</label><input type="text" name="phoneNumber" value={phoneNumber} onChange={onChange} required className="w-full bg-white/5 border border-white/10 px-5 py-3.5 rounded-2xl text-sm font-bold text-white placeholder-gray-600 focus:outline-none focus:border-white focus:bg-white/10 transition-all shadow-lg" placeholder="09xx..." /></div>
                        </div>

                        <div className="space-y-2"><label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Địa chỉ Email</label><input type="email" name="email" value={email} onChange={onChange} required className="w-full bg-white/5 border border-white/10 px-5 py-3.5 rounded-2xl text-sm font-bold text-white placeholder-gray-600 focus:outline-none focus:border-white focus:bg-white/10 transition-all shadow-lg" placeholder="name@example.com" /></div>
                        <div className="space-y-2"><label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Mật khẩu bảo mật</label><input type="password" name="password" value={password} onChange={onChange} required className="w-full bg-white/5 border border-white/10 px-5 py-3.5 rounded-2xl text-sm font-bold text-white placeholder-gray-600 focus:outline-none focus:border-white focus:bg-white/10 transition-all tracking-wider shadow-lg" placeholder="••••••••" /></div>

                        {step === 2 && (
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-1">Mã xác thực email</label>
                                <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} required className="w-full bg-white/5 border border-white/10 px-5 py-3.5 rounded-2xl text-sm font-bold text-white placeholder-gray-600 focus:outline-none focus:border-white focus:bg-white/10 transition-all shadow-lg tracking-[0.4em] text-center" placeholder="123456" />
                                <p className="text-[10px] text-gray-500">Mã đã được gửi đến email của bạn.</p>
                            </div>
                        )}

                        <button type="submit" disabled={isLoading} className="w-full bg-white hover:bg-gray-200 text-black font-black uppercase tracking-[0.3em] text-[11px] py-5 rounded-2xl mt-6 transition-all hover:scale-[1.02] active:scale-[0.98] flex justify-center disabled:opacity-50 shadow-2xl shadow-white/10">
                            {isLoading ? <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full"></div> : step === 1 ? 'Gửi mã xác thực' : 'Hoàn tất đăng ký'}
                        </button>
                    </form>

                    <button onClick={handleGoogleLogin} disabled={googleLoading} className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-5 py-4 text-[11px] font-black uppercase tracking-[0.3em] text-white transition-all hover:bg-white/10 disabled:opacity-50 flex items-center justify-center gap-2">
                        {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Đăng nhập bằng Google
                    </button>

                    <div className="mt-10 pt-8 border-t border-white/10 text-center">
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                            Đã có tài khoản?{' '}
                            <Link to="/login" className="text-white hover:underline decoration-2 underline-offset-4">Đăng nhập ngay</Link>
                        </p>
                    </div>

                    <div className="mt-16 text-center opacity-30">
                        <p className="text-[9px] font-bold uppercase tracking-[0.4em]">© 2026 PropTech Ecosystem</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Register;
