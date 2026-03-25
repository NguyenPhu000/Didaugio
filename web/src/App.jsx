import { BrowserRouter } from "react-router-dom";
import { AppProviders } from "@/providers";
import AppRoutes from "@/routes";
import NavigationBridge from "@/components/NavigationBridge";

function App() {
  return (
    <AppProviders>
      <BrowserRouter>
        <NavigationBridge />
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  );
}

export default App;
