import FeatureFlagToggle from "@/components/settings/FeatureFlagToggle";
import SettingsSection from "@/components/settings/SettingsSection";

const FLAG_METADATA = {
  aiAssistant: {
    name: "Trợ lý AI",
    description: "Tích hợp AI để gợi ý địa điểm và trả lời câu hỏi",
    critical: false,
  },
  mapModule: {
    name: "Module Bản đồ",
    description: "Bản đồ tương tác với MapLibre GL",
    critical: false,
  },
  voucherSystem: {
    name: "Hệ thống Voucher",
    description: "Quản lý mã giảm giá và khuyến mãi",
    critical: false,
  },
  payoutSystem: {
    name: "Hệ thống Rút tiền",
    description: "Quản lý rút tiền cho doanh nghiệp",
    critical: false,
  },
  reviewModeration: {
    name: "Kiểm duyệt Đánh giá",
    description: "Tự động kiểm duyệt đánh giá người dùng",
    critical: false,
  },
  pushNotifications: {
    name: "Thông báo Đẩy",
    description: "Gửi thông báo đẩy đến người dùng",
    critical: false,
  },
  maintenanceMode: {
    name: "Chế độ Bảo trì",
    description: "Tạm ngưng hệ thống để bảo trì",
    critical: true,
  },
};

const FeatureFlagsTabContent = ({ flags, onToggle, loading }) => (
  <SettingsSection
    title="Feature Flags"
    description="Bật/tắt các tính năng và module của hệ thống"
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
