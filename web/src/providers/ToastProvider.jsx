import { Toaster } from "sonner";

/**
 * TOAST PROVIDER
 * Centralized toast notification configuration — sonner only
 */
export const ToastProvider = ({ children }) => {
  return (
    <>
      <Toaster
        position="top-right"
        richColors
        theme="light"
        toastOptions={{
          classNames: {
            toast: "border border-gray-200 bg-white shadow-lg rounded-xl",
            title: "text-sm font-semibold text-gray-900",
            description: "text-xs text-gray-500 mt-0.5",
            success:
              "border-emerald-200 bg-emerald-50 text-emerald-800",
            error:
              "border-red-200 bg-red-50 text-red-800",
            warning:
              "border-amber-200 bg-amber-50 text-amber-800",
          },
        }}
      />
      {children}
    </>
  );
};
