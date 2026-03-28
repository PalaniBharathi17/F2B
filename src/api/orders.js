import apiClient from './client';

export const getBuyerOrders = async () => {
    const response = await apiClient.get('/orders/my/orders');
    return response.data;
};

export const getOrderMessages = async (orderId) => {
    const response = await apiClient.get(`/orders/${orderId}/messages`);
    return response.data;
};

export const sendOrderMessage = async (orderId, payload) => {
    const response = await apiClient.post(`/orders/${orderId}/messages`, payload);
    return response.data;
};

export const getDisputeEvidence = async (orderId) => {
    const response = await apiClient.get(`/orders/${orderId}/dispute/evidence`);
    return response.data;
};

export const addDisputeEvidence = async (orderId, payload) => {
    const response = await apiClient.post(`/orders/${orderId}/dispute/evidence`, payload);
    return response.data;
};

export const getBuyerHarvestRequests = async () => {
    const response = await apiClient.get('/orders/my/harvest-requests');
    return response.data;
};

export const getBuyerReviews = async (params = {}) => {
    const response = await apiClient.get('/orders/my/reviews', { params });
    return response.data;
};

export const getBuyerNotifications = async () => {
    const response = await apiClient.get('/orders/my/notifications');
    return response.data;
};

export const submitBuyerReview = async (orderId, payload) => {
    const response = await apiClient.post(`/orders/${orderId}/review`, payload);
    return response.data;
};

export const getFarmerOrders = async () => {
    const response = await apiClient.get('/orders/farmer/orders');
    return response.data;
};

export const getFarmerHarvestRequests = async () => {
    const response = await apiClient.get('/orders/farmer/harvest-requests');
    return response.data;
};

export const createBulkOrder = async (payload) => {
    const response = await apiClient.post('/orders/bulk', payload);
    return response.data;
};

export const createHarvestRequest = async (payload) => {
    const response = await apiClient.post('/orders/harvest-requests', payload);
    return response.data;
};

export const updateHarvestRequest = async (requestId, payload) => {
    const response = await apiClient.patch(`/orders/harvest-requests/${requestId}`, payload);
    return response.data;
};

export const convertHarvestRequestToOrder = async (requestId, payload = {}) => {
    const response = await apiClient.post(`/orders/harvest-requests/${requestId}/convert`, payload);
    return response.data;
};

export const updateOrderStatus = async (orderId, status, cancellationReason = '') => {
    const response = await apiClient.put(`/orders/${orderId}/status`, {
        status,
        cancellation_reason: cancellationReason,
    });
    return response.data;
};

export const updateOrderStatusDetailed = async (orderId, payload) => {
    const response = await apiClient.put(`/orders/${orderId}/status`, payload);
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

export const getOrderStatusHistory = async (orderId, params = {}) => {
    const response = await apiClient.get(`/orders/${orderId}/history`, { params });
    return response.data;
};

export const getFarmerReviews = async (params = {}) => {
    const response = await apiClient.get('/orders/farmer/reviews', { params });
    return response.data;
};

export const getFarmerDisputes = async (params = {}) => {
    const response = await apiClient.get('/orders/farmer/disputes', { params });
    return response.data;
};

export const getFarmerWeeklySummary = async () => {
    const response = await apiClient.get('/orders/farmer/summary/weekly');
    return response.data;
};

export const getFarmerMonthlySummary = async () => {
    const response = await apiClient.get('/orders/farmer/summary/monthly');
    return response.data;
};

export const exportFarmerReport = async (type = 'orders') => {
    const response = await apiClient.get('/orders/farmer/reports/export', {
        params: { type },
        responseType: 'blob',
    });
    return response;
};

export const openDispute = async (orderId, note) => {
    const response = await apiClient.post(`/orders/${orderId}/dispute/open`, { note });
    return response.data;
};

export const resolveDispute = async (orderId, note) => {
    const response = await apiClient.post(`/orders/${orderId}/dispute/resolve`, { note });
    return response.data;
};

export const rejectDispute = async (orderId, note) => {
    const response = await apiClient.post(`/orders/${orderId}/dispute/reject`, { note });
    return response.data;
};
