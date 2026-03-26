import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastProvider } from "./ToastProvider";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export const AppProviders = ({ children }) => {
  const content = <ToastProvider>{children}</ToastProvider>;

  if (!GOOGLE_CLIENT_ID) {
    return content;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {content}
    </GoogleOAuthProvider>
  );
};
