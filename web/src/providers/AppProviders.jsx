import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastProvider } from "./ToastProvider";
import { QueryProvider } from "./QueryProvider";
import OnlineStatusPing from "@/components/common/OnlineStatusPing";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export const AppProviders = ({ children }) => {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryProvider>
        <ToastProvider>
          <OnlineStatusPing />
          {children}
        </ToastProvider>
      </QueryProvider>
    </GoogleOAuthProvider>
  );
};
