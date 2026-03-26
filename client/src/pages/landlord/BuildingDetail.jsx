import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getBuilding, getRooms, createRoom, updateRoom, deleteRoom, getRoomDetails, reset } from '../../features/properties/propertySlice';
import propertyService from '../../services/propertyService';
import listingService from '../../services/listingService';
import aiService from '../../services/aiService';
import {
    Building2,
    MapPin,
    Plus,
    ArrowLeft,
    X,
    Image as ImageIcon,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    Loader2,
    Tv,
    Bed as BedIcon,
    Wind,
    Refrigerator,
    Table as TableIcon,
    Trash2,
    FileText,
    Video,
    Globe,
    Wrench,
    Check,
    Zap,
    Droplets,
    CircleDollarSign,
    Sparkles,
    RefreshCw
} from 'lucide-react';
import LocationPicker from '../../components/LocationPicker';

const AMENITIES_LIST = [
    { id: 'fridge', name: 'Tủ lạnh', icon: Refrigerator },
    { id: 'air_conditioner', name: 'Điều hòa', icon: Wind },
    { id: 'washing_machine', name: 'Máy giặt', icon: Loader2 },
    { id: 'television', name: 'Tivi', icon: Tv },
    { id: 'bed', name: 'Giường', icon: BedIcon },
    { id: 'wardrobe', name: 'Tủ quần áo', icon: FileText },
    { id: 'table', name: 'Bàn', icon: TableIcon },
];

const AmenityVerifyItem = ({ amenity, onVerified, isVerified, currentImageUrl }) => {
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setVerifying(true);
        setError('');
        try {
            // 1. AI Verification
            const aiRes = await propertyService.verifyAmenity(amenity.id, file);

            if (aiRes.error) {
                setError(`Lỗi AI: ${aiRes.error}. Vui lòng thử lại.`);
                setVerifying(false);
                return;
            }

            if (!aiRes.is_valid) {
                setError(`Không nhận diện được ${amenity.name}. Vui lòng chụp lại rõ hơn!`);
                setVerifying(false);
                return;
            }

            // 2. Upload to Cloudinary
            const uploadRes = await propertyService.uploadImage(file);
            onVerified(amenity.id, uploadRes.url);
        } catch (err) {
            console.error(err);
            setError('Không thể kết nối với dịch vụ AI. Vui lòng kiểm tra server AI.');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className={`p-3 rounded-xl border transition-all ${isVerified ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${isVerified ? 'bg-green-100 text-green-600' : 'bg-white text-gray-400'}`}>
                        <amenity.icon size={18} />
                    </div>
                    <span className={`text-sm font-bold ${isVerified ? 'text-green-700' : 'text-gray-500'}`}>{amenity.name}</span>
                </div>
                {isVerified ? (
                    <div className="flex items-center gap-2">
                        <img src={currentImageUrl} className="w-8 h-8 rounded object-cover border" alt="verified" />
                        <CheckCircle2 size={16} className="text-green-600" />
                    </div>
                ) : (
                    <label className="cursor-pointer bg-white border px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:bg-indigo-50 transition shadow-sm">
                        {verifying ? <Loader2 size={12} className="animate-spin" /> : 'Chụp ảnh'}
                        <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={verifying} />
                    </label>
                )}
            </div>
            {error && <p className="text-[9px] text-red-500 font-bold mt-2 flex items-center gap-1"><AlertCircle size={10} /> {error}</p>}
        </div>
    );
};

// AI Amenity Verifier for Room Detail Edit Mode
const AIAmenityVerifier = ({ amenityId, onVerified }) => {
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const amenity = AMENITIES_LIST.find(a => a.id === amenityId);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setVerifying(true);
        setError('');
        try {
            // 1. AI Verification
            const aiRes = await propertyService.verifyAmenity(amenityId, file);

            if (aiRes.error) {
                setError(`Lỗi AI: ${aiRes.error}`);
                setVerifying(false);
                return;
            }

            if (!aiRes.is_valid) {
                setError(`Không nhận diện được ${amenity?.name || 'tiện ích'}`);
                setVerifying(false);
                return;
            }

            // 2. Upload
            const uploadRes = await propertyService.uploadImage(file);
            onVerified(uploadRes.url);
        } catch (err) {
            console.error(err);
            setError('Lỗi kết nối AI');
        } finally {
            setVerifying(false);
        }
    };

    return (
        <div className="mt-2">
            <label className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:bg-indigo-100 transition shadow-sm border border-indigo-100">
                {verifying ? (
                    <>
                        <Loader2 size={14} className="animate-spin" />
                        Đang xác thực...
                    </>
                ) : (
                    <>
                        <ImageIcon size={14} />
                        Xác thực bằng ảnh
                    </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} disabled={verifying} />
            </label>
            {error && <p className="mt-1 text-[9px] text-red-500 font-bold">{error}</p>}
        </div>
    );
};


const RoomListingTab = ({ room }) => {
    const [listing, setListing] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const [formData, setFormData] = useState({
        title: `Phòng ${room.room_number} tại ${room.building_name || 'Tòa nhà'}`,
        description: room.description || '',
        rent_price: room.base_price,
        deposit_amount: room.base_price,
        electricity_price: room.electricity_price || 0,
        water_price: room.water_price || 0,
        service_price: room.service_price || 0,
        amenities: typeof room.amenities === 'string' ? JSON.parse(room.amenities) : (room.amenities || {})
    });

    useEffect(() => {
        const fetchListing = async () => {
            try {
                const data = await listingService.getListingByRoom(room.room_id);
                setListing(data);
                if (data) {
                    setFormData({
                        title: data.title,
                        description: data.description,
                        rent_price: data.rent_price,
                        deposit_amount: data.deposit_amount,
                        electricity_price: data.electricity_price || 0,
                        water_price: data.water_price || 0,
                        service_price: data.service_price || 0,
                        amenities: typeof data.amenities === 'string' ? JSON.parse(data.amenities) : (data.amenities || {})
                    });
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchListing();
    }, [room.room_id]);

    const handleAIGenerate = async () => {
        setIsGeneratingAI(true);
        try {
            // Collect data for AI
            const amenitiesList = AMENITIES_LIST.filter(a => formData.amenities[a.id]).map(a => a.name);
            const requestData = {
                title: formData.title,
                amenities: amenitiesList,
                price: formData.rent_price,
                area: room.area,
                location: room.address || 'Khu vực trung tâm' // Assuming room has address or fallback
            };

            const result = await aiService.generateDescription(requestData);
            if (result.description) {
                // Determine new title from response if possible, or keep old one. 
                // Gemini might return full markdown. We'll simply append or replace description.
                // For better UX, let's just replace the description for now.
                setFormData(prev => ({
                    ...prev,
                    description: result.description
                }));
            }
        } catch (error) {
            console.error(error);
            alert('Lỗi khi tạo mô tả tự động: ' + (error.response?.data?.message || error.message));
        } finally {
            setIsGeneratingAI(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (listing) {
                await listingService.updateListing(listing.listing_id, { ...formData, status: listing.status });
                alert('Cập nhật tin đăng thành công!');
            } else {
                const res = await listingService.createListing({ ...formData, room_id: room.room_id });
                setListing({ ...formData, listing_id: res.listingId, status: 'active' });
                alert('Đăng tin thành công!');
            }
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            alert('Có lỗi xảy ra!');
        }
    };

    const toggleStatus = async () => {
        const newStatus = listing.status === 'active' ? 'paused' : 'active';
        try {
            await listingService.updateListing(listing.listing_id, { ...formData, status: newStatus });
            setListing({ ...listing, status: newStatus });
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="text-center py-10">Đang tải...</div>;

    return (
        <div className="space-y-6">
            {!listing && !isEditing ? (
                <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-gray-200 text-center flex flex-col items-center">
                    <Globe size={48} className="text-gray-300 mb-4" />
                    <h3 className="text-lg font-bold text-gray-800">Phòng này chưa được đăng tin</h3>
                    <p className="text-sm text-gray-500 max-w-xs mt-2 mb-6">Đăng tin để người dùng có thể tìm thấy và thuê phòng này trên ứng dụng.</p>
                    <button
                        onClick={() => setIsEditing(true)}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition"
                    >
                        Tạo tin đăng ngay
                    </button>
                </div>
            ) : isEditing ? (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tiêu đề tin đăng</label>
                        <input
                            type="text" required
                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Mô tả chi tiết</label>
                            <button
                                type="button"
                                onClick={handleAIGenerate}
                                disabled={isGeneratingAI}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg text-[10px] font-black uppercase tracking-widest shadow-md hover:shadow-lg hover:from-indigo-700 hover:to-purple-700 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isGeneratingAI ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                                {isGeneratingAI ? 'Đang viết...' : 'AI Gợi ý mô tả'}
                            </button>
                        </div>
                        <div className="relative">
                            <textarea
                                rows="12" required
                                className={`w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-opacity ${isGeneratingAI ? 'opacity-50' : 'opacity-100'}`}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                placeholder="Mô tả chi tiết về phòng trọ..."
                            ></textarea>
                            {isGeneratingAI && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="flex items-center gap-2 bg-white/90 backdrop-blur px-4 py-2 rounded-full shadow-sm border">
                                        <Sparkles size={16} className="text-purple-600 animate-pulse" />
                                        <span className="text-xs font-bold text-gray-600 typing-effect">AI đang suy nghĩ ý tưởng...</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Giá thuê (VNĐ)</label>
                            <input
                                type="number" required
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.rent_price}
                                onChange={(e) => setFormData({ ...formData, rent_price: parseInt(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tiền cọc (VNĐ)</label>
                            <input
                                type="number" required
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.deposit_amount}
                                onChange={(e) => setFormData({ ...formData, deposit_amount: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Zap size={12} className="text-yellow-500" /> Điện (đ/kWh)</label>
                            <input
                                type="number" required
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.electricity_price}
                                onChange={(e) => setFormData({ ...formData, electricity_price: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Droplets size={12} className="text-blue-500" /> Nước (đ/m³)</label>
                            <input
                                type="number" required
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.water_price}
                                onChange={(e) => setFormData({ ...formData, water_price: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><CircleDollarSign size={12} className="text-green-500" /> Dịch vụ</label>
                            <input
                                type="number" required
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                value={formData.service_price}
                                onChange={(e) => setFormData({ ...formData, service_price: parseFloat(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Tiện ích đi kèm (Đã nhập từ phòng)</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {AMENITIES_LIST.map(amenity => {
                                const isChecked = formData.amenities[amenity.id];
                                return (
                                    <div
                                        key={amenity.id}
                                        onClick={() => {
                                            const newAmenityState = { ...formData.amenities };
                                            if (newAmenityState[amenity.id]) {
                                                delete newAmenityState[amenity.id];
                                            } else {
                                                newAmenityState[amenity.id] = { verified: false }; // Manual check
                                            }
                                            setFormData({ ...formData, amenities: newAmenityState });
                                        }}
                                        className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${isChecked
                                            ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                            : 'bg-white border-gray-100 text-gray-400 opacity-60'
                                            }`}
                                    >
                                        <amenity.icon size={16} />
                                        <span className="text-[10px] font-black uppercase tracking-tight">{amenity.name}</span>
                                        {isChecked && <CheckCircle2 size={12} className="ml-auto" />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2 text-gray-500 font-bold text-sm">Hủy</button>
                        <button type="submit" className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold text-sm hover:bg-indigo-700 shadow-md transition">
                            {listing ? 'Lưu thay đổi' : 'Đăng tin ngay'}
                        </button>
                    </div>
                </form>
            ) : (
                <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
                    <div className="p-6">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 className="text-xl font-black text-gray-900">{listing.title}</h3>
                                <div className="flex items-center gap-4 mt-2">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${listing.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                        {listing.status === 'active' ? 'Đang hiển thị' : 'Đã tạm ngưng'}
                                    </span>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        👁️ {listing.views || 0} lượt xem
                                    </span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setIsEditing(true)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600"><Wrench size={18} /></button>
                                <button onClick={toggleStatus} className={`p-2 rounded-lg transition-colors ${listing.status === 'active' ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}>
                                    {listing.status === 'active' ? <X size={18} /> : <Check size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-2xl mb-6">
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Giá thuê hàng tháng</p>
                                <p className="text-xl font-black text-indigo-600">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(listing.rent_price)}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tiền đặt cọc</p>
                                <p className="text-xl font-black text-gray-800">
                                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(listing.deposit_amount)}
                                </p>
                            </div>
                        </div>

                        <div className="mb-6">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Nội dung mô tả</p>
                            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
                        </div>

                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Các tiện ích có sẵn</p>
                            <div className="flex flex-wrap gap-2">
                                {(() => {
                                    const amenities = typeof listing.amenities === 'string' ? JSON.parse(listing.amenities) : (listing.amenities || {});
                                    return AMENITIES_LIST.filter(a => amenities[a.id]).map(amenity => (
                                        <div key={amenity.id} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                                            <amenity.icon size={14} className="text-indigo-600" />
                                            <span className="text-[10px] font-black uppercase text-gray-700">{amenity.name}</span>
                                            {amenities[amenity.id].verified && <CheckCircle2 size={10} className="text-green-500" />}
                                        </div>
                                    ));
                                })()}
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 p-4 flex justify-between items-center">
                        <span className="text-xs font-bold text-indigo-700">Tin đăng của bạn đang hoạt động trên hệ thống Smart PropTech.</span>
                        <button className="text-indigo-600 hover:text-indigo-800 font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
                            Xem trang công khai <ExternalLink size={14} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

const RoomCard = ({ room, onClick }) => {
    const statusColors = {
        'available': 'bg-green-100 text-green-700 border-green-200',
        'occupied': 'bg-red-100 text-red-700 border-red-200',
        'maintenance': 'bg-yellow-100 text-yellow-700 border-yellow-200',
        'deposited': 'bg-blue-100 text-blue-700 border-blue-200'
    };

    return (
        <div onClick={onClick} className="glass p-4 rounded-xl card-hover relative border border-white/50 cursor-pointer">
            <div className="flex justify-between items-start mb-2">
                <div className="bg-indigo-100 text-indigo-700 font-bold px-2 py-1 rounded text-sm">
                    P.{room.room_number}
                </div>
                <div className={`text-xs font-semibold px-2 py-1 rounded-full border ${statusColors[room.status] || 'bg-gray-100'}`}>
                    {room.status === 'available' ? 'Trống' :
                        room.status === 'occupied' ? 'Đã thuê' : room.status}
                </div>
            </div>

            <div className="space-y-1 text-sm text-gray-600 mb-3">
                <p>Tầng: {room.floor}</p>
                <p>Diện tích: {room.area}m²</p>
                <p className="font-bold text-indigo-600">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.base_price)}
                </p>
            </div>
        </div>
    );
}

const RoomDetailModal = ({ room, onClose, onUpdate }) => {
    const dispatch = useDispatch();
    const { currentRoomDetails } = useSelector((state) => state.properties);
    const [activeTab, setActiveTab] = useState('overview'); // overview, tenant, assets, images

    useEffect(() => {
        dispatch(getRoomDetails(room.room_id));
    }, [dispatch, room.room_id]);

    const [images, setImages] = useState(() => {
        try {
            if (Array.isArray(room.images)) return room.images;
            if (typeof room.images === 'string') return JSON.parse(room.images);
            return [];
        } catch (e) {
            console.error("Error parsing images:", e);
            return [];
        }
    });
    const [newImageUrl, setNewImageUrl] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [showUrlInput, setShowUrlInput] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        roomNumber: room.room_number,
        floor: room.floor,
        area: room.area,
        basePrice: room.base_price,
        electricityPrice: room.electricity_price || 0,
        waterPrice: room.water_price || 0,
        servicePrice: room.service_price || 0,
        description: room.description || '',
        images: Array.isArray(room.images) ? room.images : (typeof room.images === 'string' ? JSON.parse(room.images) : []),
        amenities: typeof room.amenities === 'string' ? JSON.parse(room.amenities) : (room.amenities || {})
    });

    const handleSaveEdit = async () => {
        try {
            await onUpdate(room.room_id, editForm);
            setIsEditing(false);
            alert('Cập nhật thông tin phòng thành công');
        } catch (err) {
            alert('Lỗi khi cập nhật phòng');
        }
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const data = await propertyService.uploadImage(file);
            setNewImageUrl(data.url);

            if (isEditing) {
                setEditForm(prev => ({
                    ...prev,
                    images: [...prev.images, data.url]
                }));
            } else {
                const updatedImages = [...images, data.url];
                setImages(updatedImages);
                onUpdate(room.room_id, { images: updatedImages });
            }
            setNewImageUrl('');
            setShowUrlInput(false);
        } catch (error) {
            console.error("Upload failed", error);
            alert("Upload thất bại!");
        } finally {
            setIsUploading(false);
        }
    };

    const handleAddImage = () => {
        if (!newImageUrl) return;
        if (isEditing) {
            setEditForm(prev => ({
                ...prev,
                images: [...prev.images, newImageUrl]
            }));
        } else {
            const updatedImages = [...images, newImageUrl];
            setImages(updatedImages);
            onUpdate(room.room_id, { images: updatedImages });
        }
        setNewImageUrl('');
        setShowUrlInput(false);
    };

    const handleDeleteImage = (imageUrl) => {
        if (isEditing) {
            setEditForm(prev => ({
                ...prev,
                images: prev.images.filter(img => img !== imageUrl)
            }));
        } else {
            const updatedImages = images.filter(img => img !== imageUrl);
            setImages(updatedImages);
            onUpdate(room.room_id, { images: updatedImages });
        }
    };

    const handleDeleteRoom = async () => {
        if (room.status === 'occupied') {
            alert('Không thể xóa phòng đang có người thuê!');
            return;
        }

        if (window.confirm(`Bạn có chắc chắn muốn xóa phòng ${room.room_number} không? Thao tác này không thể hoàn tác.`)) {
            try {
                await dispatch(deleteRoom(room.room_id)).unwrap();
                alert('Đã xóa phòng thành công');
                onClose();
                dispatch(getRooms(room.building_id)); // Refresh list
            } catch (err) {
                alert(err || 'Lỗi khi xóa phòng');
            }
        }
    };

    // Helper to get nested data safely
    const details = currentRoomDetails && currentRoomDetails.room_id === room.room_id ? currentRoomDetails : room;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-5xl h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="p-6 border-b flex justify-between items-center bg-gray-50/80 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white rounded-xl shadow-sm border border-transparent hover:border-gray-200 transition-all text-gray-400 hover:text-indigo-600"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3">
                                {isEditing ? (
                                    <input
                                        type="text"
                                        className="text-2xl font-black text-gray-900 tracking-tight bg-white border border-indigo-200 rounded-lg px-2 py-1 outline-none focus:ring-2 focus:ring-indigo-500"
                                        value={editForm.roomNumber}
                                        onChange={(e) => setEditForm({ ...editForm, roomNumber: e.target.value })}
                                    />
                                ) : (
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Phòng {room.room_number}</h2>
                                )}
                                <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${room.status === 'available' ? 'bg-green-100 text-green-700 border-green-200' :
                                    room.status === 'occupied' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-gray-100'
                                    }`}>
                                    {room.status === 'available' ? 'Trống' : room.status === 'occupied' ? 'Đang thuê' : room.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {isEditing ? (
                            <button
                                onClick={handleSaveEdit}
                                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
                            >
                                <CheckCircle2 size={16} /> Lưu thay đổi
                            </button>
                        ) : (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-6 py-2.5 bg-white text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-50 transition-all border border-indigo-100 shadow-sm active:scale-95"
                            >
                                <FileText size={16} /> Chỉnh sửa
                            </button>
                        )}
                        {room.status !== 'occupied' && !isEditing && (
                            <button
                                onClick={handleDeleteRoom}
                                className="flex items-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-100 transition-all border border-red-100 shadow-sm active:scale-95"
                            >
                                <Trash2 size={16} /> Xóa phòng
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="p-3 bg-white border border-gray-100 rounded-2xl text-gray-400 hover:text-gray-900 hover:border-gray-300 shadow-sm transition-all active:scale-95"
                        >
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b bg-white px-6">
                    <button onClick={() => setActiveTab('overview')} className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'overview' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Tổng quan</button>
                    {room.status === 'available' && (
                        <button onClick={() => setActiveTab('listing')} className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'listing' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Tin đăng</button>
                    )}
                    {room.status === 'occupied' && (
                        <button onClick={() => setActiveTab('tenant')} className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'tenant' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Người thuê & HĐ</button>
                    )}
                    {room.status === 'occupied' && (
                        <button onClick={() => setActiveTab('utilities')} className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'utilities' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Điện nước & Tiện ích</button>
                    )}
                    <button onClick={() => setActiveTab('images')} className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${activeTab === 'images' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>Hình ảnh ({images.length})</button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">

                    {activeTab === 'overview' && (
                        <div className="flex flex-col gap-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-white p-6 rounded-xl border shadow-sm">
                                    <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Building2 size={18} className="mr-2 text-indigo-600" /> Thông tin phòng</h3>
                                    <div className="space-y-3 text-sm">
                                        <div className="flex justify-between py-2 border-b border-gray-100">
                                            <span className="text-gray-500">Giá thuê niêm yết</span>
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        className="w-32 text-right font-bold text-indigo-600 border border-indigo-200 rounded px-2 py-1 outline-none"
                                                        value={editForm.basePrice}
                                                        onChange={(e) => setEditForm({ ...editForm, basePrice: parseFloat(e.target.value) || 0 })}
                                                    />
                                                    <span className="text-gray-400">đ</span>
                                                </div>
                                            ) : (
                                                <span className="font-bold text-indigo-600 text-lg">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(room.base_price)}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-500">Diện tích</span>
                                            {isEditing ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        className="w-20 text-right font-medium border border-indigo-200 rounded px-2 py-1 outline-none"
                                                        value={editForm.area}
                                                        onChange={(e) => setEditForm({ ...editForm, area: parseFloat(e.target.value) || 0 })}
                                                    />
                                                    <span className="text-gray-400">m²</span>
                                                </div>
                                            ) : (
                                                <span className="font-medium">{room.area} m²</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-500">Tầng</span>
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    className="w-16 text-right font-medium border border-indigo-200 rounded px-2 py-1 outline-none"
                                                    value={editForm.floor}
                                                    onChange={(e) => setEditForm({ ...editForm, floor: parseInt(e.target.value) || 0 })}
                                                />
                                            ) : (
                                                <span className="font-medium">{room.floor}</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-500 flex items-center gap-1"><Zap size={14} className="text-yellow-500" /> Giá điện</span>
                                            {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        className="w-24 text-right font-medium border border-indigo-200 rounded px-2 py-1 outline-none"
                                                        value={editForm.electricityPrice}
                                                        onChange={(e) => setEditForm({ ...editForm, electricityPrice: parseFloat(e.target.value) || 0 })}
                                                    />
                                                    <span className="text-[10px] text-gray-400">đ/kWh</span>
                                                </div>
                                            ) : (
                                                <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(room.electricity_price || 0)} đ/kWh</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-500 flex items-center gap-1"><Droplets size={14} className="text-blue-500" /> Giá nước</span>
                                            {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        className="w-24 text-right font-medium border border-indigo-200 rounded px-2 py-1 outline-none"
                                                        value={editForm.waterPrice}
                                                        onChange={(e) => setEditForm({ ...editForm, waterPrice: parseFloat(e.target.value) || 0 })}
                                                    />
                                                    <span className="text-[10px] text-gray-400">đ/m³</span>
                                                </div>
                                            ) : (
                                                <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(room.water_price || 0)} đ/m³</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                            <span className="text-gray-500 flex items-center gap-1"><CircleDollarSign size={14} className="text-green-500" /> Dịch vụ</span>
                                            {isEditing ? (
                                                <div className="flex items-center gap-1">
                                                    <input
                                                        type="number"
                                                        className="w-24 text-right font-medium border border-indigo-200 rounded px-2 py-1 outline-none"
                                                        value={editForm.servicePrice}
                                                        onChange={(e) => setEditForm({ ...editForm, servicePrice: parseFloat(e.target.value) || 0 })}
                                                    />
                                                    <span className="text-[10px] text-gray-400">đ/tháng</span>
                                                </div>
                                            ) : (
                                                <span className="font-medium">{new Intl.NumberFormat('vi-VN').format(room.service_price || 0)} đ/tháng</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="font-bold text-gray-800">Mô tả</h3>
                                            {isEditing && (
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const amenitiesList = AMENITIES_LIST.filter(a => editForm.amenities[a.id]).map(a => a.name);
                                                        try {
                                                            const res = await aiService.generateDescription({
                                                                title: `Phòng ${editForm.roomNumber}`,
                                                                price: editForm.basePrice,
                                                                area: editForm.area,
                                                                location: room.building_name || 'Tòa nhà',
                                                                amenities: amenitiesList
                                                            });
                                                            if (res.description) {
                                                                setEditForm(prev => ({ ...prev, description: res.description }));
                                                            }
                                                        } catch (e) {
                                                            alert("Lỗi AI: " + e.message);
                                                        }
                                                    }}
                                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                                                >
                                                    <Sparkles size={12} /> AI Gợi ý
                                                </button>
                                            )}
                                        </div>
                                        {isEditing ? (
                                            <textarea
                                                className="w-full h-32 text-sm text-gray-600 leading-relaxed border border-indigo-200 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500"
                                                value={editForm.description}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                            />
                                        ) : (
                                            <p className="text-sm text-gray-600 leading-relaxed">{room.description || "Chưa có mô tả chi tiết."}</p>
                                        )}
                                    </div>
                                    {room.virtual_tour_url && !isEditing && (
                                        <a href={room.virtual_tour_url} target="_blank" rel="noreferrer" className="mt-4 flex items-center justify-center gap-2 p-3 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-100 transition-colors">
                                            <Video size={18} /> Xem AI Virtual Tour <ExternalLink size={14} />
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border shadow-sm">
                                <h3 className="font-bold text-gray-800 mb-6 flex items-center gap-2">
                                    <Plus size={18} className="text-indigo-600" /> Tiện ích & Xác thực AI
                                </h3>

                                {isEditing ? (
                                    <div className="space-y-6">
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            {AMENITIES_LIST.map(amenity => {
                                                const isSelected = !!editForm.amenities[amenity.id];
                                                return (
                                                    <button
                                                        key={amenity.id}
                                                        onClick={() => {
                                                            const newAmenities = { ...editForm.amenities };
                                                            if (isSelected) {
                                                                delete newAmenities[amenity.id];
                                                            } else {
                                                                newAmenities[amenity.id] = { verified: false };
                                                            }
                                                            setEditForm({ ...editForm, amenities: newAmenities });
                                                        }}
                                                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border-2 transition-all ${isSelected
                                                            ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg'
                                                            : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200'
                                                            }`}
                                                    >
                                                        <amenity.icon size={14} />
                                                        <span className="text-[11px] font-black uppercase tracking-widest">{amenity.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 pt-6 border-t">
                                            {AMENITIES_LIST.filter(a => !!editForm.amenities[a.id]).map(amenity => (
                                                <div key={amenity.id} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                                                <amenity.icon size={16} />
                                                            </div>
                                                            <span className="font-bold text-gray-700 text-sm">{amenity.name}</span>
                                                        </div>
                                                        {editForm.amenities[amenity.id].verified && (
                                                            <span className="bg-green-100 text-green-700 text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-full flex items-center gap-1">
                                                                <CheckCircle2 size={10} /> Đã xác thực
                                                            </span>
                                                        )}
                                                    </div>

                                                    <AIAmenityVerifier
                                                        amenityId={amenity.id}
                                                        onVerified={(imageUrl) => {
                                                            setEditForm(prev => ({
                                                                ...prev,
                                                                amenities: {
                                                                    ...prev.amenities,
                                                                    [amenity.id]: { verified: true, image_url: imageUrl }
                                                                }
                                                            }));
                                                        }}
                                                    />

                                                    {editForm.amenities[amenity.id].image_url && (
                                                        <div className="mt-3 relative aspect-video rounded-xl overflow-hidden shadow-sm border border-gray-200">
                                                            <img src={editForm.amenities[amenity.id].image_url} alt={amenity.name} className="w-full h-full object-cover" />
                                                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/50 backdrop-blur-sm text-white text-[8px] font-black uppercase tracking-widest rounded-lg">
                                                                Ảnh xác thực
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                                        {(() => {
                                            try {
                                                const roomAmenities = typeof room.amenities === 'string' ? JSON.parse(room.amenities) : (room.amenities || {});
                                                return AMENITIES_LIST.filter(a => roomAmenities[a.id]).map(amenity => {
                                                    const verifyData = roomAmenities[amenity.id];
                                                    return (
                                                        <div key={amenity.id} className="group relative flex flex-col gap-3 p-4 rounded-2xl bg-gray-50 border border-gray-100 hover:border-indigo-200 hover:bg-white transition-all duration-300 shadow-sm hover:shadow-md">
                                                            <div className="flex justify-between items-center">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
                                                                        <amenity.icon size={20} />
                                                                    </div>
                                                                    <span className="font-bold text-gray-700">{amenity.name}</span>
                                                                </div>
                                                                {verifyData.verified && (
                                                                    <div className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-widest rounded-full flex items-center gap-1">
                                                                        <CheckCircle2 size={10} /> AI Verified
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {verifyData.image_url && (
                                                                <div className="relative aspect-square rounded-xl overflow-hidden shadow-inner border border-gray-200">
                                                                    <img src={verifyData.image_url} alt={amenity.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                });
                                            } catch (e) {
                                                console.error("Error parsing amenities:", e);
                                                return <p className="text-gray-400 italic text-sm">Không thể nạp dữ liệu tiện ích</p>;
                                            }
                                        })()}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'listing' && (
                        <RoomListingTab room={room} />
                    )}

                    {activeTab === 'tenant' && details.contract && (
                        <div className="space-y-6">
                            {/* Tenant Info Card */}
                            <div className="bg-white p-6 rounded-2xl border shadow-md relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-16 -mt-16 transition-all group-hover:bg-indigo-100"></div>

                                <div className="flex items-start gap-6 relative z-10">
                                    <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-4 border-white shadow-lg">
                                        {details.contract.tenant_avatar ?
                                            <img src={details.contract.tenant_avatar} alt="Tenant" className="w-full h-full object-cover" /> :
                                            <div className="w-full h-full bg-indigo-600 flex items-center justify-center text-white font-black text-2xl uppercase">
                                                {details.contract.tenant_name?.charAt(0)}
                                            </div>
                                        }
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="font-black text-xl text-gray-900 tracking-tight">{details.contract.tenant_name}</h3>
                                                <div className="mt-1 flex items-center gap-4 text-sm text-gray-500 font-medium">
                                                    <span className="flex items-center gap-1"><span className="text-indigo-500">📞</span> {details.contract.tenant_phone}</span>
                                                    <span className="flex items-center gap-1"><span className="text-indigo-500">✉️</span> {details.contract.tenant_email}</span>
                                                </div>
                                            </div>
                                            <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-green-200">
                                                Hợp đồng hiệu lực
                                            </span>
                                        </div>

                                        <div className="mt-4 flex gap-2">
                                            <button className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors">Gửi thông báo</button>
                                            <button className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-bold hover:bg-gray-50 transition-colors">Xem lịch sử thanh toán</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contract Timeline & Details */}
                            <div className="grid md:grid-cols-3 gap-6">
                                <div className="md:col-span-2 bg-white p-6 rounded-2xl border shadow-sm flex flex-col justify-between">
                                    <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2">
                                        <FileText size={20} className="text-indigo-600" /> THỜI HẠN & CHI PHÍ
                                    </h3>

                                    <div className="relative pt-4 pb-8 px-2">
                                        {/* Timeline Bar */}
                                        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gray-100 rounded-full -translate-y-1/2"></div>
                                        <div className="absolute top-1/2 left-0 h-1.5 bg-indigo-600 rounded-full -translate-y-1/2" style={{ width: '60%' }}></div>

                                        <div className="flex justify-between relative px-2">
                                            <div className="text-center">
                                                <div className="w-4 h-4 rounded-full bg-indigo-600 border-4 border-white shadow-sm mx-auto mb-2"></div>
                                                <p className="text-[10px] font-black text-gray-400">BẮT ĐẦU</p>
                                                <p className="text-sm font-bold text-gray-800">{new Date(details.contract.start_date).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                            <div className="text-center">
                                                <div className="w-4 h-4 rounded-full bg-white border-4 border-gray-200 shadow-sm mx-auto mb-2"></div>
                                                <p className="text-[10px] font-black text-gray-400">KẾT THÚC</p>
                                                <p className="text-sm font-bold text-gray-800">{new Date(details.contract.end_date).toLocaleDateString('vi-VN')}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mt-4">
                                        <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Tiền thuê / tháng</p>
                                            <p className="text-xl font-black text-indigo-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(details.contract.monthly_price)}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tiền cọc giữ chỗ</p>
                                            <p className="text-xl font-black text-gray-700">{new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(details.contract.deposit_amount)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white p-6 rounded-2xl border shadow-sm">
                                    <h3 className="font-black text-gray-800 mb-6">TÀI LIỆU</h3>
                                    <div className="space-y-4">
                                        <div className="p-4 rounded-2xl bg-gray-50 border border-dashed border-gray-300 flex flex-col items-center justify-center text-center">
                                            <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 mb-3">
                                                <FileText size={24} />
                                            </div>
                                            <p className="text-sm font-bold text-gray-800">Hợp đồng điện tử</p>
                                            <p className="text-[10px] text-gray-500 mt-1 uppercase">PDF Document</p>
                                            <a
                                                href={details.contract.contract_url || "#"}
                                                target="_blank"
                                                rel="noreferrer"
                                                className={`mt-4 w-full py-2 rounded-xl font-bold text-xs transition-colors ${details.contract.contract_url ? 'bg-orange-600 text-white hover:bg-orange-700' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
                                            >
                                                {details.contract.contract_url ? 'Xem chi tiết' : 'Chưa cập nhật'}
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'utilities' && (
                        <div className="space-y-6">
                            <div className="grid md:grid-cols-3 gap-6">
                                {/* Left Column: Electricity & Water */}
                                <div className="md:col-span-2 space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        {/* Electricity Card */}
                                        <div className="bg-white p-6 rounded-2xl border shadow-sm relative overflow-hidden">
                                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-50 rounded-full blur-2xl"></div>
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-center mb-6">
                                                    <div className="w-10 h-10 rounded-xl bg-yellow-100 text-yellow-600 flex items-center justify-center font-bold">⚡</div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">ĐIỆN</span>
                                                </div>
                                                {details.latest_electricity ? (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-3xl font-black text-gray-800">{details.latest_electricity.new_index}<span className="text-sm font-bold text-gray-400 ml-1">kWh</span></p>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Chỉ số cuối cùng</p>
                                                        </div>
                                                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                                            <span className="text-[10px] font-bold text-gray-400 mb-1">NGÀY CHỐT</span>
                                                            <span className="text-xs font-black text-gray-700">{new Intl.DateTimeFormat('vi-VN').format(new Date(details.latest_electricity.record_date))}</span>
                                                        </div>
                                                    </div>
                                                ) : <p className="text-sm text-gray-400 italic py-8 text-center">Chưa có dữ liệu</p>}
                                            </div>
                                        </div>

                                        {/* Water Card */}
                                        <div className="bg-white p-6 rounded-2xl border shadow-sm relative overflow-hidden">
                                            <div className="absolute -top-4 -right-4 w-20 h-20 bg-blue-50 rounded-full blur-2xl"></div>
                                            <div className="relative z-10">
                                                <div className="flex justify-between items-center mb-6">
                                                    <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">💧</div>
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">NƯỚC</span>
                                                </div>
                                                {details.latest_water ? (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <p className="text-3xl font-black text-gray-800">{details.latest_water.new_index}<span className="text-sm font-bold text-gray-400 ml-1">m³</span></p>
                                                            <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Chỉ số cuối cùng</p>
                                                        </div>
                                                        <div className="pt-4 border-t border-gray-100 flex justify-between items-center">
                                                            <span className="text-[10px] font-bold text-gray-400 mb-1">NGÀY CHỐT</span>
                                                            <span className="text-xs font-black text-gray-700">{new Intl.DateTimeFormat('vi-VN').format(new Date(details.latest_water.record_date))}</span>
                                                        </div>
                                                    </div>
                                                ) : <p className="text-sm text-gray-400 italic py-8 text-center">Chưa có dữ liệu</p>}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Assets & Maintenance Reminders */}
                                    <div className="bg-white p-6 rounded-2xl border shadow-sm">
                                        <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2">
                                            <Wrench size={18} className="text-orange-500" /> TÀI SẢN & BẢO TRÌ ĐỊNH KỲ
                                        </h3>
                                        {details.assets && details.assets.length > 0 ? (
                                            <div className="grid grid-cols-2 gap-4">
                                                {details.assets.map(asset => {
                                                    const lastCheck = asset.last_check_date ? new Date(asset.last_check_date) : null;
                                                    const sixMonthsAgo = new Date();
                                                    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
                                                    const needsRemind = lastCheck && lastCheck < sixMonthsAgo;

                                                    return (
                                                        <div key={asset.asset_id} className={`p-4 rounded-2xl border transition-all ${needsRemind ? 'border-orange-200 bg-orange-50/30' : 'border-gray-100 bg-gray-50/50'}`}>
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="font-black text-sm text-gray-800 uppercase tracking-tight">{asset.item_name}</span>
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${asset.condition_status === 'good' ? 'bg-green-100 text-green-700' :
                                                                    asset.condition_status === 'new' ? 'bg-indigo-100 text-indigo-700' : 'bg-red-100 text-red-700'
                                                                    }`}>
                                                                    {asset.condition_status}
                                                                </span>
                                                            </div>
                                                            <div className="flex justify-between items-center mt-3">
                                                                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Lần cuối: {lastCheck ? lastCheck.toLocaleDateString('vi-VN') : '---'}</p>
                                                                {needsRemind && (
                                                                    <div className="flex items-center gap-1 text-[9px] font-black text-orange-600 bg-white px-2 py-1 rounded-full shadow-sm animate-pulse border border-orange-100">
                                                                        ⚠️ NHẮC BẢO TRÌ
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-400 italic text-center py-6">Chưa cập nhật danh sách tài sản</p>
                                        )}
                                    </div>
                                </div>

                                {/* Right Column: Service Prices & Recent Requests */}
                                <div className="space-y-6">
                                    <div className="bg-indigo-600 p-6 rounded-2xl shadow-xl text-white relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                                        <h3 className="font-black text-white mb-6 uppercase tracking-widest text-xs relative z-10">Bảng giá dịch vụ</h3>
                                        <div className="space-y-4 relative z-10">
                                            {details.utility_configs?.map(cfg => (
                                                <div key={cfg.config_id} className="flex justify-between items-center border-b border-indigo-500/50 pb-2 last:border-0">
                                                    <span className="text-xs font-bold text-indigo-100 capitalize">{cfg.name}</span>
                                                    <span className="text-sm font-black">{new Intl.NumberFormat('vi-VN').format(cfg.price)} <span className="text-[10px] text-indigo-200">/ {cfg.type === 'electricity' ? 'kWh' : 'm³'}</span></span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Maintenance History Fragment */}
                                    {details.maintenance_requests && details.maintenance_requests.length > 0 && (
                                        <div className="bg-white p-6 rounded-2xl border shadow-sm">
                                            <h3 className="font-black text-gray-800 mb-4 text-xs uppercase tracking-widest">Sửa chữa gần đây</h3>
                                            <div className="space-y-3">
                                                {details.maintenance_requests.map(req => (
                                                    <div key={req.request_id} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                                        <div className="flex justify-between mb-1">
                                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${req.status === 'open' ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                                {req.status}
                                                            </span>
                                                            <span className="text-[9px] text-gray-400 font-bold">{new Date().toLocaleDateString('vi-VN')}</span>
                                                        </div>
                                                        <p className="text-xs font-bold text-gray-700 line-clamp-2">{req.issue_description}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'images' && (
                        <div className="">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-800 flex items-center"><ImageIcon size={20} className="mr-2" /> Thư viện ảnh</h3>
                                <button
                                    onClick={() => setShowUrlInput(!showUrlInput)}
                                    className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition font-medium text-gray-700"
                                >
                                    + Thêm ảnh
                                </button>
                            </div>

                            {showUrlInput && (
                                <div className="mb-4 bg-gray-50 p-3 rounded-xl border flex flex-col gap-2">
                                    <div className="flex gap-2 items-center">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                                            onChange={handleFileChange}
                                        />
                                        {isUploading && <div className="text-sm text-indigo-600 font-medium animate-pulse">Đang tải lên...</div>}
                                    </div>
                                    <div className="text-xs text-gray-500 text-center">HOẶC</div>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="Dán đường dẫn ảnh (URL) trực tiếp..."
                                            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={newImageUrl}
                                            onChange={(e) => setNewImageUrl(e.target.value)}
                                        />
                                        <button onClick={handleAddImage} disabled={isUploading} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50">Lưu</button>
                                    </div>
                                </div>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {(isEditing ? editForm.images : images).map((img, idx) => (
                                    <div key={idx} className="group relative aspect-video bg-gray-100 rounded-xl overflow-hidden shadow-sm border">
                                        <img src={img} alt={`Room ${idx}`} className="w-full h-full object-cover" />
                                        {(isEditing || activeTab === 'images') && (
                                            <button
                                                onClick={() => handleDeleteImage(img)}
                                                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-all shadow-lg hover:bg-red-600 active:scale-95"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                {(isEditing ? editForm.images : images).length === 0 && (
                                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                        <ImageIcon size={48} className="mb-2 opacity-20" />
                                        <p>Chưa có hình ảnh nào</p>
                                        <p className="text-xs">Thêm ảnh để kích hoạt tính năng Virtual Tour sau này</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const BuildingDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { currentBuilding, rooms } = useSelector((state) => state.properties);

    const [showAddRoom, setShowAddRoom] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null); // For Modal

    // Room Form State
    const [newRoom, setNewRoom] = useState({
        roomNumber: '',
        floor: 1,
        area: 20,
        basePrice: 3000000,
        electricityPrice: 3500, // Mặc định 3.5k
        waterPrice: 15000,     // Mặc định 15k
        servicePrice: 100000,   // Mặc định 100k
        description: '',
        selectedAmenities: [], // IDs of selected amenities
        amenities: {}, // Structured details
        images: []
    });

    const toggleAmenitySelection = (id) => {
        setNewRoom(prev => {
            const isSelected = prev.selectedAmenities.includes(id);
            if (isSelected) {
                // Remove from selection and clear its verification data
                const newAmenities = { ...prev.amenities };
                delete newAmenities[id];
                return {
                    ...prev,
                    selectedAmenities: prev.selectedAmenities.filter(aid => aid !== id),
                    amenities: newAmenities
                };
            } else {
                return {
                    ...prev,
                    selectedAmenities: [...prev.selectedAmenities, id]
                };
            }
        });
    };

    const [isCreating, setIsCreating] = useState(false);

    const handleAmenityVerified = (id, imageUrl) => {
        setNewRoom(prev => ({
            ...prev,
            amenities: {
                ...prev.amenities,
                [id]: { verified: true, image_url: imageUrl }
            }
        }));
    };

    const handleRoomImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const res = await propertyService.uploadImage(file);
            setNewRoom(prev => ({
                ...prev,
                images: [...prev.images, res.url]
            }));
        } catch (err) {
            alert('Upload ảnh thất bại');
        }
    };

    const removeRoomImage = (url) => {
        setNewRoom(prev => ({
            ...prev,
            images: prev.images.filter(img => img !== url)
        }));
    };

    useEffect(() => {
        dispatch(getBuilding(id));
        dispatch(getRooms(id));
    }, [dispatch, id]);

    const handleCreateRoom = async (e) => {
        e.preventDefault();

        // Validation
        if (newRoom.images.length < 3) {
            alert('Yêu cầu chụp ít nhất 3 ảnh phòng!');
            return;
        }

        if (newRoom.selectedAmenities.length === 0) {
            alert('Vui lòng chọn ít nhất 1 tiện ích!');
            return;
        }

        // Check if all selected amenities are verified
        const allVerified = newRoom.selectedAmenities.every(id => newRoom.amenities[id]?.verified);
        if (!allVerified) {
            alert('Vui lòng chụp ảnh xác thực cho TẤT CẢ các tiện ích đã chọn!');
            return;
        }

        setIsCreating(true);
        try {
            await dispatch(createRoom({ ...newRoom, buildingId: id }));
            dispatch(getRooms(id));
            setShowAddRoom(false);
            setNewRoom({ roomNumber: '', floor: 1, area: 20, basePrice: 3000000, electricityPrice: 3500, waterPrice: 15000, servicePrice: 100000, description: '', selectedAmenities: [], amenities: {}, images: [] });
        } catch (err) {
            alert('Lỗi tạo phòng');
        } finally {
            setIsCreating(false);
        }
    };

    const handleUpdateRoom = async (roomId, data) => {
        await dispatch(updateRoom({ roomId, roomData: data }));
        dispatch(getRooms(id)); // Refresh list
    };

    if (!currentBuilding) return <div className="p-10 text-center">Đang tải...</div>;

    return (
        <div>
            {/* Header */}
            <button onClick={() => navigate('/landlord/properties')} className="flex items-center text-gray-500 hover:text-indigo-600 mb-4 transition-colors">
                <ArrowLeft size={18} className="mr-1" /> Quay lại danh sách
            </button>

            <div className="glass p-6 rounded-2xl mb-8 flex flex-col md:flex-row justify-between items-start md:items-center">
                <div className="flex items-center mb-4 md:mb-0">
                    <div className="p-4 bg-indigo-100 rounded-2xl text-indigo-600 mr-4">
                        <Building2 size={32} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{currentBuilding.name}</h1>
                        <p className="text-gray-500 flex items-center mt-1">
                            <MapPin size={16} className="mr-1" /> {currentBuilding.address}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <div className="text-center px-4 py-2 bg-white/50 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase">Số phòng</p>
                        <p className="font-bold text-xl">{rooms.length}</p>
                    </div>
                    <div className="text-center px-4 py-2 bg-white/50 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase">Trống</p>
                        <p className="font-bold text-xl text-green-600">
                            {rooms.filter(r => r.status === 'available').length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Map View Section */}
            {currentBuilding.coordinates && (
                <div className="glass p-6 rounded-2xl mb-8">
                    <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center"><Globe size={20} className="mr-2 text-indigo-600" /> Vị trí trên bản đồ</h3>
                    <LocationPicker
                        position={typeof currentBuilding.coordinates === 'string' ? JSON.parse(currentBuilding.coordinates) : currentBuilding.coordinates}
                        readOnly={true}
                        height="300px"
                    />
                </div>
            )}

            {/* Room List Header */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800">Danh sách phòng</h2>
                <button
                    onClick={() => setShowAddRoom(true)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition flex items-center"
                >
                    <Plus size={18} className="mr-2" /> Thêm Phòng
                </button>
            </div>

            {/* Room Grid */}
            {rooms.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {rooms.map(room => (
                        <RoomCard key={room.room_id} room={room} onClick={() => setSelectedRoom(room)} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-10 border-2 border-dashed border-gray-300 rounded-xl text-gray-400">
                    Chưa có phòng nào. Hãy thêm phòng mới!
                </div>
            )}

            {/* Modal: Room Detail & Gallery */}
            {selectedRoom && (
                <RoomDetailModal
                    room={selectedRoom}
                    onClose={() => setSelectedRoom(null)}
                    onUpdate={handleUpdateRoom}
                />
            )}

            {/* Modal: Add Room */}
            {showAddRoom && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-200 no-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Thêm Phòng Mới</h3>
                            <button onClick={() => setShowAddRoom(false)} className="p-2 hover:bg-gray-100 rounded-full transition"><X size={24} /></button>
                        </div>

                        <form onSubmit={handleCreateRoom} className="space-y-8">
                            {/* Basic Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Số phòng</label>
                                    <input
                                        type="text" required placeholder="P.101"
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition"
                                        value={newRoom.roomNumber}
                                        onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Tầng</label>
                                        <input
                                            type="number" required
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={newRoom.floor || ''}
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? '' : parseInt(e.target.value);
                                                setNewRoom({ ...newRoom, floor: val });
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Diện tích</label>
                                        <input
                                            type="number" required
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                            value={newRoom.area || ''}
                                            onChange={(e) => {
                                                const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                                setNewRoom({ ...newRoom, area: val });
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 text-indigo-600">Giá thuê VNĐ / Tháng</label>
                                <input
                                    type="number" required
                                    className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl px-4 py-4 text-xl font-black text-indigo-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                    value={newRoom.basePrice || ''}
                                    onChange={(e) => {
                                        const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                                        setNewRoom({ ...newRoom, basePrice: val });
                                    }}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Zap size={12} className="text-yellow-500" /> Điện (đ/kWh)</label>
                                    <input
                                        type="number" required
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newRoom.electricityPrice || ''}
                                        onChange={(e) => setNewRoom({ ...newRoom, electricityPrice: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Droplets size={12} className="text-blue-500" /> Nước (đ/m³)</label>
                                    <input
                                        type="number" required
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newRoom.waterPrice || ''}
                                        onChange={(e) => setNewRoom({ ...newRoom, waterPrice: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><CircleDollarSign size={12} className="text-green-500" /> Dịch vụ</label>
                                    <input
                                        type="number" required
                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                        value={newRoom.servicePrice || ''}
                                        onChange={(e) => setNewRoom({ ...newRoom, servicePrice: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            {/* Image Section */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">Ảnh thực tế phòng (Tối thiểu 3 ảnh)</label>
                                    <span className={`text-[10px] font-bold ${newRoom.images.length >= 3 ? 'text-green-600' : 'text-orange-500'}`}>
                                        {newRoom.images.length}/3 ảnh
                                    </span>
                                </div>
                                <div className="grid grid-cols-4 gap-4">
                                    {newRoom.images.map((img, idx) => (
                                        <div key={idx} className="relative aspect-square group">
                                            <img src={img} className="w-full h-full object-cover rounded-2xl border shadow-sm" alt="room" />
                                            <button
                                                type="button"
                                                onClick={() => removeRoomImage(img)}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition"
                                            >
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                    <label className="aspect-square border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition text-gray-400 group">
                                        <Plus size={24} className="group-hover:scale-110 transition" />
                                        <span className="text-[10px] font-bold mt-1">Thêm ảnh</span>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleRoomImageUpload} />
                                    </label>
                                </div>
                            </div>

                            {/* Amenity Section */}
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Tiện ích sẵn có (Chọn & Xác thực AI)</label>

                                {/* Selection badges */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {AMENITIES_LIST.map(amenity => {
                                        const isSelected = newRoom.selectedAmenities.includes(amenity.id);
                                        const isVerified = newRoom.amenities[amenity.id]?.verified;
                                        return (
                                            <button
                                                key={amenity.id}
                                                type="button"
                                                onClick={() => toggleAmenitySelection(amenity.id)}
                                                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${isSelected
                                                    ? (isVerified ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-100' : 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100')
                                                    : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300'
                                                    }`}
                                            >
                                                <amenity.icon size={14} />
                                                {amenity.name}
                                                {isVerified && <CheckCircle2 size={12} />}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Verification Items */}
                                <div className="grid grid-cols-2 gap-4">
                                    {AMENITIES_LIST.filter(a => newRoom.selectedAmenities.includes(a.id)).map(amenity => (
                                        <AmenityVerifyItem
                                            key={amenity.id}
                                            amenity={amenity}
                                            isVerified={newRoom.amenities[amenity.id]?.verified}
                                            currentImageUrl={newRoom.amenities[amenity.id]?.image_url}
                                            onVerified={handleAmenityVerified}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="pt-6 border-t flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddRoom(false)}
                                    className="px-6 py-3 text-gray-500 font-bold text-sm hover:bg-gray-50 rounded-2xl transition"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCreating || newRoom.images.length < 3 || Object.keys(newRoom.amenities).length === 0}
                                    className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black text-sm shadow-xl shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all flex items-center gap-2"
                                >
                                    {isCreating ? <Loader2 size={18} className="animate-spin" /> : 'Lưu & Khởi tạo phòng'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BuildingDetail;
