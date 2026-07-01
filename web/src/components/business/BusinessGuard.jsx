import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "@/stores/authStore";
import { useBusinessProfile } from "@/hooks/queries/useBusinessQueries";
import { ROLES } from "@/constants/constants";
import { BUSINESS_STATUS } from "@/constants/businessConstants";
import { BUSINESS_ROUTES } from "@/constants/routes";
import { Hourglass } from "lucide-react";

const BusinessPendingView = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-amber-50 rounded-full flex items-center justify-center border border-amber-200 shadow-inner">
          <Hourglass className="w-8 h-8 text-amber-600 animate-spin [animation-duration:3s]" />
        </div>
        <h1 className="text-2xl font-bold">{t("business.guard.pending")}</h1>
        <p className="text-gray-600">
          {t("business.guard.pendingDesc")}
        </p>
      </div>
    </div>
  );
};

const BusinessRejectedView = ({ reason }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-3xl">✗</span>
        </div>
        <h1 className="text-2xl font-bold">{t("business.guard.rejected")}</h1>
        <p className="text-gray-600">
          {reason || t("business.guard.rejectedDesc")}
        </p>
        <Link
          to={BUSINESS_ROUTES.PROFILE}
          className="inline-block px-6 py-2 bg-black text-white font-semibold rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {t("business.guard.updateProfile")}
        </Link>
      </div>
    </div>
  );
};

const BusinessSuspendedView = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-slate-200 rounded-full flex items-center justify-center">
          <span className="text-3xl" aria-hidden="true">
            ⏸
          </span>
        </div>
        <h1 className="text-2xl font-bold">{t("business.guard.suspended")}</h1>
        <p className="text-gray-600">
          {t("business.guard.suspendedDesc")}
        </p>
        <Link
          to={BUSINESS_ROUTES.PROFILE}
          className="inline-block px-6 py-2 bg-black text-white font-semibold rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {t("business.guard.viewProfile")}
        </Link>
      </div>
    </div>
  );
};

const BusinessTerminatedView = ({ reason }) => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
          <span className="text-3xl" aria-hidden="true">
            ✕
          </span>
        </div>
        <h1 className="text-2xl font-bold">{t("business.guard.terminated")}</h1>
        <p className="text-gray-600">
          {t("business.guard.terminatedDesc")}
          {reason ? ` ${t("business.guard.reasonPrefix")} ${reason}` : ""} {t("business.guard.readOnly")}
        </p>
        <Link
          to={BUSINESS_ROUTES.PROFILE}
          className="inline-block px-6 py-2 bg-black text-white font-semibold rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {t("business.guard.viewProfile")}
        </Link>
      </div>
    </div>
  );
};

const BusinessSuspiciousView = () => {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center">
          <span className="text-3xl" aria-hidden="true">
            ⚠
          </span>
        </div>
        <h1 className="text-2xl font-bold">{t("business.guard.locked")}</h1>
        <p className="text-gray-600">
          {t("business.guard.lockedDesc")}
        </p>
      </div>
    </div>
  );
};

/**
 * @param {Object} props
 * @param {React.ReactNode} props.children
 * @param {boolean} [props.allowWhenPendingOrRejected] - Cho phép trang (vd: Hồ sơ) khi pending/rejected/suspended để xem hoặc cập nhật
 */
const BusinessGuard = ({ children, allowWhenPendingOrRejected = false }) => {
  const { user, setUser } = useAuthStore();
  const { data: business, isLoading } = useBusinessProfile();
  const biz = business?.data || business;

  useEffect(() => {
    if (!biz?.subscription || !user) return;
    const currentSubscription = user?.business?.subscription || user?.subscription;
    if (
      currentSubscription?.id === biz.subscription.id &&
      currentSubscription?.updatedAt === biz.subscription.updatedAt
    ) {
      return;
    }
    setUser({
      ...user,
      business: {
        ...(user.business || {}),
        id: biz.id,
        status: biz.status,
        subscription: biz.subscription,
      },
      subscription: biz.subscription,
      entitlements: biz.subscription.entitlements,
    });
  }, [biz?.id, biz?.status, biz?.subscription, setUser, user]);

  // Staff bypass business status checks — they just need to be linked to a business
  if (user?.roleId === ROLES.STAFF) return children;
  if (user?.roleId !== ROLES.BUSINESS) return children;

  // Kiểm tra xác thực email — nếu chưa xác thực → redirect đến trang check-email
  if (user && !user.emailVerified) {
    return <Navigate to="/check-email" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black" />
      </div>
    );
  }

  // Handle 404 (no business profile) - useBusinessProfile returns null on 404
  if (!business) {
    return <Navigate to={BUSINESS_ROUTES.REGISTER} replace />;
  }

  if (!allowWhenPendingOrRejected) {
    if (biz?.status === BUSINESS_STATUS.PENDING)
      return <BusinessPendingView />;
    if (biz?.status === BUSINESS_STATUS.REJECTED)
      return <BusinessRejectedView reason={biz?.rejectionReason} />;
    if (biz?.status === BUSINESS_STATUS.SUSPENDED)
      return <BusinessSuspendedView />;
    if (biz?.status === BUSINESS_STATUS.TERMINATED)
      return <BusinessTerminatedView reason={biz?.terminationReason} />;
    if (biz?.status === BUSINESS_STATUS.SUSPICIOUS)
      return <BusinessSuspiciousView />;
    if (
      biz?.status === BUSINESS_STATUS.APPROVED &&
      !biz?.contractSigned
    ) {
      return <Navigate to={BUSINESS_ROUTES.PROFILE_CONTRACT} replace />;
    }
  }

  return children;
};

export default BusinessGuard;
