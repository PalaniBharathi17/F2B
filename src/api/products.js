import apiClient from './client';

export const getProducts = async (params = {}) => {
    const response = await apiClient.get('/products', { params });
    return response.data;
};

export const createProduct = async (payload) => {
    const response = await apiClient.post('/products', payload);
    return response.data;
};

export const updateProduct = async (productId, payload) => {
    const response = await apiClient.put(`/products/${productId}`, payload);
    return response.data;
};

export const deleteProduct = async (productId) => {
    const response = await apiClient.delete(`/products/${productId}`);
    return response.data;
};

export const getProduct = async (productId) => {
    const response = await apiClient.get(`/products/${productId}`);
    return response.data;
};

export const getMyListings = async () => {
    const response = await apiClient.get('/products/my/listings');
    return response.data;
};

export const updateProductStatus = async (productId, status) => {
    const response = await apiClient.patch(`/products/${productId}/status`, { status });
    return response.data;
};

export const bulkUpdateProductStatus = async (productIds, status) => {
    const response = await apiClient.patch('/products/bulk/status', {
        product_ids: productIds,
        status,
    });
    return response.data;
};
