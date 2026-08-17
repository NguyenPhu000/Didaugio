import React, { memo } from "react";
import { Layers } from "lucide-react";
import { motion } from "motion/react";

const FunnelChart = ({ data = [] }) => {
  const maxValue = Math.max(1, ...data.map((d) => d.value || 0));

  return (
    <div className="space-y-3">
      {data.map((step, index) => {
        const width = maxValue > 0 ? ((step.value || 0) / maxValue) * 100 : 0;
        const prevValue = data[index - 1]?.value || 0;
        const conversionRate =
          index > 0 && prevValue > 0
            ? (((step.value || 0) / prevValue) * 100).toFixed(1)
            : null;

        return (
          <div key={step.label} className="relative">
            <div className="flex items-center gap-3">
              <span className="w-32 text-xs font-bold text-slate-600 text-right truncate">
                {step.label}
              </span>
              <div className="flex-1 h-10 bg-[#F8F7F3] rounded-xl overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 }}
                  className="h-full rounded-xl flex items-center justify-end pr-3"
                  style={{ backgroundColor: step.color }}
                >
                  <span className="text-xs font-mono font-bold text-white tabular-nums">
                    {step.value.toLocaleString()}
                  </span>
                </motion.div>
              </div>
              {conversionRate && (
                <span className="w-14 text-xs font-mono font-bold text-slate-500 tabular-nums">
                  {conversionRate}%
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ConversionCard = ({ title, fromStep, toStep, rate, count, t }) => (
  <div className="rounded-2xl bg-white border border-black/[0.04] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.03)] space-y-2">
    <div className="flex items-center justify-between">
      <p className="text-xs font-bold text-slate-700">{title}</p>
      <span className="text-xs font-mono font-bold text-slate-900 bg-[#FFFDE6] px-2 py-0.5 rounded-full border border-[#F3E600]/80 tabular-nums">
        {rate}%
      </span>
    </div>
    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium truncate">
      <span>{fromStep}</span>
      <span>→</span>
      <span className="font-semibold text-slate-600">{toStep}</span>
    </div>
    <p className="text-[11px] font-mono text-slate-500 tabular-nums pt-1 border-t border-black/[0.03]">
      ~{count.toLocaleString()} {t("admin.analytics.conversions")}
    </p>
  </div>
);

export const AnalyticsFunnelSection = memo(
  ({ funnelData, conversionRates, t }) => {
    return (
      <div className="space-y-6">
        {/* Funnel Metrics */}
        <section className="rounded-3xl bg-white border border-black/[0.04] p-6 shadow-[0_4px_24px_rgba(0,0,0,0.03)] space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-black/[0.04]">
            <Layers className="h-4 w-4 text-slate-800" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              {t("admin.analytics.productFunnel")}
            </h3>
          </div>
          <FunnelChart data={funnelData} />
        </section>

        {/* Conversion Rates */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {conversionRates.map((rate, i) => (
            <ConversionCard key={i} {...rate} t={t} />
          ))}
        </section>
      </div>
    );
  }
);

AnalyticsFunnelSection.displayName = "AnalyticsFunnelSection";
export default AnalyticsFunnelSection;
