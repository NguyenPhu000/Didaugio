import client from "../../../api/client";
import { ENDPOINTS } from "../../../api/endpoints";

const isEmailIdentifier = (value) => /\S+@\S+\.\S+/.test(value);

const buildLoginPayload = (identifier, password) => {
  const normalizedIdentifier = String(identifier || "").trim();

  return {
    ...(isEmailIdentifier(normalizedIdentifier)
      ? { email: normalizedIdentifier.toLowerCase() }
      : { username: normalizedIdentifier }),
    password,
  };
};

export const loginGoogleApi = (idToken) =>
  client.post(ENDPOINTS.auth.loginGoogle, { idToken });

export const loginApi = (identifier, password) =>
  client.post(ENDPOINTS.auth.login, buildLoginPayload(identifier, password));

export const registerApi = ({
  username,
  email,
  password,
  confirmPassword,
  fullName,
}) =>
  client.post(ENDPOINTS.auth.register, {
    username,
    email,
    password,
    confirmPassword,
    fullName,
  });

export const verifyEmailOtpApi = ({ email, otp }) =>
  client.post(ENDPOINTS.auth.verifyEmailOtp, { email, otp });

export const resendVerificationPublicApi = (email) =>
  client.post(ENDPOINTS.auth.resendVerificationPublic, { email });

export const getMeApi = () => client.get(ENDPOINTS.auth.me);

export const logoutApi = (refreshToken) =>
  client.post(ENDPOINTS.auth.logout, refreshToken ? { refreshToken } : {});

export const refreshApi = (refreshToken) =>
  client.post(ENDPOINTS.auth.refresh, { refreshToken });
