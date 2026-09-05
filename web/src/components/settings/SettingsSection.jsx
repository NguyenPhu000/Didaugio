import { cn } from "@/lib/utils";

const SettingsSection = ({ title, description, children, className }) => (
  <div className={cn("space-y-4", className)}>
    <div className="space-y-1">
      <h3 className="text-base font-semibold tracking-tight text-slate-900">{title}</h3>
      {description && (
        <p className="text-xs leading-relaxed text-slate-500 font-normal">
          {description}
        </p>
      )}
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

export default SettingsSection;
