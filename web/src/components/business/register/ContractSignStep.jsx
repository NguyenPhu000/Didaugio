import React, { memo } from "react";
import { FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const ContractSignStep = memo(({ signedContract, setSignOpen }) => {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/70 bg-muted/20 p-5 space-y-4">
        <div className="flex items-center gap-2 text-foreground font-bold text-base">
          <FileSignature className="h-5 w-5 text-amber-500" />
          <h4>Hợp đồng hợp tác Doanh nghiệp</h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          Vui lòng thực hiện ký hợp đồng hợp tác dịch vụ trực tuyến. Hợp đồng mã
          hóa PDF kèm chữ ký điện tử sẽ được sinh tự động ngay sau khi bạn hoàn
          tất.
        </p>

        <div className="p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-xs text-muted-foreground block">
              Trạng thái hợp đồng:
            </span>
            <span
              className={cn(
                "text-sm font-bold mt-0.5 block",
                signedContract ? "text-emerald-600" : "text-amber-600"
              )}
            >
              {signedContract ? "Đã ký thành công" : "Chưa ký"}
            </span>
          </div>

          <Button
            type="button"
            onClick={() => setSignOpen(true)}
            className="bg-[#F3E600] text-black font-black uppercase tracking-wide hover:bg-black hover:text-[#F3E600] border border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] transition-all px-6 py-2.5 cursor-pointer"
          >
            {signedContract ? "Xem / Ký lại hợp đồng" : "Ký hợp đồng ngay"}
          </Button>
        </div>
      </div>
    </div>
  );
});

ContractSignStep.displayName = "ContractSignStep";
export default ContractSignStep;
