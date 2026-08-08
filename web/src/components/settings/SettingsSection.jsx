import { cn } from "@/lib/utils";

const SettingsSection = ({ title, description, children, className }) => (
  <div className={cn("space-y-5 border-b border-black/10 pb-6 last:border-b-0 last:pb-0", className)}>
    <div className="space-y-1">
      <h3 className="text-base font-semibold tracking-tight text-zinc-950">{title}</h3>
      {description && (
        <p className="text-sm leading-relaxed text-zinc-500">
          {description}
        </p>
      )}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

export default SettingsSection;
