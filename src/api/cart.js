import apiClient from './client';

export const getCart = async () => {
    const response = await apiClient.get('/cart');
    return response.data;
};

export const addToCart = async (payload) => {
    const response = await apiClient.post('/cart', payload);
    return response.data;
};

export const updateCartItem = async (id, payload) => {
    const response = await apiClient.put(`/cart/${id}`, payload);
    return response.data;
};

export const removeCartItem = async (id) => {
    const response = await apiClient.delete(`/cart/${id}`);
    return response.data;
};

export const checkoutCart = async (payload = {}) => {
    const response = await apiClient.post('/cart/checkout', payload);
    return response.data;
};
