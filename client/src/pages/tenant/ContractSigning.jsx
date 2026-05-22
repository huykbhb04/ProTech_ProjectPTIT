import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Camera,
    CircleCheck,
    Shield,
    ShieldCheck,
    PenTool,
    User,
    Loader
} from 'lucide-react';
import SignaturePad from 'react-signature-canvas';
import { toast } from 'react-hot-toast';
import contractService from '../../services/contractService';
import aiService from '../../services/aiService';

const ContractSigning = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const signaturePad = useRef(null);
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [signing, setSigning] = useState(false);

    // CCCD and Info States
    const [cccdFile, setCccdFile] = useState(null);
    const [cccdPreview, setCccdPreview] = useState(null);
    const [isExtracting, setIsExtracting] = useState(false);
    const [manualInfo, setManualInfo] = useState({
        full_name: '',
        id_number: '',
        dob: '',
        address: ''
    });

    useEffect(() => {
        const fetchContract = async () => {
            try {
                const data = await contractService.getContractDetail(id);
                setContract(data);
                if (data.tenant_full_name) {
                    setManualInfo({
                        full_name: data.tenant_full_name,
                        id_number: data.tenant_id_number || '',
                        dob: data.tenant_dob || '',
                        address: data.tenant_address || ''
                    });
                }
            } catch (error) {
                console.error("Error fetching contract:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchContract();
    }, [id]);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setCccdFile(file);
            setCccdPreview(URL.createObjectURL(file));

            // Auto OCR
            try {
                setIsExtracting(true);
                const formData = new FormData();
                formData.append('file', file);
                const result = await aiService.extractCCCD(formData);
                // Auto fill manual info if OCR success
                if (result) {
                    setManualInfo({
                        full_name: result.name || '',
                        id_number: result.id || '',
                        dob: result.dob || '',
                        address: result.address || ''
                    });
                    toast.success("Đã trích xuất thông tin thành công!");
                }
            } catch (error) {
                toast.error("Không thể tự động trích xuất thông tin. Vui lòng nhập tay.");
            } finally {
                setIsExtracting(false);
            }
        }
    };

    const handleSign = async () => {
        if (signaturePad.current.isEmpty()) {
            toast.error("Vui lòng ký tên của bạn");
            return;
        }

        if (!manualInfo.full_name || !manualInfo.id_number) {
            toast.error("Vui lòng cung cấp thông tin cá nhân (CCCD)");
            return;
        }

        try {
            setSigning(true);
            const signatureData = signaturePad.current.toDataURL();

            const formData = new FormData();
            formData.append('signature', signatureData);
            formData.append('full_name', manualInfo.full_name);
            formData.append('id_number', manualInfo.id_number);
            formData.append('address', manualInfo.address);
            if (cccdFile) formData.append('cccd_image', cccdFile);

            await contractService.signContract(id, formData);
            toast.success("Ký hợp đồng thành công!");
            navigate(`/tenant/contracts/${id}`);
        } catch (error) {
            toast.error(error.message || "Lỗi khi ký hợp đồng");
        } finally {
            setSigning(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen relative pb-20 overflow-x-hidden">
            {/* Background Decorative */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/5 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-purple-500/5 blur-[120px] rounded-full"></div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-10">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 hover:bg-white/80 glass rounded-2xl transition-all shadow-sm border-white/40 hover:scale-105 active:scale-95"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest leading-none mb-1 block">Xác thực & Ký kết trực tuyến</span>
                        <h1 className="text-2xl font-black text-gray-900 leading-none">Hoàn tất hợp đồng thuê</h1>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Left Column - Steps & Info */}
                    <div className="lg:col-span-7 space-y-8">
                        {/* Step 1: CCCD Upload */}
                        <div className="glass p-8 rounded-[2.5rem] border-white/40 shadow-2xl relative overflow-hidden group">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-indigo-100">1</div>
                                <h3 className="text-xl font-black text-gray-900 italic uppercase tracking-tight">Xác minh danh tính (CCCD)</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="relative aspect-[3/2] rounded-3xl overflow-hidden border-2 border-dashed border-gray-200 hover:border-indigo-400 transition-colors group/upload">
                                        {cccdPreview ? (
                                            <img src={cccdPreview} className="w-full h-full object-cover" alt="CCCD Preview" />
                                        ) : (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
                                                <Camera size={40} className="mb-2 opacity-20" />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Tải ảnh mặt trước CCCD</p>
                                            </div>
                                        )}
                                        <input type="file" onChange={handleFileChange} className="absolute inset-0 opacity-0 cursor-pointer" />
                                        {isExtracting && (
                                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center">
                                                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2"></div>
                                                <p className="text-[10px] font-black text-indigo-600 uppercase">Đang trích xuất AI...</p>
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold leading-relaxed italic">
                                        * Hệ thống sử dụng AI để tự động trích xuất thông tin từ ảnh của bạn một cách bảo mật.
                                    </p>
                                </div>

                                <div className="space-y-4 flex flex-col justify-center">
                                    <div className="p-4 bg-white/40 rounded-2xl border border-white/60 space-y-1">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Họ và tên</label>
                                        <input
                                            value={manualInfo.full_name}
                                            onChange={e => setManualInfo({ ...manualInfo, full_name: e.target.value.toUpperCase() })}
                                            className="w-full bg-transparent font-black text-gray-900 border-none p-0 focus:ring-0 placeholder-gray-300"
                                            placeholder="NGUYỄN VĂN A"
                                        />
                                    </div>
                                    <div className="p-4 bg-white/40 rounded-2xl border border-white/60 space-y-1">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Số CCCD</label>
                                        <input
                                            value={manualInfo.id_number}
                                            onChange={e => setManualInfo({ ...manualInfo, id_number: e.target.value })}
                                            className="w-full bg-transparent font-black text-gray-900 border-none p-0 focus:ring-0 placeholder-gray-300"
                                            placeholder="00120100XXXX"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2: Confirmation & Sign Pad */}
                        <div className="glass p-8 rounded-[2.5rem] border-white/40 shadow-2xl relative overflow-hidden">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black shadow-lg shadow-indigo-100">2</div>
                                <h3 className="text-xl font-black text-gray-900 italic uppercase tracking-tight">Ký tên xác nhận</h3>
                            </div>

                            <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-white/40 shadow-inner overflow-hidden relative group">
                                <div className="absolute top-4 left-4 p-2 bg-indigo-50 text-indigo-400 rounded-lg pointer-events-none group-hover:scale-110 transition-transform">
                                    <PenTool size={16} />
                                </div>
                                <SignaturePad
                                    ref={signaturePad}
                                    canvasProps={{
                                        className: "signature-canvas w-full h-64",
                                        style: { background: 'transparent' }
                                    }}
                                />
                                <div className="absolute bottom-4 right-4 flex gap-2">
                                    <button
                                        onClick={() => signaturePad.current.clear()}
                                        className="px-4 py-2 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 transition-all"
                                    >
                                        Xóa nháp
                                    </button>
                                </div>
                            </div>
                            <p className="mt-4 text-[10px] text-gray-400 font-bold text-center leading-relaxed">
                                Bằng việc thực hiện ký tên, bạn xác nhận đã đọc và đồng ý với tất cả điều khoản trong hợp đồng.
                            </p>
                        </div>
                    </div>

                    {/* Right Column - Final Action */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Contract Summary Card */}
                        <div className="glass p-8 rounded-[2.5rem] border-white/40 shadow-2xl space-y-8 sticky top-8">
                            <div>
                                <h4 className="text-3xl font-black text-gray-900 leading-tight mb-2">{contract.building_name}</h4>
                                <p className="text-indigo-600 font-black italic">Phòng {contract.room_number || '101'}</p>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-gray-100/50">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Giá thuê hằng tháng</span>
                                    <span className="font-black text-gray-900">{new Intl.NumberFormat('vi-VN').format(contract.rent_price)}₫</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-gray-100/50">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tiền cọc</span>
                                    <span className="font-black text-gray-900">{new Intl.NumberFormat('vi-VN').format(contract.deposit_amount)}₫</span>
                                </div>
                                <div className="flex justify-between items-center py-3">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Thời hạn</span>
                                    <span className="font-black text-indigo-600 italic">12 tháng</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSign}
                                disabled={signing}
                                className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {signing ? (
                                    <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                                ) : (
                                    <>
                                        <CircleCheck size={24} />
                                        Hoàn tất hợp đồng
                                    </>
                                )}
                            </button>

                            <div className="p-6 bg-indigo-50/50 rounded-2xl border border-indigo-100/50 flex items-start gap-4">
                                <ShieldCheck size={24} className="text-indigo-600 flex-shrink-0" />
                                <div>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Bảo vệ pháp lý</p>
                                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed italic">
                                        Hợp đồng điện tử có đầy đủ giá trị pháp lý theo luật giao dịch điện tử của Việt Nam.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContractSigning;
