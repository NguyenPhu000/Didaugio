import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import useBusinessStore from "@/stores/businessStore";
import { ROLES } from "@/constants/constants";
import { BUSINESS_STATUS } from "@/constants/businessConstants";
import { BUSINESS_ROUTES } from "@/constants/routes";

const BusinessPendingView = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full p-8 text-center space-y-4">
      <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
        <span className="text-3xl">⏳</span>
      </div>
      <h1 className="text-2xl font-bold">Đang chờ duyệt</h1>
      <p className="text-gray-600">
        Hồ sơ doanh nghiệp của bạn đang được xem xét. Chúng tôi sẽ thông báo khi
        hồ sơ được duyệt.
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
      <Link
        to={BUSINESS_ROUTES.PROFILE}
        className="inline-block px-6 py-2 bg-black text-white font-semibold rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Cập nhật hồ sơ
      </Link>
    </div>
  </div>
);

const BusinessSuspendedView = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full p-8 text-center space-y-4">
      <div className="w-16 h-16 mx-auto bg-slate-200 rounded-full flex items-center justify-center">
        <span className="text-3xl" aria-hidden="true">
          ⏸
        </span>
      </div>
      <h1 className="text-2xl font-bold">Doanh nghiệp tạm ngưng</h1>
      <p className="text-gray-600">
        Tài khoản doanh nghiệp của bạn đang bị tạm ngưng. Bạn có thể xem hồ sơ;
        các thao tác vận hành tạm khóa cho đến khi được mở lại.
      </p>
      <Link
        to={BUSINESS_ROUTES.PROFILE}
        className="inline-block px-6 py-2 bg-black text-white font-semibold rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        Xem hồ sơ
      </Link>
    </div>
  </div>
);

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.allowWhenPendingOrRejected] - Cho phép trang (vd: Hồ sơ) khi pending/rejected/suspended để xem hoặc cập nhật
 */
const BusinessGuard = ({ children, allowWhenPendingOrRejected = false }) => {
  const { user } = useAuthStore();
  const { business, loading, fetchProfile } = useBusinessStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (user?.roleId !== ROLES.BUSINESS) {
        if (active) setInitializing(false);
        return;
      }

      try {
        await fetchProfile();
      } finally {
        if (active) setInitializing(false);
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [user?.roleId, fetchProfile]);

  if (user?.roleId !== ROLES.BUSINESS) return children;

  if (loading || initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  if (!business) {
    return <Navigate to={BUSINESS_ROUTES.REGISTER} replace />;
  }

  if (!allowWhenPendingOrRejected) {
    if (business.status === BUSINESS_STATUS.PENDING)
      return <BusinessPendingView />;
    if (business.status === BUSINESS_STATUS.REJECTED)
      return <BusinessRejectedView reason={business.rejectionReason} />;
    if (business.status === BUSINESS_STATUS.SUSPENDED)
      return <BusinessSuspendedView />;
    if (
      business.status === BUSINESS_STATUS.APPROVED &&
      business.contractSigned === false
    ) {
      return <Navigate to={BUSINESS_ROUTES.PROFILE_CONTRACT} replace />;
    }
  }

  return children;
};

export default BusinessGuard;
