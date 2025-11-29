import axios from 'axios';

// Base api configuration
// No baseURL needed - requests go to same origin, React proxy forwards to Django
const api = axios.create({
    baseURL: '/api',  // This will be proxied to http://127.0.0.1:8000/api
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Function to get CSRF token from cookie
const getCSRFTokenFromCookie = () => {
    const name = 'csrftoken';
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
};

// Function to ensure we have a CSRF token
const ensureCSRFToken = async () => {
    let token = getCSRFTokenFromCookie();
    
    if (!token) {
        try {
            // This request will set the CSRF cookie
            await axios.get('/api/csrf/', { withCredentials: true });
            token = getCSRFTokenFromCookie();
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
        }
    }
    
    return token;
};

// Request interceptor to add CSRF token
api.interceptors.request.use(
    async (config) => {
        if (config.method !== 'get') {
            const csrfToken = await ensureCSRFToken();
            if (csrfToken) {
                config.headers['X-CSRFToken'] = csrfToken;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        // If 403 and haven't retried, try refreshing CSRF token
        if (error.response?.status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                await axios.get('/api/csrf/', { withCredentials: true });
                const newToken = getCSRFTokenFromCookie();
                if (newToken) {
                    originalRequest.headers['X-CSRFToken'] = newToken;
                    return api(originalRequest);
                }
            } catch (csrfError) {
                console.error('Failed to refresh CSRF token:', csrfError);
            }
        }
        
        if (error.response?.status === 401) {
            window.location.href = '/login';
        }
        
        return Promise.reject(error);
    }
);

// Auth endpoints
export const auth = {
    register: (data) => api.post('/auth/register/', data),
    login: (data) => api.post('/auth/login/', data),
    logout: () => api.post('/auth/logout/'),
    getCurrentUser: () => api.get('/auth/user/'),
};

// Product endpoint
export const products = {
    getAll: (params) => api.get('/products/', { params }),
    getBySlug: (slug) => api.get(`/products/${slug}/`),
    getReviews: (slug) => api.get(`/products/${slug}/reviews/`),
};

// Category endpoint
export const categories = {
    getAll: () => api.get('/categories/'),
    getBySlug: (slug) => api.get(`/categories/${slug}/`),
};

// Cart endpoint
export const cart = {
    getCurrent: () => api.get('/cart/current/'),
    addItem: (data) => api.post('/cart/add_item/', data),
    updateItem: (data) => api.post('/cart/update_item/', data),
    removeItem: (data) => api.post('/cart/remove_item/', data),
    clear: () => api.post('/cart/clear/'),
    applyCoupon: (code) => api.post('/cart/apply_coupon/', { code }),
    createOrder: (data) => api.post('/cart/create_order/', data),
};

// Order endpoint
export const orders = {
    getAll: () => api.get('/orders/'),
    getById: (id) => api.get(`/orders/${id}/`),
    getTracking: (id) => api.get(`/orders/${id}/tracking/`),
};

// Review endpoint
export const reviews = {
    create: (data) => api.post('/reviews/', data),
    getMyReviews: () => api.get('/reviews/my_reviews/'),
};

// Stripe endpoint
export const stripe = {
    getConfig: () => api.get('/stripe/config/'),
};

export default api;
