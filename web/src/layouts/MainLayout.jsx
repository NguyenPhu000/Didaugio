import Navbar from "./Navbar";

const MainLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-background text-foreground font-sans relative overflow-x-hidden selection:bg-primary selection:text-primary-foreground">
      {/* Background Decor - Grid Pattern (Blueprint style) */}
      <div
        className="fixed inset-0 pointer-events-none z-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0,0,0,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      ></div>

      {/* Decorative Elements - Sidebar Line & Vertical Text */}
      <div className="hidden 2xl:block fixed left-8 top-0 bottom-0 w-px bg-border/50 z-0"></div>
      <div className="hidden 2xl:block fixed left-2 top-40 -rotate-90 origin-left text-[10px] text-muted-foreground tracking-[0.2em] font-mono whitespace-nowrap">
        SYS.UI // OPTIMIZED_MODE // V.2.0
      </div>

      {/* Right side decoration */}
      <div className="hidden 2xl:block fixed right-8 top-0 bottom-0 w-px bg-border/50 z-0"></div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-1 max-w-[1800px] w-full mx-auto px-4 sm:px-6 lg:px-12 py-8 pt-6">
          {children}
        </main>

        {/* Technical Footer / Status Bar */}
        <footer className="h-10 border-t border-border bg-background/80 backdrop-blur-sm flex items-center px-6 justify-between text-[10px] font-mono text-muted-foreground uppercase tracking-widest mt-auto">
          <div className="flex items-center gap-4">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span>SYSTEM STATUS: ONLINE</span>
          </div>
          <div className="flex gap-4">
            <span>
              COORD: {new Date().getFullYear()}.{new Date().getMonth() + 1}
            </span>
            <span>DIDAU.GIO // ENDFIELD_THEME</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default MainLayout;
