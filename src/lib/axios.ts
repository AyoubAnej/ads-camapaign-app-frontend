
import axios from 'axios';

// Create advertiser axios instance
export const advertiserAxios = axios.create({
  baseURL: 'http://localhost:5228/api/v1/Advertiser',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create seller axios instance
export const sellerAxios = axios.create({
  baseURL: 'http://localhost:5278/api/v1/Sellers',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create agency axios instance
export const agencyAxios = axios.create({
  baseURL: 'http://localhost:5188/api/v1/Agency',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for authentication if needed
advertiserAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

sellerAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

agencyAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptors for error handling
advertiserAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

sellerAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

agencyAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Agency API Error:', error);
    return Promise.reject(error);
  }
);
