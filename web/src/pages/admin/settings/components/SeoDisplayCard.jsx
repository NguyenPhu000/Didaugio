import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
} from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";

const SeoDisplayCard = ({ value, onChange }) => {
  return (
    <Card className="rounded-none border-black bg-white xl:col-span-2">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black uppercase tracking-wide">
          9) SEO & Hiển thị
        </CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
          Meta defaults, robots, sitemap và custom code header/footer
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          className="rounded-none border-black"
          value={value.metaTitleDefault}
          onChange={(e) => onChange("metaTitleDefault", e.target.value)}
          placeholder="Meta title default"
        />
        <Textarea
          rows={2}
          className="rounded-none border-black focus-visible:ring-0"
          value={value.metaDescriptionDefault}
          onChange={(e) => onChange("metaDescriptionDefault", e.target.value)}
          placeholder="Meta description default"
        />
        <Input
          className="rounded-none border-black"
          value={value.robotsPolicy}
          onChange={(e) => onChange("robotsPolicy", e.target.value)}
          placeholder="Robots policy"
        />
        <div className="flex items-center justify-between border border-black px-3 py-2">
          <span className="font-mono text-[11px] uppercase">
            Sitemap enabled
          </span>
          <Checkbox
            checked={!!value.sitemapEnabled}
            onCheckedChange={(c) => onChange("sitemapEnabled", c === true)}
            className="rounded-none border-black data-[state=checked]:bg-black data-[state=checked]:text-white"
          />
        </div>
        <Textarea
          rows={3}
          className="rounded-none border-black focus-visible:ring-0"
          value={value.headerCustomCode}
          onChange={(e) => onChange("headerCustomCode", e.target.value)}
          placeholder="Header custom code"
        />
        <Textarea
          rows={3}
          className="rounded-none border-black focus-visible:ring-0"
          value={value.footerCustomCode}
          onChange={(e) => onChange("footerCustomCode", e.target.value)}
          placeholder="Footer custom code"
        />
      </CardContent>
    </Card>
  );
};

export default SeoDisplayCard;
