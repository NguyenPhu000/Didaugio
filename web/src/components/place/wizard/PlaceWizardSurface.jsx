import { useEffect } from "react";
import { cn } from "@/lib/utils";

export const WizardPanel = ({ className, children, ...props }) => (
  <section
    className={cn(
      "rounded-[24px] border border-black/10 bg-[#FFFEFB] shadow-[0_24px_70px_rgba(32,28,20,0.08)]",
      className,
    )}
    {...props}
  >
    {children}
  </section>
);

export const WizardSectionHeading = ({ icon: Icon, title, description }) => (
  <div className="flex items-start gap-3">
    {Icon ? (
      <Icon aria-hidden="true" className="mt-0.5 h-5 w-5 text-[#11110F]" />
    ) : null}
    <div>
      <h2 className="text-base font-semibold tracking-[-0.01em] text-[#11110F]">
        {title}
      </h2>
      {description ? (
        <p className="mt-1 text-sm leading-6 text-[#6B675F]">{description}</p>
      ) : null}
    </div>
  </div>
);

export const WizardActions = ({ className, children }) => (
  <div
    className={cn(
      "sticky bottom-4 z-20 flex items-center justify-between rounded-[20px] border border-black/10 bg-[#FFFEFB]/95 p-3 shadow-xl backdrop-blur",
      className,
    )}
  >
    {children}
  </div>
);

export const useWizardEntrance = (scopeRef, dependency) => {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const root = scopeRef?.current || document;
    const elements = root.querySelectorAll("[data-wizard-reveal]");
    if (!elements.length) return;

    elements.forEach((el, index) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(18px)";
      el.style.transition = `opacity 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.07}s, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.07}s`;
    });

    const raf = requestAnimationFrame(() => {
      elements.forEach((el) => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      });
    });

    return () => cancelAnimationFrame(raf);
  }, [scopeRef, dependency]);
};
