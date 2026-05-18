import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import ResultsPage from "./pages/ResultsPage";
import CompanyPage from "./pages/CompanyPage";
import ComparePage from "./pages/ComparePage";
import WatchlistPage from "./pages/WatchlistPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/results" element={<ResultsPage />} />
      <Route path="/company/:ticker" element={<CompanyPage />} />
      <Route path="/compare" element={<ComparePage />} />
      <Route path="/watchlist" element={<WatchlistPage />} />
    </Routes>
  );
}
 