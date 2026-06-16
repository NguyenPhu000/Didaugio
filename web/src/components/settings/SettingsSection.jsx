import { cn } from "@/lib/utils";

const SettingsSection = ({ title, description, children, className }) => (
  <div className={cn("space-y-4", className)}>
    <div className="space-y-1">
      <h3 className="font-black uppercase text-sm tracking-wide">{title}</h3>
      {description && (
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {description}
        </p>
      )}
    </div>
    <div className="space-y-3">{children}</div>
  </div>
);

export default SettingsSection;
