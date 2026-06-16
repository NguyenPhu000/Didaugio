import { GoogleOAuthProvider } from "@react-oauth/google";
import { ToastProvider } from "./ToastProvider";
import { QueryProvider } from "./QueryProvider";
import OnlineStatusPing from "@/components/common/OnlineStatusPing";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

export const AppProviders = ({ children }) => {
  const content = (
    <QueryProvider>
      <ToastProvider>
        <OnlineStatusPing />
        {children}
      </ToastProvider>
    </QueryProvider>
  );

  if (!GOOGLE_CLIENT_ID) {
    return content;
  }

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      {content}
    </GoogleOAuthProvider>
  );
};
