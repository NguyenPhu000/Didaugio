import React, { memo } from "react";
import AetherBentoCard from "@/components/business/AetherBentoCard";
import { formatMoney } from "@/utils/formatters";

export const EarningsMetricsGrid = memo(({ earnings }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
      <AetherBentoCard
        title="Số dư khả dụng"
        subtitle="Số tiền có thể yêu cầu rút ngay"
        value={formatMoney(earnings.availableBalance || 0)}
        variant="peach"
      />

      <AetherBentoCard
        title="Tổng doanh thu"
        subtitle="Doanh số tích lũy từ trước đến nay"
        value={formatMoney(earnings.totalEarnings || 0)}
        variant="blue"
      />

      <AetherBentoCard
        title="Đang chờ xử lý"
        subtitle="Yêu cầu rút tiền đang được kế toán duyệt"
        value={formatMoney(earnings.pendingPayouts || 0)}
        variant="gray"
      />

      <AetherBentoCard
        title="Đã rút thành công"
        subtitle="Tổng số tiền đã giải ngân về tài khoản"
        value={formatMoney(earnings.completedPayouts || 0)}
        variant="mint"
      />
    </div>
  );
});

EarningsMetricsGrid.displayName = "EarningsMetricsGrid";
export default EarningsMetricsGrid;
