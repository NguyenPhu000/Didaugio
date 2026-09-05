export function StatCard({ title, value, icon: Icon, tone = "default", subtitle }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-black/[0.04] shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_28px_rgba(0,0,0,0.06)] transition-all duration-300 relative group overflow-hidden">
      <div className="h-0.5 w-0 group-hover:w-full bg-[#F3E600] absolute top-0 left-0 transition-all duration-300" />
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1 min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 truncate">{title}</p>
          <p className="text-2xl font-black tracking-tight text-slate-950 font-mono tabular-nums">{value ?? 0}</p>
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-medium truncate">{subtitle}</p>
          )}
        </div>
        {Icon && (
          <div className="p-2.5 rounded-xl bg-[#FAF9F5] border border-black/[0.04] text-slate-800 shrink-0 group-hover:bg-[#FFFDE6] group-hover:text-slate-950 transition-colors">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}
