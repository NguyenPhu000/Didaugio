import { GoogleLogin } from "@react-oauth/google";

/**
 * Nút đăng ký Google cho trang Register.
 * Dùng text="signup_with" theo Google Brand Guidelines.
 */
const GoogleSignUpButton = ({ onSuccess, onError, disabled }) => {
  return (
    <div className="w-full mb-4">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          onSuccess(credentialResponse);
        }}
        onError={onError}
        disabled={disabled}
        width="100%"
        shape="rectangular"
        text="signup_with"
        size="large"
      />
    </div>
  );
};

export default GoogleSignUpButton;
