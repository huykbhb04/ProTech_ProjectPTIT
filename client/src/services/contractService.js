import api from './api';

const contractService = {
    createFromBooking: async (bookingId) => {
        const response = await api.post('/contracts/create', { bookingId });
        return response.data;
    },
    getContractDetail: async (id) => {
        const response = await api.get(`/contracts/${id}`);
        return response.data;
    },
    tenantSign: async (id) => {
        const response = await api.put(`/contracts/${id}/tenant-sign`);
        return response.data;
    },
    landlordSign: async (id) => {
        const response = await api.put(`/contracts/${id}/landlord-sign`);
        return response.data;
    },
    uploadCCCD: async (contractId, frontFile, backFile) => {
        const formData = new FormData();
        formData.append('front', frontFile);
        formData.append('back', backFile);
        const response = await api.put(`/contracts/${contractId}/cccd`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    updatePersonalInfo: async (contractId, personalData) => {
        const response = await api.put(`/contracts/${contractId}/personal-info`, personalData);
        return response.data;
    },
    getLandlordContracts: async () => {
        const response = await api.get('/contracts/landlord/list');
        return response.data;
    },
    updateContractTerms: async (contractId, terms) => {
        const response = await api.put(`/contracts/${contractId}/terms`, { terms });
        return response.data;
    },
    uploadLandlordCCCD: async (contractId, frontFile, backFile) => {
        const formData = new FormData();
        formData.append('front', frontFile);
        formData.append('back', backFile);
        const response = await api.put(`/contracts/${contractId}/landlord-cccd`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    saveHandoverInfo: async (contractId, handoverData) => {
        const response = await api.put(`/contracts/${contractId}/handover`, handoverData);
        return response.data;
    },
    getRoomAssets: async (contractId) => {
        const response = await api.get(`/contracts/${contractId}/assets`);
        return response.data;
    },
    getUtilityConfigs: async (contractId) => {
        const response = await api.get(`/contracts/${contractId}/utility-configs`);
        return response.data;
    }
};

export default contractService;
