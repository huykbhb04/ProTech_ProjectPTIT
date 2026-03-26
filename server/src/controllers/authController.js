const User = require('../models/userModel');
const bcrypt = require('bcrypt'); // Make sure to npm install bcrypt or bcryptjs
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    try {
        const { fullName, email, password, phoneNumber, role, identityCardNumber } = req.body;

        // Check if user exists
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
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
            identityCardNumber
        });

        res.status(201).json({ message: 'User registered successfully', userId });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`[DEBUG] Login attempt email: ${email}`);

        // Check user
        const user = await User.findByEmail(email);
        if (!user) {
            console.log(`[DEBUG] User NOT found for: ${email}`);
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.user_id, user_id: user.user_id, role: user.role, full_name: user.full_name },
            process.env.JWT_SECRET || 'secret',
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.user_id,
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                avatar: user.avatar_url
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};
