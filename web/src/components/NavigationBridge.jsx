import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerAppNavigate } from "@/lib/appNavigation";

/**
 * Đăng ký useNavigate cho axios / helper ngoài component tree.
 */
export default function NavigationBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    registerAppNavigate(navigate);
    return () => registerAppNavigate(null);
  }, [navigate]);

  return null;
}
