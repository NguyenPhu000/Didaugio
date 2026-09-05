import { Switch } from "@/components/ui/switch";
import SettingsSection from "@/components/settings/SettingsSection";
import SettingSelectField from "./SettingSelectField";

const RADIUS_OPTIONS = [
  { value: "3", label: "3 km (Nội ô đi bộ / xe đạp)" },
  { value: "5", label: "5 km (Tiêu chuẩn khu vực trung tâm)" },
  { value: "10", label: "10 km (Liên quận Ninh Kiều - Bình Thủy - Cái Răng)" },
  { value: "15", label: "15 km (Khu vực miệt vườn Phong Điền)" },
  { value: "25", label: "25 km (Toàn thành phố Cần Thơ)" },
];

const ZOOM_OPTIONS = [
  { value: "11", label: "Mức 11 (Toàn cảnh TP Cần Thơ)" },
  { value: "12", label: "Mức 12 (Bao quát các quận trung tâm)" },
  { value: "13", label: "Mức 13 (Khuyến nghị - Khám phá phố xá)" },
  { value: "14", label: "Mức 14 (Chi tiết địa điểm lân cận)" },
  { value: "15", label: "Mức 15 (Cận cảnh từng ngõ hẻm)" },
];

const MapGisTabContent = ({ value = {}, onChange }) => (
  <div className="flex flex-col justify-between h-full space-y-8">
    <div className="space-y-8">
      <SettingsSection
        title="Bán kính định vị & Thuật toán GPS"
        description="Quy định phạm vi gợi ý địa điểm ăn uống, vui chơi gần du khách trên ứng dụng di động."
      >
        <div className="rounded-2xl bg-[#F9F9FB] p-4 border border-black/[0.02]">
          <SettingSelectField
            id="map-radius"
            label="Bán kính tìm kiếm địa điểm xung quanh du khách"
            value={String(value.defaultRadiusKm || 5)}
            onChange={(v) => onChange("defaultRadiusKm", Number(v))}
            options={RADIUS_OPTIONS}
          />
          <p className="mt-2 text-[11px] text-slate-400">
            Dùng cho màn hình &quot;Địa điểm gần bạn&quot; và tính năng tìm kiếm xung quanh theo vị trí GPS thực tế.
          </p>
        </div>
      </SettingsSection>

      <SettingsSection
        title="Tọa độ trung tâm & Lớp hiển thị bản đồ"
        description="Vị trí khởi tạo mặc định khi du khách mở bản đồ tương tác GIS Cần Thơ."
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl bg-[#F9F9FB] p-4 border border-black/[0.02] space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Vĩ độ trung tâm (Latitude)
            </label>
            <input
              type="number"
              step="0.0001"
              value={value.centerLat ?? 10.0342}
              onChange={(e) => onChange("centerLat", Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all"
            />
            <p className="text-[11px] text-slate-400">Mặc định: 10.0342 (Bến Ninh Kiều)</p>
          </div>

          <div className="rounded-2xl bg-[#F9F9FB] p-4 border border-black/[0.02] space-y-1">
            <label className="block text-xs font-semibold text-slate-700">
              Kinh độ trung tâm (Longitude)
            </label>
            <input
              type="number"
              step="0.0001"
              value={value.centerLng ?? 105.7876}
              onChange={(e) => onChange("centerLng", Number(e.target.value))}
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:ring-2 focus:ring-slate-900/5 transition-all"
            />
            <p className="text-[11px] text-slate-400">Mặc định: 105.7876 (Bến Ninh Kiều)</p>
          </div>

          <div className="rounded-2xl bg-[#F9F9FB] p-4 border border-black/[0.02]">
            <SettingSelectField
              id="map-zoom"
              label="Mức độ thu phóng ban đầu"
              value={String(value.defaultZoom || 13)}
              onChange={(v) => onChange("defaultZoom", Number(v))}
              options={ZOOM_OPTIONS}
            />
            <p className="mt-2 text-[11px] text-slate-400">Tỷ lệ xem khi vừa vào bản đồ.</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#F9F9FB] hover:bg-[#F2F2F7]/80 p-4 border border-black/[0.02] transition-colors">
          <div className="space-y-0.5 pr-4">
            <p className="text-sm font-semibold text-slate-900">
              Hiển thị lớp ranh giới 9 quận / huyện Cần Thơ
            </p>
            <p className="text-xs leading-relaxed text-slate-500 font-normal">
              Vẽ đường biên giới không gian PostGIS giữa Ninh Kiều, Cái Răng, Phong Điền, Bình Thủy, Ô Môn, Thốt Nốt, Cờ Đỏ, Thới Lai, Vĩnh Thạnh.
            </p>
          </div>
          <Switch
            checked={value.showWardBoundaries !== false}
            onCheckedChange={(checked) => onChange("showWardBoundaries", checked)}
          />
        </div>
      </SettingsSection>
    </div>

    <div className="pt-4 flex items-center justify-between text-xs text-slate-400">
      <span>Đồng bộ với MapLibre GL Vector Tiles và dữ liệu không gian PostGIS</span>
      <span>9 quận/huyện TP. Cần Thơ</span>
    </div>
  </div>
);

export default MapGisTabContent;
