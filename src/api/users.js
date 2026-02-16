import apiClient from './client';

export const getFarmers = async () => {
    const response = await apiClient.get('/users/farmers');
    return response.data;
};
