import axios from 'axios';

// Base api configuration
const api = axios.create({
    baseURL: 'http://127.0.0.1:8000/api',
    withCredentials:true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add CSRF token
api.interceptors.request.use(
  async (config) => {
    // Get CSRF token if not already present
    if (!sessionStorage.getItem('csrfToken')) {
      try {
        const response = await axios.get('http://127.0.0.1:8000/api/csrf/', {
          withCredentials: true,
        });
        const csrfToken = response.data.csrfToken;
        sessionStorage.setItem('csrfToken', csrfToken);
      } catch (error) {
        console.error('Error fetching CSRF token:', error);
      }
    }

    // Add CSRF token to headers for non-GET requests
    if (config.method !== 'get') {
      config.headers['X-CSRFToken'] = sessionStorage.getItem('csrfToken');
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
  (error) => {
    if (error.response?.status === 401) {
      // Unauthorized - clear auth state
      sessionStorage.removeItem('csrfToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
    register: (data) => api.post('/auth/register', data),
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout/'),
    getCurrenyUser: () => api.get('/auth/user/'),
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
