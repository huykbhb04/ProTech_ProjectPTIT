const db = require('../config/database');

class Contract {
    static async createFromBooking(booking, contractData) {
        const { tenant_id, room_id, landlord_id, booking_id } = booking;
        const { start_date, end_date, deposit_amount, monthly_price, contract_content } = contractData;

        const query = `
            INSERT INTO contracts (booking_id, tenant_id, room_id, start_date, end_date, deposit_amount, monthly_price, contract_content, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'draft')
        `;
        const [result] = await db.execute(query, [
            booking_id, tenant_id, room_id,
            start_date, end_date, deposit_amount, monthly_price,
            JSON.stringify(contract_content)
        ]);
        return result.insertId;
    }

    static async getById(contractId) {
        const query = `
            SELECT c.contract_id, c.booking_id, c.tenant_id, c.room_id, c.start_date, c.end_date,
                   c.deposit_amount, c.monthly_price, c.contract_content,
                   c.tenant_cccd_front_url, c.tenant_cccd_back_url,
                   c.landlord_cccd_front_url, c.landlord_cccd_back_url,
                   c.tenant_full_name, c.tenant_id_number, c.tenant_dob, c.tenant_address,
                   c.tenant_signed_at, c.landlord_signed_at,
                   c.terms_accepted, c.handover_electricity_index, c.handover_water_index,
                   c.handover_date, c.service_commitments, c.additional_services,
                   CASE
                       WHEN c.tenant_signed_at IS NOT NULL AND c.status = 'draft' THEN 'signed_by_tenant'
                       ELSE c.status
                   END AS status,
                   b.landlord_id, r.room_number, b.name as building_name, b.address_full as building_address,
                   ut.full_name as tenant_name, ut.phone_number as tenant_phone, ut.email as tenant_email,
                   ul.full_name as landlord_name, ul.phone_number as landlord_phone, ul.email as landlord_email
            FROM contracts c
            JOIN rooms r ON c.room_id = r.room_id
            JOIN buildings b ON r.building_id = b.building_id
            JOIN users ut ON c.tenant_id = ut.user_id
            JOIN users ul ON b.landlord_id = ul.user_id
            WHERE c.contract_id = ?
        `;
        const [rows] = await db.execute(query, [contractId]);
        return rows[0];
    }

    static async getByBookingId(bookingId) {
        const query = `SELECT * FROM contracts WHERE booking_id = ?`;
        const [rows] = await db.execute(query, [bookingId]);
        return rows[0];
    }

    static async saveTenantCCCD(contractId, frontUrl, backUrl) {
        const query = `
            UPDATE contracts 
            SET tenant_cccd_front_url = ?, tenant_cccd_back_url = ?
            WHERE contract_id = ?
        `;
        const [result] = await db.execute(query, [frontUrl, backUrl, contractId]);
        return result.affectedRows > 0;
    }

    static async updateTenantPersonalInfo(contractId, personalData) {
        const { full_name, id_number, dob, address } = personalData;
        const query = `
            UPDATE contracts 
            SET tenant_full_name = ?, tenant_id_number = ?, tenant_dob = ?, tenant_address = ?
            WHERE contract_id = ?
        `;
        const [result] = await db.execute(query, [full_name, id_number, dob, address, contractId]);
        return result.affectedRows > 0;
    }

    static async validateContractReadyToSign(contractId) {
        const query = `
            SELECT tenant_cccd_front_url, tenant_cccd_back_url, 
                   tenant_full_name, tenant_id_number, tenant_dob, tenant_address
            FROM contracts WHERE contract_id = ?
        `;
        const [rows] = await db.execute(query, [contractId]);
        if (!rows.length) return { ready: false, missing: ['Contract not found'] };

        const contract = rows[0];
        const missing = [];

        // Chỉ yêu cầu thông tin cá nhân tối thiểu (ảnh CCCD là tùy chọn)
        if (!contract.tenant_full_name) missing.push('Họ và tên');
        if (!contract.tenant_id_number) missing.push('Số CCCD');

        return { ready: missing.length === 0, missing };
    }

    static async getContractsByLandlord(landlordId) {
        const query = `
            SELECT c.contract_id, c.booking_id, c.tenant_id, c.room_id, c.start_date, c.end_date,
                   c.deposit_amount, c.monthly_price, c.tenant_signed_at, c.landlord_signed_at,
                   c.tenant_cccd_front_url, c.tenant_cccd_back_url,
                   c.landlord_cccd_front_url, c.landlord_cccd_back_url,
                   c.tenant_full_name, c.tenant_id_number, c.tenant_dob, c.tenant_address,
                   c.handover_electricity_index, c.handover_water_index, c.handover_date,
                   CASE
                       WHEN c.tenant_signed_at IS NOT NULL AND c.status = 'draft' THEN 'signed_by_tenant'
                       ELSE c.status
                   END AS status,
                   r.room_number, b.name as building_name,
                   ut.full_name as tenant_name, ut.email as tenant_email
            FROM contracts c
            JOIN rooms r ON c.room_id = r.room_id
            JOIN buildings b ON r.building_id = b.building_id
            JOIN users ut ON c.tenant_id = ut.user_id
            WHERE b.landlord_id = ?
            ORDER BY c.contract_id DESC
        `;
        const [rows] = await db.execute(query, [landlordId]);
        return rows;
    }

    static async updateContractTerms(contractId, terms) {
        // Get current contract to check status
        const [contracts] = await db.execute('SELECT status FROM contracts WHERE contract_id = ?', [contractId]);
        if (!contracts.length) throw new Error('Contract not found');
        if (contracts[0].status !== 'draft') {
            throw new Error('Cannot edit terms after tenant has signed');
        }

        const query = `
            UPDATE contracts 
            SET contract_content = JSON_SET(contract_content, '$.terms', CAST(? AS JSON))
            WHERE contract_id = ?
        `;
        const [result] = await db.execute(query, [JSON.stringify(terms), contractId]);
        return result.affectedRows > 0;
    }

    static async saveLandlordCCCD(contractId, frontUrl, backUrl) {
        const query = `
            UPDATE contracts 
            SET landlord_cccd_front_url = ?, landlord_cccd_back_url = ?
            WHERE contract_id = ?
        `;
        const [result] = await db.execute(query, [frontUrl, backUrl, contractId]);
        return result.affectedRows > 0;
    }

    static async saveHandoverInfo(contractId, handoverData) {
        const {
            electricity_index,
            water_index,
            service_commitments,
            additional_services
        } = handoverData;

        const query = `
            UPDATE contracts 
            SET handover_electricity_index = ?,
                handover_water_index = ?,
                handover_date = NOW(),
                service_commitments = ?,
                additional_services = ?
            WHERE contract_id = ?
        `;

        const [result] = await db.execute(query, [
            electricity_index,
            water_index,
            JSON.stringify(service_commitments),
            JSON.stringify(additional_services),
            contractId
        ]);

        return result.affectedRows > 0;
    }

    static async getRoomAssets(roomId) {
        const query = `
            SELECT asset_id, item_name, condition_status, image_evidence_url, last_check_date
            FROM room_assets
            WHERE room_id = ?
            ORDER BY item_name
        `;
        const [rows] = await db.execute(query, [roomId]);
        return rows;
    }

    static async getUtilityConfigs(landlordId) {
        const query = `
            SELECT config_id, type, name, price, from_index, to_index
            FROM utility_configs
            WHERE landlord_id = ?
            ORDER BY type, from_index
        `;
        const [rows] = await db.execute(query, [landlordId]);
        return rows;
    }

    static async tenantSign(contractId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            
            await connection.execute(
                "UPDATE contracts SET status = 'signed_by_tenant', tenant_signed_at = NOW(), terms_accepted = TRUE WHERE contract_id = ?",
                [contractId]
            );

            const [contract] = await connection.execute('SELECT booking_id FROM contracts WHERE contract_id = ?', [contractId]);
            if (contract.length && contract[0].booking_id) {
                await connection.execute("UPDATE bookings SET status = 'confirmed' WHERE booking_id = ?", [contract[0].booking_id]);
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async landlordSign(contractId) {
        // When landlord signs, contract becomes active and room status updates
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [contract] = await connection.execute(
                `SELECT c.room_id, c.handover_electricity_index, c.handover_water_index, r.room_number
                 FROM contracts c
                 JOIN rooms r ON c.room_id = r.room_id
                 WHERE c.contract_id = ?`,
                [contractId]
            );
            if (!contract.length) throw new Error('Contract not found');

            const roomId = contract[0].room_id;
            const electricityIndex = contract[0].handover_electricity_index;
            const waterIndex = contract[0].handover_water_index;

            if (!electricityIndex || !waterIndex) {
                throw new Error('Vui lòng hoàn tất thông tin bàn giao trước khi ký hợp đồng');
            }

            await connection.execute(
                "UPDATE contracts SET status = 'active', landlord_signed_at = NOW() WHERE contract_id = ?",
                [contractId]
            );

            const [bookingInfo] = await connection.execute(
                `SELECT b.booking_id, b.type, b.deposit_amount, b.status, bl.landlord_id 
                 FROM contracts c 
                 JOIN bookings b ON c.booking_id = b.booking_id 
                 JOIN rooms r ON b.room_id = r.room_id
                 JOIN buildings bl ON r.building_id = bl.building_id
                 WHERE c.contract_id = ?`,
                [contractId]
            );

            if (bookingInfo.length) {
                const b = bookingInfo[0];
                await connection.execute("UPDATE bookings SET status = 'renting' WHERE booking_id = ?", [b.booking_id]);

                if (b.type === 'reservation' && b.status === 'deposited') {
                    await connection.execute(
                        "UPDATE users SET wallet_balance = wallet_balance + ? WHERE user_id = ?",
                        [b.deposit_amount, b.landlord_id]
                    );

                    await connection.execute(
                        `INSERT INTO transactions (user_id, amount, type, reference_id, description, status) 
                         VALUES (?, ?, 'deposit_receive', ?, ?, 'completed')`,
                        [b.landlord_id, b.deposit_amount, b.booking_id, `Nhận tiền cọc giữ chỗ phòng ${contract[0].room_number}`, 'completed']
                    );
                }
            }

            await connection.execute(
                "UPDATE rooms SET status = 'occupied' WHERE room_id = ?",
                [roomId]
            );

            const [assets] = await connection.execute(
                'SELECT item_name, condition_status, image_evidence_url FROM room_assets WHERE room_id = ?',
                [roomId]
            );

            await connection.execute(
                `INSERT INTO check_in_out_logs (contract_id, type, asset_snapshot, is_confirmed) 
                 VALUES (?, 'check_in', ?, TRUE)`,
                [contractId, JSON.stringify(assets)]
            );

            const today = new Date().toISOString().split('T')[0];
            await connection.execute(
                `INSERT INTO service_readings (room_id, record_date, service_type, old_index, new_index, source) 
                 VALUES (?, ?, 'electricity', 0, ?, 'manual')`,
                [roomId, today, electricityIndex]
            );
            await connection.execute(
                `INSERT INTO service_readings (room_id, record_date, service_type, old_index, new_index, source) 
                 VALUES (?, ?, 'water', 0, ?, 'manual')`,
                [roomId, today, waterIndex]
            );

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async landlordReject(contractId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [contracts] = await connection.execute(
                'SELECT contract_id, booking_id, tenant_id, status FROM contracts WHERE contract_id = ?',
                [contractId]
            );
            if (!contracts.length) throw new Error('Contract not found');
            if (contracts[0].status !== 'signed_by_tenant') throw new Error('Only pending contracts can be rejected');

            await connection.execute(
                "UPDATE contracts SET status = 'cancelled' WHERE contract_id = ?",
                [contractId]
            );

            if (contracts[0].booking_id) {
                await connection.execute(
                    "UPDATE bookings SET status = 'cancelled' WHERE booking_id = ?",
                    [contracts[0].booking_id]
                );
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }

    static async landlordCancel(contractId) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();

            const [contracts] = await connection.execute(
                'SELECT contract_id, booking_id, status FROM contracts WHERE contract_id = ?',
                [contractId]
            );
            if (!contracts.length) throw new Error('Contract not found');
            if (contracts[0].status !== 'active') throw new Error('Only active contracts can be cancelled');

            await connection.execute(
                "UPDATE contracts SET status = 'terminated' WHERE contract_id = ?",
                [contractId]
            );

            if (contracts[0].booking_id) {
                await connection.execute(
                    "UPDATE bookings SET status = 'terminated' WHERE booking_id = ?",
                    [contracts[0].booking_id]
                );
            }

            await connection.commit();
            return true;
        } catch (error) {
            await connection.rollback();
            throw error;
        } finally {
            connection.release();
        }
    }
}

module.exports = Contract;
