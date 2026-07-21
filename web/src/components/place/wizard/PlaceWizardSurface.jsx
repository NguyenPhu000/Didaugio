import { useGSAP } from "@gsap/react";
import gsap from "gsap";
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
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

      gsap.fromTo(
        "[data-wizard-reveal]",
        { autoAlpha: 0, y: 18 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.55,
          stagger: 0.07,
          ease: "power3.out",
        },
      );
    },
    { scope: scopeRef, dependencies: [dependency] },
  );
};
