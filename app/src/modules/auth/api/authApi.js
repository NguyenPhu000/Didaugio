import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

/** Authenticate with Google id_token — backend verifies and returns JWT session */
export const loginGoogleApi = (idToken) =>
  client.post(ENDPOINTS.auth.loginGoogle, { idToken });

/** Login with email + password */
export const loginApi = (email, password) =>
  client.post(ENDPOINTS.auth.login, { email, password });

/** Register new account */
export const registerApi = (email, password, fullName) =>
  client.post(ENDPOINTS.auth.register, { email, password, fullName });

/** Get current authenticated user */
export const getMeApi = () => client.get(ENDPOINTS.auth.me);

/** Logout current session — server xóa session bằng refreshToken */
export const logoutApi = (refreshToken) =>
  client.post(ENDPOINTS.auth.logout, refreshToken ? { refreshToken } : {});

/** Refresh access token */
export const refreshApi = (refreshToken) =>
  client.post(ENDPOINTS.auth.refresh, { refreshToken });
