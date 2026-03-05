import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:8000/api";

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post("/login", { email, password });
    if (response.data?.token) {
      await AsyncStorage.setItem("token", String(response.data.token));
      await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
  },
  logout: async () => {
    await api.post("/logout");
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");
  },
  getCurrentUser: async () => {
    const user = await AsyncStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },
};

export default api;
