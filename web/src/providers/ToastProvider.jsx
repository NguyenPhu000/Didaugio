import { Toaster } from "react-hot-toast";
import { Toaster as Sonner } from "sonner";

/**
 * TOAST PROVIDER
 * Centralized toast notification configuration
 */
export const ToastProvider = ({ children }) => {
  return (
    <>
      {/* React Hot Toast */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#363636",
            color: "#fff",
          },
          success: {
            iconTheme: {
              primary: "#22c55e",
              secondary: "#fff",
            },
          },
          error: {
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      
      {/* Sonner */}
      <Sonner richColors position="top-right" />
      
      {children}
    </>
  );
};
