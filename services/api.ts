import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// SecureStore keys must be alphanumeric + ".", "-", "_" (no "@" or "/").
export const TOKEN_KEY = 'streakup_token';
export const ONBOARDING_KEY = '@streakup/onboarding-complete';

// The JWT is stored in the device keychain/keystore (encrypted at rest) via
// expo-secure-store — never in plaintext AsyncStorage.
export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}
export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
}
export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
}

// Registered by a React component so api.ts never imports the store/router
// (avoids circular deps / navigation-outside-React).
export let onUnauthorized: (() => void) | null = null;
export function setOnUnauthorized(fn: (() => void) | null): void {
  onUnauthorized = fn;
}

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://10.0.2.2:5000/api/v1',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Surface error message from server response
api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) {
      await clearToken();
      onUnauthorized?.();
    }
    const message: string =
      err.response?.data?.error ??
      err.message ??
      'Something went wrong. Please try again.';
    return Promise.reject(new Error(message));
  }
);
