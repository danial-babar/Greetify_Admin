import axios from 'axios';

// Configure axios with base URL and default headers
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL, 
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Add authorization header when token is available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API interfaces
export interface Category {
  id: string;
  name: string;
  image?: string;
}

export interface SubCategory {
  id: string;
  name: string;
  category_id: string;
  image?: string;
}

export interface CardElement {
  id: string;
  type: 'text';
  text: string;
  positionX: number;
  positionY: number;
  colorIndex: number;
  fontStyleIndex: number;
  bold: boolean;
  italic: boolean;
  scale: number;
  rotate: number;
  alignment: 'left' | 'center' | 'right';
  lineHeight: number;
  fontSize: number;
}

export interface Card {
  id?: string;
  name: string;
  category_id: string;
  sub_category_id: string;
  background_image?: string;
  preview_image?: string;
  elements: CardElement[];
  createdAt?: string;
  updatedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post('/users/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('auth_token', response.data.token);
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('auth_token');
  },
  
  register: async (userData: { name: string, email: string, password: string }) => {
    return await api.post('/users/register', userData);
  },
  
  forgotPassword: async (email: string) => {
    return await api.post('/users/forgot-password', { email });
  },
  
  resetPassword: async (token: string, password: string) => {
    return await api.post('/users/reset-password', { token, password });
  }
};

// Categories API
export const categoryAPI = {
  getAll: async () => {
    const response = await api.get('/category');
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/category/${id}`);
    return response.data;
  },
  
  create: async (data: FormData) => {
    const response = await api.post('/category', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  update: async (id: string, data: FormData) => {
    const response = await api.put(`/category/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/category/${id}`);
    return response.data;
  }
};

// SubCategories API
export const subCategoryAPI = {
  getAll: async () => {
    const response = await api.get('/subcategory');
    return response.data;
  },
  
  getByCategory: async (categoryId: string) => {
    const response = await api.get(`/subcategory/${categoryId}`);
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/subcategory/single/${id}`);
    return response.data;
  },
  
  create: async (data: FormData) => {
    const response = await api.post('/subcategory', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  update: async (id: string, data: FormData) => {
    const response = await api.put(`/subcategory/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/subcategory/${id}`);
    return response.data;
  }
};

// Cards API
export const cardAPI = {
  getAll: async (page = 1, limit = 10) => {
    const response = await api.get(`/card`);
    return response.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/card/${id}`);
    return response.data;
  },
  
  create: async (data: FormData) => {
    const response = await api.post('/card', data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  update: async (id: string, data: FormData) => {
    const response = await api.put(`/card/${id}`, data, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/card/${id}`);
    return response.data;
  }
};

// Users API
export const userAPI = {
  getAll: async () => {
    const response = await api.get('/users');
    return response.data.data;
  },
  
  getById: async (id: string) => {
    const response = await api.get(`/users/${id}`);
    return response.data.data;
  },
  
  create: async (userData: { name: string, email: string, password: string, role: string }) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  
  update: async (id: string, userData: { name?: string, email?: string, role?: string }) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  
  delete: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};

// Convert a base64 string to a Blob object
export const dataURItoBlob = (dataURI: string) => {
  // Convert base64/URLEncoded data component to raw binary data held in a string
  let byteString;
  if (dataURI.split(',')[0].indexOf('base64') >= 0)
    byteString = atob(dataURI.split(',')[1]);
  else
    byteString = unescape(dataURI.split(',')[1]);

  // Separate out the mime component
  const mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];

  // Write the bytes of the string to a typed array
  const ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], { type: mimeString });
}

export default api; 