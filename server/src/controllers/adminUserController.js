const User = require('../models/userModel');
const bcrypt = require('bcrypt');

// @desc    Get all users (advanced filtering)
// @route   GET /api/admin/users
// @access  Admin
exports.getAllUsers = async (req, res) => {
    try {
        const filters = {
            role: req.query.role,
            status: req.query.status,
            is_verified: req.query.is_verified === 'true' ? 1 : req.query.is_verified === 'false' ? 0 : undefined,
            search: req.query.search
        };

        const users = await User.getAllUsers(filters);
        
        // Remove password hashes of all users
        const sterilizedUsers = users.map(user => {
            const { password_hash, ...u } = user;
            return u;
        });

        res.json(sterilizedUsers);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tải danh sách người dùng' });
    }
};

// @desc    Admin create new user
// @route   POST /api/admin/users
// @access  Admin
exports.createUser = async (req, res) => {
    try {
        const { fullName, email, password, phoneNumber, role, status } = req.body;

        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã tồn tại' });
        }

        // Hash password
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Create user
        const userId = await User.create({
            fullName,
            email,
            passwordHash,
            phoneNumber,
            role,
            status: status || 'active'
        });

        res.status(201).json({ message: 'Tạo người dùng thành công', userId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi tạo người dùng' });
    }
};

// @desc    Admin update user details
// @route   PUT /api/admin/users/:id
// @access  Admin
exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const data = req.body;

        const success = await User.adminUpdateUser(userId, data);
        if (success) {
            res.json({ message: 'Cập nhật thông tin thành công' });
        } else {
            res.status(400).json({ message: 'Không có thay đổi hoặc cập nhật thất bại' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi cập nhật người dùng' });
    }
};

// @desc    Toggle user status (Active/Blocked)
// @route   PATCH /api/admin/users/:id/status
// @access  Admin
exports.updateUserStatus = async (req, res) => {
    try {
        const userId = req.params.id;
        const { status } = req.body;

        if (!['active', 'blocked'].includes(status)) {
            return res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        }

        const success = await User.updateStatus(userId, status);
        if (success) {
            res.json({ message: `Đã cập nhật trạng thái người dùng thành ${status}` });
        } else {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái' });
    }
};

// @desc    Permanently delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const success = await User.deleteUser(userId);
        if (success) {
            res.json({ message: 'Đã xóa người dùng vĩnh viễn' });
        } else {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi khi xóa người dùng' });
    }
};
