import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getMyBuildings, createBuilding, reset } from '../../features/properties/propertySlice';
import { Plus, Home, MapPin, MoreVertical, Zap, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';
import aiService from '../../services/aiService';
import LocationPicker from '../../components/LocationPicker';

const PropertyCard = ({ building }) => (
    <div className="glass p-5 rounded-2xl card-hover relative group">
        <div className="absolute top-4 right-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
            <MoreVertical size={20} />
        </div>

        <div className="flex items-start space-x-4">
            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                <Home size={24} />
            </div>
            <div>
                <h3 className="text-lg font-bold text-gray-800">{building.name}</h3>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                    <MapPin size={14} className="mr-1" /> {building.address}
                </p>
            </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-2 rounded-lg text-center">
                <p className="text-gray-400 text-xs uppercase">Số tầng</p>
                <p className="font-semibold text-gray-700">{building.total_floors}</p>
            </div>
            <div className="bg-gray-50 p-2 rounded-lg text-center">
                <p className="text-gray-400 text-xs uppercase">Loại hình</p>
                <p className="font-semibold text-gray-700 capitalize">{building.type}</p>
            </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
            <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-500">
                        P{i}
                    </div>
                ))}
                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-xs font-medium text-gray-500">+5</div>
            </div>
            <Link to={`/landlord/properties/${building.building_id}`} className="text-indigo-600 text-sm font-medium hover:text-indigo-800">Chi tiết &rarr;</Link>
        </div>
    </div>
);

const PropertyList = () => {
    const dispatch = useDispatch();
    const { buildings, isLoading, isError, message } = useSelector((state) => state.properties);
    const [showAddModal, setShowAddModal] = useState(false);

    // Form State
    const [newBuilding, setNewBuilding] = useState({
        name: '',
        type: 'apartment',
        totalFloors: 1,
        description: '',
        detailAddress: '',
        coordinates: null // { lat, lng }
    });

    // Address State
    const [provinces, setProvinces] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const [selectedProvince, setSelectedProvince] = useState('');
    const [selectedDistrict, setSelectedDistrict] = useState('');
    const [selectedWard, setSelectedWard] = useState('');

    const [loadingLocation, setLoadingLocation] = useState(false);

    useEffect(() => {
        dispatch(getMyBuildings());
        return () => {
            dispatch(reset());
        }
    }, [dispatch]);

    // Fetch Provinces on Load
    useEffect(() => {
        const fetchProvinces = async () => {
            try {
                const res = await axios.get('https://provinces.open-api.vn/api/?depth=1');
                setProvinces(res.data);
            } catch (error) {
                console.error("Failed to fetch provinces", error);
            }
        };
        fetchProvinces();
    }, []);

    // Fetch Districts when Province changes
    useEffect(() => {
        if (!selectedProvince) {
            setDistricts([]);
            setWards([]);
            return;
        }
        const fetchDistricts = async () => {
            setLoadingLocation(true);
            try {
                const res = await axios.get(`https://provinces.open-api.vn/api/p/${selectedProvince}?depth=2`);
                setDistricts(res.data.districts);
                setSelectedDistrict('');
                setWards([]);
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingLocation(false);
            }
        };
        fetchDistricts();
    }, [selectedProvince]);

    // Fetch Wards when District changes
    useEffect(() => {
        if (!selectedDistrict) {
            setWards([]);
            return;
        }
        const fetchWards = async () => {
            setLoadingLocation(true);
            try {
                const res = await axios.get(`https://provinces.open-api.vn/api/d/${selectedDistrict}?depth=2`);
                setWards(res.data.wards);
                setSelectedWard('');
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingLocation(false);
            }
        };
        fetchWards();
    }, [selectedDistrict]);


    const handleAddBuilding = (e) => {
        e.preventDefault();

        // Construct full address
        const provinceName = provinces.find(p => p.code == selectedProvince)?.name || '';
        const districtName = districts.find(d => d.code == selectedDistrict)?.name || '';
        const wardName = wards.find(w => w.code == selectedWard)?.name || '';

        // Validate address
        if (!provinceName || !districtName || !wardName || !newBuilding.detailAddress) {
            alert("Vui lòng nhập đầy đủ địa chỉ!");
            return;
        }

        const fullAddress = `${newBuilding.detailAddress}, ${wardName}, ${districtName}, ${provinceName}`;

        dispatch(createBuilding({
            ...newBuilding,
            address: fullAddress,
            coordinates: newBuilding.coordinates ? JSON.stringify(newBuilding.coordinates) : null
        }));

        setShowAddModal(false);
        // Reset form
        setNewBuilding({ name: '', type: 'apartment', totalFloors: 1, description: '', detailAddress: '', coordinates: null });
        setSelectedProvince('');
        setSelectedDistrict('');
        setSelectedWard('');
    };

    if (isLoading && !showAddModal) return <div className="text-center p-10"><Loader2 className="animate-spin mx-auto text-indigo-600" /></div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Tòa nhà & Phòng</h1>
                    <p className="text-gray-500">Danh sách các bất động sản bạn đang quản lý</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-indigo-700 transition flex items-center"
                >
                    <Plus size={20} className="mr-2" /> Thêm Tòa nhà
                </button>
            </div>

            {isError && <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4">{message}</div>}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {buildings.map((building) => (
                    <PropertyCard key={building.building_id} building={building} />
                ))}

                {/* Empty State / Add New Placeholder */}
                {buildings.length === 0 && (
                    <div onClick={() => setShowAddModal(true)} className="border-2 border-dashed border-gray-300 rounded-2xl p-10 flex flex-col items-center justify-center text-gray-400 cursor-pointer hover:border-indigo-500 hover:text-indigo-500 transition-colors h-full min-h-[250px]">
                        <Plus size={48} className="mb-4" />
                        <p className="font-medium">Chưa có tòa nhà nào</p>
                        <p className="text-sm">Bấm để thêm mới</p>
                    </div>
                )}
            </div>

            {/* Simple Modal for Add Building */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl animate-in fade-in zoom-in duration-200 my-8">
                        <h2 className="text-xl font-bold mb-4 text-gray-800">Thêm Tòa nhà Mới</h2>
                        <form onSubmit={handleAddBuilding} className="space-y-4">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Tên tòa nhà (Ví dụ: Trọ Xanh House 1)</label>
                                    <input
                                        type="text"
                                        required
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2.5"
                                        value={newBuilding.name}
                                        onChange={(e) => setNewBuilding({ ...newBuilding, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Address Selection */}
                            <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                                <h3 className="text-sm font-semibold text-gray-700 flex items-center"><MapPin size={16} className="mr-2" /> Địa chỉ</h3>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <select
                                            required
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm"
                                            value={selectedProvince}
                                            onChange={(e) => setSelectedProvince(e.target.value)}
                                        >
                                            <option value="">Tỉnh/Thành</option>
                                            {provinces.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <select
                                            required
                                            disabled={!selectedProvince}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm disabled:bg-gray-200"
                                            value={selectedDistrict}
                                            onChange={(e) => setSelectedDistrict(e.target.value)}
                                        >
                                            <option value="">Quận/Huyện</option>
                                            {districts.map(d => <option key={d.code} value={d.code}>{d.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <select
                                            required
                                            disabled={!selectedDistrict}
                                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2 text-sm disabled:bg-gray-200"
                                            value={selectedWard}
                                            onChange={(e) => setSelectedWard(e.target.value)}
                                        >
                                            <option value="">Phường/Xã</option>
                                            {wards.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <input
                                        type="text"
                                        required
                                        placeholder="Số nhà, tên đường..."
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2.5 text-sm"
                                        value={newBuilding.detailAddress}
                                        onChange={(e) => setNewBuilding({ ...newBuilding, detailAddress: e.target.value })}
                                    />
                                </div>
                            </div>

                            {/* Map Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Vị trí bản đồ</label>
                                <LocationPicker
                                    position={newBuilding.coordinates}
                                    onLocationChange={(latlng) => setNewBuilding({ ...newBuilding, coordinates: latlng })}
                                />
                                {newBuilding.coordinates && (
                                    <p className="text-xs text-green-600 mt-1">Đã chọn: {newBuilding.coordinates.lat.toFixed(6)}, {newBuilding.coordinates.lng.toFixed(6)}</p>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Loại hình</label>
                                    <select
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2.5"
                                        value={newBuilding.type}
                                        onChange={(e) => setNewBuilding({ ...newBuilding, type: e.target.value })}
                                    >
                                        <option value="apartment">Chung cư mini</option>
                                        <option value="house">Nhà nguyên căn</option>
                                        <option value="room">Phòng trọ lẻ</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Số tầng</label>
                                    <input
                                        type="number"
                                        min="1"
                                        className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2.5"
                                        value={newBuilding.totalFloors}
                                        onChange={(e) => setNewBuilding({ ...newBuilding, totalFloors: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Mô tả (Tiện ích, nội quy...)</label>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            if (!newBuilding.name || !newBuilding.detailAddress) {
                                                alert("Vui lòng nhập tên và địa chỉ trước khi dùng AI");
                                                return;
                                            }
                                            // Construct address from state
                                            const provinceName = provinces.find(p => p.code == selectedProvince)?.name || '';
                                            const districtName = districts.find(d => d.code == selectedDistrict)?.name || '';
                                            const fullAddress = `${newBuilding.detailAddress}, ${districtName}, ${provinceName}`;

                                            try {
                                                const res = await aiService.generateDescription({
                                                    title: newBuilding.name,
                                                    price: 0, // Building doesn't have a single price
                                                    area: 0,
                                                    location: fullAddress,
                                                    amenities: [newBuilding.type === 'apartment' ? 'Chung cư mini' : 'Nhà trọ'], // Hint for AI
                                                    type: 'Tòa nhà/Chung cư mini'
                                                });
                                                if (res.description) {
                                                    setNewBuilding(prev => ({ ...prev, description: res.description }));
                                                }
                                            } catch (e) {
                                                alert("Lỗi AI: " + e.message);
                                            }
                                        }}
                                        className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 text-xs font-bold"
                                    >
                                        <Sparkles size={14} /> AI Gợi ý
                                    </button>
                                </div>
                                <textarea
                                    className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border p-2.5"
                                    rows="3"
                                    value={newBuilding.description}
                                    onChange={(e) => setNewBuilding({ ...newBuilding, description: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6 pt-4 border-t">
                                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
                                <button type="submit" disabled={isLoading} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center">
                                    {isLoading && <Loader2 className="animate-spin mr-2 h-4 w-4" />}
                                    Tạo tòa nhà
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PropertyList;
