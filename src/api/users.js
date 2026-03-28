import apiClient from './client';

export const getFarmers = async () => {
    const response = await apiClient.get('/users/farmers');
    return response.data;
};

export const getMyAddresses = async () => {
    const response = await apiClient.get('/users/me/addresses');
    return response.data;
};

export const saveMyAddress = async (payload) => {
    const response = await apiClient.post('/users/me/addresses', payload);
    return response.data;
};

export const deleteMyAddress = async (addressId) => {
    const response = await apiClient.delete(`/users/me/addresses/${addressId}`);
    return response.data;
};

export const getMyFavorites = async () => {
    const response = await apiClient.get('/users/me/favorites');
    return response.data;
};

export const toggleFavorite = async (productId) => {
    const response = await apiClient.post(`/users/me/favorites/${productId}`);
    return response.data;
};

export const getMyDocuments = async () => {
    const response = await apiClient.get('/users/me/documents');
    return response.data;
};

export const uploadMyDocument = async (payload) => {
    const response = await apiClient.post('/users/me/documents', payload);
    return response.data;
};

export const getAdminVerificationDocuments = async () => {
    const response = await apiClient.get('/admin/verification-documents');
    return response.data;
};

export const reviewVerificationDocument = async (id, payload) => {
    const response = await apiClient.patch(`/admin/verification-documents/${id}`, payload);
    return response.data;
};
