import { useState } from "react";
import { DollarSign } from "lucide-react";
import { Label } from "@/components/ui/Label";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * PRICE RANGE SLIDER
 * Component để chọn mức giá và khoảng giá
 */

const PRICE_RANGES = [
  {
    value: "cheap",
    label: "Bình dân",
    icon: "💰",
    description: "Dưới 100k/người",
    color: "text-green-600",
  },
  {
    value: "medium",
    label: "Trung bình",
    icon: "💰💰",
    description: "100k - 300k/người",
    color: "text-yellow-600",
  },
  {
    value: "expensive",
    label: "Sang trọng",
    icon: "💰💰💰",
    description: "Trên 300k/người",
    color: "text-red-600",
  },
];

const PriceRangeSlider = ({
  priceRange,
  priceFrom,
  priceTo,
  onChange,
  error,
}) => {
  const [showCustom, setShowCustom] = useState(!!priceFrom || !!priceTo);

  const handleRangeChange = (range) => {
    onChange({ priceRange: range, priceFrom: null, priceTo: null });
    setShowCustom(false);
  };

  const handleCustomPriceChange = (field, value) => {
    const numValue = value ? parseInt(value) : null;
    onChange({
      priceRange: priceRange || "medium",
      [field]: numValue,
    });
  };

  return (
    <div className="space-y-4">
      <Label>Mức giá</Label>

      {/* Price Range Options */}
      <div className="grid grid-cols-3 gap-3">
        {PRICE_RANGES.map((range) => (
          <button
            key={range.value}
            type="button"
            onClick={() => handleRangeChange(range.value)}
            className={cn(
              "p-4 border-2 rounded-lg text-left transition-all hover:border-primary",
              priceRange === range.value
                ? "border-primary bg-primary/5"
                : "border-gray-200"
            )}
          >
            <div className="text-2xl mb-2">{range.icon}</div>
            <div className="font-semibold text-sm mb-1">{range.label}</div>
            <div className="text-xs text-muted-foreground">
              {range.description}
            </div>
          </button>
        ))}
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Custom Price Range */}
      <div className="space-y-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setShowCustom(!showCustom)}
        >
          {showCustom ? "Ẩn" : "Nhập"} khoảng giá cụ thể
        </Button>

        {showCustom && (
          <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
            <div className="space-y-2">
              <Label htmlFor="priceFrom">Giá từ (VNĐ)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="priceFrom"
                  type="number"
                  placeholder="50,000"
                  value={priceFrom || ""}
                  onChange={(e) =>
                    handleCustomPriceChange("priceFrom", e.target.value)
                  }
                  className="pl-9"
                  min="0"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="priceTo">Giá đến (VNĐ)</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="priceTo"
                  type="number"
                  placeholder="200,000"
                  value={priceTo || ""}
                  onChange={(e) =>
                    handleCustomPriceChange("priceTo", e.target.value)
                  }
                  className="pl-9"
                  min="0"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Price Display */}
      {(priceFrom || priceTo) && (
        <div className="text-sm text-muted-foreground">
          Khoảng giá:{" "}
          {priceFrom && priceTo
            ? `${priceFrom.toLocaleString()} - ${priceTo.toLocaleString()} VNĐ`
            : priceFrom
            ? `Từ ${priceFrom.toLocaleString()} VNĐ`
            : priceTo
            ? `Đến ${priceTo.toLocaleString()} VNĐ`
            : ""}
        </div>
      )}
    </div>
  );
};

export default PriceRangeSlider;
