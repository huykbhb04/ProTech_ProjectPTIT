import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FileText, User, Calendar, House, ArrowLeft, Pencil, Save, Plus, X,
    Upload, Image as ImageIcon, Loader, PenTool, CircleCheck, TriangleAlert,
    Eye, ZoomIn
} from 'lucide-react';
import contractService from '../../services/contractService';
import HandoverForm from '../../components/HandoverForm';

const LandlordContractDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);

    // Editable Terms State
    const [isEditingTerms, setIsEditingTerms] = useState(false);
    const [terms, setTerms] = useState([]);
    const [isSavingTerms, setIsSavingTerms] = useState(false);

    // Landlord CCCD State
    const [landlordFrontImage, setLandlordFrontImage] = useState(null);
    const [landlordBackImage, setLandlordBackImage] = useState(null);
    const [landlordFrontPreview, setLandlordFrontPreview] = useState(null);
    const [landlordBackPreview, setLandlordBackPreview] = useState(null);
    const [isUploadingCCCD, setIsUploadingCCCD] = useState(false);

    // Signing State
    const [isSigning, setIsSigning] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    // Image Zoom Modal
    const [zoomImage, setZoomImage] = useState(null);

    // Handover Form State
    const [showHandoverForm, setShowHandoverForm] = useState(false);

    useEffect(() => {
        fetchContract();
    }, [id]);

    const fetchContract = async () => {
        try {
            const data = await contractService.getContractDetail(id);
            setContract(data);
            setTerms(data.contract_content?.terms || []);

            if (data.landlord_cccd_front_url) setLandlordFrontPreview(data.landlord_cccd_front_url);
            if (data.landlord_cccd_back_url) setLandlordBackPreview(data.landlord_cccd_back_url);
        } catch (error) {
            console.error('Error fetching contract:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTerms = async () => {
        try {
            setIsSavingTerms(true);
            await contractService.updateContractTerms(id, terms);
            alert('Đã cập nhật điều khoản hợp đồng thành công!');
            setIsEditingTerms(false);
            await fetchContract();
        } catch (error) {
            alert(error.response?.data?.message || 'Có lỗi khi cập nhật điều khoản');
        } finally {
            setIsSavingTerms(false);
        }
    };

    const handleAddTerm = () => {
        setTerms([...terms, '']);
    };

    const handleRemoveTerm = (index) => {
        setTerms(terms.filter((_, i) => i !== index));
    };

    const handleTermChange = (index, value) => {
        const newTerms = [...terms];
        newTerms[index] = value;
        setTerms(newTerms);
    };

    const handleLandlordImageSelect = (e, side) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Vui lòng chọn file ảnh');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            alert('Kích thước ảnh không được vượt quá 5MB');
            return;
        }

        if (side === 'front') {
            setLandlordFrontImage(file);
            setLandlordFrontPreview(URL.createObjectURL(file));
        } else {
            setLandlordBackImage(file);
            setLandlordBackPreview(URL.createObjectURL(file));
        }
    };

    const handleUploadLandlordCCCD = async () => {
        if (!landlordFrontImage || !landlordBackImage) {
            alert('Vui lòng chọn cả 2 mặt CCCD');
            return;
        }

        try {
            setIsUploadingCCCD(true);
            const result = await contractService.uploadLandlordCCCD(id, landlordFrontImage, landlordBackImage);
            alert(result.message || 'Đã lưu ảnh CCCD thành công!');
            await fetchContract();
        } catch (error) {
            alert(error.response?.data?.message || 'Có lỗi khi upload CCCD');
        } finally {
            setIsUploadingCCCD(false);
        }
    };

    const handleSign = async () => {
        if (!acceptedTerms) {
            alert('Vui lòng xác nhận đã đọc và đồng ý với hợp đồng');
            return;
        }

        try {
            setIsSigning(true);
            await contractService.landlordSign(id);
            alert('Bạn đã ký hợp đồng thành công! Hợp đồng đã được kích hoạt.');
            await fetchContract();
        } catch (error) {
            alert(error.response?.data?.message || 'Có lỗi khi ký hợp đồng');
        } finally {
            setIsSigning(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader className="w-12 h-12 text-indigo-600 animate-spin" />
            </div>
        );
    }

    if (!contract) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6">
                <TriangleAlert size={64} className="text-amber-500 mb-4" />
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Không tìm thấy hợp đồng</h2>
                <button onClick={() => navigate('/landlord/contracts')} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    const isDraft = contract.status === 'draft';
    const isSignedByTenant = contract.status === 'signed_by_tenant';
    const isActive = contract.status === 'active';
    const hasHandoverInfo = contract.handover_electricity_index && contract.handover_water_index;
    const canSign = isSignedByTenant && contract.landlord_cccd_front_url && contract.landlord_cccd_back_url && hasHandoverInfo && acceptedTerms;

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <button onClick={() => navigate('/landlord/contracts')} className="flex items-center text-gray-600 hover:text-gray-900 mb-4">
                        <ArrowLeft size={20} className="mr-2" />
                        Quay lại danh sách
                    </button>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <FileText className="text-indigo-600" size={36} />
                                Chi tiết hợp đồng
                            </h1>
                            <p className="text-gray-600 mt-2">Phòng {contract.room_number} - {contract.building_name}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-full font-semibold ${isActive ? 'bg-green-100 text-green-700' :
                            isSignedByTenant ? 'bg-blue-100 text-blue-700' :
                                'bg-gray-100 text-gray-700'
                            }`}>
                            {isActive ? '✅ Đang hoạt động' :
                                isSignedByTenant ? '⏳ Chờ bạn ký' :
                                    '📝 Bản nháp'}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Tenant Information */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <User className="text-indigo-600" size={24} />
                                Thông tin người thuê
                            </h2>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="text-sm text-gray-600">Họ và tên</label>
                                    <p className="font-semibold text-gray-900">{contract.tenant_full_name || contract.tenant_name}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Số CCCD</label>
                                    <p className="font-semibold text-gray-900">{contract.tenant_id_number || 'Chưa cập nhật'}</p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Ngày sinh</label>
                                    <p className="font-semibold text-gray-900">
                                        {contract.tenant_dob ? new Date(contract.tenant_dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                                    </p>
                                </div>
                                <div>
                                    <label className="text-sm text-gray-600">Email</label>
                                    <p className="font-semibold text-gray-900">{contract.tenant_email}</p>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-sm text-gray-600">Địa chỉ thường trú</label>
                                    <p className="font-semibold text-gray-900">{contract.tenant_address || 'Chưa cập nhật'}</p>
                                </div>
                            </div>

                            {/* Tenant CCCD Images */}
                            {contract.tenant_cccd_front_url && (
                                <div>
                                    <h3 className="font-semibold text-gray-900 mb-3">CCCD người thuê</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="relative group">
                                            <img
                                                src={contract.tenant_cccd_front_url}
                                                alt="CCCD Front"
                                                className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                                            />
                                            <button
                                                onClick={() => setZoomImage(contract.tenant_cccd_front_url)}
                                                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                            >
                                                <ZoomIn className="text-white" size={32} />
                                            </button>
                                            <p className="text-xs text-center text-gray-600 mt-1">Mặt trước</p>
                                        </div>
                                        <div className="relative group">
                                            <img
                                                src={contract.tenant_cccd_back_url}
                                                alt="CCCD Back"
                                                className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
                                            />
                                            <button
                                                onClick={() => setZoomImage(contract.tenant_cccd_back_url)}
                                                className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                                            >
                                                <ZoomIn className="text-white" size={32} />
                                            </button>
                                            <p className="text-xs text-center text-gray-600 mt-1">Mặt sau</p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Contract Terms - Editable */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                    <FileText className="text-indigo-600" size={24} />
                                    Điều khoản hợp đồng
                                </h2>
                                {isDraft && !isEditingTerms && (
                                    <button
                                        onClick={() => setIsEditingTerms(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                                    >
                                        <Pencil size={16} />
                                        Chỉnh sửa
                                    </button>
                                )}
                                {isEditingTerms && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSaveTerms}
                                            disabled={isSavingTerms}
                                            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                        >
                                            {isSavingTerms ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                                            Lưu
                                        </button>
                                        <button
                                            onClick={() => {
                                                setIsEditingTerms(false);
                                                setTerms(contract.contract_content?.terms || []);
                                            }}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                        >
                                            Hủy
                                        </button>
                                    </div>
                                )}
                            </div>

                            {!isDraft && (
                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
                                    ⚠️ Không thể chỉnh sửa điều khoản sau khi người thuê đã ký
                                </div>
                            )}

                            <div className="space-y-3">
                                {isEditingTerms ? (
                                    <>
                                        {terms.map((term, index) => (
                                            <div key={index} className="flex gap-2">
                                                <textarea
                                                    value={term}
                                                    onChange={(e) => handleTermChange(index, e.target.value)}
                                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                                    rows="2"
                                                    placeholder={`Điều khoản ${index + 1}`}
                                                />
                                                <button
                                                    onClick={() => handleRemoveTerm(index)}
                                                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                                >
                                                    <X size={20} />
                                                </button>
                                            </div>
                                        ))}
                                        <button
                                            onClick={handleAddTerm}
                                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-indigo-500 hover:text-indigo-600 flex items-center justify-center gap-2"
                                        >
                                            <Plus size={20} />
                                            Thêm điều khoản
                                        </button>
                                    </>
                                ) : (
                                    terms.map((term, index) => (
                                        <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                                            <span className="flex-shrink-0 w-6 h-6 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-semibold">
                                                {index + 1}
                                            </span>
                                            <p className="text-gray-700 flex-1">{term}</p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Landlord CCCD Upload */}
                        {isSignedByTenant && !contract.landlord_cccd_front_url && (
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <ImageIcon className="text-indigo-600" size={24} />
                                    Upload CCCD của bạn
                                </h2>
                                <p className="text-sm text-gray-600 mb-6">
                                    Vui lòng upload ảnh CCCD của bạn để hoàn tất việc ký hợp đồng
                                </p>

                                <div className="grid grid-cols-2 gap-4 mb-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Mặt trước *</label>
                                        <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-indigo-500 transition-colors">
                                            {landlordFrontPreview ? (
                                                <div className="relative">
                                                    <img src={landlordFrontPreview} alt="Front" className="w-full h-48 object-cover rounded-lg" />
                                                    <button
                                                        onClick={() => { setLandlordFrontImage(null); setLandlordFrontPreview(null); }}
                                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer flex flex-col items-center justify-center h-48">
                                                    <Upload className="text-gray-400 mb-2" size={32} />
                                                    <span className="text-sm text-gray-600">Chọn ảnh</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleLandlordImageSelect(e, 'front')}
                                                        className="hidden"
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Mặt sau *</label>
                                        <div className="relative border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-indigo-500 transition-colors">
                                            {landlordBackPreview ? (
                                                <div className="relative">
                                                    <img src={landlordBackPreview} alt="Back" className="w-full h-48 object-cover rounded-lg" />
                                                    <button
                                                        onClick={() => { setLandlordBackImage(null); setLandlordBackPreview(null); }}
                                                        className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ) : (
                                                <label className="cursor-pointer flex flex-col items-center justify-center h-48">
                                                    <Upload className="text-gray-400 mb-2" size={32} />
                                                    <span className="text-sm text-gray-600">Chọn ảnh</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleLandlordImageSelect(e, 'back')}
                                                        className="hidden"
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {landlordFrontImage && landlordBackImage && (
                                    <button
                                        onClick={handleUploadLandlordCCCD}
                                        disabled={isUploadingCCCD}
                                        className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {isUploadingCCCD ? (
                                            <>
                                                <Loader className="animate-spin" size={20} />
                                                Đang upload...
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={20} />
                                                Lưu ảnh CCCD
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Handover Information Section */}
                        {isSignedByTenant && (
                            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                        <FileText className="text-indigo-600" size={24} />
                                        Thông tin bàn giao
                                    </h2>
                                    {!hasHandoverInfo && !showHandoverForm && (
                                        <button
                                            onClick={() => setShowHandoverForm(true)}
                                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium"
                                        >
                                            Điền thông tin
                                        </button>
                                    )}
                                </div>

                                {hasHandoverInfo ? (
                                    <div className="space-y-3">
                                        <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                            <div className="flex items-center gap-2 text-green-700 mb-2">
                                                <CircleCheck size={20} />
                                                <span className="font-semibold">Đã hoàn tất thông tin bàn giao</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4 mt-3 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Chỉ số điện:</span>
                                                    <span className="ml-2 font-semibold text-gray-900">
                                                        {contract.handover_electricity_index} kWh
                                                    </span>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Chỉ số nước:</span>
                                                    <span className="ml-2 font-semibold text-gray-900">
                                                        {contract.handover_water_index} m³
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : showHandoverForm ? (
                                    <HandoverForm
                                        contractId={id}
                                        onSave={() => {
                                            setShowHandoverForm(false);
                                            fetchContract();
                                        }}
                                        onCancel={() => setShowHandoverForm(false)}
                                    />
                                ) : (
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
                                        ⚠️ Vui lòng điền thông tin bàn giao trước khi ký hợp đồng
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right Column */}
                    <div className="space-y-6">
                        {/* Contract Info */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4">Thông tin hợp đồng</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <Calendar className="text-gray-400" size={16} />
                                    <span className="text-gray-600">Bắt đầu:</span>
                                    <span className="font-semibold">{new Date(contract.start_date).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Calendar className="text-gray-400" size={16} />
                                    <span className="text-gray-600">Kết thúc:</span>
                                    <span className="font-semibold">{new Date(contract.end_date).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <div className="border-t pt-3">
                                    <div className="text-gray-600">Tiền cọc:</div>
                                    <div className="text-xl font-bold text-indigo-600">{contract.deposit_amount?.toLocaleString('vi-VN')} VNĐ</div>
                                </div>
                                <div>
                                    <div className="text-gray-600">Tiền thuê/tháng:</div>
                                    <div className="text-xl font-bold text-green-600">{contract.monthly_price?.toLocaleString('vi-VN')} VNĐ</div>
                                </div>
                            </div>
                        </div>

                        {/* Signing Section */}
                        {isSignedByTenant && (
                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-lg p-6 border-2 border-indigo-200">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <PenTool className="text-indigo-600" size={20} />
                                    Ký hợp đồng
                                </h3>

                                <div className="space-y-4">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={acceptedTerms}
                                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                                            className="mt-1 w-5 h-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                                        />
                                        <span className="text-sm text-gray-700">
                                            Tôi xác nhận đã kiểm tra thông tin người thuê và đồng ý với các điều khoản hợp đồng
                                        </span>
                                    </label>

                                    <button
                                        onClick={handleSign}
                                        disabled={!canSign || isSigning}
                                        className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center gap-2 transition-all ${canSign && !isSigning
                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg'
                                            : 'bg-gray-400 cursor-not-allowed'
                                            }`}
                                    >
                                        {isSigning ? (
                                            <>
                                                <Loader className="animate-spin" size={20} />
                                                Đang ký...
                                            </>
                                        ) : (
                                            <>
                                                <PenTool size={20} />
                                                Ký hợp đồng
                                            </>
                                        )}
                                    </button>

                                    {!canSign && (
                                        <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg space-y-1">
                                            {!contract.landlord_cccd_front_url && <div>⚠️ Vui lòng upload CCCD của bạn</div>}
                                            {!hasHandoverInfo && <div>⚠️ Vui lòng hoàn tất thông tin bàn giao</div>}
                                            {!acceptedTerms && <div>⚠️ Vui lòng xác nhận đồng ý với hợp đồng</div>}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Signature Status */}
                        <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                            <h3 className="font-bold text-gray-900 mb-4">Trạng thái ký</h3>
                            <div className="space-y-3">
                                <div className={`flex items-center gap-3 p-3 rounded-lg ${contract.tenant_signed_at ? 'bg-green-50' : 'bg-gray-50'
                                    }`}>
                                    {contract.tenant_signed_at ? (
                                        <CircleCheck className="text-green-600" size={20} />
                                    ) : (
                                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                                    )}
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900">Người thuê</div>
                                        {contract.tenant_signed_at && (
                                            <div className="text-xs text-gray-600">
                                                {new Date(contract.tenant_signed_at).toLocaleString('vi-VN')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className={`flex items-center gap-3 p-3 rounded-lg ${contract.landlord_signed_at ? 'bg-green-50' : 'bg-gray-50'
                                    }`}>
                                    {contract.landlord_signed_at ? (
                                        <CircleCheck className="text-green-600" size={20} />
                                    ) : (
                                        <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                                    )}
                                    <div className="flex-1">
                                        <div className="font-semibold text-gray-900">Chủ nhà (Bạn)</div>
                                        {contract.landlord_signed_at && (
                                            <div className="text-xs text-gray-600">
                                                {new Date(contract.landlord_signed_at).toLocaleString('vi-VN')}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Image Zoom Modal */}
            {zoomImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                    onClick={() => setZoomImage(null)}
                >
                    <div className="relative max-w-4xl max-h-full">
                        <img src={zoomImage} alt="Zoomed" className="max-w-full max-h-screen object-contain" />
                        <button
                            onClick={() => setZoomImage(null)}
                            className="absolute top-4 right-4 bg-white text-gray-900 p-2 rounded-full hover:bg-gray-200"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandlordContractDetail;
