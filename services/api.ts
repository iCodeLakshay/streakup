import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const TOKEN_KEY = '@streakup/token';
export const ONBOARDING_KEY = '@streakup/onboarding-complete';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Surface error message from server response
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const message: string =
      err.response?.data?.error ??
      err.message ??
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);
