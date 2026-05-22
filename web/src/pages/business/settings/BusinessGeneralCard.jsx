import { Input, Textarea, Card, CardHeader, CardTitle, CardDescription, CardContent, Label } from "@/components/ui";
import { Building2 } from "lucide-react";

const BusinessGeneralCard = ({ value, onChange }) => (
  <Card className="rounded-none border-black bg-white">
    <CardHeader className="pb-2">
      <CardTitle className="text-base font-black uppercase tracking-wide flex items-center gap-2">
        <Building2 className="h-4 w-4" />
        1) THÔNG TIN DOANH NGHIỆP
      </CardTitle>
      <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
        Tên hiển thị và mô tả doanh nghiệp
      </CardDescription>
    </CardHeader>
    <CardContent className="space-y-3">
      <div className="space-y-1">
        <Label className="font-mono text-[11px] uppercase">Tên hiển thị</Label>
        <Input
          value={value.displayName || ""}
          onChange={(e) => onChange("displayName", e.target.value)}
          placeholder="Tên doanh nghiệp của bạn"
          className="rounded-none border-black"
        />
      </div>
      <div className="space-y-1">
        <Label className="font-mono text-[11px] uppercase">Mô tả</Label>
        <Textarea
          value={value.description || ""}
          onChange={(e) => onChange("description", e.target.value)}
          placeholder="Mô tả ngắn về doanh nghiệp"
          rows={3}
          className="rounded-none border-black focus-visible:ring-0"
        />
      </div>
      <div className="space-y-1">
        <Label className="font-mono text-[11px] uppercase">Logo URL</Label>
        <Input
          value={value.logoUrl || ""}
          onChange={(e) => onChange("logoUrl", e.target.value)}
          placeholder="https://..."
          className="rounded-none border-black"
        />
      </div>
    </CardContent>
  </Card>
);

export default BusinessGeneralCard;
