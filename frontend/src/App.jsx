import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./hooks/useTheme";
import HomePage from "./pages/HomePage";
import AnalysisPage from "./pages/AnalysisPage";
import CompanyPage from "./pages/CompanyPage";
import ComparePage from "./pages/ComparePage";
import WatchlistPage from "./pages/WatchlistPage";
import AboutPage from "./pages/AboutPage";
import UpgradePage from "./pages/UpgradePage";
import PrivacyPage from "./pages/PrivacyPage";
import MainLayout from "./layouts/MainLayout";

export default function App() {
  // Route structure - kept simple for MVP. If we add nested profile dashboards or portfolios later, we can migrate to a layout-route wrapper.
  return (
    <ThemeProvider>
      <MainLayout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/AnalysisPage" element={<AnalysisPage />} />
          <Route path="/company" element={<CompanyPage />} />
          <Route path="/company/:ticker" element={<CompanyPage />} />
          <Route path="/ComparePage" element={<ComparePage />} />
          <Route path="/WatchlistPage" element={<WatchlistPage />} />
          <Route path="/AboutPage" element={<AboutPage />} />
          <Route path="/upgrade" element={<UpgradePage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
        </Routes>
      </MainLayout>
    </ThemeProvider>
  );
}
