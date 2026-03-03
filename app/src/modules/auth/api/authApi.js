import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

export const loginGoogleApi = (idToken) =>
  client.post(ENDPOINTS.auth.loginGoogle, { idToken });

export const exchangeGoogleCodeApi = (code, redirectUri) =>
  client.post(ENDPOINTS.auth.exchangeGoogleCode, { code, redirectUri });

export const loginApi = (email, password) =>
  client.post(ENDPOINTS.auth.login, { email, password });

export const registerApi = (email, password, fullName) =>
  client.post(ENDPOINTS.auth.register, { email, password, fullName });

export const getMeApi = () => client.get(ENDPOINTS.auth.me);

export const logoutApi = (refreshToken) =>
  client.post(ENDPOINTS.auth.logout, refreshToken ? { refreshToken } : {});

export const refreshApi = (refreshToken) =>
  client.post(ENDPOINTS.auth.refresh, { refreshToken });
