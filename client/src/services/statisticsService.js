import api from './api';

const statisticsService = {
    getOverviewStats: async () => {
        const response = await api.get('/landlord/stats/overview');
        return response.data;
    }
};

export default statisticsService;
