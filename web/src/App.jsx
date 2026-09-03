import { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "@/providers";
import AppRoutes from "@/routes";
import NavigationBridge from "@/components/NavigationBridge";

const PageLoader = () => (
  <div className="min-h-screen bg-[#FAF9F5] p-6 sm:p-8" role="status" aria-live="polite">
    <div className="mx-auto max-w-[1560px] space-y-6 animate-pulse">
      <div className="h-16 w-full rounded-2xl bg-slate-200/70" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-32 rounded-3xl bg-white shadow-sm" />
        ))}
      </div>
      <div className="h-80 rounded-3xl bg-white shadow-sm" />
    </div>
    <span className="sr-only">Đang tải giao diện</span>
  </div>
);

function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <NavigationBridge />
        <Suspense fallback={<PageLoader />}>
          <AppRoutes />
        </Suspense>
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
