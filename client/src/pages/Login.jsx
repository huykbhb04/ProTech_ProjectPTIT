import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import { login, reset, googleLogin } from '../features/auth/authSlice';
import authService from '../services/authService';
import { ArrowLeft, KeyRound, Mail, ShieldCheck, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [showPass, setShowPass] = useState(false);
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSent, setForgotSent] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [searchParams] = useSearchParams();

    const { email, password } = formData;
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user, isLoading, isError, isSuccess, message } = useSelector(s => s.auth);

    const location = useLocation();
    const [from, setFrom] = useState('/');

    useEffect(() => {
        const routeStateFrom = location.state?.from?.pathname;
        if (routeStateFrom) {
            sessionStorage.setItem('redirect_to', routeStateFrom);
            setFrom(routeStateFrom);
        } else {
            const savedFrom = sessionStorage.getItem('redirect_to');
            if (savedFrom) {
                setFrom(savedFrom);
            }
        }
    }, [location.state]);

    useEffect(() => {
        const code = searchParams.get('code');
        if (!code) return;

        (async () => {
            try {
                const result = await dispatch(googleLogin(code)).unwrap();
                if (result?.token) {
                    sessionStorage.removeItem('redirect_to');
                    navigate(from, { replace: true });
                }
            } catch (error) {
                toast.error(error || 'Đăng nhập Google thất bại');
                // Only redirect back to clean login page on error
                navigate('/login', { replace: true });
            }
        })();
    }, [searchParams, dispatch, navigate, from]);

    useEffect(() => {
        if (isError) toast.error(message);
        if (isSuccess || user) {
            sessionStorage.removeItem('redirect_to');
            navigate(from, { replace: true });
        }
        dispatch(reset());
    }, [user, isError, isSuccess, message, navigate, dispatch, from]);

    const onChange = e => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const onSubmit = e => { e.preventDefault(); dispatch(login({ email, password })); };
    const handleForgotSubmit = e => { e.preventDefault(); setForgotSent(true); toast.success('Đã gửi yêu cầu khôi phục!'); };

    const handleGoogleLogin = async () => {
        try {
            setGoogleLoading(true);
            const url = await authService.getGoogleAuthUrl();
            if (!url) {
                toast.error('Google OAuth chưa được cấu hình ở backend');
                return;
            }
            window.location.href = url;
        } catch (error) {
            toast.error(error.response?.data?.message || 'Không thể khởi tạo Google login');
        } finally {
            setGoogleLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex bg-black text-white font-sans selection:bg-white selection:text-black">
            <div className="hidden lg:flex relative w-1/2 flex-col justify-between p-16">
                <img src="https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?q=80&w=2670&auto=format&fit=crop" alt="bg" className="absolute inset-0 w-full h-full object-cover opacity-70" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/90" />
                <Link to="/" className="relative z-10 text-xl font-black tracking-tighter uppercase text-indigo-400">PropTech</Link>
                <div className="relative z-10 space-y-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-400">Xin chào mừng</p>
                    <h1 className="text-6xl font-black leading-none tracking-tighter uppercase">KHÔNG GIAN</h1>
                    <p className="text-5xl font-light italic text-gray-400 mt-3 tracking-tight">ĐẲNG CẤP.</p>
                    <div className="flex items-center gap-3 text-[10px] font-bold text-gray-500 uppercase tracking-widest pt-4"><ShieldCheck size={14} /><span>Hệ thống bảo mật tối ưu</span></div>
                </div>
                <p className="relative z-10 text-[9px] font-bold uppercase tracking-[0.4em] text-gray-600">© 2026 PropTech Ecosystem</p>
            </div>

            <div className="flex flex-1 items-center justify-center p-8 md:p-16 bg-black">
                <div className="w-full max-w-md">
                    <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors mb-12 group"><ArrowLeft size={13} className="group-hover:-translate-x-1 transition-transform" /> Trang chủ</Link>
                    {!isForgotPassword ? (
                        <div className="animate-fade-in-up">
                            <div className="mb-10">
                                <h2 className="text-4xl font-black uppercase tracking-tight mb-2">Đăng nhập.</h2>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Truy cập hệ thống quản lý PropTech</p>
                            </div>
                            <form className="space-y-8" onSubmit={onSubmit}>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 mb-3">Email / Tài khoản</label>
                                    <input type="email" name="email" value={email} onChange={onChange} required className="w-full bg-transparent border-b border-gray-700 pb-3 text-sm font-medium text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors" placeholder="user@proptech.com" />
                                </div>
                                <div>
                                    <div className="flex justify-between items-center mb-3"><label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Mật khẩu</label><button type="button" onClick={() => setIsForgotPassword(true)} className="text-[10px] font-bold text-gray-600 hover:text-white uppercase tracking-widest transition-colors">Quên mật khẩu?</button></div>
                                    <div className="relative">
                                        <input type={showPass ? 'text' : 'password'} name="password" value={password} onChange={onChange} required className="w-full bg-transparent border-b border-gray-700 pb-3 pr-8 text-sm font-medium text-white placeholder-gray-600 focus:outline-none focus:border-white transition-colors tracking-wider" placeholder="••••••••" />
                                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-0 top-0 text-gray-600 hover:text-white transition-colors">{showPass ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                                    </div>
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full bg-white text-black font-black uppercase tracking-[0.3em] text-[11px] py-5 mt-4 hover:bg-gray-200 active:scale-[0.98] flex justify-center transition-all disabled:opacity-50">{isLoading ? <div className="w-4 h-4 border-2 border-black border-t-transparent animate-spin rounded-full" /> : 'Đăng nhập ngay'}</button>
                            </form>
                            <div className="relative my-6 flex items-center">
                                <div className="flex-1 border-t border-white/10"></div>
                                <span className="px-4 text-[10px] font-bold uppercase tracking-widest text-gray-600">Hoặc</span>
                                <div className="flex-1 border-t border-white/10"></div>
                            </div>
                            <button onClick={handleGoogleLogin} disabled={googleLoading} className="w-full border border-white/10 bg-white/5 text-white font-bold text-[12px] py-4 rounded-xl hover:bg-white/10 transition-all flex items-center justify-center gap-3 disabled:opacity-50 group">
                                {googleLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                                    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                    </svg>
                                )}
                                <span>Đăng nhập bằng Google</span>
                            </button>
                            <div className="mt-10 pt-8 border-t border-white/5 text-center"><p className="text-[11px] font-bold text-gray-600 uppercase tracking-widest">Chưa có tài khoản?{' '}<Link to="/register" className="text-white hover:underline underline-offset-4 decoration-2">Đăng ký</Link></p></div>
                        </div>
                    ) : (
                        <div className="animate-fade-in-up">...</div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default Login;
