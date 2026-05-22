const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require('axios');
const nodemailer = require('nodemailer');

const OTP_TTL_MS = Number(process.env.EMAIL_OTP_TTL_MS || 10 * 60 * 1000);
const OTP_STORE = global.__EMAIL_OTP_STORE__ || new Map();
global.__EMAIL_OTP_STORE__ = OTP_STORE;

const createTransporter = () => {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const host = process.env.SMTP_HOST || (user?.includes('@gmail.com') ? 'smtp.gmail.com' : null);
    const port = Number(process.env.SMTP_PORT || (user?.includes('@gmail.com') ? 465 : 587));

    if (!host || !user || !pass) return null;

    return nodemailer.createTransport({
        host,
        port,
        secure: String(process.env.SMTP_SECURE || (port === 465 ? 'true' : 'false')) === 'true',
        auth: { user, pass },
    });
};

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const hashOtp = (otp) => crypto.createHash('sha256').update(String(otp)).digest('hex');
const createJwt = (user) => jwt.sign(
    { userId: user.user_id, user_id: user.user_id, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '1d' }
);

const sendOtpEmail = async (email, otp) => {
    const transporter = createTransporter();
    const subject = 'Mã xác thực đăng ký tài khoản';
    const html = `<div style="font-family:Arial,sans-serif;line-height:1.6"><h2>Mã xác thực của bạn</h2><p>Nhập mã sau để hoàn tất đăng ký:</p><div style="font-size:28px;font-weight:bold;letter-spacing:8px">${otp}</div><p>Mã có hiệu lực trong ${Math.round(OTP_TTL_MS / 60000)} phút.</p></div>`;

    if (!transporter) {
        console.log(`[OTP] ${email}: ${otp}`);
        return { mode: 'console' };
    }

    try {
        await transporter.sendMail({
            from: process.env.SMTP_FROM || process.env.SMTP_USER,
            to: email,
            subject,
            html,
        });
        return { mode: 'smtp' };
    } catch (error) {
        console.error('OTP send failed, falling back to console debug:', error.message);
        console.log(`[OTP] ${email}: ${otp}`);
        return { mode: 'fallback', error: error.message };
    }
};

const isGmailAddress = (email) => /@gmail\.com$/i.test(String(email || ''));
const emailCanReceiveOtp = async (email) => {
    if (!isGmailAddress(email)) return true;
    return true;
};

exports.sendRegisterOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: 'Email là bắt buộc' });

        const existingUser = await User.findByEmail(email);
        if (existingUser) return res.status(400).json({ message: 'Email đã được sử dụng' });

        if (!(await emailCanReceiveOtp(email))) {
            return res.status(400).json({ message: 'Không thể gửi mã xác thực đến email này' });
        }

        const otp = generateOtp();
        OTP_STORE.set(email.toLowerCase(), { hash: hashOtp(otp), expiresAt: Date.now() + OTP_TTL_MS });
        const sendResult = await sendOtpEmail(email, otp);

        const responsePayload = { message: 'Đã gửi mã xác thực tới email', channel: sendResult?.mode || 'smtp' };
        if (process.env.NODE_ENV !== 'production' || String(process.env.DEBUG_OTP || 'false') === 'true') {
            responsePayload.debugOtp = otp;
        }

        res.json(responsePayload);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Không thể gửi mã xác thực' });
    }
};

exports.register = async (req, res) => {
    try {
        const { fullName, email, password, phoneNumber, role, identityCardNumber, otp } = req.body;
        const otpKey = String(email || '').toLowerCase();
        const storedOtp = OTP_STORE.get(otpKey);

        if (!storedOtp) {
            return res.status(400).json({ message: 'Vui lòng yêu cầu mã xác thực trước khi đăng ký' });
        }

        if (storedOtp.expiresAt < Date.now()) {
            OTP_STORE.delete(otpKey);
            return res.status(400).json({ message: 'Mã xác thực đã hết hạn' });
        }

        if (storedOtp.hash !== hashOtp(otp)) {
            return res.status(400).json({ message: 'Mã xác thực không đúng' });
        }

        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        const userId = await User.create({
            fullName,
            email,
            passwordHash,
            phoneNumber,
            role,
            identityCardNumber,
            status: 'active',
        });

        OTP_STORE.delete(otpKey);
        const user = await User.findById(userId);
        const token = createJwt(user);

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user.user_id,
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                avatar: user.avatar_url,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during registration' });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findByEmail(email);
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
        if (user.status === 'blocked') return res.status(403).json({ message: 'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.' });

        const token = createJwt(user);
        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.user_id,
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                avatar: user.avatar_url,
            },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error during login' });
    }
};

const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5173/login';

exports.googleAuthStart = async (req, res) => {
    try {
        if (!process.env.GOOGLE_CLIENT_ID) {
            return res.status(400).json({
                message: 'Chưa cấu hình GOOGLE_CLIENT_ID trong server/.env',
                configured: false,
            });
        }

        const params = new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID,
            redirect_uri: GOOGLE_REDIRECT_URI,
            response_type: 'code',
            scope: 'openid email profile',
            access_type: 'offline',
            prompt: 'consent',
        });
        res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`, configured: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Không thể khởi tạo đăng nhập Google' });
    }
};

exports.googleAuthCallback = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).json({ message: 'Thiếu mã xác thực Google' });

        if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
            return res.status(500).json({ message: 'Thiếu cấu hình Google OAuth' });
        }

        const tokenRes = await axios.post('https://oauth2.googleapis.com/token', new URLSearchParams({
            code,
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: GOOGLE_REDIRECT_URI,
            grant_type: 'authorization_code',
        }).toString(), {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });

        const accessToken = tokenRes.data.access_token;
        const profileRes = await axios.get('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        const { email, name, id, picture } = profileRes.data;
        let user = await User.findByEmail(email);
        if (!user) {
            const userId = await User.create({
                fullName: name,
                email,
                passwordHash: bcrypt.hashSync(crypto.randomBytes(16).toString('hex'), 10),
                phoneNumber: null,
                role: 'guest',
                identityCardNumber: null,
                status: 'active',
            });
            user = await User.findById(userId);
        }

        const token = createJwt(user);
        res.json({
            token,
            user: {
                id: user.user_id,
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                avatar: picture || user.avatar_url,
                google_id: id,
            },
        });
    } catch (error) {
        console.error(error.response?.data || error);
        res.status(500).json({ message: 'Đăng nhập Google thất bại' });
    }
};
