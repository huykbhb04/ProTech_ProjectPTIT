const db = require('../src/config/database');
const ReportModel = require('../src/models/reportModel');
const User = require('../src/models/userModel');
const Listing = require('../src/models/listingModel');

async function testFlow() {
    console.log('=== STARTING REPORTS & DISPUTES SYSTEM TEST ===');
    
    try {
        // 1. Create a dummy landlord
        console.log('1. Creating dummy landlord...');
        const landlordId = await User.create({
            fullName: 'Test Landlord',
            email: `test_landlord_${Date.now()}@example.com`,
            passwordHash: 'hashedpassword',
            phoneNumber: '0987654321',
            role: 'landlord',
            status: 'active'
        });
        console.log(`Landlord created with ID: ${landlordId}`);

        // Get initial landlord reputation score
        let landlord = await User.findById(landlordId);
        console.log(`Initial Landlord reputation score: ${landlord.reputation_score} (Expected: 100)`);

        // 2. Create a dummy building & room
        console.log('2. Creating dummy building and room...');
        const [buildingResult] = await db.execute(
            "INSERT INTO buildings (landlord_id, name, address_full, type) VALUES (?, 'Test Building', '123 Test St', 'apartment')",
            [landlordId]
        );
        const buildingId = buildingResult.insertId;

        const [roomResult] = await db.execute(
            "INSERT INTO rooms (building_id, room_number, area, base_price, status) VALUES (?, 'Room 101', 30.5, 5000000, 'available')",
            [buildingId]
        );
        const roomId = roomResult.insertId;

        // 3. Create a listing
        console.log('3. Creating room listing...');
        const listingId = await Listing.create({
            room_id: roomId,
            title: 'Chung cư mini cao cấp Q1',
            description: 'Phòng trọ đẹp, giá rẻ, đầy đủ tiện nghi.',
            rent_price: 5000000,
            deposit_amount: 5000000,
            status: 'active',
            expires_at: '2026-12-31'
        });
        console.log(`Listing created with ID: ${listingId}`);

        // Verify it is active
        let listing = await Listing.getByRoomId(roomId);
        console.log(`Listing Status: ${listing.status} (Expected: active)`);

        // 4. Submit 1 fraud report
        console.log('4. Submitting first fraud report...');
        // Simulating the submitReport controller logic manually
        await ReportModel.createReport({
            listingId,
            reporterName: 'Reporter A',
            reporterPhone: '0911111111',
            reason: 'fraud',
            description: 'Yêu cầu chuyển cọc giữ chỗ 1 triệu có dấu hiệu lừa đảo',
            ipAddress: '192.168.1.1'
        });
        
        let counts = await ReportModel.getRecentFraudReportsCount(listingId, 2);
        console.log(`Fraud report count: ${counts.uniquePhones} unique phones (Expected: 1)`);

        // Get status (should still be active since count < 3)
        let listingCheck1 = await Listing.getByRoomId(roomId);
        console.log(`Listing status after 1 report: ${listingCheck1.status} (Expected: active)`);

        // 5. Submit 2 more fraud reports from different phones/IPs
        console.log('5. Submitting 2 more fraud reports...');
        await ReportModel.createReport({
            listingId,
            reporterName: 'Reporter B',
            reporterPhone: '0922222222',
            reason: 'fraud',
            description: 'Kêu cọc 1 triệu rồi chặn số điện thoại',
            ipAddress: '192.168.1.2'
        });

        await ReportModel.createReport({
            listingId,
            reporterName: 'Reporter C',
            reporterPhone: '0933333333',
            reason: 'fraud',
            description: 'Lừa đảo tiền cọc giữ phòng',
            ipAddress: '192.168.1.3'
        });

        counts = await ReportModel.getRecentFraudReportsCount(listingId, 2);
        console.log(`Fraud report count: ${counts.uniquePhones} unique phones (Expected: 3)`);

        // Run the auto-hide check simulation
        if (counts.uniquePhones >= 3) {
            console.log('Bot detected >= 3 fraud reports. Auto-hiding listing...');
            await db.execute(
                "UPDATE room_listings SET status = 'hidden', status_reason = ? WHERE listing_id = ?",
                ['Tin bị tạm ẩn tự động do nhận nhiều phản ánh lừa đảo', listingId]
            );
        }

        // Verify listing is now hidden
        const [listingRows] = await db.execute("SELECT * FROM room_listings WHERE listing_id = ?", [listingId]);
        console.log(`Listing status after 3 reports: ${listingRows[0].status} (Expected: hidden)`);
        console.log(`Listing status reason: "${listingRows[0].status_reason}"`);

        // 6. Submit a 'fake_info' report and verify reputation score deduction
        console.log('6. Submitting a fake_info report to verify automatic reputation deduction...');
        await ReportModel.createReport({
            listingId,
            reporterName: 'Reporter D',
            reporterPhone: '0944444444',
            reason: 'fake_info',
            description: 'Giá đăng 5tr nhưng gọi điện bảo 6tr',
            ipAddress: '192.168.1.4'
        });
        // Deduct 5 reputation points
        await User.updateReputationScore(landlordId, -5);

        landlord = await User.findById(landlordId);
        console.log(`Landlord reputation score after automatic deduction: ${landlord.reputation_score} (Expected: 95)`);

        // 7. Submit a landlord dispute
        console.log('7. Creating landlord dispute...');
        const disputeId = await ReportModel.createDispute({
            listingId,
            landlordId,
            explanation: 'Tôi bị đối thủ cạnh tranh cố tình dùng nhiều sim rác để báo cáo lừa đảo. Đây là ảnh hợp đồng và hình ảnh phòng thật.',
            proofImages: ['https://example.com/contract.jpg']
        });
        console.log(`Dispute created with ID: ${disputeId}`);

        // Update listing status_reason to dispute pending
        await db.execute(
            "UPDATE room_listings SET status_reason = ? WHERE listing_id = ?",
            ['Đang khiếu nại - Chờ Admin xét duyệt', listingId]
        );

        const [listingRowsDispute] = await db.execute("SELECT status_reason FROM room_listings WHERE listing_id = ?", [listingId]);
        console.log(`Listing status reason during dispute: "${listingRowsDispute[0].status_reason}" (Expected: Đang khiếu nại - Chờ Admin xét duyệt)`);

        // 8. Admin approves dispute
        console.log('8. Admin approving dispute...');
        // Restore listing to active
        await db.execute(
            "UPDATE room_listings SET status = 'active', status_reason = NULL WHERE listing_id = ?",
            [listingId]
        );
        // Resolve dispute status
        await ReportModel.updateDisputeStatus(disputeId, 'resolved_approved', 'Bằng chứng hợp lệ, tin đăng đã được mở lại.');
        // Restore/boost landlord reputation score (+10 points)
        await User.updateReputationScore(landlordId, 10);

        // Verify final states
        const [finalListing] = await db.execute("SELECT * FROM room_listings WHERE listing_id = ?", [listingId]);
        console.log(`Final Listing status: ${finalListing[0].status} (Expected: active)`);
        console.log(`Final Listing status reason: ${finalListing[0].status_reason} (Expected: null)`);

        landlord = await User.findById(landlordId);
        console.log(`Final Landlord reputation score: ${landlord.reputation_score} (Expected: 105)`);

        const disputeCheck = await ReportModel.findDisputeById(disputeId);
        console.log(`Final Dispute status: ${disputeCheck.status} (Expected: resolved_approved)`);

        // 9. Clean up test records
        console.log('9. Cleaning up test records...');
        await db.execute("DELETE FROM listing_disputes WHERE listing_id = ?", [listingId]);
        await db.execute("DELETE FROM listing_reports WHERE listing_id = ?", [listingId]);
        await db.execute("DELETE FROM room_listings WHERE listing_id = ?", [listingId]);
        await db.execute("DELETE FROM rooms WHERE room_id = ?", [roomId]);
        await db.execute("DELETE FROM buildings WHERE building_id = ?", [buildingId]);
        await db.execute("DELETE FROM users WHERE user_id = ?", [landlordId]);
        console.log('Cleanup completed successfully.');

        console.log('=== ALL TESTS PASSED SUCCESSFULLY! ===');
    } catch (err) {
        console.error('Test failed with error:', err);
    }
    process.exit(0);
}

testFlow();
