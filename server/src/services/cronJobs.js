const cron = require('node-cron');
const Bill = require('../models/billModel');
const Notification = require('../models/notificationModel');

class CronJobs {
    static init() {
        console.log('🕐 Initializing Cron Jobs for Billing System...');

        // 1. Send meter reading reminders (25th of every month at 9:00 AM)
        cron.schedule('0 9 25 * *', async () => {
            console.log('📸 Running: Send meter reading reminders');
            await this.sendMeterReadingReminders();
        }, {
            timezone: 'Asia/Ho_Chi_Minh'
        });

        // 2. Check and update overdue bills (Every day at 6:00 AM)
        cron.schedule('0 6 * * *', async () => {
            console.log('⏰ Running: Check overdue bills');
            await this.checkOverdueBills();
        }, {
            timezone: 'Asia/Ho_Chi_Minh'
        });

        // 3. Auto-generate bills for new month (1st of every month at 00:01 AM)
        cron.schedule('1 0 1 * *', async () => {
            console.log('📊 Running: Auto-generate bills for new month');
            await this.autoGenerateBills();
        }, {
            timezone: 'Asia/Ho_Chi_Minh'
        });

        // 4. Send payment reminders (7th of every month at 10:00 AM)
        cron.schedule('0 10 7 * *', async () => {
            console.log('💰 Running: Send payment reminders');
            await this.sendPaymentReminders();
        }, {
            timezone: 'Asia/Ho_Chi_Minh'
        });

        console.log('✅ Cron Jobs initialized successfully');
        console.log('   - Meter reading reminders: 25th @ 9:00 AM');
        console.log('   - Overdue check: Daily @ 6:00 AM');
        console.log('   - Auto bill generation: 1st @ 00:01 AM');
        console.log('   - Payment reminders: 7th @ 10:00 AM');
    }

    static async sendMeterReadingReminders() {
        try {
            const db = require('../config/database');

            // Get all active contracts
            const [contracts] = await db.execute(`
                SELECT c.contract_id, c.tenant_id, r.room_number, r.room_id
                FROM contracts c
                JOIN rooms r ON c.room_id = r.room_id
                WHERE c.status = 'active'
            `);

            console.log(`Found ${contracts.length} active contracts for meter reading reminders`);

            for (const contract of contracts) {
                // Send notification
                await Notification.create(
                    contract.tenant_id,
                    'Nhắc nhở chốt số điện nước',
                    `📸 Đã đến kỳ chốt số điện nước phòng ${contract.room_number}! Vui lòng chụp ảnh đồng hồ để tạo hóa đơn tháng này.`,
                    'billing'
                );

                // Log to bill_notifications table
                await db.execute(`
                    INSERT INTO bill_notifications (room_id, billing_month, notification_type, sent_to)
                    VALUES (?, CURDATE(), 'meter_reading_request', ?)
                `, [contract.room_id, contract.tenant_id]);
            }

            console.log(`✅ Sent ${contracts.length} meter reading reminders`);
        } catch (error) {
            console.error('❌ Error sending meter reading reminders:', error);
        }
    }

    static async checkOverdueBills() {
        try {
            const count = await Bill.checkOverdueBills();
            console.log(`✅ Updated ${count} overdue bills`);

            if (count > 0) {
                // Get overdue bills to send notifications
                const db = require('../config/database');
                const [overdueBills] = await db.execute(`
                    SELECT b.bill_id, b.billing_month, b.total_amount, b.due_date,
                           c.tenant_id, r.room_number
                    FROM bills b
                    JOIN contracts c ON b.contract_id = c.contract_id
                    JOIN rooms r ON b.room_id = r.room_id
                    WHERE b.status = 'overdue'
                      AND b.due_date = CURDATE() - INTERVAL 1 DAY
                `);

                for (const bill of overdueBills) {
                    const daysOverdue = Math.floor((new Date() - new Date(bill.due_date)) / (1000 * 60 * 60 * 24));

                    await Notification.create(
                        bill.tenant_id,
                        'Hóa đơn quá hạn!',
                        `⚠️ Hóa đơn phòng ${bill.room_number} tháng ${new Date(bill.billing_month).toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' })} đã quá hạn ${daysOverdue} ngày. Vui lòng thanh toán sớm.`,
                        'billing'
                    );
                }
            }
        } catch (error) {
            console.error('❌ Error checking overdue bills:', error);
        }
    }

    static async autoGenerateBills() {
        try {
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1; // Current month

            console.log(`Generating bills for ${year}-${String(month).padStart(2, '0')}`);

            const count = await Bill.autoGenerateBillsForMonth(year, month);
            console.log(`✅ Auto-generated ${count} bills for new month`);
        } catch (error) {
            console.error('❌ Error auto-generating bills:', error);
        }
    }

    static async sendPaymentReminders() {
        try {
            const db = require('../config/database');

            // Get unpaid bills for current month
            const [bills] = await db.execute(`
                SELECT b.bill_id, b.billing_month, b.total_amount, b.due_date,
                       c.tenant_id, r.room_number
                FROM bills b
                JOIN contracts c ON b.contract_id = c.contract_id
                JOIN rooms r ON b.room_id = r.room_id
                WHERE b.status IN ('pending', 'confirmed')
                  AND MONTH(b.billing_month) = MONTH(CURDATE())
                  AND YEAR(b.billing_month) = YEAR(CURDATE())
            `);

            console.log(`Found ${bills.length} unpaid bills for payment reminders`);

            for (const bill of bills) {
                const daysUntilDue = Math.floor((new Date(bill.due_date) - new Date()) / (1000 * 60 * 60 * 24));

                if (daysUntilDue >= 0 && daysUntilDue <= 3) {
                    await Notification.create(
                        bill.tenant_id,
                        'Nhắc nhở thanh toán',
                        `⏰ Hóa đơn phòng ${bill.room_number} sẽ đến hạn vào ${new Date(bill.due_date).toLocaleDateString('vi-VN')} (còn ${daysUntilDue} ngày). Tổng tiền: ${bill.total_amount.toLocaleString('vi-VN')} VNĐ`,
                        'billing'
                    );
                }
            }

            console.log(`✅ Sent ${bills.length} payment reminders`);
        } catch (error) {
            console.error('❌ Error sending payment reminders:', error);
        }
    }
}

module.exports = CronJobs;
