import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import api from '../../services/api';
import { X, CircleAlert, Megaphone, Image as ImageIcon, Loader, Check } from 'lucide-react';
import { BackButton } from '../ui/Common';
import { toast } from 'react-hot-toast';

const PromoteModal = ({ isOpen, onClose, listing }) => {
    const [images, setImages] = useState([]);
    const [previews, setPreviews] = useState([]);
    const [bannerServices, setBannerServices] = useState([]);
    const [formData, setFormData] = useState({ type: 'home_banner', image_url: '', duration_days: 7 });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(false);

    React.useEffect(() => {
        const fetchServices = async () => {
            try {
                const res = await api.get('/monetization/premium-services');
                if (res.data) {
                    const services = Array.isArray(res.data) ? res.data : [];
                    setBannerServices(services.filter(s => s.is_active));
                }
            } catch (err) {}
        };
        fetchServices();
    }, []);

    if (!isOpen || !listing) return null;

    const calculateFee = () => {
        const selected = bannerServices.find(s => s.badge_type === formData.type);
        const base = selected ? selected.price_per_day : 0;
        return base * formData.duration_days;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);
        try {
            const isBanner = formData.type === 'home_banner' || formData.type === 'sidebar_banner';

                if (isBanner) {
                const payload = {
                    listing_id: listing.listing_id,
                    type: formData.type,
                    display_style: 'default',
                    duration_days: formData.duration_days,
                    fee_paid: calculateFee(),
                    image_url: formData.image_url
                };
                await api.post('/landlord/banners/request', payload);
                toast.success('Đăng ký Banner thành công! Admin sẽ duyệt sớm nhất.');
            } else {
                const selected = bannerServices.find(s => s.badge_type === formData.type);
                if (!selected) throw new Error('Dịch vụ không hợp lệ');
                
                await api.post('/monetization/pay', {
                    listingId: listing.listing_id,
                    paymentType: 'premium_service',
                    amount: calculateFee(),
                    paymentMethod: 'wallet',
                    referenceId: selected.service_id,
                    durationDays: formData.duration_days
                });
                toast.success('Nâng cấp VIP thành công! Tin đăng của bạn đã được ưu tiên.');
            }
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || err.message);
            toast.error(err.response?.data?.message || 'Có lỗi xảy ra');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-purple-50">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
                            <Megaphone size={24} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-900">Đẩy Tin Quảng Cáo</h3>
                            <p className="text-xs text-gray-500 font-medium">Tăng lượt xem cho tin đăng của bạn</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                        <X size={24} className="text-gray-400" />
                    </button>
                </div>
                
                {/* Error */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 border-b border-red-100 flex items-center gap-2 text-sm font-bold">
                        <CircleAlert size={16} /> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Listing Info */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-16 h-16 bg-indigo-100 rounded-xl flex items-center justify-center">
                            <Megaphone size={24} className="text-indigo-400" />
                        </div>
                        <div className="flex-1">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">Tin đang chọn</span>
                            <span className="font-bold text-gray-900 text-lg">{listing.title}</span>
                        </div>
                        <Check size={24} className="text-emerald-500" />
                    </div>

                    {/* Ad Type Selection - HORIZONTAL */}
                    <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Chọn loại hình quảng cáo</label>
                        <div className="space-y-3">
                            {bannerServices.map(svc => (
                                <button
                                    key={svc.service_id}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, type: svc.badge_type })}
                                    className={`w-full flex items-center gap-4 p-5 rounded-2xl border-2 transition-all text-left ${
                                        formData.type === svc.badge_type 
                                            ? 'border-indigo-600 bg-indigo-50 shadow-lg shadow-indigo-100' 
                                            : 'border-gray-100 hover:border-gray-200 bg-white'
                                    }`}
                                >
                                    {/* Radio */}
                                    <div className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                                        formData.type === svc.badge_type 
                                            ? 'bg-indigo-600 border-indigo-600' 
                                            : 'border-gray-300'
                                    }`}>
                                        {formData.type === svc.badge_type && (
                                            <div className="w-2 h-2 bg-white rounded-full" />
                                        )}
                                    </div>

                                    {/* Icon */}
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                        formData.type === svc.badge_type 
                                            ? 'bg-indigo-600 text-white' 
                                            : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        {svc.badge_type === 'home_banner' ? (
                                            <ImageIcon size={20} />
                                        ) : svc.badge_type === 'sidebar_banner' ? (
                                            <ImageIcon size={20} />
                                        ) : (
                                            <Megaphone size={20} />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-sm font-black text-gray-900">{svc.name}</span>
                                            {svc.badge_type === 'home_banner' && (
                                                <span className="px-2 py-0.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-[8px] font-black uppercase rounded-full">VIP</span>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-500 line-clamp-1">{svc.description}</p>
                                    </div>

                                    {/* Price */}
                                    <div className="text-right flex-shrink-0">
                                        <div className={`text-lg font-black ${
                                            formData.type === svc.badge_type ? 'text-indigo-600' : 'text-gray-700'
                                        }`}>
                                            {new Intl.NumberFormat('vi-VN').format(svc.price_per_day)}
                                            <span className="text-[10px] font-medium text-gray-400 ml-1">đ/ngày</span>
                                        </div>
                                        <div className="text-[10px] text-gray-400">
                                            {svc.duration_days_default || 7} ngày = {new Intl.NumberFormat('vi-VN').format(svc.price_per_day * (svc.duration_days_default || 7))}đ
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Image Upload - For Banner Types */}
                    {['home_banner', 'sidebar_banner'].includes(formData.type) && (
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Poster Quảng Cáo</label>
                                <span className="text-[9px] font-bold text-indigo-500 uppercase">Khuyên dùng: {formData.type === 'home_banner' ? '1920x1080' : '800x1000'}</span>
                            </div>
                            
                            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer">
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    multiple
                                    className="hidden"
                                    id="banner-upload"
                                    onChange={async (e) => {
                                        const files = Array.from(e.target.files);
                                        if (files.length > 2) {
                                            alert('Chỉ được phép tải lên tối đa 2 ảnh!');
                                            return;
                                        }
                                        
                                        setUploadProgress(true);
                                        try {
                                            const uploadedUrls = [];
                                            const { default: propertyService } = await import('../../services/propertyService');
                                            for (let file of files) {
                                            if (file.size > 5 * 1024 * 1024) {
                                                toast.error(`Ảnh ${file.name} vượt quá dung lượng 5MB.`);
                                                continue;
                                            }
                                                const res = await propertyService.uploadImage(file);
                                                if(res?.url) uploadedUrls.push(res.url);
                                                else if (res?.fileUrl) uploadedUrls.push(res.fileUrl);
                                                else uploadedUrls.push(res);
                                            }
                                        setFormData({ ...formData, image_url: uploadedUrls.join(',') });
                                            } catch (error) {
                                                toast.error('Lỗi tải ảnh: ' + error.message);
                                            } finally {
                                            setUploadProgress(false);
                                        }
                                    }} 
                                />
                                <label htmlFor="banner-upload" className="cursor-pointer">
                                    {uploadProgress ? (
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader size={32} className="animate-spin text-indigo-500" />
                                            <span className="text-sm font-bold text-gray-500">Đang tải lên...</span>
                                        </div>
                                    ) : (
                                        <>
                                            <ImageIcon size={32} className="mx-auto text-gray-300 mb-3" />
                                            <p className="text-sm font-bold text-gray-500">Click để tải ảnh lên</p>
                                            <p className="text-xs text-gray-400 mt-1">Tối đa 2 ảnh, mỗi ảnh tối đa 5MB</p>
                                        </>
                                    )}
                                </label>
                            </div>
                            
                            {formData.image_url && (
                                <div className="flex gap-3">
                                    {formData.image_url.split(',').map((url, idx) => (
                                        <div key={idx} className="relative group">
                                            <img 
                                                src={'http://127.0.0.1:3000' + url} 
                                                alt={`Preview ${idx + 1}`} 
                                                className="h-24 w-40 object-cover rounded-xl border shadow-sm" 
                                            />
                                            <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <span className="text-white text-xs font-bold">Ảnh {idx + 1}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Duration */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Số ngày chạy</label>
                            <input 
                                type="number" 
                                min="1" 
                                value={formData.duration_days} 
                                onChange={e => setFormData({ ...formData, duration_days: Number(e.target.value) })} 
                                className="w-full p-4 bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-bold text-lg" 
                            />
                        </div>
                        <div className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 flex flex-col justify-center">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng thanh toán</span>
                            <span className="text-2xl font-black text-indigo-600">{new Intl.NumberFormat('vi-VN').format(calculateFee())}đ</span>
                        </div>
                    </div>

                    {/* Submit */}
                    <button 
                        type="submit" 
                        disabled={submitting} 
                        className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {submitting ? (
                            <Loader size={20} className="animate-spin" />
                        ) : (
                            <>
                                <span>Thanh toán từ số dư ví</span>
                                <span className="ml-2 px-3 py-1 bg-white/20 rounded-lg text-sm">
                                    {new Intl.NumberFormat('vi-VN').format(calculateFee())}đ
                                </span>
                            </>
                        )}
                    </button>
                    
                    <p className="text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        Tin sẽ được lên sóng ngay sau khi Admin duyệt
                    </p>
                </form>
            </div>
        </div>
    );
};

export default PromoteModal;
