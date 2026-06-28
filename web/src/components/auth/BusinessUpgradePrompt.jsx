import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/authStore";
import { authService } from "@/apis/authService";
import { BUSINESS_ROUTES } from "@/constants/routes";

export default function BusinessUpgradePrompt() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user, setAuth } = useAuthStore();

  const handleUpgrade = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.upgradeToBusiness();

      if (response.success) {
        // Update auth store with new user data
        const { accessToken, refreshToken } = useAuthStore.getState();
        setAuth(
          response.data.user,
          response.data.accessToken || accessToken,
          response.data.refreshToken || refreshToken,
        );

        toast.success("Nâng cấp thành công! Vui lòng đăng ký doanh nghiệp.");
        // Navigate to business registration
        navigate(BUSINESS_ROUTES.REGISTER, { replace: true });
      }
    } catch (err) {
      const errorCode = err.response?.data?.errorCode || err.errorCode;
      if (errorCode === "EMAIL_NOT_VERIFIED") {
        navigate(`/check-email?email=${encodeURIComponent(user?.email || "")}`, {
          replace: true,
        });
        return;
      }

      setError(
        err.response?.data?.message ||
          "Có lỗi xảy ra khi nâng cấp tài khoản. Vui lòng thử lại."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 bg-blue-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-blue-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Đăng ký Doanh nghiệp
        </h1>

        {/* Description */}
        <p className="text-gray-600 mb-2">
          Xin chào <span className="font-semibold text-gray-800">{user?.profile?.fullName || user?.username}</span>!
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Bạn đang sử dụng tài khoản người dùng. Để đăng ký doanh nghiệp trên
          hệ thống, bạn cần nâng cấp tài khoản lên loại Doanh nghiệp.
        </p>

        {/* Benefits */}
        <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm font-semibold text-blue-800 mb-3">
            Lợi ích khi trở thành Doanh nghiệp:
          </p>
          <ul className="space-y-2">
            {[
              "Quản lý dịch vụ và đặt chỗ",
              "Theo dõi doanh thu và thanh toán",
              "Tiếp cận hàng nghìn khách hàng",
              "Công cụ quản lý chuyên nghiệp",
            ].map((benefit, index) => (
              <li
                key={index}
                className="flex items-start gap-2 text-sm text-blue-700"
              >
                <svg
                  className="w-4 h-4 mt-0.5 text-blue-500 flex-shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <button
          onClick={handleUpgrade}
          disabled={isLoading}
          className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-xl transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Đang nâng cấp...
            </>
          ) : (
            <>
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
              Nâng cấp và Đăng ký Doanh nghiệp
            </>
          )}
        </button>

        <p className="text-xs text-gray-400 mt-4">
          Nâng cấp là miễn phí. Bạn sẽ được chuyển đến trang đăng ký doanh
          nghiệp ngay sau khi nâng cấp.
        </p>
      </div>
    </div>
  );
}
