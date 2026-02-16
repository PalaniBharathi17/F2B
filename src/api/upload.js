import apiClient from './client';

export const uploadImage = async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await apiClient.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
};
