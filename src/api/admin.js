import apiClient from './client';

export const getAdminOverview = async () => {
    const response = await apiClient.get('/admin/overview');
    return response.data;
};

export const getAdminUsers = async () => {
    const response = await apiClient.get('/admin/users');
    return response.data;
};

export const updateAdminUserStatus = async (userId, payload) => {
    const response = await apiClient.patch(`/admin/users/${userId}/status`, payload);
    return response.data;
};

export const updateAdminUserVerification = async (userId, payload) => {
    const response = await apiClient.patch(`/admin/users/${userId}/verification`, payload);
    return response.data;
};

export const getAdminProducts = async () => {
    const response = await apiClient.get('/admin/products');
    return response.data;
};

export const updateAdminProductModeration = async (productId, payload) => {
    const response = await apiClient.patch(`/admin/products/${productId}/moderation`, payload);
    return response.data;
};

export const getAdminTransactions = async () => {
    const response = await apiClient.get('/admin/transactions');
    return response.data;
};

export const getAdminHarvestRequests = async () => {
    const response = await apiClient.get('/admin/harvest-requests');
    return response.data;
};

export const exportAdminTransactions = async () => {
    const response = await apiClient.get('/admin/transactions/export', { responseType: 'blob' });
    return response.data;
};

export const getAdminTransactionInvoice = async (orderId) => {
    const response = await apiClient.get(`/admin/transactions/${orderId}/invoice`);
    return response.data;
};

export const getAdminReports = async () => {
    const response = await apiClient.get('/admin/reports');
    return response.data;
};

export const resolveAdminReport = async (reportId, payload) => {
    const id = Number(reportId);
    const attempts = [
        () => apiClient.post('/admin/reports/action', { report_id: id, ...payload }),
        () => apiClient.post(`/admin/reports/${id}/resolve`, payload),
        () => apiClient.patch(`/admin/reports/${id}/resolve`, payload),
        () => apiClient.post(`/admin/reports/${id}`, payload),
        () => apiClient.patch(`/admin/reports/${id}`, payload),
    ];

    let lastError;
    for (const attempt of attempts) {
        try {
            const response = await attempt();
            return response.data;
        } catch (error) {
            lastError = error;
            if (error?.response?.status !== 404) {
                throw error;
            }
        }
    }

    throw lastError;
};

export const getAdminNoveltyAnalytics = async () => {
    const response = await apiClient.get('/admin/novelty-analytics');
    return response.data;
};
