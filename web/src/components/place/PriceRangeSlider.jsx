import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Banknote } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";
import { PRICE_RANGES } from "@/constants/placeConstants";

const MAX_PRICE = 2000000;
const STEP_PRICE = 10000;

const QUICK_AMOUNTS = [20000, 50000, 100000, 200000, 500000, 1000000];

const formatVnd = (value) => {
  const numericValue = Number(value || 0);
  if (!numericValue) return "0 VND";
  return `${numericValue.toLocaleString("vi-VN")} VND`;
};

const normalizeAmount = (value) => {
  const raw = String(value ?? "");
  const digitsOnly = raw.replace(/\D/g, "");

  return {
    value: digitsOnly ? Number(digitsOnly) : null,
    rejected: raw !== digitsOnly,
  };
};

const clampAmount = (value) => {
  if (!value) return 0;
  return Math.min(Math.max(Number(value), 0), MAX_PRICE);
};

const PriceRangeSlider = ({
  priceRange,
  priceFrom,
  priceTo,
  onChange,
  error,
}) => {
  const { t } = useTranslation();
  const [showCustom, setShowCustom] = useState(!!priceFrom || !!priceTo);
  const [inputWarning, setInputWarning] = useState("");
  const [sliderValues, setSliderValues] = useState([
    clampAmount(priceFrom),
    clampAmount(priceTo || 500000),
  ]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      setSliderValues([clampAmount(priceFrom), clampAmount(priceTo || 500000)]);
    });
    return () => cancelAnimationFrame(id);
  }, [priceFrom, priceTo]);

  const rangeError = useMemo(() => {
    if (priceFrom && priceTo && Number(priceTo) < Number(priceFrom)) {
      return t("admin.placeWizard.price.maxLessThanMin", {
        defaultValue: "Giá tối đa phải lớn hơn hoặc bằng giá tối thiểu.",
      });
    }
    return "";
  }, [priceFrom, priceTo, t]);

  const emitChange = (from, to) => {
    onChange({
      priceRange: priceRange || "MODERATE",
      priceFrom: from || null,
      priceTo: to || null,
    });
  };

  const handleRangeChange = (range) => {
    setInputWarning("");
    setShowCustom(false);
    onChange({ priceRange: range, priceFrom: null, priceTo: null });
  };

  const handleSliderChange = (values) => {
    const nextValues = [clampAmount(values[0]), clampAmount(values[1])];
    setInputWarning("");
    setSliderValues(nextValues);
    emitChange(nextValues[0], nextValues[1]);
  };

  const handleInputChange = (field, rawValue) => {
    const parsed = normalizeAmount(rawValue);
    setInputWarning(
      parsed.rejected
        ? t("admin.placeWizard.price.numericOnly", {
            defaultValue:
              "Chỉ nhập số tiền VND đầy đủ, ví dụ 10000. Không dùng 100k/200kd.",
          })
        : "",
    );

    const realValue = clampAmount(parsed.value);
    let nextValues;

    if (field === "priceFrom") {
      nextValues = [realValue, Math.max(realValue, sliderValues[1])];
    } else {
      nextValues = [Math.min(realValue, sliderValues[0]), realValue];
    }

    setSliderValues(nextValues);
    emitChange(nextValues[0], nextValues[1]);
  };

  const setQuickAmount = (field, amount) => {
    handleInputChange(field, String(amount));
  };

  const displayError = error || inputWarning || rangeError;

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-zinc-950">
              {t("admin.placeWizard.details.priceRange")}
            </p>
            <p className="text-xs text-zinc-500">
              {t("admin.placeWizard.price.helper", {
                defaultValue:
                  "Nhập giá trị VND thật, ví dụ 10000 cho 10.000 VND.",
              })}
            </p>
          </div>
          <Banknote className="h-5 w-5 text-black" />
        </div>

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {PRICE_RANGES.map((range) => {
            const isActive = priceRange === range.value && !showCustom;

            return (
              <button
                key={range.value}
                type="button"
                onClick={() => handleRangeChange(range.value)}
                className={cn(
                  "rounded-xl border px-3 py-3 text-left transition-colors",
                  isActive
                    ? "border-black bg-black text-white"
                    : "border-zinc-200 bg-white text-zinc-950 hover:border-zinc-400",
                )}
              >
                <span className="block text-xs font-semibold uppercase tracking-wide">
                  {range.label}
                </span>
                <span
                  className={cn(
                    "mt-1 block text-[11px]",
                    isActive ? "text-zinc-200" : "text-zinc-500",
                  )}
                >
                  {range.description}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Button
        type="button"
        variant={showCustom ? "default" : "outline"}
        onClick={() => {
          setShowCustom((value) => !value);
          setInputWarning("");
        }}
        className={cn(
          "h-11 w-full rounded-xl border border-black text-sm font-semibold",
          showCustom
            ? "bg-black text-white hover:bg-black/90"
            : "bg-white text-black hover:bg-zinc-50",
        )}
      >
        {showCustom
          ? t("admin.placeWizard.price.hideCustom", {
              defaultValue: "Ẩn khoảng giá tùy chỉnh",
            })
          : t("admin.placeWizard.price.showCustom", {
              defaultValue: "Nhập khoảng giá tùy chỉnh",
            })}
      </Button>

      {showCustom && (
        <div className="space-y-5 rounded-2xl border border-zinc-200 bg-zinc-50/70 p-4 sm:p-5">
          <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr] md:items-start">
            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <span>
                  {t("admin.placeWizard.price.min", { defaultValue: "Tối thiểu" })}
                </span>
                <span className="text-zinc-950">{formatVnd(sliderValues[0])}</span>
              </label>
              <div className="relative">
                <Input
                  inputMode="numeric"
                  value={sliderValues[0] || ""}
                  placeholder="10000"
                  onChange={(event) =>
                    handleInputChange("priceFrom", event.target.value)
                  }
                  className="h-12 rounded-xl border-zinc-300 bg-white pr-16 text-right font-mono text-base"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500">
                  VND
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.slice(0, 4).map((amount) => (
                  <button
                    key={`min-${amount}`}
                    type="button"
                    onClick={() => setQuickAmount("priceFrom", amount)}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-black hover:text-black"
                  >
                    {formatVnd(amount)}
                  </button>
                ))}
              </div>
            </div>

            <div className="hidden pt-10 text-zinc-300 md:block">-</div>

            <div className="space-y-2">
              <label className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-zinc-500">
                <span>
                  {t("admin.placeWizard.price.max", { defaultValue: "Tối đa" })}
                </span>
                <span className="text-zinc-950">{formatVnd(sliderValues[1])}</span>
              </label>
              <div className="relative">
                <Input
                  inputMode="numeric"
                  value={sliderValues[1] || ""}
                  placeholder="200000"
                  onChange={(event) =>
                    handleInputChange("priceTo", event.target.value)
                  }
                  className="h-12 rounded-xl border-zinc-300 bg-white pr-16 text-right font-mono text-base"
                />
                <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-zinc-500">
                  VND
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {QUICK_AMOUNTS.slice(2).map((amount) => (
                  <button
                    key={`max-${amount}`}
                    type="button"
                    onClick={() => setQuickAmount("priceTo", amount)}
                    className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:border-black hover:text-black"
                  >
                    {formatVnd(amount)}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Slider
            value={sliderValues}
            max={MAX_PRICE}
            step={STEP_PRICE}
            minStepsBetweenThumbs={1}
            onValueChange={handleSliderChange}
          />

          {displayError && (
            <p className="flex items-start gap-2 text-sm text-destructive">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{displayError}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default PriceRangeSlider;
