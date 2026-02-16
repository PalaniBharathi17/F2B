import apiClient from './client';

export const getBuyerOrders = async () => {
    const response = await apiClient.get('/orders/my/orders');
    return response.data;
};

export const getFarmerOrders = async () => {
    const response = await apiClient.get('/orders/farmer/orders');
    return response.data;
};

export const updateOrderStatus = async (orderId, status) => {
    const response = await apiClient.put(`/orders/${orderId}/status`, { status });
    return response.data;
};

export const cancelOrder = async (orderId) => {
    const response = await apiClient.delete(`/orders/${orderId}`);
    return response.data;
};
