import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import listingService from '../../services/listingService';
import propertyService from '../../services/propertyService';
import monetizationService from '../../services/monetizationService';
import { useSelector } from 'react-redux';
import {
    Globe,
    Plus,
    Search,
    Filter,
    Eye,
    PauseCircle,
    PlayCircle,
    ArrowRight,
    Building2,
    Home,
    X,
    Check,
    ChevronRight,
    Image as ImageIcon,
    Wind,
    Refrigerator,
    Loader2,
    Tv,
    Bed as BedIcon,
    FileText,
    Table as TableIcon,
    CheckCircle2,
    Zap,
    Droplets,
    CircleDollarSign,
    Clock,
    Star,
    AlertTriangle
} from 'lucide-react';
import { Sparkles } from 'lucide-react';
import aiService from '../../services/aiService';

const AMENITIES_LIST = [
    { id: 'fridge', name: 'Tủ lạnh', icon: Refrigerator },
    { id: 'air_conditioner', name: 'Điều hòa', icon: Wind },
    { id: 'washing_machine', name: 'Máy giặt', icon: Loader2 },
    { id: 'television', name: 'Tivi', icon: Tv },
    { id: 'bed', name: 'Giường', icon: BedIcon },
    { id: 'wardrobe', name: 'Tủ quần áo', icon: FileText },
    { id: 'table', name: 'Bàn', icon: TableIcon },
];

const SelectRoomModal = ({ isOpen, onClose, onSelect }) => {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const fetchAvailable = async () => {
                setLoading(true);
                try {
                    const data = await propertyService.getAvailableRoomsAll();
                    setRooms(data);
                } catch (err) {
                    console.error(err);
                } finally {
                    setLoading(false);
                }
            };
            fetchAvailable();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Chọn phòng để đăng tin</h2>
                        <p className="text-sm text-gray-500 font-medium">Chọn một phòng trống để tự động điền thông tin</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loading ? (
                        <div className="text-center py-20 font-bold text-gray-400">Đang tải danh sách phòng...</div>
                    ) : rooms.length === 0 ? (
                        <div className="text-center py-20 font-bold text-gray-400 italic">Hiện không có phòng nào trống để đăng tin.</div>
                    ) : (
                        rooms.map(room => (
                            <div
                                key={room.room_id}
                                onClick={() => onSelect(room)}
                                className="group p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer flex items-center gap-4"
                            >
                                <div className="h-16 w-16 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 border border-gray-50">
                                    {(room.images && typeof room.images === 'string' && JSON.parse(room.images)[0]) ? (
                                        <img src={JSON.parse(room.images)[0]} className="w-full h-full object-cover" alt="" />
                                    ) : (room.images && Array.isArray(room.images) && room.images[0]) ? (
                                        <img src={room.images[0]} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50"><ImageIcon size={24} /></div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-black text-gray-900">Phòng {room.room_number}</h3>
                                        <span className="text-indigo-600 font-black text-sm">{new Intl.NumberFormat('vi-VN').format(room.base_price)}đ</span>
                                    </div>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-tight flex items-center gap-1 mt-1">
                                        <Building2 size={10} /> {room.building_name} • {room.area}m²
                                    </p>
                                </div>
                                <ChevronRight size={18} className="text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

const CreateListingModal = ({ isOpen, onClose, selectedRoom, listingToEdit, onSuccess }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        rent_price: 0,
        deposit_amount: 0,
        electricity_price: 0,
        water_price: 0,
        service_price: 0,
        max_occupants: 2,
        allow_pets: false,
        amenities: {}
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { token } = useSelector((state) => state.auth);
    const [step, setStep] = useState(1); // 1: Info, 2: Package & VIP
    const [packages, setPackages] = useState([]);
    const [services, setServices] = useState([]);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [selectedService, setSelectedService] = useState(null);
    const [loadingMonetization, setLoadingMonetization] = useState(false);

    const isEditMode = !!listingToEdit;
    const isPackageActive = isEditMode && listingToEdit?.expires_at && new Date(listingToEdit.expires_at) > new Date();

    useEffect(() => {
        if (isOpen && step === 2) {
            const fetchMonetization = async () => {
                setLoadingMonetization(true);
                try {
                    const [pkgs, svcs] = await Promise.all([
                        monetizationService.getPackages(token),
                        monetizationService.getPremiumServices(token)
                    ]);

                    const packagesArray = Array.isArray(pkgs) ? pkgs : [];
                    const servicesArray = Array.isArray(svcs) ? svcs : [];

                    setPackages(packagesArray);
                    setServices(servicesArray);

                    if (packagesArray.length > 0) setSelectedPackage(packagesArray[0]);
                } catch (err) {
                    console.error('Error fetching monetization data:', err);
                    setPackages([]);
                    setServices([]);
                } finally {
                    setLoadingMonetization(false);
                }
            };
            fetchMonetization();
        }
    }, [isOpen, step, token]);

    useEffect(() => {
        if (selectedRoom) {
            // Create Mode
            setFormData({
                title: `Phòng ${selectedRoom.room_number} tại ${selectedRoom.building_name}`,
                description: selectedRoom.description || '',
                rent_price: selectedRoom.base_price,
                deposit_amount: selectedRoom.base_price,
                electricity_price: selectedRoom.electricity_price || 0,
                water_price: selectedRoom.water_price || 0,
                service_price: selectedRoom.service_price || 0,
                max_occupants: 2,
                allow_pets: false,
                amenities: typeof selectedRoom.amenities === 'string' ? JSON.parse(selectedRoom.amenities) : (selectedRoom.amenities || {})
            });
            setStep(1);
            setSelectedPackage(null);
            setSelectedService(null);
        } else if (listingToEdit) {
            // Edit Mode
            setFormData({
                title: listingToEdit.title || '',
                description: listingToEdit.description || '',
                rent_price: listingToEdit.rent_price || 0,
                deposit_amount: listingToEdit.deposit_amount || 0,
                electricity_price: listingToEdit.electricity_price || 0,
                water_price: listingToEdit.water_price || 0,
                service_price: listingToEdit.service_price || 0,
                max_occupants: listingToEdit.max_occupants || 2,
                allow_pets: !!listingToEdit.allow_pets,
                amenities: typeof listingToEdit.amenities === 'string' ? JSON.parse(listingToEdit.amenities) : (listingToEdit.amenities || {})
            });
            setStep(1); // Always start at info step
            setSelectedPackage(null);
            setSelectedService(null);
        }
    }, [selectedRoom, listingToEdit]);

    const handleQuickSave = async () => {
        setIsSubmitting(true);
        try {
            await listingService.updateListing(listingToEdit.listing_id, {
                ...formData,
                status: listingToEdit.status
            });
            alert("Cập nhật thông tin thành công!");
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Cập nhật thất bại: ' + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (step === 1) {
            setStep(2);
            return;
        }

        setIsSubmitting(true);
        try {
            if (isEditMode) {
                // UPDATE logic with payment (Renew/Extend)
                await listingService.updateListing(listingToEdit.listing_id, {
                    ...formData,
                    status: listingToEdit.status
                });

                if (selectedPackage) {
                    await monetizationService.processPayment({
                        listingId: listingToEdit.listing_id,
                        paymentType: 'package',
                        amount: selectedPackage.price,
                        paymentMethod: 'wallet',
                        referenceId: selectedPackage.package_id
                    }, token);
                }
                if (selectedService) {
                    await monetizationService.processPayment({
                        listingId: listingToEdit.listing_id,
                        paymentType: 'premium_service',
                        amount: selectedService.price_per_day * 7,
                        paymentMethod: 'wallet',
                        referenceId: selectedService.service_id
                    }, token);
                }

                alert("Gia hạn và cập nhật thành công!");
            } else {
                // CREATE logic
                const res = await listingService.createListing({
                    ...formData,
                    room_id: selectedRoom.room_id,
                    package_id: selectedPackage?.package_id,
                    // expires_at will be calculated on backend by processPayment if package is applied
                });

                const listingId = res.listingId;

                if (selectedPackage) {
                    await monetizationService.processPayment({
                        listingId,
                        paymentType: 'package',
                        amount: selectedPackage.price,
                        paymentMethod: 'wallet',
                        referenceId: selectedPackage.package_id
                    }, token);
                }

                if (selectedService) {
                    await monetizationService.processPayment({
                        listingId,
                        paymentType: 'premium_service',
                        amount: selectedService.price_per_day * 7,
                        paymentMethod: 'wallet',
                        referenceId: selectedService.service_id
                    }, token);
                }
                alert("Đăng tin mới thành công!");
            }

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Thao tác thất bại! ' + (err.response?.data?.message || err.message));
        } finally {
            setIsSubmitting(false);
        }
    };

    const displayItem = selectedRoom || listingToEdit;

    if (!isOpen || !displayItem) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <form onSubmit={handleSubmit} className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-black text-gray-900">
                        {isEditMode ? 'Chỉnh sửa tin đăng' : 'Đăng tin mới'}
                    </h2>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {step === 1 ? (
                        <>
                            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 flex gap-4 items-center mb-4">
                                <div className="h-12 w-12 bg-white rounded-xl shadow-sm overflow-hidden flex-shrink-0">
                                    {(displayItem.images && typeof displayItem.images === 'string' && JSON.parse(displayItem.images)[0]) ? (
                                        <img src={JSON.parse(displayItem.images)[0]} className="w-full h-full object-cover" alt="" />
                                    ) : (displayItem.images && Array.isArray(displayItem.images) && displayItem.images[0]) ? (
                                        <img src={displayItem.images[0]} className="w-full h-full object-cover" alt="" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-indigo-200"><ImageIcon size={20} /></div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-indigo-900 font-black text-sm">Phòng {displayItem.room_number || '?'} • {displayItem.building_name}</p>
                                    <p className="text-indigo-600/70 text-xs font-bold uppercase">{displayItem.area}m² • {new Intl.NumberFormat('vi-VN').format(displayItem.rent_price || displayItem.base_price || 0)}đ</p>
                                </div>
                            </div>

                            {isPackageActive && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded-xl flex items-center gap-2 text-green-700 font-bold text-xs mb-4">
                                    <CheckCircle2 size={16} />
                                    Tin đang hiển thị. Hết hạn: {new Date(listingToEdit.expires_at).toLocaleDateString('vi-VN')}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tiêu đề quảng cáo</label>
                                <input
                                    type="text" required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Tiêu đề thu hút khách hàng..."
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Mô tả chi tiết</label>
                                    <button
                                        type="button"
                                        onClick={async () => {
                                            const amenitiesList = AMENITIES_LIST.filter(a => formData.amenities[a.id]).map(a => a.name);
                                            try {
                                                const res = await aiService.generateDescription({
                                                    title: formData.title,
                                                    price: formData.rent_price,
                                                    area: displayItem.area,
                                                    location: displayItem.building_name,
                                                    amenities: amenitiesList
                                                });
                                                if (res.description) {
                                                    setFormData(prev => ({ ...prev, description: res.description }));
                                                }
                                            } catch (e) {
                                                alert("Lỗi AI: " + e.message);
                                            }
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-colors"
                                    >
                                        <Sparkles size={12} /> AI Gợi ý
                                    </button>
                                </div>
                                <textarea
                                    rows="4" required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Mô tả về phòng, tiện ích, vị trí..."
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Giá thuê (VNĐ)</label>
                                    <input
                                        type="number" required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.rent_price}
                                        onChange={(e) => setFormData({ ...formData, rent_price: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Tiền cọc (VNĐ)</label>
                                    <input
                                        type="number" required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-black text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.deposit_amount}
                                        onChange={(e) => setFormData({ ...formData, deposit_amount: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Zap size={12} className="text-yellow-500" /> Điện</label>
                                    <input
                                        type="number" required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.electricity_price}
                                        onChange={(e) => setFormData({ ...formData, electricity_price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Droplets size={12} className="text-blue-500" /> Nước</label>
                                    <input
                                        type="number" required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.water_price}
                                        onChange={(e) => setFormData({ ...formData, water_price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1"><CircleDollarSign size={12} className="text-green-500" /> Dịch vụ</label>
                                    <input
                                        type="number" required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.service_price}
                                        onChange={(e) => setFormData({ ...formData, service_price: parseFloat(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Số người ở tối đa</label>
                                    <input
                                        type="number" min="1" max="20" required
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                                        value={formData.max_occupants}
                                        onChange={(e) => setFormData({ ...formData, max_occupants: parseInt(e.target.value) || 1 })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Thú cưng</label>
                                    <div
                                        onClick={() => setFormData({ ...formData, allow_pets: !formData.allow_pets })}
                                        className={`w-full px-4 py-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${formData.allow_pets ? 'bg-indigo-50 border-indigo-200' : 'bg-gray-50 border-gray-200'}`}
                                    >
                                        <span className={`text-sm font-bold ${formData.allow_pets ? 'text-indigo-700' : 'text-gray-500'}`}>
                                            {formData.allow_pets ? 'Cho phép nuôi' : 'Không cho phép'}
                                        </span>
                                        <div className={`w-10 h-6 rounded-full p-1 transition-colors ${formData.allow_pets ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${formData.allow_pets ? 'translate-x-4' : ''}`}></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Tiện ích đi kèm</label>
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
                                                        newAmenityState[amenity.id] = { verified: false };
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
                        </>
                    ) : (
                        <div className="space-y-6">
                            {/* Package Selection */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">1. Chọn gói thời gian hiển thị</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {loadingMonetization ? (
                                        <div className="text-center py-6 font-bold text-indigo-400 animate-pulse">Loading packages...</div>
                                    ) : packages.length === 0 ? (
                                        <div className="text-center py-6 text-gray-400 italic">Không có gói tin nào khả dụng. Vui lòng liên hệ quản trị viên.</div>
                                    ) : packages.map(pkg => (
                                        <div
                                            key={pkg.package_id}
                                            onClick={() => setSelectedPackage(pkg)}
                                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedPackage?.package_id === pkg.package_id
                                                ? 'bg-indigo-50 border-indigo-500 shadow-lg shadow-indigo-100'
                                                : 'bg-white border-gray-100 hover:border-indigo-200'
                                                }`}
                                        >
                                            <div>
                                                <p className="font-black text-gray-900">{pkg.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold">{pkg.duration_days} ngày • {pkg.description}</p>
                                            </div>
                                            <p className="text-lg font-black text-indigo-600">
                                                {new Intl.NumberFormat('vi-VN').format(pkg.price)}đ
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* VIP Service Selection */}
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">2. Nâng cấp VIP (Tùy chọn)</label>
                                <div className="space-y-3">
                                    {services.map(svc => (
                                        <div
                                            key={svc.service_id}
                                            onClick={() => setSelectedService(selectedService?.service_id === svc.service_id ? null : svc)}
                                            className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedService?.service_id === svc.service_id
                                                ? 'bg-yellow-50 border-yellow-500 shadow-lg shadow-yellow-100'
                                                : 'bg-white border-gray-100 hover:border-yellow-200'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${selectedService?.service_id === svc.service_id ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-600'}`}>
                                                    <Star size={16} fill="currentColor" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900">{svc.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-bold">{svc.description}</p>
                                                </div>
                                            </div>
                                            <p className="text-sm font-black text-yellow-700">
                                                +{new Intl.NumberFormat('vi-VN').format(svc.price_per_day * 7)}đ (7 ngày)
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Summary Box */}
                            <div className="p-4 bg-gray-900 rounded-2xl text-white">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-medium text-gray-400">Gói hiển thị</span>
                                    <span>{new Intl.NumberFormat('vi-VN').format(selectedPackage?.price || 0)}đ</span>
                                </div>
                                <div className="flex justify-between items-center mb-4">
                                    <span className="text-xs font-medium text-gray-400">Nâng cấp VIP</span>
                                    <span>{selectedService ? `+${new Intl.NumberFormat('vi-VN').format(selectedService.price_per_day * 7)}đ` : '0đ'}</span>
                                </div>
                                <div className="h-px bg-gray-800 mb-4"></div>
                                <div className="flex justify-between items-center">
                                    <span className="font-black uppercase text-[10px] tracking-widest">Tổng thanh toán</span>
                                    <span className="text-xl font-black text-indigo-400">
                                        {new Intl.NumberFormat('vi-VN').format((selectedPackage?.price || 0) + (selectedService ? selectedService.price_per_day * 7 : 0))}đ
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        Bước {step}/2
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={step === 1 ? onClose : () => setStep(1)}
                            className="px-6 py-2 text-gray-500 font-bold text-sm"
                        >
                            {step === 1 ? 'Hủy' : 'Quay lại'}
                        </button>

                        {/* Logic Button Render */}
                        {step === 1 ? (
                            isPackageActive ? (
                                <>
                                    <button
                                        type="button"
                                        onClick={handleQuickSave}
                                        disabled={isSubmitting}
                                        className="px-6 py-2 rounded-xl font-bold text-sm shadow-md bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all flex items-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : 'Lưu thay đổi'}
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-6 py-2 rounded-xl font-bold text-sm shadow-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2"
                                    >
                                        Gia hạn thêm <ArrowRight size={16} />
                                    </button>
                                </>
                            ) : (
                                <button
                                    type="submit"
                                    className="px-8 py-2 rounded-xl font-bold text-sm shadow-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2"
                                >
                                    Tiếp tục: Chọn gói <ArrowRight size={16} />
                                </button>
                            )
                        ) : (
                            <button
                                type="submit"
                                disabled={isSubmitting || !selectedPackage}
                                className="px-8 py-2 rounded-xl font-bold text-sm shadow-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-2"
                            >
                                {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : (isEditMode ? 'Gia hạn & Cập nhật' : 'Thanh toán & Đăng tin')}
                            </button>
                        )}
                    </div>
                </div>
            </form>
        </div>
    );
};
const RenewModal = ({ isOpen, onClose, listing, onSuccess }) => {
    const { token } = useSelector((state) => state.auth);
    const [packages, setPackages] = useState([]);
    const [selectedPackage, setSelectedPackage] = useState(null);
    const [loadingMonetization, setLoadingMonetization] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (isOpen) {
            const fetchMonetization = async () => {
                setLoadingMonetization(true);
                try {
                    const pkgs = await monetizationService.getPackages(token);
                    const packagesArray = Array.isArray(pkgs) ? pkgs : [];
                    setPackages(packagesArray);
                    if (packagesArray.length > 0) setSelectedPackage(packagesArray[0]);
                } catch (err) {
                    console.error('Error fetching monetization data:', err);
                    setPackages([]);
                } finally {
                    setLoadingMonetization(false);
                }
            };
            fetchMonetization();
        }
    }, [isOpen, token]);

    const handleRenew = async (e) => {
        e.preventDefault();
        if (!selectedPackage) return;

        setIsSubmitting(true);
        try {
            await monetizationService.processPayment({
                listingId: listing.listing_id,
                paymentType: 'package',
                amount: selectedPackage.price,
                paymentMethod: 'wallet',
                referenceId: selectedPackage.package_id
            }, token);

            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Gia hạn thất bại! Vui lòng kiểm tra số dư ví.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen || !listing) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-gray-900">Gia hạn tin đăng</h2>
                        <p className="text-sm text-gray-500 font-bold">{listing.title}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="p-6">
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Chọn gói gia hạn</label>
                    <div className="grid grid-cols-1 gap-3 max-h-[50vh] overflow-y-auto">
                        {loadingMonetization ? (
                            <div className="text-center py-6 font-bold text-indigo-400 animate-pulse">Loading packages...</div>
                        ) : packages.length === 0 ? (
                            <div className="text-center py-6 text-gray-400 italic">Không có gói tin nào khả dụng.</div>
                        ) : packages.map(pkg => (
                            <div
                                key={pkg.package_id}
                                onClick={() => setSelectedPackage(pkg)}
                                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${selectedPackage?.package_id === pkg.package_id
                                    ? 'bg-indigo-50 border-indigo-500 shadow-lg shadow-indigo-100'
                                    : 'bg-white border-gray-100 hover:border-indigo-200'
                                    }`}
                            >
                                <div>
                                    <p className="font-black text-gray-900">{pkg.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold">{pkg.duration_days} ngày • {pkg.description}</p>
                                </div>
                                <p className="text-lg font-black text-indigo-600">
                                    {new Intl.NumberFormat('vi-VN').format(pkg.price)}đ
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 pt-6 border-t flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-2 text-gray-500 font-bold text-sm"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleRenew}
                            disabled={isSubmitting || !selectedPackage}
                            className="bg-indigo-600 text-white px-8 py-2 rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition flex items-center gap-2"
                        >
                            {isSubmitting && <Loader2 size={16} className="animate-spin" />}
                            Thanh toán {selectedPackage ? new Intl.NumberFormat('vi-VN').format(selectedPackage.price) + 'đ' : ''}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Listings = () => {
    const navigate = useNavigate();
    const { token } = useSelector((state) => state.auth);
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const getDaysRemaining = (expiresAt) => {
        if (!expiresAt) return 0;
        const diff = new Date(expiresAt) - new Date();
        return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    };

    // Modal states
    const [isSelectRoomOpen, setIsSelectRoomOpen] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
    const [selectedRoom, setSelectedRoom] = useState(null);
    const [selectedListingToEdit, setSelectedListingToEdit] = useState(null);
    const [selectedListingToRenew, setSelectedListingToRenew] = useState(null);

    const fetchListings = async () => {
        try {
            const data = await listingService.getLandlordListings();
            setListings(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const toggleStatus = async (item) => {
        const newStatus = item.status === 'active' ? 'paused' : 'active';
        try {
            await listingService.updateListing(item.listing_id, {
                title: item.title,
                description: item.description,
                rent_price: item.rent_price,
                deposit_amount: item.deposit_amount,
                status: newStatus
            });
            setListings(listings.map(l => l.listing_id === item.listing_id ? { ...l, status: newStatus } : l));
        } catch (err) {
            console.error(err);
        }
    };

    const handleRoomSelect = (room) => {
        setSelectedRoom(room);
        setIsSelectRoomOpen(false);
        setIsCreateModalOpen(true);
    };

    const filteredListings = listings.filter(l =>
        (l.title?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (l.building_name?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="p-10 text-center">
            <div className="w-12 h-12 bg-indigo-50 rounded-full mx-auto mb-4 flex items-center justify-center">
                <Globe className="text-indigo-400 animate-spin" size={24} />
            </div>
            <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Đang tải dữ liệu...</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tin đăng của tôi</h1>
                    <p className="text-gray-500 font-medium font-bold">Quản lý các bài đăng tìm khách thuê phòng</p>
                </div>
                <button
                    onClick={() => setIsSelectRoomOpen(true)}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xl hover:bg-indigo-700 transition flex items-center gap-2"
                >
                    <Plus size={18} /> Đăng tin mới
                </button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass p-4 rounded-2xl border border-white/50 bg-white shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng tin đăng</p>
                    <p className="text-2xl font-black text-gray-800">{listings.length}</p>
                </div>
                <div className="glass p-4 rounded-2xl border border-white/50 bg-white shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Đang hiển thị</p>
                    <p className="text-2xl font-black text-green-600">{listings.filter(l => l.status === 'active').length}</p>
                </div>
                <div className="glass p-4 rounded-2xl border border-white/50 bg-white shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tạm dừng</p>
                    <p className="text-2xl font-black text-yellow-600">{listings.filter(l => l.status === 'paused').length}</p>
                </div>
                <div className="glass p-4 rounded-2xl border border-white/50 bg-white shadow-sm hover:shadow-md transition-all">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng lượt xem</p>
                    <p className="text-2xl font-black text-indigo-600">{listings.reduce((acc, curr) => acc + (curr.views || 0), 0)}</p>
                </div>
            </div>

            {/* Content List */}
            <div className="bg-white/70 backdrop-blur-xl rounded-3xl border border-white/20 shadow-xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tin đăng theo tiêu đề, tòa nhà..."
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50">
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tin đăng / Tòa nhà</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Giá thuê hằng tháng</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời hạn gói</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Lượt xem</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">Trạng thái</th>
                                <th className="px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredListings.map((item) => (
                                <tr key={item.listing_id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{item.title}</span>
                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight flex items-center gap-1 mt-1 font-bold">
                                                <Building2 size={10} /> {item.building_name} • Phòng {item.room_number}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-sm font-black text-indigo-600">
                                        {new Intl.NumberFormat('vi-VN').format(item.rent_price)}đ
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="w-32">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className={`text-[9px] font-black uppercase ${getDaysRemaining(item.expires_at) > 3 ? 'text-gray-400' : 'text-red-500'}`}>
                                                    Còn {getDaysRemaining(item.expires_at)} ngày
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${getDaysRemaining(item.expires_at) > 5 ? 'bg-indigo-500' : 'bg-red-500'}`}
                                                    style={{ width: `${Math.min(100, (getDaysRemaining(item.expires_at) / 30) * 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center text-sm font-bold text-gray-400">
                                        {item.views || 0}
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-col gap-1">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm inline-block text-center ${item.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-yellow-100 text-yellow-700 border-yellow-200'}`}>
                                                {item.status === 'active' ? 'Hiển thị' : 'Tạm dừng'}
                                            </span>
                                            {item.premium_until && new Date(item.premium_until) > new Date() && (
                                                <span className="bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest border border-yellow-200 flex items-center gap-1 justify-center">
                                                    <Star size={8} fill="currentColor" /> VIP
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-1 opacity-10 md:opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => {
                                                    setSelectedListingToRenew(item);
                                                    setIsRenewModalOpen(true);
                                                }}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                title="Gia hạn gói tin"
                                            >
                                                <Clock size={20} />
                                            </button>
                                            <button
                                                onClick={() => toggleStatus(item)}
                                                className={`p-2 rounded-xl transition-all ${item.status === 'active' ? 'text-yellow-600 hover:bg-yellow-50' : 'text-green-600 hover:bg-green-50'}`}
                                                title={item.status === 'active' ? 'Tạm dừng' : 'Kích hoạt lại'}
                                            >
                                                {item.status === 'active' ? <PauseCircle size={20} /> : <PlayCircle size={20} />}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedListingToEdit(item);
                                                    setIsCreateModalOpen(true);
                                                }}
                                                className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                                title="Sửa chi tiết tin đăng"
                                            >
                                                <ArrowRight size={20} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredListings.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-20 text-center">
                                        <Globe size={48} className="text-gray-200 mx-auto mb-4" />
                                        <p className="text-gray-400 font-bold italic text-sm tracking-wide">Không có tin đăng nào trùng khớp.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modals */}
            <SelectRoomModal
                isOpen={isSelectRoomOpen}
                onClose={() => setIsSelectRoomOpen(false)}
                onSelect={handleRoomSelect}
            />

            {(selectedRoom || selectedListingToEdit) && (
                <CreateListingModal
                    isOpen={isCreateModalOpen}
                    onClose={() => {
                        setIsCreateModalOpen(false);
                        setSelectedRoom(null);
                        setSelectedListingToEdit(null);
                    }}
                    selectedRoom={selectedRoom}
                    listingToEdit={selectedListingToEdit}
                    onSuccess={fetchListings}
                />
            )}

            {selectedListingToRenew && (
                <RenewModal
                    isOpen={isRenewModalOpen}
                    onClose={() => {
                        setIsRenewModalOpen(false);
                        setSelectedListingToRenew(null);
                    }}
                    listing={selectedListingToRenew}
                    onSuccess={fetchListings}
                />
            )}
        </div>
    );
};

export default Listings;
