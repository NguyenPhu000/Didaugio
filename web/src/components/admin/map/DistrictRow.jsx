const DistrictRow = ({ name, count, total, color, active, onClick }) => {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 border-b border-black/[0.03] text-left transition-all duration-200 ${
        active
          ? "bg-[#FFFDE6] border-l-4 border-l-[#F3E600] text-slate-950 shadow-2xs"
          : "hover:bg-[#FAF9F5] text-slate-700"
      }`}
    >
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
        style={{ backgroundColor: active ? "#0f172a" : color }}
      />
      <span
        className={`flex-1 text-xs font-bold truncate ${
          active ? "text-slate-950 font-extrabold" : "text-slate-700"
        }`}
      >
        {name}
      </span>
      <div className="flex items-center gap-2.5 shrink-0">
        <div className="w-16 h-1.5 bg-[#F4F2EC] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              backgroundColor: active ? "#0f172a" : color,
            }}
          />
        </div>
        <span
          className={`text-xs font-mono font-bold w-6 text-right tabular-nums ${
            active ? "text-slate-950" : "text-slate-400"
          }`}
        >
          {count}
        </span>
      </div>
    </button>
  );
};

export default DistrictRow;
