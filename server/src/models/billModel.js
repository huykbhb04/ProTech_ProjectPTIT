const db = require('../config/database');

class Bill {
    // ==================== CRUD Operations ====================

    static async create(billData) {
        const {
            contract_id,
            room_id,
            billing_month,
            electricity_old,
            water_old,
            room_rent,
            service_fees = {},
            due_date
        } = billData;

        const query = `
            INSERT INTO bills (
                contract_id, room_id, billing_month,
                electricity_old, water_old,
                room_rent, service_fees, due_date, total_amount
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.execute(query, [
            contract_id, room_id, billing_month,
            electricity_old, water_old,
            room_rent, JSON.stringify(service_fees), due_date,
            room_rent // Initial total = room rent
        ]);

        return result.insertId;
    }

    static async getById(billId) {
        const query = `
            SELECT b.*, 
                   r.room_number, bld.name as building_name,
                   c.tenant_id, c.monthly_price as contract_price,
                   u.full_name as tenant_name, u.email as tenant_email
            FROM bills b
            JOIN contracts c ON b.contract_id = c.contract_id
            JOIN rooms r ON b.room_id = r.room_id
            JOIN buildings bld ON r.building_id = bld.building_id
            JOIN users u ON c.tenant_id = u.user_id
            WHERE b.bill_id = ?
        `;
        const [rows] = await db.execute(query, [billId]);
        return rows[0];
    }

    static async getBillsByContract(contractId) {
        const query = `
            SELECT b.*, r.room_number
            FROM bills b
            JOIN rooms r ON b.room_id = r.room_id
            WHERE b.contract_id = ?
            ORDER BY b.billing_month DESC
        `;
        const [rows] = await db.execute(query, [contractId]);
        return rows;
    }

    static async getBillsByRoom(roomId, limit = 12) {
        const query = `
            SELECT b.*, c.tenant_id, u.full_name as tenant_name
            FROM bills b
            JOIN contracts c ON b.contract_id = c.contract_id
            JOIN users u ON c.tenant_id = u.user_id
            WHERE b.room_id = ?
            ORDER BY b.billing_month DESC
            LIMIT ?
        `;
        const [rows] = await db.execute(query, [roomId, limit]);
        return rows;
    }

    static async getTenantBills(tenantId) {
        const query = `
            SELECT b.*, r.room_number, bld.name as building_name
            FROM bills b
            JOIN contracts c ON b.contract_id = c.contract_id
            JOIN rooms r ON b.room_id = r.room_id
            JOIN buildings bld ON r.building_id = bld.building_id
            WHERE c.tenant_id = ?
            ORDER BY b.billing_month DESC
        `;
        const [rows] = await db.execute(query, [tenantId]);
        return rows;
    }

    static async getLandlordBills(landlordId, filters = {}) {
        let query = `
            SELECT b.*, r.room_number, bld.name as building_name,
                   u.full_name as tenant_name
            FROM bills b
            JOIN contracts c ON b.contract_id = c.contract_id
            JOIN rooms r ON b.room_id = r.room_id
            JOIN buildings bld ON r.building_id = bld.building_id
            JOIN users u ON c.tenant_id = u.user_id
            WHERE bld.landlord_id = ?
        `;

        const params = [landlordId];

        if (filters.status) {
            query += ' AND b.status = ?';
            params.push(filters.status);
        }

        if (filters.month) {
            query += ' AND b.billing_month = ?';
            params.push(filters.month);
        }

        query += ' ORDER BY b.billing_month DESC, b.created_at DESC';

        const [rows] = await db.execute(query, params);
        return rows;
    }

    // ==================== Meter Reading Updates ====================

    static async updateMeterReading(billId, type, newReading, imageUrl, confidence) {
        const bill = await this.getById(billId);
        if (!bill) throw new Error('Bill not found');

        const oldReading = type === 'electricity' ? bill.electricity_old : bill.water_old;

        // Validation
        if (newReading < oldReading) {
            throw new Error(`Số ${type === 'electricity' ? 'điện' : 'nước'} mới không thể nhỏ hơn số cũ`);
        }

        const consumption = newReading - oldReading;

        // Check abnormal consumption
        await this.checkAbnormalConsumption(bill.room_id, type, consumption);

        const field = type === 'electricity' ? 'electricity' : 'water';
        const query = `
            UPDATE bills
            SET ${field}_new = ?,
                ${field}_consumption = ?,
                ${field}_image_url = ?,
                ${field}_ocr_confidence = ?
            WHERE bill_id = ?
        `;

        await db.execute(query, [newReading, consumption, imageUrl, confidence, billId]);

        return { newReading, consumption };
    }

    static async checkAbnormalConsumption(roomId, type, consumption) {
        // Get average consumption of last 3 months
        const query = `
            SELECT AVG(${type}_consumption) as avg_consumption
            FROM bills
            WHERE room_id = ? 
              AND ${type}_consumption IS NOT NULL
              AND status != 'cancelled'
            ORDER BY billing_month DESC
            LIMIT 3
        `;

        const [rows] = await db.execute(query, [roomId]);
        const avgConsumption = rows[0]?.avg_consumption || 0;

        if (avgConsumption > 0 && consumption > avgConsumption * 3) {
            // Log warning - will be picked up by notification service
            console.warn(`⚠️ Abnormal consumption detected for room ${roomId}: ${consumption} vs avg ${avgConsumption}`);
        }
    }

    // ==================== Calculation Logic ====================

    static async calculateElectricityCost(consumption, billId) {
        // Get contract and utility config from it
        const query = `
            SELECT c.service_commitments, b.room_id, bld.landlord_id
            FROM bills b
            JOIN contracts c ON b.contract_id = c.contract_id
            JOIN rooms r ON b.room_id = r.room_id
            JOIN buildings bld ON r.building_id = bld.building_id
            WHERE b.bill_id = ?
        `;
        const [rows] = await db.execute(query, [billId]);
        if (rows.length === 0) return 0;

        const { service_commitments, landlord_id } = rows[0];
        const commitments = typeof service_commitments === 'string' ? JSON.parse(service_commitments) : service_commitments || {};

        let price = null;
        if (commitments.electricity && commitments.electricity.price) {
            price = commitments.electricity.price;
        }

        if (price !== null) {
            return consumption * price;
        }

        // Fallback to tiered pricing (Landlord Config)
        const tierQuery = `
            SELECT from_index, to_index, price
            FROM utility_configs
            WHERE landlord_id = ? AND type = 'electricity'
            ORDER BY from_index ASC
        `;
        const [tiers] = await db.execute(tierQuery, [landlord_id]);

        if (tiers.length === 0) {
            // Second fallback: default flat rate
            return consumption * 3500;
        }

        let total = 0;
        let remaining = consumption;

        for (const tier of tiers) {
            if (remaining <= 0) break;

            const from = tier.from_index || 0;
            const to = tier.to_index || Infinity;
            const tierRange = to - from;

            const usedInTier = Math.min(remaining, tierRange);
            total += usedInTier * tier.price;
            remaining -= usedInTier;
        }

        return total;
    }

    static async calculateWaterCost(consumption, billId) {
        const query = `
            SELECT c.service_commitments, bld.landlord_id
            FROM bills b
            JOIN contracts c ON b.contract_id = c.contract_id
            JOIN rooms r ON b.room_id = r.room_id
            JOIN buildings bld ON r.building_id = bld.building_id
            WHERE b.bill_id = ?
        `;
        const [rows] = await db.execute(query, [billId]);
        if (rows.length === 0) return 0;

        const { service_commitments, landlord_id } = rows[0];
        const commitments = typeof service_commitments === 'string' ? JSON.parse(service_commitments) : service_commitments || {};

        if (commitments.water && commitments.water.price) {
            return consumption * commitments.water.price;
        }

        // Fallback to landlord config
        const configQuery = `
            SELECT price FROM utility_configs
            WHERE landlord_id = ? AND type = 'water'
            LIMIT 1
        `;
        const [config] = await db.execute(configQuery, [landlord_id]);
        const pricePerUnit = config[0]?.price || 20000;

        return consumption * pricePerUnit;
    }

    static async calculateTotalAmount(billId) {
        console.log(`[BillModel] ---------------- CALCULATE START Bill ID: ${billId} ----------------`);
        const bill = await this.getById(billId);
        if (!bill) throw new Error('Bill not found');

        // Fetch Contract Details for Pricing
        const query = `
            SELECT c.monthly_price, c.service_commitments, c.additional_services
            FROM bills b
            JOIN contracts c ON b.contract_id = c.contract_id
            WHERE b.bill_id = ?
        `;
        const [rows] = await db.execute(query, [billId]);

        if (rows.length === 0) throw new Error('Contract not found for bill');
        const contract = rows[0];

        // 1. Room Rent
        let total = parseFloat(contract.monthly_price);
        console.log(`[BillModel] 1. Room Rent: ${total} (Contract Price: ${contract.monthly_price})`);

        await db.execute('UPDATE bills SET room_rent = ? WHERE bill_id = ?', [total, billId]);

        // 2. Service Fees
        let additionalServices = contract.additional_services;
        if (typeof additionalServices === 'string') {
            additionalServices = JSON.parse(additionalServices || '{}');
        } else {
            additionalServices = additionalServices || {};
        }

        const serviceFeeTotal = Object.values(additionalServices).reduce((sum, fee) => sum + parseFloat(fee || 0), 0);
        console.log(`[BillModel] 2. Service Fees: ${serviceFeeTotal} (From: ${JSON.stringify(additionalServices)})`);

        await db.execute('UPDATE bills SET service_fees = ? WHERE bill_id = ?', [JSON.stringify(additionalServices), billId]);

        total += serviceFeeTotal;
        console.log(`[BillModel] > Total after Services: ${total}`);

        // 3. Electricity
        if (bill.electricity_consumption) {
            const electricityCost = await this.calculateElectricityCost(bill.electricity_consumption, billId);
            console.log(`[BillModel] 3. Electricity Cost: ${electricityCost} (Consumption: ${bill.electricity_consumption})`);

            await db.execute(
                'UPDATE bills SET electricity_amount = ? WHERE bill_id = ?',
                [electricityCost, billId]
            );
            total += electricityCost;
            console.log(`[BillModel] > Total after Electricity: ${total}`);
        } else {
            console.log(`[BillModel] 3. Electricity: Skipped (Consumption null/0)`);
        }

        // 4. Water
        if (bill.water_consumption) {
            const waterCost = await this.calculateWaterCost(bill.water_consumption, billId);
            console.log(`[BillModel] 4. Water Cost: ${waterCost} (Consumption: ${bill.water_consumption})`);

            await db.execute(
                'UPDATE bills SET water_amount = ? WHERE bill_id = ?',
                [waterCost, billId]
            );
            total += waterCost;
            console.log(`[BillModel] > Total after Water: ${total}`);
        } else {
            console.log(`[BillModel] 4. Water: Skipped (Consumption null/0)`);
        }

        // Subtract discount
        const discount = bill.discount || 0;
        total -= discount;
        console.log(`[BillModel] 5. Discount: ${discount}`);

        // Update total
        console.log(`[BillModel] FINAL TOTAL TO UPDATE: ${total}`);
        const [result] = await db.execute(
            'UPDATE bills SET total_amount = ? WHERE bill_id = ?',
            [total, billId]
        );
        console.log(`[BillModel] Update Result: ${result.affectedRows} rows affected`);
        console.log(`[BillModel] ---------------- CALCULATE END ----------------`);

        return total;
    }

    // ==================== Status Updates ====================

    static async confirmBill(billId, landlordId) {
        const query = `
            UPDATE bills
            SET status = 'confirmed',
                confirmed_at = NOW(),
                confirmed_by = ?
            WHERE bill_id = ?
        `;

        const [result] = await db.execute(query, [landlordId, billId]);
        return result.affectedRows > 0;
    }

    static async markAsPaid(billId, paymentData) {
        const {
            payment_method = 'transfer',
            payment_proof_url,
            payment_note,
            transaction_ref
        } = paymentData;

        const query = `
            UPDATE bills
            SET status = 'paid',
                paid_at = NOW(),
                payment_method = ?,
                payment_proof_url = ?,
                payment_note = ?,
                transaction_ref = ?
            WHERE bill_id = ?
        `;

        const [result] = await db.execute(query, [
            payment_method, payment_proof_url, payment_note, transaction_ref, billId
        ]);

        return result.affectedRows > 0;
    }

    static async submitPayment(billId, paymentData) {
        const {
            payment_method = 'transfer',
            payment_proof_url,
            payment_note,
            transaction_ref
        } = paymentData;

        // Status becomes 'pending_approval' waiting for landlord
        const query = `
            UPDATE bills
            SET status = 'pending_approval',
                payment_method = ?,
                payment_proof_url = ?,
                payment_note = ?,
                transaction_ref = ?
            WHERE bill_id = ?
        `;

        const [result] = await db.execute(query, [
            payment_method, payment_proof_url, payment_note, transaction_ref, billId
        ]);

        return result.affectedRows > 0;
    }

    static async approvePayment(billId, landlordId) {
        const query = `
            UPDATE bills
            SET status = 'paid',
                paid_at = NOW(),
                confirmed_by = ?
            WHERE bill_id = ?
        `;

        const [result] = await db.execute(query, [landlordId, billId]);
        return result.affectedRows > 0;
    }

    static async checkOverdueBills() {
        const query = `
            UPDATE bills
            SET status = 'overdue'
            WHERE status IN ('pending', 'confirmed')
              AND due_date < CURDATE()
        `;

        const [result] = await db.execute(query);
        return result.affectedRows;
    }

    // ==================== Auto Generation ====================

    static async autoGenerateBillsForMonth(year, month) {
        // Get all active contracts
        const query = `
            SELECT c.contract_id, c.room_id, c.monthly_price, c.tenant_id,
                   r.room_number
            FROM contracts c
            JOIN rooms r ON c.room_id = r.room_id
            WHERE c.status = 'active'
        `;

        const [contracts] = await db.execute(query);
        const billingMonth = `${year}-${String(month).padStart(2, '0')}-01`;

        let created = 0;

        for (const contract of contracts) {
            // Check if bill already exists
            const [existing] = await db.execute(
                'SELECT bill_id FROM bills WHERE contract_id = ? AND billing_month = ?',
                [contract.contract_id, billingMonth]
            );

            if (existing.length > 0) continue;

            // Get last month's readings
            const lastMonth = new Date(year, month - 2, 1); // month - 1 - 1
            const lastMonthStr = lastMonth.toISOString().substring(0, 10);

            const [lastBill] = await db.execute(
                'SELECT electricity_new, water_new FROM bills WHERE contract_id = ? AND billing_month = ?',
                [contract.contract_id, lastMonthStr]
            );

            const electricityOld = lastBill[0]?.electricity_new || 0;
            const waterOld = lastBill[0]?.water_new || 0;

            // Create new bill
            const dueDate = new Date(year, month - 1, 10); // Due on 10th of the month

            await this.create({
                contract_id: contract.contract_id,
                room_id: contract.room_id,
                billing_month: billingMonth,
                electricity_old: electricityOld,
                water_old: waterOld,
                room_rent: contract.monthly_price,
                service_fees: {}, // Will be filled later
                due_date: dueDate.toISOString().substring(0, 10)
            });

            created++;
        }

        return created;
    }
}

module.exports = Bill;
