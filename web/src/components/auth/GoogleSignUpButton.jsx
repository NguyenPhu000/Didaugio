import { GoogleLogin } from "@react-oauth/google";
import { useTranslation } from "react-i18next";

/**
 * Nút đăng ký Google cho trang Register.
 * Dùng text="signup_with" theo Google Brand Guidelines.
 */
const GoogleSignUpButton = ({ onSuccess, onError, disabled }) => {
  const { i18n } = useTranslation();

  return (
    <div className="w-full mb-4 flex justify-center">
      <GoogleLogin
        onSuccess={(credentialResponse) => {
          onSuccess(credentialResponse);
        }}
        onError={onError}
        disabled={disabled}
        width="320"
        shape="rectangular"
        text="signup_with"
        locale={i18n.resolvedLanguage === "vi" ? "vi" : "en"}
        size="large"
        useOneTap={false}
      />
    </div>
  );
};

export default GoogleSignUpButton;
