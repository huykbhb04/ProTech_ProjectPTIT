const Admin = require('../models/adminModel');

// ===== LISTING PACKAGES =====

exports.getAllPackages = async (req, res) => {
    try {
        const packages = await Admin.getAllPackages();
        res.json(packages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tải danh sách gói tin' });
    }
};

exports.createPackage = async (req, res) => {
    try {
        const packageId = await Admin.createPackage(req.body);
        res.status(201).json({ message: 'Tạo gói tin thành công', packageId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tạo gói tin' });
    }
};

exports.updatePackage = async (req, res) => {
    try {
        await Admin.updatePackage(req.params.id, req.body);
        res.json({ message: 'Cập nhật gói tin thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật gói tin' });
    }
};

exports.togglePackageStatus = async (req, res) => {
    try {
        await Admin.togglePackageStatus(req.params.id);
        res.json({ message: 'Đã thay đổi trạng thái gói tin' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi thay đổi trạng thái' });
    }
};

exports.deletePackage = async (req, res) => {
    try {
        await Admin.deletePackage(req.params.id);
        res.json({ message: 'Xóa gói tin thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xóa gói tin' });
    }
};

// ===== PREMIUM SERVICES =====

exports.getAllPremiumServices = async (req, res) => {
    try {
        const services = await Admin.getAllPremiumServices();
        res.json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tải danh sách dịch vụ VIP' });
    }
};

exports.createPremiumService = async (req, res) => {
    try {
        const serviceId = await Admin.createPremiumService(req.body);
        res.status(201).json({ message: 'Tạo dịch vụ VIP thành công', serviceId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tạo dịch vụ VIP' });
    }
};

exports.updatePremiumService = async (req, res) => {
    try {
        await Admin.updatePremiumService(req.params.id, req.body);
        res.json({ message: 'Cập nhật dịch vụ VIP thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi cập nhật dịch vụ VIP' });
    }
};

exports.toggleServiceStatus = async (req, res) => {
    try {
        await Admin.toggleServiceStatus(req.params.id);
        res.json({ message: 'Đã thay đổi trạng thái dịch vụ VIP' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi thay đổi trạng thái' });
    }
};

exports.deleteService = async (req, res) => {
    try {
        await Admin.deleteService(req.params.id);
        res.json({ message: 'Xóa dịch vụ VIP thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xóa dịch vụ VIP' });
    }
};
