import React, { useState, useEffect } from 'react';
import { Zap, Droplet, DollarSign, Package, FileText, Save, Loader } from 'lucide-react';
import contractService from '../services/contractService';

const HandoverForm = ({ contractId, onSave, onCancel }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Handover data
    const [electricityIndex, setElectricityIndex] = useState('');
    const [waterIndex, setWaterIndex] = useState('');
    const [utilityConfigs, setUtilityConfigs] = useState([]);
    const [roomAssets, setRoomAssets] = useState([]);
    const [additionalServices, setAdditionalServices] = useState([
        { name: 'Wifi', price: 100000, unit: 'tháng', included: true },
        { name: 'Rác', price: 50000, unit: 'tháng', included: false },
        { name: 'Bảo vệ', price: 0, unit: 'tháng', included: true }
    ]);
    const [serviceCommitments, setServiceCommitments] = useState({
        maintenance_response_time: '24 giờ',
        repair_responsibility: 'Chủ nhà chịu trách nhiệm sửa chữa hư hỏng do hao mòn tự nhiên',
        cleaning_frequency: 'Vệ sinh hành lang 2 lần/tuần',
        other: []
    });

    useEffect(() => {
        fetchData();
    }, [contractId]);

    const fetchData = async () => {
        try {
            const [configs, assets] = await Promise.all([
                contractService.getUtilityConfigs(contractId),
                contractService.getRoomAssets(contractId)
            ]);
            setUtilityConfigs(configs);
            setRoomAssets(assets);
        } catch (error) {
            console.error('Error fetching handover data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!electricityIndex || !waterIndex) {
            alert('Vui lòng nhập chỉ số điện và nước');
            return;
        }

        try {
            setSaving(true);
            await contractService.saveHandoverInfo(contractId, {
                electricity_index: parseInt(electricityIndex),
                water_index: parseInt(waterIndex),
                service_commitments: serviceCommitments,
                additional_services: additionalServices
            });
            alert('Đã lưu thông tin bàn giao thành công!');
            if (onSave) onSave();
        } catch (error) {
            alert(error.response?.data?.message || 'Có lỗi khi lưu thông tin bàn giao');
        } finally {
            setSaving(false);
        }
    };

    const addOtherCommitment = () => {
        setServiceCommitments({
            ...serviceCommitments,
            other: [...serviceCommitments.other, '']
        });
    };

    const updateOtherCommitment = (index, value) => {
        const newOther = [...serviceCommitments.other];
        newOther[index] = value;
        setServiceCommitments({ ...serviceCommitments, other: newOther });
    };

    const removeOtherCommitment = (index) => {
        setServiceCommitments({
            ...serviceCommitments,
            other: serviceCommitments.other.filter((_, i) => i !== index)
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Utility Readings */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap className="text-amber-500" size={20} />
                    Chỉ số điện nước ban đầu
                </h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chỉ số điện (kWh) *
                        </label>
                        <input
                            type="number"
                            value={electricityIndex}
                            onChange={(e) => setElectricityIndex(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Ví dụ: 1000"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chỉ số nước (m³) *
                        </label>
                        <input
                            type="number"
                            value={waterIndex}
                            onChange={(e) => setWaterIndex(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            placeholder="Ví dụ: 200"
                        />
                    </div>
                </div>
            </div>

            {/* Utility Prices */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <DollarSign className="text-green-500" size={20} />
                    Giá dịch vụ
                </h3>
                <div className="space-y-3">
                    {utilityConfigs.map((config) => (
                        <div key={config.config_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div>
                                <span className="font-semibold text-gray-900">{config.name}</span>
                                <span className="text-sm text-gray-600 ml-2">
                                    ({config.type === 'electricity' ? 'Điện' : 'Nước'})
                                </span>
                            </div>
                            <div className="text-lg font-bold text-indigo-600">
                                {config.price.toLocaleString('vi-VN')} VNĐ
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Additional Services */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Package className="text-blue-500" size={20} />
                    Dịch vụ bổ sung
                </h3>
                <div className="space-y-3">
                    {additionalServices.map((service, index) => (
                        <div key={index} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                            <input
                                type="checkbox"
                                checked={service.included}
                                onChange={(e) => {
                                    const newServices = [...additionalServices];
                                    newServices[index].included = e.target.checked;
                                    setAdditionalServices(newServices);
                                }}
                                className="w-5 h-5 text-indigo-600 rounded"
                            />
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={service.name}
                                    onChange={(e) => {
                                        const newServices = [...additionalServices];
                                        newServices[index].name = e.target.value;
                                        setAdditionalServices(newServices);
                                    }}
                                    className="font-semibold text-gray-900 bg-transparent border-none focus:outline-none"
                                />
                            </div>
                            <input
                                type="number"
                                value={service.price}
                                onChange={(e) => {
                                    const newServices = [...additionalServices];
                                    newServices[index].price = parseInt(e.target.value) || 0;
                                    setAdditionalServices(newServices);
                                }}
                                className="w-32 px-3 py-1 border border-gray-300 rounded-lg text-right"
                            />
                            <span className="text-sm text-gray-600">VNĐ/{service.unit}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Room Assets */}
            {roomAssets.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Package className="text-purple-500" size={20} />
                        Tài sản trong phòng
                    </h3>
                    <div className="space-y-2">
                        {roomAssets.map((asset) => (
                            <div key={asset.asset_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <span className="font-medium text-gray-900">{asset.item_name}</span>
                                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${asset.condition_status === 'new' ? 'bg-green-100 text-green-700' :
                                    asset.condition_status === 'good' ? 'bg-blue-100 text-blue-700' :
                                        'bg-amber-100 text-amber-700'
                                    }`}>
                                    {asset.condition_status === 'new' ? 'Mới' :
                                        asset.condition_status === 'good' ? 'Tốt' : 'Hư hỏng'}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Service Commitments */}
            <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <FileText className="text-indigo-500" size={20} />
                    Cam kết dịch vụ
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Thời gian phản hồi bảo trì
                        </label>
                        <input
                            type="text"
                            value={serviceCommitments.maintenance_response_time}
                            onChange={(e) => setServiceCommitments({
                                ...serviceCommitments,
                                maintenance_response_time: e.target.value
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Trách nhiệm sửa chữa
                        </label>
                        <textarea
                            value={serviceCommitments.repair_responsibility}
                            onChange={(e) => setServiceCommitments({
                                ...serviceCommitments,
                                repair_responsibility: e.target.value
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                            rows="2"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Tần suất vệ sinh
                        </label>
                        <input
                            type="text"
                            value={serviceCommitments.cleaning_frequency}
                            onChange={(e) => setServiceCommitments({
                                ...serviceCommitments,
                                cleaning_frequency: e.target.value
                            })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>

                    {/* Other commitments */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cam kết khác
                        </label>
                        {serviceCommitments.other.map((commitment, index) => (
                            <div key={index} className="flex gap-2 mb-2">
                                <input
                                    type="text"
                                    value={commitment}
                                    onChange={(e) => updateOtherCommitment(index, e.target.value)}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Nhập cam kết..."
                                />
                                <button
                                    onClick={() => removeOtherCommitment(index)}
                                    className="px-3 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                                >
                                    Xóa
                                </button>
                            </div>
                        ))}
                        <button
                            onClick={addOtherCommitment}
                            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                        >
                            + Thêm cam kết
                        </button>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {saving ? (
                        <>
                            <Loader className="animate-spin" size={20} />
                            Đang lưu...
                        </>
                    ) : (
                        <>
                            <Save size={20} />
                            Lưu thông tin bàn giao
                        </>
                    )}
                </button>
                {onCancel && (
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300"
                    >
                        Hủy
                    </button>
                )}
            </div>
        </div>
    );
};

export default HandoverForm;
