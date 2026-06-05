import { GoogleLogin } from "@react-oauth/google";

/**
 * Chỉ render khi có VITE_GOOGLE_CLIENT_ID (GoogleOAuthProvider đã wrap app).
 * Tránh lỗi "Missing required parameter client_id" khi chưa cấu hình.
 *
 * Sử dụng GoogleLogin component (rendered button) với default flow
 * để nhận ID token (credential), khớp với server POST /api/auth/google.
 */
const GoogleLoginButton = ({ onSuccess, onError, disabled }) => {
  return (
    <div className="w-full mb-4">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          // Default flow returns { credential: "<id_token>" }
          onSuccess(credentialResponse);
        }}
        onError={onError}
        disabled={disabled}
        width="100%"
        shape="rectangular"
        text="signin_with"
        size="large"
      />
    </div>
  );
};

export default GoogleLoginButton;
