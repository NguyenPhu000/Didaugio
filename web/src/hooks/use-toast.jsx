import { useCallback } from "react";
import { toast as sonnerToast } from "sonner";

/**
 * Custom hook wrapping sonner toast to match Shadcn UI toast pattern
 *
 * `toast` được memo hóa — tránh useEffect(..., [toast]) chạy lại mỗi render.
 */
export function useToast() {
  const toast = useCallback(({ title, description, variant = "default" }) => {
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
  }, []);

  return { toast };
}
