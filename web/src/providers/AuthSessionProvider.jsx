import { useEffect } from "react";
import { bootstrapBrowserSession } from "@/auth/browserSession";
import { useAuthStore } from "@/stores/authStore";

const SessionLoader = () => (
  <div className="grid min-h-screen place-items-center bg-[#FAF9F5]" role="status">
    <div className="h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-slate-900" />
    <span className="sr-only">Đang khôi phục phiên đăng nhập</span>
  </div>
);

export const AuthSessionProvider = ({ children }) => {
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    void bootstrapBrowserSession();
  }, []);

  return isLoading ? <SessionLoader /> : children;
};
