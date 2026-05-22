import api from './api';

const bookingService = {
    createBooking: async (bookingData) => {
        const response = await api.post('/bookings', bookingData);
        return response.data;
    },
    getLandlordBookings: async () => {
        const response = await api.get('/bookings/landlord');
        return response.data;
    },
    getTenantBookings: async () => {
        const response = await api.get('/bookings/tenant');
        return response.data;
    },
    checkRoomBookingStatus: async (roomId) => {
        const response = await api.get(`/bookings/user-status/${roomId}`);
        return response.data;
    },
    confirmBooking: async (id, confirmData) => {
        const response = await api.put(`/bookings/${id}/confirm`, confirmData);
        return response.data;
    },
    rejectBooking: async (id) => {
        const response = await api.put(`/bookings/${id}/reject`);
        return response.data;
    },
    createReservation: async (reservationData) => {
        const response = await api.post('/bookings/reserve', reservationData);
        return response.data;
    },
    payDeposit: async (id) => {
        const response = await api.post(`/bookings/${id}/pay-deposit`);
        return response.data;
    }
};

export default bookingService;
