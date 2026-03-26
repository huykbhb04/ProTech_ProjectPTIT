import { BarChart3, Package, Star, Users } from 'lucide-react';

const AdminDashboard = () => {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight">Admin Dashboard</h1>
                <p className="text-gray-500 font-medium">Tổng quan hệ thống Smart PropTech</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-red-100 text-red-600 rounded-2xl">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tổng Users</p>
                            <p className="text-2xl font-black text-gray-800">-</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
                            <Package size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Gói tin</p>
                            <p className="text-2xl font-black text-gray-800">-</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-yellow-100 text-yellow-600 rounded-2xl">
                            <Star size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dịch vụ VIP</p>
                            <p className="text-2xl font-black text-gray-800">-</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-100 text-green-600 rounded-2xl">
                            <BarChart3 size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Doanh thu</p>
                            <p className="text-2xl font-black text-gray-800">-</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Placeholder */}
            <div className="bg-white rounded-3xl border shadow-sm p-12 text-center">
                <BarChart3 size={64} className="text-gray-200 mx-auto mb-4" />
                <h3 className="text-xl font-black text-gray-900 mb-2">Dashboard đang phát triển</h3>
                <p className="text-gray-500">Các thống kê chi tiết sẽ được thêm vào sau</p>
            </div>
        </div>
    );
};

export default AdminDashboard;
