import { ChevronDown, ChevronRight, MapPin } from "lucide-react";

const PlaceAccordion = ({
  title,
  subtitle,
  count,
  countLabel,
  preview = [],
  expanded,
  onToggle,
  actions,
  children,
}) => {
  return (
    <section className="bg-white border-4 border-black">
      <div className="p-4 border-b-2 border-black bg-gray-50">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            onClick={onToggle}
            className="flex items-center gap-3 text-left w-full md:w-auto"
          >
            <span className="w-8 h-8 border-2 border-black bg-white flex items-center justify-center shrink-0">
              {expanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
            <div>
              <p className="font-black uppercase tracking-wide text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {title}
              </p>
              {subtitle && (
                <p className="font-mono text-[11px] text-gray-500 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs border-2 border-black px-2 py-1 bg-white">
              {count} {countLabel}
            </span>
            {preview.map((item) => (
              <span
                key={item.label}
                className="font-mono text-[11px] border border-black px-2 py-1"
              >
                {item.label}: {item.value}
              </span>
            ))}
          </div>
        </div>

        {actions && actions.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">{actions}</div>
        )}
      </div>

      {expanded && <div className="p-4 space-y-3">{children}</div>}
    </section>
  );
};

export default PlaceAccordion;
