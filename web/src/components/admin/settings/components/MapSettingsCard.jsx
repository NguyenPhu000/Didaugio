import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";
import { useTranslation } from "react-i18next";

const MapSettingsCard = ({ value, onChange }) => {
  const { t } = useTranslation();
  return (
    <Card className="rounded-none border-black bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-black uppercase tracking-wide">
          {t("settings.map.title")}
        </CardTitle>
        <CardDescription className="font-mono text-xs uppercase tracking-wider text-gray-500">
          {t("settings.map.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Input
            type="number"
            step="0.0001"
            className="rounded-none border-black"
            value={value.latitude}
            onChange={(e) => onChange("latitude", e.target.value)}
            placeholder="Latitude"
          />
          <Input
            type="number"
            step="0.0001"
            className="rounded-none border-black"
            value={value.longitude}
            onChange={(e) => onChange("longitude", e.target.value)}
            placeholder="Longitude"
          />
          <Input
            type="number"
            min="1"
            max="22"
            className="rounded-none border-black"
            value={value.zoom}
            onChange={(e) => onChange("zoom", e.target.value)}
            placeholder="Zoom"
          />
        </div>
        <div className="border border-black bg-gray-50 p-3 font-mono text-xs">
          CENTER: [{value.latitude}, {value.longitude}] · ZOOM: {value.zoom}
        </div>
      </CardContent>
    </Card>
  );
};

export default MapSettingsCard;
