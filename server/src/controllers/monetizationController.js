const Monetization = require('../models/monetizationModel');

exports.getPackages = async (req, res) => {
    try {
        const packages = await Monetization.getAllPackages();
        res.json(packages);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tải danh sách gói tin' });
    }
};

exports.getPremiumServices = async (req, res) => {
    try {
        const services = await Monetization.getAllPremiumServices();
        res.json(services);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tải danh sách dịch vụ VIP' });
    }
};

exports.getWalletInfo = async (req, res) => {
    try {
        const balance = await Monetization.getWalletBalance(req.user.userId);
        const history = await Monetization.getPaymentHistory(req.user.userId);
        res.json({ balance, history });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi tải thông tin ví' });
    }
};

exports.processPayment = async (req, res) => {
    try {
        const { listingId, paymentType, referenceId, amount, paymentMethod } = req.body;
        const userId = req.user.userId;

        // Simulated payment processing
        console.log(`Processing simulated payment for user ${userId}, type: ${paymentType}`);

        let status = 'completed'; // For simulation, always complete
        let transactionRef = `SIM-${Date.now()}`;

        // Create payment record
        const paymentId = await Monetization.createPayment({
            userId,
            listingId,
            amount,
            paymentMethod,
            paymentType,
            referenceId,
            transactionRef,
            status
        });

        // If payment type is package, update listing expiration
        if (paymentType === 'package') {
            const pkg = await Monetization.getPackageById(referenceId);
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + pkg.duration_days);
            await Monetization.applyPackageToListing(listingId, referenceId, expiresAt);
        }

        // If payment type is premium_service, update listing premium status
        if (paymentType === 'premium_service') {
            const premiumUntil = new Date();
            premiumUntil.setDate(premiumUntil.getDate() + 7); // Default 7 days for now
            await Monetization.applyPremiumServiceToListing(listingId, referenceId, premiumUntil);
        }

        // If payment type is wallet_topup, update balance (ADD amount)
        if (paymentType === 'wallet_topup') {
            await Monetization.updateWalletBalance(userId, amount);
        }
        // If paying via wallet (for packages/services), deduct balance
        else if (paymentMethod === 'wallet') {
            // Verify balance on server side
            const currentBalance = await Monetization.getWalletBalance(userId);
            if (currentBalance < amount) {
                return res.status(400).json({ message: 'Số dư trong ví không đủ để thực hiện giao dịch' });
            }
            // Deduct amount
            await Monetization.updateWalletBalance(userId, -amount);
        }

        res.json({
            message: 'Thanh toán thành công',
            paymentId,
            transactionRef
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi xử lý thanh toán' });
    }
};
