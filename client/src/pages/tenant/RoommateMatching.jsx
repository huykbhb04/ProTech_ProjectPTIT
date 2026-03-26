import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { MapPin, Users, Sparkles, Check, Search, Heart, UserPlus, Zap, Loader2 } from 'lucide-react';
import LocationPicker from '../../components/LocationPicker';
import api from '../../services/api';
import axios from 'axios'; // Keep axios for Nominatim only

const RoommateMatching = () => {
    const { user } = useSelector((state) => state.auth);
    const [step, setStep] = useState(1); // 1: Survey, 2: Results
    const [loading, setLoading] = useState(false);

    // Form State
    const [profile, setProfile] = useState({
        budget_min: 2000000,
        budget_max: 5000000,
        traits: [0, 0, 0, 0, 0], // [Smoking, Pets, Schedule, Guests, Cleanliness]
        locations: [] // {lat, lng}
    });

    const [matches, setMatches] = useState([]);

    // Location Search State
    const [addressQuery, setAddressQuery] = useState('');
    const [addressSuggestions, setAddressSuggestions] = useState([]);
    const [isSearchingAddress, setIsSearchingAddress] = useState(false);

    // Debounce Address Search
    useEffect(() => {
        const fetchAddress = async () => {
            if (!addressQuery || addressQuery.length < 3) {
                setAddressSuggestions([]);
                return;
            }

            setIsSearchingAddress(true);
            try {
                const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&countrycodes=vn&limit=5&addressdetails=1`);
                setAddressSuggestions(res.data || []);
            } catch (error) {
                console.error("Address fetch error:", error);
            } finally {
                setIsSearchingAddress(false);
            }
        };

        const timeoutId = setTimeout(() => {
            fetchAddress();
        }, 500); // 500ms debounce

        return () => clearTimeout(timeoutId);
    }, [addressQuery]);

    // Survey Options
    const HABITS = [
        { id: 0, label: 'Hút thuốc', left: 'Không bao giờ', right: 'Thường xuyên' },
        { id: 1, label: 'Thú cưng', left: 'Không thích', right: 'Yêu động vật' },
        { id: 2, label: 'Giờ giấc', left: 'Sáng sớm', right: 'Cú đêm' },
        { id: 3, label: 'Khách khứa', left: 'Không thích', right: 'Thoải mái' },
        { id: 4, label: 'Vệ sinh', left: 'Bình thường', right: 'Kỹ tính' }
    ];

    const handleTraitChange = (index, value) => {
        const newTraits = [...profile.traits];
        newTraits[index] = value;
        setProfile({ ...profile, traits: newTraits });
    };

    const handleLocationSelect = (latlng) => {
        // Limit to 3 locations
        if (profile.locations.length >= 3) return;
        setProfile({ ...profile, locations: [...profile.locations, latlng] });
    };

    const removeLocation = (index) => {
        const newLocs = profile.locations.filter((_, i) => i !== index);
        setProfile({ ...profile, locations: newLocs });
    };

    const handleFindMatches = async () => {
        setLoading(true);
        try {
            // 1. Update Profile first using api service (auto-injects token)
            await api.post('/roommates/profile', {
                budget_min: profile.budget_min,
                budget_max: profile.budget_max,
                lifestyle_vector: { traits: profile.traits, locations: profile.locations },
                locations: profile.locations
            });

            // 2. Get Matches
            const res = await api.get('/roommates/matches');
            setMatches(res.data);
            setStep(2);
        } catch (error) {
            console.error(error);
            alert("Lỗi khi tìm kiếm: " + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-6xl mx-auto space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Tìm Bạn Cùng Phòng</h1>
                    <p className="text-gray-500 font-medium">Kết nối với người phù hợp dựa trên thói quen & vị trí</p>
                </div>
                <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold uppercase tracking-widest">
                    <Sparkles size={16} />
                    <span>AI Powered Matching v2.0</span>
                </div>
            </div>

            {step === 1 && (
                <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Left: Lifestyle Survey */}
                    <div className="space-y-6">
                        <div className="glass p-8 rounded-[2rem] border border-white/50 shadow-xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -mr-32 -mt-32 pointer-events-none group-hover:bg-indigo-500/20 transition-all duration-700"></div>

                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Users className="text-indigo-600" size={24} /> Khảo sát lối sống
                            </h2>

                            <div className="space-y-8">
                                {HABITS.map((habit, idx) => (
                                    <div key={habit.id} className="space-y-3">
                                        <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-widest">
                                            <span>{habit.left}</span>
                                            <span className="text-gray-800">{habit.label}</span>
                                            <span>{habit.right}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.25"
                                            value={profile.traits[idx]}
                                            onChange={(e) => handleTraitChange(idx, parseFloat(e.target.value))}
                                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 hover:accent-indigo-500 transition-all"
                                        />
                                    </div>
                                ))}
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">Ngân sách (VNĐ)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number"
                                        value={profile.budget_min}
                                        onChange={(e) => setProfile({ ...profile, budget_min: parseInt(e.target.value) })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Min"
                                    />
                                    <span className="text-gray-300">-</span>
                                    <input
                                        type="number"
                                        value={profile.budget_max}
                                        onChange={(e) => setProfile({ ...profile, budget_max: parseInt(e.target.value) })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                                        placeholder="Max"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Location & Action */}
                    <div className="space-y-6 flex flex-col">
                        <div className="glass p-8 rounded-[2rem] border border-white/50 shadow-xl flex-1 flex flex-col">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <MapPin className="text-pink-600" size={24} /> Địa điểm thường đến
                            </h2>
                            <p className="text-sm text-gray-500 mb-4">Chọn tối đa 3 địa điểm (Công ty, Trường học...) để tìm người có cùng lộ trình.</p>

                            <div className="flex-1 rounded-2xl overflow-hidden border border-gray-200 shadow-inner relative min-h-[300px] flex flex-col">
                                {/* Search Bar Overlay */}
                                <div className="absolute top-4 left-4 right-4 z-[1000]">
                                    <div className="relative group shadow-2xl rounded-xl bg-white/50 backdrop-blur-sm">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            {isSearchingAddress ? (
                                                <Loader2 className="h-5 w-5 text-indigo-500 animate-spin" />
                                            ) : (
                                                <Search className="h-5 w-5 text-gray-400 group-focus-within:text-indigo-600" />
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            value={addressQuery}
                                            onChange={(e) => setAddressQuery(e.target.value)}
                                            className="block w-full pl-10 pr-10 py-3.5 border-0 rounded-xl leading-5 bg-white/80 focus:bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm font-bold shadow-lg transition-all"
                                            placeholder="Nhập địa điểm (VD: Đại học Bách Khoa...)"
                                        />
                                        {addressQuery && (
                                            <button
                                                onClick={() => {
                                                    setAddressQuery('');
                                                    setAddressSuggestions([]);
                                                }}
                                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                                            >
                                                <Search className="h-4 w-4 rotate-45" /> {/* Close icon substitute */}
                                            </button>
                                        )}

                                        {/* Autocomplete Dropdown */}
                                        {addressSuggestions.length > 0 && (
                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 max-h-60 overflow-y-auto">
                                                {addressSuggestions.map((item, idx) => (
                                                    <div
                                                        key={idx}
                                                        onClick={() => {
                                                            handleLocationSelect({ lat: parseFloat(item.lat), lng: parseFloat(item.lon) });
                                                            setAddressQuery(''); // Clear after selection or keep it?
                                                            setAddressSuggestions([]);
                                                        }}
                                                        className="px-4 py-3 hover:bg-indigo-50 cursor-pointer border-b border-gray-50 last:border-0 flex items-start gap-3 transition-colors text-left"
                                                    >
                                                        <div className="mt-1 min-w-[16px]">
                                                            <MapPin size={16} className="text-gray-400" />
                                                        </div>
                                                        <div>
                                                            <div className="font-bold text-gray-800 text-sm line-clamp-1">{item.name || item.display_name.split(',')[0]}</div>
                                                            <div className="text-xs text-gray-500 line-clamp-2">{item.display_name}</div>
                                                        </div>
                                                    </div>
                                                ))}
                                                <div className="px-2 py-1 bg-gray-50 text-[10px] text-center text-gray-400 uppercase tracking-widest font-bold">
                                                    Powered by OpenStreetMap
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <LocationPicker
                                    position={profile.locations.length > 0 ? profile.locations[profile.locations.length - 1] : null}
                                    onLocationChange={handleLocationSelect}
                                    height="100%"
                                />

                                <div className="absolute bottom-4 right-4 space-y-2 pointer-events-none flex flex-col items-end">
                                    {profile.locations.map((loc, i) => (
                                        <div key={i} className="bg-white/90 backdrop-blur px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 pointer-events-auto animate-in slide-in-from-right-2 border border-gray-100/50">
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></div>
                                            <span className="text-xs font-bold text-gray-700">Vị trí {i + 1}</span>
                                            <button onClick={() => removeLocation(i)} className="text-gray-400 hover:text-red-500 transition-colors"><UserPlus size={14} className="rotate-45" /></button>
                                        </div>
                                    ))}
                                    {profile.locations.length === 0 && (
                                        <div className="bg-black/70 text-white px-4 py-2 rounded-xl text-xs font-bold backdrop-blur animate-pulse">
                                            Tìm kiếm hoặc bấm vào bản đồ để chọn
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleFindMatches}
                            disabled={loading}
                            className={`w-full py-5 rounded-2xl font-black text-lg uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 ${loading ? 'bg-gray-100 text-gray-400 curson-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-indigo-500/30 hover:to-purple-700'
                                }`}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <Search />}
                            {loading ? 'AI đang phân tích...' : 'Tìm người phù hợp'}
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="animate-in fade-in zoom-in duration-300">
                    <button onClick={() => setStep(1)} className="mb-6 flex items-center text-gray-500 hover:text-indigo-600 font-bold text-sm">
                        Quay lại chỉnh sửa
                    </button>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matches.length === 0 ? (
                            <div className="col-span-full text-center py-20">
                                <p className="text-gray-400 text-lg">Chưa tìm thấy người phù hợp nào :(</p>
                            </div>
                        ) : (
                            matches.map((match) => (
                                <div key={match.user_id} className="glass p-6 rounded-[2rem] border border-white/60 hover:border-indigo-200 transition-all hover:shadow-2xl group relative overflow-hidden">
                                    {/* Compatibility Badge */}
                                    <div className="absolute top-4 right-4 bg-green-100 text-green-700 font-black text-xs px-3 py-1.5 rounded-full uppercase tracking-widest border border-green-200 shadow-sm z-10">
                                        {Math.round(match.match_score * 100)}% Hợp nhau
                                    </div>

                                    <div className="flex flex-col items-center mb-6 relative z-10">
                                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden mb-4">
                                            <img src={match.avatar_url || `https://ui-avatars.com/api/?name=${match.full_name}&background=random`} alt={match.full_name} className="w-full h-full object-cover" />
                                        </div>
                                        <h3 className="text-xl font-bold text-gray-900">{match.full_name}</h3>
                                        <p className="text-sm text-gray-500">{new Date().getFullYear() - new Date(match.date_of_birth).getFullYear()} tuổi</p>
                                    </div>

                                    <div className="space-y-4 mb-6 relative z-10">
                                        <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                                                <Zap size={12} /> AI Insight
                                            </p>
                                            <p className="text-sm text-indigo-900 font-medium leading-relaxed">
                                                "{match.match_reasoning}"
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 text-center">
                                            <div className="p-3 bg-gray-50 rounded-xl">
                                                <p className="text-[10px] text-gray-400 uppercase">Ngân sách</p>
                                                <p className="font-bold text-gray-700 text-xs">
                                                    {match.budget_min / 1000000} - {match.budget_max / 1000000}tr
                                                </p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-xl">
                                                <p className="text-[10px] text-gray-400 uppercase">Khoảng cách</p>
                                                <p className="font-bold text-gray-700 text-xs">
                                                    {match.match_details.min_distance_km ? `${match.match_details.min_distance_km} km` : 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="w-full py-3 bg-white border border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:text-indigo-600 transition-colors shadow-sm active:scale-95">
                                        Xem hồ sơ chi tiết
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RoommateMatching;
