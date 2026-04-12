import { useState } from "react";
import {
  Plus,
  Trash2,
  Clock,
  Calendar,
  Copy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import {
  Button,
  Label,
  Input,
  Checkbox,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { DAYS_OF_WEEK } from "@/constants/placeConstants";
import { cn } from "@/lib/utils";

/**
 * OPENING HOURS EDITOR - T.I.M STYLE (VIETNAMESE)
 * Technical Industrial Minimalism Design
 * Component để quản lý giờ mở cửa theo từng ngày trong tuần
 */

// Map server format to display format
const DAYS_MAP = DAYS_OF_WEEK.map((day, index) => ({
  value: (index + 1) % 7, // 0: Sunday, 1: Monday, ... 6: Saturday
  label: day.label,
  short: day.label.replace("Thứ ", "T").replace("Chủ Nhật", "CN"),
}));

const OpeningHoursEditor = ({ value = [], onChange }) => {
  const [is24Hours, setIs24Hours] = useState(false);

  // Auto-migrate legacy data (7 -> 0 for Sunday)
  if (value.some((slot) => slot.dayOfWeek === 7)) {
    const migrated = value.map((slot) => ({
      ...slot,
      dayOfWeek: slot.dayOfWeek === 7 ? 0 : slot.dayOfWeek,
    }));
    // Use setTimeout to avoid render-cycle state updates
    setTimeout(() => onChange(migrated), 0);
  }

  const handleAddSlot = () => {
    // Find missing days or defaulting to the next day in sequence
    let nextDay = 1; // Default to Monday
    if (value.length > 0) {
      const lastDay = value[value.length - 1].dayOfWeek;
      // Logic: 1->2...->6->0->1
      if (lastDay === 6) {
        nextDay = 0;
      } else if (lastDay === 0) {
        nextDay = 1;
      } else {
        nextDay = lastDay + 1;
      }
    }

    const newSlot = {
      dayOfWeek: nextDay,
      openTime: "09:00",
      closeTime: "22:00",
      isClosed: false,
    };
    onChange([...value, newSlot]);
  };

  const handleUpdateSlot = (index, field, newValue) => {
    const newSlots = [...value];
    newSlots[index] = { ...newSlots[index], [field]: newValue };
    onChange(newSlots);
  };

  const handleRemoveSlot = (index) => {
    const newSlots = value.filter((_, i) => i !== index);
    onChange(newSlots);
  };

  const handleApplyToAllDays = () => {
    if (value.length === 0) {
      alert("LỖI: CHƯA CÓ DỮ LIỆU MẪU. Vui lòng thêm một khung giờ trước.");
      return;
    }

    const template = value[0];
    const newSlots = DAYS_MAP.map((day) => ({
      dayOfWeek: day.value, // Using the mapped value index
      openTime: template.openTime,
      closeTime: template.closeTime,
      isClosed: template.isClosed,
    }));
    onChange(newSlots);
  };

  const handleSet24Hours = (checked) => {
    setIs24Hours(checked);
    if (checked) {
      const newSlots = DAYS_MAP.map((day) => ({
        dayOfWeek: day.value,
        openTime: "00:00",
        closeTime: "23:59",
        isClosed: false,
      }));
      onChange(newSlots);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header Panel */}
      <div className="flex items-center justify-between border-b border-gray-200 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-gray-500" />
          <Label className="text-base font-bold font-mono uppercase tracking-wider">
            Thời gian mở cửa
          </Label>
        </div>
        <div className="flex items-center gap-2">
          {!is24Hours && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSlot}
              className="h-8 border-dashed border-gray-400 hover:border-blue-500 font-mono text-xs uppercase"
            >
              <Plus className="mr-2 h-3 w-3" />
              THÊM_KHUNG_GIỜ
            </Button>
          )}
        </div>
      </div>

      {/* Control Panel */}
      <div className="flex items-center justify-between bg-gray-50 p-3 rounded-sm border border-gray-200">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="24hours"
            checked={is24Hours}
            onCheckedChange={handleSet24Hours}
            className="rounded-sm data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
          />
          <label
            htmlFor="24hours"
            className="text-sm font-bold font-mono cursor-pointer uppercase text-gray-700"
          >
            CHẾ ĐỘ: 24/7
          </label>
        </div>

        {!is24Hours && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleApplyToAllDays}
            disabled={value.length === 0}
            className="h-7 text-xs font-mono text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Copy className="mr-2 h-3 w-3" />
            ĐỒNG_BỘ_TẤT_CẢ
          </Button>
        )}
      </div>

      {/* Schedule Matrix */}
      {value.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-gray-300 rounded-sm bg-gray-50/50">
          <Calendar className="h-10 w-10 mb-3 text-gray-300" />
          <p className="text-sm font-mono text-gray-400 uppercase">
            CHƯA_CÓ_LỊCH_HOẠT_ĐỘNG
          </p>
          <p className="text-xs text-gray-400 mt-1">
            [ Nhấn THÊM_KHUNG_GIỜ để thiết lập ]
          </p>
        </div>
      ) : (
        <div className="border border-gray-200 rounded-sm overflow-hidden">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 bg-black p-2 border-b border-black text-[10px] font-mono font-bold text-white uppercase">
            <div className="col-span-3 pl-2">THỨ</div>
            <div className="col-span-2 text-center">TRẠNG THÁI</div>
            <div className="col-span-6 text-center">KHUNG GIỜ (GIỜ:PHÚT)</div>
            <div className="col-span-1"></div>
          </div>

          {/* Rows */}
          <div className="divide-y divide-gray-100 bg-white">
            {value.map((slot, index) => (
              <div
                key={index}
                className={cn(
                  "grid grid-cols-12 gap-4 p-2 items-center hover:bg-gray-50 transition-colors group",
                  slot.isClosed ? "bg-red-50/20" : "",
                )}
              >
                {/* Day Selector */}
                <div className="col-span-3">
                  <Select
                    value={slot.dayOfWeek.toString()}
                    onValueChange={(val) =>
                      handleUpdateSlot(index, "dayOfWeek", parseInt(val))
                    }
                    disabled={is24Hours}
                  >
                    <SelectTrigger className="h-8 text-xs font-mono border-gray-200 focus:ring-0 focus:border-blue-500 bg-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_MAP.map((day) => (
                        <SelectItem
                          key={day.value}
                          value={day.value.toString()}
                          className="font-mono text-xs"
                        >
                          <span className="font-bold mr-2">{day.short}</span>
                          <span className="text-gray-400">{day.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Toggle - Increased gap via grid gap-4 */}
                <div className="col-span-2 flex justify-center">
                  <div
                    className={cn(
                      "cursor-pointer px-2 py-1 rounded-sm border text-[10px] font-mono font-bold uppercase transition-all w-full text-center hover:opacity-80 select-none",
                      slot.isClosed
                        ? "bg-red-100 text-red-600 border-red-200"
                        : "bg-emerald-100 text-emerald-600 border-emerald-200",
                    )}
                    onClick={() =>
                      !is24Hours &&
                      handleUpdateSlot(index, "isClosed", !slot.isClosed)
                    }
                  >
                    {slot.isClosed ? "ĐÓNG" : "MỞ"}
                  </div>
                </div>

                {/* Time Inputs */}
                <div className="col-span-6 flex items-center gap-4 justify-center">
                  {!slot.isClosed ? (
                    <>
                      <Input
                        type="time"
                        value={slot.openTime || ""}
                        onChange={(e) =>
                          handleUpdateSlot(index, "openTime", e.target.value)
                        }
                        disabled={is24Hours}
                        className="h-8 w-28 text-xs font-mono text-center border-gray-200 focus-visible:ring-0 focus-visible:border-blue-500 px-1"
                      />
                      <span className="text-gray-300 font-mono">-</span>
                      <Input
                        type="time"
                        value={slot.closeTime || ""}
                        onChange={(e) =>
                          handleUpdateSlot(index, "closeTime", e.target.value)
                        }
                        disabled={is24Hours}
                        className="h-8 w-28 text-xs font-mono text-center border-gray-200 focus-visible:ring-0 focus-visible:border-blue-500 px-1"
                      />
                    </>
                  ) : (
                    <div className="text-xs text-gray-400 font-mono italic flex items-center justify-center w-full bg-gray-50 h-8 rounded-sm border border-transparent">
                      -- KHÔNG HOẠT ĐỘNG --
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="col-span-1 flex justify-end">
                  {!is24Hours && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveSlot(index)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-mono pt-1">
        <AlertCircle className="w-3 h-3" />
        <span>
          THÔNG TIN HỆ THỐNG:{" "}
          {is24Hours
            ? "GHI ĐÈ KÍCH HOẠT [24/7]"
            : `${value.length} KHUNG GIỜ ĐÃ CẤU HÌNH`}
        </span>
      </div>
    </div>
  );
};

export default OpeningHoursEditor;
