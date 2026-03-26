import api from './api';

const aiService = {
    generateDescription: async (listingData) => {
        const response = await api.post('/ai/generate-description', listingData);
        return response.data;
    },
    processCCCD: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/ai/ocr/cccd', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },
    processMeter: async (file, previousValue = 0) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('previousValue', previousValue);
        const response = await api.post('/ai/ocr/meter', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }
};

export default aiService;
