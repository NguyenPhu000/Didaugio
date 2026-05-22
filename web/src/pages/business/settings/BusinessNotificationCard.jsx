import { Checkbox, Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui";
import { Bell } from "lucide-react";

const TOGGLES = [
  ["newBookingEmail", "Email khi có đặt chỗ mới"],
  ["newBookingPush", "Push khi có đặt chỗ mới"],
  ["newReviewEmail", "Email khi có đánh giá mới"],
  ["newReviewPush", "Push khi có đánh giá mới"],
  ["bookingCancelledEmail", "Email khi đặt chỗ bị hủy"],
];

const BusinessNotificationCard = ({ value, onChange }) => (
  <Card className="rounded-none border-black bg-white">
    <CardHeader className="pb-2">
      <CardTitle className="text-base font-black uppercase tracking-wide flex items-center gap-2">
        <Bell className="h-4 w-4" />
        3) THÔNG BÁO DOANH NGHIỆP
      </CardTitle>
      <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
        Cấu hình thông báo cho doanh nghiệp
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-2">
      {TOGGLES.map(([key, label]) => (
        <div
          key={key}
          className="flex items-center justify-between border border-black px-3 py-2"
        >
          <span className="font-mono text-[11px] uppercase">{label}</span>
          <Checkbox
            checked={!!value[key]}
            onCheckedChange={(c) => onChange(key, c === true)}
            className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
          />
        </div>
      ))}
    </CardContent>
  </Card>
);

export default BusinessNotificationCard;
