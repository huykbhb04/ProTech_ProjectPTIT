const Contract = require('../models/contractModel');
const Booking = require('../models/bookingModel');
const Property = require('../models/propertyModel');
const Notification = require('../models/notificationModel');

exports.createContractFromBooking = async (req, res) => {
    try {
        const { bookingId } = req.body;
        const booking = await Booking.findById(bookingId);

        if (!booking) {
            return res.status(404).json({ message: 'Không tìm thấy thông tin đặt lịch.' });
        }

        // Verify ownership/relationship
        if (req.user.role === 'landlord' && booking.landlord_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Không có quyền tạo hợp đồng cho lịch hẹn này.' });
        }

        // Check if contract already exists
        const existing = await Contract.getByBookingId(bookingId);
        if (existing) {
            return res.json({ success: true, contractId: existing.contract_id, message: 'Hợp đồng đã tồn tại.' });
        }

        // Get room details for price/info
        const room = await Property.getRoomById(booking.room_id);

        // Prepare default contract data
        const contractData = {
            start_date: new Date().toISOString().split('T')[0], // Default start today
            end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // 1 year default
            deposit_amount: room.deposit_amount || room.base_price,
            monthly_price: room.rent_price || room.base_price,
            contract_content: {
                terms: [
                    "Bên A bàn giao phòng đúng tình trạng và thời gian đã thỏa thuận.",
                    "Bên B thanh toán tiền phòng và các chi phí dịch vụ đúng hạn hàng tháng.",
                    "Tiền cọc sẽ được hoàn trả sau khi kết thúc hợp đồng nếu không có hư hại tài sản.",
                    "Các bên tuân thủ nội quy phòng trọ và quy định pháp luật."
                ]
            }
        };

        const contractId = await Contract.createFromBooking(booking, contractData);

        res.status(201).json({
            success: true,
            contractId,
            message: 'Đã tạo bản dự thảo hợp đồng.'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.uploadTenantCCCD = async (req, res) => {
    try {
        const { id } = req.params;
        const contract = await Contract.getById(id);

        if (!contract || contract.tenant_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Không có quyền thực hiện.' });
        }

        if (!req.files || !req.files.front || !req.files.back) {
            return res.status(400).json({ message: 'Vui lòng upload cả 2 mặt CCCD (front và back).' });
        }

        const frontUrl = req.files.front[0].path; // Cloudinary URL
        const backUrl = req.files.back[0].path;

        await Contract.saveTenantCCCD(id, frontUrl, backUrl);

        res.json({
            success: true,
            message: 'Đã lưu ảnh CCCD thành công.',
            frontUrl,
            backUrl
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateTenantInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const contract = await Contract.getById(id);

        if (!contract || contract.tenant_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Không có quyền thực hiện.' });
        }

        const { full_name, id_number, dob, address } = req.body;

        if (!full_name || !id_number || !dob || !address) {
            return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin cá nhân.' });
        }

        await Contract.updateTenantPersonalInfo(id, { full_name, id_number, dob, address });

        res.json({
            success: true,
            message: 'Đã cập nhật thông tin cá nhân thành công.'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getLandlordContracts = async (req, res) => {
    try {
        const contracts = await Contract.getContractsByLandlord(req.user.user_id);
        res.json(contracts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.updateContractTerms = async (req, res) => {
    try {
        const { id } = req.params;
        const { terms } = req.body;
        const contract = await Contract.getById(id);

        if (!contract || contract.landlord_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Không có quyền thực hiện.' });
        }

        if (!terms || !Array.isArray(terms)) {
            return res.status(400).json({ message: 'Điều khoản phải là một mảng.' });
        }

        await Contract.updateContractTerms(id, terms);
        res.json({ success: true, message: 'Đã cập nhật điều khoản hợp đồng.' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.uploadLandlordCCCD = async (req, res) => {
    try {
        const { id } = req.params;
        const contract = await Contract.getById(id);

        if (!contract || contract.landlord_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Không có quyền thực hiện.' });
        }

        if (!req.files || !req.files.front || !req.files.back) {
            return res.status(400).json({ message: 'Vui lòng upload cả 2 mặt CCCD (front và back).' });
        }

        const frontUrl = req.files.front[0].path;
        const backUrl = req.files.back[0].path;

        await Contract.saveLandlordCCCD(id, frontUrl, backUrl);

        res.json({
            success: true,
            message: 'Đã lưu ảnh CCCD thành công.',
            frontUrl,
            backUrl
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getContractDetail = async (req, res) => {
    try {
        const { id } = req.params;
        const contract = await Contract.getById(id);

        if (!contract) {
            return res.status(404).json({ message: 'Không tìm thấy hợp đồng.' });
        }

        // Access check
        if (contract.tenant_id !== req.user.user_id && contract.landlord_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Bạn không có quyền xem hợp đồng này.' });
        }

        res.json(contract);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.tenantSignContract = async (req, res) => {
    try {
        const { id } = req.params;
        const contract = await Contract.getById(id);

        if (!contract || contract.tenant_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Không có quyền thực hiện.' });
        }

        if (contract.status !== 'draft') {
            return res.status(400).json({ message: 'Hợp đồng không ở trạng thái có thể ký.' });
        }

        // Validate CCCD and personal info are complete
        const validation = await Contract.validateContractReadyToSign(id);
        if (!validation.ready) {
            return res.status(400).json({
                message: 'Vui lòng hoàn tất thông tin trước khi ký hợp đồng.',
                missing: validation.missing
            });
        }

        await Contract.tenantSign(id);

        // Notify landlord
        await Notification.create(
            contract.landlord_id,
            'Hợp đồng đã được người thuê ký',
            `Người thuê ${req.user.full_name} đã ký hợp đồng cho phòng ${contract.room_number}. Vui lòng kiểm tra và ký xác nhận.`,
            'system'
        );

        res.json({ success: true, message: 'Bạn đã ký hợp đồng thành công. Chờ chủ nhà ký xác nhận.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.landlordSignContract = async (req, res) => {
    try {
        const { id } = req.params;
        const contract = await Contract.getById(id);

        if (!contract || contract.landlord_id !== req.user.user_id) {
            return res.status(403).json({ message: 'Không có quyền thực hiện.' });
        }

        if (contract.status !== 'signed_by_tenant') {
            return res.status(400).json({ message: 'Người thuê chưa ký hợp đồng này.' });
        }

        // Validate landlord CCCD is uploaded
        if (!contract.landlord_cccd_front_url || !contract.landlord_cccd_back_url) {
            return res.status(400).json({ message: 'Vui lòng upload CCCD của bạn trước khi ký hợp đồng.' });
        }

        await Contract.landlordSign(id);

        // Notify tenant
        await Notification.create(
            contract.tenant_id,
            'Hợp đồng thuê phòng đã chính thức kích hoạt',
            `Chủ nhà đã ký xác nhận hợp đồng phòng ${contract.room_number}. Hợp đồng hiện đã có hiệu lực.`,
            'system'
        );

        res.json({ success: true, message: 'Hợp đồng đã được ký kết thành công. Phòng đã chuyển sang trạng thái đã thuê.' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.saveContractHandover = async (req, res) => {
    try {
        const { id } = req.params;
        const handoverData = req.body;

        // Verify ownership
        const contract = await Contract.getById(id);
        if (!contract || contract.landlord_id !== req.user.user_id) {
            return res.status(403).json({ message: 'KhÃ´ng cÃ³ quyá»n thá»±c hiá»‡n.' });
        }

        // Validate required fields
        if (!handoverData.electricity_index || !handoverData.water_index) {
            return res.status(400).json({
                message: 'Vui lÃ²ng nháº­p chá»‰ sá»‘ Ä‘iá»‡n vÃ  nÆ°á»›c.'
            });
        }

        await Contract.saveHandoverInfo(id, handoverData);

        res.json({
            success: true,
            message: 'ÄÃ£ lÆ°u thÃ´ng tin bÃ n giao thÃ nh cÃ´ng.'
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getRoomAssets = async (req, res) => {
    try {
        const { id } = req.params; // contract_id
        const contract = await Contract.getById(id);

        if (!contract) {
            return res.status(404).json({ message: 'KhÃ´ng tÃ¬m tháº¥y há»£p Ä‘á»“ng.' });
        }

        // Verify access (landlord or tenant)
        if (contract.landlord_id !== req.user.user_id && contract.tenant_id !== req.user.user_id) {
            return res.status(403).json({ message: 'KhÃ´ng cÃ³ quyá»n truy cáº­p.' });
        }

        const assets = await Contract.getRoomAssets(contract.room_id);
        res.json(assets);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

exports.getUtilityConfigs = async (req, res) => {
    try {
        const { id } = req.params; // contract_id
        const contract = await Contract.getById(id);

        if (!contract) {
            return res.status(404).json({ message: 'KhÃ´ng tÃ¬m tháº¥y há»£p Ä‘á»“ng.' });
        }

        // Verify access (landlord or tenant)
        if (contract.landlord_id !== req.user.user_id && contract.tenant_id !== req.user.user_id) {
            return res.status(403).json({ message: 'KhÃ´ng cÃ³ quyá»n truy cáº­p.' });
        }

        const configs = await Contract.getUtilityConfigs(contract.landlord_id);
        res.json(configs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = exports;
