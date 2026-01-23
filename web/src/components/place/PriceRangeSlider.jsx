import { useState } from "react";
import { DollarSign } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { PRICE_RANGES } from "@/constants/placeConstants";
import { formatPrice } from "@/utils/currencyUtils";

/**
 * PRICE RANGE SLIDER
 * Component để chọn mức giá với thanh slider interactive
 */

const PriceRangeSlider = ({
  priceRange,
  priceFrom,
  priceTo,
  onChange,
  error,
}) => {
  const [showCustom, setShowCustom] = useState(!!priceFrom || !!priceTo);
  
  // Slider range: 0đ to 2,000,000đ with 10,000đ steps
  const MAX_PRICE = 2000000;
  const STEP = 10000;
  
  // Convert prices to slider values
  const [sliderValues, setSliderValues] = useState([
    priceFrom || 0,
    priceTo || 500000,
  ]);

  const handleRangeChange = (range) => {
    onChange({ priceRange: range, priceFrom: null, priceTo: null });
    setShowCustom(false);
  };

  const handleSliderChange = (values) => {
    setSliderValues(values);
    onChange({
      priceRange: priceRange || "MODERATE",
      priceFrom: values[0] === 0 ? null : values[0],
      priceTo: values[1] === MAX_PRICE ? null : values[1],
    });
  };

  const handleInputChange = (field, value) => {
    const numValue = value ? parseInt(value) : 0;
    const newValues =
      field === "priceFrom"
        ? [numValue, sliderValues[1]]
        : [sliderValues[0], numValue];
    
    setSliderValues(newValues);
    onChange({
      priceRange: priceRange || "MODERATE",
      priceFrom: newValues[0] === 0 ? null : newValues[0],
      priceTo: newValues[1] === MAX_PRICE ? null : newValues[1],
    });
  };



  return (
    <div className="space-y-6">
      <div>
        <label className="text-sm font-semibold mb-3 block">Mức giá dự kiến</label>

        {/* Price Range Quick Select */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {PRICE_RANGES.map((range) => (
            <button
              key={range.value}
              type="button"
              onClick={() => handleRangeChange(range.value)}
              className={cn(
                "p-3 border-2 rounded-xl text-left transition-all hover:border-primary hover:shadow-md",
                priceRange === range.value && !showCustom
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-gray-200"
              )}
            >
              <div className="text-xl mb-1">{range.icon}</div>
              <div className="font-semibold text-xs mb-0.5">{range.label}</div>
              <div className="text-[10px] text-muted-foreground leading-tight">
                {range.description}
              </div>
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
      </div>

      {/* Custom Price Slider Section */}
      <div className="space-y-4">
        <Button
          type="button"
          variant={showCustom ? "default" : "outline"}
          size="sm"
          onClick={() => setShowCustom(!showCustom)}
          className="w-full"
        >
          {showCustom ? "✓ Đang dùng khoảng giá tùy chỉnh" : "Chọn khoảng giá tùy chỉnh"}
        </Button>

        {showCustom && (
          <div className="p-5 border-2 border-primary/20 rounded-xl bg-primary/5 space-y-5 animate-in slide-in-from-top-2">
            {/* Price Display */}
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {sliderValues[0] === 0 && sliderValues[1] === MAX_PRICE
                  ? "Tất cả mức giá"
                  : sliderValues[0] === 0
                  ? `Dưới ${formatPrice(sliderValues[1])}`
                  : sliderValues[1] === MAX_PRICE
                  ? `Từ ${formatPrice(sliderValues[0])}`
                  : `${formatPrice(sliderValues[0])} - ${formatPrice(
                      sliderValues[1]
                    )}`}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Kéo thanh slider để điều chỉnh
              </p>
            </div>

            {/* Range Slider */}
            <div className="px-2">
              <Slider
                min={0}
                max={MAX_PRICE}
                step={STEP}
                value={sliderValues}
                onValueChange={handleSliderChange}
                className="w-full"
              />
              
              {/* Min/Max Labels */}
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>0đ</span>
                <span>{formatPrice(MAX_PRICE)}+</span>
              </div>
            </div>

            {/* Manual Input Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Giá từ
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={sliderValues[0] || ""}
                    onChange={(e) =>
                      handleInputChange("priceFrom", e.target.value)
                    }
                    className="pl-9"
                    min="0"
                    max={sliderValues[1]}
                    step={STEP}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground">
                  Giá đến
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    placeholder={MAX_PRICE.toString()}
                    value={sliderValues[1] || ""}
                    onChange={(e) => handleInputChange("priceTo", e.target.value)}
                    className="pl-9"
                    min={sliderValues[0]}
                    max={MAX_PRICE}
                    step={STEP}
                  />
                </div>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex flex-wrap gap-2">
              <span className="text-xs text-muted-foreground self-center">
                Nhanh:
              </span>
              {[50000, 100000, 200000, 500000, 1000000].map((amount) => (
                <Button
                  key={amount}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleSliderChange([sliderValues[0], amount])
                  }
                  className="h-7 text-xs"
                >
                  {formatPrice(amount)}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceRangeSlider;
