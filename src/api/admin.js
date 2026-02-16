import apiClient from './client';

export const getAdminOverview = async () => {
    const response = await apiClient.get('/admin/overview');
    return response.data;
};

export const getAdminUsers = async () => {
    const response = await apiClient.get('/admin/users');
    return response.data;
};

export const getAdminProducts = async () => {
    const response = await apiClient.get('/admin/products');
    return response.data;
};

export const getAdminTransactions = async () => {
    const response = await apiClient.get('/admin/transactions');
    return response.data;
};

export const getAdminReports = async () => {
    const response = await apiClient.get('/admin/reports');
    return response.data;
};
