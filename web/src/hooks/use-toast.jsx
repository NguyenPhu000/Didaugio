import { toast as sonnerToast } from "sonner";

/**
 * Custom hook wrapping sonner toast to match Shadcn UI toast pattern
 *
 * Usage:
 * const { toast } = useToast();
 *
 * toast({
 *   title: "Success",
 *   description: "Operation completed",
 *   variant: "default" | "destructive"
 * });
 */
export function useToast() {
  const toast = ({ title, description, variant = "default" }) => {
    const message = (
      <div className="flex flex-col gap-1">
        {title && <div className="font-semibold">{title}</div>}
        {description && <div className="text-sm opacity-90">{description}</div>}
      </div>
    );

    if (variant === "destructive") {
      sonnerToast.error(message, {
        duration: 5000,
      });
    } else {
      sonnerToast.success(message, {
        duration: 3000,
      });
    }
  };

  return { toast };
}
