import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { BUSINESS_ROUTES } from "@/constants/routes";

export default function BusinessWelcomePage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const handleGetStarted = () => {
    navigate(BUSINESS_ROUTES.DASHBOARD);
  };

  const handleViewProfile = () => {
    navigate(BUSINESS_ROUTES.PROFILE);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-blue-50 to-indigo-100 p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-r from-green-500 to-blue-600 p-8 text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
            <svg
              className="w-10 h-10 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Chào mừng bạn! 🎉
          </h1>
          <p className="text-white/90 text-lg">
            Đăng ký doanh nghiệp thành công
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-6">
            <p className="text-gray-600 mb-2">
              Xin chào{" "}
              <span className="font-semibold text-gray-800">
                {user?.profile?.fullName || user?.username}
              </span>
              !
            </p>
            <p className="text-gray-500 text-sm">
              Hồ sơ doanh nghiệp của bạn đã được gửi và đang chờ phê duyệt từ
              quản trị viên. Chúng tôi sẽ thông báo cho bạn khi hồ sơ được duyệt.
            </p>
          </div>

          {/* Status Card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <svg
                  className="w-5 h-5 text-amber-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-amber-800 text-sm">
                  Trạng thái: Chờ phê duyệt
                </p>
                <p className="text-amber-600 text-xs mt-1">
                  Hồ sơ đang được xem xét. Thời gian xử lý thường từ 1-3 ngày
                  làm việc.
                </p>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-800 mb-3">
              Các bước tiếp theo:
            </h3>
            <ul className="space-y-3">
              {[
                {
                  step: 1,
                  title: "Chờ phê duyệt",
                  desc: "Quản trị viên sẽ xem xét hồ sơ của bạn",
                  icon: "⏳",
                },
                {
                  step: 2,
                  title: "Ký hợp đồng",
                  desc: "Sau khi được duyệt, bạn cần ký hợp đồng điện tử",
                  icon: "📝",
                },
                {
                  step: 3,
                  title: "Bắt đầu kinh doanh",
                  desc: "Quản lý dịch vụ, đặt chỗ và doanh thu",
                  icon: "🚀",
                },
              ].map((item) => (
                <li key={item.step} className="flex items-start gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">
                      {item.title}
                    </p>
                    <p className="text-gray-500 text-xs">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleGetStarted}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors duration-200"
            >
              Vào Dashboard
            </button>
            <button
              onClick={handleViewProfile}
              className="w-full py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors duration-200"
            >
              Xem hồ sơ doanh nghiệp
            </button>
          </div>

          <p className="text-xs text-gray-400 text-center mt-4">
            Nếu có thắc mắc, vui lòng liên hệ hỗ trợ qua email support@didaugio.vn
          </p>
        </div>
      </div>
    </div>
  );
}
