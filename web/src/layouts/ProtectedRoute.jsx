import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";

const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { isAuthenticated, user } = useAuthStore();

  // TODO: Tam thoi bo yeu cau dang nhap de dev
  // Uncomment lai khi can bat buoc dang nhap

  // if (!isAuthenticated) {
  //   return <Navigate to="/login" replace />;
  // }

  // if (allowedRoles.length > 0 && !allowedRoles.includes(user?.roleId)) {
  //   return <Navigate to="/unauthorized" replace />;
  // }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
