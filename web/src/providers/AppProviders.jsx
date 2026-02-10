import { AuthProvider } from "./AuthProvider";
import { ToastProvider } from "./ToastProvider";

/**
 * APP PROVIDERS
 * Composes all root-level providers to prevent "Provider Hell" in App.jsx
 * Add new global providers here in the appropriate order
 */
export const AppProviders = ({ children }) => {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
};
