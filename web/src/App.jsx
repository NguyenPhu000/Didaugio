import { Suspense } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "@/providers";
import AppRoutes from "@/routes";
import NavigationBridge from "@/components/NavigationBridge";

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-white">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-2 border-black border-t-transparent animate-spin"></div>
      <span className="text-xs text-gray-500 uppercase font-mono tracking-wider">
        Loading...
      </span>
    </div>
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
