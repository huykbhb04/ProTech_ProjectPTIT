import api from './api';

const API_PATH = '/reports';

const reportService = {
    // Giai đoạn 4: Chủ trọ gửi khiếu nại
    submitDispute: async (disputeData) => {
        const response = await api.post(`${API_PATH}/disputes`, disputeData);
        return response.data;
    },

    // Giai đoạn 3: Admin quản lý phản ánh
    adminGetReports: async (params) => {
        const response = await api.get(`${API_PATH}/admin/reports`, { params });
        return response.data;
    },

    adminResolveReport: async (reportId, actionData) => {
        const response = await api.post(`${API_PATH}/admin/reports/${reportId}/resolve`, actionData);
        return response.data;
    },

    // Giai đoạn 3: Admin quản lý khiếu nại
    adminGetDisputes: async (params) => {
        const response = await api.get(`${API_PATH}/admin/disputes`, { params });
        return response.data;
    },

    adminResolveDispute: async (disputeId, actionData) => {
        const response = await api.post(`${API_PATH}/admin/disputes/${disputeId}/resolve`, actionData);
        return response.data;
    }
};

export default reportService;
