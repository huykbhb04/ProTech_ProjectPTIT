import React from 'react';
import { User, Settings, ShieldCheck, CreditCard, ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TenantProfile = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <div className="max-w-2xl w-full glass rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/40 relative overflow-hidden text-center">
                {/* Decorative Elements */}
                <div className="absolute -top-24 -left-24 w-64 h-64 bg-green-500/10 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-gray-800 to-black rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-gray-200">
                        <User size={48} className="text-white" />
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-100 text-gray-700 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                        <Settings size={14} /> Profile Settings
                    </div>

                    <h1 className="text-4xl font-black text-gray-900 mb-6 leading-tight">
                        Trang Hồ Sơ Cá Nhân <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-gray-700 to-black">Đang được nâng cấp</span>
                    </h1>

                    <p className="text-gray-600 text-lg mb-10 leading-relaxed">
                        Chúng tôi đang xây dựng một hệ thống quản lý tài khoản bảo mật và tiện lợi hơn. <br />
                        Bạn sẽ sớm có thể quản lý hợp đồng, thanh toán và thông tin cá nhân tại đây.
                    </p>

                    <div className="flex flex-col gap-3 mb-10 text-left max-w-sm mx-auto">
                        <div className="flex items-center gap-4 p-4 bg-white/40 rounded-2xl border border-white/50">
                            <ShieldCheck className="text-green-600" size={24} />
                            <span className="text-sm font-bold text-gray-800">Xác thực danh tính AI</span>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-white/40 rounded-2xl border border-white/50">
                            <CreditCard className="text-blue-600" size={24} />
                            <span className="text-sm font-bold text-gray-800">Quản lý phương thức thanh toán</span>
                        </div>
                        <div className="flex items-center gap-4 p-4 bg-white/40 rounded-2xl border border-white/50">
                            <Star className="text-yellow-500" size={24} />
                            <span className="text-sm font-bold text-gray-800">Điểm uy tín người thuê</span>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/tenant/dashboard')}
                        className="group flex items-center gap-2 mx-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-100"
                    >
                        Quay về Dashboard
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TenantProfile;
