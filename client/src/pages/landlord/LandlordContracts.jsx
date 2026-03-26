import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FileText, Eye, Edit, PenTool, CheckCircle2, Clock,
    AlertCircle, Search, Filter, Loader2
} from 'lucide-react';
import contractService from '../../services/contractService';

const LandlordContracts = () => {
    const navigate = useNavigate();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, draft, signed_by_tenant, active
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchContracts();
    }, []);

    const fetchContracts = async () => {
        try {
            const data = await contractService.getLandlordContracts();
            setContracts(data);
        } catch (error) {
            console.error('Error fetching contracts:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            draft: { bg: 'bg-gray-100', text: 'text-gray-700', icon: Edit, label: 'Bản nháp' },
            signed_by_tenant: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Clock, label: 'Chờ ký' },
            active: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2, label: 'Đang hoạt động' }
        };
        const badge = badges[status] || badges.draft;
        const Icon = badge.icon;

        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}>
                <Icon size={16} />
                {badge.label}
            </span>
        );
    };

    const filteredContracts = contracts.filter(contract => {
        const matchesFilter = filter === 'all' || contract.status === filter;
        const matchesSearch = contract.tenant_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contract.room_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contract.building_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const stats = {
        total: contracts.length,
        draft: contracts.filter(c => c.status === 'draft').length,
        pending: contracts.filter(c => c.status === 'signed_by_tenant').length,
        active: contracts.filter(c => c.status === 'active').length
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <FileText className="text-indigo-600" size={36} />
                        Quản lý hợp đồng
                    </h1>
                    <p className="text-gray-600 mt-2">Quản lý tất cả hợp đồng thuê phòng của bạn</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Tổng số</p>
                                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                            </div>
                            <FileText className="text-gray-400" size={32} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-600">Bản nháp</p>
                                <p className="text-2xl font-bold text-gray-700">{stats.draft}</p>
                            </div>
                            <Edit className="text-gray-400" size={32} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-blue-100 bg-blue-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-blue-600">Chờ ký</p>
                                <p className="text-2xl font-bold text-blue-700">{stats.pending}</p>
                            </div>
                            <Clock className="text-blue-400" size={32} />
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6 border border-green-100 bg-green-50">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-green-600">Đang hoạt động</p>
                                <p className="text-2xl font-bold text-green-700">{stats.active}</p>
                            </div>
                            <CheckCircle2 className="text-green-400" size={32} />
                        </div>
                    </div>
                </div>

                {/* Filters & Search */}
                <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-100">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Tìm kiếm theo tên người thuê, phòng, tòa nhà..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setFilter('all')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'all' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Tất cả
                            </button>
                            <button
                                onClick={() => setFilter('draft')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'draft' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Bản nháp
                            </button>
                            <button
                                onClick={() => setFilter('signed_by_tenant')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'signed_by_tenant' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Chờ ký
                            </button>
                            <button
                                onClick={() => setFilter('active')}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === 'active' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                Hoạt động
                            </button>
                        </div>
                    </div>
                </div>

                {/* Contracts Table */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    {filteredContracts.length === 0 ? (
                        <div className="text-center py-12">
                            <AlertCircle className="mx-auto text-gray-400 mb-4" size={48} />
                            <p className="text-gray-600">Không tìm thấy hợp đồng nào</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Phòng</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Người thuê</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Thời hạn</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Giá thuê</th>
                                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Trạng thái</th>
                                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {filteredContracts.map((contract) => (
                                        <tr
                                            key={contract.contract_id}
                                            className="hover:bg-gray-50 transition-colors cursor-pointer"
                                            onClick={() => navigate(`/landlord/contracts/${contract.contract_id}`)}
                                        >
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-semibold text-gray-900">Phòng {contract.room_number}</div>
                                                    <div className="text-sm text-gray-600">{contract.building_name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div>
                                                    <div className="font-medium text-gray-900">{contract.tenant_name}</div>
                                                    <div className="text-sm text-gray-600">{contract.tenant_email}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {new Date(contract.start_date).toLocaleDateString('vi-VN')} - {new Date(contract.end_date).toLocaleDateString('vi-VN')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-indigo-600">
                                                    {contract.monthly_price?.toLocaleString('vi-VN')} VNĐ
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {getStatusBadge(contract.status)}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigate(`/landlord/contracts/${contract.contract_id}`);
                                                    }}
                                                    className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                                                >
                                                    {contract.status === 'draft' ? (
                                                        <>
                                                            <Edit size={16} />
                                                            Chỉnh sửa
                                                        </>
                                                    ) : contract.status === 'signed_by_tenant' ? (
                                                        <>
                                                            <PenTool size={16} />
                                                            Ký hợp đồng
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye size={16} />
                                                            Xem chi tiết
                                                        </>
                                                    )}
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LandlordContracts;
