import { useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import useBusinessStore from "@/stores/businessStore";
import { ROLES } from "@/constants/constants";

const BusinessPendingView = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full p-8 text-center space-y-4">
      <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
        <span className="text-3xl">⏳</span>
      </div>
      <h1 className="text-2xl font-bold">Đang chờ duyệt</h1>
      <p className="text-gray-600">
        Hồ sơ doanh nghiệp của bạn đang được xem xét. Chúng tôi sẽ thông báo
        khi hồ sơ được duyệt.
      </p>
    </div>
  </div>
);

const BusinessRejectedView = ({ reason }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full p-8 text-center space-y-4">
      <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
        <span className="text-3xl">✗</span>
      </div>
      <h1 className="text-2xl font-bold">Hồ sơ bị từ chối</h1>
      <p className="text-gray-600">
        {reason || "Vui lòng cập nhật hồ sơ và gửi lại để được xem xét."}
      </p>
      <a
        href="/business/profile"
        className="inline-block px-6 py-2 bg-black text-white font-semibold rounded"
      >
        Cập nhật hồ sơ
      </a>
    </div>
  </div>
);

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.allowWhenPendingOrRejected] - Cho phép truy cập trang (vd: Hồ sơ) khi status pending/rejected để cập nhật
 */
const BusinessGuard = ({ children, allowWhenPendingOrRejected = false }) => {
  const { user } = useAuthStore();
  const { business, loading, fetchProfile } = useBusinessStore();

  useEffect(() => {
    if (user?.roleId === ROLES.BUSINESS) {
      fetchProfile();
    }
  }, [user?.roleId, fetchProfile]);

  if (user?.roleId !== ROLES.BUSINESS) return children;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  if (!business) {
    return <Navigate to="/business/register" replace />;
  }

  if (!allowWhenPendingOrRejected) {
    if (business.status === "pending") return <BusinessPendingView />;
    if (business.status === "rejected")
      return <BusinessRejectedView reason={business.rejectionReason} />;
  }

  return children;
};

export default BusinessGuard;
