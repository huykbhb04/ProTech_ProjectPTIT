import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, MapPin, Heart, ChevronDown, Check, Star, ShieldCheck, Clock, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useSelector, useDispatch } from 'react-redux';
import { toggleSaveListing } from '../../features/savedListings/savedListingsSlice';
import listingService from '../../services/listingService';

// --- Cấu hình màu sắc & Tokens thiết kế ---
const COLORS = {
    bg: '#ffffff',
    bgSoft: '#f8f8f8',
    text: '#000000',
    textSoft: '#666666',
    border: '#eeeeee',
    accent: '#000000'
};

const CATEGORIES = [
    { id: 'all', label: 'TẤT CẢ BỘ SƯU TẬP' },
    { id: 'apartment', label: 'CĂN HỘ CAO CẤP' },
    { id: 'studio', label: 'STUDIO TỐI GIẢN' },
    { id: 'room', label: 'PHÒNG TRỌ ĐỘC BẢN' }
];

const TESTIMONIALS = [
    { id: 1, name: "Alexander V.", text: "Sự quản lý liền mạch và thiết kế nội thất tinh tế của các căn hộ ở đây là không thể so sánh được. Một trải nghiệm sống đẳng cấp thực sự.", role: "Kiến trúc sư" },
    { id: 2, name: "Sophia M.", text: "Tôi đã tìm thấy ngôi nhà mơ ước của mình chỉ trong vài phút. Sự minh bạch và cách tiếp cận dựa trên công nghệ giúp việc thuê nhà trở nên thượng lưu và dễ dàng.", role: "Giám đốc sáng tạo" }
];

// --- Animation Helper (CSS) ---
const STYLES = `
@keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
}
@keyframes heroReveal {
    from { clip-path: inset(100% 0 0 0); }
    to { clip-path: inset(0 0 0 0); }
}
.reveal-item {
    opacity: 0;
    transform: translateY(30px);
    transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
}
.reveal-item.visible {
    opacity: 1;
    transform: translateY(0);
}
.hide-scrollbar::-webkit-scrollbar { display: none; }

.hero-slide-enter { opacity: 0; }
.hero-slide-enter-active { opacity: 1; transition: opacity 1s ease-in-out; }
.hero-slide-exit { opacity: 1; }
.hero-slide-exit-active { opacity: 0; transition: opacity 1s ease-in-out; }
`;

// --- Sub-components ---

const CommitmentCard = ({ icon: Icon, title, desc }) => (
    <div className="flex flex-col items-center text-center px-8 border-r border-gray-100 last:border-0">
        <div className="mb-6 text-black">
            <Icon size={32} strokeWidth={1} />
        </div>
        <h3 className="text-xs font-bold tracking-[0.2em] uppercase mb-3 text-black">{title}</h3>
        <p className="text-[11px] text-gray-400 leading-relaxed font-medium uppercase tracking-wider">{desc}</p>
    </div>
);

const ListingCard = ({ item, index, isSaved, onToggle }) => {
    const images = Array.isArray(item.images) ? item.images : JSON.parse(item.images || '[]');
    const coverImage = images[0] || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=2670&auto=format&fit=crop';
    const hoverImage = images[1] || coverImage;

    return (
        <div
            className="group block relative animate-in fade-in slide-in-from-bottom-5 duration-700"
            style={{ animationDelay: `${index * 100}ms` }}
        >
            <Link
                to={`/tenant/room/${item.room_id}`}
                className="block"
            >
                <div className="relative overflow-hidden aspect-[4/5] bg-gray-100 mb-5">
                    {/* Main Image */}
                    <img
                        src={coverImage}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 group-hover:opacity-0"
                    />
                    {/* Hover Image */}
                    <img
                        src={hoverImage}
                        alt={item.title}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-1000 group-hover:opacity-100 scale-100 group-hover:scale-105 transition-transform duration-[2000ms]"
                    />

                    {/* Status Badge */}
                    {item.premium_until && new Date(item.premium_until) > new Date() && (
                        <div className="absolute top-0 left-0 bg-black text-white text-[9px] font-bold px-3 py-1.5 uppercase tracking-widest">
                            Bộ sưu tập Signature
                        </div>
                    )}
                </div>
            </Link>

            {/* Minimalist Action - Fixed Position Outside Link or handled separately */}
            <div className="absolute top-4 right-4 translate-x-10 group-hover:translate-x-0 opacity-0 group-hover:opacity-100 transition-all duration-500 z-10">
                <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onToggle(item.listing_id); }}
                    className={`w-10 h-10 flex items-center justify-center border border-black/5 transition-all ${isSaved ? 'bg-black text-white' : 'bg-white text-black hover:bg-black hover:text-white'}`}
                >
                    <Heart size={16} strokeWidth={1.5} className={isSaved ? "fill-white" : ""} />
                </button>
            </div>

            <Link to={`/tenant/room/${item.room_id}`} className="block">
                <div className="space-y-1.5 px-1">
                    <div className="flex justify-between items-baseline gap-4">
                        <h3 className="text-sm font-medium tracking-tight text-black line-clamp-1 group-hover:opacity-60 transition-opacity uppercase">
                            {item.title}
                        </h3>
                        <p className="text-sm font-bold text-black shrink-0">
                            {new Intl.NumberFormat('vi-VN').format(item.rent_price)} <span className="text-[10px] font-normal opacity-40">VND</span>
                        </p>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                        <span className="flex items-center gap-1"><MapPin size={10} /> {item.building_name}</span>
                        <span className="flex items-center gap-0.5"><Star size={10} className="fill-black text-black" /> 5.0</span>
                    </div>
                </div>
            </Link>
        </div>
    );
};

// --- Collage Component for Hero ---
const HeroImageCollage = ({ images, activeIdx = 0 }) => {
    const imgList = Array.isArray(images) ? images : JSON.parse(images || '[]');
    if (imgList.length === 0) return null;

    // Cycle through images if many exist, using activeIdx for offset
    const getImg = (offset) => imgList[(activeIdx + offset) % imgList.length];

    if (imgList.length === 1) {
        return (
            <div className="absolute inset-0 overflow-hidden">
                <img
                    src={imgList[0]}
                    alt="VIP Property"
                    className="absolute inset-0 w-full h-full object-cover opacity-60 scale-100 animate-[heroReveal_2s_cubic-bezier(0.2,0.8,0.2,1)_forwards]"
                />
            </div>
        );
    }

    if (imgList.length === 2) {
        return (
            <div className="absolute inset-0 w-full h-full flex opacity-60 transition-all duration-1000">
                <div className="w-1/2 h-full overflow-hidden border-r border-black/20">
                    <img key={`left-${activeIdx}`} src={getImg(0)} className="w-full h-full object-cover animate-in fade-in duration-1000" alt="" />
                </div>
                <div className="w-1/2 h-full overflow-hidden">
                    <img key={`right-${activeIdx}`} src={getImg(1)} className="w-full h-full object-cover animate-in fade-in duration-1000" alt="" />
                </div>
            </div>
        );
    }

    // Dynamic collage for 3+ images: rotates content within positions
    return (
        <div className="absolute inset-0 w-full h-full grid grid-cols-12 gap-1 opacity-60 transition-all duration-1000">
            <div className="col-span-8 h-full overflow-hidden">
                <img key={`main-${activeIdx}`} src={getImg(0)} className="w-full h-full object-cover animate-in fade-in slide-in-from-left-4 duration-1000" alt="" />
            </div>
            <div className="col-span-4 h-full grid grid-rows-2 gap-1">
                <div className="overflow-hidden">
                    <img key={`sub1-${activeIdx}`} src={getImg(1)} className="w-full h-full object-cover animate-in fade-in slide-in-from-top-4 duration-1000" alt="" />
                </div>
                <div className="overflow-hidden">
                    <img key={`sub2-${activeIdx}`} src={getImg(2)} className="w-full h-full object-cover animate-in fade-in slide-in-from-bottom-4 duration-1000" alt="" />
                </div>
            </div>
        </div>
    );
};

const DiscoverRooms = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [listings, setListings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [scrolled, setScrolled] = useState(false);
    const [heroIndex, setHeroIndex] = useState(0);
    const [subImageIndex, setSubImageIndex] = useState(0);
    const dispatch = useDispatch();
    const { user } = useSelector(state => state.auth);
    const { savedIds } = useSelector(state => state.savedListings);

    // --- VIP listings for Hero ---
    const vipListings = listings.filter(l => l.premium_until && new Date(l.premium_until) > new Date()).slice(0, 5);

    // Rotation logic for Listings
    useEffect(() => {
        if (vipListings.length <= 1) return;
        const timer = setInterval(() => {
            setHeroIndex(prev => (prev + 1) % vipListings.length);
            setSubImageIndex(0); // Reset image index when listing changes
        }, 8000); // 8s per listing
        return () => clearInterval(timer);
    }, [vipListings.length]);

    // Rotation logic for Images WITHIN a listing
    useEffect(() => {
        if (!vipListings[heroIndex]) return;
        const images = JSON.parse(vipListings[heroIndex].images || '[]');
        if (images.length <= 3) return; // No point cycling if all fit in collage

        const subTimer = setInterval(() => {
            setSubImageIndex(prev => (prev + 1) % images.length);
        }, 4000); // 4s per image rotation
        return () => clearInterval(subTimer);
    }, [heroIndex, vipListings]);

    // Intersection Observer for Reveal Effect
    const revealRefs = useRef([]);
    revealRefs.current = [];

    const addToRefs = (el) => {
        if (el && !revealRefs.current.includes(el)) {
            revealRefs.current.push(el);
        }
    };

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        }, { threshold: 0.1 });

        revealRefs.current.forEach(ref => observer.observe(ref));
        return () => observer.disconnect();
    }, [listings, loading]);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 100);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await listingService.getActiveListings();
                setListings(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    const handleToggleSave = async (listingId) => {
        if (!user) {
            toast.error('Vui lòng đăng nhập để lưu tin');
            return;
        }

        try {
            await dispatch(toggleSaveListing(listingId)).unwrap();
            // Toast will be handled if needed, or by slice
        } catch (error) {
            toast.error('Có lỗi xảy ra');
        }
    };

    const filtered = listings.filter(item => {
        const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.building_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.address.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || item.type?.toLowerCase() === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const activeHeroListing = vipListings[heroIndex];

    return (
        <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white pb-32">
            <style>{STYLES}</style>

            {/* 1. HERO SECTION - VIP CAROUSEL */}
            <div className="relative h-[95vh] w-full overflow-hidden bg-black transition-all duration-1000">
                {activeHeroListing ? (
                    <>
                        <HeroImageCollage images={activeHeroListing.images} activeIdx={subImageIndex} />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/30"></div>

                        <div key={activeHeroListing.listing_id} className="relative h-full flex flex-col justify-center items-center text-center px-6 md:px-12 animate-[fadeIn_1.5s_ease-out_both]">
                            <span className="text-[11px] font-bold text-white uppercase tracking-[0.5em] mb-10 block opacity-90">
                                {activeHeroListing.building_name} • BỘ SƯU TẬP ĐẶC BIỆT
                            </span>
                            <h1 className="text-5xl md:text-7xl lg:text-[10rem] font-bold text-white tracking-tighter leading-[0.8] mb-16 uppercase max-w-6xl">
                                {activeHeroListing.title.split(' ').slice(0, 2).join(' ')} <br />
                                <span className="font-light italic tracking-normal text-white/90">
                                    {activeHeroListing.title.split(' ').slice(2).join(' ') || 'Tuyệt mỹ.'}
                                </span>
                            </h1>
                            <div className="flex flex-col items-center gap-12">
                                <Link
                                    to={`/tenant/room/${activeHeroListing.room_id}`}
                                    className="bg-white text-black px-16 py-6 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all duration-700 border border-white active:scale-95"
                                >
                                    Khám phá chi tiết
                                </Link>
                            </div>

                            {/* Carousel Indicators */}
                            {vipListings.length > 1 && (
                                <div className="absolute bottom-20 flex gap-4">
                                    {vipListings.map((_, idx) => (
                                        <button
                                            key={idx}
                                            onClick={() => setHeroIndex(idx)}
                                            className={`h-1 transition-all duration-500 ${heroIndex === idx ? 'w-12 bg-white' : 'w-4 bg-white/20'}`}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <img
                            src="https://images.unsplash.com/photo-1600210491892-03d54c0aaf87?q=80&w=2670&auto=format&fit=crop"
                            alt="Luxury Interior"
                            className="absolute inset-0 w-full h-full object-cover opacity-60 animate-[heroReveal_2s_cubic-bezier(0.2,0.8,0.2,1)_forwards]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/30"></div>
                        <div className="relative h-full flex flex-col justify-center items-center text-center px-6 md:px-12 animate-[fadeIn_1.5s_ease-out_0.5s_both]">
                            <span className="text-[11px] font-bold text-white uppercase tracking-[0.5em] mb-10 block opacity-90">
                                SmartProp Tuyển Chọn
                            </span>
                            <h1 className="text-6xl md:text-8xl lg:text-[11rem] font-bold text-white tracking-tighter leading-[0.8] mb-16 uppercase">
                                KHÔNG GIAN <br />
                                <span className="font-light italic tracking-normal text-white/90">Sống Đẳng Cấp.</span>
                            </h1>
                            <div className="flex flex-col items-center gap-12">
                                <button
                                    onClick={() => document.getElementById('discover').scrollIntoView({ behavior: 'smooth' })}
                                    className="bg-white text-black px-16 py-6 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-black hover:text-white transition-all duration-700 border border-white active:scale-95"
                                >
                                    Khám Phá Ngay
                                </button>
                            </div>
                        </div>
                    </>
                )}

                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
                    <div className="h-20 w-[1px] bg-white/20 relative overflow-hidden">
                        <div className="h-full w-full bg-white absolute top-0 animate-[shimmer_2.5s_infinite]"></div>
                    </div>
                </div>
            </div>

            {/* 2. STICKY FILTER BAR - MINIMALIST */}
            <div id="discover" className={`sticky top-0 z-50 bg-white/98 backdrop-blur-xl border-b border-gray-100 transition-all duration-700 ${scrolled ? 'py-4 shadow-xl' : 'py-10'}`}>
                <div className="max-w-[1800px] mx-auto px-6 md:px-16 flex flex-col lg:flex-row justify-between items-center gap-10">

                    {/* Collection Categories */}
                    <div className="flex gap-12 overflow-x-auto w-full lg:w-auto hide-scrollbar pb-2 lg:pb-0">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat.id)}
                                className={`text-[11px] font-black uppercase tracking-[0.25em] transition-all relative pb-3 group ${selectedCategory === cat.id ? 'opacity-100 text-black' : 'opacity-30 hover:opacity-100 text-gray-500'
                                    }`}
                            >
                                {cat.label}
                                <span className={`absolute bottom-0 left-0 h-[3px] bg-black transition-all duration-500 ease-in-out ${selectedCategory === cat.id ? 'w-full' : 'w-0 group-hover:w-full'
                                    }`}></span>
                            </button>
                        ))}
                    </div>

                    {/* Minimalist Search */}
                    <div className="relative w-full lg:w-[450px] group border-b border-black/10 focus-within:border-black transition-all duration-500">
                        <input
                            type="text"
                            placeholder="TÌM KIẾM KHÔNG GIAN CỦA BẠN..."
                            className="w-full bg-transparent border-none py-4 px-0 text-[11px] font-bold tracking-[0.15em] focus:ring-0 placeholder-gray-300 uppercase"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <Search className="absolute right-0 top-4 text-black w-4 h-4 opacity-30 group-focus-within:opacity-100 transition-opacity" />
                    </div>
                </div>
            </div>

            {/* 3. GRID SHOWCASE - THOUGHTFUL SPACING */}
            <div className="max-w-[1800px] mx-auto px-6 md:px-16 py-32 md:py-48">
                <div ref={addToRefs} className="reveal-item mb-20 flex flex-col md:flex-row justify-between items-end gap-6">
                    <div className="max-w-2xl">
                        <h2 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase mb-6">Danh sách <span className="font-light italic">Hiện có.</span></h2>
                        <p className="text-sm text-gray-400 leading-relaxed font-medium">Một sự tuyển chọn tinh tế những bất động sản tốt nhất, mỗi nơi phản ánh một sự pha trộn độc đáo của kiến trúc, công nghệ và sự thoải mái tinh tế.</p>
                    </div>
                    <div className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40">
                        Hiển thị {filtered.length} kết quả duy nhất
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-48">
                        <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin"></div>
                    </div>
                ) : filtered.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-10 gap-y-24">
                        {filtered.map((item, i) => (
                            <ListingCard
                                key={item.listing_id}
                                item={item}
                                index={i}
                                isSaved={savedIds.includes(item.listing_id)}
                                onToggle={handleToggleSave}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="py-48 text-center bg-gray-50 border border-dashed border-gray-100">
                        <p className="text-[10px] font-bold uppercase tracking-[0.4em] opacity-30 italic">Không tìm thấy phòng phù hợp.</p>
                        <button onClick={() => { setSearchTerm(''); setSelectedCategory('all'); }} className="mt-8 text-[11px] font-black uppercase tracking-widest border-b border-black pb-1 hover:opacity-50 transition-all">Xóa bộ lọc</button>
                    </div>
                )}
            </div>

            {/* 4. SERVICE COMMITMENTS - LUXURY ICONS */}
            <div className="bg-white border-y border-gray-100 py-32">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-16 lg:gap-2">
                    <CommitmentCard
                        icon={ShieldCheck}
                        title="Tuyển chọn khắt khe"
                        desc="Chỉ 1% tài sản đáp ứng các tiêu chí nghiêm ngặt của chúng tôi về chất lượng và sự xuất sắc trong quản lý."
                    />
                    <CommitmentCard
                        icon={Clock}
                        title="Hỗ trợ 24/7"
                        desc="Đội ngũ kỹ thuật và hỗ trợ tận tâm đảm bảo sự an tâm của bạn suốt ngày đêm."
                    />
                    <CommitmentCard
                        icon={Award}
                        title="Xác minh thông minh"
                        desc="Mọi đơn vị đều được AI kiểm duyệt tính chính xác, từ giá cả đến tính minh bạch trong đo lường tiện ích."
                    />
                </div>
            </div>

            {/* 5. MINIMALIST TESTIMONIALS */}
            <div className="py-32 overflow-hidden">
                <div className="max-w-[1700px] mx-auto px-6 md:px-12">
                    <div ref={addToRefs} className="reveal-item text-center mb-20">
                        <h3 className="text-2xl font-bold uppercase tracking-[0.1em] mb-4">Góc nhìn khách hàng.</h3>
                        <div className="w-16 h-px bg-black mx-auto"></div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-20 lg:gap-40 max-w-6xl mx-auto">
                        {TESTIMONIALS.map((t, i) => (
                            <div key={t.id} ref={addToRefs} className="reveal-item text-center " style={{ transitionDelay: `${i * 200}ms` }}>
                                <p className="text-lg md:text-xl text-black font-light leading-relaxed mb-10 italic">"{t.text}"</p>
                                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-black italic">— {t.name}, {t.role}</h4>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 6. CALL TO ACTION - CLEAN FINISH */}
            <div className="bg-black py-40 text-center px-6 relative">
                <div className="max-w-3xl mx-auto relative z-10 animate-in fade-in duration-1000">
                    <h2 className="text-4xl md:text-6xl font-bold text-white mb-10 tracking-tighter uppercase leading-tight">
                        Trải nghiệm <br />
                        <span className="font-light italic text-gray-400">Tương lai của cuộc sống.</span>
                    </h2>
                    <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                        <Link to="/register" className="w-full md:w-auto bg-white text-black px-12 py-5 text-xs font-bold uppercase tracking-[0.3em] hover:opacity-80 transition-opacity">
                            Đăng ký thành viên
                        </Link>
                        <Link to="/login" className="w-full md:w-auto border border-white/20 text-white px-12 py-5 text-xs font-bold uppercase tracking-[0.3em] hover:bg-white/10 transition-colors">
                            Truy cập bộ sưu tập
                        </Link>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default DiscoverRooms;
