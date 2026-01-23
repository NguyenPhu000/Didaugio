import { useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

/**
 * AUTH PROVIDER
 * Handles authentication state restoration from localStorage on app mount
 */
export const AuthProvider = ({ children }) => {
  useEffect(() => {
    const storedAuth = localStorage.getItem("auth-storage");
    if (storedAuth) {
      try {
        const { state } = JSON.parse(storedAuth);
        // Check if we have valid auth data
        if (
          state?.accessToken &&
          state?.user &&
          !useAuthStore.getState().isAuthenticated
        ) {
          useAuthStore.setState({
            user: state.user,
            accessToken: state.accessToken,
            refreshToken: state.refreshToken,
            isAuthenticated: state.isAuthenticated || true,
          });
        }
      } catch (error) {
        console.error("Failed to restore auth:", error);
      }
    }
  }, []);

  return children;
};
