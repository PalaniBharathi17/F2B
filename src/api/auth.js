import apiClient from './client';

export const loginRequest = async (payload) => {
    const response = await apiClient.post('/auth/login', payload);
    return response.data;
};

export const registerRequest = async (payload) => {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
};

export const getCurrentUser = async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
};
