import React from "react";
import { View, Text } from "react-native";
import { Wallet, Utensils, Ticket, Car } from "lucide-react-native";

export function BudgetEstimator({ summary }) {
  if (!summary) return null;

  // Định dạng hiển thị tiền tệ phẳng sạch sẽ
  const formatCurrency = (val) => {
    return new Intl.NumberFormat("vi-VN").format(val || 0) + "đ";
  };

  const foodCost = summary.costBreakdown?.food?.from ?? 0;
  const ticketsCost = summary.costBreakdown?.tickets?.from ?? 0;
  const transportCost = summary.costBreakdown?.transportEstimated?.from ?? 0;

  return (
    <View className="bg-zinc-950 rounded-2xl p-4 mb-4 shadow-sm border border-zinc-900">
      {/* Khối Tổng tiền nổi bật */}
      <View className="flex-row items-center gap-2 mb-3">
        <Wallet size={16} color="#a1a1aa" />
        <Text className="text-zinc-400 text-[11px] font-semibold uppercase tracking-wider">Chi phí dự kiến</Text>
      </View>
      
      <Text className="text-white text-2xl font-bold tracking-tight mb-4">
        {formatCurrency(summary.totalEstimatedPriceFrom)} - {formatCurrency(summary.totalEstimatedPriceTo)}
      </Text>

      <View className="h-[1px] bg-zinc-800 w-full mb-4" />

      {/* Phân rã mảng hạng mục chi phí (Cost Breakdown) */}
      <View className="gap-3">
        {/* Ăn uống */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Utensils size={14} color="#a1a1aa" />
            <Text className="text-zinc-400 text-xs font-medium">Ẩm thực ước tính</Text>
          </View>
          <Text className="text-zinc-200 text-xs font-semibold">
            {formatCurrency(foodCost)}
          </Text>
        </View>

        {/* Vé tham quan */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Ticket size={14} color="#a1a1aa" />
            <Text className="text-zinc-400 text-xs font-medium">Vé vào cổng / Trải nghiệm</Text>
          </View>
          <Text className="text-zinc-200 text-xs font-semibold">
            {formatCurrency(ticketsCost)}
          </Text>
        </View>

        {/* Di chuyển */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Car size={14} color="#a1a1aa" />
            <Text className="text-zinc-400 text-xs font-medium">Xăng xe / Di chuyển</Text>
          </View>
          <Text className="text-zinc-200 text-xs font-semibold">
            {formatCurrency(transportCost)}
          </Text>
        </View>
      </View>
    </View>
  );
}
