import api from './api';

const tenantService = {
    getMyRoom: async () => {
        const response = await api.get('/tenant/my-room');
        return response.data;
    }
};

export default tenantService;
