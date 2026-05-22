import { Input, Checkbox, Card, CardHeader, CardTitle, CardDescription, CardContent, Label } from "@/components/ui";
import { CalendarClock } from "lucide-react";

const BookingRulesCard = ({ value, onChange }) => (
  <Card className="rounded-none border-black bg-white">
    <CardHeader className="pb-2">
      <CardTitle className="text-base font-black uppercase tracking-wide flex items-center gap-2">
        <CalendarClock className="h-4 w-4" />
        2) QUY TẮC ĐẶT LỊCH
      </CardTitle>
      <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
        Cấu hình giới hạn và tự động duyệt
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="font-mono text-[11px] uppercase">
            Đặt trước tối đa (ngày)
          </Label>
          <Input
            type="number"
            min={1}
            max={365}
            value={value.maxAdvanceDays ?? 30}
            onChange={(e) => onChange("maxAdvanceDays", e.target.value)}
            className="rounded-none border-black"
          />
        </div>
        <div className="space-y-1">
          <Label className="font-mono text-[11px] uppercase">
            Thời gian đặt trước tối thiểu (phút)
          </Label>
          <Input
            type="number"
            min={0}
            max={1440}
            value={value.minLeadMinutes ?? 0}
            onChange={(e) => onChange("minLeadMinutes", e.target.value)}
            className="rounded-none border-black"
          />
        </div>
      </div>
      <div className="flex items-center justify-between border border-black px-3 py-2">
        <span className="font-mono text-[11px] uppercase">
          Cho phép overbooking
        </span>
        <Checkbox
          checked={!!value.allowOverbooking}
          onCheckedChange={(c) => onChange("allowOverbooking", c === true)}
          className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
        />
      </div>
      <div className="flex items-center justify-between border border-black px-3 py-2">
        <span className="font-mono text-[11px] uppercase">
          Tự động duyệt đặt chỗ
        </span>
        <Checkbox
          checked={!!value.autoApprove}
          onCheckedChange={(c) => onChange("autoApprove", c === true)}
          className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
        />
      </div>
    </CardContent>
  </Card>
);

export default BookingRulesCard;
