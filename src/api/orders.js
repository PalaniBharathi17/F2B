import apiClient from './client';

export const getBuyerOrders = async () => {
    const response = await apiClient.get('/orders/my/orders');
    return response.data;
};

export const getFarmerOrders = async () => {
    const response = await apiClient.get('/orders/farmer/orders');
    return response.data;
};

export const updateOrderStatus = async (orderId, status, cancellationReason = '') => {
    const response = await apiClient.put(`/orders/${orderId}/status`, {
        status,
        cancellation_reason: cancellationReason,
    });
    return response.data;
};

export const cancelOrder = async (orderId) => {
    const response = await apiClient.delete(`/orders/${orderId}`);
    return response.data;
};

export const getFarmerPayoutSummary = async () => {
    const response = await apiClient.get('/orders/farmer/payout-summary');
    return response.data;
};

export const getFarmerAnalytics = async () => {
    const response = await apiClient.get('/orders/farmer/analytics');
    return response.data;
};

export const getFarmerNotifications = async () => {
    const response = await apiClient.get('/orders/farmer/notifications');
    return response.data;
};

export const getFarmerInvoice = async (orderId) => {
    const response = await apiClient.get(`/orders/${orderId}/invoice`);
    return response.data;
};
