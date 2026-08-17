export const formatCurrency = (amount) =>
  `${new Intl.NumberFormat("vi-VN").format(Number(amount) || 0)}đ`;

export const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const GATEWAY_CONFIG = {
  VNPAY: { label: "VNPAY", color: "bg-blue-100 text-blue-700 border-blue-200" },
  MOMO: { label: "MoMo", color: "bg-pink-100 text-pink-700 border-pink-200" },
  SEPAY: { label: "SePay", color: "bg-indigo-100 text-indigo-700 border-indigo-200" },
  manual: {
    label: "Thủ công",
    color: "bg-gray-100 text-gray-700 border-gray-200",
  },
};

export const STATUS_CONFIG = {
  paid: {
    label: "Chờ xử lý",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  partially_refunded: {
    label: "Hoàn một phần",
    className: "bg-sky-100 text-sky-800 border-sky-200",
  },
  fully_refunded: {
    label: "Đã hoàn tiền",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  rejected: {
    label: "Đã từ chối",
    className: "bg-rose-100 text-rose-800 border-rose-200",
  },
};

export function getPaymentStatus(payment) {
  if (payment?.refundReason?.startsWith("REJECTED:")) return "rejected";
  return payment?.status || "paid";
}

export function getGatewayBadge(paymentMethod) {
  return (
    GATEWAY_CONFIG[paymentMethod] || {
      label: paymentMethod || "-",
      color: "bg-gray-100 text-gray-700 border-gray-200",
    }
  );
}

export function buildTimeline(payment) {
  const rejectedReason = payment?.refundReason?.startsWith("REJECTED:")
    ? payment.refundReason.replace(/^REJECTED:/, "").trim()
    : null;

  const items = [
    {
      key: "created",
      title: "Tạo giao dịch",
      date: payment?.createdAt,
      tone: "bg-slate-400",
      description: payment?.transactionRef || "Khởi tạo thanh toán",
    },
  ];

  if (payment?.paidAt) {
    items.push({
      key: "paid",
      title: "Thanh toán thành công",
      date: payment.paidAt,
      tone: "bg-emerald-500",
      description: `${formatCurrency(payment.amount)} qua ${payment.paymentMethod || "cổng thanh toán"}`,
    });
  }

  if (rejectedReason) {
    items.push({
      key: "rejected",
      title: "Từ chối hoàn tiền",
      date: payment.updatedAt,
      tone: "bg-rose-500",
      description: rejectedReason,
    });
  }

  if (payment?.refundedAt) {
    items.push({
      key: "refunded",
      title:
        payment.status === "partially_refunded"
          ? "Hoàn tiền một phần"
          : "Hoàn tiền toàn phần",
      date: payment.refundedAt,
      tone: "bg-blue-500",
      description: `${formatCurrency(payment.refundAmount)}${payment.refundReason ? ` - ${payment.refundReason}` : ""}`,
    });
  }

  return items;
}
