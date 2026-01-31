import { useState, useEffect } from "react";
import { DollarSign } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { PRICE_RANGES } from "@/constants/placeConstants";

/**
 * PRICE RANGE SLIDER V2
 * Component để chọn mức giá với thanh slider interactive
 * Updated: Vietnamese Denomination Support (suffix .000)
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

  // Convert prices to slider values
  const [sliderValues, setSliderValues] = useState([
    priceFrom || 0,
    priceTo || 500000,
  ]);

  // Update slider visual when props change externally
  useEffect(() => {
    if (priceFrom !== undefined && priceTo !== undefined) {
      setSliderValues([priceFrom || 0, priceTo || 500000]);
    }
  }, [priceFrom, priceTo]);

  const handleRangeChange = (range) => {
    onChange({ priceRange: range, priceFrom: 0, priceTo: 0 }); // Reset custom amounts
    setShowCustom(false);
  };

  const handleSliderChange = (values) => {
    setSliderValues(values);
    onChange({
      priceRange: priceRange || "MODERATE",
      priceFrom: values[0],
      priceTo: values[1],
    });
  };

  const handleInputChange = (field, thousandValue) => {
    // User inputs 50 -> means 50,000
    const realValue = thousandValue ? parseInt(thousandValue) * 1000 : 0;

    // Ensure logical constraint
    let newValues;
    if (field === "priceFrom") {
      newValues = [realValue, Math.max(realValue, sliderValues[1])];
    } else {
      newValues = [Math.min(realValue, sliderValues[0]), realValue];
    }

    setSliderValues(newValues);
    onChange({
      priceRange: priceRange || "MODERATE",
      priceFrom: newValues[0],
      priceTo: newValues[1],
    });
  };

  const QUICK_SUGGESTIONS = [
    { label: "20k", val: 20 },
    { label: "50k", val: 50 },
    { label: "100k", val: 100 },
    { label: "200k", val: 200 },
    { label: "500k", val: 500 },
    { label: "1tr", val: 1000 },
  ];

  const setManualValue = (field, kValue) => {
    handleInputChange(field, kValue);
  };

  return (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-bold uppercase tracking-wider mb-3 block">
          MỨC GIÁ DỰ KIẾN
        </label>

        {/* Price Range Quick Select */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-0 border border-black bg-white">
          {PRICE_RANGES.map((range) => (
            <button
              key={range.value}
              type="button"
              onClick={() => handleRangeChange(range.value)}
              className={cn(
                "p-4 text-center transition-all border-r last:border-r-0 border-black hover:bg-black hover:text-white group relative",
                priceRange === range.value && !showCustom
                  ? "bg-black text-white"
                  : "bg-white text-black",
              )}
            >
              <div className="text-sm font-mono font-bold mb-1">
                {range.icon}
              </div>
              <div className="font-bold text-[10px] uppercase tracking-wider mb-1">
                {range.label}
              </div>
              <div
                className={cn(
                  "text-[10px] font-mono opacity-60",
                  priceRange === range.value && !showCustom
                    ? "text-gray-300"
                    : "text-gray-500 group-hover:text-gray-300",
                )}
              >
                {range.description}
              </div>

              {/* Active Indicator */}
              {priceRange === range.value && !showCustom && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-white"></div>
              )}
            </button>
          ))}
        </div>

        {error && (
          <p className="text-sm text-red-500 mt-2 font-mono uppercase">
            ERROR: {error}
          </p>
        )}
      </div>

      {/* Custom Price Button */}
      <div className="space-y-4">
        <Button
          type="button"
          variant={showCustom ? "default" : "outline"}
          onClick={() => setShowCustom(!showCustom)}
          className={cn(
            "w-full rounded-none border border-black font-mono text-xs uppercase tracking-widest h-10 transition-all",
            showCustom
              ? "bg-black text-white hover:bg-black/90"
              : "bg-white text-black hover:bg-gray-100",
          )}
        >
          {showCustom
            ? "[-] ẨN TÙY CHỈNH GIÁ"
            : "[+] CHỌN KHOẢNG GIÁ TÙY CHỈNH"}
        </Button>

        {showCustom && (
          <div className="p-6 border border-black bg-gray-50 animate-in slide-in-from-top-2">
            {/* Inputs */}
            <div className="flex items-center gap-6 mb-6">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-500 flex justify-between">
                  <span>TỐI THIỂU (Min)</span>
                  <span className="text-black font-mono">
                    {sliderValues[0].toLocaleString("vi-VN")} đ
                  </span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={sliderValues[0] > 0 ? sliderValues[0] / 1000 : ""}
                    placeholder="0"
                    onChange={(e) =>
                      handleInputChange("priceFrom", e.target.value)
                    }
                    className="rounded-none border-black font-mono text-right pr-12 text-lg h-12 bg-white"
                  />
                  <span className="absolute right-3 top-3 text-gray-400 font-mono text-base pointer-events-none select-none bg-white pl-1">
                    .000
                  </span>
                </div>
                {/* Quick Set Min */}
                <div className="flex gap-1 flex-wrap">
                  {QUICK_SUGGESTIONS.slice(0, 3).map((opt) => (
                    <button
                      key={`min-${opt.val}`}
                      type="button"
                      onClick={() => setManualValue("priceFrom", opt.val)}
                      className="px-2 py-1 bg-gray-200 hover:bg-black hover:text-white text-[10px] font-mono transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="font-mono pt-4 text-gray-400">-</div>

              <div className="flex-1 space-y-2">
                <label className="text-[10px] uppercase font-bold text-gray-500 flex justify-between">
                  <span>TỐI ĐA (Max)</span>
                  <span className="text-black font-mono">
                    {sliderValues[1].toLocaleString("vi-VN")} đ
                  </span>
                </label>
                <div className="relative">
                  <Input
                    type="number"
                    value={sliderValues[1] > 0 ? sliderValues[1] / 1000 : ""}
                    placeholder="0"
                    onChange={(e) =>
                      handleInputChange("priceTo", e.target.value)
                    }
                    className="rounded-none border-black font-mono text-right pr-12 text-lg h-12 bg-white"
                  />
                  <span className="absolute right-3 top-3 text-gray-400 font-mono text-base pointer-events-none select-none bg-white pl-1">
                    .000
                  </span>
                </div>
                {/* Quick Set Max */}
                <div className="flex gap-1 flex-wrap">
                  {QUICK_SUGGESTIONS.slice(1).map((opt) => (
                    <button
                      key={`max-${opt.val}`}
                      type="button"
                      onClick={() => setManualValue("priceTo", opt.val)}
                      className="px-2 py-1 bg-gray-200 hover:bg-black hover:text-white text-[10px] font-mono transition-colors"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <Slider
              value={sliderValues}
              max={MAX_PRICE}
              step={10000}
              minStepsBetweenThumbs={1}
              onValueChange={handleSliderChange}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceRangeSlider;
