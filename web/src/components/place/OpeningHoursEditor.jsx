import { useState } from "react";
import { Plus, Trash2, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DAYS_OF_WEEK } from "@/constants/placeConstants";

/**
 * OPENING HOURS EDITOR
 * Component để quản lý giờ mở cửa theo từng ngày trong tuần
 */

// Map server format to display format
const DAYS_MAP = DAYS_OF_WEEK.map((day, index) => ({
  value: index, // Sunday=0, Monday=1, etc.
  label: day.label,
}));

const OpeningHoursEditor = ({ value = [], onChange }) => {
  const [is24Hours, setIs24Hours] = useState(false);
  const [allDaysSame, setAllDaysSame] = useState(false);

  const handleAddSlot = () => {
    const newSlot = {
      dayOfWeek: 1, // Monday
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
      alert("Vui lòng thêm ít nhất một khung giờ");
      return;
    }

    const template = value[0];
    const newSlots = DAYS_MAP.map((day) => ({
      dayOfWeek: day.value,
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

  const getDayLabel = (dayOfWeek) => {
    return DAYS_MAP.find((d) => d.value === dayOfWeek)?.label || "N/A";
  };

  // Group by day for display
  const groupedByDay = value.reduce((acc, slot) => {
    if (!acc[slot.dayOfWeek]) {
      acc[slot.dayOfWeek] = [];
    }
    acc[slot.dayOfWeek].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Giờ mở cửa</Label>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleApplyToAllDays}
            disabled={value.length === 0}
          >
            Áp dụng cho tất cả các ngày
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSlot}
          >
            <Plus className="mr-2 h-4 w-4" />
            Thêm khung giờ
          </Button>
        </div>
      </div>

      {/* Quick Options */}
      <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="24hours"
            checked={is24Hours}
            onCheckedChange={handleSet24Hours}
          />
          <label
            htmlFor="24hours"
            className="text-sm font-medium cursor-pointer"
          >
            Mở cửa 24/7
          </label>
        </div>
      </div>

      {/* Opening Hours List */}
      {value.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed rounded-lg">
          <Clock className="h-12 w-12 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-muted-foreground">
            Chưa có giờ mở cửa. Nhấn "Thêm khung giờ" để thêm.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {value.map((slot, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 border rounded-lg"
            >
              {/* Day of Week */}
              <Select
                value={slot.dayOfWeek.toString()}
                onValueChange={(val) =>
                  handleUpdateSlot(index, "dayOfWeek", parseInt(val))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DAYS_MAP.map((day) => (
                    <SelectItem key={day.value} value={day.value.toString()}>
                      {day.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Is Closed Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={`closed-${index}`}
                  checked={slot.isClosed}
                  onCheckedChange={(checked) =>
                    handleUpdateSlot(index, "isClosed", checked)
                  }
                />
                <label
                  htmlFor={`closed-${index}`}
                  className="text-sm cursor-pointer"
                >
                  Đóng cửa
                </label>
              </div>

              {/* Time inputs */}
              {!slot.isClosed && (
                <>
                  <Input
                    type="time"
                    value={slot.openTime}
                    onChange={(e) =>
                      handleUpdateSlot(index, "openTime", e.target.value)
                    }
                    className="w-32"
                  />
                  <span className="text-muted-foreground">đến</span>
                  <Input
                    type="time"
                    value={slot.closeTime}
                    onChange={(e) =>
                      handleUpdateSlot(index, "closeTime", e.target.value)
                    }
                    className="w-32"
                  />
                </>
              )}

              {/* Remove button */}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveSlot(index)}
                className="ml-auto"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      {value.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {is24Hours
            ? "Địa điểm mở cửa 24/7"
            : `${value.length} khung giờ đã thiết lập`}
        </div>
      )}
    </div>
  );
};

export default OpeningHoursEditor;
