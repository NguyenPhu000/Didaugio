const DistrictRow = ({ name, count, total, color, active, onClick }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 text-left transition-all ${
        active ? "bg-gray-900 text-white" : "hover:bg-gray-50"
      }`}
    >
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: active ? "#facc15" : color }}
      />
      <span
        className={`flex-1 text-[12px] font-bold uppercase tracking-wide truncate ${active ? "text-white" : "text-gray-700"}`}
      >
        {name}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: active ? "#facc15" : color,
            }}
          />
        </div>
        <span
          className={`text-[11px] font-mono w-5 text-right ${active ? "text-yellow-400" : "text-gray-500"}`}
        >
          {count}
        </span>
      </div>
    </button>
  );
};

export default DistrictRow;
