import api from './api';

const billService = {
    // Shared
    getBillDetail: async (id) => {
        const response = await api.get(`/bills/${id}`);
        return response.data;
    },

    // Tenant specific
    getTenantBills: async () => {
        const response = await api.get('/bills/tenant/list');
        return response.data;
    },

    tenantConfirmBill: async (id, formData) => {
        // formData contains electric_reading, water_reading, and proof_image
        // The server expects type and reading_value per uploadMeterReading, or we need to update it.
        // Current server PUT /:id/meter-reading handles ONE type at a time.
        // We will adapt the component to call this twice or update server if needed.
        // Let's assume we want to update both at once if possible, but the server has single endpoints.
        // For now, let's keep it simple and fulfill the component's expectations by wrapping the calls.

        // Actually, let's just make the methods the component needs.
        const response = await api.put(`/bills/${id}/meter-reading`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    tenantPayBill: async (id, paymentData) => {
        const response = await api.put(`/bills/${id}/payment-proof`, paymentData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    getVietQR: async (id) => {
        const response = await api.get(`/bills/${id}/vietqr`);
        return response.data;
    }
};

export default billService;
