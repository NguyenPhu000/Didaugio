import FeatureFlagToggle from "@/components/settings/FeatureFlagToggle";
import SettingsSection from "@/components/settings/SettingsSection";

const FLAG_METADATA = {
  aiAssistant: {
    name: "Trợ lý AI",
    description: "Gợi ý địa điểm và trả lời câu hỏi bằng AI.",
    critical: false,
  },
  mapModule: {
    name: "Module bản đồ",
    description: "Bật bản đồ tương tác dùng MapLibre GL.",
    critical: false,
  },
  voucherSystem: {
    name: "Hệ thống Voucher",
    description: "Quản lý mã giảm giá và khuyến mãi.",
    critical: false,
  },
  payoutSystem: {
    name: "Hệ thống rút tiền",
    description: "Quản lý rút tiền cho doanh nghiệp.",
    critical: false,
  },
  reviewModeration: {
    name: "Kiểm duyệt đánh giá",
    description: "Tự động kiểm duyệt đánh giá người dùng.",
    critical: false,
  },
  pushNotifications: {
    name: "Thông báo đẩy",
    description: "Gửi thông báo đẩy đến người dùng.",
    critical: false,
  },
  maintenanceMode: {
    name: "Chế độ bảo trì",
    description: "Tạm ngưng hệ thống để bảo trì.",
    critical: true,
  },
};

const FeatureFlagsTabContent = ({ flags, onToggle, loading }) => (
  <SettingsSection
    title="Feature flags"
    description="Các công tắc ở đây được lưu ngay khi bật hoặc tắt, không chờ nút Lưu cài đặt."
  >
    <div className="space-y-2">
      {Object.entries(FLAG_METADATA).map(([key, meta]) => {
        const flag = flags[key] || { enabled: false, percentageRollout: 100 };
        return (
          <FeatureFlagToggle
            key={key}
            name={meta.name}
            description={meta.description}
            enabled={flag.enabled}
            percentageRollout={flag.percentageRollout}
            critical={meta.critical}
            onToggle={(enabled) => onToggle(key, enabled)}
            loading={loading}
          />
        );
      })}
    </div>
  </SettingsSection>
);

export default FeatureFlagsTabContent;
