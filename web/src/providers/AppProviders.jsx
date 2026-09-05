import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastProvider } from "./ToastProvider";
import { QueryProvider } from "./QueryProvider";
import OnlineStatusPing from "@/components/common/OnlineStatusPing";
import { AuthSessionProvider } from "./AuthSessionProvider";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export const AppProviders = ({ children }) => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryProvider>
        <AuthSessionProvider>
          <ToastProvider>
            <OnlineStatusPing />
            {children}
          </ToastProvider>
        </AuthSessionProvider>
      </QueryProvider>
    </GoogleOAuthProvider>
  );
};
