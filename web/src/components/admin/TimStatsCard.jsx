/**
 * Thẻ thống kê kiểu T.I.M (viền đen, số lớn, watermark icon) — dùng chung admin.
 */
export default function TimStatsCard({
  title,
  value,
  icon: Icon,
  serial,
  color = "bg-white",
  textColor = "text-black",
}) {
  return (
    <div
      className={`border border-black p-5 relative overflow-hidden group hover:shadow-hard transition-all ${color}`}
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-10 pointer-events-none">
        <Icon className="w-32 h-32" />
      </div>
      <div className="relative z-10 flex flex-col h-full justify-between gap-6">
        <div className="flex justify-between items-start">
          <div className="px-2 py-0.5 border border-black bg-white text-black font-mono text-xs font-bold tracking-widest">
            {serial}
          </div>
          <Icon className={`w-6 h-6 ${textColor}`} />
        </div>
        <div>
          <div
            className={`text-4xl md:text-5xl font-black tracking-tighter mb-1 ${textColor}`}
          >
            {value}
          </div>
          <div className="font-mono text-[11px] font-bold uppercase tracking-widest text-gray-700">
            {title}
          </div>
        </div>
      </div>
    </div>
  );
}
