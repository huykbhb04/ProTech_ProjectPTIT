import React from 'react';
import { MessageSquare, Sparkles, Bot, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TenantChat = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-6">
            <div className="max-w-2xl w-full glass rounded-[2.5rem] p-10 shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/40 relative overflow-hidden text-center">
                {/* Decorative Elements */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none"></div>
                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500/20 blur-[100px] rounded-full pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="w-24 h-24 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl shadow-indigo-200 animate-bounce-slow">
                        <Bot size={48} className="text-white" />
                    </div>

                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-full text-xs font-black uppercase tracking-widest mb-4">
                        <Sparkles size={14} /> AI Assistant
                    </div>

                    <h1 className="text-4xl font-black text-gray-900 mb-6 leading-tight">
                        Trợ lý AI Thông minh <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">Sắp ra mắt!</span>
                    </h1>

                    <p className="text-gray-600 text-lg mb-10 leading-relaxed">
                        Chúng tôi đang hoàn thiện bộ não AI của hệ thống. <br />
                        Bạn sẽ sớm có thể tìm phòng, so sánh giá và hỏi đáp trực tiếp với trợ lý thông minh của chúng tôi.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
                        <div className="bg-white/50 p-4 rounded-2xl border border-white/50 text-center">
                            <Zap size={24} className="text-yellow-500 mx-auto mb-2" />
                            <p className="text-xs font-bold text-gray-800">Phản hồi tức thì</p>
                        </div>
                        <div className="bg-white/50 p-4 rounded-2xl border border-white/50 text-center">
                            <MessageSquare size={24} className="text-indigo-500 mx-auto mb-2" />
                            <p className="text-xs font-bold text-gray-800">Hỗ trợ 24/7</p>
                        </div>
                        <div className="bg-white/50 p-4 rounded-2xl border border-white/50 text-center">
                            <Bot size={24} className="text-purple-500 mx-auto mb-2" />
                            <p className="text-xs font-bold text-gray-800">Cá nhân hóa</p>
                        </div>
                    </div>

                    <button
                        onClick={() => navigate('/tenant/dashboard')}
                        className="group flex items-center gap-2 mx-auto px-8 py-4 bg-gray-900 text-white rounded-2xl font-bold hover:bg-gray-800 transition-all hover:scale-105 active:scale-95"
                    >
                        Quay lại trang chủ
                        <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TenantChat;
