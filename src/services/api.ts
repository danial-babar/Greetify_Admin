import axios from "axios";
import Cookies from "js-cookie";

// Configure axios with base URL and default headers
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    "Cache-Control": "no-cache",
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

// Add authorization header when token is available
api.interceptors.request.use(
  (config) => {
    const user = Cookies.get("user");
    const token = user ? JSON.parse(user).token : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// API interfaces
export interface Category {
  _id: string;
  name: string;
  image?: string;
  background_linear_gradient?: [string, string]; // Array of two color values (hex, rgb, or rgba)
}

export interface SubCategory {
  _id: string;
  name: string;
  category_id: string;
}

export interface TextElement {
  id: string;
  type: "text";
  text: string;
  positionX: number;
  positionY: number;
  color: string;
  fontStyleIndex: number;
  bold: boolean;
  italic: boolean;
  scale: number;
  rotate: number;
  alignment: "left" | "center" | "right";
  lineHeight: number;
  fontSize: number;
}

export interface ShapeElement {
  id: string;
  type: "shape";
  shapeType: "line";
  positionX: number;
  positionY: number;
  color: string;
  width: number; // percentage of container width (0-100)
  height: number; // line thickness in pixels
  rotate: number;
  borderRadius?: number; // in px
}

export type CardElement = TextElement | ShapeElement;

export interface Card {
  _id?: string;
  name: string;
  category_id: string;
  subcategory_id: string;
  background_image?: string;
  preview_image?: string;
  aspect_ratio?: number;
  elements: CardElement[];
  createdAt?: string;
  updatedAt?: string;
  category?: { _id: string; name: string };
  subcategory?: { _id: string; name: string };
}

export interface User {
  _id?: string;
  name: string;
  email: string;
  role?: string;
  // Add more fields as needed
}

// Colors API
export interface Color {
  _id: string;
  color: string; // hex value
  order: number;
}

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    return await api.post("/auth/login", { email, password });
  },

  register: async (userData: {
    name: string;
    email: string;
    password: string;
  }) => {
    return await api.post("/auth/register", userData);
  },

  forgotPassword: async (email: string) => {
    return await api.post("/auth/forgot-password", { email });
  },

  resetPassword: async (token: string, password: string) => {
    return await api.post("/auth/reset-password", { token, password });
  },
};

// Categories API
export const categoryAPI = {
  getAll: async () => {
    const response = await api.get("/categories");
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  create: async (data: FormData) => {
    const response = await api.post("/categories", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  update: async (id: string, data: FormData) => {
    const response = await api.put(`/categories/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  },
};

// SubCategories API
export const subCategoryAPI = {
  getAll: async () => {
    const response = await api.get("/subcategories");
    return response.data;
  },

  getByCategory: async (categoryId: string) => {
    const response = await api.get(`/subcategories?category_id=${categoryId}`);
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/subcategories/${id}`);
    return response.data;
  },

  create: async (data: {
    name: string;
    category_id: string;
  }) => {
    const response = await api.post("/subcategories", data);
    return response.data;
  },

  update: async (
    id: string,
    data: { name: string; category_id: string },
  ) => {
    const response = await api.put(`/subcategories/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/subcategories/${id}`);
    return response.data;
  },
};

// Cards API
export const cardAPI = {
  getAll: async (
    params: {
      category_id?: string;
      subcategory_id?: string;
      search?: string;
      page?: number;
      is_populate?: boolean;
    } = {},
    controller?: AbortController,
  ) => {
    const query = new URLSearchParams();
    if (params.category_id) query.append("category_id", params.category_id);
    if (params.subcategory_id)
      query.append("subcategory_id", params.subcategory_id);
    if (params.search?.trim()) query.append("search", params.search.trim());
    if (params.page) query.append("page", String(params.page));
    if (params.is_populate)
      query.append("is_populate", String(params.is_populate));
    const response = await api.get(`/cards?${query.toString()}`, {
      signal: controller?.signal,
    });
    return response.data;
  },

  getById: async (id: string) => {
    const response = await api.get(`/cards/${id}`);
    return response.data;
  },

  create: async (data: FormData) => {
    const response = await api.post("/cards", data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  update: async (id: string, data: FormData) => {
    const response = await api.put(`/cards/${id}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  delete: async (id: string) => {
    const response = await api.delete(`/cards/${id}`);
    return response.data;
  },
};

// Users API
export const userAPI = {
  getAll: async () => {
    return await api.get(`/users`);
  },
  async getById(id: string) {
    return fetch(`/users/${id}`).then((res) => res.json());
  },
  async create(user: Partial<User>) {
    return fetch("/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    }).then((res) => res.json());
  },
  async update(id: string, user: Partial<User>) {
    return fetch(`/users/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    }).then((res) => res.json());
  },
  async delete(id: string) {
    return fetch(`/users/${id}`, {
      method: "DELETE",
    }).then((res) => res.json());
  },
};

// Colors API
export const colorAPI = {
  getAll: async () => {
    const response = await api.get("/colors");
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/colors/${id}`);
    return response.data;
  },
  create: async (data: { color: string; order: number }) => {
    const response = await api.post("/colors", data);
    return response.data;
  },
  update: async (id: string, data: { color: string; order: number }) => {
    const response = await api.put(`/colors/${id}`, data);
    return response.data;
  },
  delete: async (id: string) => {
    const response = await api.delete(`/colors/${id}`);
    return response.data;
  },
};

// Convert a base64 string to a Blob object
export const dataURItoBlob = (dataURI: string) => {
  // Convert base64/URLEncoded data component to raw binary data held in a string
  let byteString;
  if (dataURI.split(",")[0].indexOf("base64") >= 0)
    byteString = atob(dataURI.split(",")[1]);
  else byteString = unescape(dataURI.split(",")[1]);

  // Separate out the mime component
  const mimeString = dataURI.split(",")[0].split(":")[1].split(";")[0];

  // Write the bytes of the string to a typed array
  const ia = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i);
  }

  return new Blob([ia], { type: mimeString });
};

export default api;
